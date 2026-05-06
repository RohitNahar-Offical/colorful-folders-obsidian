import { ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin } from '../common/types';
import { PALETTES } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, parseCustomPalette, hashString } from '../common/utils';
import * as obsidian from 'obsidian';

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

    generateStyleData(): Map<string, any> {
        const styleMap = new Map<string, any>();
        const root = this.app.vault.getRoot();
        if (!root) return styleMap;

        const isDark = this.isDarkMode();
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;
        
        const activeFile = this.app.workspace.getActiveFile();
        const activePath = activeFile ? activeFile.path : "";

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

        const excludeFolders = (this.settings.exclusionList || "")
            .split(',')
            .map((s: string) => s.trim().toLowerCase())
            .filter((s: string) => s.length > 0);

        const rootBgStyle = this.settings.rootStyle;
        const subOp = this.settings.subfolderOpacity;
        const rootOp = this.settings.rootOpacity !== undefined ? this.settings.rootOpacity : 0.548;
        const cycleOff = this.settings.cycleOffset || 0;

        let heatmapData: Map<string, number> = new Map();
        if (this.settings.colorMode === "heatmap") {
            if (this.plugin.heatmapCache && this.plugin.heatmapCache.size > 0) {
                heatmapData = this.plugin.heatmapCache;
            } else {
                const files = this.app.vault.getFiles();
                for (const f of files) {
                    let p = f.parent;
                    const mtime = f.stat.mtime;
                    while (p) {
                        if ((heatmapData.get(p.path) || 0) < mtime) heatmapData.set(p.path, mtime);
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
            if (diffDays <= 1) return currentPalette[0];
            if (diffDays <= 3) return currentPalette[Math.min(2, currentPalette.length - 1)];
            if (diffDays <= 7) return currentPalette[Math.min(7, currentPalette.length - 1)];
            if (diffDays <= 15) return currentPalette[Math.min(4, currentPalette.length - 1)];
            if (diffDays <= 30) return currentPalette[Math.min(10, currentPalette.length - 1)];
            return currentPalette[currentPalette.length - 1];
        };

        const traverse = (folder: obsidian.TFolder, depth: number, validIndex = 0, rootIndex = 0, passedColor: { rgb: string, hex: string } | null = null, inheritedStyle: FolderStyle | null = null) => {
            const copyFolders = folder.children
                .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                .sort((a, b) => a.name.localeCompare(b.name));

            const copyFiles = folder.children
                .filter((c): c is obsidian.TFile => c instanceof obsidian.TFile)
                .sort((a, b) => a.name.localeCompare(b.name));

            // Files
            for (let i = 0; i < copyFiles.length; i++) {
                const child = copyFiles[i];
                let color: { rgb: string, hex: string };
                const fileStyle = this.plugin.getStyle(child.path);
                
                if (fileStyle && fileStyle.hex) {
                    const customParsed = parseCustomPalette(fileStyle.hex);
                    const cObj = hexToRgbObj(fileStyle.hex);
                    color = customParsed ? customParsed[0] : (cObj ? { rgb: `${cObj.r}, ${cObj.g}, ${cObj.b}`, hex: fileStyle.hex } : currentPalette[(validIndex + i) % currentPalette.length]);
                } else if (inheritedStyle && inheritedStyle.applyToFiles && passedColor) {
                    color = passedColor;
                } else if (this.settings.colorMode === "heatmap") {
                    color = getHeatmapColor(child.stat.mtime);
                } else if (this.settings.autoColorFiles) {
                    const nameHash = hashString(child.name);
                    color = currentPalette[(validIndex + nameHash + cycleOff) % currentPalette.length];
                } else {
                    color = passedColor || { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" };
                }

                const autoIconFile = (this.settings.autoIcons && !fileStyle?.iconId && !(inheritedStyle?.applyToFiles && inheritedStyle?.iconId)) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
                const iconId = fileStyle?.iconId || (inheritedStyle?.applyToFiles ? inheritedStyle.iconId : null) || (autoIconFile ? (this.settings.wideAutoIcons ? autoIconFile.lucide : autoIconFile.emoji) : "");

                styleMap.set(child.path, {
                    rgb: color.rgb,
                    hex: color.hex,
                    iconId: iconId,
                    opacity: fileStyle?.opacity !== undefined ? fileStyle.opacity : (isDark ? 0.1 : 0.15),
                    textColor: fileStyle?.textColor || (inheritedStyle?.applyToFiles ? inheritedStyle.textColor : ""),
                    isBold: fileStyle?.isBold !== undefined ? fileStyle.isBold : (inheritedStyle?.applyToFiles ? inheritedStyle.isBold : false),
                    isItalic: fileStyle?.isItalic !== undefined ? fileStyle.isItalic : (inheritedStyle?.applyToFiles ? inheritedStyle.isItalic : false),
                    isActive: child.path === activePath,
                    isFocusMode: this.settings.focusMode,
                    isRadiant: activePath && (activePath === child.path || activePath.startsWith(child.path + "/"))
                });
            }

            // Folders
            for (let i = 0; i < copyFolders.length; i++) {
                const child = copyFolders[i];
                if (excludeFolders.includes(child.name.toLowerCase())) {
                    traverse(child, depth + 1, i, (depth === 0 ? i : rootIndex), passedColor, inheritedStyle);
                    continue;
                }

                let color: { rgb: string, hex: string };
                const customStyle = this.plugin.getStyle(child.path);
                const activeStyle = customStyle || inheritedStyle;

                if (customStyle && customStyle.hex) {
                    const customParsed = parseCustomPalette(customStyle.hex);
                    const cObj = hexToRgbObj(customStyle.hex);
                    color = customParsed ? customParsed[0] : (cObj ? { rgb: `${cObj.r}, ${cObj.g}, ${cObj.b}`, hex: customStyle.hex } : currentPalette[(i + depth + rootIndex + cycleOff) % currentPalette.length]);
                } else if (inheritedStyle && passedColor) {
                    color = passedColor;
                } else if (this.settings.colorMode === "heatmap") {
                    color = getHeatmapColor(heatmapData.get(child.path) || 0);
                } else if (this.settings.colorMode === "monochromatic") {
                    color = depth === 0 ? currentPalette[(i + cycleOff) % currentPalette.length] : (passedColor || currentPalette[0]);
                } else {
                    color = currentPalette[(i + depth + rootIndex + cycleOff) % currentPalette.length];
                }

                const op = (activeStyle && activeStyle.opacity !== undefined) ? activeStyle.opacity : (depth === 0 ? rootOp : subOp);
                
                let rainbowGradient = "";
                if (this.settings.rainbowRootText && depth === 0 && !customStyle?.textColor) {
                    const nextColor = currentPalette[(i + 1) % currentPalette.length];
                    rainbowGradient = `linear-gradient(90deg, ${color.hex}, ${nextColor.hex}, ${color.hex})`;
                }

                const autoIconFolder = (this.settings.autoIcons && !customStyle?.iconId && !inheritedStyle?.iconId) ? this.plugin.iconManager.getAutoIconData(child.name) : null;
                const iconId = customStyle?.iconId || inheritedStyle?.iconId || (autoIconFolder ? (this.settings.wideAutoIcons ? autoIconFolder.lucide : autoIconFolder.emoji) : "");

                styleMap.set(child.path, {
                    rgb: color.rgb,
                    hex: color.hex,
                    iconId: iconId,
                    opacity: op,
                    textColor: customStyle?.textColor || (inheritedStyle?.textColor || ""),
                    isBold: customStyle?.isBold !== undefined ? customStyle.isBold : (inheritedStyle?.isBold !== undefined ? inheritedStyle.isBold : true),
                    isItalic: customStyle?.isItalic !== undefined ? customStyle.isItalic : (inheritedStyle?.isItalic !== undefined ? inheritedStyle.isItalic : false),
                    isActive: child.path === activePath,
                    isFocusMode: this.settings.focusMode,
                    isRadiant: activePath && (activePath === child.path || activePath.startsWith(child.path + "/")),
                    rainbowGradient: rainbowGradient,
                    isGlass: this.settings.glassmorphism
                });

                traverse(child, depth + 1, i, (depth === 0 ? i : rootIndex), color, activeStyle && activeStyle.applyToSubfolders ? activeStyle : null);
            }
        };

        traverse(root, 0);
        return styleMap;
    }
}
