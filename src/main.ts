import { StyleResolver } from './core/StyleResolver';
import * as obsidian from "obsidian";
import {
  ColorfulFoldersSettings,
  FolderStyle,
  IColorfulFoldersPlugin,
} from "./common/types";
import { DEFAULT_SETTINGS } from "./common/constants";
import { NotebookNavigatorIntegration } from './integrations/NotebookNavigator';
import { GraphColorSync } from './integrations/GraphColorSync';
import { ColorPickerModal } from "./ui/modals/ColorPickerModal";
import { DividerModal } from "./ui/modals/DividerModal";
import { ColorfulFoldersSettingTab } from "./ui/SettingTab";
import { PasswordModal } from "./ui/modals/PasswordModal";
import { ChangelogModal } from "./ui/modals/ChangelogModal";
import { StyleGenerator } from "./core/StyleGenerator";
import { DividerManager } from "./core/DividerManager";
import { DOMObserverService } from "./services/DOMObserverService";
import { EventTrackerService } from "./services/EventTrackerService";
import { AdoptedStyleSheetService } from "./services/AdoptedStyleSheetService";
import { StyleSheetDeltaEngine } from "./services/StyleSheetDeltaEngine";
import { DOMAttributeStamper } from "./services/DOMAttributeStamper";
import { FolderTrie } from "./core/algorithms/FolderTrie";
import { EventBus } from "./common/EventBus";

import { IconManager } from "./core/IconManager";

declare module "obsidian" {
  interface Workspace {
    on(name: "window-open", callback: (win: unknown, doc: Document) => unknown, ctx?: unknown): obsidian.EventRef;
  }
}

