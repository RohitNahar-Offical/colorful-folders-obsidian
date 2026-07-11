import { EventRef } from "obsidian";
import type ColorfulFoldersPlugin from "../main";
import { MenuHelper } from "../ui/MenuHelper";
import { PasswordModal } from "../ui/modals/PasswordModal";
import * as obsidian from "obsidian";

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
                this.plugin.domObserverService.initDividerObserverDebounced();
            }),
        );

        this.plugin.getOpenDocuments().forEach(doc => {
            this.registerDragEventsForDoc(doc);
        });

        this.registerEvent(
            this.plugin.app.workspace.on("window-open", (win: unknown, doc: Document) => {
                if (this.plugin.sheet && !doc.adoptedStyleSheets.includes(this.plugin.sheet)) {
                    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.plugin.sheet];
                }
                this.registerDragEventsForDoc(doc);
                this.plugin.domObserverService.initStyleObservers();
                this.plugin.generateStylesDebounced();
            })
        );

        this.registerEvent(
            this.plugin.app.vault.on("create", () => {
                this.invalidateCaches();
                this.plugin.generateStylesDebounced();
            }),
        );

        this.registerEvent(
            this.plugin.app.vault.on("delete", () => {
                this.invalidateCaches();
                this.plugin.generateStylesDebounced();
            }),
        );

        this.registerEvent(
            this.plugin.app.vault.on("rename", async (file, oldPath) => {
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

    private registerEvent(ref: EventRef) {
        this.plugin.registerEvent(ref);
        this.eventRefs.push(ref);
    }

    private registerDomEvent(element: HTMLElement | Document | Window, event: string, callback: EventListenerOrEventListenerObject) {
        this.plugin.registerDomEvent(element as any, event as any, callback as any);
        this.domEvents.push({ element, event, callback });
    }

    public registerDragEventsForDoc(doc: Document) {
        this.registerDomEvent(doc, "dragstart", () => {
            this.plugin.isDragging = true;
            // The DOMObserverService will handle its own logic
            if (this.plugin.domObserverService) {
                // Pause divider sync during drag
            }
        });
        
        const handleDragEnd = () => {
            if (!this.plugin.isDragging) return;
            this.plugin.isDragging = false;
            this.plugin.domObserverService.initDividerObserver();
            this.plugin.domObserverService.processDividersDebounced();
        };
        
        this.registerDomEvent(doc, "dragend", handleDragEnd);
        this.registerDomEvent(doc, "drop", handleDragEnd);
    }

    public destroy() {
        // Obsidian automatically unregisters events via plugin.registerEvent during unload, 
        // but tracking them explicitly here ensures safety for sub-services.
        this.eventRefs = [];
        this.domEvents = [];
    }
}
