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
}
