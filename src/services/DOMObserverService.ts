import { IColorfulFoldersPlugin } from '../common/types';

export class DOMObserverService {
    plugin: IColorfulFoldersPlugin;
    private styleObservers: MutationObserver[] = [];
    public dividerObserver: MutationObserver | null = null;
    private isScrolling = false;
    public isScrollingPublic = false;
    private scrollTimeout: number | null = null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    initStyleObservers() {
        this.disposeStyleObservers();
        this.styleObservers = [];
    }

    /**
     * Stamp lightweight dataset attributes (`data-cf-path`) on file explorer nodes.
     * Attribute updates do NOT trigger childList mutations, eliminating race conditions.
     */
    public tagExplorerItems(container: HTMLElement) {
        // NO-OP: Obsidian native data-path attributes are used directly by CSS selectors.
    }

    private pendingSyncFrame: number | null = null;

    initDividerObserver() {
        if (this.plugin.isDragging) return;
        if (!this.plugin.dividerManager?.hasAnyDividers()) {
            this.disposeDividerObserver();
            return;
        }

        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }

        const allContainers = this.plugin.getAllExplorerContainers();
        if (allContainers.length === 0) return;

        allContainers.forEach((container) => {
            this.tagExplorerItems(container);

            if (
                (container as HTMLElement & { cfHasScrollListener?: boolean })
                  .cfHasScrollListener
            )
                return;
            (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener = true;

            container.addEventListener('scroll', this.handleScroll, { passive: true });
        });

        this.dividerObserver = new MutationObserver((mutations) => {
            if (this.plugin.isSyncingDividers || this.isScrolling || this.plugin.isDragging) return;

            let hasRelevantChange = false;
            for (const m of mutations) {
                if (m.type !== 'childList') continue;

                const targetEl = m.target as HTMLElement;
                if (targetEl && (targetEl.classList?.contains('cf-interactive-divider') || !!targetEl.closest?.('.cf-interactive-divider'))) {
                    continue;
                }

                const isDividerNode = (node: Node): boolean => {
                    if (node.nodeType === 1) {
                        const el = node as HTMLElement;
                        if (el.classList?.contains('cf-interactive-divider')) return true;
                        if (el.classList?.contains('tree-item') || el.classList?.contains('nav-file') || el.classList?.contains('nav-folder')) {
                            return false;
                        }
                        return !!el.querySelector?.('.cf-interactive-divider');
                    }
                    return false;
                };

                let allNodesAreDividers = true;
                const totalNodes = m.addedNodes.length + m.removedNodes.length;
                if (totalNodes === 0) continue;

                for (let i = 0; i < m.addedNodes.length; i++) {
                    if (!isDividerNode(m.addedNodes[i])) {
                        allNodesAreDividers = false;
                        break;
                    }
                }
                if (allNodesAreDividers) {
                    for (let i = 0; i < m.removedNodes.length; i++) {
                        if (!isDividerNode(m.removedNodes[i])) {
                            allNodesAreDividers = false;
                            break;
                        }
                    }
                }

                if (allNodesAreDividers) continue;

                if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
                    hasRelevantChange = true;
                    break;
                }
            }

            if (hasRelevantChange) {
                if (this.pendingSyncFrame !== null) {
                    window.cancelAnimationFrame(this.pendingSyncFrame);
                }
                this.pendingSyncFrame = window.requestAnimationFrame(() => {
                    this.pendingSyncFrame = null;
                    if (this.plugin.isSyncingDividers || this.isScrolling || this.plugin.isDragging) return;
                    allContainers.forEach(c => this.tagExplorerItems(c));
                    this.plugin.dividerManager.syncDividers();
                });
            }
        });

        allContainers.forEach((container) => {
            this.dividerObserver?.observe(container, {
                childList: true,
                subtree: true
            });
        });
    }

    handleScroll = (e: Event) => {
        const container = e.currentTarget as HTMLElement;
        const doc = container.ownerDocument;
        const win = doc.defaultView || window;
        if (!this.isScrolling) {
            this.isScrolling = true;
            this.isScrollingPublic = true;
        }
        if (this.scrollTimeout !== null) {
            win.clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = win.setTimeout(() => {
            this.isScrolling = false;
            this.isScrollingPublic = false;
            this.scrollTimeout = null;
        }, 150);
    };

    disposeStyleObservers() {
        this.styleObservers.forEach(obs => obs.disconnect());
        this.styleObservers = [];
    }

    disposeDividerObserver() {
        if (this.pendingSyncFrame !== null) {
            cancelAnimationFrame(this.pendingSyncFrame);
            this.pendingSyncFrame = null;
        }
        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
            this.dividerObserver = null;
        }
    }

    destroy() {
        this.disposeStyleObservers();
        this.disposeDividerObserver();

        const allContainers = this.plugin.getAllExplorerContainers();
        allContainers.forEach((container) => {
            container.removeEventListener("scroll", this.handleScroll);
            delete (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener;
        });

        if (this.scrollTimeout) window.clearTimeout(this.scrollTimeout);
    }
}
