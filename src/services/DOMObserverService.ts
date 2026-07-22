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

        this.plugin.getOpenDocuments().forEach(doc => {
            const observer = new MutationObserver((mutations) => {
                let shouldRegenerate = false;
                for (const m of mutations) {
                    if (m.type === 'attributes' && m.attributeName === 'class') {
                        const target = m.target as HTMLElement;
                        const oldClass = m.oldValue || '';
                        const newClass = typeof target.className === 'string' ? target.className : (target.getAttribute('class') || '');
                        
                        if (oldClass === newClass) continue;
                        
                        const relevantClasses = ['theme-dark', 'theme-light', 'cf-show-hidden', 'cf-wrap-metadata'];
                        
                        const oldClasses = oldClass.split(/\s+/);
                        const newClasses = newClass.split(/\s+/);

                        for (const cls of relevantClasses) {
                            const wasPresent = oldClasses.includes(cls);
                            const isPresent = newClasses.includes(cls);
                            if (wasPresent !== isPresent) {
                                shouldRegenerate = true;
                                break;
                            }
                        }
                        if (shouldRegenerate) break;
                    }
                }
                
                if (shouldRegenerate) {
                    this.plugin.generateStylesDebounced?.();
                }
            });
            observer.observe(doc.body, {
                attributes: true,
                attributeFilter: ['class'],
                attributeOldValue: true,
            });
            this.styleObservers.push(observer);
        });
    }

    /**
     * Stamp lightweight dataset attributes (`data-cf-path`) on file explorer nodes.
     * Attribute updates do NOT trigger childList mutations, eliminating race conditions.
     */
    public tagExplorerItems(container: HTMLElement) {
        if (this.isScrolling) return;
        const items = container.querySelectorAll<HTMLElement>('.nav-folder-title, .nav-file-title, .tree-item-self');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const path = item.dataset.path;
            if (path && item.getAttribute('data-cf-path') !== path) {
                item.setAttribute('data-cf-path', path);
            }
        }
    }

    initDividerObserver() {
        if (this.plugin.isDragging) return;

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

                // Ignore mutations caused by our own divider elements
                let isDividerMutation = false;
                for (let i = 0; i < m.addedNodes.length; i++) {
                    const node = m.addedNodes[i] as HTMLElement;
                    if (node.classList?.contains('cf-interactive-divider') || node.querySelector?.('.cf-interactive-divider')) {
                        isDividerMutation = true;
                        break;
                    }
                }
                if (isDividerMutation) continue;
                for (let i = 0; i < m.removedNodes.length; i++) {
                    const node = m.removedNodes[i] as HTMLElement;
                    if (node.classList?.contains('cf-interactive-divider') || node.querySelector?.('.cf-interactive-divider')) {
                        isDividerMutation = true;
                        break;
                    }
                }
                if (isDividerMutation) continue;

                if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
                    hasRelevantChange = true;
                    break;
                }
            }

            if (hasRelevantChange) {
                allContainers.forEach(c => this.tagExplorerItems(c));
                this.plugin.dividerManager.syncDividers();
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
