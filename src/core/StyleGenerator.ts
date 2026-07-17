import { ColorfulFoldersSettings, FolderStyle, IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { PALETTES, CF_FOLDER_CLOSED, CF_FOLDER_OPEN } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, safeEscape } from '../common/utils';
import * as obsidian from 'obsidian';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { TagColorSync } from '../integrations/TagColorSync';

import { countItems } from '../common/VaultUtils';
import { isDarkMode, getCurrentPalette, ColorResolver } from './ColorResolver';
import { generateGlobalBaseCss, generateDividerCss, generateStealthCss } from './BaseCssGenerator';
import { CssGrouper } from './CssGrouper';



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
        const nnIconScale = this.settings.notebookNavigatorIconScale ?? 0.8;
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
        const style = this.settings.customFolderColors[path];
        if (!style) return null;
        if (typeof style === 'string') return { hex: style };
        return style;
    }





    private async traverse(folder: obsidian.TFolder, depth: number, validIndex: number, rootIndex: number, passedColor: { rgb: string, hex: string } | null, inheritedStyle: FolderStyle | null, context: StyleContext, grouper: CssGrouper, cumulativeTintOp: number = 0, yieldState: { lastYield: number }) {
        const copyFolders: obsidian.TFolder[] = [];
        const copyFiles: obsidian.TFile[] = [];
        for (let i = 0; i < folder.children.length; i++) {
            const child = folder.children[i];
            if (child instanceof obsidian.TFolder) {
                copyFolders.push(child);
            } else if (child instanceof obsidian.TFile) {
                copyFiles.push(child);
            }
        }
        copyFolders.sort((a, b) => a.name.localeCompare(b.name));
        copyFiles.sort((a, b) => a.name.localeCompare(b.name));

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

        const SPACED_TEXT_CSS = `
            letter-spacing: 1px !important;
            word-spacing: 2px !important;
        `;
        const extraTypographyCssFiles = (this.settings.spacedTextMode === 'both' || this.settings.spacedTextMode === 'files') ? SPACED_TEXT_CSS : '';
        const extraTypographyCssFolders = (this.settings.spacedTextMode === 'both' || this.settings.spacedTextMode === 'folders') ? SPACED_TEXT_CSS : '';

        // Process Files
        // Gate: process files if there's a parent color (applyToSubfolders), autoColorFiles, autoIcons, applyToFiles on the inheritedStyle, or NN is active.
        if (passedColor || autoColorFiles || autoIcons || (inheritedStyle && inheritedStyle.applyToFiles) || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground)) {

            for (const child of copyFiles) {
                const fileStyle = this.getStyle(child.path);
                const hasCustomStyle = !!(fileStyle && (fileStyle.hex || fileStyle.iconId || fileStyle.textColor || fileStyle.isBold || fileStyle.isItalic));
                const hasInherited = !!(inheritedStyle && inheritedStyle.applyToFiles);
                const needsProcessing = hasCustomStyle || hasInherited || autoColorFiles || autoIcons || (passedColor !== null) || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground) || !!this.settings.globalBackgroundColor;

                if (!needsProcessing) {
                    continue;
                }

                if (performance.now() - yieldState.lastYield > 50) {
                    await new Promise(r => window.setTimeout(r, 0));
                    yieldState.lastYield = performance.now();
                }

                const safePath = safeEscape(child.path);
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
                    this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground
                );

                // isCustomOrInherited: true when file has a custom style, or a parent explicitly set applyToFiles
                const isCustomOrInherited = !!(fileStyle && fileStyle.hex) || (!!(inheritedStyle && inheritedStyle.applyToFiles) && this.settings.autoColorFiles);
                const shouldColorNative = isCustomOrInherited || this.settings.autoColorFiles || !!this.settings.globalBackgroundColor;
                const shouldColorNN = isCustomOrInherited || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground);

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

                const autoIconFile = (this.settings.autoIcons && !fileStyle?.iconId && !(inheritedStyle?.applyToFiles && inheritedStyle?.iconId)) ? this.plugin.iconManager.getAutoIconData(child.name, child.path) : null;
                const iconId = fileStyle?.iconId || (inheritedStyle?.applyToFiles ? inheritedStyle.iconId : null) || (autoIconFile ? (this.settings.wideAutoIcons ? autoIconFile.lucide : autoIconFile.emoji) : "");

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

                const textNN = ColorResolver.resolveTextColor(
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
                    ${extraTypographyCssFiles}
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
                    -webkit-text-fill-color: transparent !important;
                    color: transparent !important;
                    font-weight: ${isBold ? '800' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                    ${extraTypographyCssFiles}
                    display: flex !important;
                    align-items: center !important;
                    width: fit-content !important;
                    flex: 0 1 auto !important;
                `;
                }

                const fileRowSels = [
                    `.nav-files-container .nav-file-title[data-path="${safePath}"]:not(.nn-file)`,
                    `.nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem)`
                ];
                grouper.add(fileRowCss, fileRowSels, `fileRow_${color.hex}_${fileBgAlpha}`);

                const fileTextSels = [
                    `body .nav-file-title[data-path="${safePath}"]:not(.nn-file) .nav-file-title-content`,
                    `body .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner`
                ];
                grouper.add(fileTextCss, fileTextSels, `fileText_${activeStyle?.textGradient ? 'grad' : 'norm'}_${isBold}_${isItalic}_${color.hex}`);

                const fileTagSels = [
                    `[data-path="${safePath}"] .nav-file-tag`,
                    `[data-path="${safePath}"] .nav-folder-tag`,
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
                    const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${iconId}`) &&
                        !obsidian.getIconIds?.().includes(iconId) &&
                        !(this.settings.customIcons && this.settings.customIcons[iconId]);

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
                                -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
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
                    `.nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file)`,
                    `.nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file)`
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
                    `.nav-files-container .nav-file-title.is-active[data-path="${safePath}"]:not(.nn-file)::before`,
                    `.nav-files-container .tree-item-self.is-active[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem)::before`
                ]);
                // Increment skipped as fileIndex is unused
            }
        }

        // Folder logic — tint is emitted per-child inside the loop below (using child's own color)

        let validFolderIndex = 0;
        for (let i = 0; i < copyFolders.length; i++) {
            if (performance.now() - yieldState.lastYield > 50) {
                await new Promise(r => window.setTimeout(r, 0));
                yieldState.lastYield = performance.now();
            }

            const child = copyFolders[i];
            if (excludeFolders.has(child.name.toLowerCase())) {
                await this.traverse(child, depth + 1, validFolderIndex, (depth === 0 ? validFolderIndex : rootIndex), passedColor, inheritedStyle, context, grouper, cumulativeTintOp, yieldState);
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

            const safePath = safeEscape(child.path);
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
                `body .nav-folder:has(> .nav-folder-title[data-path="${safePath}"]) > .nav-folder-children`,
                `body .tree-item:has(> .tree-item-self[data-path="${safePath}"]) > .tree-item-children`
            ], `folderBgTint_${color.hex}_${finalTintOp}_${outlineOnly}`);

            // Pre-calculate folder icons to avoid warnings
            const autoIconFolder = (this.settings.autoIcons && !customStyle?.iconId && !inheritedStyle?.iconId) ? this.plugin.iconManager.getAutoIconData(child.name, child.path) : null;
            const folderIconId = customStyle?.iconId || inheritedStyle?.iconId || (autoIconFolder ? (this.settings.wideAutoIcons ? autoIconFolder.lucide : autoIconFolder.emoji) : "");
            const folderExpandedIconId = customStyle?.expandedIconId || inheritedStyle?.expandedIconId || "";

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
                ${extraTypographyCssFolders}
            `;

            if (isUsingGradient) {
                textCss = `
                    background-image: linear-gradient(${gradAngle}deg, ${startCol}, ${endCol}, ${startCol}) !important;
                    background-clip: text !important;
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                    color: transparent !important;
                    font-weight: ${gradWeight} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                    ${extraTypographyCssFolders}
                    display: flex !important;
                    align-items: center !important;
                    width: fit-content !important;
                    flex: 0 1 auto !important;
                `;
            }

            const activeBg = (this.settings.useCustomActiveColor && this.settings.customActiveBg) ? this.settings.customActiveBg : `rgba(${color.rgb}, ${useGlass ? 0.14 : 0.12})`;
            const activeText = (this.settings.useCustomActiveColor && this.settings.customActiveText) ? this.settings.customActiveText : folderStyles.t;

            const folderBr = customStyle?.borderRadius !== undefined ? customStyle.borderRadius : (inheritedStyle?.borderRadius !== undefined ? inheritedStyle.borderRadius : (this.settings.folderBorderRadius ?? 6));

            grouper.add(`
                background-color: var(--cf-folder-bg, ${folderStyles.b}) !important;
                --cf-selection-bg: rgba(${color.rgb}, ${Math.min(1.0, adjustedOp + 0.15)});
                opacity: 1.0 !important;
                border-radius: ${folderBr}px;
                ${glassCss}
            `, [
                `.nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem)`,
                `.nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-navitem):not(.nn-file)`
            ], `folderRow_${color.hex}_${folderStyles.b}_${adjustedOp}`);



            /* Notebook Navigator Folder Integration (Native-Bridge Architecture) */

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
                false, /* useRadiantPath is now managed via :has(.is-active) statically */
                context.nnIconW,
                this.settings.activeGlow !== false
            );

            const nnNavSel = NotebookNavigatorIntegration.getScopedNavSelector(child.path);
            const nnNavNameSel = NotebookNavigatorIntegration.getNavNameSelector();
            const nnSelectors = nnNavSel.split(',').map(s => `body ${s.trim()} ${nnNavNameSel}`);

            grouper.add(textCss, [
                `body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content`,
                `body .tree-item-self[data-path="${safePath}"] .tree-item-inner`,
                ...nnSelectors
            ], `folderText_${isUsingGradient ? 'grad_' + startCol.replace(/\s+/g, '') + '_' + endCol.replace(/\s+/g, '') : 'norm_' + folderStyles.t}_${isBold}_${isItalic}`);

            const generateIconCss = (iconIdToUse: string, isExpandedState: boolean | null) => {
                const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${iconIdToUse}`) &&
                    !obsidian.getIconIds?.().includes(iconIdToUse) &&
                    !(this.settings.customIcons && this.settings.customIcons[iconIdToUse]);

                const getSels = (expanded: boolean | null) => {
                    const baseNav = `body .nav-files-container .nav-folder`;
                    const baseTree = `body .nav-files-container .tree-item`;
                    
                    if (expanded === true) {
                        return [
                            `${baseNav}:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseTree}:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                        ];
                    } else if (expanded === false) {
                        return [
                            `${baseNav}.is-collapsed > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                            `${baseTree}.is-collapsed > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                        ];
                    }
                    return [
                        `body .nav-files-container .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                        `body .nav-files-container .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
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
                    `, sels);
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
                            background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                            -webkit-mask-image: url("data:image/svg+xml,${svgStr}") !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            -webkit-mask-size: contain !important;
                        `, sels);
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
                const closedSvg = this.plugin.iconManager.getIconSvg(this.settings.defaultClosedFolderIcon || "lucide-folder", true) || decodeURIComponent(CF_FOLDER_CLOSED);
                const openSvg = this.plugin.iconManager.getIconSvg(this.settings.defaultOpenFolderIcon || "lucide-folder-open", true) || decodeURIComponent(CF_FOLDER_OPEN);
                
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
                    background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(closedSvg)}") !important;
                    -webkit-mask-repeat: no-repeat !important;
                    -webkit-mask-position: center !important;
                    -webkit-mask-size: contain !important;
                `, [
                    `${baseNav}.is-collapsed > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                    `${baseTree}.is-collapsed > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                ]);

                // Open State
                grouper.add(`
                    content: '' !important;
                    display: inline-flex !important;
                    align-self: center !important;
                    flex-shrink: 0 !important;
                    width: ${folderIconW} !important;
                    height: ${folderIconW} !important;
                    margin-right: 4px !important;
                    background-color: ${customStyle?.iconColor || color.hex || folderStyles.t} !important;
                    -webkit-mask-image: url("data:image/svg+xml,${this.plugin.iconManager.normalizeSvg(openSvg)}") !important;
                    -webkit-mask-repeat: no-repeat !important;
                    -webkit-mask-position: center !important;
                    -webkit-mask-size: contain !important;
                `, [
                    `${baseNav}:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"]:not(.nn-navitem) .nav-folder-title-content::before`,
                    `${baseTree}:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"]:not(.nn-file):not(.nn-navitem) .tree-item-inner::before`
                ]);
            }

            if (this.settings.showItemCounters) {
                const counts = countItems(child, this.plugin);
                const totalWidth = 110; // increased to 110 to allow 4 digits for both folders and files

                // PERF FIX 3: Rebuild the static SVG template only when color changes.
                // For large vaults, this avoids O(N) encodeURIComponent + regex calls
                // per render cycle, replacing them with O(1) string concatenation.
                if (color.hex !== this._counterSvgColor) {
                    this._counterSvgColor = color.hex;
                    const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20" preserveAspectRatio="xMidYMid meet"><g stroke="${color.hex}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 3) scale(0.65)"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></g><text x="21" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">`;
                    const svgMid = `</text><g stroke="${color.hex}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(52, 3) scale(0.65)"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"/><path d="M15 2v5h5"/><path d="M2 17.6V7.1c0-.4.2-.8.5-1.1.3-.3.7-.5 1.1-.5h3.3"/><path d="M13 22H3.6c-.4 0-.8-.2-1.1-.5-.3-.3-.5-.7-.5-1.1V10"/></g><text x="70" y="10.5" dominant-baseline="central" fill="${color.hex}" font-family="sans-serif" font-size="11" font-weight="900">`;
                    const svgClose = `</text></svg>`;
                    // Pre-encode the three static sections; only the count values need runtime concatenation
                    this._counterSvgPrefix = encodeURIComponent(svgOpen);
                    this._counterSvgMid = encodeURIComponent(svgMid);
                    this._counterSvgSuffix = encodeURIComponent(svgClose);
                }

                const combinedIconUrl = `url("data:image/svg+xml,${this._counterSvgPrefix}${counts.folders}${this._counterSvgMid}${counts.files}${this._counterSvgSuffix}")`;

                grouper.addRaw(`
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
            const nextInherited = (customStyle?.applyToSubfolders || customStyle?.applyToFiles)
                ? customStyle
                : (inheritedStyle?.applyToSubfolders ? inheritedStyle : null);
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
        rawRules.push(generateGlobalBaseCss(this.settings));

        const baseThick = this.settings.pathLineThickness ?? 2.0;


        rawRules.push(generateDividerCss(this.settings));

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

        rawRules.push(generateStealthCss(this.settings));
        rawRules.push(TagColorSync.generateCss(this.plugin, context));

        rawRules.push(grouper.build());
        return rawRules.join('\n');
    }


}
