import * as obsidian from "obsidian";
import type ColorfulFoldersPlugin from "../main";
import { MenuHelper } from "../ui/MenuHelper";
import { OutlineSync } from "../integrations/OutlineSync";
import { TagColorSync } from "../integrations/TagColorSync";
export class EventTrackerService {
    private plugin: ColorfulFoldersPlugin;
    private eventRefs: obsidian.EventRef[] = [];
    private domEvents: { element: HTMLElement | Document | Window, event: string, callback: EventListenerOrEventListenerObject }[] = [];

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    public registerEvents() {
        if (obsidian.Platform.isMobile) {
            this.registerMobileEvents();
        } else {
            this.registerDesktopEvents();
        }

        this.plugin.getOpenDocuments().forEach(doc => {
            this.registerDragEventsForDoc(doc);
            this.registerClickEventsForDoc(doc);
        });

        this.registerEvent(
            this.plugin.app.workspace.on("window-open", (win: unknown, doc: Document) => {
                this.plugin.cachedDocuments.add(doc);
                this.plugin.adoptedStyleSheetService?.attachToDocument(doc);
                
                doc.body.classList.toggle("cf-show-hidden", this.plugin.settings.showHiddenItems);
                doc.body.classList.toggle("cf-wrap-metadata", !!this.plugin.settings.wrapMetadata);
                this.plugin.applyThemeState(doc);
                
                this.registerDragEventsForDoc(doc);
                this.registerClickEventsForDoc(doc);
                this.plugin.generateStylesDebounced();
                this.updateActiveFolderClasses();
            })
        );

        this.registerEvent(
            (this.plugin.app.workspace as obsidian.Events).on("window-close", (win: unknown, doc: Document) => {
                this.plugin.adoptedStyleSheetService?.detachFromDocument(doc);
                this.plugin.cachedDocuments.delete(doc);
            })
        );

        this.registerEvent(
            this.plugin.app.metadataCache.on("changed", (file) => {
                if (file && file.path && this.plugin.settings.autoIcons) {
                    this.plugin.iconManager?.invalidateAutoIconCache(file.path);
                }
            })
        );

        this.registerEvent(
            this.plugin.app.vault.on("modify", (file) => {
                if (!file) return;
                const normPath = file.path.replace(/\\/g, '/');
                if (normPath.endsWith("colorful-folders/data.json")) {
                    if (this.plugin.isSelfSavingSettings) return;
                    void (async () => {
                        try {
                            const dataPath = `${this.plugin.app.vault.configDir}/plugins/colorful-folders/data.json`;
                            if (await this.plugin.app.vault.adapter.exists(dataPath)) {
                                const raw = await this.plugin.app.vault.adapter.read(dataPath);
                                if (raw && this.plugin.lastSavedSettingsJson) {
                                    let incomingCanonical = "";
                                    try {
                                        incomingCanonical = JSON.stringify(JSON.parse(raw));
                                    } catch {
                                        incomingCanonical = raw.trim();
                                    }
                                    if (incomingCanonical === this.plugin.lastSavedSettingsJson) {
                                        return;
                                    }
                                }
                            }
                        } catch {
                            // Proceed safely if direct read comparison fails
                        }
                        await this.plugin.loadSettings();
                        void this.plugin.generateStyles();
                        if (this.plugin.dividerManager?.hasAnyDividers()) {
                            this.plugin.dividerManager.syncDividers();
                        }
                    })();
                    return;
                }
                const configDir = this.plugin.app.vault.configDir;
                const normConfigDir = configDir ? configDir.replace(/\\/g, '/') : "";
                if (normPath.includes("colorful-folders/icons/") || (normConfigDir && normPath.includes(`${normConfigDir}/icons`))) {
                    void (async () => {
                        await this.plugin.loadLocalCustomIcons();
                        await this.plugin.loadLocalIcons();
                        this.plugin.registerCustomIcons();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                    })();
                    return;
                }
                if (!(normPath.startsWith('.') || normPath.includes('/.'))) {
                    this.touchHeatmapParents(file);
                }
            })
        );

        this.registerEvent(
            this.plugin.app.vault.on("create", (file) => {
                if (file && (file.path.startsWith('.') || file.path.includes('/.'))) return;
                this.touchHeatmapParents(file);
                this.invalidateCaches();
                this.plugin.generateStylesDebounced();
            }),
        );

        this.registerEvent(
            this.plugin.app.vault.on("delete", (file) => {
                if (file && (file.path.startsWith('.') || file.path.includes('/.'))) return;
                const path = file.path;
                this.invalidateCaches();
                this.plugin.customFolderColorsMap.delete(path);
                this.plugin.heatmapCache?.delete(path);
                this.plugin.folderCountCache?.delete(path);
                this.plugin.folderSortCache?.delete(path);
                this.plugin.rootSortCache?.delete(path);
                this.plugin.iconCache?.delete(path);
                this.plugin.iconManager?.invalidateAutoIconCache(path);

                const prefix = path + "/";
                for (const k of Array.from(this.plugin.customFolderColorsMap.keys())) {
                    if (k.startsWith(prefix)) this.plugin.customFolderColorsMap.delete(k);
                }
                if (this.plugin.heatmapCache) {
                    for (const k of Array.from(this.plugin.heatmapCache.keys())) {
                        if (k.startsWith(prefix)) this.plugin.heatmapCache.delete(k);
                    }
                }

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

    private registerDesktopEvents() {
        this.registerEvent(
            this.plugin.app.workspace.on("file-menu", (menu, file) => {
                MenuHelper.addContextMenuItems(menu, file, this.plugin);
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("layout-change", () => {
                this.plugin.domObserverService.initDividerObserver();
                this.plugin.domObserverService.syncTagPaneDataset();
                this.plugin.initStaircaseStyleStripper();
                this.updateActiveFolderClasses();
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("active-leaf-change", (leaf) => {
                const viewType = leaf?.view?.getViewType();
                if (viewType === "tag") {
                    this.plugin.domObserverService.syncTagPaneDataset();
                }
                if (viewType === "outline" || viewType === "tag" || viewType === "file-explorer") {
                    this.plugin.initStaircaseStyleStripper();
                }
            }),
        );
        
        this.registerEvent(
            this.plugin.app.workspace.on("file-open", (file) => {
                this.updateActiveFolderClasses();
                if (file && file.path && this.plugin.animatedIconService?.hasAnyAnimatedIcons()) {
                    this.plugin.animatedIconService.replayTargetByPath(file.path);
                }
                window.setTimeout(() => {
                    this.plugin.initStaircaseStyleStripper();
                }, 50);
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("css-change", () => {
                this.plugin.generateStylesDebounced();
            }),
        );
    }

    private registerMobileEvents() {
        this.registerEvent(
            this.plugin.app.workspace.on("file-menu", (menu, file) => {
                MenuHelper.addContextMenuItems(menu, file, this.plugin);
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("layout-change", () => {
                this.plugin.invalidateExplorerContainersCache();
                this.plugin.domObserverService.initDividerObserver();
                this.plugin.domObserverService.syncTagPaneDataset();
                this.plugin.initStaircaseStyleStripper();
                this.plugin.dividerManager?.syncDividers();
                this.updateActiveFolderClasses();
            }),
        );
        
        this.registerEvent(
            this.plugin.app.workspace.on("active-leaf-change", (leaf) => {
                this.plugin.invalidateExplorerContainersCache();
                if (this.plugin.dividerManager?.hasAnyDividers()) {
                    this.plugin.dividerManager.syncDividers();
                }
                const viewType = leaf?.view?.getViewType();
                if (viewType === "tag") {
                    this.plugin.domObserverService.syncTagPaneDataset();
                }
                if (viewType === "outline" || viewType === "tag" || viewType === "file-explorer") {
                    this.plugin.initStaircaseStyleStripper();
                }
            }),
        );

        this.registerEvent(
            this.plugin.app.workspace.on("file-open", (file) => {
                this.updateActiveFolderClasses();
                if (file && file.path && this.plugin.animatedIconService?.hasAnyAnimatedIcons()) {
                    this.plugin.animatedIconService.replayTargetByPath(file.path);
                }
                window.setTimeout(() => {
                    this.plugin.initStaircaseStyleStripper();
                }, 50);
            }),
        );
    }

    private invalidateCaches() {
        this.plugin.heatmapCache = null;
        this.plugin.folderCountCache = null;
        this.plugin.folderSortCache = null;
        this.plugin.rootSortCache = null;
        this.plugin.iconManager?.invalidateAutoIconCache();
        this.plugin.embeddingModel?.clearCache();
        OutlineSync.clearCache();
        TagColorSync.clearCache();
    }

    private _activeClassRaf: number | null = null;

    public updateActiveFolderClasses() {
        if (this._activeClassRaf !== null) return;
        this._activeClassRaf = window.requestAnimationFrame(() => {
            this._activeClassRaf = null;
            this._doUpdateActiveFolderClasses();
        });
    }

    private _doUpdateActiveFolderClasses() {
        const docs = this.plugin.getOpenDocuments();
        docs.forEach(doc => {
            // Remove from previously active elements
            const oldParents = doc.querySelectorAll('.cf-active-parent, .cf-is-active');
            for (let i = 0; i < oldParents.length; i++) {
                oldParents[i].classList.remove('cf-active-parent', 'cf-is-active');
            }
            
            // Add to currently active elements (strictly in file-explorer and notebook-navigator, not outline or tag view)
            const activeItems = doc.querySelectorAll('.nav-files-container .is-active, .notebook-navigator .is-active');
            for (let i = 0; i < activeItems.length; i++) {
                const item = activeItems[i];
                if (!item) continue;

                const parentFolderNode = item.closest('.tree-item.nav-folder, .nav-folder');
                const parentTreeItem = item.closest('.tree-item, .nav-file');

                // If the active item is a folder title itself, do not hide it
                if (item.matches('.nav-folder-title')) {
                    continue;
                }
                
                // Helper to check if item is explicitly hidden by a folder note plugin
                const isFolderNoteHidden = (): boolean => {
                    const styleAttr = item.getAttribute('style') || '';
                    const parentStyle = parentTreeItem?.getAttribute('style') || '';
                    
                    return (
                        styleAttr.includes('display: none') || styleAttr.includes('display:none') ||
                        parentStyle.includes('display: none') || parentStyle.includes('display:none') ||
                        item.matches('.is-folder-note-hidden, .fn-hidden, .folder-note-hidden') ||
                        (parentTreeItem ? parentTreeItem.matches('.is-folder-note-hidden, .fn-hidden, .folder-note-hidden') : false)
                    );
                };

                if (isFolderNoteHidden()) {
                    // Highlight the parent folder title when the note file itself is hidden
                    if (parentFolderNode) {
                        parentFolderNode.classList.add('cf-active-parent');
                        const folderTitleEl = parentFolderNode.querySelector(':scope > .tree-item-self, :scope > .nav-folder-title');
                        if (folderTitleEl) {
                            folderTitleEl.classList.add('is-active', 'cf-active-parent', 'cf-is-active');
                        }
                    }
                } else {
                    if (item.parentElement) {
                        item.parentElement.classList.add('cf-active-parent');
                    }
                    if (parentFolderNode) {
                        parentFolderNode.classList.add('cf-active-parent');
                    }
                    item.classList.add('cf-is-active');
                }
            }
        });
    }

    private registerEvent(ref: obsidian.EventRef) {
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

    public registerClickEventsForDoc(doc: Document) {
        this.registerDomEvent(doc, "click", (evt: Event) => {
            if (!this.plugin.animatedIconService?.hasAnyAnimatedIcons()) return;

            // Holistic animation delegated playback controller
            this.plugin.animatedIconService.handleDelegatedClick(evt as MouseEvent);

            const target = evt.target as HTMLElement | null;
            if (!target) return;
            const row = target.closest<HTMLElement>(
                '.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file'
            );
            if (!row) return;

            const replayVisibleIcons = () => {
                const liveIcons = row.querySelectorAll<HTMLElement>('.cf-live-animated-icon, .cf-animated-icon');
                for (let i = 0; i < liveIcons.length; i++) {
                    const icon = liveIcons[i];
                    if (icon.offsetParent !== null || icon.offsetWidth > 0 || icon.offsetHeight > 0) {
                        this.plugin.animatedIconService?.triggerIconAnimation(icon);
                    }
                }
            };

            // Also check shortly after folder expansion/collapse toggles display state
            const win = doc.defaultView || window;
            win.setTimeout(replayVisibleIcons, 30);
        });
    }

    private touchHeatmapParents(file: obsidian.TAbstractFile): void {
        if (this.plugin.settings.colorMode !== "heatmap" || !this.plugin.heatmapCache) return;
        let p = file.parent;
        const mtime = Date.now();
        while (p) {
            if ((this.plugin.heatmapCache.get(p.path) || 0) < mtime) {
                this.plugin.heatmapCache.set(p.path, mtime);
            }
            p = p.parent;
        }
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
