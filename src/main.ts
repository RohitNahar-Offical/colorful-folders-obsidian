import { StyleResolver } from './core/StyleResolver';
import * as obsidian from "obsidian";
import {
  ColorfulFoldersSettings,
  FolderStyle,
  EffectiveStyle,
  IColorfulFoldersPlugin,
} from "./common/types";
import { DEFAULT_SETTINGS } from "./common/constants";
import {
  hexToRgbObj,
  anyToHex,
  parseCustomPalette,
  safeEscape,
} from "./common/utils";
import { NotebookNavigatorIntegration } from './integrations/NotebookNavigator';
import { GraphColorSync } from './integrations/GraphColorSync';
import { ColorPickerModal } from "./ui/modals/ColorPickerModal";
import { DividerModal } from "./ui/modals/DividerModal";
import { ColorfulFoldersSettingTab } from "./ui/SettingTab";
import { PasswordModal } from "./ui/modals/PasswordModal";
import { ChangelogModal } from "./ui/modals/ChangelogModal";
import { StyleGenerator } from "./core/StyleGenerator";
import { DividerManager } from "./core/DividerManager";

import { MenuHelper } from "./ui/MenuHelper";
import { IconManager } from "./core/IconManager";

declare module "obsidian" {
  interface Workspace {
    on(name: "window-open", callback: (win: unknown, doc: Document) => unknown, ctx?: unknown): obsidian.EventRef;
  }
}

