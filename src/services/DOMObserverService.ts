import { debounce, Debouncer } from "obsidian";
import type ColorfulFoldersPlugin from "../main";

export class DOMObserverService {
    private plugin: ColorfulFoldersPlugin;

    public dividerObserver: MutationObserver | null = null;
    private styleObservers: MutationObserver[] = [];
    private scrollTimeout: number | null = null;

    public isScrolling = false;
    public initDividerObserverDebounced: Debouncer<[], void>;

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;

        this.initDividerObserverDebounced = debounce(() => {
            this.initDividerObserver();
        }, 300, true);
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

    private observerRetryCount = 0;
    private readonly MAX_OBSERVER_RETRIES = 15; // Allows up to ~7.5 seconds of heavy startup load before giving up

    /**
     * Initializes MutationObservers on all File Explorer leaves.
     * Includes a robust debounced retry loop to handle heavy startup delays from background processing plugins (e.g. Smart Connections).
     */
    public initDividerObserver() {
        if (this.plugin.isDragging) return;

        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
            this.dividerObserver = null;
        }

        const explorers = Array.from(activeDocument.querySelectorAll<HTMLElement>('.workspace-leaf-content[data-type="file-explorer"]'));
        if (explorers.length === 0) {
            if (this.observerRetryCount < this.MAX_OBSERVER_RETRIES) {
                this.observerRetryCount++;
                // Debounce retry attempts using exponential/staggered backoff to avoid hammering thread during heavy boot
                const delay = Math.min(500 * Math.pow(1.2, this.observerRetryCount - 1), 2000);
                window.setTimeout(() => {
                    this.initDividerObserver();
                }, delay);
            }
            return;
        }

        // Reset retry count once leaves are successfully discovered
        this.observerRetryCount = 0;

        const stripStyle = (el: HTMLElement) => {
            if (!this.plugin.settings.enableStaircaseHack) return;
            const style = el.getAttribute('style') || '';
            if (style.includes('padding-inline-start') || style.includes('padding-left') || style.includes('margin-left')) {
                el.removeAttribute('style');
            }
        };

        this.dividerObserver = new MutationObserver((mutations) => {
            if (this.plugin.settings.enableStaircaseHack) {
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
            }

            // ASYNC DIVIDER & ICON PROCESSING
            window.requestAnimationFrame(() => {
                if (this.plugin.isSyncingDividers || this.isScrolling || this.plugin.isDragging) return;

                let hasRelevantChange = false;

                for (const m of mutations) {
                    const target = m.target as HTMLElement;
                    if (target.closest(".cf-icon-wrapper, .cf-interactive-divider, .sc-container, [class*='smart-connection']")) continue;

                    if (m.type !== "childList") continue;

                    const isRelevantNode = (node: Node) => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return false;
                        const el = node as HTMLElement;

                        // Ignore Smart Connections nodes
                        const className = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
                        if (className.includes('sc-') || className.includes('smart-connection')) return false;

                        if (!el.classList.contains("nav-file") &&
                            !el.classList.contains("nav-folder") &&
                            !el.classList.contains("tree-item") &&
                            !el.classList.contains("tree-item-self") &&
                            !el.classList.contains("tree-item-inner") &&
                            !el.classList.contains("nn-navitem") &&
                            !el.classList.contains("nav-file-title") &&
                            !el.classList.contains("nav-folder-title") &&
                            !el.classList.contains("nav-file-title-content") &&
                            !el.classList.contains("nav-folder-title-content")) {
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

            const observerOptions: MutationObserverInit = {
                childList: true,
                subtree: true,
                attributes: this.plugin.settings.enableStaircaseHack,
                attributeFilter: this.plugin.settings.enableStaircaseHack ? ['style'] : undefined
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
                window.requestAnimationFrame(() => {
                    this.plugin.dividerManager.syncDividers();
                });
            }
        }, 100);
    }

    private lastScrollTop: number = 0;

    private handleScroll = (e: Event) => {
        const container = e.currentTarget as HTMLElement;
        const doc = container.ownerDocument;
        const win = doc.defaultView || activeWindow;
        this.isScrolling = true;

        const currentScrollTop = container.scrollTop;
        const scrollDelta = Math.abs(currentScrollTop - this.lastScrollTop);
        this.lastScrollTop = currentScrollTop;
        const timeoutMs = Math.min(300, scrollDelta * 2);

        win.clearTimeout(this.scrollTimeout || undefined);
        this.scrollTimeout = win.setTimeout(() => {
            this.isScrolling = false;
            this.processDividers();
        }, Math.max(100, timeoutMs));
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
