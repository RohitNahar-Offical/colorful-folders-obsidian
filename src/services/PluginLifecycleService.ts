import type ColorfulFoldersPlugin from '../main';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { GraphColorSync } from '../integrations/GraphColorSync';

export class PluginLifecycleService {
    private plugin: ColorfulFoldersPlugin;

    constructor(plugin: ColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    public initializeDocumentTracking(): void {
        this.plugin.cachedDocuments.add(activeDocument);
        this.plugin.app.workspace.iterateAllLeaves((leaf) => {
            const doc = leaf.view?.containerEl?.ownerDocument;
            if (doc) this.plugin.cachedDocuments.add(doc);
        });
    }

    public registerVaultCacheEvents(): void {
        this.plugin.app.vault.on('modify', () => {
            if (this.plugin.folderCountCache) this.plugin.folderCountCache.clear();
            if (this.plugin.heatmapCache) this.plugin.heatmapCache.clear();
            this.plugin.invalidateExplorerContainersCache();
        });
        this.plugin.app.vault.on('create', () => {
            if (this.plugin.folderCountCache) this.plugin.folderCountCache.clear();
            if (this.plugin.heatmapCache) this.plugin.heatmapCache.clear();
            this.plugin.invalidateExplorerContainersCache();
        });
        this.plugin.app.vault.on('delete', () => {
            if (this.plugin.folderCountCache) this.plugin.folderCountCache.clear();
            if (this.plugin.heatmapCache) this.plugin.heatmapCache.clear();
            this.plugin.invalidateExplorerContainersCache();
        });
    }

    public onLayoutReady(): void {
        this.plugin.app.workspace.onLayoutReady(() => {
            this.plugin.initializeStyles();
            this.plugin.invalidateExplorerContainersCache();
            this.plugin.initStaircaseStyleStripper();
            if (this.plugin.settings.notebookNavigatorSupport) {
                NotebookNavigatorIntegration.registerMenuExtensions(this.plugin);
            }

            if (this.plugin._abortStartupRender) return;
            void this.plugin.generateStyles();
            this.plugin.getAllExplorerContainers().forEach((c) => this.plugin.domObserverService.tagExplorerItems(c));
            this.plugin.domObserverService.initDividerObserver();
            this.plugin.dividerManager.syncDividers();

            // Load local icons asynchronously in background without delaying startup
            void this.plugin.loadLocalIcons();

            this.prewarmIconCaches();
        });
    }

    private prewarmIconCaches(): void {
        const warmCaches = () => {
            if (this.plugin.iconManager) {
                void this.plugin.iconManager.getIconSvg("lucide-folder", true);
                void this.plugin.iconManager.getIconSvg("lucide-folder-open", true);
                void this.plugin.iconManager.getIconSvg("lucide-file-text", true);
            }
        };
        if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(warmCaches);
        } else {
            window.setTimeout(warmCaches, 1000);
        }
    }

    public destroy(): void {
        this.plugin._isUnloading = true;
        try {
            this.plugin.adoptedStyleSheetService?.unload();
            this.plugin.getOpenDocuments()?.forEach(doc => {
                doc.body.classList.remove("cf-show-hidden", "cf-wrap-metadata");
            });

            this.plugin.domObserverService?.destroy();
            this.plugin.eventTrackerService?.destroy();
            this.plugin.cleanDividers();

            this.plugin.generateStylesDebounced?.cancel();
            this.plugin.saveDataDebounced?.cancel();

            this.plugin.iconCache?.clear();
            if (this.plugin.heatmapCache) this.plugin.heatmapCache.clear();
            if (this.plugin.folderCountCache) this.plugin.folderCountCache.clear();
            if (this.plugin.folderSortCache) this.plugin.folderSortCache.clear();
            if (this.plugin.rootSortCache) this.plugin.rootSortCache.clear();
            if (this.plugin.parsedExclusionList) this.plugin.parsedExclusionList.clear();

            void GraphColorSync.clearGraphColors(this.plugin);
        } catch (e) {
            console.error("Colorful Folders: Exception during plugin cleanup", e as Error);
        }
    }
}
