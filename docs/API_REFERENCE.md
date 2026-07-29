# 📖 API Reference

> [!NOTE]
> Detailed technical reference for the public and internal APIs of the **Colorful Folders** codebase.

---

## 1. `ColorfulFoldersPlugin` (Main Class)

| Method / Property | Purpose | Key Action |
| :--- | :--- | :--- |
| `generateStyles` | Main update trigger | CSS Injection via `AdoptedStyleSheetService` |
| `registerCustomIcons` | Hydrates icon registry | `obsidian.addIcon()` |
| `toggleStealthMode` | Privacy switching | `PasswordModal` trigger |
| `loadLocalIcons` | Scans `.obsidian/icons` at startup | Parallel `Promise.all` reads into `localFileSystemIcons` |
| `saveSettings` | Persists data and triggers re-render | Selectively clears icon cache only when icon settings change |
| `lifecycleService` | Instance of `PluginLifecycleService` | Encapsulates document tracking, vault event listeners, and cleanup |

### `localFileSystemIcons: Record<string, string>`
A map of SVG icon name → raw SVG content, populated by `loadLocalIcons()` at startup. Checked by `IconManager.getIconSvg()` after `customIcons` but before Lucide.

---

## 1b. `PluginLifecycleService` (`src/services/PluginLifecycleService.ts`)

Encapsulates plugin lifecycle management, window tracking, and vault event listeners:
- `initializeDocumentTracking()`: Tracks all open workspace documents across popout windows.
- `registerVaultCacheEvents()`: Listens to vault `create`, `modify`, `delete` events to invalidate container/folder caches.
- `onLayoutReady()`: Runs layout initialization, icon pre-warming, menu extensions, and divider observer setup.
- `destroy()`: Unregisters listeners, clears memory caches, and detaches stylesheets on plugin unload.

---

## 2. `StyleGenerator` (CSS Traverser Engine)

### `generateCss(): string`
Generates the complete CSS bundle for the current vault state by calling `BaseCssGenerator` functions and recursively traversing the vault structure.

### `traverse(folder: TFolder, depth: number, state: TraversalState): void`
Recursive engine that walks the file tree.
- **State**: Tracks color indices, parent styles, and tint opacity. Guarantees complete CSS ruleset preservation for all active items across reloads.

---

## 2b. `ColorResolver` (Mathematical Resolver)

Centralizes all visual math calculation functions:
- `resolveColor(...)`: Decides active/inherited/palette colors for items.
- `resolveOpacity(...)`: Computes linear opacity fade from root depth.
- `resolveTextColor(...)`: Enforces WCAG text readability against folder colors.
- `getCurrentPalette(...)`: Resolves the active theme palette and caches it.
- `isDarkMode()`: Checks body theme to toggle light/dark modes.

---

## 2c. `StyleResolver` (State Abstracter)

Abstracts dynamic settings query loops from `main.ts` and UI views:
- `getEffectiveStyle(target, plugin)`: Resolves full `EffectiveStyle` (color, opacity, text color, bold/italic, icon) for files/folders.
- `getStyle(plugin, path)`: Safely fetches local style customizations or overrides.

---

## 2d. `BaseCssGenerator` (Static Stylesheet Builder)

Builds the base CSS declarations injected into adoption sheets:
- `generateGlobalBaseCss()`: General flex, mask, and metadata wrap overrides.
- `generateDividerCss(settings)`: Section divider wrapper and spacing layouts.
- `generateStealthCss(settings)`: Hidden item styles.

---

## 2e. `VaultUtils` (Vault Utility Helpers)

- `countItems(folder, plugin)`: Efficiently counts file and folder children using the plugin instance count cache.

---

## 3. `DividerManager` (DOM Controller)

### `syncDividers(): void`
Reconciles the DOM with the desired divider state.
- **Constraint**: Debounced to 50ms.

### `buildDividerNode(path, config, doc): HTMLElement`
HTML factory for the divider component.
- **Features**: Context menus & hover listeners.

---

---

## 4. `IconRepository` & `IconManager` (Tiered Icon Engine)

### `IconRepository`
Core resolution engine supporting a 4-tier priority system (`Tier 1`: Pack Exact > `Tier 2`: Custom Rule > `Tier 3`: Category Rule > `Tier 4`: Stemmed Fuzzy Match).

- **`getAutoIconData(name: string, path?: string): AutoIconData | null`**: Returns `AutoIconData` populated with `tier: 1|2|3|4` and `packSource` (`custom`, `lucide`, `simple-icons`, `custom-rule`, `category-default`, `fuzzy-match`).
- **`findIconInPacks(searchKey: string): string | null`**: Performs $O(1)$ pack lookup using `IconPackIndex` and `_findPackIconCache`.
- **`getIconSvg(iconId: string, shouldEncode?: boolean): string`**: Resolves an icon ID to a normalized, optionally URL-encoded SVG string using `_normCache` (LRU).
- **`getDataUri(iconId: string): string`**: Memoized Data-URI generator backed by `_dataUriCache` (LRU).
- **`preNormalizeIcon(id: string, rawSvg: string): void`**: Eagerly normalizes and pre-caches raw and encoded Data-URI representations into `iconCache` and `_dataUriCache` at load time.
- **`invalidateCache(): void`**: Flushes all internal LRU caches and invalidates `_packIndex` snapshot.

