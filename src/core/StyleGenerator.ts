import { ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { PALETTES, CF_FOLDER_CLOSED } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, safeEscape, parseCustomPalette, hashString } from '../common/utils';
import * as obsidian from 'obsidian';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { FocusModeEngine } from './FocusModeEngine';

export class StyleGenerator {
    plugin: IColorfulFoldersPlugin;
    settings: ColorfulFoldersSettings;
    app: obsidian.App;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.settings = plugin.settings;
        this.app = plugin.app;

        if (!this.plugin.heatmapCache) {
            this.plugin.heatmapCache = new Map<string, number>();
        }
    }





    isDarkMode() {
        return (activeDocument.body.classList.contains('theme-dark'));
    }

    private prepareContext(): StyleContext | null {
        const root = this.app.vault.getRoot();
        if (!root) return null;

        const isDark = this.isDarkMode();
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;
        
        const activeFile = this.app.workspace.getActiveFile();
        const activePath = activeFile ? activeFile.path : "";

        const iconScale = this.settings.iconScale || 1.0;
        const wideScale = this.settings.wideAutoIcons ? 1.05 : 1.0;
        const folderIconW = `calc(1.3em * ${iconScale * wideScale})`;
        const effFileIconW = `calc(1.3em * ${iconScale * wideScale})`;

        let currentPalette = PALETTES[this.settings.palette] || PALETTES["Muted Dark Mode"];
        if (this.settings.palette === "Custom") {
            const custom = parseCustomPalette(this.settings.customPalette);
            if (custom) currentPalette = custom;
        }

        if (!isDark) {
            currentPalette = currentPalette.map(c => {
                const darker = adjustBrightnessRgb(c.rgb, -0.15);
                const p = darker.split(',').map(s => parseInt(s.trim()));
                const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
                return { rgb: darker, hex: hex };
            });
        }

        const excludeFolders = this.settings.exclusionList
            .split(',')
            .map((s: string) => s.trim().toLowerCase())
            .filter((s: string) => s.length > 0);

        return {
            isDark,
            brightnessAmount,
            activePath,
            currentPalette,
            heatmapData: this.calculateHeatmapData(),
            excludeFolders,
            effFileIconW,
            folderIconW,
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

    private getHeatmapColor(mtime: number, context: StyleContext): { rgb: string, hex: string } {
        if (!mtime) return context.currentPalette[context.currentPalette.length - 1];
        const diffDays = (context.now - mtime) / (1000 * 60 * 60 * 24);
        const palettes = context.currentPalette;
        if (diffDays <= 1) return palettes[0];
        if (diffDays <= 3) return palettes[Math.min(2, palettes.length - 1)];
        if (diffDays <= 7) return palettes[Math.min(7, palettes.length - 1)];
        if (diffDays <= 15) return palettes[Math.min(4, palettes.length - 1)];
        if (diffDays <= 30) return palettes[Math.min(10, palettes.length - 1)];
        return palettes[palettes.length - 1];
    }

    private calculateTextColor(shouldColor: boolean, textColor: string | null, passedColor: { rgb: string, hex: string } | null, colorRgb: string, context: StyleContext) {
        if (textColor) return textColor;
        if (shouldColor || passedColor) {
            if (context.isDark) {
                const fileBright = Math.max(context.brightnessAmount, 0.15);
                return `rgb(${adjustBrightnessRgb(colorRgb, fileBright)})`;
            } else {
                const fileBright = context.brightnessAmount === 0 ? -0.6 : context.brightnessAmount;
                return `rgb(${adjustBrightnessRgb(colorRgb, fileBright)})`;
            }
        }
        return "var(--text-normal)";
    }

    private getFolderStyles(useOutline: boolean, depth: number, colorRgb: string, colorHex: string, op: number, isCustomColor: boolean, customStyle: FolderStyle | null, inheritedStyle: FolderStyle | null, context: StyleContext) {
        let b: string, t: string;
        const contrastColor = context.isDark ? "#ffffff" : "#111111";
        const rootBgStyle = this.settings.rootStyle;
        const isDark = context.isDark;
        const brightnessAmount = context.brightnessAmount;

        if (depth === 0) {
            if (this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent && !isCustomColor) {
                b = "transparent";
                t = colorHex;
            } else if (rootBgStyle === "solid") {
                b = useOutline ? "transparent" : colorHex;
                t = useOutline ? colorHex : contrastColor;
            } else {
                b = useOutline ? "transparent" : `rgba(${colorRgb}, ${op})`;
                const rootAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.7 : brightnessAmount);
                t = (isDark && rootAdjust === 0) ? colorHex : `rgb(${adjustBrightnessRgb(colorRgb, rootAdjust)})`;
            }
        } else {
            b = useOutline ? "transparent" : `rgba(${colorRgb}, ${op})`;
            const subAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.5 : brightnessAmount);
            t = (isDark && subAdjust === 0) ? colorHex : `rgb(${adjustBrightnessRgb(colorRgb, subAdjust)})`;
        }

        const effectiveTextColor = customStyle?.textColor || inheritedStyle?.textColor;
        if (effectiveTextColor) {
            t = effectiveTextColor;
        } else if (isCustomColor || inheritedStyle?.hex) {
            const customAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.5 : brightnessAmount);
            t = (rootBgStyle === "solid" && depth === 0 && !useOutline) ? contrastColor : ((isDark && customAdjust === 0) ? colorHex : `rgb(${adjustBrightnessRgb(colorRgb, customAdjust)})`);
        }
        return { b, t };
    }

    private generateGlobalBaseCss(): string {
        return `
            /* Performance: Native-Speed Override during drag-and-drop */
            body.cf-is-dragging * {
                transition: none !important;
                animation: none !important;
                filter: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                box-shadow: none !important;
                opacity: 1 !important;
            }

            /* Suspend heavy backgrounds and borders during drag */
            body.cf-is-dragging .nav-folder-title,
            body.cf-is-dragging .nav-file-title,
            body.cf-is-dragging .nav-folder-children,
            body.cf-is-dragging .cf-interactive-divider {
                background-image: none !important;
                border-color: transparent !important;
                background-color: transparent !important;
            }

            /* Global: Flex layout foundation for all nav title rows. */
            .nav-folder-title-content,
            .nav-file-title-content,
            .tree-item-inner {
                display: flex !important;
                align-items: center !important;
                overflow: visible !important;
            }

            .nav-folder-title,
            .nav-file-title,
            .tree-item-self {
                display: flex !important;
                align-items: center !important;
                overflow: visible !important;
            }

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
            .nav-folder:has(> .cf-interactive-divider),
            .nav-file:has(> .cf-interactive-divider) {
                position: relative !important;
                padding-top: ${dividerHeight}px !important;
                display: flex !important;
                flex-direction: column !important;
            }

            /* Ensure folder lines/children start below the divider */
            .nav-folder:has(> .cf-interactive-divider) > .nav-folder-title,
            .nav-folder:has(> .cf-interactive-divider) > .nav-folder-children {
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
                gap: ${this.settings.dividerLinePadding ?? 8}px !important;
            }
            
            .cf-divider-line {
                z-index: 4 !important;
                pointer-events: none !important;
            }
            
            .cf-divider-hidden {
                display: none !important;
            }

            /* Fix for folder vertical lines */
            .nav-folder:has(> .cf-interactive-divider) > .nav-folder-children {
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
        const activePath = context.activePath;
        const heatmapData = context.heatmapData;
        const excludeFolders = context.excludeFolders;
        const effFileIconW = context.effFileIconW;
        const folderIconW = context.folderIconW;
        
        const rootOp = this.settings.rootOpacity !== undefined ? this.settings.rootOpacity : 0.548;
        const subOp = this.settings.subfolderOpacity !== undefined ? this.settings.subfolderOpacity : 0.05;
        const useGlass = this.settings.glassmorphism;
        const glassCss = useGlass ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';
        const cycleOff = this.settings.cycleOffset || 0;
        const outlineOnly = this.settings.outlineOnly;
        const nnFileBgActive = NotebookNavigatorIntegration.showFileBg(this.settings);
        const tintOp = this.settings.tintOpacity;
        const autoColorFiles = this.settings.autoColorFiles;
        const autoIcons = this.settings.autoIcons;
        const CF_FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; margin-right: 6px; opacity: 0.85; vertical-align: middle;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

        // Process Files
        if (passedColor || autoColorFiles || autoIcons || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {
            let fileIndex = 0;
            for (const child of copyFiles) {
                const safePath = safeEscape(child.path);
                const nameHash = hashString(child.name);
                let color: { rgb: string, hex: string };
                let fileStyle = this.getStyle(child.path);

                const iconColor = fileStyle?.iconColor || (inheritedStyle?.applyToFiles && inheritedStyle.iconColor) || null;

                if (fileStyle && fileStyle.hex) {
                    const customParsed = parseCustomPalette(fileStyle.hex);
                    const cObj = hexToRgbObj(fileStyle.hex);
                    color = customParsed ? customParsed[0] : (cObj ? { rgb: `${cObj.r}, ${cObj.g}, ${cObj.b}`, hex: fileStyle.hex } : currentPalette[(validIndex + fileIndex) % currentPalette.length]);
                } else if (inheritedStyle && inheritedStyle.applyToFiles && passedColor) {
                    color = passedColor;
                } else if (this.settings.colorMode === "heatmap") {
                    const mtime = child.stat.mtime;
                    color = this.getHeatmapColor(mtime, context);
                } else if (this.settings.autoColorFiles || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {
                    const hObj = inheritedStyle?.hex ? hexToRgbObj(inheritedStyle.hex) : null;
                    if (hObj) {
                        const offset = ((nameHash % 5) - 2) * 5;
                        const r = Math.max(0, Math.min(255, hObj.r + offset));
                        const g = Math.max(0, Math.min(255, hObj.g + offset));
                        const b = Math.max(0, Math.min(255, hObj.b + offset));
                        color = { rgb: `${r}, ${g}, ${b}`, hex: inheritedStyle.hex };
                    } else {
                        color = currentPalette[(validIndex + nameHash + cycleOff) % currentPalette.length];
                    }
                } else {
                    const gHex = this.settings.globalBackgroundColor || "";
                    const gRgb = hexToRgbObj(gHex);
                    color = passedColor || (gRgb ? { rgb: `${gRgb.r}, ${gRgb.g}, ${gRgb.b}`, hex: gHex } : { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" });
                }

                const isCustomColor = !!(fileStyle && fileStyle.hex);
                const isCustomOrInherited = isCustomColor || (inheritedStyle && inheritedStyle.applyToFiles);
                const shouldColorNative = isCustomOrInherited || this.settings.autoColorFiles || !!this.settings.globalBackgroundColor;
                const shouldColorNN = isCustomOrInherited || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground);

                const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);
                const textColor = fileStyle?.textColor || (inheritedStyle?.applyToFiles ? inheritedStyle.textColor : null);
                const op = fileStyle?.opacity !== undefined ? fileStyle.opacity : (isCustomColor && activeStyle?.opacity !== undefined ? activeStyle.opacity : 1.0);

                const autoIconFile = (this.settings.autoIcons && !fileStyle?.iconId && !(inheritedStyle?.applyToFiles && inheritedStyle?.iconId)) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
                const iconId = fileStyle?.iconId || (inheritedStyle?.applyToFiles ? inheritedStyle.iconId : null) || (autoIconFile ? (this.settings.wideAutoIcons ? autoIconFile.lucide : autoIconFile.emoji) : "");

                const textNative = this.calculateTextColor(shouldColorNative, textColor, passedColor, color.rgb, context);
                const textNN = this.calculateTextColor(shouldColorNN, textColor, passedColor, color.rgb, context);

                const isBold = fileStyle?.isBold !== undefined ? fileStyle.isBold : (inheritedStyle?.applyToFiles ? inheritedStyle.isBold : false);
                const isItalic = fileStyle?.isItalic !== undefined ? fileStyle.isItalic : (inheritedStyle?.applyToFiles ? inheritedStyle.isItalic : false);

                const fileBgAlpha = isCustomColor ? op : (this.settings.fileBackgroundOpacity !== undefined ? this.settings.fileBackgroundOpacity : (isDark ? 0.1 : 0.15));
                
                const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
                const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : textNative;
                
                cssRules.push(`
                    .nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file),
                    .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) {
                        ${shouldColorNative ? `
                            background-color: rgba(${color.rgb}, ${fileBgAlpha}) !important;
                            border-left: 2px solid rgba(${color.rgb}, 0.4) !important;
                        ` : `
                            background-color: transparent !important;
                            border-left: none !important;
                        `}
                        opacity: 1.0 !important;
                        color: ${textNative} !important;
                        font-weight: ${isBold ? 'bold' : 'normal'} !important;
                        font-style: ${isItalic ? 'italic' : 'normal'} !important;
                        border-radius: 4px;
                        --nav-tag-background: rgba(${color.rgb}, 0.15) !important;
                        --nav-tag-color: ${textNative} !important;
                    }

                    [data-path="${safePath}"] .nav-file-tag,
                    [data-path="${safePath}"] .nav-folder-tag,
                    [data-path="${safePath}"] .tree-item-flair {
                        background-color: rgba(${color.rgb}, 0.15) !important;
                        color: ${textNative} !important;
                        font-size: 10px !important;
                    }
                `);

                if (nnFileBgActive) {
                    cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                        child.path,
                        false,
                        color,
                        fileBgAlpha,
                        textNN,
                        iconId,
                        activeBg,
                        activeText,
                        isBold,
                        isItalic,
                        shouldColorNN,
                        useGlass,
                        tintOp
                    ));
                }

                if (iconId) {
                    const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${iconId}`) &&
                        !obsidian.getIconIds?.().includes(iconId) &&
                        !(this.settings.customIcons && this.settings.customIcons[iconId]);

                    if (isCustomEmoji) {
                        cssRules.push(`
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                                content: "${iconId} " !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin-right: 6px !important;
                                flex-shrink: 0 !important;
                                height: 1.3em !important;
                                width: 1.3em !important;
                                line-height: 1 !important;
                                vertical-align: text-bottom !important;
                            }
                        `);
                    } else {
                        const isManualCustom = !!(activeStyle && activeStyle.iconId);
                        if (isManualCustom) {
                            cssRules.push(`
                                body [data-path="${safePath}"] .nav-file-title-content::before,
                                body [data-path="${safePath}"] .tree-item-inner::before {
                                    display: none !important;
                                    content: none !important;
                                }
                            `);
                        } else {
                            const svgStr = this.plugin.iconManager.getIconSvg(iconId, true);
                            if (svgStr) {
                                cssRules.push(`
                                    body [data-path="${safePath}"] .nav-file-title-content::before,
                                    body [data-path="${safePath}"] .tree-item-inner::before {
                                        content: '' !important;
                                        display: inline-flex !important;
                                        width: ${effFileIconW} !important;
                                        height: ${effFileIconW} !important;
                                        background-color: ${iconColor || color.hex || textNative} !important;
                                        -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                        -webkit-mask-repeat: no-repeat !important;
                                        -webkit-mask-position: center !important;
                                        -webkit-mask-size: contain !important;
                                        margin-right: 6px !important;
                                        opacity: 0.85 !important;
                                    }
                                `);
                            }
                        }
                    }
                } else if (autoIcons) {
                    cssRules.push(`
                        body [data-path="${safePath}"] .nav-file-title-content::before,
                        body [data-path="${safePath}"] .tree-item-inner::before {
                            content: '' !important;
                            display: inline-flex !important;
                            width: ${effFileIconW} !important;
                            height: ${effFileIconW} !important;
                            background-color: ${iconColor || color.hex || textNative} !important;
                            -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FILE_TEXT_ICON))}") !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            -webkit-mask-size: contain !important;
                            margin-right: 6px !important;
                            opacity: 0.85 !important;
                        }
                    `);
                }

                cssRules.push(`
                    .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file),
                    .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file) {
                        background-color: ${activeBg} !important;
                        color: ${activeText} !important;
                        border: 1px solid rgba(${color.rgb}, 0.3) !important;
                        ${useGlass ? `
                            backdrop-filter: blur(12px) saturate(160%) !important;
                            -webkit-backdrop-filter: blur(12px) saturate(160%) !important;
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0,0,0,0.2) !important;
                        ` : `
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0,0,0,0.1) !important;
                        `}
                    }

                    /* Notebook Navigator Active File Glow (Flat Slot) */
                    ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)}.is-active {
                        background-color: ${activeBg} !important;
                        color: ${activeText} !important;
                        border-left: 3px solid ${activeText} !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]::before,
                    .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]::before {
                        background-color: ${activeText} !important;
                    }
                `);

                fileIndex++;
            }
        }

        // Folder logic
        if (depth > 0 && passedColor) {
            const safePath = safeEscape(folder.path);
            const minOp = depth === 1 ? 0.12 : 0.05;
            const finalTintOp = Math.max(tintOp, minOp);
            const bgTint = outlineOnly ? "transparent" : `rgba(${passedColor.rgb}, ${finalTintOp})`;

            cssRules.push(`
                body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                    background-color: ${bgTint} !important;
                    border-left: 2.5px solid rgba(${passedColor.rgb}, 0.25) !important;
                    border-bottom: 2.5px solid rgba(${passedColor.rgb}, 0.25) !important;
                    border-radius: 4px !important;
                    border-bottom-left-radius: 8px !important;
                    padding-bottom: 4px !important;
                    margin-bottom: 4px !important;
                    overflow: visible !important;
                }
            `);

            if (passedColor) {
                const isParentOfActive = activePath && (activePath === folder.path || activePath.startsWith(folder.path + "/"));
                const activeSelector = `.nav-files-container .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) ~ .nav-folder-children, .nav-files-container .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"]:not(.nn-navitem) ~ .tree-item-children ${isParentOfActive ? `, .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) ~ .nav-folder-children, .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem) ~ .tree-item-children` : ""}`;
                cssRules.push(`
                    ${activeSelector} {
                        border-left: 2.5px solid ${passedColor.hex} !important;
                        border-bottom: 2.5px solid ${passedColor.hex} !important;
                        border-bottom-left-radius: 8px !important;
                        box-shadow: -2px 0 10px -2px ${passedColor.hex}44;
                        margin-left: 12px !important;
                        padding-left: 0 !important;
                        --cf-rgb: ${passedColor.rgb};
                    }

                    /* Notebook Navigator Folder Active Path (Flat-Glass) */
                    ${isParentOfActive ? `
                        ${NotebookNavigatorIntegration.getScopedNavSelector(folder.path)} {
                            border-left: 4px solid ${passedColor.hex} !important;
                            background: linear-gradient(to right, rgba(${passedColor.rgb}, 0.25), rgba(${passedColor.rgb}, 0.05)) !important;
                        }
                    ` : ''}
                `);
            }
        }

        let validFolderIndex = 0;
        for (let i = 0; i < copyFolders.length; i++) {
            const child = copyFolders[i];
            if (excludeFolders.includes(child.name.toLowerCase())) {
                this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), passedColor, inheritedStyle, context, cssRules);
                continue;
            }

            let color: { rgb: string, hex: string };
            let customStyle = this.getStyle(child.path);
            let activeStyle = customStyle || inheritedStyle;

            if (customStyle && customStyle.hex) {
                const customParsed = parseCustomPalette(customStyle.hex);
                const cObj = hexToRgbObj(customStyle.hex);
                color = customParsed ? customParsed[0] : (cObj ? { rgb: `${cObj.r}, ${cObj.g}, ${cObj.b}`, hex: customStyle.hex } : currentPalette[(validFolderIndex + depth + rootIndex + cycleOff) % currentPalette.length]);
            } else if (inheritedStyle && passedColor) {
                color = passedColor;
            } else if (this.settings.colorMode === "heatmap") {
                const mtime = heatmapData.get(child.path) || 0;
                color = this.getHeatmapColor(mtime, context);
            } else if (this.settings.colorMode === "monochromatic") {
                color = depth === 0 ? currentPalette[(validFolderIndex + cycleOff) % currentPalette.length] : passedColor;
            } else {
                color = currentPalette[(validFolderIndex + depth + rootIndex + cycleOff) % currentPalette.length];
            }

            const safePath = safeEscape(child.path);
            const isCustomColor = !!(activeStyle && activeStyle.hex);
            const op = (activeStyle && activeStyle.opacity !== undefined) ? activeStyle.opacity : (depth === 0 ? rootOp : subOp);

            // Pre-calculate folder icons to avoid warnings
            const autoIconFolder = (this.settings.autoIcons && !customStyle?.iconId && !inheritedStyle?.iconId) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
            const folderIconId = customStyle?.iconId || inheritedStyle?.iconId || (autoIconFolder ? (this.settings.wideAutoIcons ? autoIconFolder.lucide : autoIconFolder.emoji) : "");

            const folderStyles = this.getFolderStyles(outlineOnly, depth, color.rgb, color.hex, op, isCustomColor, customStyle, inheritedStyle, context);

            const isBold = customStyle?.isBold !== undefined ? customStyle.isBold : (inheritedStyle?.isBold !== undefined ? inheritedStyle.isBold : true);
            const isItalic = customStyle?.isItalic !== undefined ? customStyle.isItalic : (inheritedStyle?.isItalic !== undefined ? inheritedStyle.isItalic : false);

            let textCss = `
                color: ${folderStyles.t} !important;
                font-weight: ${isBold ? 'bold' : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
            `;

            if (this.settings.rainbowRootText && depth === 0 && !customStyle?.textColor) {
                const nextColor = currentPalette[(i + 1) % currentPalette.length];
                textCss = `
                    background-image: linear-gradient(90deg, ${color.hex}, ${nextColor.hex}, ${color.hex}) !important;
                    background-clip: text !important;
                    -webkit-background-clip: text !important;
                    color: transparent !important;
                    font-weight: 800 !important;
                `;
            }

            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : folderStyles.t;

            cssRules.push(`
                .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem),
                .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file) {
                    background-color: ${folderStyles.b} !important;
                    opacity: 1.0 !important;
                    border-radius: 6px;
                    ${glassCss}
                }
            `);

            /* Notebook Navigator Folder Integration (Native-Bridge Architecture) */
            cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                child.path,
                true,
                color,
                op,
                folderStyles.t,
                folderIconId,
                activeBg,
                activeText,
                isBold,
                isItalic,
                true,
                useGlass,
                tintOp
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
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: "${folderIconId} " !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin-right: 6px !important;
                        }
                    `);
                } else {
                    const isManualCustom = !!(customStyle && customStyle.iconId);
                    if (isManualCustom) {
                        cssRules.push(`
                            body [data-path="${safePath}"] .nav-folder-title-content::before,
                            body [data-path="${safePath}"] .tree-item-inner::before {
                                display: none !important;
                                content: none !important;
                            }
                        `);
                    } else {
                        const svgStr = this.plugin.iconManager.getIconSvg(folderIconId, true);
                        if (svgStr) {
                            cssRules.push(`
                                body [data-path="${safePath}"] .nav-folder-title-content::before,
                                body [data-path="${safePath}"] .tree-item-inner::before {
                                    content: '' !important;
                                    display: inline-flex !important;
                                    width: ${folderIconW} !important;
                                    height: ${folderIconW} !important;
                                    background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                                    -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                }
                            `);
                        }
                    }
                }
            } else if (autoIcons) {
                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                        content: '' !important;
                        display: inline-flex !important;
                        width: ${folderIconW} !important;
                        height: ${folderIconW} !important;
                        background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                        -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FOLDER_CLOSED))}") !important;
                        -webkit-mask-repeat: no-repeat !important;
                        -webkit-mask-position: center !important;
                        -webkit-mask-size: contain !important;
                        margin-right: 6px !important;
                    }
                `);
            }

            if (this.settings.showItemCounters) {
                const counts = this.countItems(child);
                const totalWidth = 80;
                const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20" preserveAspectRatio="xMidYMid meet">
                    <g stroke="${color.hex}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 3) scale(0.65)">
                        <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
                    </g>
                    <text x="21" y="15" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">${counts.folders}</text>
                    <g stroke="${color.hex}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(42, 3) scale(0.65)">
                        <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"/>
                        <path d="M15 2v5h5"/>
                        <path d="M2 17.6V7.1c0-.4.2-.8.5-1.1.3-.3.7-.5 1.1-.5h3.3"/>
                        <path d="M13 22H3.6c-.4 0-.8-.2-1.1-.5-.3-.3-.5-.7-.5-1.1V10"/>
                    </g>
                    <text x="60" y="15" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">${counts.files}</text>
                </svg>`;
                const encodedSvg = encodeURIComponent(combinedSvg.replace(/>\s+</g, '><').replace(/(\r\n|\n|\r)/gm, ""));
                const combinedIconUrl = `url("data:image/svg+xml,${encodedSvg}")`;

                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"]::after,
                    body .tree-item-self[data-path="${safePath}"]::after {
                        content: "" !important;
                        background-image: ${combinedIconUrl} !important;
                        background-repeat: no-repeat !important;
                        background-position: center right !important;
                        display: inline-flex !important;
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

            const nextInherited = activeStyle?.applyToSubfolders ? activeStyle : inheritedStyle;
            this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), color, nextInherited, context, cssRules);
            validFolderIndex++;
        }
    }

    generateCss(): string {
        const context = this.prepareContext();
        if (!context) return "";

        const cssRules: string[] = [];
        cssRules.push(this.generateGlobalBaseCss());

        if (this.settings.focusMode && context.activePath) {
            cssRules.push(FocusModeEngine.generateCss(this.settings, context));
        }

        cssRules.push(this.generateDividerCss());

        const root = this.app.vault.getRoot();
        
        // Support for styling the vault root in Notebook Navigator
        const rootStyle = this.getStyle(root.path) || this.getStyle("/");
        if (rootStyle && this.settings.notebookNavigatorSupport) {
            const palette = this.settings.palette ? PALETTES[this.settings.palette] || Object.values(PALETTES)[0] : Object.values(PALETTES)[0];
            const rootColor = rootStyle.hex ? { rgb: hexToRgbObj(rootStyle.hex).r + "," + hexToRgbObj(rootStyle.hex).g + "," + hexToRgbObj(rootStyle.hex).b, hex: rootStyle.hex } : palette[0];
            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${rootColor.rgb}, 0.14)`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : (rootStyle.textColor || rootColor.hex);
            
            cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                root.path,
                true,
                rootColor,
                rootStyle.opacity ?? 0.8,
                rootStyle.textColor || rootColor.hex,
                rootStyle.iconId || "",
                activeBg,
                activeText,
                !!rootStyle.isBold,
                !!rootStyle.isItalic,
                true,
                this.settings.glassmorphism,
                0
            ));
            // Also handle potential empty path/slash variants
            if (root.path !== "/") {
                 cssRules.push(NotebookNavigatorIntegration.generateIntegratedStyles(
                    "/",
                    true,
                    rootColor,
                    rootStyle.opacity ?? 0.8,
                    rootStyle.textColor || rootColor.hex,
                    rootStyle.iconId || "",
                    activeBg,
                    activeText,
                    !!rootStyle.isBold,
                    !!rootStyle.isItalic,
                    true,
                    this.settings.glassmorphism,
                    0
                ));
            }
        }

        this.traverse(root, 0, 0, 0, null, null, context, cssRules);

        cssRules.push(this.generateStealthCss());
        return cssRules.join('\n');
    }

    generateStealthCss(): string {
        let stealthCss = "";
        const styles = this.settings.customFolderColors;
        
        for (const path in styles) {
            const style = styles[path];
            if (typeof style === 'object' && style.isHidden) {
                const safePath = safeEscape(path);
                
                // Native Obsidian File Explorer
                stealthCss += `
                    body:not(.cf-show-hidden) .nav-folder:has(> .nav-folder-title[data-path="${safePath}"]),
                    body:not(.cf-show-hidden) .nav-file:has(> .nav-file-title[data-path="${safePath}"]),
                    body:not(.cf-show-hidden) .tree-item:has(> .tree-item-self[data-path="${safePath}"]) {
                        display: none !important;
                    }

                    body.cf-show-hidden .nav-folder:has(> .nav-folder-title[data-path="${safePath}"]),
                    body.cf-show-hidden .nav-file:has(> .nav-file-title[data-path="${safePath}"]),
                    body.cf-show-hidden .tree-item:has(> .tree-item-self[data-path="${safePath}"]) {
                        opacity: 0.3 !important;
                        filter: grayscale(1) blur(0.5px) !important;
                    }
                    
                    body.cf-show-hidden .nav-folder:has(> .nav-folder-title[data-path="${safePath}"]):hover,
                    body.cf-show-hidden .nav-file:has(> .nav-file-title[data-path="${safePath}"]):hover,
                    body.cf-show-hidden .tree-item:has(> .tree-item-self[data-path="${safePath}"]):hover {
                        opacity: 0.8 !important;
                        filter: grayscale(0.5) blur(0px) !important;
                    }
                `;

                // Notebook Navigator Integration
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