export default class ColorfulFoldersPlugin
  extends obsidian.Plugin
  implements IColorfulFoldersPlugin {
  declare settings: ColorfulFoldersSettings;
  iconManager: IconManager;
  sheet: CSSStyleSheet;
  adoptedStyleSheetService: AdoptedStyleSheetService;
  deltaEngine: StyleSheetDeltaEngine;
  domStamper: DOMAttributeStamper;
  folderTrie: FolderTrie = new FolderTrie();
  eventBus: EventBus = new EventBus();

  iconCache: Map<string, string> = new Map();
  _dividerTimeout: number | null = null;
  heatmapCache: Map<string, number> | null = null;
  folderCountCache: Map<string, { files: number; folders: number }> | null =
    null;
  folderSortCache: Map<string, number> | null = null;
  rootSortCache: Map<string, number> | null = null;
  parsedExclusionList: Set<string> | null = null;
  activePaletteCache: { palette: { rgb: string; hex: string }[] } | null = null;
  generateStylesDebounced: obsidian.Debouncer<[], void>;
  saveDataDebounced: obsidian.Debouncer<[], void>;
  localFileSystemIcons: Record<string, string> = {};
  cachedDocuments: Set<Document> = new Set();
  _abortStartupRender: boolean = false;
  _isUnloading: boolean = false;

  domObserverService: DOMObserverService;
  eventTrackerService: EventTrackerService;
  dividerManager: DividerManager;
  styleGenerator: StyleGenerator;
  isSyncingDividers: boolean = false;
  isDragging: boolean = false;
  isGeneratingStyles: boolean = false;
  hasPendingGenerateStyles: boolean = false;

  ribbonEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();
    this.styleGenerator = new StyleGenerator(this);
    this.iconManager = new IconManager(this);
    this.dividerManager = new DividerManager(this);
    this.domObserverService = new DOMObserverService(this);
    this.eventTrackerService = new EventTrackerService(this);
    this.adoptedStyleSheetService = new AdoptedStyleSheetService(this);
    this.deltaEngine = new StyleSheetDeltaEngine(this);
    this.domStamper = new DOMAttributeStamper(this);

    this.folderTrie.rebuildFromSettings(this.settings.customFolderColors);

    // Initial document cache state
    this.cachedDocuments.add(activeDocument);
    this.app.workspace.iterateAllLeaves((leaf) => {
      const doc = leaf.view?.containerEl?.ownerDocument;
      if (doc) this.cachedDocuments.add(doc);
    });

    this.initializeStyles();
    this.registerCustomIcons();
    this.registerCommands();

    this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

    this.generateStylesDebounced = obsidian.debounce(
      () => {
        if (!this.isDragging) {
          void this.generateStyles();
        }
      },
      100,
      true
    );

    this.saveDataDebounced = obsidian.debounce(
      () => {
        void this.saveData(this.settings);
      },
      1000, // 1-second trailing edge debounce for disk I/O
      false
    );





    this.refreshRibbon();
    this.eventTrackerService.registerEvents();
    this.domObserverService.initStyleObservers();

    this.cachedDocuments.forEach(doc => {
      doc.body.classList.toggle(
        "cf-show-hidden",
        this.settings.showHiddenItems,
      );
      doc.body.classList.toggle(
        "cf-wrap-metadata",
        Boolean(this.settings.wrapMetadata),
      );
    });

    this.initStaircaseStyleStripper();
    void this.generateStyles();

    this.app.workspace.onLayoutReady(async () => {
      await this.generateStyles();
      NotebookNavigatorIntegration.registerMenuExtensions(this);
      void this.loadLocalIcons();

      if (this._abortStartupRender) return;
      this.domStamper.stampAllExplorers();
      this.domObserverService.initDividerObserver();
      this.dividerManager.syncDividers();

      try {
        const optimized = await this.optimizeBlueTopazStyleSettings();
        if (optimized) {
          new obsidian.Notice("Colorful Folders: Conflicting Blue Topaz theme settings in Style Settings have been automatically disabled.");
          void this.generateStyles();
        }
      } catch (err) {
        console.error("Colorful Folders: Failed to optimize Blue Topaz settings", err);
      }

      // Check for first download or version update and ensure icon packs exist
      const currentVersion = this.manifest.version;
      const isFirstRunOrVersionChange = !this.settings.lastVersion || this.settings.lastVersion !== currentVersion;
      if (isFirstRunOrVersionChange) {
        const customIconKeys = Object.keys(this.settings.customIcons || {});
        const hasSimpleIcons = customIconKeys.some(k => k.startsWith('simple-icons-') || k.startsWith('simple-'));
        if (!hasSimpleIcons) {
          window.setTimeout(() => {
            void this.autoDownloadPack("https://raw.githubusercontent.com/iconify/icon-sets/master/json/simple-icons.json", "simple-icons");
          }, 2000);
        }

        const hasFeatherIcons = customIconKeys.some(k => k.startsWith('feather-'));
        if (!hasFeatherIcons) {
          window.setTimeout(() => {
            void this.autoDownloadPack("https://raw.githubusercontent.com/iconify/icon-sets/master/json/feather.json", "feather");
          }, 5000);
        }

        this.settings.lastVersion = currentVersion;
        await this.saveSettings();

        // Show the collective changelog (Fetched from GitHub)
        try {
          const githubUrl = `https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/main/version.md`;

          const response = await obsidian.requestUrl({ url: githubUrl });
          if (response.status === 200) {
            const content = response.text;
            new ChangelogModal(this.app, content).open();
          }
        } catch (err) {
          console.error(
            "Colorful folders: failed to fetch collective changelog from GitHub",
            err,
          );
        }
      }
    });
  }

  getStyle(path: string): FolderStyle | null {
    return StyleResolver.getStyle(this, path);
  }

  processDividers(): void {
    this.dividerManager.syncDividers();
  }

  initializeStyles() {
    this.adoptedStyleSheetService.initializeStyles();
  }

  private async getAllSvgFiles(dir: string): Promise<string[]> {
    const adapter = this.app.vault.adapter;
    const results: string[] = [];
    if (!(await adapter.exists(dir))) return results;
    
    const list = await adapter.list(dir);
    for (const file of list.files) {
      if (file.toLowerCase().endsWith('.svg')) {
        results.push(file);
      }
    }
    for (const folder of list.folders) {
      const subFiles = await this.getAllSvgFiles(folder);
      results.push(...subFiles);
    }
    return results;
  }

  async loadLocalIcons() {
    try {
      const adapter = this.app.vault.adapter;
      const iconsPath = `${this.app.vault.configDir}/icons`;
      if (await adapter.exists(iconsPath)) {
        const svgFiles = await this.getAllSvgFiles(iconsPath);

        this.localFileSystemIcons = {};
        const iconReads = svgFiles.map(async (file) => {
          const relPath = file.substring(iconsPath.length + 1);
          const content = await adapter.read(file);
          return { relPath, content };
        });
        const readResults = await Promise.all(iconReads);

        for (const { relPath, content } of readResults) {
          const parts = relPath.split('/');
          const filename = parts[parts.length - 1].slice(0, -4);
          const lowerFilename = filename.toLowerCase();
          
          const relNoExt = relPath.slice(0, -4);
          const hyphenated = relNoExt.toLowerCase().replace(/[\s_]+/g, '-').replace(/\//g, '-');
          this.localFileSystemIcons[hyphenated] = content;

          if (parts.length > 1) {
            const packName = parts[0].toLowerCase().replace(/[\s_]+/g, '-');
            const packFilename = `${packName}-${lowerFilename}`;
            this.localFileSystemIcons[packFilename] = content;

            if (packName.includes('simple') || packName === 'si') {
              this.localFileSystemIcons[`si-${lowerFilename}`] = content;
              this.localFileSystemIcons[`simple-${lowerFilename}`] = content;
            }
            if (packName.includes('font') || packName.includes('awesome') || packName.startsWith('fa')) {
              this.localFileSystemIcons[`fa-${lowerFilename}`] = content;
              this.localFileSystemIcons[`fas-${lowerFilename}`] = content;
              this.localFileSystemIcons[`far-${lowerFilename}`] = content;
              this.localFileSystemIcons[`fab-${lowerFilename}`] = content;
            }
            if (packName.includes('remix') || packName.startsWith('ri')) {
              this.localFileSystemIcons[`ri-${lowerFilename}`] = content;
              this.localFileSystemIcons[`remix-${lowerFilename}`] = content;
            }
            if (packName.includes('tabler') || packName.startsWith('tb')) {
              this.localFileSystemIcons[`tb-${lowerFilename}`] = content;
            }
            if (packName.includes('material') || packName.startsWith('mdi')) {
              this.localFileSystemIcons[`mdi-${lowerFilename}`] = content;
            }
          } else {
            this.localFileSystemIcons[lowerFilename] = content;
          }
        }

        // Trigger style generation now that we know what icons exist
        this.generateStylesDebounced();
      }
    } catch (e) {
      console.error("Colorful Folders: Failed to load local icons", e);
    }
  }

  initStaircaseStyleStripper() {
    const win = window as unknown as Window & { _testerObserver?: MutationObserver };
    if (win._testerObserver) {
      win._testerObserver.disconnect();
      win._testerObserver = undefined;
    }
  }

  onunload() {
    const win = window as unknown as Window & { _testerObserver?: MutationObserver };
    if (win._testerObserver) {
      win._testerObserver.disconnect();
      delete win._testerObserver;
    }
    this._isUnloading = true;
    this.adoptedStyleSheetService.unload();
    this.deltaEngine.unload();
    this.eventBus.clear();
    this.getOpenDocuments().forEach(doc => {
      doc.body.classList.remove("cf-show-hidden", "cf-wrap-metadata");
    });

    // Cleanly destroy observers and events
    this.domObserverService.destroy();
    this.eventTrackerService.destroy();

    this.cleanDividers();

    // Cancel all debouncers to prevent ghost execution
    this.generateStylesDebounced.cancel();
    this.saveDataDebounced.cancel();

    // Explicitly clear memory-heavy global caches
    this.iconCache.clear();
    if (this.heatmapCache) this.heatmapCache.clear();
    if (this.folderCountCache) this.folderCountCache.clear();
    if (this.folderSortCache) this.folderSortCache.clear();
    if (this.rootSortCache) this.rootSortCache.clear();
    if (this.parsedExclusionList) this.parsedExclusionList.clear();

    // Remove CF-generated graph groups on plugin unload
    void GraphColorSync.clearGraphColors(this);
  }

  cleanDividers() {
    activeDocument
      .querySelectorAll(".cf-has-divider")
      .forEach((el) => el.classList.remove("cf-has-divider"));
    this.dividerManager.clean();
  }

  async loadSettings() {
    const loadedData =
      ((await this.loadData()) as Partial<ColorfulFoldersSettings>) || {};

    // Migration for independent divider padding
    if (
      loadedData.dividerLinePadding !== undefined &&
      loadedData.dividerLinePaddingLeft === undefined
    ) {
      loadedData.dividerLinePaddingLeft = loadedData.dividerLinePadding;
      loadedData.dividerLinePaddingRight = loadedData.dividerLinePadding;
    }

    // PERF FIX 2: Shallow spread instead of JSON.parse(JSON.stringify(...)).
    // loadedData from disk always provides complete values for any keys it defines,
    // making a deep clone of DEFAULT_SETTINGS unnecessary and wasteful.
    this.settings = Object.assign({} as ColorfulFoldersSettings, DEFAULT_SETTINGS, loadedData);
    if (this.settings.heatmapData) {
      this.heatmapCache = new Map(Object.entries(this.settings.heatmapData));
    }
    this.activePaletteCache = null;
    this.parsedExclusionList = new Set(
      (this.settings.exclusionList || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );
  }

  // PERF FIX 3: Selective icon cache invalidation.
  // Snapshot the icon-relevant keys before saving. Only clear the SVG
  // cache if customIcons or customIconRules actually changed — saving
  // unrelated settings (opacity, tag colors, etc.) no longer thrashes the cache.
  private _lastIconRulesKey = '';
  private _lastCustomIconsKey = '';

  async saveSettings() {
    const iconRulesChanged = (this.settings.customIconRules || '') !== this._lastIconRulesKey;
    const customIconsChanged = JSON.stringify(this.settings.customIcons || {}) !== this._lastCustomIconsKey;
    const shouldClearIconCache = iconRulesChanged || customIconsChanged;

    this.folderTrie.rebuildFromSettings(this.settings.customFolderColors);

    if (this.heatmapCache) {
      this.settings.heatmapData = Object.fromEntries(this.heatmapCache);
    }

    this.saveDataDebounced();

    if (shouldClearIconCache) {
      this.iconCache.clear();
      this.iconManager.invalidateCategoryCache();
      this._lastIconRulesKey = this.settings.customIconRules || '';
      this._lastCustomIconsKey = JSON.stringify(this.settings.customIcons || {});
    }
    this.activePaletteCache = null;
    this.parsedExclusionList = new Set(
      (this.settings.exclusionList || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );

    this.generateStylesDebounced();
  }

  registerCustomIcons() {
    for (const [id, svg] of Object.entries(this.settings.customIcons)) {
      obsidian.addIcon(id, svg);
    }
  }



  registerCommands() {
    this.addCommand({
      id: "open-color-picker",
      name: "Open color picker for current file",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          if (!checking) new ColorPickerModal(this.app, this, file).open();
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "clear-current-style",
      name: "Clear style for current file",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && this.settings.customFolderColors[file.path]) {
          if (!checking) {
            delete this.settings.customFolderColors[file.path];
            void this.saveSettings();
            new obsidian.Notice(`Cleared style for ${file.name}`);
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "add-divider-current",
      name: "Add/edit divider for current file",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          if (!checking) {
            new DividerModal(this.app, this, file).open();
          }
          return true;
        }

        return false;
      },
    });

    this.addCommand({
      id: "remove-divider-current",
      name: "Remove divider for current file",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          const style = StyleResolver.getStyle(this, file.path);
          if (style && style.hasDivider) {
            if (!checking) {
              style.hasDivider = false;
              void this.saveSettings();
              void this.generateStyles();
              this.dividerManager.syncDividers();
              new obsidian.Notice(`Removed divider for ${file.name}`);
            }
            return true;
          }
        }
        return false;
      },
    });
    this.addCommand({
      id: "toggle-stealth-mode",
      name: "Toggle stealth mode",
      callback: () => {
        void this.toggleStealthMode();
      },
    });
  }

  async toggleStealthMode() {
    const applyToggle = async () => {
      this.settings.showHiddenItems = !this.settings.showHiddenItems;
      await this.saveSettings();
      void this.generateStyles();
      new obsidian.Notice(
        `Stealth mode: ${this.settings.showHiddenItems ? "Ghost" : "Hidden"}`,
      );
    };

    if (this.settings.vaultPassword && this.settings.isVaultLocked) {
      new PasswordModal(this.app, "Unlock stealth mode", async (pass) => {
        if (pass === this.settings.vaultPassword) {
          this.settings.isVaultLocked = false;
          await applyToggle();
          return true;
        } else {
          new obsidian.Notice("Incorrect password!");
          return false;
        }
      }).open();
    } else {
      await applyToggle();
    }
  }

  refreshRibbon() {
    if (this.ribbonEl) {
      this.ribbonEl.remove();
      this.ribbonEl = null;
    }
    if (this.settings.showRibbonIcon) {
      this.ribbonEl = this.addRibbonIcon(
        "eye-off",
        "Toggle stealth mode",
        () => {
          void this.toggleStealthMode();
        },
      );
    }
  }

  async optimizeBlueTopazStyleSettings(): Promise<boolean> {
    interface StyleSettingsManager {
      settings?: Record<string, unknown>;
      removeClasses(): void;
      save(): Promise<void>;
      initClasses(): void;
    }

    interface StyleSettingsPlugin {
      settingsManager?: StyleSettingsManager;
    }

    interface CustomApp extends obsidian.App {
      customCss?: {
        theme?: string;
      };
      plugins?: {
        getPlugin(id: string): obsidian.Plugin | null;
      };
    }

    const customApp = this.app as unknown as CustomApp;
    const vault = this.app.vault as unknown as { getConfig?(key: string): string | null };
    const currentTheme = (typeof vault.getConfig === "function" ? vault.getConfig("cssTheme") : null) || customApp.customCss?.theme;
    if (!currentTheme || currentTheme.toLowerCase() !== "blue topaz") return false;

    if (!customApp.plugins) return false;
    const styleSettingsPlugin = customApp.plugins.getPlugin("obsidian-style-settings") as unknown as StyleSettingsPlugin | null;
    if (!styleSettingsPlugin) return false;

    const manager = styleSettingsPlugin.settingsManager;
    if (!manager || !manager.settings) return false;

    let changed = false;

    if (manager.settings["blue-topaz-theme@@remove-file-icons"] !== true) {
      manager.settings["blue-topaz-theme@@remove-file-icons"] = true;
      changed = true;
    }

    if (manager.settings["blue-topaz-theme@@folder-icons"] !== false) {
      manager.settings["blue-topaz-theme@@folder-icons"] = false;
      changed = true;
    }

    if (manager.settings["blue-topaz-theme@@bt-toggle-colorful-folder"] !== false) {
      manager.settings["blue-topaz-theme@@bt-toggle-colorful-folder"] = false;
      changed = true;
    }

    if (manager.settings["blue-topaz-theme@@remove-arrow"] !== false) {
      manager.settings["blue-topaz-theme@@remove-arrow"] = false;
      changed = true;
    }

    if (changed) {
      manager.removeClasses();
      await manager.save();
      manager.initClasses();
      return true;
    }

    return false;
  }





  async generateStyles() {
    if (this._isUnloading) return;
    if (this.isGeneratingStyles) {
      this.hasPendingGenerateStyles = true;
      return;
    }
    this.isGeneratingStyles = true;
    try {
      const css = await this.styleGenerator.generateCss();
      this.adoptedStyleSheetService.updateStyles(css);
      this.domStamper.stampAllExplorers();
      // Sync folder colors to Graph View groups if the feature is enabled
      if (this.settings.graphColorSync && !this.isDragging) {
        void GraphColorSync.syncGraphColors(this);
      }
    } catch (e) {
      console.error("Colorful Folders: Error during generateStyles", e);
    } finally {
      this.isGeneratingStyles = false;
      if (this.hasPendingGenerateStyles && !this._isUnloading) {
        this.hasPendingGenerateStyles = false;
        this.generateStylesDebounced();
      }
    }
  }




  getAllExplorerContainers(): HTMLElement[] {
    const explorers: HTMLElement[] = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!leaf || !leaf.view) return;
      const view = leaf.view as obsidian.View & {
        getViewType(): string;
        containerEl: HTMLElement;
      };
      if (
        typeof view.getViewType === 'function' &&
        (view.getViewType() === "file-explorer" ||
          view.getViewType() === "nav-files")
      ) {
        if (!view.containerEl) return;
        const container = view.containerEl.querySelector(
          ".nav-files-container",
        );
        if (container) explorers.push(container as HTMLElement);
      }
    });

    const docs = new Set<Document>();
    explorers.forEach((e) => docs.add(e.ownerDocument));
    docs.add(activeDocument);

    const allContainers = [...explorers];
    docs.forEach((doc) => {
      const extra = NotebookNavigatorIntegration.getExtraContainers(doc);
      if (extra) extra.forEach((e) => allContainers.push(e as HTMLElement));
    });

    return allContainers;
  }



  async cleanUnusedStyles() {
    let count = 0;
    const keys = Object.keys(this.settings.customFolderColors);
    for (const path of keys) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!file) {
        delete this.settings.customFolderColors[path];
        count++;
      }
    }
    if (count > 0) {
      await this.saveSettings();
      new obsidian.Notice(`Cleaned up ${count} stale style entries.`);
    } else {
      new obsidian.Notice(
        "No stale style entries found. Your configuration is clean!",
      );
    }
  }

  getOpenDocuments(): Document[] {
    return Array.from(this.cachedDocuments);
  }

  async autoDownloadPack(url: string, prefix: string) {
    try {
      const res = await obsidian.requestUrl({ url });
      const data = res.json as Record<string, unknown>;
      if (!data || typeof data !== 'object') return;

      const icons = data.icons as Record<string, { width?: number; height?: number; left?: number; top?: number; body?: string }> | undefined;
      if (icons && typeof icons === 'object' && !Array.isArray(icons)) {
        const rawPrefix = typeof data.prefix === 'string' ? data.prefix : prefix;
        const packPrefix = rawPrefix.replace(/[^a-z0-9-_]/gi, '');
        const commonW = typeof data.width === 'number' ? data.width : 24;
        const commonH = typeof data.height === 'number' ? data.height : 24;

        const processIcon = (name: string, iconData: { width?: number; height?: number; left?: number; top?: number; body?: string }) => {
          if (!name || typeof name !== 'string') return false;
          const cleanName = name.replace(/[^a-z0-9-_]/gi, '');
          if (!cleanName) return false;

          const id = `${packPrefix}-${cleanName}`;
          const w = typeof iconData.width === 'number' ? iconData.width : commonW;
          const h = typeof iconData.height === 'number' ? iconData.height : commonH;
          const l = typeof iconData.left === 'number' ? iconData.left : 0;
          const t = typeof iconData.top === 'number' ? iconData.top : 0;
          const body = iconData.body;
          
          if (!body || typeof body !== 'string') return false;
          if (/<script|on\w+\s*=/i.test(body)) return false; // Sanitize XSS scripts/event handlers

          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l} ${t} ${w} ${h}">${body}</svg>`;
          this.settings.customIcons[id] = svg;
          return true;
        };

        for (const [name, iconData] of Object.entries(icons)) {
          processIcon(name, iconData);
        }

        const aliases = data.aliases as Record<string, { parent: string; width?: number; height?: number; left?: number; top?: number; body?: string }> | undefined;
        if (aliases) {
          for (const [aliasName, aliasData] of Object.entries(aliases)) {
            const targetName = aliasData.parent;
            const targetData = icons[targetName];
            if (targetData) {
              const merged = { ...targetData, ...aliasData };
              processIcon(aliasName, merged);
            }
          }
        }
      }

      this.registerCustomIcons();
      await this.saveSettings();
      void this.generateStyles();
    } catch (e) {
      console.error(`Colorful Folders: Failed to auto-download ${prefix} icons`, e);
    }
  }

}