### `AIIconClassifier` (`src/integrations/AIIconClassifier.ts`)
Instance service (`plugin.aiIconClassifier`) for context-aware LLM icon classification across vault folders and Markdown files.
- **`classifyVault(options?: { force?: boolean }): Promise<void>`**: Triggers privacy verification, context payload generation, LLM batch execution, smart icon resolution, and style updates.
- **`stopClassification(): void`**: Cancels ongoing classification tasks gracefully via Notice feedback.
- **`queryAI(payload: any[], systemPrompt: string): Promise<Record<string, unknown>>`**: Coordinates provider-specific subroutines (`queryGemini`, `queryClaude`, `queryOllama`, `queryOpenAI`).
- **`parseJsonResponse(textResult: string): Record<string, unknown>`**: Pre-sanitizes `=>` / `->` arrow notation, strips `<think>` tags and markdown codeblocks, and returns key-value mapping arrays.
- **`unwrapOuterJsonObject(parsed: Record<string, unknown>): Record<string, unknown>`**: Recursively flattens nested group/category maps into a single flat classification dictionary.

### `IconPackIndex` (`src/core/IconPackIndex.ts`)
In-memory index maintaining `exactMap`, `coreMap`, and `suffixMap` to enable $O(1)$ lookups.
- **`build(localIcons, customIcons): void`**: Builds lookup maps with automatic pack priority tie-breaking using `PACK_PRIORITY`.
- **`findIcon(searchKey: string): string | null`**: Performs $O(1)$ exact, prefix-stripped, and suffix-matched lookups.
- **`searchFuzzy(searchKey: string, options?: { threshold?: number }): string | null`**: Optimized fuzzy search with $O(1)$ fast-path pre-check, length-difference pruning ratio `1 - threshold`, word-boundary similarity alignment, and single-row Levenshtein buffer.
- **`getIsBuilt(): boolean`**: Returns index build status.

### `CategoryTrie` (`src/core/CategoryTrie.ts`)
Node-based prefix trie (`TrieNode`) for `AUTO_ICON_CATEGORIES`.
- **`build(categories: AutoIconData[]): void`**: Inserts category words into the prefix trie node hierarchy (`insertWord`).
- **`lookup(name: string): AutoIconData[]`**: Tokenizes input name and walks the node tree to return only matching category candidates.

### `Utils` (`src/common/utils.ts`)
- **`normalizePathKey(path: string): string`**: Lowercases path and strips `.md` extension while preserving `/` slashes, preventing path collisions across subfolders.
- **`normalizeIconName(iconId: string): string`**: Standardizes icon key cleaning across AI Classification, Auto-Icon resolution, and Pack Index lookups.

### `AdoptedStyleSheetService` (`src/services/AdoptedStyleSheetService.ts`)
Manages CSS injection directly into browser window `document.adoptedStyleSheets`.
- **`initializeStyles(): void`**: Attaches the programmatic stylesheet to all workspace window documents.
- **`updateStyles(cssString: string): void`**: Synchronously replaces sheet CSS rules via `sheet.replaceSync()`.
- **`clearStyles(): void`**: Flushes all CSS rules from the stylesheet.
- **`unload(): void`**: Detaches the stylesheet from all workspace window documents on plugin teardown.

---

## 5. UI Modals & Views

### `ColorfulFoldersSettingTab`
- **Purpose**: Global configuration interface.
- **UX Patterns**:
  - **Dynamic Tooltips**: All numerical sliders implement `.setDynamicTooltip()` to show precise values during interaction.
  - **Reset Buttons**: Settings include an `.addExtraButton` configured as a reset action, reverting the value to `DEFAULT_SETTINGS` and re-rendering instantly.

### `DividerModal`
- **Purpose**: Per-divider configuration (text, icon, padding).
- **UX**: Live-sync preview.

### `HoverMessageModal`
- **Purpose**: Markdown-supported editor for popovers.
- **Features**: Real-time rendering, link/tag suggester.

### `ColorPickerModal`
- **Purpose**: Central styling engine.
- **Layout**: Tabbed interface (Appearance, Icon, Inheritance, Presets).

### `IconPickerModal`
- **Purpose**: Visual grid-based icon selector used in the Regex Builder.
- **Sources**: Merges Lucide icons, `customIcons`, and `localFileSystemIcons` into one searchable grid.
- **Filtering**: Auto-generates pack filter options from icon ID prefixes (e.g., `lucide`, `remix`, `custom`).

---

## 6. Integrations

### `NotebookNavigatorIntegration`
- `getExtraContainers(app)`: Finds elements matching `.nn-navitem`.

### `GraphColorSync`
- `syncGraphColors(plugin)`: Builds color groups from the vault state and merges them into `graph.json`, preserving user-created groups.
- `clearGraphColors(plugin)`: Removes all plugin-generated groups from `graph.json`.
- `buildColorGroups(plugin)`: Traverses the vault to build color query arrays for valid folders.

### `TagColorSync`
- `generateCss(plugin, context)`: Generates CSS rules that colorize `#tags` in the editor and reading view to match folder colors or custom tag rules.
- **Settings keys**: `tagSyncEnabled`, `tagSyncMatchFolders`, `tagSyncRules`.

---

> [!TIP]
> Use the `TraversalState` object to pass context through recursive calls without creating new objects on every frame.
