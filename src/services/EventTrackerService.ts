import { EventRef } from "obsidian";
import type ColorfulFoldersPlugin from "../main";
import { MenuHelper } from "../ui/MenuHelper";
export class EventTrackerService {
    private plugin: ColorfulFoldersPlugin;
    private eventRefs: EventRef[] = [];
    private domEvents: { element: HTMLElement | Document | Window, event: string, callback: EventListenerOrEventListenerObject }[] = [];

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    public registerEvents() {
        this.registerEvent(
            this.plugin.app.workspace.on("file-menu", (menu, file) => {
                MenuHelper.addContextMenuItems(menu, file, this.plugin);
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("layout-change", () => {
                this.plugin.domObserverService.initDividerObserver();
                this.updateActiveFolderClasses();
            }),
        );
        
        this.registerEvent(
            this.plugin.app.workspace.on("file-open", () => {
                this.updateActiveFolderClasses();
            }),
        );

        this.plugin.getOpenDocuments().forEach(doc => {
            this.registerDragEventsForDoc(doc);
        });

        this.registerEvent(
            this.plugin.app.workspace.on("window-open", (win: unknown, doc: Document) => {
                this.plugin.cachedDocuments.add(doc);
                if (this.plugin.sheet && !doc.adoptedStyleSheets.includes(this.plugin.sheet)) {
                    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.plugin.sheet];
                }
                
                doc.body.classList.toggle("cf-show-hidden", this.plugin.settings.showHiddenItems);
                doc.body.classList.toggle("cf-wrap-metadata", !!this.plugin.settings.wrapMetadata);
                
                this.registerDragEventsForDoc(doc);
                this.plugin.domObserverService.initStyleObservers();
                this.plugin.generateStylesDebounced();
                this.updateActiveFolderClasses();
            })
        );

        this.registerEvent(
            // @ts-ignore - window-close is an internal Obsidian API event
            this.plugin.app.workspace.on("window-close", (win: unknown, doc: Document) => {
                this.plugin.cachedDocuments.delete(doc);
            })
        );

        this.registerEvent(
            this.plugin.app.vault.on("create", (file) => {
                if (file && (file.path.startsWith('.') || file.path.includes('/.'))) return;
                this.invalidateCaches();
                this.plugin.generateStylesDebounced();
            }),
        );

        this.registerEvent(
            this.plugin.app.vault.on("delete", (file) => {
                if (file && (file.path.startsWith('.') || file.path.includes('/.'))) return;
                this.invalidateCaches();
                this.plugin.generateStylesDebounced();
            }),
        );

        this.registerEvent(
            this.plugin.app.vault.on("rename", async (file, oldPath) => {
                if (file && (file.path.startsWith('.') || file.path.includes('/.'))) return;
                this.invalidateCaches();
                if (this.plugin.settings.customFolderColors[oldPath]) {
                    const style = this.plugin.settings.customFolderColors[oldPath];
                    this.plugin.settings.customFolderColors[file.path] = style;
                    delete this.plugin.settings.customFolderColors[oldPath];

                    for (const key of Object.keys(this.plugin.settings.customFolderColors)) {
                        if (key.startsWith(oldPath + "/")) {
                            const newKey = file.path + key.slice(oldPath.length);
                            this.plugin.settings.customFolderColors[newKey] = this.plugin.settings.customFolderColors[key];
                            delete this.plugin.settings.customFolderColors[key];
                        }
                    }
                    await this.plugin.saveSettings();
                } else {
                    this.plugin.generateStylesDebounced();
                }
            }),
        );
    }

    private invalidateCaches() {
        this.plugin.heatmapCache = null;
        this.plugin.folderCountCache = null;
        this.plugin.folderSortCache = null;
        this.plugin.rootSortCache = null;
    }

    public updateActiveFolderClasses() {
        const docs = this.plugin.getOpenDocuments();
        docs.forEach(doc => {
            // Remove from previously active elements
            const oldParents = doc.querySelectorAll('.cf-active-parent, .cf-is-active');
            for (let i = 0; i < oldParents.length; i++) {
                oldParents[i].classList.remove('cf-active-parent', 'cf-is-active');
            }
            
            // Add to currently active elements
            const activeItems = doc.querySelectorAll('.is-active');
            for (let i = 0; i < activeItems.length; i++) {
                if (activeItems[i].parentElement) {
                    activeItems[i].parentElement.classList.add('cf-active-parent');
                }
                activeItems[i].classList.add('cf-is-active');
            }
        });
    }

    private registerEvent(ref: EventRef) {
        this.plugin.registerEvent(ref);
        this.eventRefs.push(ref);
    }

    private registerDomEvent(element: HTMLElement | Document | Window, event: string, callback: EventListenerOrEventListenerObject) {
        element.addEventListener(event, callback);
        this.domEvents.push({ element, event, callback });
    }

    public registerDragEventsForDoc(doc: Document) {
        this.registerDomEvent(doc, "dragstart", () => {
            this.plugin.isDragging = true;
            // The DOMObserverService will handle its own logic
            if (this.plugin.domObserverService) {
                // Pause divider sync during drag
                this.plugin.domObserverService.dividerObserver?.disconnect();
            }
        });
        
        const handleDragEnd = () => {
            if (!this.plugin.isDragging) return;
            this.plugin.isDragging = false;
            this.plugin.domObserverService.initDividerObserver();
            this.plugin.dividerManager.syncDividers();
        };
        
        this.registerDomEvent(doc, "dragend", handleDragEnd);
        this.registerDomEvent(doc, "drop", handleDragEnd);
    }

    public destroy() {
        // Obsidian automatically unregisters events via plugin.registerEvent during unload, 
        // but tracking them explicitly here ensures safety for sub-services.
        this.eventRefs = [];
        this.domEvents.forEach(e => {
            e.element.removeEventListener(e.event, e.callback);
        });
        this.domEvents = [];
    }
}
