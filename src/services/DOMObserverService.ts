import { debounce, Debouncer } from "obsidian";
import type ColorfulFoldersPlugin from "../main";

export class DOMObserverService {
    private plugin: ColorfulFoldersPlugin;

    private dividerObserver: MutationObserver | null = null;
    private styleObservers: MutationObserver[] = [];
    private scrollTimeout: number | null = null;

    public isScrolling = false;
    public initDividerObserverDebounced: Debouncer<[], void>;

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;

        this.initDividerObserverDebounced = debounce(() => {
            this.initDividerObserver();
        }, 50, true);
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

        const explorers = Array.from(activeDocument.querySelectorAll<HTMLElement>('.workspace-leaf-content[data-type="file-explorer"]'));
        if (explorers.length === 0) {
            window.setTimeout(() => {
                this.initDividerObserver();
            }, 500);
            return;
        }

        const stripStyle = (el: HTMLElement) => {
            // NUCLEAR AND DIRECT ATTEMPT - Unconditional
            el.removeAttribute('style');
        };

        this.dividerObserver = new MutationObserver((mutations) => {
            // SYNC INTERCEPTOR: Aggressively strip style attributes
            for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "style") {
                    const target = m.target as HTMLElement;
                    if (target.classList && target.classList.contains('tree-item-self')) {
                        stripStyle(target);
                    }
                } else if (m.type === "childList") {
                    for (const node of Array.from(m.addedNodes)) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const el = node as HTMLElement;
                            if (el.classList.contains('tree-item-self')) {
                                stripStyle(el);
                            }
                            const children = el.querySelectorAll<HTMLElement>('.tree-item-self');
                            for (let i = 0; i < children.length; i++) {
                                stripStyle(children[i]);
                            }
                        }
                    }
                }
            }

            // ASYNC DIVIDER PROCESSING
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

        explorers.forEach((container) => {
            const extContainer = container as HTMLElement & { cfHasScrollListener?: boolean };
            if (!extContainer.cfHasScrollListener) {
                extContainer.cfHasScrollListener = true;
                container.addEventListener("scroll", this.handleScroll, { passive: true });
            }

            // Apply immediately to existing items
            const items = container.querySelectorAll<HTMLElement>('.tree-item-self');
            for (let i = 0; i < items.length; i++) {
                // NUCLEAR AND DIRECT ATTEMPT - Unconditional
                items[i].removeAttribute('style');
            }

            const observerOptions: MutationObserverInit = {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            };
            this.dividerObserver?.observe(container, observerOptions);
        });
    }

    public processDividers() {
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
        if (this.scrollTimeout) window.clearTimeout(this.scrollTimeout);
    }


}
