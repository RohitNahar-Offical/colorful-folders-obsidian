import * as obsidian from 'obsidian';
import { ColorfulFoldersSettings, IColorfulFoldersPlugin } from '../common/types';
import { CF_FOLDER_CLOSED, CF_FILE_DEFAULT } from '../common/constants';
import { MenuHelper } from '../ui/MenuHelper';
import { safeEscape } from '../common/utils';
import { CssGrouper } from '../core/CssGrouper';

interface NNPlugin {
    registerFileMenu?: (cb: (menu: obsidian.Menu, file: obsidian.TAbstractFile) => void) => void;
    registerFolderMenu?: (cb: (menu: obsidian.Menu, folder: obsidian.TAbstractFile) => void) => void;
}

/**
 * Notebook Navigator Integration
 * Centralizes all DOM selectors and NN-specific logic.
 */
export const NN_SELECTORS = {
    CONTAINERS: '.nn-navigation-pane-content, .nn-virtual-container, .nn-list-view, .nn-explorer-content',
    NAV_ITEM: '.nn-navitem',
    FILE_ITEM: '.nn-file',
    NAV_NAME: '.nn-navitem-name',
    NAV_ICON: '.nn-navitem-icon, .nn-navitem-icon-slot, .nn-icon-container, .nn-nav-icon',
    FILE_NAME: '.nn-file-name',
    FILE_ICON: '.nn-file-icon, .nn-file-icon-slot, .nn-icon-container, .nn-file-icon',
};

export class NotebookNavigatorIntegration {
    static isSupported(settings: ColorfulFoldersSettings): boolean {
        return !!settings.notebookNavigatorSupport;
    }

    static showFileBg(settings: ColorfulFoldersSettings): boolean {
        return !!(settings.notebookNavigatorSupport && settings.notebookNavigatorFileBackground);
    }

    /**
     * Returns the extra containers (NN navigation pane, etc.) that should be observed.
     */
    static getExtraContainers(doc: Document): NodeListOf<Element> {
        return doc.querySelectorAll(NN_SELECTORS.CONTAINERS);
    }

    /**
     * Finds a specific item (folder or file) in the NN DOM by its path.
     */
    static findItemInDOM(container: Element, path: string): HTMLElement | null {
        const safePath = safeEscape(path);
        return container.querySelector(
            `${NN_SELECTORS.NAV_ITEM}[data-path="${safePath}"], ${NN_SELECTORS.FILE_ITEM}[data-path="${safePath}"]`
        );
    }

    /**
     * Returns the base selector for NN items (folders/nav items).
     */
    static getNavBase(settings: ColorfulFoldersSettings): string {
        return this.isSupported(settings) ? NN_SELECTORS.NAV_ITEM : '.cf-disabled-nn';
    }

    /**
     * Returns a scoped selector that ONLY matches if inside an NN container.
     */
    /**
     * Returns a scoped selector that ONLY matches real vault items.
     * Hardened to exclude system views (Tags/Properties) via attribute filtering.
     */
    static getScopedNavSelector(path: string): string {
        const safePath = safeEscape(path);
        return `.notebook-navigator .nn-navitem[data-path="${safePath}"]:not(.nn-header), 
                .notebook-navigator .nn-shortcut-item[data-path="${safePath}"]`;
    }

    static getScopedFileSelector(path: string): string {
        const safePath = safeEscape(path);
        return `.notebook-navigator .nn-file[data-path="${safePath}"]:not(.nn-header)`;
    }

    /**
     * Returns a selector for an active NN item.
     */
    static getActiveGlowSelector(path: string): string {
        const safePath = safeEscape(path);
        return `.notebook-navigator .is-active[data-path="${safePath}"]`;
    }

    /**
     * Returns a selector for NN container vertical lines (if they exist).
     * Used to explicitly style or disable radiant paths in NN.
     */
    static getRadiantPathSelector(path: string): string {
        const safePath = safeEscape(path);
        return `.notebook-navigator .nn-navitem:has(> [data-path="${safePath}"]) > .nn-virtual-container`;
    }

    static getNavNameSelector(): string {
        return NN_SELECTORS.NAV_NAME;
    }

    static getFileNameSelector(): string {
        return NN_SELECTORS.FILE_NAME;
    }

    static getNavIconSelector(): string {
        return NN_SELECTORS.NAV_ICON;
    }

    static getFileIconSelector(): string {
        return NN_SELECTORS.FILE_ICON;
    }

    /**
     * Checks if a container is a Notebook Navigator container.
     */
    static isNNContainer(container: Element): boolean {
        return container.classList.contains('nn-navigation-pane-content') || 
               container.classList.contains('nn-virtual-container') ||
               container.classList.contains('nn-list-view') ||
               container.classList.contains('nn-explorer-content');
    }

    /**
     * Returns true if dividers should be rendered for the given container.
     */
    static shouldRenderDividers(container: Element, _settings: ColorfulFoldersSettings): boolean {
        if (this.isNNContainer(container)) {
            return false;
        }
        return true; // Native explorer always supported
    }

