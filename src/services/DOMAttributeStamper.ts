import { IColorfulFoldersPlugin } from '../common/types';

export class DOMAttributeStamper {
    plugin: IColorfulFoldersPlugin;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    /**
     * Ultra-lightweight DOM element tagger. Stamps `data-cf-path` dataset attribute
     * onto visible explorer title elements in O(N_visible) time without DOM node creations.
     */
    stampContainer(container: HTMLElement): void {
        const items = container.querySelectorAll<HTMLElement>('.nav-folder-title, .nav-file-title, .tree-item-self');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const path = item.dataset.path;
            if (path && item.getAttribute('data-cf-path') !== path) {
                item.setAttribute('data-cf-path', path);
            }
        }
    }

    /**
     * Stamps all active workspace explorer containers.
     */
    stampAllExplorers(): void {
        const containers = this.plugin.getAllExplorerContainers();
        for (let i = 0; i < containers.length; i++) {
            this.stampContainer(containers[i]);
        }
    }
}
