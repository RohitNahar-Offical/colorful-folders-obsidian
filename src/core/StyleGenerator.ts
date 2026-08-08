import { AutoIconData, ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { PALETTES, CF_FOLDER_CLOSED, CF_FOLDER_OPEN } from '../common/constants';
import { hexToRgbObj, safeEscape } from '../common/utils';
import * as obsidian from 'obsidian';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { TagColorSync } from '../integrations/TagColorSync';

import { countItems } from '../common/VaultUtils';
import { isDarkMode, getCurrentPalette, ColorResolver } from './ColorResolver';
import { generateGlobalBaseCss, generateDividerCss, generateStealthCss } from './BaseCssGenerator';
import { CssGrouper } from './CssGrouper';
import { StyleResolver } from './StyleResolver';
import { RainbowManager } from './RainbowManager';

export class StyleGenerator {
    plugin: IColorfulFoldersPlugin;
    settings: ColorfulFoldersSettings;
    app: obsidian.App;

    private static readonly CF_FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; opacity: 0.85;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    private static readonly SPACED_TEXT_CSS = `
        letter-spacing: 1px !important;
        word-spacing: 2px !important;
    `;

    private _pathEscapeCache = new Map<string, string>();
    private _cachedGlobalBaseCss: { key: string; css: string } | null = null;
    private _cachedDividerCss: { key: string; css: string } | null = null;
    private _cachedStealthCss: { key: string; css: string } | null = null;

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

    private getSafeEscape(path: string): string {
        let escaped = this._pathEscapeCache.get(path);
        if (escaped === undefined) {
            escaped = safeEscape(path);
            this._pathEscapeCache.set(path, escaped);
        }
        return escaped;
    }












    private _iconValidityCache = new Map<string, boolean>();

    private isValidIconStr(id: string | null | undefined): boolean {
        if (!id) return false;
        const cached = this._iconValidityCache.get(id);
        if (cached !== undefined) return cached;
        let isValid = false;
        if (this.plugin.iconManager.isEmojiIcon(id)) {
            isValid = true;
        } else {
            const svg = this.plugin.iconManager.getIconSvg(id, false);
            isValid = !!svg && svg.length > 0;
        }
        this._iconValidityCache.set(id, isValid);
        return isValid;
    }

    private resolveAutoIconCandidate(data: AutoIconData | null): string {
        if (!data) return "";
        if (this.settings.wideAutoIcons) {
            if (data.lucide && this.isValidIconStr(data.lucide)) return data.lucide;
            if (data.emoji) return data.emoji;
            if (data.lucide) return data.lucide;
        } else {
            if (data.emoji) return data.emoji;
            if (data.lucide && this.isValidIconStr(data.lucide)) return data.lucide;
            if (data.lucide) return data.lucide;
        }
        return "";
    }

    private prepareContext(): StyleContext | null {
        const root = this.app.vault.getRoot();
        if (!root) return null;

        const isDark = isDarkMode();
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;

        const iconScale = this.settings.iconScale || 1.0;
        const wideScale = this.settings.wideAutoIcons ? 1.05 : 1.0;
        const folderIconW = `calc(1.3em * ${iconScale * wideScale})`;
        const effFileIconW = `calc(1.3em * ${iconScale * wideScale})`;
        const nnIconScale = this.settings.notebookNavigatorIconScale ?? 1.0;
        const nnIconW = `calc(1.1em * ${nnIconScale * wideScale})`;

        const cpRes = getCurrentPalette(this.settings, this._cachedPalette, this._cachedPaletteKey);
        const currentPalette = cpRes.palette;
        this._cachedPalette = currentPalette;
        this._cachedPaletteKey = cpRes.newKey;

        const excludeFolders = this.plugin.parsedExclusionList || new Set<string>();

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
                    if (f.path.startsWith('.') || f.path.includes('/.')) continue;
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




    getStyle(path: string): FolderStyle | null {
        return StyleResolver.getStyle(this.plugin, path);
    }





    private async traverse(folder: obsidian.TFolder, depth: number, validIndex: number, rootIndex: number, passedColor: { rgb: string, hex: string } | null, inheritedStyle: FolderStyle | null, context: StyleContext, grouper: CssGrouper, cumulativeTintOp: number = 0, yieldState: { lastYield: number }) {
        const copyFolders: obsidian.TFolder[] = [];
        const copyFiles: obsidian.TFile[] = [];
        for (let i = 0; i < folder.children.length; i++) {
            const child = folder.children[i];
            
            // Exclude hidden folders and files (like .smart-env, .git, .obsidian)
            if (child.name.startsWith('.')) continue;

            if (child instanceof obsidian.TFolder) {
                copyFolders.push(child);
            } else if (child instanceof obsidian.TFile) {
                copyFiles.push(child);
            }
        }
        copyFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        copyFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

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
        const autoColorFiles = outlineOnly ? false : this.settings.autoColorFiles;
        const autoIcons = this.settings.autoIcons;
        const baseThick = this.settings.pathLineThickness ?? 2.0;
        const folderThick = baseThick + 0.5;
        const activeFolderThick = baseThick + 2.0;
        const CF_FILE_TEXT_ICON = StyleGenerator.CF_FILE_TEXT_ICON;
        const extraTypographyCssFiles = (this.settings.spacedTextMode === 'both' || this.settings.spacedTextMode === 'files') ? StyleGenerator.SPACED_TEXT_CSS : '';
        const extraTypographyCssFolders = (this.settings.spacedTextMode === 'both' || this.settings.spacedTextMode === 'folders') ? StyleGenerator.SPACED_TEXT_CSS : '';

        // Process Files
        for (const child of copyFiles) {
                const fileStyle = this.getStyle(child.path);
                const hasCustomStyle = !!(fileStyle && (fileStyle.hex || fileStyle.iconId || fileStyle.iconColor || fileStyle.textColor || fileStyle.isBold || fileStyle.isItalic));
                const hasInherited = !!(inheritedStyle && inheritedStyle.applyToFiles);
                const needsProcessing = hasCustomStyle || hasInherited || autoColorFiles || autoIcons || (passedColor !== null) || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground) || !!this.settings.globalBackgroundColor;

                if (!needsProcessing) {
                    continue;
                }



                const safePath = this.getSafeEscape(child.path);
                const parentName = child.parent?.name;
                const isFolderNote = !!(parentName && (child.basename === parentName || child.basename === 'index' || child.basename === '_about_'));
                const color = ColorResolver.resolveColor(
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
                    this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground,
                    this.settings.fileColorMode
                );

                const hasExplicitFileOpacity = fileStyle?.opacity !== undefined && fileStyle.opacity > 0;
                const shouldColorNative = this.settings.autoColorFiles || hasExplicitFileOpacity;
                const shouldColorNN = (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground) || hasExplicitFileOpacity;

                const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);
                const iconColor = fileStyle?.iconColor || (inheritedStyle?.applyToFiles && inheritedStyle.iconColor) || null;

                const op = ColorResolver.resolveOpacity(
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

                // Custom User Rules take top priority over saved data.json AI icons
                const customUserRuleFile = this.plugin.iconManager.getAutoIconData(child.name, child.path);
                const isUserCustomRuleFileMatch = customUserRuleFile && (customUserRuleFile.packSource === 'custom-rule' || customUserRuleFile.isCustom);

                let iconId = "";
                if (isUserCustomRuleFileMatch && customUserRuleFile) {
                    iconId = this.resolveAutoIconCandidate(customUserRuleFile);
                } else {
                    const rawFileIcon = (fileStyle?.iconId && this.isValidIconStr(fileStyle.iconId)) ? fileStyle.iconId : null;
                    const rawInheritedFileIcon = (inheritedStyle?.applyToFiles && inheritedStyle?.iconId && this.isValidIconStr(inheritedStyle.iconId)) ? inheritedStyle.iconId : null;
                    const autoIconFile = (this.settings.autoIcons && !rawFileIcon && !rawInheritedFileIcon) ? customUserRuleFile : null;
                    iconId = rawFileIcon || rawInheritedFileIcon || this.resolveAutoIconCandidate(autoIconFile);
                }

                const textNative = ColorResolver.resolveTextColor(
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
                    this.settings.colorText === 'all' || this.settings.colorText === 'files' || this.settings.colorText === true || this.settings.colorText === undefined
                );

                const textNN = textNative;

                const isBold = fileStyle?.isBold !== undefined ? fileStyle.isBold : (inheritedStyle?.applyToFiles ? inheritedStyle.isBold : false);
                const isItalic = fileStyle?.isItalic !== undefined ? fileStyle.isItalic : (inheritedStyle?.applyToFiles ? inheritedStyle.isItalic : false);

                const fileBgAlpha = op;

                const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
                const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : textNative;

                let fileRowCss = `
                    ${shouldColorNative ? `
                        background-color: var(--cf-file-bg, rgba(${color.rgb}, ${fileBgAlpha})) !important;
                        --nav-item-background: var(--cf-file-bg, rgba(${color.rgb}, ${fileBgAlpha}));
                        border-left: ${baseThick}px solid rgba(${color.rgb}, 0.4) !important;
                        --cf-selection-bg: rgba(${color.rgb}, ${Math.min(1.0, fileBgAlpha + 0.15)});
                    ` : `
                        background-color: var(--cf-file-bg, transparent) !important;
                        --nav-item-background: var(--cf-file-bg, transparent);
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
                    ${extraTypographyCssFiles}
                `;

                if (activeStyle && activeStyle.textGradient && activeStyle.textColor && activeStyle.textGradientEnd) {
                    const stops = RainbowManager.resolveCustomStops(activeStyle.textColor, activeStyle.textGradientEnd, activeStyle.rainbowBrightness, isDark);
                    fileTextCss = RainbowManager.buildGradientCss(stops, {
                        angle: this.settings.rainbowGradientAngle ?? 90,
                        isDark,
                        isBold,
                        isItalic,
                        extraCss: extraTypographyCssFiles
                    });
                }

                const fileRowSels = [
                    `.nav-file-title[data-cf-path="${safePath}"]:not(.nn-file)`,
                    `.tree-item-self[data-cf-path="${safePath}"]:not(.nn-file):not(.nn-navitem)`,
                    `.nav-file-title[data-path="${safePath}"]:not(.nn-file)`,
                    `.tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem)`
                ];
                grouper.add(fileRowCss, fileRowSels, `fileRow_${color.hex}_${fileBgAlpha}_${shouldColorNative ? 1 : 0}_${baseThick}`);

                const fileTextSels = [
                    `.nav-file-title[data-cf-path="${safePath}"]:not(.nn-file) .nav-file-title-content`,
                    `.tree-item-self[data-cf-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner`,
                    `.nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content`,
                    `.tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner`
                ];
                grouper.add(fileTextCss, fileTextSels, `fileText_${activeStyle?.textGradient ? 'grad' : 'norm'}_${isBold}_${isItalic}_${color.hex}`);

                const fileTagSels = [
                    `[data-cf-path="${safePath}"] .nav-file-tag`,
                    `[data-path="${safePath}"] .nav-file-tag`,
                    `[data-path="${safePath}"] .tree-item-flair`
                ];
                grouper.add(`
                    background-color: var(--cf-tag-bg, rgba(${color.rgb}, 0.15)) !important;
                    color: var(--cf-tag-color, ${textNative}) !important;
                    font-size: 10px !important;
                `, fileTagSels, `fileTag_${color.hex}`);

                if (nnFileBgActive) {
                    const isEmoji = this.plugin.iconManager.isEmojiIcon(iconId);
                    const iconSvg = !isEmoji && iconId ? this.plugin.iconManager.getIconSvg(iconId, true) : "";

                    NotebookNavigatorIntegration.generateIntegratedStyles(
                        grouper,
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
                    );
                }

                if (iconId) {
                    const isCustomEmoji = this.plugin.iconManager.isEmojiIcon(iconId);

                    if (isCustomEmoji) {
                        grouper.add(`
                            content: "${iconId} " !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            align-self: center !important;
                            flex-shrink: 0 !important;
                            height: ${effFileIconW} !important;
                            width: ${effFileIconW} !important;
                            margin-right: 4px !important;
                        `, fileTextSels.map(s => s + '::before'));
                    } else {
                        const svgStr = this.plugin.iconManager.getIconSvg(iconId, true);
                        if (svgStr) {
                            grouper.add(`
                                content: '' !important;
                                display: inline-flex !important;
                                align-self: center !important;
                                flex-shrink: 0 !important;
                                width: ${effFileIconW} !important;
                                height: ${effFileIconW} !important;
                                margin-right: 4px !important;
                                background-color: ${iconColor || color.hex || textNative} !important;
                                -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(svgStr, true)}") !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                opacity: 0.85 !important;
                             `, fileTextSels.map(s => s + '::before'));
                        }
                    }
                } else if (autoIcons) {
                    grouper.add(`
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
                    `, fileTextSels.map(s => s + '::before'));
                }

                const activeGlowEnabled = this.settings.activeGlow !== false;
                if (isFolderNote) {
                    const parentFolderStyle = this.getStyle(folder.path);
                    const parentFolderColor = passedColor || ColorResolver.resolveColor(
                        folder.path,
                        folder.name,
                        false,
                        depth,
                        depth === 1 ? rootIndex : 0,
                        0,
                        parentFolderStyle,
                        null,
                        null,
                        this.settings.colorMode,
                        cycleOff,
                        currentPalette,
                        0,
                        this.settings.globalBackgroundColor || "",
                        false,
                        false
                    );
                    const parentActiveBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${parentFolderColor.rgb}, ${useGlass ? 0.14 : 0.12})`;
                    const parentActiveText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : (parentFolderStyle?.textColor || parentFolderColor.hex);

                    grouper.add(`
                        background-color: var(--cf-active-bg, ${parentActiveBg}) !important;
                        color: var(--cf-active-color, ${parentActiveText}) !important;
                        outline: 1px solid ${activeGlowEnabled ? `rgba(${parentFolderColor.rgb}, 0.3)` : "transparent"} !important;
                        outline-offset: -1px !important;
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
                    `, [
                        `body .nav-files-container .nav-folder-title.cf-is-active[data-path="${safePath}"]`,
                        `body .nav-files-container .tree-item-self.cf-is-active[data-path="${safePath}"]`
                    ]);

                    grouper.add(`
                        background-color: var(--cf-active-color, ${parentActiveText}) !important;
                    `, [
                        `body .nav-files-container .nav-folder.cf-active-parent > .nav-folder-title[data-path="${safePath}"]::before`,
                        `body .nav-files-container .tree-item.cf-active-parent > .tree-item-self[data-path="${safePath}"]:not(.nn-navitem)::before`
                    ]);

                    if (this.settings.notebookNavigatorSupport) {
                        grouper.add(`
                            background-color: var(--cf-active-bg, ${parentActiveBg}) !important;
                            color: var(--cf-active-color, ${parentActiveText}) !important;
                            border-left: ${activeFolderThick}px solid var(--cf-active-color, ${parentActiveText}) !important;
                            box-sizing: border-box !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                        `, [
                            `.notebook-navigator .nn-navitem.cf-active-parent > .nn-virtual-container[data-path="${safePath}"]`
                        ]);
                    }
                } else {
                    grouper.add(`
                        background-color: var(--cf-active-bg, ${activeBg}) !important;
                        color: var(--cf-active-color, ${activeText}) !important;
                        outline: 1px solid ${activeGlowEnabled ? `rgba(${color.rgb}, 0.3)` : "transparent"} !important;
                        outline-offset: -1px !important;
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
                    `, [
                        `body .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file)`,
                        `body .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file)`
                    ]);

                    // Notebook Navigator Active File Glow (Flat Slot)
                    grouper.add(`
                        background-color: var(--cf-active-bg, ${activeBg}) !important;
                        color: var(--cf-active-color, ${activeText}) !important;
                        border-left: ${activeFolderThick}px solid var(--cf-active-color, ${activeText}) !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    `, [`${NotebookNavigatorIntegration.getScopedFileSelector(child.path)}.is-active`]);

                    grouper.add(`
                        background-color: var(--cf-active-color, ${activeText}) !important;
                    `, [
                        `body .nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file)::before`,
                        `body .nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem)::before`
                    ]);
                }
                // Increment skipped as fileIndex is unused
            }

        // Folder logic — tint is emitted per-child inside the loop below (using child's own color)

        let validFolderIndex = 0;
        for (let i = 0; i < copyFolders.length; i++) {


            const child = copyFolders[i];
            if (excludeFolders.has(child.name.toLowerCase())) {
                await this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), passedColor, inheritedStyle, context, grouper, cumulativeTintOp, yieldState);
                validFolderIndex++;
                continue;
            }

            const customStyle = this.getStyle(child.path);
            const mtime = heatmapData.get(child.path) || 0;
            const color = ColorResolver.resolveColor(
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

            const safePath = this.getSafeEscape(child.path);
            const op = ColorResolver.resolveOpacity(
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

            const adjustedOp = Math.max(0, op - cumulativeTintOp);

            // Emit children container tint here, using this child's OWN resolved color
            // (ensures People's children get yellow tint, not Dots' green tint)
            const minOp = depth === 0 ? 0.12 : 0.05;
            const finalTintOp = Math.max(tintOp, minOp);
            const bgTint = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${finalTintOp})`;

            grouper.add(`
                background-color: ${bgTint} !important;
                border-left: ${folderThick}px solid rgba(${color.rgb}, 0.25) !important;
                border-bottom: ${folderThick}px solid rgba(${color.rgb}, 0.25) !important;
                border-radius: 4px !important;
                border-bottom-left-radius: 8px !important;
                padding-bottom: 4px !important;
                margin-bottom: 4px !important;
                overflow: visible !important;
            `, [
                `body .nav-files-container .nav-folder-title[data-path="${safePath}"] + .nav-folder-children`,
                `body .nav-files-container .tree-item-self[data-path="${safePath}"] + .tree-item-children`
            ], `folderBgTint_${color.hex}_${finalTintOp}_${outlineOnly}_${folderThick}`);

            // Custom User Rules take top priority over saved data.json AI icons
            const customUserRuleFolder = this.plugin.iconManager.getAutoIconData(child.name, child.path);
            const isUserCustomRuleFolderMatch = customUserRuleFolder && (customUserRuleFolder.packSource === 'custom-rule' || customUserRuleFolder.isCustom);

            let folderIconId = "";
            if (isUserCustomRuleFolderMatch && customUserRuleFolder) {
                folderIconId = this.resolveAutoIconCandidate(customUserRuleFolder);
            } else {
                const rawFolderIcon = (customStyle?.iconId && this.isValidIconStr(customStyle.iconId)) ? customStyle.iconId : null;
                const rawInheritedFolderIcon = (inheritedStyle?.iconId && this.isValidIconStr(inheritedStyle.iconId)) ? inheritedStyle.iconId : null;
                const autoIconFolder = (this.settings.autoIcons && !rawFolderIcon && !rawInheritedFolderIcon) ? customUserRuleFolder : null;
                folderIconId = rawFolderIcon || rawInheritedFolderIcon || this.resolveAutoIconCandidate(autoIconFolder);
            }
            const folderExpandedIconId = (customStyle?.expandedIconId && this.isValidIconStr(customStyle.expandedIconId)) ? customStyle.expandedIconId : ((inheritedStyle?.expandedIconId && this.isValidIconStr(inheritedStyle.expandedIconId)) ? inheritedStyle.expandedIconId : "");

            const isRainbowBgTransparent = depth === 0 && this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent;
            const folderStyles = {
                b: outlineOnly || isRainbowBgTransparent ? "transparent" : (depth === 0 && this.settings.rootStyle === "solid" ? color.hex : `rgba(${color.rgb}, ${adjustedOp})`),
                t: ColorResolver.resolveTextColor(
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
                    this.settings.colorText === 'all' || this.settings.colorText === 'folders' || this.settings.colorText === true || this.settings.colorText === undefined
                )
            };

            const isBold = customStyle?.isBold !== undefined ? customStyle.isBold : (inheritedStyle?.isBold !== undefined ? inheritedStyle.isBold : true);
            const isItalic = customStyle?.isItalic !== undefined ? customStyle.isItalic : (inheritedStyle?.isItalic !== undefined ? inheritedStyle.isItalic : false);

            let textCss = `
                color: var(--cf-folder-color, ${folderStyles.t}) !important;
                font-weight: ${isBold ? '800' : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
                ${extraTypographyCssFolders}
            `;

            const gradAngle = this.settings.rainbowGradientAngle ?? 90;

            const isRainbowActiveForFolder = this.settings.rainbowRootText && depth === 0 && !customStyle?.textColor && (this.settings.rootStyle !== 'solid' || isRainbowBgTransparent || outlineOnly);

            if (customStyle?.textGradient && customStyle?.textColor && customStyle?.textGradientEnd) {
                const stops = RainbowManager.resolveCustomStops(customStyle.textColor, customStyle.textGradientEnd, customStyle.rainbowBrightness, isDark);
                textCss = RainbowManager.buildGradientCss(stops, {
                    angle: gradAngle,
                    isDark,
                    isBold,
                    isItalic,
                    extraCss: extraTypographyCssFolders,
                    isTransparentBg: isRainbowBgTransparent,
                    outlineOnly
                });
            } else if (isRainbowActiveForFolder) {
                const stops = RainbowManager.resolveRootSpectrum(i, currentPalette, isDark);
                textCss = RainbowManager.buildGradientCss(stops, {
                    angle: gradAngle,
                    isDark,
                    isBold: true,
                    isItalic,
                    extraCss: extraTypographyCssFolders,
                    isTransparentBg: isRainbowBgTransparent,
                    outlineOnly
                });
            }

            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : folderStyles.t;

            const folderBr = customStyle?.borderRadius !== undefined ? customStyle.borderRadius : (inheritedStyle?.borderRadius !== undefined ? inheritedStyle.borderRadius : (this.settings.folderBorderRadius ?? 6));

            grouper.add(`
                background-color: var(--cf-folder-bg, ${folderStyles.b}) !important;
                --nav-item-background: var(--cf-folder-bg, ${folderStyles.b});
                --cf-selection-bg: rgba(${color.rgb}, ${Math.min(1.0, adjustedOp + 0.15)});
                opacity: 1.0 !important;
                border-radius: ${folderBr}px;
                ${glassCss}
            `, [
                `body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem)`,
                `body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file)`
            ], `folderRow_${color.hex}_${folderStyles.b}_${adjustedOp}_${folderBr}_${useGlass ? 1 : 0}`);

            grouper.add(`
                background-color: var(--cf-active-color, ${bgTint}) !important;
                border-radius: 4px !important;
                ${(isDark && !useGlass) ? (`
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0,0,0,0.1) !important;
                `) : (useGlass ? `
                    backdrop-filter: blur(12px) saturate(160%) !important;
                    -webkit-backdrop-filter: blur(12px) saturate(160%) !important;
                    box-shadow: none !important;
                ` : `
                    box-shadow: none !important;
                `)}
            `, [
                `body .nav-files-container .nav-folder.cf-active-parent > .nav-folder-title[data-path="${safePath}"]`,
                `body .nav-files-container .tree-item.cf-active-parent > .tree-item-self[data-path="${safePath}"]`
            ]);


            /* Notebook Navigator Folder Integration (Native-Bridge Architecture) */
            /* Only generated when notebookNavigatorSupport is explicitly enabled */
            const effFolderIconColor = customStyle?.iconColor || inheritedStyle?.iconColor || color.hex || folderStyles.t;

            if (NotebookNavigatorIntegration.isSupported(this.settings)) {
                const isEmoji = this.plugin.iconManager.isEmojiIcon(folderIconId);
                const iconSvg = !isEmoji && folderIconId ? this.plugin.iconManager.getIconSvg(folderIconId, true) : "";

                NotebookNavigatorIntegration.generateIntegratedStyles(
                    grouper,
                    child.path,
                    true,
                    color,
                    op,
                    folderStyles.t,
                    folderIconId,
                    customStyle?.iconColor || inheritedStyle?.iconColor || null,
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
                    false, /* useRadiantPath is now managed via :has(.is-active) statically */
                    context.nnIconW,
                    this.settings.activeGlow !== false
                );
            }

            const nnNavNameSel = NotebookNavigatorIntegration.getNavNameSelector();
            const nnSelectors = NotebookNavigatorIntegration.isSupported(this.settings)
                ? NotebookNavigatorIntegration.getScopedNavSelectors(child.path).map(s => `body ${s} ${nnNavNameSel}`)
                : [];

            grouper.add(textCss, [
                `.nav-folder-title[data-cf-path="${safePath}"] .nav-folder-title-content`,
                `.tree-item-self[data-cf-path="${safePath}"] .tree-item-inner`,
                `.nav-folder-title[data-path="${safePath}"] .nav-folder-title-content`,
                `.tree-item-self[data-path="${safePath}"] .tree-item-inner`,
                ...nnSelectors
            ], `folderText_${customStyle?.textGradient || isRainbowActiveForFolder ? 'grad' : 'norm'}_${folderStyles.t}_${isBold}_${isItalic}`);

            const generateIconCss = (iconIdToUse: string, isExpandedState: boolean | null) => {
                const isCustomEmoji = this.plugin.iconManager.isEmojiIcon(iconIdToUse);

                const getSels = (expanded: boolean | null) => {
                    const baseNav = `.nav-folder`;
                    const baseTree = `.tree-item`;
                    
                    if (expanded === true) {
                        return [
                            `${baseNav}:not(.is-collapsed) > .nav-folder-title[data-cf-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseNav}:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseTree}:not(.is-collapsed) > .tree-item-self[data-cf-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`,
                            `${baseTree}:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                        ];
                    } else if (expanded === false) {
                        return [
                            `${baseNav}.is-collapsed > .nav-folder-title[data-cf-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseNav}.is-collapsed > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseTree}.is-collapsed > .tree-item-self[data-cf-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`,
                            `${baseTree}.is-collapsed > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                        ];
                    }
                    return [
                        `.nav-folder-title[data-cf-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                        `.nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                        `.tree-item-self[data-cf-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`,
                        `.tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                    ];
                };

                const sels = getSels(isExpandedState);

                if (isCustomEmoji) {
                    grouper.add(`
                        content: "${iconIdToUse} " !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        align-self: center !important;
                        flex-shrink: 0 !important;
                        margin-right: 4px !important;
                        background-color: transparent !important;
                        -webkit-mask-image: none !important;
                    `, sels, `icon_${iconIdToUse}_emoji_${folderIconW}`);
                } else {
                    const svgStr = this.plugin.iconManager.getIconSvg(iconIdToUse, true);
                    if (svgStr) {
                        grouper.add(`
                            content: '' !important;
                            display: inline-flex !important;
                            align-self: center !important;
                            flex-shrink: 0 !important;
                            width: ${folderIconW} !important;
                            height: ${folderIconW} !important;
                            margin-right: 4px !important;
                            background-color: ${effFolderIconColor} !important;
                            -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(svgStr, true)}") !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            -webkit-mask-size: contain !important;
                        `, sels, `icon_${iconIdToUse}_svg_${folderIconW}_${effFolderIconColor.replace(/\s+/g, '')}_${isExpandedState ? 'expanded' : 'collapsed'}`);
                    }
                }
            };

            if (folderIconId || folderExpandedIconId) {
                if (folderExpandedIconId && folderIconId) {
                    generateIconCss(folderIconId, false);
                    generateIconCss(folderExpandedIconId, true);
                } else if (folderExpandedIconId) {
                    generateIconCss(folderExpandedIconId, true);
                } else if (folderIconId) {
                    generateIconCss(folderIconId, null);
                }
            } else if (autoIcons) {
                const closedIconId = this.settings.defaultClosedFolderIcon || "lucide-folder";
                const openIconId = this.settings.defaultOpenFolderIcon || "lucide-folder-open";
                const closedSvg = this.plugin.iconManager.getIconSvg(closedIconId, true) || decodeURIComponent(CF_FOLDER_CLOSED);
                const openSvg = this.plugin.iconManager.getIconSvg(openIconId, true) || decodeURIComponent(CF_FOLDER_OPEN);
                
                const baseNav = `body .nav-files-container .nav-folder`;
                const baseTree = `body .nav-files-container .tree-item`;

                // Closed State
                grouper.add(`
                    content: '' !important;
                    display: inline-flex !important;
                    align-self: center !important;
                    flex-shrink: 0 !important;
                    width: ${folderIconW} !important;
                    height: ${folderIconW} !important;
                    margin-right: 4px !important;
                    background-color: ${effFolderIconColor} !important;
                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(closedSvg)}") !important;
                    -webkit-mask-repeat: no-repeat !important;
                    -webkit-mask-position: center !important;
                    -webkit-mask-size: contain !important;
                `, [
                    `${baseNav}.is-collapsed > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                    `${baseTree}.is-collapsed > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                ], `icon_closed_folder_${folderIconW}_${effFolderIconColor.replace(/\s+/g, '')}_${closedIconId}`);

                // Open State
                grouper.add(`
                    content: '' !important;
                    display: inline-flex !important;
                    align-self: center !important;
                    flex-shrink: 0 !important;
                    width: ${folderIconW} !important;
                    height: ${folderIconW} !important;
                    margin-right: 4px !important;
                    background-color: ${effFolderIconColor} !important;
                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(openSvg)}") !important;
                    -webkit-mask-repeat: no-repeat !important;
                    -webkit-mask-position: center !important;
                    -webkit-mask-size: contain !important;
                `, [
                    `${baseNav}:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                    `${baseTree}:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                ], `icon_open_folder_${folderIconW}_${effFolderIconColor.replace(/\s+/g, '')}_${openIconId}`);
            }

            const collapseSels = [
                `body .nav-files-container .nav-folder-title[data-path="${safePath}"] .nav-folder-collapse-indicator`,
                `body .nav-files-container .nav-folder-title[data-path="${safePath}"] .collapse-icon`,
                `body .nav-files-container .tree-item-self[data-path="${safePath}"] .tree-item-collapse-indicator`,
                `body .nav-files-container .tree-item-self[data-path="${safePath}"] .collapse-icon`,
                `body .nav-files-container .nav-folder-title[data-cf-path="${safePath}"] .nav-folder-collapse-indicator`,
                `body .nav-files-container .nav-folder-title[data-cf-path="${safePath}"] .collapse-icon`,
                `body .nav-files-container .tree-item-self[data-cf-path="${safePath}"] .tree-item-collapse-indicator`,
                `body .nav-files-container .tree-item-self[data-cf-path="${safePath}"] .collapse-icon`
            ];
            grouper.add(`
                color: ${effFolderIconColor} !important;
            `, collapseSels, `collapseIcon_${color.hex}`);

            if (this.settings.showItemCounters) {
                const counts = countItems(child, this.plugin);
                const totalWidth = 110; // increased to 110 to allow 4 digits for both folders and files

                const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20" preserveAspectRatio="xMidYMid meet"><g stroke="${color.hex}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 3) scale(0.65)"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></g><text x="21" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">${counts.folders}</text><g stroke="${color.hex}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(52, 3) scale(0.65)"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"/><path d="M15 2v5h5"/><path d="M2 17.6V7.1c0-.4.2-.8.5-1.1.3-.3.7-.5 1.1-.5h3.3"/><path d="M13 22H3.6c-.4 0-.8-.2-1.1-.5-.3-.3-.5-.7-.5-1.1V10"/></g><text x="70" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">${counts.files}</text></svg>`;
                const combinedIconUrl = `url("data:image/svg+xml,${encodeURIComponent(svgOpen)}")`;

                grouper.addRaw(`
                    body .nav-folder-title[data-path="${safePath}"]::after,
                    body .tree-item-self[data-path="${safePath}"]::after {
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
                        margin-right: 4px !important;
                        flex-shrink: 0 !important;
                        pointer-events: none !important;
                        opacity: 0.8 !important;
                    }
                `);
            }

            // Pass customStyle into the next level if applyToSubfolders OR applyToFiles is set.
            // - applyToSubfolders: files AND sub-folders in child will inherit
            // - applyToFiles only: files in the IMMEDIATE child folder inherit, but sub-subfolders do NOT (handled below)
            const nextInherited = customStyle?.applyToSubfolders
                ? customStyle
                : (customStyle?.applyToFiles
                    ? { ...customStyle, applyToSubfolders: false }
                    : (inheritedStyle?.applyToSubfolders ? inheritedStyle : null));
            await this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), color, nextInherited, context, grouper, cumulativeTintOp, yieldState);
            validFolderIndex++;
        }
    }

    async generateCss(): Promise<string> {
        const context = this.prepareContext();
        if (!context) return "";

        const root = this.app.vault.getRoot();
        const grouper = new CssGrouper();
        const yieldState = { lastYield: performance.now() };

        await this.traverse(root, 0, 0, 0, null, null, context, grouper, 0, yieldState);

        const rawRules: string[] = [];

        const baseKey = `${this.settings.showCollapseIndicator !== false}|${this.settings.spacedTextMode}`;
        if (!this._cachedGlobalBaseCss || this._cachedGlobalBaseCss.key !== baseKey) {
            this._cachedGlobalBaseCss = { key: baseKey, css: generateGlobalBaseCss(this.settings) };
        }
        rawRules.push(this._cachedGlobalBaseCss.css);

        const baseThick = this.settings.pathLineThickness ?? 2.0;

        const dividerKey = `${this.settings.showFileDivider}|${this.settings.dividerSpacing}|${Object.keys(this.settings.customFolderColors).length}`;
        if (!this._cachedDividerCss || this._cachedDividerCss.key !== dividerKey) {
            this._cachedDividerCss = { key: dividerKey, css: generateDividerCss(this.settings) };
        }
        rawRules.push(this._cachedDividerCss.css);

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

            NotebookNavigatorIntegration.generateIntegratedStyles(
                grouper,
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
            );
            // Also handle potential empty path/slash variants
            if (root.path !== "/") {
                NotebookNavigatorIntegration.generateIntegratedStyles(
                    grouper,
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
                );
            }
        }

        const stealthKey = `${this.settings.notebookNavigatorSupport}|${Object.keys(this.settings.customFolderColors).length}`;
        if (!this._cachedStealthCss || this._cachedStealthCss.key !== stealthKey) {
            this._cachedStealthCss = { key: stealthKey, css: generateStealthCss(this.settings) };
        }
        rawRules.push(this._cachedStealthCss.css);
        rawRules.push(TagColorSync.generateCss(this.plugin, context));

        rawRules.push(grouper.build());

        return rawRules.join('\n');
    }


}