    /**
     * Identifies if a DOM node is a folder/nav-item.
     */
    static isFolder(el: Element): boolean {
        return el.classList.contains('nav-folder') || el.classList.contains('nn-navitem');
    }

    /**
     * Identifies if a DOM node is a file-item.
     */
    static isFile(el: Element): boolean {
        return el.classList.contains('nav-file') || el.classList.contains('nn-file');
    }

    /**
     * Generates a complete, hardened CSS block for a specific item in Notebook Navigator.
     * Implements the 'Native-Bridge' architecture.
     */

    static generateIntegratedStyles(
        grouper: CssGrouper,
        path: string, 
        isFolder: boolean, 
        color: { rgb: string, hex: string },
        bgAlpha: number,
        textCol: string, 
        iconId: string, 
        iconColor: string | null,
        isEmoji: boolean,
        iconSvg: string,
        activeBg: string, 
        activeText: string,
        isBold: boolean,
        isItalic: boolean,
        shouldColor: boolean,
        useGlass: boolean = false,
        tintOp: number = 0,
        baseThick: number = 2.0,
        outlineOnly: boolean = false,
        useRadiantPath: boolean = false,
        effIconW: string = '1.3em',
        activeGlow: boolean = true
    ): void {
        const nnThick = baseThick + 0.5; // Scaled for NN visibility
        const activeThick = baseThick + 2.0;
        const safePath = safeEscape(path);
        const base = isFolder ? this.getScopedNavSelector(path) : this.getScopedFileSelector(path);
        const nameSel = isFolder ? this.getNavNameSelector() : this.getFileNameSelector();
        const _iconSel = isFolder ? this.getNavIconSelector() : this.getFileIconSelector();
        const countSel = '.nn-navitem-count';

        const glassCss = useGlass ? `
            backdrop-filter: blur(12px) saturate(120%) !important; 
            -webkit-backdrop-filter: blur(12px) saturate(120%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        ` : '';

        // CSS-Based Icon Injection (Match 4.1.4 for Zero-Flicker stability)
        let iconCss = '';
        if (iconId) {
            const target = `body .notebook-navigator [data-path="${safePath}"] :is(${_iconSel})`;
            if (isEmoji) {
                grouper.add(`
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: ${effIconW} !important;
                    height: ${effIconW} !important;
                    content: "${iconId}" !important;
                    font-style: normal !important;
                    background: none !important;
                    -webkit-mask-image: none !important;
                    visibility: visible !important;
                `, [target], `nnEmoji_${iconId}_${effIconW}`);
                grouper.add(`display: none !important;`, [`${target} *`], `nnDisplayNone`);
            } else if (iconSvg) {
                grouper.add(`
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: ${effIconW} !important;
                    height: ${effIconW} !important;
                    background-color: ${iconColor || color.hex || textCol} !important;
                    -webkit-mask-image: url("data:image/svg+xml,${iconSvg}") !important;
                    -webkit-mask-repeat: no-repeat !important;
                    -webkit-mask-position: center !important;
                    -webkit-mask-size: contain !important;
                    content: "" !important;
                    opacity: 0.85 !important;
                    visibility: visible !important;
                `, [target], `nnSvg_${iconColor || color.hex || textCol}_${iconSvg}_${effIconW}`);
                grouper.add(`display: none !important;`, [`${target} *`], `nnDisplayNone`);
            }
        } else {
            const target = `body .notebook-navigator [data-path="${safePath}"] :is(${_iconSel})`;
            const fallbackSvg = isFolder ? CF_FOLDER_CLOSED : CF_FILE_DEFAULT;
            grouper.add(`
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: ${effIconW} !important;
                height: ${effIconW} !important;
                background-color: ${iconColor || color.hex || textCol} !important;
                -webkit-mask-image: url("data:image/svg+xml,${fallbackSvg}") !important;
                -webkit-mask-repeat: no-repeat !important;
                -webkit-mask-position: center !important;
                -webkit-mask-size: contain !important;
                content: "" !important;
                opacity: 0.5 !important;
                visibility: visible !important;
            `, [target], `nnFallback_${fallbackSvg}_${effIconW}`);
            grouper.add(`display: none !important;`, [`${target} *`], `nnDisplayNone`);
        }

        const hoverBody = `
            background-color: rgba(${color.rgb}, ${Math.min(1.0, (isFolder ? bgAlpha : (outlineOnly ? Math.max(bgAlpha, 0.12) : Math.max(bgAlpha, 0.18))) + 0.08)}) !important;
            filter: brightness(1.03) !important;
            z-index: 2 !important;
            ${glassCss}
        `;
        grouper.add(hoverBody, [`${base}:hover`], `nnHover_${color.hex}_${bgAlpha}_${isFolder}_${outlineOnly}_${useGlass}`);

        const metadataCol = `rgba(${color.rgb}, 0.65)`;
        const metadataSels = [
            `${base} .nn-navitem-date`,
            `${base} .nn-navitem-subtitle`,
            `${base} .nn-navitem-description`,
            `${base} .nn-file-date`
        ];
        grouper.add(`color: ${metadataCol} !important; transition: color 0.2s ease !important;`, metadataSels, `nnMeta_${color.hex}`);

        if (isFolder) {
            const finalBgAlpha = outlineOnly ? 0 : bgAlpha;
            const finalBorderAlpha = outlineOnly ? 0.9 : 0.8;
            grouper.add(`
                background-color: rgba(${color.rgb}, ${finalBgAlpha}) !important;
                border-left: ${nnThick}px solid rgba(${color.rgb}, ${finalBorderAlpha}) !important;
                border-radius: 6px !important;
                ${glassCss}
                ${tintOp > 0 ? `background-blend-mode: overlay;` : ''}
                transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
                margin-bottom: 2px !important;
            `, [base], `nnFolderBg_${color.hex}_${finalBgAlpha}_${finalBorderAlpha}_${tintOp}_${useGlass}`);
        } else if (shouldColor) {
            const fileBg = outlineOnly ? Math.max(bgAlpha, 0.12) : Math.max(bgAlpha, 0.18);
            grouper.add(`
                background-color: rgba(${color.rgb}, ${fileBg}) !important;
                border-left: ${nnThick}px solid rgba(${color.rgb}, 0.6) !important;
                opacity: 1.0 !important;
                color: ${textCol} !important;
                font-weight: ${isBold ? 'bold' : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
                border-radius: 6px;
                transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
                margin-bottom: 2px !important;
            `, [base], `nnFileBg_${color.hex}_${fileBg}_${textCol}_${isBold}_${isItalic}`);
        }

        if (shouldColor) {
            grouper.add(`
                background-color: transparent !important;
                border-left: ${outlineOnly ? 0 : nnThick}px solid rgba(${color.rgb}, ${outlineOnly ? 0 : tintOp}) !important;
                ${!outlineOnly ? 'padding-left: 4px !important;' : ''}
                margin-left: 2px !important;
            `, [`body ${base}`], `nnBase_${color.hex}_${outlineOnly}_${tintOp}`);

            grouper.add(`
                color: ${textCol} !important;
                ${isBold ? 'font-weight: bold !important;' : ''}
                ${isItalic ? 'font-style: italic !important;' : ''}
            `, [`body ${base} ${nameSel}`, `body ${base} ${countSel}`], `nnName_${textCol}_${isBold}_${isItalic}`);
        }

        // Active / Selected Glow (Premium)
        const activeSel = `body .notebook-navigator .is-active[data-path="${safePath}"]`;
        
        grouper.add(`
            background-color: ${activeBg} !important;
            ${activeGlow ? `box-shadow: 0 4px 12px rgba(${color.rgb}, 0.2) !important;` : `box-shadow: none !important;`}
            border-left: ${activeThick}px solid rgba(${color.rgb}, 1.0) !important;
            --cf-rgb: ${color.rgb};
            color: ${activeText} !important;
            z-index: 20 !important;
        `, [activeSel], `nnActive_${activeBg}_${activeText}_${activeGlow}_${color.hex}`);
        
        grouper.add(`
            color: ${activeText} !important;
            ${isBold ? 'font-weight: bold !important;' : ''}
        `, [`${activeSel} ${nameSel}`], `nnActiveName_${activeText}_${isBold}`);
        
        grouper.add(`
            color: ${activeText} !important;
        `, [`${activeSel} ${countSel}`], `nnActiveCount_${activeText}`);
    }

