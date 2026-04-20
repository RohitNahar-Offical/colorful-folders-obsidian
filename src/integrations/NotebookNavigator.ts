import { ColorfulFoldersSettings } from '../common/types';

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
}
