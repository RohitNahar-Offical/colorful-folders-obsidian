import { ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin } from '../common/types';
import { PALETTES, CF_FOLDER_CLOSED, CF_FOLDER_OPEN } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, safeEscape, parseCustomPalette, hashString } from '../common/utils';
import * as obsidian from 'obsidian';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';

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

    getStyle(path: string): FolderStyle | null {
        const style = this.settings.customFolderColors[path];
        if (!style) return null;
        if (typeof style === 'string') return { hex: style };
        return style;
    }

    generateCss(): string {
        const cssRules: string[] = [];

        const root = this.app.vault.getRoot();
        if (!root) return cssRules.join('\n');

        const isDark = this.isDarkMode();
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;

        const iconScale = this.settings.iconScale || 1.0;
        const fileIconW = Math.round(18 * iconScale);
        const folderIconW = Math.round(18 * iconScale);

        const wideScale = this.settings.wideAutoIcons ? 1.05 : 1.0;
        const effFileIconW = Math.round(fileIconW * wideScale);
        const wideOpacity = this.settings.wideAutoIcons ? "1.0" : "0.85";

        const CF_FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="${fileIconW}" height="${fileIconW}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; opacity: 0.85; vertical-align: middle;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;


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

        const rootBgStyle = this.settings.rootStyle;
        const subOp = this.settings.subfolderOpacity;
        const tintOp = this.settings.tintOpacity;
        const outlineOnly = this.settings.outlineOnly;
        const nnOutlineOnly = this.settings.notebookNavigatorOutlineOnly;
        const cycleOff = this.settings.cycleOffset || 0;


        const nnActive = NotebookNavigatorIntegration.isSupported(this.settings);
        const nnFileBgActive = NotebookNavigatorIntegration.showFileBg(this.settings);

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

        const now = Date.now();
        const getHeatmapColor = (mtime: number) => {
            if (!mtime) return currentPalette[currentPalette.length - 1];
            const diffDays = (now - mtime) / (1000 * 60 * 60 * 24);
            const palettes = currentPalette;
            if (diffDays <= 1) return palettes[0];
            if (diffDays <= 3) return palettes[Math.min(2, palettes.length - 1)];
            if (diffDays <= 7) return palettes[Math.min(7, palettes.length - 1)];
            if (diffDays <= 15) return palettes[Math.min(4, palettes.length - 1)];
            if (diffDays <= 30) return palettes[Math.min(10, palettes.length - 1)];
            return palettes[palettes.length - 1];
        };

        if (this.settings.animateActivePath) {
            cssRules.push(`
                @keyframes cf-breathe-glow {
                    0% { border-color: rgba(var(--cf-rgb), 0.6) !important; box-shadow: -1px 1px 4px rgba(var(--cf-rgb), 0.05) !important; filter: brightness(1.0); }
                    50% { border-color: rgba(var(--cf-rgb), 0.9) !important; box-shadow: -1px 1px 8px rgba(var(--cf-rgb), 0.15) !important; filter: brightness(1.05); }
                    100% { border-color: rgba(var(--cf-rgb), 0.6) !important; box-shadow: -1px 1px 4px rgba(var(--cf-rgb), 0.05) !important; filter: brightness(1.0); }
                }
                @keyframes cf-neon-flicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { border-color: rgba(var(--cf-rgb), 0.8) !important; box-shadow: -1px 1px 5px rgba(var(--cf-rgb), 0.15) !important; }
                    20%, 24%, 55% { border-color: rgba(var(--cf-rgb), 0.5) !important; box-shadow: none !important; }
                }
                @keyframes cf-shimmer-glow {
                    0% { filter: brightness(1.0) saturate(100%); }
                    50% { filter: brightness(1.08) saturate(110%); }
                    100% { filter: brightness(1.0) saturate(100%); }
                }
                @keyframes cf-rainbow-text-pan {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                /* Global: Hide default icons when a custom icon is active */
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
            `);
        }


        if (this.settings.focusMode) {
            cssRules.push(`
                body:has(.nav-file-title.is-active) .nav-file-title,
                body:has(.nav-file-title.is-active) .nav-folder-title,
                body:has(.nav-file-title.is-active) .nav-folder-content::before {
                    opacity: 0.3 !important;
                    transition: opacity 0.3s ease !important;
                }
                body:has(.nav-file-title.is-active) .nav-file-title.is-active {
                    opacity: 1 !important;
                }
                body:has(.nav-file-title.is-active) .nav-folder:has(.is-active) > .nav-folder-title,
                body:has(.nav-file-title.is-active) .nav-folder:has(.is-active) > .nav-folder-content::before {
                    opacity: 1 !important;
                }
                body:not(.is-mobile):has(.nav-file-title.is-active) .nav-file-title:hover,
                body:not(.is-mobile):has(.nav-file-title.is-active) .nav-folder-title:hover {
                    opacity: 1 !important;
                    transition: opacity 0.15s ease !important;
                }
            `);
        }

        const countCache = new Map<string, { files: number, folders: number }>();
        const countItems = (folderItem: obsidian.TFolder): { files: number, folders: number } => {
            const cached = countCache.get(folderItem.path);
            if (cached) return cached;
            let files = 0;
            let folders = 0;
            if (folderItem.children) {
                for (const c of folderItem.children) {
                    if (c instanceof obsidian.TFile) {
                        files++;
                    } else if (c instanceof obsidian.TFolder) {
                        folders++;
                        const sub = countItems(c);
                        files += sub.files;
                        folders += sub.folders;
                    }
                }
            }
            const res = { files, folders };
            countCache.set(folderItem.path, res);
            return res;
        };

        const traverse = (folder: obsidian.TFolder, depth: number, validIndex = 0, rootIndex = 0, passedColor: { rgb: string, hex: string } | null = null, inheritedStyle: FolderStyle | null = null) => {
            const copyFolders = folder.children
                .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                .sort((a, b) => a.name.localeCompare(b.name));

            const copyFiles = folder.children
                .filter((c): c is obsidian.TFile => c instanceof obsidian.TFile)
                .sort((a, b) => a.name.localeCompare(b.name));

            const glassCss = this.settings.glassmorphism ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';
            const animStyle = this.settings.activeAnimationStyle || "breathe";
            const animDur = this.settings.activeAnimationDuration || 4.0;
            const rootOp = this.settings.rootOpacity !== undefined ? this.settings.rootOpacity : 0.548;



            if (passedColor || this.settings.autoColorFiles || this.settings.autoIcons || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {
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
                        color = getHeatmapColor(mtime);
                    } else if (this.settings.autoColorFiles || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {
                        const hObj = inheritedStyle?.hex ? hexToRgbObj(inheritedStyle.hex) : null;
                        if (hObj) {
                            // Inherit and slightly vary based on name hash
                            const offset = ((nameHash % 5) - 2) * 5; // -10 to +10 range
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

                    const calculateTextColor = (shouldColor: boolean) => {
                        if (textColor) return textColor;
                        if (shouldColor || passedColor) {
                            if (isDark) {
                                const fileBright = Math.max(brightnessAmount, 0.15);
                                return `rgb(${adjustBrightnessRgb(color.rgb, fileBright)})`;
                            } else {
                                const fileBright = brightnessAmount === 0 ? -0.6 : brightnessAmount;
                                return `rgb(${adjustBrightnessRgb(color.rgb, fileBright)})`;
                            }
                        }
                        return "var(--text-normal)";
                    };

                    const textNative = calculateTextColor(shouldColorNative);
                    const textNN = calculateTextColor(shouldColorNN);

                    const isBold = fileStyle?.isBold !== undefined ? fileStyle.isBold : (inheritedStyle?.applyToFiles ? inheritedStyle.isBold : false);
                    const isItalic = fileStyle?.isItalic !== undefined ? fileStyle.isItalic : (inheritedStyle?.applyToFiles ? inheritedStyle.isItalic : false);

                        const fileBgAlpha = isCustomColor ? op : (this.settings.fileBackgroundOpacity !== undefined ? this.settings.fileBackgroundOpacity : (isDark ? 0.1 : 0.15));
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
                            }
                        `);

                        if (nnFileBgActive) {
                            cssRules.push(`
                                ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} {
                                    ${shouldColorNN ? `
                                        background-color: rgba(${color.rgb}, ${fileBgAlpha}) !important;
                                        border-left: 2px solid rgba(${color.rgb}, 0.4) !important;
                                    ` : ''}
                                    opacity: 1.0 !important;
                                    color: ${textNN} !important;
                                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                                    border-radius: 4px;
                                }
                                ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileNameSelector()} {
                                    color: ${textNN} !important;
                                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                                }
                            `);
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
                                    -webkit-mask-image: none !important;
                                    background-image: none !important;
                                }
                            `);
                            
                            if (nnActive || nnFileBgActive) {
                                cssRules.push(`
                                    ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before,
                                    ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileNameSelector()}::before {
                                        content: "${iconId} " !important;
                                    }
                                    ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavIconSelector()},
                                    ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileIconSelector()} {
                                        display: none !important;
                                    }
                                `);
                            }
                        } else {
                            // Custom/Selected Icon rendering is now handled by DOM Injection (IconManager)
                            // But only if it's a manual override (activeStyle.iconId)
                            const isManualCustom = !!(activeStyle && activeStyle.iconId);
                            
                            if (isManualCustom) {
                                cssRules.push(`
                                    body [data-path="${safePath}"] .nav-file-title-content::before,
                                    body [data-path="${safePath}"] .tree-item-inner::before,
                                    body [data-path="${safePath}"].nav-file-title .nav-file-title-content::before,
                                    body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                        display: none !important;
                                        content: none !important;
                                    }
                                `);
                            } else {
                                // Auto SVG icon (handled here via masking)
                                const svgStr = this.plugin.iconManager.getIconSvg(iconId, true);
                                if (svgStr) {
                                    cssRules.push(`
                                        body [data-path="${safePath}"] .nav-file-title-content::before,
                                        body [data-path="${safePath}"] .tree-item-inner::before,
                                        body [data-path="${safePath}"].nav-file-title .nav-file-title-content::before,
                                        body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                            content: '' !important;
                                            display: inline-block !important;
                                            width: ${effFileIconW}px !important;
                                            height: ${effFileIconW}px !important;
                                            background-color: ${iconColor || color.hex || textNative} !important;
                                            -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                            -webkit-mask-repeat: no-repeat !important;
                                            -webkit-mask-position: center !important;
                                            -webkit-mask-size: contain !important;
                                            margin-right: 6px !important;
                                            vertical-align: middle !important;
                                            opacity: 0.85 !important;
                                        }
                                    `);
                                    if (nnActive || nnFileBgActive) {
                                        cssRules.push(`
                                            ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before,
                                            ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileNameSelector()}::before {
                                                content: '' !important;
                                                display: inline-block !important;
                                                width: ${effFileIconW}px !important;
                                                height: ${effFileIconW}px !important;
                                                background-color: ${iconColor || color.hex || textNN} !important;
                                                -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                                -webkit-mask-repeat: no-repeat !important;
                                                -webkit-mask-position: center !important;
                                                -webkit-mask-size: contain !important;
                                                margin-right: 6px !important;
                                                vertical-align: middle !important;
                                                opacity: 0.85 !important;
                                            }
                                        `);
                                    }
                                }
                            }
                        }
                    } else if (this.settings.autoIcons) {
                        cssRules.push(`
                            body [data-path="${safePath}"] .nav-file-title-content::before,
                            body [data-path="${safePath}"] .tree-item-inner::before,
                            body [data-path="${safePath}"].nav-file-title .nav-file-title-content::before,
                            body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: ${effFileIconW}px !important;
                                height: ${effFileIconW}px !important;
                                    background-color: ${iconColor || color.hex || textNative} !important;
                                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FILE_TEXT_ICON))}") !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: middle !important;
                                opacity: 0.85 !important;
                            }
                        `);
                        if (nnActive || nnFileBgActive) {
                            cssRules.push(`
                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before,
                                ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileNameSelector()}::before {
                                    content: '' !important;
                                    display: inline-block !important;
                                    width: ${effFileIconW}px !important;
                                    height: ${effFileIconW}px !important;
                                    background-color: ${iconColor || color.hex || textNN} !important;
                                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FILE_TEXT_ICON))}") !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                    vertical-align: middle !important;
                                    opacity: 0.85 !important;
                                }
                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavIconSelector()},
                                ${NotebookNavigatorIntegration.getScopedFileSelector(child.path)} ${NotebookNavigatorIntegration.getFileIconSelector()} {
                                    display: none !important;
                                }
                            `);
                        }
                    }

                    if (this.settings.activeGlow) {
                        let fileActiveAnim = '';
                        if (this.settings.animateActivePath) {
                            if (animStyle === "breathe") fileActiveAnim = `animation: cf-breathe-glow ${animDur}s infinite ease-in-out;`;
                            else if (animStyle === "neon") fileActiveAnim = `animation: cf-neon-flicker ${animDur}s infinite alternate;`;
                            else if (animStyle === "shimmer") fileActiveAnim = `animation: cf-shimmer-glow ${animDur}s infinite linear;`;
                        }

                        cssRules.push(`
                                body .nav-file-title.is-active[data-path="${safePath}"],
                                body .tree-item-self.is-active[data-path="${safePath}"] {
                                    box-shadow: -1px 1px 6px rgba(${color.rgb}, 0.2) !important;
                                    --cf-rgb: ${color.rgb};
                                    ${fileActiveAnim}
                                }
                            `);
                    }

                    fileIndex++;
                }
            }

            // Folder tint child containers
            if (depth > 0 && passedColor) {
                const safePath = safeEscape(folder.path);
                const minOp = depth === 1 ? 0.12 : 0.05;
                const finalTintOp = Math.max(this.settings.tintOpacity, minOp);
                const bgTint = outlineOnly ? "transparent" : `rgba(${passedColor.rgb}, ${finalTintOp})`;

                if (this.settings.animateActivePath) {
                    // Animation logic handled by animationProp below if needed
                }

                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                    body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                        background-color: ${bgTint} !important;
                        border-left: 2px solid rgba(${passedColor.rgb}, 0.8) !important;
                        border-bottom: 2px solid rgba(${passedColor.rgb}, 0.8) !important;
                        border-radius: 4px !important;
                        border-bottom-left-radius: 8px !important;
                        margin-left: 0 !important;
                        padding-left: 24px !important;
                        padding-bottom: 12px !important;
                    }
                `);

                if (this.settings.activeGlow && passedColor) {
                    let animationProp = '';
                    if (this.settings.animateActivePath) {
                        const style = this.settings.activeAnimationStyle || "breathe";
                        const dur = this.settings.activeAnimationDuration || 3.0;
                        if (style === "breathe") animationProp = `animation: cf-breathe-glow ${dur}s infinite ease-in-out;`;
                        else if (style === "neon") animationProp = `animation: cf-neon-flicker ${dur}s infinite alternate;`;
                        else if (style === "shimmer") animationProp = `animation: cf-shimmer-glow ${dur}s infinite linear;`;
                    }

                    cssRules.push(`
                        body .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                        body .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                            border-left: 2px solid rgba(${passedColor.rgb}, 1.0) !important;
                            border-bottom: 2px solid rgba(${passedColor.rgb}, 1.0) !important;
                            --cf-rgb: ${passedColor.rgb};
                            ${animationProp}
                        }
                    `);
                }
            }

            for (let i = 0; i < copyFolders.length; i++) {
                const child = copyFolders[i];
                if (excludeFolders.includes(child.name.toLowerCase())) {
                    traverse(child, depth + 1, i, (depth === 0 ? i : rootIndex), passedColor, inheritedStyle);
                    continue;
                }

                let color: { rgb: string, hex: string };
                let customStyle = this.getStyle(child.path);
                let activeStyle = customStyle || inheritedStyle;

                if (customStyle && customStyle.hex) {
                    const customParsed = parseCustomPalette(customStyle.hex);
                    const cObj = hexToRgbObj(customStyle.hex);
                    color = customParsed ? customParsed[0] : (cObj ? { rgb: `${cObj.r}, ${cObj.g}, ${cObj.b}`, hex: customStyle.hex } : currentPalette[(i + depth + rootIndex + cycleOff) % currentPalette.length]);
                } else if (inheritedStyle && passedColor) {
                    color = passedColor;
                } else if (this.settings.colorMode === "heatmap") {
                    const mtime = heatmapData.get(child.path) || 0;
                    color = getHeatmapColor(mtime);
                } else if (this.settings.colorMode === "monochromatic") {
                    color = depth === 0 ? currentPalette[(i + cycleOff) % currentPalette.length] : passedColor;
                } else {
                    color = currentPalette[(i + depth + rootIndex + cycleOff) % currentPalette.length];
                }


                const safePath = safeEscape(child.path);

                const contrastColor = isDark ? "#ffffff" : "#111111";
                const isCustomColor = !!(activeStyle && activeStyle.hex);
                const op = (activeStyle && activeStyle.opacity !== undefined) ? activeStyle.opacity : (depth === 0 ? rootOp : subOp);
                let bg, text;

                const getStyles = (useOutline: boolean) => {
                    let b: string, t: string;
                    if (depth === 0) {
                        if (this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent && !isCustomColor) {
                            b = "transparent";
                            t = color.hex;
                        } else if (rootBgStyle === "solid") {
                            b = useOutline ? "transparent" : color.hex;
                            t = useOutline ? color.hex : contrastColor;
                        } else {
                            b = useOutline ? "transparent" : `rgba(${color.rgb}, ${op})`;
                            const rootAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.7 : brightnessAmount);
                            t = (isDark && rootAdjust === 0) ? color.hex : `rgb(${adjustBrightnessRgb(color.rgb, rootAdjust)})`;
                        }
                    } else {
                        b = useOutline ? "transparent" : `rgba(${color.rgb}, ${op})`;
                        const subAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.5 : brightnessAmount);
                        t = (isDark && subAdjust === 0) ? color.hex : `rgb(${adjustBrightnessRgb(color.rgb, subAdjust)})`;
                    }

                    const effectiveTextColor = customStyle?.textColor || inheritedStyle?.textColor;
                    if (effectiveTextColor) {
                        t = effectiveTextColor;
                    } else if (isCustomColor || inheritedStyle?.hex) {
                        const customAdjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.5 : brightnessAmount);
                        t = (rootBgStyle === "solid" && depth === 0 && !useOutline) ? contrastColor : ((isDark && customAdjust === 0) ? color.hex : `rgb(${adjustBrightnessRgb(color.rgb, customAdjust)})`);
                    }
                    return { b, t };
                };

                const nativeS = getStyles(outlineOnly);
                const nnS = getStyles(nnOutlineOnly);

                bg = nativeS.b;
                text = nativeS.t;
                const bgNN = nnS.b;
                const textNN = nnS.t;

                const isBold = customStyle?.isBold !== undefined ? customStyle.isBold : (inheritedStyle?.isBold !== undefined ? inheritedStyle.isBold : true);
                const isItalic = customStyle?.isItalic !== undefined ? customStyle.isItalic : (inheritedStyle?.isItalic !== undefined ? inheritedStyle.isItalic : false);

                let textCss = `
                    color: ${text} !important;
                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;

                let textCssNN = `
                    color: ${textNN} !important;
                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;

                if (this.settings.rainbowRootText && depth === 0 && !customStyle?.textColor) {
                    const nextColor = currentPalette[(validIndex + 1) % currentPalette.length];
                    const shadowOp = isDark ? 0.7 : 0.3;
                    const rainbowAnim = this.settings.animateActivePath ? `animation: cf-rainbow-text-pan ${animDur * 2}s ease infinite !important; background-size: 200% 200% !important;` : "";

                    textCss = `
                        background-image: linear-gradient(90deg, ${color.hex}, ${nextColor.hex}, ${color.hex}) !important;
                        background-clip: text !important;
                        -webkit-background-clip: text !important;
                        color: transparent !important;
                        font-weight: 800 !important;
                        ${rainbowAnim}
                        filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, ${shadowOp}));
                    `;
                }


                let autoLucideId = "";
                let autoIconContent = "";
                let isEmoji = false;

                if (this.settings.autoIcons) {
                    const data = this.plugin.iconManager.getAutoIconData(child.name);
                    if (data) {
                        if (data.lucide) autoLucideId = data.lucide;
                        if (data.emoji) {
                            autoIconContent = `'${data.emoji}'`;
                            isEmoji = true;
                        }
                    }
                }

                if (activeStyle && activeStyle.iconId) { // Folder custom icon set
                    const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${activeStyle.iconId}`) &&
                        !obsidian.getIconIds?.().includes(activeStyle.iconId) &&
                        !this.settings.customIcons[activeStyle.iconId];
                    if (isCustomEmoji) {
                        cssRules.push(`
                            body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                                content: "${activeStyle.iconId} " !important;
                                -webkit-mask-image: none !important;
                                background-image: none !important;
                            }
                        `);
                        if (nnActive) {
                            cssRules.push(`
                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before {
                                    content: "${activeStyle.iconId} " !important;
                                }
                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavIconSelector()} {
                                    display: none !important;
                                }
                            `);
                        }
                    } else {
                        // Custom/Selected Icon rendering is now handled by DOM Injection (IconManager)
                        // But only if it's a manual override (activeStyle.iconId)
                        const isManualCustom = !!(activeStyle && activeStyle.iconId);
                        
                        if (isManualCustom) {
                            cssRules.push(`
                                body [data-path="${safePath}"] .nav-folder-title-content::before,
                                body [data-path="${safePath}"] .tree-item-inner::before,
                                body [data-path="${safePath}"].nav-folder-title .nav-folder-title-content::before,
                                body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                    display: none !important;
                                    content: none !important;
                                }
                            `);
                        } else if (autoLucideId) {
                            // Auto SVG icon (handled here via masking)
                            const svgStr = this.plugin.iconManager.getIconSvg(autoLucideId, true);
                            if (svgStr) {
                                cssRules.push(`
                                    body [data-path="${safePath}"] .nav-folder-title-content::before,
                                    body [data-path="${safePath}"] .tree-item-inner::before,
                                    body [data-path="${safePath}"].nav-folder-title .nav-folder-title-content::before,
                                    body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                        content: '' !important;
                                        display: inline-block !important;
                                        width: ${folderIconW}px !important;
                                        height: ${folderIconW}px !important;
                                        background-color: ${text} !important;
                                        -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                        -webkit-mask-repeat: no-repeat !important;
                                        -webkit-mask-position: center !important;
                                        -webkit-mask-size: contain !important;
                                        margin-right: 6px !important;
                                        vertical-align: middle !important;
                                        opacity: 0.85 !important;
                                    }
                                `);
                            }
                        }
                    }
                } else if (autoLucideId) {
                    const svgStr = this.plugin.iconManager.getIconSvg(autoLucideId, true);
                    if (svgStr) {
                        cssRules.push(`
                            body [data-path="${safePath}"] .nav-folder-title-content::before,
                            body [data-path="${safePath}"] .tree-item-inner::before,
                            body [data-path="${safePath}"].nav-folder-title .nav-folder-title-content::before,
                            body [data-path="${safePath}"].tree-item-self .tree-item-inner::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: ${folderIconW}px !important;
                                height: ${folderIconW}px !important;
                                background-color: ${text} !important;
                                -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: middle !important;
                                opacity: 0.85 !important;
                            }
                        `);
                        if (nnActive) {
                            cssRules.push(`
                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before {
                                    content: '' !important;
                                    display: inline-block !important;
                                    width: ${folderIconW}px !important;
                                    height: ${folderIconW}px !important;
                                    background-color: ${textNN} !important;
                                    -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                    vertical-align: middle !important;
                                    opacity: ${wideOpacity} !important;
                                }

                                ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavIconSelector()} {
                                    display: none !important;
                                }
                            `);
                        }
                    }
                } else if (isEmoji) {
                    cssRules.push(`
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: ${autoIconContent} !important;
                        }
                    `);
                    if (nnActive) {
                        cssRules.push(`
                            ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()}::before {
                                content: ${autoIconContent} !important;
                            }
                            ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavIconSelector()} {
                                display: none !important;
                            }
                        `);
                    }
                } else if (this.settings.autoIcons) {
                    cssRules.push(`
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: '' !important;
                            display: inline-block !important;
                            width: ${folderIconW}px !important;
                            height: ${folderIconW}px !important;
                            background-color: ${activeStyle?.iconColor || color.hex || text} !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            margin-right: 6px !important;
                            vertical-align: middle !important;
                            opacity: 0.8 !important;
                        }

                        body .nav-folder.is-collapsed > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item.is-collapsed > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FOLDER_CLOSED))}") !important;
                        }

                        body .nav-folder:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(decodeURIComponent(CF_FOLDER_OPEN))}") !important;
                        }
                    `);
                }

                cssRules.push(`
                    .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem),
                    .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file) {
                        background-color: ${bg} !important;
                        opacity: 1.0 !important;
                        border-radius: 6px;
                        ${glassCss}
                        transition: background-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
                    }
                `);
                if (nnActive) {
                    cssRules.push(`
                        ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} {
                        background-color: ${bgNN} !important;
                        border-radius: 4px !important;
                        ${glassCss}
                        ${tintOp > 0 ? `background-blend-mode: overlay;` : ''}
                        transition: background-color 0.2s ease, filter 0.2s ease !important;
                    }
                `);
                }

                cssRules.push(`
                    .nav-folder-title[data-path="${safePath}"] + .nav-folder-content {
                        ${tintOp > 0 ? `background-color: rgba(${color.rgb}, ${tintOp}) !important;` : ''}
                        border-left: 2px solid rgba(${color.rgb}, 0.25) !important;
                        margin-left: 11px;
                        padding-left: 4px;
                        transition: border-left-color 0.2s ease;
                    }

                    body .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"],
                    body .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"] {
                        opacity: 1.0 !important;
                        filter: brightness(1.1);
                        --cf-active-border: rgba(${color.rgb}, 0.8);
                        ${this.settings.activeGlow ? `
                            box-shadow: 0 0 8px rgba(${color.rgb}, 0.1) !important;
                            z-index: 1;
                            --cf-rgb: ${passedColor ? passedColor.rgb : color.rgb};
                            ${this.settings.animateActivePath ? (
                            animStyle === "pulse" ? `animation: cf-breathe-glow ${animDur}s infinite ease-in-out;` :
                                animStyle === "neon" ? `animation: cf-neon-flicker ${animDur}s infinite alternate;` :
                                    `animation: cf-shimmer-glow ${animDur}s infinite linear;`
                        ) : ""}
                        ` : ""}
                    }

                    body .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"] + .nav-folder-children,
                    body .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"] + .tree-item-children {
                        border-left-color: rgba(${color.rgb}, 0.8) !important;
                        border-left-width: 2px !important;
                    }

                    body .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content,
                    body .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file) .tree-item-inner {
                        ${textCss}
                    }
                `);

                if (nnActive) {
                    cssRules.push(`
                        ${NotebookNavigatorIntegration.getScopedNavSelector(child.path)} ${NotebookNavigatorIntegration.getNavNameSelector()} {
                            ${textCssNN}
                        }
                    `);
                }

                cssRules.push(`
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-collapse-indicator svg,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-collapse-indicator svg {
                        color: ${activeStyle?.iconColor || color.hex} !important;
                    }

                    body:not(.is-mobile) .nav-folder-title[data-path="${safePath}"]:hover,
                    body:not(.is-mobile) .tree-item-self[data-path="${safePath}"]:hover {
                        filter: brightness(1.2);
                        ${this.settings.glassmorphism ? 'backdrop-filter: blur(12px) saturate(150%);' : ''}
                    }
                `);

                if (nnActive) {
                    cssRules.push(`
                        body:not(.is-mobile) .notebook-navigator [data-path="${safePath}"]:hover {
                            filter: brightness(1.2);
                            ${this.settings.glassmorphism ? 'backdrop-filter: blur(12px) saturate(150%);' : ''}
                        }
                    `);
                }


                if (this.settings.showItemCounters) {
                    const counts = countItems(child);
                    const totalWidth = 80;
                    const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
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
                            align-items: center !important;
                            width: ${totalWidth}px !important;
                            min-width: ${totalWidth}px !important;
                            height: 20px !important;
                            margin-left: auto !important;
                            flex-shrink: 0 !important;
                            pointer-events: none !important;
                            opacity: 0.8 !important;
                        }

                        /* Make right-side labels (tags, extensions, counts, etc.) bold, themed, and correctly aligned */
                        [data-path="${safePath}"] .nav-file-tag,
                        [data-path="${safePath}"] .nav-folder-tag,
                        [data-path="${safePath}"] .tree-item-flair,
                        [data-path="${safePath}"] .nav-file-note-count,
                        [data-path="${safePath}"] .nav-folder-note-count,
                        [data-path="${safePath}"] .tag-count,
                        [data-path="${safePath}"] .nav-file-extension {
                            font-weight: 900 !important;
                            font-size: 11px !important;
                            color: ${activeStyle?.textColor || color.hex} !important;
                            margin-left: auto !important;
                            display: inline-flex !important;
                            align-items: center !important;
                        }
                    `);
                } else {
                    // Even if counters are off, make other labels bold if they exist
                    cssRules.push(`
                        [data-path="${safePath}"] .nav-file-tag,
                        [data-path="${safePath}"] .nav-folder-tag,
                        [data-path="${safePath}"] .tree-item-flair,
                        [data-path="${safePath}"] .nav-file-note-count,
                        [data-path="${safePath}"] .nav-folder-note-count,
                        [data-path="${safePath}"] .tag-count,
                        [data-path="${safePath}"] .nav-file-extension {
                            font-weight: 900 !important;
                            font-size: 11px !important;
                            color: ${activeStyle?.textColor || color.hex} !important;
                            margin-left: auto !important;
                            display: inline-flex !important;
                            align-items: center !important;
                        }
                    `);
                }



                const nextInherited = activeStyle?.applyToSubfolders ? activeStyle : inheritedStyle;
                traverse(child, depth + 1, i, (depth === 0 ? i : rootIndex), color, nextInherited);
            }
        };

        if (this.settings.showFileDivider || Object.values(this.settings.customFolderColors).some((v) => typeof v === 'object' && v !== null && (v).hasDivider)) {
            const spacing = this.settings.dividerSpacing || 16;
            const dividerHeight = (spacing * 2) + 20; // estimate total reserved height

            cssRules.push(`
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
                    transition: transform 0.2s ease, filter 0.2s ease !important;
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
                    transform: translateY(-1px);
                    border-color: rgba(var(--mono-rgb-100), 0.3) !important;
                }
                .cf-interactive-divider:active {
                    transform: scale(0.98);
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
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
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
                    transition: transform 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6) !important;
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
                    border-left: none !important; /* Optionally remove the top-level border that hits the divider */
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
            `);
        }

        traverse(root, 0, 0, 0);

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
                        transition: opacity 0.3s ease, filter 0.3s ease !important;
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
