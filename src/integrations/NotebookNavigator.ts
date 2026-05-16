import * as obsidian from 'obsidian';
import { ColorfulFoldersSettings, IColorfulFoldersPlugin } from '../common/types';
import { MenuHelper } from '../ui/MenuHelper';

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
    NAV_ICON: '.nn-navitem-icon',
    FILE_NAME: '.nn-file-name',
    FILE_ICON: '.nn-file-icon',
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
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.nn-navigation-pane .nn-navitem[data-path="${safePath}"]:not(.nn-header), 
                .nn-navigation-pane .nn-shortcut-item[data-path="${safePath}"]`;
    }

    static getScopedFileSelector(path: string): string {
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.nn-list-view .nn-file[data-path="${safePath}"]:not(.nn-header)`;
    }

    /**
     * Returns a selector for an active NN item.
     */
    static getActiveGlowSelector(path: string): string {
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.notebook-navigator .is-active[data-path="${safePath}"]`;
    }

    /**
     * Returns a selector for NN container vertical lines (if they exist).
     * Used to explicitly style or disable radiant paths in NN.
     */
    static getRadiantPathSelector(path: string): string {
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.notebook-navigator [data-path="${safePath}"] ~ .nn-virtual-container`;
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
    private static applySuffix(selector: string, suffix: string): string {
        return selector.split(',').map(s => `${s.trim()} ${suffix}`).join(', ');
    }

    static generateIntegratedStyles(
        path: string, 
        isFolder: boolean, 
        color: { rgb: string, hex: string },
        bgAlpha: number,
        textCol: string, 
        iconId: string, 
        activeBg: string, 
        activeText: string,
        isBold: boolean,
        isItalic: boolean,
        shouldColor: boolean,
        useGlass: boolean = false,
        tintOp: number = 0,
        baseThick: number = 2.0
    ): string {
        const nnThick = baseThick + 1.0;
        const activeThick = baseThick + 2.0;
        const base = isFolder ? this.getScopedNavSelector(path) : this.getScopedFileSelector(path);
        const nameSel = isFolder ? this.getNavNameSelector() : this.getFileNameSelector();
        const iconSel = isFolder ? this.getNavIconSelector() : this.getFileIconSelector();
        const countSel = '.nn-navitem-count';

        const glassCss = useGlass ? `
            backdrop-filter: blur(12px) saturate(120%) !important; 
            -webkit-backdrop-filter: blur(12px) saturate(120%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        ` : '';
        const isEmoji = iconId && iconId.length <= 3;
        
        let iconCss = '';
        if (iconId) {
            if (isEmoji) {
                iconCss = `
                    ${this.applySuffix(base, nameSel)}::before {
                        content: "${iconId} " !important;
                    }
                    ${this.applySuffix(base, iconSel)} {
                        display: none !important;
                    }
                `;
            }
            else {
                iconCss = `
                    ${this.applySuffix(base, iconSel)} {
                        display: none !important;
                    }
                `;
            }
        }

        const hoverCss = `
            ${base}:hover {
                transform: translateY(-2px) !important;
                filter: brightness(1.1) !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1) !important;
                z-index: 10 !important;
            }
        `;

        const metadataCol = `rgba(${color.rgb}, 0.65)`;
        const metadataCss = `
            ${base} .nn-navitem-date,
            ${base} .nn-navitem-subtitle,
            ${base} .nn-navitem-description,
            ${base} .nn-file-date {
                color: ${metadataCol} !important;
                transition: color 0.2s ease !important;
            }
        `;

        let bgCss = '';
        if (isFolder) {
            bgCss = `
                ${base} {
                    background-color: rgba(${color.rgb}, ${bgAlpha}) !important;
                    border-left: ${nnThick}px solid rgba(${color.rgb}, 0.8) !important;
                    border-radius: 6px !important;
                    ${glassCss}
                    ${tintOp > 0 ? `background-blend-mode: overlay;` : ''}
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    margin-bottom: 2px !important;
                }
                ${hoverCss}
                ${metadataCss}
            `;
        } else {
            bgCss = `
                ${base} {
                    ${shouldColor ? `
                        background-color: rgba(${color.rgb}, ${Math.max(bgAlpha, 0.18)}) !important;
                        border-left: ${nnThick}px solid rgba(${color.rgb}, 0.6) !important;
                    ` : ''}
                    opacity: 1.0 !important;
                    color: ${textCol} !important;
                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                    border-radius: 6px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    margin-bottom: 2px !important;
                }
                ${shouldColor ? hoverCss : ''}
                ${shouldColor ? metadataCss : ''}
            `;
        }

        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `
            ${shouldColor ? bgCss : ''}

            ${this.applySuffix(base, nameSel)},
            ${this.applySuffix(base, countSel)} {
                color: ${textCol} !important;
                font-weight: ${isBold ? 'bold' : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
            }

            ${iconCss}

            /* Active / Selected Glow (Premium) */
            body .notebook-navigator .is-active[data-path="${safePath}"] {
                background-color: ${activeBg} !important;
                box-shadow: 0 0 15px rgba(${color.rgb}, 0.5), 0 0 5px rgba(${color.rgb}, 0.3) !important;
                border-left: ${activeThick}px solid rgba(${color.rgb}, 1.0) !important;
                transform: scale(1.01) !important;
                filter: brightness(1.2) !important;
                --cf-rgb: ${color.rgb};
                color: ${activeText} !important;
                z-index: 20 !important;
            }
            
            body .notebook-navigator .is-active[data-path="${safePath}"] ${nameSel},
            body .notebook-navigator .is-active[data-path="${safePath}"] ${countSel} {
                color: ${activeText} !important;
            }
        `;
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

        // Fallback: Listen for contextmenu globally in case API registration fails
        plugin.registerEvent(
            plugin.app.workspace.on('file-menu', (_menu, _file) => {
                // If it's already being handled by standard Obsidian menu, MenuHelper already ran.
                // But if we're here, we can double check if it's an NN item.
            })
        );

        // Initial attempt
        if (!tryRegister()) {
            const timer = activeWindow.setInterval(() => {
                if (tryRegister() || attempts >= maxAttempts) {
                    activeWindow.clearInterval(timer);
                }
            }, interval);
        }
    }
}
