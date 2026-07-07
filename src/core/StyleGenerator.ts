import { ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { PALETTES, CF_FOLDER_CLOSED } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, safeEscape, parseCustomPalette, hashString } from '../common/utils';
import * as obsidian from 'obsidian';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { TagColorSync } from '../integrations/TagColorSync';


export class StyleGenerator {
    plugin: IColorfulFoldersPlugin;
    settings: ColorfulFoldersSettings;
    app: obsidian.App;

    // PERF FIX 3: Cache for the counter SVG template.
    // The static SVG structure is pre-encoded once per unique color.
    // Only the two count numbers are substituted per folder, saving
    // encodeURIComponent() + regex replacements from running per-folder per-render.
    private _counterSvgColor = '';
    private _counterSvgPrefix = '';
    private _counterSvgMid = '';
    private _counterSvgSuffix = '';

    private _cachedPalette: { rgb: string, hex: string }[] | null = null;
    private _cachedPaletteKey = '';

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.settings = plugin.settings;
        this.app = plugin.app;

        if (!this.plugin.heatmapCache) {
            this.plugin.heatmapCache = new Map<string, number>();
        }
    }
    getCurrentPalette(): { rgb: string, hex: string }[] {
        const isDark = this.isDarkMode();
        const key = `${this.settings.palette}_${this.settings.customPalette}_${isDark}`;
        if (this._cachedPalette && this._cachedPaletteKey === key) {
            return this._cachedPalette;
        }

        let currentPalette = PALETTES[this.settings.palette] || PALETTES["Muted Dark Mode"];
        if (this.settings.palette === "Custom") {
            const custom = parseCustomPalette(this.settings.customPalette);
            if (custom) currentPalette = custom;
        }

        if (!isDark) {
            this._cachedPalette = currentPalette.map(c => {
                const darker = adjustBrightnessRgb(c.rgb, -0.15);
                const p = darker.split(',').map(s => parseInt(s.trim()));
                const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
                return { rgb: darker, hex: hex };
            });
        } else {
            this._cachedPalette = currentPalette;
        }
        this._cachedPaletteKey = key;
        return this._cachedPalette;
    }

    isDarkMode() {
        return (activeDocument.body.classList.contains('theme-dark'));
    }

    public static getAutoContrastColor(rgbStr: string): string {
        if (!rgbStr) return "var(--text-normal)";
        const parts = rgbStr.split(',').map(p => parseInt(p.trim()));
        if (parts.length < 3 || parts.some(isNaN)) return "var(--text-normal)";
        const luminance = 0.299 * parts[0] + 0.587 * parts[1] + 0.114 * parts[2];
        return luminance > 128 ? "#000000" : "#ffffff";
    }

    public static resolveColor(
        path: string,
        name: string,
        isFile: boolean,
        depth: number,
        validIndex: number,
        rootIndex: number,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        passedColor: { rgb: string, hex: string } | null,
        colorMode: string,
        cycleOffset: number,
        palette: { rgb: string, hex: string }[],
        heatmapMtime: number,
        globalBackgroundColor: string,
        autoColorFiles: boolean,
        isNNActive: boolean
    ): { rgb: string, hex: string } {
        const getFolderColor = (vIdx: number, d: number, rIdx: number) => {
            if (colorMode === "heatmap") {
                if (!heatmapMtime) return palette[palette.length - 1];
                const diffDays = (Date.now() - heatmapMtime) / (1000 * 60 * 60 * 24);
                if (diffDays <= 1) return palette[0];
                if (diffDays <= 3) return palette[Math.min(2, palette.length - 1)];
                if (diffDays <= 7) return palette[Math.min(7, palette.length - 1)];
                if (diffDays <= 15) return palette[Math.min(4, palette.length - 1)];
                if (diffDays <= 30) return palette[Math.min(10, palette.length - 1)];
                return palette[palette.length - 1];
            } else if (colorMode === "monochromatic") {
                if (d === 0) return palette[vIdx % palette.length];
                return palette[rIdx % palette.length];
            } else {
                return palette[(vIdx + d + rIdx + cycleOffset) % palette.length];
            }
        };

        if (customStyle && customStyle.hex) {
            const cp = parseCustomPalette(customStyle.hex);
            const rgb = hexToRgbObj(customStyle.hex);
            return cp
                ? cp[0]
                : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: customStyle.hex } : palette[0]);
        } else if (inheritedStyle && inheritedStyle.applyToSubfolders && !isFile && passedColor) {
            return passedColor;
        } else if (inheritedStyle && inheritedStyle.applyToSubfolders && !isFile && inheritedStyle.hex) {
            const cp = parseCustomPalette(inheritedStyle.hex);
            const rgb = hexToRgbObj(inheritedStyle.hex);
            return cp
                ? cp[0]
                : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: inheritedStyle.hex } : palette[0]);
        } else if (isFile) {
            const parentColor = passedColor || (depth > 0 ? getFolderColor(0, depth - 1, rootIndex) : null);
            if (inheritedStyle && inheritedStyle.applyToFiles && parentColor) {
                const hObj = hexToRgbObj(inheritedStyle.hex || parentColor.hex) || { r: 235, g: 111, b: 146 };
                const nameHash = hashString(name);
                const offset = ((nameHash % 5) - 2) * 5;
                return {
                    rgb: `${Math.max(0, Math.min(255, hObj.r + offset))}, ${Math.max(0, Math.min(255, hObj.g + offset))}, ${Math.max(0, Math.min(255, hObj.b + offset))}`,
                    hex: inheritedStyle.hex || parentColor.hex,
                };
            } else if (autoColorFiles || isNNActive) {
                const nameHash = hashString(name);
                return palette[(validIndex + nameHash + cycleOffset) % palette.length];
            } else {
                const gHex = globalBackgroundColor || "";
                const gRgb = hexToRgbObj(gHex);
                return parentColor || (gRgb ? { rgb: `${gRgb.r}, ${gRgb.g}, ${gRgb.b}`, hex: gHex } : { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" });
            }
        } else {
            return getFolderColor(validIndex, depth, rootIndex);
        }
    }

    public static resolveOpacity(
        isFile: boolean,
        depth: number,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        fileBackgroundOpacity: number | undefined,
        rootOpacity: number | undefined,
        subfolderOpacity: number | undefined,
        rootStyle: string,
        autoColorFiles: boolean,
        isNNActive: boolean,
        isDark: boolean
    ): number {
        if (customStyle && customStyle.opacity !== undefined) {
            return customStyle.opacity;
        } else if (isFile) {
            const isAutoOn = autoColorFiles || isNNActive;
            const baseOpacity = fileBackgroundOpacity !== undefined
                ? fileBackgroundOpacity
                : (isDark ? 0.1 : 0.15);

            if (inheritedStyle && inheritedStyle.applyToFiles) {
                // If autoColorFiles is enabled, inherit background color (1 shade lighter)
                if (autoColorFiles) {
                    return Math.max(0.04, baseOpacity * 0.65);
                } else {
                    return 0.0;
                }
            } else if (isAutoOn) {
                return baseOpacity;
            } else {
                return 0.0;
            }
        } else if (depth === 0) {
            if (rootStyle === "solid") {
                return 1.0;
            } else {
                return rootOpacity !== undefined
                    ? rootOpacity
                    : 0.548;
            }
        } else {
            // color-mix() handles visual hierarchy now; return subfolderOpacity as a flat value
            // used only for rgba-based active/hover highlights, not folder title backgrounds
            return subfolderOpacity !== undefined ? subfolderOpacity : 0.4;
        }
    }

    public static resolveTextColor(
        isFile: boolean,
        depth: number,
        colorHex: string,
        colorRgb: string,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        isDark: boolean,
        brightnessAmount: number,
        rootStyle: string,
        outlineOnly: boolean,
        shouldColor: boolean
    ): string {
        const effectiveTextColor = customStyle?.textColor || 
            (!isFile ? inheritedStyle?.textColor : (inheritedStyle?.applyToFiles ? inheritedStyle?.textColor : null)) || 
            null;
        if (effectiveTextColor) return effectiveTextColor;

        if (shouldColor) {
            const contrastColor = isDark ? "#ffffff" : "#111111";

            if (!isFile && depth === 0 && rootStyle === "solid" && !outlineOnly) {
                return contrastColor;
            }

            const adjust = isDark
                ? Math.max(brightnessAmount, 0)
                : brightnessAmount === 0
                    ? -0.5
                    : brightnessAmount;

            return isDark && adjust === 0
                ? colorHex
                : `rgb(${adjustBrightnessRgb(colorRgb, adjust)})`;
        }
        return "var(--text-normal)";
    }

    private prepareContext(): StyleContext | null {
        const root = this.app.vault.getRoot();
        if (!root) return null;

        const isDark = this.isDarkMode();
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;

        const iconScale = this.settings.iconScale || 1.0;
        const wideScale = this.settings.wideAutoIcons ? 1.05 : 1.0;
        const folderIconW = `calc(1.3em * ${iconScale * wideScale})`;
        const effFileIconW = `calc(1.3em * ${iconScale * wideScale})`;
        const nnIconScale = this.settings.notebookNavigatorIconScale ?? 0.8;
        const nnIconW = `calc(1.1em * ${nnIconScale * wideScale})`;

        const currentPalette = this.getCurrentPalette();

        const excludeFolders = this.settings.exclusionList
            .split(',')
            .map((s: string) => s.trim().toLowerCase())
            .filter((s: string) => s.length > 0);

        return {
            isDark,
            brightnessAmount,
            currentPalette,
            heatmapData: this.calculateHeatmapData(),
            excludeFolders,
            effFileIconW,
            folderIconW,
            nnIconW,
            now: Date.now()
        };
    }

    private calculateHeatmapData(): Map<string, number> {
        let heatmapData: Map<string, number> = new Map();
        if (this.settings.colorMode === "heatmap") {
            if (this.plugin.heatmapCache && this.plugin.heatmapCache.size > 0) {
                heatmapData = this.plugin.heatmapCache;
            } else {
                if (!this.plugin.heatmapCache) this.plugin.heatmapCache = new Map();
                heatmapData = this.plugin.heatmapCache;
                // Vault Enumeration: Used strictly to calculate folder activity for the "Heatmap" feature.
                // This builds a local cache of modification times to determine folder colors.
                const files = this.app.vault.getFiles();
                for (let i = 0, len = files.length; i < len; i++) {
                    const f = files[i];
                    let p = f.parent;
                    const mtime = f.stat.mtime;
                    while (p) {
                        if ((heatmapData.get(p.path) || 0) < mtime) {
                            heatmapData.set(p.path, mtime);
                        }
                        p = p.parent;
                    }
                }
                this.plugin.heatmapCache = heatmapData;
            }
        }
        return heatmapData;
    }
    private generateGlobalBaseCss(): string {
        return `

            /* ── NUCLEAR SPECIFICITY NAV ITEM LAYOUT ───────────────────────────────
               We use high-specificity selectors to defeat theme overrides (like Prism).
            ──────────────────────────────────────────────────────────────────────── */
            body .nav-files-container .nav-folder-title,
            body .nav-files-container .nav-file-title,
            body .nav-files-container .tree-item-self {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                overflow: visible !important;
            }

            /* Force all immediate children and pseudo-elements to perfectly center vertically */
            body .nav-files-container .nav-folder-title > *,
            body .nav-files-container .nav-file-title > *,
            body .nav-files-container .tree-item-self > *,
            body .nav-files-container .nav-folder-title:not(.nn-navitem)::before,
            body .nav-files-container .nav-file-title:not(.nn-file)::before,
            body .nav-files-container .tree-item-self:not(.nn-file):not(.nn-navitem)::before,
            body .nav-files-container .nav-folder-title::after,
            body .nav-files-container .nav-file-title::after,
            body .nav-files-container .tree-item-self::after {
                align-self: center !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
            }

            body .nav-files-container .nav-folder-collapse-indicator,
            body .nav-files-container .tree-item-collapse-indicator {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                height: auto !important;
            }

            /* ── CONTENT ELEMENT: always flex row, icon or not ───────────────── */
            body .nav-files-container .nav-folder-title-content,
            body .nav-files-container .nav-file-title-content,
            body .nav-files-container .tree-item-inner {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 6px !important;
                margin-left: 2px !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                min-width: 0 !important;
                flex-grow: 1 !important;
            }

            /* ── ICON ACTIVE: suppress native pseudo-elements ─────────────────── */
            .cf-icon-active::before {
                display: none !important;
                content: none !important;
                width: 0 !important;
                height: 0 !important;
            }
            .cf-icon-active > svg:not(.cf-icon-wrapper svg),
            .cf-icon-active > .nav-folder-icon,
            .cf-icon-active > .nav-file-icon {
                display: none !important;
            }

            .cf-icon-wrapper {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                align-self: center !important;
                flex-shrink: 0 !important;
                overflow: visible !important;
            }

            /* ── METADATA WRAPPING RULES (FILES WITH WORD COUNT ONLY) ─────────── */
            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]),
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title),
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]),
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) {
                flex-wrap: wrap !important;
                align-items: flex-start !important;
                height: auto !important;
                max-height: none !important;
                min-height: 30px !important;
                padding-top: 6px !important;
                padding-bottom: 6px !important;
                position: relative !important;
            }

            /* First-line items (indicator, icons) top-align to align with the first-line text */
            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) > *:not(::after),
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) > *:not(::after),
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) > *:not(::after),
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) > *:not(::after) {
                align-self: flex-start !important;
                margin-top: 2px !important;
            }

            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .cf-icon-wrapper,
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .cf-icon-wrapper,
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .cf-icon-wrapper,
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .cf-icon-wrapper {
                align-self: flex-start !important;
                margin-top: 2px !important;
            }

            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-title-content,
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-inner,
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-title-content,
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-inner {
                margin-top: 0 !important;
                align-self: flex-start !important;
            }

            /* Force only the ::after pseudo-element (which holds the counts) to wrap to the next line */
            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "])::after,
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title)::after,
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "])::after,
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title)::after {
                width: 100% !important;
                flex: 0 0 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                font-size: 0.85em !important;
                opacity: 0.85 !important;
                box-sizing: border-box !important;
                margin-top: 4px !important;
                padding-left: 0px !important;
                background-position: 0px center !important;
            }

            /* Position file tags and flairs on the top right so they never wrap or stretch */
            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .tree-item-flair,
            body.cf-wrap-metadata .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-tag,
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-flair,
            body.cf-wrap-metadata .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .nav-file-tag,
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .tree-item-flair,
            body.is-mobile .nav-files-container .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-tag,
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-flair,
            body.is-mobile .nav-files-container .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .nav-file-tag {
                position: absolute !important;
                right: 14px !important;
                top: 6px !important;
                margin: 0 !important;
                height: 18px !important;
                line-height: 18px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
        `;
    }



    getStyle(path: string): FolderStyle | null {
        const style = this.settings.customFolderColors[path];
        if (!style) return null;
        if (typeof style === 'string') return { hex: style };
        return style;
    }

    private countItems(folderItem: obsidian.TFolder): { files: number, folders: number } {
        if (!this.plugin.folderCountCache) {
            this.plugin.folderCountCache = new Map<string, { files: number, folders: number }>();
        }
        const countCache = this.plugin.folderCountCache;
        const cached = countCache.get(folderItem.path);
        if (cached) return cached;

        let files = 0;
        let folders = 0;
        if (folderItem.children) {
            for (const child of folderItem.children) {
                if (child instanceof obsidian.TFile) files++;
                else if (child instanceof obsidian.TFolder) folders++;
            }
        }
        const res = { files, folders };
        countCache.set(folderItem.path, res);
        return res;
    }

    private generateDividerCss(): string {
        if (!(this.settings.showFileDivider || Object.values(this.settings.customFolderColors).some((v) => typeof v === 'object' && v !== null && (v).hasDivider))) {
            return "";
        }

        const spacing = this.settings.dividerSpacing || 16;
        const dividerHeight = (spacing * 2) + 20;

        return `
            /* Stability: Core Divider Container - Now Layout Neutral */
            .cf-interactive-divider {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: ${dividerHeight}px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                user-select: none !important;
                z-index: 5 !important;
                padding: 0 !important;
                margin: 0 !important;
                pointer-events: all !important;
            }

            /* Parent item reserves the space for the absolute divider */
            .cf-has-divider {
                position: relative !important;
                padding-top: ${dividerHeight}px !important;
                display: flex !important;
                flex-direction: column !important;
            }

            /* Ensure folder lines/children start below the divider */
            .cf-has-divider > .nav-folder-title,
            .cf-has-divider > .nav-folder-children {
                position: relative !important;
            }

            .cf-interactive-divider:hover {
                filter: brightness(1.12);
            }
            .cf-interactive-divider:hover .cf-divider-chip {
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                border-color: rgba(var(--mono-rgb-100), 0.3) !important;
            }
            
            .cf-divider-chip {
                display: flex !important;
                align-items: center !important;
                padding: ${this.settings.dividerPillMode ? '6px 20px' : '2px 6px'} !important;
                font-size: var(--cf-divider-font-size, 10.5px) !important;
                font-weight: var(--cf-divider-font-weight, 800) !important;
                letter-spacing: var(--cf-divider-letter-spacing, 0.15em) !important;
                text-transform: var(--cf-divider-text-transform, uppercase) !important;
                white-space: nowrap !important;
                border-radius: 40px !important;
                width: fit-content !important;
                max-width: 85% !important;
                gap: 0 !important;
                ${this.settings.dividerPillMode ? `
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(var(--mono-rgb-100), 0.15);
                ` : `
                    box-shadow: none;
                    border: none;
                    background: transparent;
                `}
                z-index: 6 !important;
            }

            .cf-divider-emoji-icon {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 24px !important;
                font-size: 1.2em !important;
            }

            .cf-divider-icon {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 24px !important;
            }

            .cf-divider-label {
                display: block !important;
                margin: 0 12px !important;
                transform: translateX(0.075em) !important;
            }
            
            .cf-interactive-divider.is-collapsed .cf-divider-chip {
                opacity: 0.6 !important;
            }

            .cf-divider-collapse-indicator {
                display: flex !important;
                align-items: center !important;
                opacity: 0.6 !important;
                margin-left: 10px !important;
            }
            .cf-interactive-divider.is-collapsed .cf-divider-collapse-indicator {
                transform: rotate(-90deg);
            }
            
            .cf-divider-bridge {
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
                gap: 0px !important;
            }
            
            .cf-divider-line {
                z-index: 4 !important;
                pointer-events: none !important;
            }
            
            .cf-divider-hidden {
                display: none !important;
            }

            /* Fix for folder vertical lines */
            .cf-has-divider > .nav-folder-children {
                border-left: none !important;
            }

            /* Premium Smart Suggester (Glassmorphism) */
            .cf-suggestion-container {
                background: rgba(25, 25, 25, 0.75) !important;
                backdrop-filter: blur(24px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                border-radius: 12px !important;
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5) !important;
                overflow: hidden !important;
                min-width: 280px !important;
                animation: cf-suggestion-reveal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes cf-suggestion-reveal {
                from { opacity: 0; transform: translateY(8px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .cf-suggestion {
                display: flex !important;
                flex-direction: column !important;
                padding: 6px !important;
            }

            .cf-suggestion-item {
                display: flex !important;
                align-items: center !important;
                padding: 10px 14px !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                color: var(--text-normal) !important;
                font-size: 0.9em !important;
                transition: all 0.2s ease !important;
                gap: 10px !important;
            }

            .cf-suggestion-item:hover {
                background: rgba(255, 255, 255, 0.08) !important;
            }

            .cf-suggestion-item.is-selected {
                background: var(--interactive-accent) !important;
                color: white !important;
                box-shadow: 0 4px 12px rgba(var(--interactive-accent-rgb), 0.3) !important;
            }

            .cf-suggestion-content {
                flex: 1 !important;
                font-weight: 500 !important;
            }
        `;
    }

    private traverse(folder: obsidian.TFolder, depth: number, validIndex: number, rootIndex: number, passedColor: { rgb: string, hex: string } | null, inheritedStyle: FolderStyle | null, context: StyleContext, cssRules: string[]) {
        const copyFolders = folder.children
            .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
            .sort((a, b) => a.name.localeCompare(b.name));

        const copyFiles = folder.children
            .filter((c): c is obsidian.TFile => c instanceof obsidian.TFile)
            .sort((a, b) => a.name.localeCompare(b.name));

        const currentPalette = context.currentPalette;
        const isDark = context.isDark;
        const heatmapData = context.heatmapData;
        const excludeFolders = context.excludeFolders;
        const effFileIconW = context.effFileIconW;
        const folderIconW = context.folderIconW;
        
        const useGlass = this.settings.glassmorphism;
        const glassCss = useGlass ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';
        const cycleOff = this.settings.cycleOffset || 0;
        const outlineOnly = this.settings.outlineOnly;
        const nnFileBgActive = NotebookNavigatorIntegration.showFileBg(this.settings);
        const tintOp = this.settings.tintOpacity;
        const autoColorFiles = this.settings.autoColorFiles;
        const autoIcons = this.settings.autoIcons;
        const baseThick = this.settings.pathLineThickness ?? 2.0;
        const folderThick = baseThick + 0.5;
        const activeFolderThick = baseThick + 2.0;
        const CF_FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; opacity: 0.85;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

        // Process Files
        // Gate: process files if there's a parent color (applyToSubfolders), autoColorFiles, autoIcons, applyToFiles on the inheritedStyle, or NN is active.
        if (passedColor || autoColorFiles || autoIcons || (inheritedStyle && inheritedStyle.applyToFiles) || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {
            for (const child of copyFiles) {
                const safePath = safeEscape(child.path);
                const fileStyle = this.getStyle(child.path);
                const color = StyleGenerator.resolveColor(
                    child.path,
                    child.name,
                    true,
                    depth,
                    validIndex,
                    0,
                    fileStyle,
                    inheritedStyle,
                    passedColor,
                    this.settings.colorMode,
                    cycleOff,
                    currentPalette,
                    child.stat.mtime,
                    this.settings.globalBackgroundColor || "",
                    this.settings.autoColorFiles,
                    this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground
                );

                // isCustomOrInherited: true when file has a custom style, or a parent explicitly set applyToFiles
                const isCustomOrInherited = !!(fileStyle && fileStyle.hex) || (!!(inheritedStyle && inheritedStyle.applyToFiles) && this.settings.autoColorFiles);
                const shouldColorNative = isCustomOrInherited || this.settings.autoColorFiles || !!this.settings.globalBackgroundColor;
                const shouldColorNN = isCustomOrInherited || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground);

                const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);
                const iconColor = fileStyle?.iconColor || (inheritedStyle?.applyToFiles && inheritedStyle.iconColor) || null;
                
                const op = StyleGenerator.resolveOpacity(
                    true,
                    depth,
                    fileStyle,
                    inheritedStyle,
                    this.settings.fileBackgroundOpacity,
                    this.settings.rootOpacity,
                    this.settings.subfolderOpacity,
                    this.settings.rootStyle,
                    this.settings.autoColorFiles,
                    this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground,
                    isDark
                );

                const autoIconFile = (this.settings.autoIcons && !fileStyle?.iconId && !(inheritedStyle?.applyToFiles && inheritedStyle?.iconId)) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
                const iconId = fileStyle?.iconId || (inheritedStyle?.applyToFiles ? inheritedStyle.iconId : null) || (autoIconFile ? (this.settings.wideAutoIcons ? autoIconFile.lucide : autoIconFile.emoji) : "");

                const textNative = StyleGenerator.resolveTextColor(
                    true,
                    depth,
                    color.hex,
                    color.rgb,
                    fileStyle,
                    inheritedStyle,
                    isDark,
                    context.brightnessAmount,
                    this.settings.rootStyle,
                    outlineOnly,
                    true
                );

                const textNN = StyleGenerator.resolveTextColor(
                    true,
                    depth,
                    color.hex,
                    color.rgb,
                    fileStyle,
                    inheritedStyle,
                    isDark,
                    context.brightnessAmount,
                    this.settings.rootStyle,
                    outlineOnly,
                    true
                );

                const isBold = fileStyle?.isBold !== undefined ? fileStyle.isBold : (inheritedStyle?.applyToFiles ? inheritedStyle.isBold : false);
                const isItalic = fileStyle?.isItalic !== undefined ? fileStyle.isItalic : (inheritedStyle?.applyToFiles ? inheritedStyle.isItalic : false);

                const fileBgAlpha = op;
                
                const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
                const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : textNative;
                
                let fileRowCss = `
                    ${shouldColorNative ? `
                        background-color: var(--cf-file-bg, rgba(${color.rgb}, ${fileBgAlpha})) !important;
                        border-left: ${baseThick}px solid rgba(${color.rgb}, 0.4) !important;
                        --cf-selection-bg: rgba(${color.rgb}, ${Math.min(1.0, fileBgAlpha + 0.15)});
                    ` : `
                        background-color: var(--cf-file-bg, transparent) !important;
                        border-left: none !important;
                    `}
                    opacity: 1.0 !important;
                    border-radius: 4px;
                    --nav-tag-background: var(--cf-tag-bg, rgba(${color.rgb}, 0.15)) !important;
                    --nav-tag-color: var(--cf-tag-color, ${textNative}) !important;
                `;

                let fileTextCss = `
                    color: var(--cf-file-color, ${textNative}) !important;
                    font-weight: ${isBold ? '800' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;
                
                if (activeStyle && activeStyle.textGradient && activeStyle.textColor && activeStyle.textGradientEnd) {
                    const angle = 90;
                    let sC = activeStyle.textColor;
                    let eC = activeStyle.textGradientEnd;
                    const bVal = activeStyle.rainbowBrightness !== undefined ? activeStyle.rainbowBrightness : 50;
                    if (bVal !== 50) {
                        const amount = (bVal - 50) / 50;
                        const rgbS = hexToRgbObj(sC);
                        if (rgbS) sC = `rgb(${adjustBrightnessRgb(`${rgbS.r},${rgbS.g},${rgbS.b}`, amount)})`;
                        const rgbE = hexToRgbObj(eC);
                        if (rgbE) eC = `rgb(${adjustBrightnessRgb(`${rgbE.r},${rgbE.g},${rgbE.b}`, amount)})`;
                    }
                    fileTextCss = `
                        background-image: linear-gradient(${angle}deg, ${sC}, ${eC}, ${sC}) !important;
                        background-clip: text !important;
                        -webkit-background-clip: text !important;
                        color: transparent !important;
                        font-weight: ${isBold ? '800' : 'normal'} !important;
                        font-style: ${isItalic ? 'italic' : 'normal'} !important;
                    `;
                }

                cssRules.push(`
                    .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file),
                    .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) {
                        ${fileRowCss}
                    }

                    body .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content,
                    body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner {
                        ${fileTextCss}
                    }

                    [data-path="${safePath}"] .nav-file-tag,
                    [data-path="${safePath}"] .nav-folder-tag,
                    [data-path="${safePath}"] .tree-item-flair {
                        background-color: var(--cf-tag-bg, rgba(${color.rgb}, 0.15)) !important;
                        color: var(--cf-tag-color, ${textNative}) !important;
                        font-size: 10px !important;
                    }
                `);

                if (nnFileBgActive) {
                    const isEmoji = this.plugin.iconManager.isEmojiIcon(iconId);
                    const iconSvg = !isEmoji && iconId ? this.plugin.iconManager.getIconSvg(iconId, true) : "";
                    
                    cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                        child.path,
                        false,
                        color,
                        fileBgAlpha,
                        textNN,
                        iconId,
                        iconColor,
                        isEmoji,
                        iconSvg,
                        activeBg,
                        activeText,
                        isBold,
                        isItalic,
                        shouldColorNN,
                        useGlass,
                        tintOp,
                        baseThick,
                        this.settings.notebookNavigatorOutlineOnly,
                        false,
                        context.nnIconW,
                        this.settings.activeGlow !== false
                    ));
                }

                if (iconId) {
                    const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${iconId}`) &&
                        !obsidian.getIconIds?.().includes(iconId) &&
                        !(this.settings.customIcons && this.settings.customIcons[iconId]);

                    if (isCustomEmoji) {
                        cssRules.push(`
                            body .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content::before,
                            body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                                content: "${iconId} " !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                flex-shrink: 0 !important;
                                height: ${effFileIconW} !important;
                                width: ${effFileIconW} !important;
                            }
                        `);
                    } else {
                        const isManualCustom = !!(activeStyle && activeStyle.iconId);
                        if (isManualCustom) {
                            cssRules.push(`
                                body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before,
                                body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                                    display: none !important;
                                    content: none !important;
                                }
                            `);
                        } else {
                            const svgStr = this.plugin.iconManager.getIconSvg(iconId, true);
                            if (svgStr) {
                                cssRules.push(`
                                    body .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content::before,
                                    body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                                        content: '' !important;
                                        display: inline-flex !important;
                                        flex-shrink: 0 !important;
                                        width: ${effFileIconW} !important;
                                        height: ${effFileIconW} !important;
                                        background-color: ${iconColor || color.hex || textNative} !important;
                                        -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                        -webkit-mask-repeat: no-repeat !important;
                                        -webkit-mask-position: center !important;
                                        -webkit-mask-size: contain !important;
                                        opacity: 0.85 !important;
                                    }
                                `);
                            }
                        }
                    }
                } else if (autoIcons) {
                    cssRules.push(`
                        body .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content::before,
                        body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                            content: '' !important;
                            display: inline-flex !important;
                            flex-shrink: 0 !important;
                            width: ${effFileIconW} !important;
                            height: ${effFileIconW} !important;
                            background-color: ${iconColor || color.hex || textNative} !important;
                            -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FILE_TEXT_ICON))}") !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            -webkit-mask-size: contain !important;
                            opacity: 0.85 !important;
                        }
                    `);
                }

                const activeGlowEnabled = this.settings.activeGlow !== false;
                cssRules.push(`
                    .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file),
                    .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file) {
                        background-color: var(--cf-active-bg, ${activeBg}) !important;
                        color: var(--cf-active-color, ${activeText}) !important;
                        border: 1px solid ${activeGlowEnabled ? `rgba(${color.rgb}, 0.3)` : "transparent"} !important;
                        ${activeGlowEnabled ? (useGlass ? `
                            backdrop-filter: blur(12px) saturate(160%) !important;
                            -webkit-backdrop-filter: blur(12px) saturate(160%) !important;
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0,0,0,0.2) !important;
                        ` : `
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0,0,0,0.1) !important;
                        `) : (useGlass ? `
                            backdrop-filter: blur(12px) saturate(160%) !important;
                            -webkit-backdrop-filter: blur(12px) saturate(160%) !important;
                            box-shadow: none !important;
                        ` : `
                            box-shadow: none !important;
                        `)}
                    }

                    /* Notebook Navigator Active File Glow (Flat Slot) */
                    ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)}.is-active {
                        background-color: var(--cf-active-bg, ${activeBg}) !important;
                        color: var(--cf-active-color, ${activeText}) !important;
                        border-left: ${activeFolderThick}px solid var(--cf-active-color, ${activeText}) !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file)::before,
                    .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem)::before {
                        background-color: var(--cf-active-color, ${activeText}) !important;
                    }
                `);
                // Increment skipped as fileIndex is unused
            }
        }

        // Folder logic — tint is emitted per-child inside the loop below (using child's own color)

        let validFolderIndex = 0;
        for (let i = 0; i < copyFolders.length; i++) {
            const child = copyFolders[i];
            if (excludeFolders.includes(child.name.toLowerCase())) {
                this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), passedColor, inheritedStyle, context, cssRules);
                continue;
            }

            const customStyle = this.getStyle(child.path);
            const mtime = heatmapData.get(child.path) || 0;
            const color = StyleGenerator.resolveColor(
                child.path,
                child.name,
                false,
                depth,
                validFolderIndex,
                (depth === 0 ? validFolderIndex : rootIndex),
                customStyle,
                inheritedStyle,
                passedColor,
                this.settings.colorMode,
                cycleOff,
                currentPalette,
                mtime,
                "",
                false,
                false
            );

            const safePath = safeEscape(child.path);
            const op = StyleGenerator.resolveOpacity(
                false,
                depth,
                customStyle,
                inheritedStyle,
                undefined,
                this.settings.rootOpacity,
                this.settings.subfolderOpacity,
                this.settings.rootStyle,
                false,
                false,
                isDark
            );

            // color-mix() percentage: each depth level is 15% less saturated, floor at 10%
            // depth 0 = 100%, depth 1 = 85%, depth 2 = 70%, depth 3 = 55%, depth 4 = 40%, depth 5+ = clamp
            const mixPct = Math.max(10, 100 - (depth * 15));

            // Emit children container tint here, using this child's OWN resolved color
            // Uses color-mix so the tint is a solid shade, never transparent/invisible
            if (passedColor || (inheritedStyle && inheritedStyle.applyToSubfolders)) {
                const childTintColor = color; // child's own resolved color
                // Tint container uses ~8% mix — subtle solid tint, no background bleed
                const tintMixPct = 8;
                const bgTint = outlineOnly ? "transparent" : `color-mix(in srgb, ${childTintColor.hex} ${tintMixPct}%, var(--background-primary))`;

                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                    body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                        background-color: ${bgTint} !important;
                        border-left: ${folderThick}px solid rgba(${childTintColor.rgb}, 0.25) !important;
                        border-bottom: ${folderThick}px solid rgba(${childTintColor.rgb}, 0.25) !important;
                        border-radius: 4px !important;
                        border-bottom-left-radius: 8px !important;
                        padding-bottom: 4px !important;
                        margin-bottom: 4px !important;
                        overflow: visible !important;
                    }
                `);
                const childActiveSelector = `.nav-files-container .nav-folder.cf-active-parent > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) ~ .nav-folder-children, .nav-files-container .tree-item.cf-active-parent > .tree-item-self[data-path="${safePath}"]:not(.nn-navitem) ~ .tree-item-children`;
                cssRules.push(`
                    ${childActiveSelector} {
                        border-left: ${folderThick}px solid ${childTintColor.hex} !important;
                        border-bottom: ${folderThick}px solid ${childTintColor.hex} !important;
                        border-bottom-left-radius: 8px !important;
                        box-shadow: -2px 0 10px -2px ${childTintColor.hex}44;
                        margin-left: 12px !important;
                        padding-left: 0 !important;
                        --cf-rgb: ${childTintColor.rgb};
                    }

                    /* Notebook Navigator Folder Active Path (Flat-Glass) */
                    ${NotebookNavigatorIntegration.getScopedActiveNavSelector(child.path)} {
                        border-left: ${activeFolderThick}px solid ${childTintColor.hex} !important;
                        background: linear-gradient(to right, rgba(${childTintColor.rgb}, 0.25), rgba(${childTintColor.rgb}, 0.05)) !important;
                    }
                `);
            }

            // Pre-calculate folder icons to avoid warnings
            const autoIconFolder = (this.settings.autoIcons && !customStyle?.iconId && !inheritedStyle?.iconId) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
            const folderIconId = customStyle?.iconId || inheritedStyle?.iconId || (autoIconFolder ? (this.settings.wideAutoIcons ? autoIconFolder.lucide : autoIconFolder.emoji) : "");

            const folderStyles = {
                // Use color-mix for progressive depth shading: solid hierarchy, no transparency bleed
                b: outlineOnly ? "transparent" : (depth === 0 && this.settings.rootStyle === "solid" ? color.hex : `color-mix(in srgb, ${color.hex} ${mixPct}%, var(--background-primary))`),
                t: StyleGenerator.resolveTextColor(
                    false,
                    depth,
                    color.hex,
                    color.rgb,
                    customStyle,
                    inheritedStyle,
                    isDark,
                    context.brightnessAmount,
                    this.settings.rootStyle,
                    outlineOnly,
                    true
                )
            };

            const isBold = customStyle?.isBold !== undefined ? customStyle.isBold : (inheritedStyle?.isBold !== undefined ? inheritedStyle.isBold : true);
            const isItalic = customStyle?.isItalic !== undefined ? customStyle.isItalic : (inheritedStyle?.isItalic !== undefined ? inheritedStyle.isItalic : false);

            let isUsingGradient = false;
            let startCol = "";
            let endCol = "";
            let gradAngle = 90;
            let gradWeight = isBold ? '800' : 'normal';

            if (customStyle?.textGradient && customStyle?.textColor && customStyle?.textGradientEnd) {
                isUsingGradient = true;
                let sC = customStyle.textColor;
                let eC = customStyle.textGradientEnd;
                const bVal = customStyle.rainbowBrightness !== undefined ? customStyle.rainbowBrightness : 50;
                if (bVal !== 50) {
                    const amount = (bVal - 50) / 50;
                    const rgbS = hexToRgbObj(sC);
                    if (rgbS) sC = `rgb(${adjustBrightnessRgb(`${rgbS.r},${rgbS.g},${rgbS.b}`, amount)})`;
                    const rgbE = hexToRgbObj(eC);
                    if (rgbE) eC = `rgb(${adjustBrightnessRgb(`${rgbE.r},${rgbE.g},${rgbE.b}`, amount)})`;
                }
                startCol = sC;
                endCol = eC;
            } else if (this.settings.rainbowRootText && depth === 0 && !customStyle?.textColor) {
                isUsingGradient = true;
                const rainbowOpacity = 1.0;
                
                const nextColor = currentPalette[(i + 1) % currentPalette.length];
                startCol = color.hex;
                endCol = nextColor.hex;
                
                // Convert hex to rgb string for rgba opacity mix
                if (startCol.startsWith("#")) {
                    const rgb = hexToRgbObj(startCol);
                    if (rgb) startCol = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rainbowOpacity})`;
                }
                if (endCol.startsWith("#")) {
                    const rgb = hexToRgbObj(endCol);
                    if (rgb) endCol = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rainbowOpacity})`;
                }

                gradAngle = 90;
                gradWeight = "800"; // hardcoded thick default
            }

            let textCss = `
                color: var(--cf-folder-color, ${folderStyles.t}) !important;
                font-weight: ${isBold ? '800' : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
            `;

            if (isUsingGradient) {
                textCss = `
                    background-image: linear-gradient(${gradAngle}deg, ${startCol}, ${endCol}, ${startCol}) !important;
                    background-clip: text !important;
                    -webkit-background-clip: text !important;
                    color: transparent !important;
                    font-weight: ${gradWeight} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;
            }

            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : folderStyles.t;

            cssRules.push(`
                .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem),
                .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file) {
                    background-color: var(--cf-folder-bg, ${folderStyles.b}) !important;
                    --cf-selection-bg: rgba(${color.rgb}, ${Math.min(1.0, op + 0.15)});
                    opacity: 1.0 !important;
                    border-radius: 6px;
                    ${glassCss}
                }
            `);

            if (this.settings.childItemLegibility === "inherit") {
                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children .nav-folder-title:not(.is-active) .nav-folder-title-content,
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children .nav-file-title:not(.is-active) .nav-file-title-content,
                    body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children .tree-item-self:not(.is-active) .tree-item-inner {
                        color: ${folderStyles.t} !important;
                    }
                `);
            } else if (this.settings.childItemLegibility === "auto-contrast" && !outlineOnly) {
                const contrastColor = StyleGenerator.getAutoContrastColor(color.rgb);
                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children .nav-folder-title:not(.is-active) .nav-folder-title-content,
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children .nav-file-title:not(.is-active) .nav-file-title-content,
                    body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children .tree-item-self:not(.is-active) .tree-item-inner {
                        color: ${contrastColor} !important;
                    }
                `);
            }

            /* Notebook Navigator Folder Integration (Native-Bridge Architecture) */
            
            const isEmoji = this.plugin.iconManager.isEmojiIcon(folderIconId);
            const iconSvg = !isEmoji && folderIconId ? this.plugin.iconManager.getIconSvg(folderIconId, true) : "";

            cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                child.path,
                true,
                color,
                op,
                folderStyles.t,
                folderIconId,
                customStyle?.iconColor || null,
                isEmoji,
                iconSvg,
                activeBg,
                activeText,
                isBold,
                isItalic,
                true,
                useGlass,
                tintOp,
                baseThick,
                this.settings.notebookNavigatorOutlineOnly,
                false, /* useRadiantPath is now managed via cf-active-parent statically */
                context.nnIconW,
                this.settings.activeGlow !== false
            ));

            cssRules.push(`
                body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content,
                body .tree-item-self[data-path="${safePath}"] .tree-item-inner,
                body ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()} {
                    ${textCss}
                }
            `);

            if (folderIconId) {
                const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${folderIconId}`) &&
                    !obsidian.getIconIds?.().includes(folderIconId) &&
                    !(this.settings.customIcons && this.settings.customIcons[folderIconId]);

                if (isCustomEmoji) {
                    cssRules.push(`
                        body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before,
                        body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                            content: "${folderIconId} " !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            flex-shrink: 0 !important;
                        }
                    `);
                } else {
                    const isManualCustom = !!(customStyle && customStyle.iconId);
                    if (isManualCustom) {
                        cssRules.push(`
                            body .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before,
                            body .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                                display: none !important;
                                content: none !important;
                            }
                        `);
                    } else {
                        const svgStr = this.plugin.iconManager.getIconSvg(folderIconId, true);
                        if (svgStr) {
                            cssRules.push(`
                                body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before,
                                body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                                    content: '' !important;
                                    display: inline-flex !important;
                                    flex-shrink: 0 !important;
                                    width: ${folderIconW} !important;
                                    height: ${folderIconW} !important;
                                    background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                                    -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                }
                            `);
                        }
                    }
                }
            } else if (autoIcons) {
                cssRules.push(`
                    body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before,
                    body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before {
                        content: '' !important;
                        display: inline-flex !important;
                        flex-shrink: 0 !important;
                        width: ${folderIconW} !important;
                        height: ${folderIconW} !important;
                        background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                        -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FOLDER_CLOSED))}") !important;
                        -webkit-mask-repeat: no-repeat !important;
                        -webkit-mask-position: center !important;
                        -webkit-mask-size: contain !important;
                    }
                `);
            }

            if (this.settings.showItemCounters) {
                const counts = this.countItems(child);
                const totalWidth = 80;

                // PERF FIX 3: Rebuild the static SVG template only when color changes.
                // For large vaults, this avoids O(N) encodeURIComponent + regex calls
                // per render cycle, replacing them with O(1) string concatenation.
                if (color.hex !== this._counterSvgColor) {
                    this._counterSvgColor = color.hex;
                    const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20" preserveAspectRatio="xMidYMid meet"><g stroke="${color.hex}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 3) scale(0.65)"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></g><text x="21" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">`;
                    const svgMid = `</text><g stroke="${color.hex}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(42, 3) scale(0.65)"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"/><path d="M15 2v5h5"/><path d="M2 17.6V7.1c0-.4.2-.8.5-1.1.3-.3.7-.5 1.1-.5h3.3"/><path d="M13 22H3.6c-.4 0-.8-.2-1.1-.5-.3-.3-.5-.7-.5-1.1V10"/></g><text x="60" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">`;
                    const svgClose = `</text></svg>`;
                    // Pre-encode the three static sections; only the count values need runtime concatenation
                    this._counterSvgPrefix = encodeURIComponent(svgOpen);
                    this._counterSvgMid = encodeURIComponent(svgMid);
                    this._counterSvgSuffix = encodeURIComponent(svgClose);
                }

                const combinedIconUrl = `url("data:image/svg+xml,${this._counterSvgPrefix}${counts.folders}${this._counterSvgMid}${counts.files}${this._counterSvgSuffix}")`;

                cssRules.push(`
                    body .nav-files-container .nav-folder-title[data-path="${safePath}"]::after,
                    body .nav-files-container .tree-item-self[data-path="${safePath}"]::after {
                        content: "" !important;
                        background-image: ${combinedIconUrl} !important;
                        background-repeat: no-repeat !important;
                        background-position: center right !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        vertical-align: middle !important;
                        width: ${totalWidth}px !important;
                        min-width: ${totalWidth}px !important;
                        height: 20px !important;
                        margin-left: auto !important;
                        flex-shrink: 0 !important;
                        pointer-events: none !important;
                        opacity: 0.8 !important;
                    }
                `);
            }

            // Pass customStyle into the next level if applyToSubfolders OR applyToFiles is set.
            // - applyToSubfolders: files AND sub-folders in child will inherit
            // - applyToFiles only: files in the IMMEDIATE child folder inherit, but sub-subfolders do NOT (handled below)
            const nextInherited = (customStyle?.applyToSubfolders || customStyle?.applyToFiles)
                ? customStyle
                : (inheritedStyle?.applyToSubfolders ? inheritedStyle : null);
            this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), color, nextInherited, context, cssRules);
            validFolderIndex++;
        }
    }

    generateCss(): string {
        const context = this.prepareContext();
        if (!context) return "";

        const cssRules: string[] = [];
        cssRules.push(this.generateGlobalBaseCss());



        const baseThick = this.settings.pathLineThickness ?? 2.0;



        cssRules.push(this.generateDividerCss());

        const root = this.app.vault.getRoot();
        
        // Support for styling the vault root in Notebook Navigator
        const rootStyle = this.getStyle(root.path) || this.getStyle("/");
        if (rootStyle && this.settings.notebookNavigatorSupport) {
            const palette = this.settings.palette ? PALETTES[this.settings.palette] || Object.values(PALETTES)[0] : Object.values(PALETTES)[0];
            const rObj = rootStyle.hex ? hexToRgbObj(rootStyle.hex) : null;
            const rootColor = rObj ? { rgb: `${rObj.r},${rObj.g},${rObj.b}`, hex: rootStyle.hex } : palette[0];
            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${rootColor.rgb}, 0.14)`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : (rootStyle.textColor || rootColor.hex);
            const rootIconId = rootStyle.iconId || "";

            const isEmoji = this.plugin.iconManager.isEmojiIcon(rootIconId);
            const iconSvg = !isEmoji && rootIconId ? this.plugin.iconManager.getIconSvg(rootIconId, true) : "";

            cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                root.path,
                true,
                rootColor,
                rootStyle.opacity ?? 0.8,
                rootStyle.textColor || rootColor.hex,
                rootIconId,
                rootStyle.iconColor || null,
                isEmoji,
                iconSvg,
                activeBg,
                activeText,
                !!rootStyle.isBold,
                !!rootStyle.isItalic,
                true,
                this.settings.glassmorphism,
                0,
                baseThick,
                this.settings.notebookNavigatorOutlineOnly,
                true,
                context.nnIconW,
                this.settings.activeGlow !== false
            ));
            // Also handle potential empty path/slash variants
            if (root.path !== "/") {
                 cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                    "/",
                    true,
                    rootColor,
                    rootStyle.opacity ?? 0.8,
                    rootStyle.textColor || rootColor.hex,
                    rootIconId,
                    rootStyle.iconColor || null,
                    isEmoji,
                    iconSvg,
                    activeBg,
                    activeText,
                    !!rootStyle.isBold,
                    !!rootStyle.isItalic,
                    true,
                    this.settings.glassmorphism,
                    0,
                    baseThick,
                    this.settings.notebookNavigatorOutlineOnly,
                    true,
                    context.nnIconW,
                    this.settings.activeGlow !== false
                ));
            }
        }

        this.traverse(root, 0, 0, 0, null, null, context, cssRules);

        cssRules.push(this.generateStealthCss());
        cssRules.push(TagColorSync.generateCss(this.plugin, context));
        return cssRules.join('\n');
    }

    generateStealthCss(): string {
        let stealthCss = "";
        const styles = this.settings.customFolderColors;
        
        for (const path in styles) {
            const style = styles[path];
            if (typeof style === 'object' && style.isHidden) {
                // Notebook Navigator Integration (requires static CSS rules due to React virtual scroll)
                if (this.settings.notebookNavigatorSupport) {
                    const nnSelector = NotebookNavigatorIntegration.getScopedNavSelector(path);
                    const nnFileSelector = NotebookNavigatorIntegration.getScopedFileSelector(path);
                    
                    stealthCss += `
                        body:not(.cf-show-hidden) ${nnSelector},
                        body:not(.cf-show-hidden) ${nnFileSelector} {
                            display: none !important;
                        }

                        body.cf-show-hidden ${nnSelector},
                        body.cf-show-hidden ${nnFileSelector} {
                            opacity: 0.3 !important;
                            filter: grayscale(1) blur(0.5px) !important;
                        }
                    `;
                }
            }
        }
        return stealthCss;
    }
}
