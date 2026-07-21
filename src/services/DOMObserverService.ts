import { IColorfulFoldersPlugin } from '../common/types';

export class DOMObserverService {
    plugin: IColorfulFoldersPlugin;
    private styleObservers: MutationObserver[] = [];
    private dividerObserver: MutationObserver | null = null;
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

    initDividerObserver() {
        if (this.plugin.isDragging) return;

        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }

        const allContainers = this.plugin.getAllExplorerContainers();
        if (allContainers.length === 0) return;

        const stripStyle = (el: HTMLElement) => {
            const style = el.getAttribute('style') || '';
            if (style.includes('padding-inline-start') || style.includes('padding-left') || style.includes('margin-left')) {
                el.removeAttribute('style');
            }
        };

        allContainers.forEach((container) => {
            if (
                (container as HTMLElement & { cfHasScrollListener?: boolean })
                  .cfHasScrollListener
            )
                return;
            (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener = true;

            container.addEventListener('scroll', this.handleScroll, { passive: true });

            const items = container.querySelectorAll<HTMLElement>('.tree-item-self');
            for (let i = 0; i < items.length; i++) {
                stripStyle(items[i]);
            }
        });

        this.dividerObserver = new MutationObserver((mutations) => {
            if (this.plugin.isSyncingDividers || this.isScrolling || this.plugin.isDragging) return;

            let hasRelevantChange = false;
            for (const m of mutations) {
                const target = m.target as HTMLElement;
                if (target.closest('.cf-icon-wrapper, .cf-interactive-divider'))
                    continue;

                if (m.type !== 'childList') continue;

                const isRelevantNode = (node: Node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return false;
                    const el = node as HTMLElement;
                    
                    if (!el.classList.contains('nav-file') && 
                        !el.classList.contains('nav-folder') && 
                        !el.classList.contains('tree-item') && 
                        !el.classList.contains('nn-navitem') &&
                        !el.classList.contains('nav-file-title') &&
                        !el.classList.contains('nav-folder-title')) {
                        return false;
                    }

                    return (
                        !el.classList.contains('cf-interactive-divider') &&
                        !el.classList.contains('cf-icon-wrapper') &&
                        !el.classList.contains('nav-file-ghost') &&
                        !el.classList.contains('nav-folder-ghost') &&
                        !el.closest('.cf-icon-wrapper')
                    );
                };

                for (const node of Array.from(m.addedNodes)) {
                    if (isRelevantNode(node)) {
                        hasRelevantChange = true;
                        break;
                    }
                }
                if (hasRelevantChange) break;
                for (const node of Array.from(m.removedNodes)) {
                    if (isRelevantNode(node)) {
                        hasRelevantChange = true;
                        break;
                    }
                }
                if (hasRelevantChange) break;
            }

            if (hasRelevantChange) {
                this.plugin.processDividers();
                if (!this.isScrolling) {
                    const addedNodes = mutations
                        .flatMap(m => Array.from(m.addedNodes));
                    if (addedNodes.length > 0) {
                        const nodelist = {
                            forEach: (cb: (node: Node) => void) => addedNodes.forEach(cb),
                        } as unknown as NodeList;
                        this.plugin.iconManager.injectIconsForNodes(nodelist);
                    } else {
                        this.plugin.refreshIconsDebounced?.();
                    }
                }
            }
        });

        allContainers.forEach((container) => {
            this.dividerObserver?.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });
        });
    }

    handleScroll = (e: Event) => {
        const container = e.currentTarget as HTMLElement;
        const doc = container.ownerDocument;
        const win = doc.defaultView || window;
        this.isScrolling = true;
        this.isScrollingPublic = true;
        win.clearTimeout(this.scrollTimeout || undefined);
        this.scrollTimeout = win.setTimeout(() => {
            this.isScrolling = false;
            this.isScrollingPublic = false;
            this.plugin.processDividers();
            this.plugin.refreshIconsDebounced?.();
        }, 100);
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
