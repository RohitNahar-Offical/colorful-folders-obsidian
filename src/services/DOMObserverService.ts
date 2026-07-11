import { debounce, Debouncer } from "obsidian";
import type ColorfulFoldersPlugin from "../main";

export class DOMObserverService {
    private plugin: ColorfulFoldersPlugin;
    
    private dividerObserver: MutationObserver | null = null;
    private styleObservers: MutationObserver[] = [];
    private scrollTimeout: number | null = null;
    
    public isScrolling = false;
    public initDividerObserverDebounced: Debouncer<[], void>;
    public processDividersDebounced: Debouncer<[], void>;

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;
        
        this.initDividerObserverDebounced = debounce(() => {
            this.initDividerObserver();
        }, 500, true);

        this.processDividersDebounced = debounce(() => {
            this.processDividers();
        }, 100, true);
    }

    public initStyleObservers() {
        if (this.styleObservers.length > 0) {
            this.styleObservers.forEach(obs => obs.disconnect());
        }
        this.styleObservers = [];

        this.plugin.getOpenDocuments().forEach(doc => {
            const observer = new MutationObserver((mutations) => {
                window.requestAnimationFrame(() => {
                    let shouldRegenerate = false;
                    for (const m of mutations) {
                        if (m.type === "attributes" && m.attributeName === "class") {
                            const target = m.target as HTMLElement;
                            const oldClass = m.oldValue || "";
                            const newClass = typeof target.className === 'string' ? target.className : (target.getAttribute('class') || "");
                            
                            if (oldClass === newClass) continue;
                            
                            const relevantClasses = ["theme-dark", "theme-light", "cf-show-hidden", "cf-wrap-metadata"];
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
                        this.plugin.generateStylesDebounced();
                    }
                });
            });
            if (doc && doc.body) {
                observer.observe(doc.body, {
                    attributes: true,
                    attributeFilter: ["class"],
                    attributeOldValue: true,
                });
                this.styleObservers.push(observer);
            }
        });
    }

    public initDividerObserver() {
        if (this.plugin.isDragging) return;

        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }

        const allContainers = this.plugin.getAllExplorerContainers();
        if (allContainers.length === 0) return;

        allContainers.forEach((container) => {
            if ((container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener) return;
            (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener = true;
            container.addEventListener("scroll", this.handleScroll, { passive: true });
        });

        this.dividerObserver = new MutationObserver((mutations) => {
            window.requestAnimationFrame(() => {
                if (this.plugin.isSyncingDividers || this.isScrolling || this.plugin.isDragging) return;

                let hasRelevantChange = false;
                for (const m of mutations) {
                    const target = m.target as HTMLElement;
                    if (target.closest(".cf-icon-wrapper, .cf-interactive-divider")) continue;
                    if (m.type !== "childList") continue;

                    const isRelevantNode = (node: Node) => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return false;
                        const el = node as HTMLElement;
                        if (!el.classList.contains("nav-file") && 
                            !el.classList.contains("nav-folder") && 
                            !el.classList.contains("tree-item") && 
                            !el.classList.contains("nn-navitem") &&
                            !el.classList.contains("nav-file-title") &&
                            !el.classList.contains("nav-folder-title")) {
                            return false;
                        }
                        return (
                            !el.classList.contains("cf-interactive-divider") &&
                            !el.classList.contains("cf-icon-wrapper") &&
                            !el.classList.contains("nav-file-ghost") &&
                            !el.classList.contains("nav-folder-ghost") &&
                            !el.closest(".cf-icon-wrapper")
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
                    this.processDividers();
                }
            });
        });

        allContainers.forEach((container) => {
            this.dividerObserver?.observe(container, {
                childList: true,
                subtree: true,
            });
        });
    }

    private processDividers() {
        if (this.plugin.isSyncingDividers || this.isScrolling) return;

        if (this.plugin._dividerTimeout) {
            window.clearTimeout(this.plugin._dividerTimeout);
        }
        
        this.plugin._dividerTimeout = window.setTimeout(() => {
            this.plugin._dividerTimeout = null;
            if (!this.plugin.isDragging) {
                this.plugin.dividerManager.syncDividers();
            }
        }, 100);
    }

    private handleScroll = (e: Event) => {
        const container = e.currentTarget as HTMLElement;
        const doc = container.ownerDocument;
        const win = doc.defaultView || activeWindow;
        this.isScrolling = true;
        win.clearTimeout(this.scrollTimeout || undefined);
        this.scrollTimeout = win.setTimeout(() => {
            this.isScrolling = false;
            this.processDividers();
        }, 100);
    };

    public destroy() {
        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }
        this.styleObservers.forEach(obs => obs.disconnect());
        
        const allContainers = this.plugin.getAllExplorerContainers();
        allContainers.forEach((container) => {
            container.removeEventListener("scroll", this.handleScroll);
            delete (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener;
        });
        
        this.initDividerObserverDebounced.cancel();
        this.processDividersDebounced.cancel();
        if (this.scrollTimeout) window.clearTimeout(this.scrollTimeout);
    }
}
