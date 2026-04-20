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
    CONTAINERS: '.nn-navigation-pane-content, .nn-virtual-container',
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
    static getScopedNavSelector(path: string): string {
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.notebook-navigator ${NN_SELECTORS.NAV_ITEM}[data-path="${safePath}"]`;
    }

    static getScopedFileSelector(path: string): string {
        const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `.notebook-navigator ${NN_SELECTORS.FILE_ITEM}[data-path="${safePath}"]`;
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
               container.classList.contains('nn-virtual-container');
    }

    /**
     * Returns true if dividers should be rendered for the given container.
     */
    static shouldRenderDividers(container: Element, settings: ColorfulFoldersSettings): boolean {
        if (this.isNNContainer(container)) {
            return !!(settings.notebookNavigatorSupport && settings.notebookNavigatorDividerSupport);
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