    static registerMenuExtensions(plugin: IColorfulFoldersPlugin) {
        let attempts = 0;
        const maxAttempts = 5;
        const interval = 2000; // 2 seconds

        const tryRegister = () => {
            attempts++;
            
            interface InternalApp extends obsidian.App {
                plugins: {
                    getPlugin(id: string): Record<string, unknown> | null;
                };
            }

            const app = plugin.app as InternalApp;
            if (!app.plugins) return false;
            
            const nnInstance = app.plugins.getPlugin('notebook-navigator');
            if (!nnInstance) return false;

            // Some plugins expose API under .api
            const nnPlugin = (nnInstance.api || nnInstance) as NNPlugin;

            // Check if API methods exist
            if (typeof nnPlugin.registerFileMenu !== 'function' || typeof nnPlugin.registerFolderMenu !== 'function') {
                return false;
            }

            // Register with NN's public menu API
            nnPlugin.registerFileMenu((menu: obsidian.Menu, file: obsidian.TAbstractFile) => {
                MenuHelper.addContextMenuItems(menu, file, plugin);
            });

            nnPlugin.registerFolderMenu((menu: obsidian.Menu, folder: obsidian.TAbstractFile) => {
                MenuHelper.addContextMenuItems(menu, folder, plugin);
            });

            return true;
        };


        // Initial attempt
        if (!tryRegister()) {
            const timer = window.setInterval(() => {
                if (tryRegister() || attempts >= maxAttempts) {
                    window.clearInterval(timer);
                }
            }, interval);
        }
    }
}
