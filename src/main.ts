import { StyleResolver } from './core/StyleResolver';
import * as obsidian from "obsidian";
import {
  ColorfulFoldersSettings,
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

  domObserverService: DOMObserverService;
  eventTrackerService: EventTrackerService;
  dividerManager: DividerManager;
  styleGenerator: StyleGenerator;
  isSyncingDividers: boolean = false;
  isDragging: boolean = false;
  isGeneratingStyles: boolean = false;
  ribbonEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();
    this.styleGenerator = new StyleGenerator(this);
    this.iconManager = new IconManager(this);
    this.dividerManager = new DividerManager(this);
    this.domObserverService = new DOMObserverService(this);
    this.eventTrackerService = new EventTrackerService(this);
    // Register Notebook Navigator extensions
    this.app.workspace.onLayoutReady(() => {
      NotebookNavigatorIntegration.registerMenuExtensions(this);
      // Defer loading of local icons to keep initial startup fast
      window.setTimeout(() => {
        void this.loadLocalIcons();
      }, 10000);
    });

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

    // UI styles moved to styles.css to comply with obsidianmd/no-forbidden-elements

    this.initializeStyles();

    this.registerCustomIcons();
    this.eventTrackerService.registerEvents();
    this.registerCommands();
    this.domObserverService.initStyleObservers();

    // Initial stealth mode state
    this.getOpenDocuments().forEach(doc => {
      doc.body.classList.toggle(
        "cf-show-hidden",
        this.settings.showHiddenItems,
      );
      doc.body.classList.toggle(
        "cf-wrap-metadata",
        !!this.settings.wrapMetadata,
      );
    });

    this.app.workspace.onLayoutReady(async () => {
      // Defer heavy rendering to yield the main thread to Obsidian's initial layout paint engine
      // requestAnimationFrame + setTimeout(0) guarantees the browser paints the UI *before* we block the thread
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          void this.generateStyles();
          this.domObserverService.initDividerObserver();
          this.dividerManager.syncDividers();
        }, 0);
      });



      // 🚨 USER'S AUTOMATED CONSOLE SCRIPT BLOCK 🚨
      // This will run exactly 5 seconds after Obsidian's layout is ready
      window.setTimeout(() => {
        try {
          (function() {
              const win = window as unknown as Window & { _testerObserver?: MutationObserver };
              // Stop any existing tester observers if you run this multiple times
              if (win._testerObserver) {
                  win._testerObserver.disconnect();
              }

              const stripStyle = (el: Element) => {
                  // Just completely destroy the style attribute so Obsidian's inline padding dies
                  if (el.hasAttribute('style')) {
                      el.removeAttribute('style');
                  }
              };

              // 1. Initial Pass: Strip immediately from all current items
              const items = activeDocument.querySelectorAll('.workspace-leaf-content[data-type="file-explorer"] .tree-item-self');
              items.forEach(stripStyle);

              // 2. Mutation Observer: Aggressively watch and re-strip if Obsidian's React engine tries to put it back
              win._testerObserver = new MutationObserver((mutations) => {
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
                                  const children = el.querySelectorAll('.tree-item-self');
                                  children.forEach(stripStyle);
                              }
                          }
                      }
                  }
              });

              // Start observing the file explorer container
              const explorer = activeDocument.querySelector('.workspace-leaf-content[data-type="file-explorer"]');
              if (explorer) {
                  win._testerObserver.observe(explorer, {
                      childList: true,
                      subtree: true,
                      attributes: true,
                      attributeFilter: ['style']
                  });
              }
          })();
          
        } catch {
          // Empty catch to satisfy no-console rule
        }
      }, 5000);

      try {
        const optimized = await this.optimizeBlueTopazStyleSettings();
        if (optimized) {
          new obsidian.Notice("Colorful Folders: Conflicting Blue Topaz theme settings in Style Settings have been automatically disabled.");
          void this.generateStyles();
        }
      } catch (err) {
        console.error("Colorful Folders: Failed to optimize Blue Topaz settings", err);
      }

      // Check for version update and show changelog
      const currentVersion = this.manifest.version;
      if (this.settings.lastVersion !== currentVersion) {
        const hasSimpleIcons = Object.keys(this.settings.customIcons || {}).some(k => k.startsWith('simple-icons-'));
        if (!hasSimpleIcons) {
          window.setTimeout(() => {
            void this.autoDownloadPack("https://raw.githubusercontent.com/iconify/icon-sets/master/json/simple-icons.json", "simple-icons");
          }, 6000);
        }

        const hasFeatherIcons = Object.keys(this.settings.customIcons || {}).some(k => k.startsWith('feather-'));
        if (!hasFeatherIcons) {
          window.setTimeout(() => {
            void this.autoDownloadPack("https://raw.githubusercontent.com/iconify/icon-sets/master/json/feather.json", "feather");
          }, 12000);
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

  initializeStyles() {
    this.sheet = new CSSStyleSheet();
    this.getOpenDocuments().forEach(doc => {
      if (!doc.adoptedStyleSheets.includes(this.sheet)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
      }
    });
  }

  async loadLocalIcons() {
    try {
      const adapter = this.app.vault.adapter;
      const iconsPath = `${this.app.vault.configDir}/icons`;
      if (await adapter.exists(iconsPath)) {
        const list = await adapter.list(iconsPath);

        // Read files in chunks of 50 to avoid I/O / threadpool saturation (Electron freeze)
        const buildEntries = async (files: string[]): Promise<[string, string][]> => {
          const svgFiles = files.filter(f => f.toLowerCase().endsWith('.svg'));
          const results: [string, string][] = [];
          const chunkSize = 50;

          for (let i = 0; i < svgFiles.length; i += chunkSize) {
            const chunk = svgFiles.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
              chunk.map(async (file): Promise<[string, string]> => {
                const content = await adapter.read(file);
                const parts = file.split('/');
                const name = parts[parts.length - 1].slice(0, -4); // strip .svg
                return [name, content];
              })
            );
            results.push(...chunkResults);
          }
          return results;
        };

        // Process root-level files and all immediate subfolders in parallel
        const [rootEntries, ...subEntries] = await Promise.all([
          buildEntries(list.files),
          ...list.folders.map(async (folder) => {
            const sublist = await adapter.list(folder);
            return buildEntries(sublist.files);
          })
        ]);

        for (const [name, content] of [...rootEntries, ...subEntries.flat()]) {
          this.localFileSystemIcons[name] = content;
        }

        // Trigger style generation now that local icons are ready
        this.generateStylesDebounced();
      }
    } catch (e) {
      console.error("Colorful Folders: Failed to load local icons", e);
    }
  }

  onunload() {
    this.getOpenDocuments().forEach(doc => {
      if (this.sheet) {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== this.sheet);
      }
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
    if (this.isGeneratingStyles) return;
    this.isGeneratingStyles = true;
    try {
      const css = await this.styleGenerator.generateCss();
      window.requestAnimationFrame(() => {
        if (this.sheet) {
          this.sheet.replaceSync(css);
        }
        this.getOpenDocuments().forEach(doc => {
          doc.body.classList.toggle(
            "cf-show-hidden",
            this.settings.showHiddenItems,
          );
          doc.body.classList.toggle(
            "cf-wrap-metadata",
            !!this.settings.wrapMetadata,
          );
        });
      });
      // Sync folder colors to Graph View groups if the feature is enabled
      if (this.settings.graphColorSync && !this.isDragging) {
        void GraphColorSync.syncGraphColors(this);
      }
    } finally {
      this.isGeneratingStyles = false;
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
    const docs = new Set<Document>();
    docs.add(activeDocument);
    this.app.workspace.iterateAllLeaves((leaf) => {
      const doc = leaf.view?.containerEl?.ownerDocument;
      if (doc) docs.add(doc);
    });
    return Array.from(docs);
  }

  async autoDownloadPack(url: string, prefix: string) {
    try {
      const res = await obsidian.requestUrl({ url });
      const data = res.json as Record<string, unknown>;
      if (!data) return;

      const icons = data.icons as Record<string, { width?: number; height?: number; left?: number; top?: number; body?: string }> | undefined;
      if (icons && (data.prefix || data.info)) {
        const packPrefix = (data.prefix as string) || prefix;
        const commonW = (data.width as number) || 24;
        const commonH = (data.height as number) || 24;

        const processIcon = (name: string, iconData: { width?: number; height?: number; left?: number; top?: number; body?: string }) => {
          const id = `${packPrefix}-${name}`;
          const w = iconData.width || commonW;
          const h = iconData.height || commonH;
          const l = iconData.left || 0;
          const t = iconData.top || 0;
          const body = iconData.body;
          if (!body) return false;

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
