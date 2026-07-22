import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle } from '../common/types';
import { safeEscape } from '../common/utils';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';

/**
 * DividerManager — Zero-DOM state manager for section dividers.
 */
export class DividerManager {
    plugin: IColorfulFoldersPlugin;
    app: obsidian.App;
    static activePopover: HTMLElement | null = null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
    }

    public syncDividers() {
        if (this.plugin.isSyncingDividers || this.plugin.isDragging) return;
        this.plugin.isSyncingDividers = true;

        try {
            const allContainers = this.plugin.getAllExplorerContainers();
            allContainers.forEach((container) => {
                this.syncContainer(container);
            });
        } finally {
            this.plugin.isSyncingDividers = false;
        }
    }

    private syncContainer(container: Element) {
        if (!NotebookNavigatorIntegration.shouldRenderDividers(container, this.plugin.settings)) return;
        try {
            // Remove legacy physical nodes if present
            container.querySelectorAll('.cf-interactive-divider').forEach(el => el.remove());

            const desired = new Map<string, { conf: FolderStyle; isGlobal: boolean }>();
            const colors = this.plugin.settings.customFolderColors;
            if (colors) {
                for (const path in colors) {
                    const conf = colors[path];
                    if (typeof conf === 'object' && conf && conf.hasDivider) {
                        desired.set(path, { conf, isGlobal: false });
                    }
                }
            }

            if (this.plugin.settings.showFileDivider) {
                const rootChildren = Array.from(container.children);
                let seenFolder = false;
                let hasFileAfterFolder = false;
                for (const node of rootChildren) {
                    if (NotebookNavigatorIntegration.isFolder(node)) {
                        seenFolder = true;
                    } else if (seenFolder && NotebookNavigatorIntegration.isFile(node)) {
                        hasFileAfterFolder = true;
                        break;
                    }
                }
                if (hasFileAfterFolder) {
                    desired.set('cf-global-files-separator', {
                        isGlobal: true,
                        conf: {
                            dividerText: this.plugin.settings.fileDividerText || 'Files',
                            dividerColor: this.plugin.settings.separatorColor || 'var(--text-muted)',
                            hasDivider: true,
                        },
                    });
                }
            }

            // Tag or untag DOM targets with dataset attributes
            const currentDividers = container.querySelectorAll('.cf-has-divider, [data-cf-divider]');
            currentDividers.forEach(el => {
                const htmlEl = el as HTMLElement;
                const path = htmlEl.dataset.path || htmlEl.dataset.cfPath;
                if (!path || !desired.has(path)) {
                    htmlEl.classList.remove('cf-has-divider');
                    htmlEl.removeAttribute('data-cf-divider');
                }
            });

            for (const [path, { isGlobal }] of desired) {
                const targetEl = this.findTargetElement(container, path, isGlobal);
                if (targetEl) {
                    targetEl.classList.add('cf-has-divider');
                    targetEl.setAttribute('data-cf-divider', 'true');
                    if (path !== 'cf-global-files-separator') {
                        targetEl.setAttribute('data-cf-path', path);
                    }
                }
            }
        } catch (e) {
            console.error("Colorful Folders: Failed to sync dividers for container", e);
        }
    }

    clean() {
        if (DividerManager.activePopover) {
            DividerManager.activePopover.remove();
            DividerManager.activePopover = null;
        }
        const allContainers = this.plugin.getAllExplorerContainers();
        allContainers.forEach(container => {
            container.querySelectorAll('.cf-has-divider, [data-cf-divider], .cf-interactive-divider').forEach(el => {
                const htmlEl = el as HTMLElement;
                htmlEl.classList.remove('cf-has-divider');
                htmlEl.removeAttribute('data-cf-divider');
                if (htmlEl.classList.contains('cf-interactive-divider')) htmlEl.remove();
            });
        });
    }

    private findTargetElement(
        container: Element,
        path: string,
        isGlobal: boolean
    ): HTMLElement | null {
        if (isGlobal) {
            let seenFolder = false;
            for (const node of Array.from(container.children)) {
                if (node.classList.contains('nav-file-ghost') || node.classList.contains('nav-folder-ghost')) continue;

                if (NotebookNavigatorIntegration.isFolder(node)) {
                    seenFolder = true;
                } else if (seenFolder && NotebookNavigatorIntegration.isFile(node)) {
                    return node as HTMLElement;
                }
            }
            return null;
        }

        const safePath = safeEscape(path);
        const titleEl = container.querySelector(`.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"]`) ||
                        NotebookNavigatorIntegration.findItemInDOM(container, path);
        
        if (!titleEl) return null;

        const wrapper = titleEl.closest(`.nav-folder, .nav-file, .nn-navitem, .nn-file`);
        if (!wrapper) return null;
        if (wrapper.classList.contains('nav-file-ghost') || wrapper.classList.contains('nav-folder-ghost')) return null;

        return wrapper as HTMLElement;
    }
}
