import * as obsidian from 'obsidian';
import { EffectiveStyle, FolderStyle, IColorfulFoldersPlugin } from '../common/types';
import { ColorResolver, getCurrentPalette, isDarkMode } from './ColorResolver';
import { anyToHex, hexToRgbObj, parseCustomPalette } from '../common/utils';

export class StyleResolver {
    public static getStyle(plugin: IColorfulFoldersPlugin, path: string): FolderStyle | null {
        const style = plugin.settings.customFolderColors[path];
        if (!style) return null;
        if (typeof style === "string") return { hex: style };
        return style;
    }

    public static getEffectiveStyle(target: obsidian.TAbstractFile, plugin: IColorfulFoldersPlugin): EffectiveStyle {
        try {
            const isDark = isDarkMode();
            const brightnessAmount =
                (isDark
                    ? plugin.settings.darkModeBrightness
                    : plugin.settings.lightModeBrightness) / 100;
            const cycleOff = plugin.settings.cycleOffset || 0;

            if (!plugin.activePaletteCache) {
                plugin.activePaletteCache = getCurrentPalette(plugin.settings, null, "");
            }
            const palette = plugin.activePaletteCache.palette;

            const isFile = target instanceof obsidian.TFile;
            const path = target.path;

            const getStyle = (p: string) => {
                const style = plugin.settings.customFolderColors[p];
                if (!style) return null;
                if (typeof style === "string") return { hex: style };
                return style;
            };

            let customStyle = getStyle(path);

            let inheritedStyle: FolderStyle | null = null;
            let parent = target.parent;
            while (parent && !parent.isRoot()) {
                const pStyle = getStyle(parent.path);
                if (
                    pStyle &&
                    ((!isFile && pStyle.applyToSubfolders) || (isFile && pStyle.applyToFiles))
                ) {
                    inheritedStyle = pStyle;
                    break;
                }
                parent = parent.parent;
            }

            const segments = path.split("/").filter((s) => s.length > 0);
            const depth = segments.length - 1;

            if (!plugin.parsedExclusionList) {
                plugin.parsedExclusionList = new Set(
                    (plugin.settings.exclusionList || "")
                        .toLowerCase()
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                );
            }
            const excludeFolders = plugin.parsedExclusionList;

            const parentFolder = target.parent;
            let validIndex = 0;
            if (parentFolder) {
                const getFolderIndex = (folder: obsidian.TFolder): number => {
                    if (!folder.parent) return 0;
                    if (!plugin.folderSortCache) plugin.folderSortCache = new Map();
                    if (plugin.folderSortCache.has(folder.path)) return plugin.folderSortCache.get(folder.path) || 0;
                    
                    const siblings = folder.parent.children
                        .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                        .filter((c) => !c.name.startsWith('.'))
                        .filter((c) => !excludeFolders.has(c.name.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name));
                    
                    siblings.forEach((s, idx) => plugin.folderSortCache.set(s.path, idx));
                    return plugin.folderSortCache.get(folder.path) || 0;
                };
                
                validIndex = getFolderIndex(isFile ? parentFolder : target as obsidian.TFolder);
            }

            let rootIndex = 0;
            if (depth > 0) {
                const rootFolder = plugin.app.vault.getRoot();
                const rootSegment = segments[0];
                
                if (!plugin.rootSortCache) plugin.rootSortCache = new Map();
                if (plugin.rootSortCache.has(rootSegment)) {
                    rootIndex = plugin.rootSortCache.get(rootSegment) || 0;
                } else {
                    const rootSiblings = rootFolder.children
                        .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                        .filter((c) => !c.name.startsWith('.'))
                        .filter((c) => !excludeFolders.has(c.name.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name));
                        
                    rootSiblings.forEach((s, idx) => plugin.rootSortCache.set(s.name, idx));
                    rootIndex = plugin.rootSortCache.get(rootSegment) || 0;
                }
            }

            const heatmapCache = plugin.heatmapCache || new Map<string, number>();
            const heatmapMtime = target instanceof obsidian.TFile ? target.stat.mtime : (heatmapCache.get(path) || 0);

            const isNNActive =
                plugin.settings.notebookNavigatorSupport &&
                plugin.settings.notebookNavigatorFileBackground;

            const parentFolderForFile = isFile ? parentFolder : null;
            let passedColor: { rgb: string; hex: string } | null = null;
            if (inheritedStyle?.hex) {
                const cp = parseCustomPalette(inheritedStyle.hex);
                const rgb = hexToRgbObj(inheritedStyle.hex);
                passedColor = cp ? cp[0] : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: inheritedStyle.hex } : null);
            } else if (isFile && parentFolderForFile && !parentFolderForFile.isRoot()) {
                const parentStyle = getStyle(parentFolderForFile.path);
                if (parentStyle?.hex) {
                    const cp = parseCustomPalette(parentStyle.hex);
                    const rgb = hexToRgbObj(parentStyle.hex);
                    passedColor = cp ? cp[0] : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: parentStyle.hex } : null);
                }
            }

            const color = ColorResolver.resolveColor(
                path,
                target.name,
                isFile,
                depth,
                validIndex,
                rootIndex,
                customStyle,
                inheritedStyle,
                passedColor,
                plugin.settings.colorMode,
                cycleOff,
                palette,
                heatmapMtime,
                plugin.settings.globalBackgroundColor || "",
                plugin.settings.autoColorFiles,
                isNNActive
            );

            const op = ColorResolver.resolveOpacity(
                isFile,
                depth,
                customStyle,
                inheritedStyle,
                plugin.settings.fileBackgroundOpacity,
                plugin.settings.rootOpacity,
                plugin.settings.subfolderOpacity,
                plugin.settings.rootStyle,
                plugin.settings.autoColorFiles,
                isNNActive,
                isDark
            );

            const effText = ColorResolver.resolveTextColor(
                isFile,
                depth,
                color.hex,
                color.rgb,
                customStyle,
                inheritedStyle,
                isDark,
                brightnessAmount,
                plugin.settings.rootStyle,
                plugin.settings.outlineOnly,
                (isFile ? (inheritedStyle?.applyToFiles || plugin.settings.autoColorFiles || !!plugin.settings.globalBackgroundColor || isNNActive) : true) || passedColor !== null
            );

            const effIconColor =
                customStyle?.iconColor ??
                inheritedStyle?.iconColor ??
                color.hex;

            const autoIcon = plugin.iconManager.getAutoIconData(target.name, target.path);
            let iconId = "";
            if (customStyle?.iconId) {
                iconId = customStyle.iconId;
            } else if (plugin.settings.autoIcons && autoIcon) {
                const lucideId = autoIcon.lucide;
                const isCustom = lucideId.includes('-') && !lucideId.startsWith('lucide-');
                if (isCustom && (!plugin.settings.customIcons || !plugin.settings.customIcons[lucideId])) {
                    iconId = autoIcon.emoji;
                } else {
                    iconId = plugin.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji;
                }
            }

            return {
                hex: anyToHex(color.hex),
                textColor: effText ? anyToHex(effText) : "",
                iconColor: anyToHex(effIconColor || color.hex),
                iconId: iconId,
                expandedIconId: customStyle?.expandedIconId || "",
                opacity: op,
                isBold:
                    customStyle?.isBold !== undefined
                        ? !!customStyle.isBold
                        : inheritedStyle?.isBold !== undefined
                            ? !!inheritedStyle.isBold
                            : !isFile,
                isItalic:
                    customStyle?.isItalic !== undefined
                        ? !!customStyle.isItalic
                        : inheritedStyle?.isItalic !== undefined
                            ? !!inheritedStyle.isItalic
                            : false,
                applyToSubfolders: !!customStyle?.applyToSubfolders,
                applyToFiles: !!customStyle?.applyToFiles,
            };
        } catch (e) {
            console.error("Colorful Folders: Failed to resolve getEffectiveStyle", e);
            return {
                hex: "#ffffff",
                textColor: "#000000",
                iconColor: "#000000",
                iconId: "",
                expandedIconId: "",
                opacity: 1,
                isBold: true,
                isItalic: false,
                applyToSubfolders: false,
                applyToFiles: false,
            };
        }
    }
}