export default class ColorfulFoldersPlugin
  extends obsidian.Plugin
  implements IColorfulFoldersPlugin
{
  declare settings: ColorfulFoldersSettings;
  iconManager: IconManager;
  sheet: CSSStyleSheet;

  iconCache: Map<string, string> = new Map();
  heatmapCache: Map<string, number> | null = null;
  folderCountCache: Map<string, { files: number; folders: number }> | null =
    null;
  generateStylesDebounced: obsidian.Debouncer<[], void>;
  refreshIconsDebounced: obsidian.Debouncer<[], void>;
  localFileSystemIcons: Record<string, string> = {};
  dividerObserver: MutationObserver | null = null;
  styleObservers: MutationObserver[] = [];
  dividerManager: DividerManager;
  styleGenerator: StyleGenerator;
  isSyncingDividers: boolean = false;
  isDragging: boolean = false;
  processDividersDebounced: obsidian.Debouncer<[], void>;
  ribbonEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();
    this.styleGenerator = new StyleGenerator(this);
    this.iconManager = new IconManager(this);
    this.dividerManager = new DividerManager(this);
    // Register Notebook Navigator extensions
    this.app.workspace.onLayoutReady(() => {
      NotebookNavigatorIntegration.registerMenuExtensions(this);
      // Defer loading of local icons to keep initial startup fast
      window.setTimeout(() => {
        void this.loadLocalIcons();
      }, 2000);
    });

    this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

    this.generateStylesDebounced = obsidian.debounce(
      () => {
        if (this.isDragging) return;
        this.generateStyles();
        // P2 fix: initDividerObserver re-inits on layout-change; no need here
      },
      300,
      true,
    );

    this.processDividersDebounced = obsidian.debounce(
      () => {
        if (this.isSyncingDividers || this.isDragging) return;
        this.dividerManager.syncDividers();
      },
      50,
      true,
    );

    this.refreshIconsDebounced = obsidian.debounce(
      () => {
        if (this.isDragging) return;
        this.refreshIcons();
      },
      100,
      true,
    );

    this.refreshRibbon();

    // UI styles moved to styles.css to comply with obsidianmd/no-forbidden-elements

    this.initializeStyles();

    this.registerCustomIcons();
    this.registerEvents();
    this.registerCommands();
    this.initStyleObservers();

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
      // Defer heavy startup tasks to prevent UI lag on plugin load
      window.setTimeout(() => {
        this.generateStyles();
        this.initDividerObserver();
      }, 50);

      try {
        const optimized = await this.optimizeBlueTopazStyleSettings();
        if (optimized) {
          new obsidian.Notice("Colorful Folders: Conflicting Blue Topaz theme settings in Style Settings have been automatically disabled.");
        }
      } catch (err) {
        console.error("Colorful Folders: Failed to optimize Blue Topaz settings", err);
      }

      // Check for version update and show changelog
      const currentVersion = this.manifest.version;
      if (this.settings.lastVersion !== currentVersion) {
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
      }
    } catch(e) {
      console.error("Colorful Folders: Failed to load local icons", e);
    }
  }

  onunload() {
    this.getOpenDocuments().forEach(doc => {
      if (this.sheet) {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== this.sheet);
      }
    });
    if (this.dividerObserver) this.dividerObserver.disconnect();
    this.styleObservers.forEach(obs => obs.disconnect());

    // Clean up scroll listeners
    const allContainers = this.getAllExplorerContainers();

    allContainers.forEach((container) => {
      container.removeEventListener("scroll", this.handleScroll);
      delete (container as HTMLElement & { cfHasScrollListener?: boolean }).cfHasScrollListener;
    });

    this.cleanDividers();

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

    await this.saveData(this.settings);

    if (shouldClearIconCache) {
      this.iconCache.clear();
      this.iconManager.invalidateCategoryCache();
      this._lastIconRulesKey = this.settings.customIconRules || '';
      this._lastCustomIconsKey = JSON.stringify(this.settings.customIcons || {});
    }

    this.generateStylesDebounced();
  }

  registerCustomIcons() {
    for (const [id, svg] of Object.entries(this.settings.customIcons)) {
      obsidian.addIcon(id, svg);
    }
  }

  registerEvents() {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        MenuHelper.addContextMenuItems(menu, file, this);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.initDividerObserver()),
    );

    // Performance: Detect drag operations to suspend expensive animations and logic
    this.getOpenDocuments().forEach(doc => {
      this.registerDragEventsForDoc(doc);
    });

    this.registerEvent(
      this.app.workspace.on("window-open", (win: unknown, doc: Document) => {
        if (this.sheet && !doc.adoptedStyleSheets.includes(this.sheet)) {
          doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
        }
        this.registerDragEventsForDoc(doc);
        this.initStyleObservers();
        this.generateStylesDebounced();
      })
    );

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => this.updateActiveParentClasses(file?.path || "")),
    );
    this.registerEvent(
      // PERF FIX 5: Debounce css-change. Obsidian fires this event multiple times
      // during theme switches/plugin reloads. The leading-edge debouncer fires
      // instantly on the first call, then coalesces all rapid-fire follow-ups.
      this.app.workspace.on("css-change", () => this.generateStylesDebounced()),
    );

    this.registerEvent(
      this.app.vault.on("create", () => {
        this.heatmapCache = null;
        this.folderCountCache = null; // P1: invalidate counter cache
        this.generateStylesDebounced();
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", () => {
        this.heatmapCache = null;
        this.folderCountCache = null; // P1: invalidate counter cache
        this.generateStylesDebounced();
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        this.heatmapCache = null;
        this.folderCountCache = null; // P1: invalidate counter cache
        if (this.settings.customFolderColors[oldPath]) {
          const style = this.settings.customFolderColors[oldPath];
          this.settings.customFolderColors[file.path] = style;
          delete this.settings.customFolderColors[oldPath];

          for (const key of Object.keys(this.settings.customFolderColors)) {
            if (key.startsWith(oldPath + "/")) {
              const newKey = file.path + key.slice(oldPath.length);
              this.settings.customFolderColors[newKey] =
                this.settings.customFolderColors[key];
              delete this.settings.customFolderColors[key];
            }
          }
          await this.saveSettings();
        } else {
          this.generateStylesDebounced();
        }
      }),
    );
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
              this.generateStyles();
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
      this.generateStyles();
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
    const currentTheme = customApp.customCss?.theme;
    if (currentTheme !== "Blue Topaz") return false;

    if (!customApp.plugins) return false;
    const styleSettingsPlugin = customApp.plugins.getPlugin("obsidian-style-settings") as unknown as StyleSettingsPlugin | null;
    if (!styleSettingsPlugin) return false;

    const manager = styleSettingsPlugin.settingsManager;
    if (!manager || !manager.settings) return false;

    let changed = false;

    if (manager.settings["blue-topaz-theme@@remove-file-icons"] !== false) {
      manager.settings["blue-topaz-theme@@remove-file-icons"] = false;
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

    if (changed) {
      manager.removeClasses();
      await manager.save();
      manager.initClasses();
      return true;
    }

    return false;
  }





  generateStyles() {
    if (this.sheet) {
      this.sheet.replaceSync(this.styleGenerator.generateCss());
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
    // Ensure parent classes are indexed on startup/refresh
    this.updateActiveParentClasses(this.app.workspace.getActiveFile()?.path || "");
    this.refreshIcons();
    // Sync folder colors to Graph View groups if the feature is enabled
    if (this.settings.graphColorSync) {
      void GraphColorSync.syncGraphColors(this);
    }
  }

  refreshIcons() {
    this.iconManager.refreshIcons();
  }

  updateActiveParentClasses(activePath: string) {
    this.getOpenDocuments().forEach(doc => {
      doc.querySelectorAll('.cf-active-parent').forEach(el => el.classList.remove('cf-active-parent'));
      if (!activePath) return;

      const segments = activePath.split('/');
      let current = "";
      for (let i = 0; i < segments.length - 1; i++) {
        current += (current ? '/' : '') + segments[i];
        const safePath = safeEscape(current);
        doc.querySelectorAll(`.nav-folder-title[data-path="${safePath}"]`).forEach(title => {
          const folder = title.closest('.nav-folder, .tree-item, .nn-navitem');
          if (folder) folder.classList.add('cf-active-parent');
        });
      }
    });
  }

  private isScrolling = false;
  private scrollTimeout: number | null = null;

  handleScroll = (e: Event) => {
    const container = e.currentTarget as HTMLElement;
    const doc = container.ownerDocument;
    const win = doc.defaultView || activeWindow;
    this.isScrolling = true;
    win.clearTimeout(this.scrollTimeout || undefined);
    this.scrollTimeout = win.setTimeout(() => {
      this.isScrolling = false;
      this.processDividers();
      // FIX 1: Single catch-up icon refresh after scroll stops.
      // This ensures any nodes recycled by Obsidian's virtual list
      // during the scroll are correctly decorated after motion ends.
      this.refreshIconsDebounced();
    }, 100);
  };

  getAllExplorerContainers(): HTMLElement[] {
    const explorers: HTMLElement[] = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view as obsidian.View & {
        getViewType(): string;
        containerEl: HTMLElement;
      };
      if (
        view.getViewType() === "file-explorer" ||
        view.getViewType() === "nav-files"
      ) {
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

  initDividerObserver() {
    if (this.isDragging) return; // Prevent layout-change from reactivating observer mid-drag

    if (this.dividerObserver) {
      this.dividerObserver.disconnect();
    }

    const allContainers = this.getAllExplorerContainers();

    if (allContainers.length === 0) return;

    allContainers.forEach((container) => {
      // Check if we already have a scroll listener (using a custom property to track)
      if (
        (container as HTMLElement & { cfHasScrollListener?: boolean })
          .cfHasScrollListener
      )
        return;
      (
        container as HTMLElement & { cfHasScrollListener?: boolean }
      ).cfHasScrollListener = true;

      container.addEventListener("scroll", this.handleScroll, { passive: true });
    });

    this.dividerObserver = new MutationObserver((mutations) => {
      // Suspend all logic during virtualized scroll or drag operations
      if (this.isSyncingDividers || this.isScrolling || this.isDragging) return;

      let hasRelevantChange = false;
      for (const m of mutations) {
        // Ignore any changes inside our own icon wrappers or interactive dividers
        const target = m.target as HTMLElement;
        if (target.closest(".cf-icon-wrapper, .cf-interactive-divider"))
          continue;

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
        // FIX 1: Do NOT call refreshIconsDebounced during scroll.
        // The scroll handler already queues a catch-up refresh after scroll stops.
        // FIX 2: For non-scroll mutations (expand/collapse/new file), inject icons
        // only on the specific nodes that changed (O(N-changed) vs O(N-total)).
        if (!this.isScrolling) {
          const addedNodes = mutations
            .flatMap(m => Array.from(m.addedNodes));
          if (addedNodes.length > 0) {
            // Targeted: inject only into the nodes that just appeared
            const nodelist = {
              forEach: (cb: (node: Node) => void) => addedNodes.forEach(cb),
            } as unknown as NodeList;
            this.iconManager.injectIconsForNodes(nodelist);
          } else {
            // Fallback for remove-only mutations (e.g., folder collapse)
            this.refreshIconsDebounced();
          }
        }
      }
    });

    allContainers.forEach((container) => {
      this.dividerObserver?.observe(container, {
        childList: true,
        subtree: true,
      });
    });
  }

  processDividers() {
    if (this.isSyncingDividers || this.isScrolling) return;
    if (this.processDividersDebounced) this.processDividersDebounced();
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

  registerDragEventsForDoc(doc: Document) {
    this.registerDomEvent(doc, "dragstart", () => {
      this.isDragging = true;
      if (this.dividerObserver) {
          this.dividerObserver.disconnect();
      }
    });
    
    const handleDragEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      
      // Physically reconnect the observer
      this.initDividerObserver();
      
      // Catch-up render after drag finishes
      if (this.processDividersDebounced) this.processDividersDebounced();
      if (this.refreshIconsDebounced) this.refreshIconsDebounced();
    };
    
    this.registerDomEvent(doc, "dragend", handleDragEnd);
    this.registerDomEvent(doc, "drop", handleDragEnd);
  }

  initStyleObservers() {
    if (this.styleObservers) {
      this.styleObservers.forEach(obs => obs.disconnect());
    }
    this.styleObservers = [];

    this.getOpenDocuments().forEach(doc => {
      const observer = new MutationObserver((mutations) => {
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
          this.generateStylesDebounced();
        }
      });
      observer.observe(doc.body, {
        attributes: true,
        attributeFilter: ["class"],
        attributeOldValue: true,
      });
      this.styleObservers.push(observer);
    });
  }
}
