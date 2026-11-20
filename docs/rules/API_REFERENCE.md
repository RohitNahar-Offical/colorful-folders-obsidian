# 📖 API Reference

> [!NOTE]
> Detailed technical reference for the public and internal APIs of the **Colorful Folders** codebase.

---

## 1. `ColorfulFoldersPlugin` (Main Class)

| Method / Property | Purpose | Key Action |
| :--- | :--- | :--- |
| `generateStyles` | Main update trigger | CSS Injection via `AdoptedStyleSheetService` |
| `getCustomIcon` | Fast O(1) custom icon lookup | Returns SVG content string without object allocation |
| `getCustomIconsMap` | Custom icons dictionary reference | Returns primary custom icons map reference |
| `registerCustomIcons` | Hydrates icon registry | `obsidian.addIcon()` in non-blocking idle batches |
| `loadLocalCustomIcons` | Loads local icon asset files | Reads `.obsidian/plugins/colorful-folders/icons/*.json` into `localCustomIcons` |
| `saveLocalCustomIcons` | Persists custom icons locally | Writes `localCustomIcons` to `icons/custom-icons.json` |
| `removePackIcons` | Removes downloaded icon pack | Deletes pack JSON file and removes keys from memory |
| `toggleStealthMode` | Privacy switching | `PasswordModal` trigger |
| `loadLocalIcons` | Scans `.obsidian/icons` at startup | Parallel `Promise.all` reads into `localFileSystemIcons` |
| `saveSettings` | Persists data and triggers re-render | Selectively clears icon cache only when icon settings change |
| `queryExplorerContainers` | Explorer container discovery | Queries native and third-party explorer elements across active documents |
| `syncRuntimeSettings` | Submodule settings synchronization | Propagates active settings and palette text/icon pairs before style generation |
| `lifecycleService` | Instance of `PluginLifecycleService` | Encapsulates document tracking, vault event listeners, and cleanup |

### `localCustomIcons: Record<string, string>`
In-memory map of custom SVG icons loaded from `.obsidian/plugins/colorful-folders/icons/` asset files. Accessed via `getCustomIcon(id)` or `getCustomIconsMap()`.

### `localFileSystemIcons: Record<string, string>`
A map of SVG icon name → raw SVG content, populated by `loadLocalIcons()` at startup. Checked by `IconManager.getIconSvg()` after custom icons but before Lucide.

---

## 1b. `PluginLifecycleService` (`src/services/PluginLifecycleService.ts`)

Encapsulates plugin lifecycle management, window tracking, and vault event listeners:
- `initializeDocumentTracking()`: Tracks all open workspace documents across popout windows.
- `registerVaultCacheEvents()`: Listens to vault `create`, `modify`, `delete` events to invalidate container/folder caches.
- `onLayoutReady()`: Runs layout initialization, icon pre-warming, menu extensions, and divider observer setup.
- `destroy()`: Unregisters listeners, clears memory caches, and detaches stylesheets on plugin unload.

---

## 1c. `EventTrackerService` (`src/services/EventTrackerService.ts`)

Centralizes reactive Obsidian workspace and DOM event tracking, active folder markers, and drag observation:
- `registerEvents()`: Hooks into vault metadata, file modifications, and workspace events.
- `registerWorkspaceEvents()`: Unified cross-platform workspace lifecycle event listener consolidating mobile and desktop handlers (`file-menu`, `layout-change`, `active-leaf-change`, `file-open`, `css-change`).
- `registerDomEvent(element, event, callback, options?)`: DOM event listener supporting `AddEventListenerOptions | boolean` (capture phase, passive flag) with lifecycle tracking and clean removal in `destroy()`.
- `registerDragEventsForDoc(doc: Document)`: Suspends divider observers during drag operations.
- `registerClickEventsForDoc(doc: Document)`: Capturing delegated click listener dispatching to `AnimatedIconService.handleDelegatedClick` with zero overhead when no animated icons are in use.
- `updateActiveFolderClasses()`: Updates active file and parent folder highlights (`.cf-active-parent`, `.cf-is-active`).
- `destroy()`: Unregisters all workspace event references and cleans up DOM listeners with options.

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

### `findTargetElement(container: Element, path: string, isGlobal: boolean, domPathMap?: Map<string, HTMLElement>): HTMLElement | null`
Unified element resolver supporting desktop, mobile (`.mobile-tree-item`), and third-party containers with optional fast-path DOM path mapping.

### `buildDividerNode(path, config, doc): HTMLElement`
HTML factory for the divider component.
- **Features**: Context menus & hover listeners.

---

---

## 4. `IconRepository` & `IconManager` (Tiered Icon Engine)

### `IconRepository`
Core resolution engine supporting a 4-tier priority system (`Tier 1`: Pack Exact > `Tier 2`: Custom Rule > `Tier 3`: Category Rule > `Tier 4`: Stemmed Fuzzy Match).

- **`getAutoIconData(name: string, path?: string, isFile?: boolean): AutoIconData | null`**: Returns `AutoIconData` populated with `tier: 0 | 0.5 | 0.8 | 0.9 | 1 | 2 | 3 | 4` and `packSource`. Employs seeded variety hashing `hashString(seed !== 0 ? `${baseStr}#${seed}` : baseStr)` where `baseStr = path || name` when `autoIconVariety` is enabled. Rotates `match.emojis` and `match.lucides` so variety selections propagate to all fallback pack resolvers. Implements self-healing cache guards detecting changes to `customIconRules`, `varietySeed`, or `autoIconVariety`.
- **`findIconInPacks(searchKey: string): string | null`**: Performs $O(1)$ pack lookup using `IconPackIndex` and `_findPackIconCache`.
- **`getIconSvg(iconId: string, shouldEncode?: boolean): string`**: Resolves an icon ID to a normalized, optionally URL-encoded SVG string using `_normCache` (LRU).
- **`getDataUri(iconId: string): string`**: Memoized Data-URI generator backed by `_dataUriCache` (LRU).
- **`getMaskDataUri(iconId: string, rawSvg?: string): string`**: Generates and memoizes `-webkit-mask-image: url("data:image/svg+xml,...")` CSS mask rules directly in `_dataUriCache`.
- **`preNormalizeIcon(id: string, rawSvg: string): void`**: Eagerly normalizes and pre-caches raw and encoded Data-URI representations into `iconCache` and `_dataUriCache` at load time.
- **`invalidateAutoIconCache(path?: string): void`**: Directly clears targeted path entries in $O(1)$ or flushes the entire auto-icon cache.
- **`invalidateCache(): void`**: Flushes all internal LRU caches (`_normCache`, `_dataUriCache`, `_findPackIconCache`, `_autoIconResultCache`, `_iconValidityCache`) and resets category and pack index snapshots.

### `AnimatedIconService` (`src/services/AnimatedIconService.ts`)
Facade orchestrator coordinating live animated SVG icon mounting, lifecycle hooks, and Zero-DOM pre-registration. Delegates core domain concerns to specialized services under `src/services/animation/`:
- **`registerActiveAnimatedTarget(path: string, iconId: string, state?: 'closed' | 'open' | 'both'): void`**: Registers an active animated icon target during `StyleGenerator.generateCss()`, supporting independent closed, open, or bilateral folder states in $O(1)$ memory.
- **`clearRegisteredAnimatedTargets(): void`**: Clears the active targets map prior to each stylesheet recompilation.
- **`syncAnimatedIcons(): void`**: Viewport synchronization routine executing in $O(K)$ time (where $K$ is the number of active animated elements). Queries only registered paths via targeted DOM selectors and mounts `.cf-live-animated-icon` containers.
- **`hasAnyAnimatedIcons(): boolean`**: Fast $O(1)$ memoized check verifying if animated icons are configured in settings or active in the vault.
- **`isAnimatedIcon(iconId: string): boolean`**: Evaluates whether an icon ID contains animation markup, delegating to `AnimationClassifier`.
- **`isLoopingAnimatedIcon(iconId: string): boolean`**: Distinguishes continuous infinite loop animations (including ping-pong chains) from single-shot animations.
- **`replayAnimatedElement(el: HTMLElement): void`**: Delegates to `AnimationPlaybackEngine` to restart animated icons upon user click or activation with a 300ms double-click throttle.
- **`replayTargetByPath(targetPath: string): void`**: Finds and replays visible single-shot animated icons for a specific file or folder path.
- **`getAnimatedIconElement(iconId: string): HTMLElement | null`**: Returns a pre-compiled, script-sanitized SVG DOM template element from `AnimationTemplateFactory`.
- **`clearAllLiveAnimatedIconsFromDom(): void`**: Synchronously removes all `.cf-live-animated-icon` elements and strips animation row classes (`cf-animated-icon-active`, `cf-has-animated-closed`, `cf-has-animated-open`) across all explorer containers on plugin unload or reload.
- **`syncSettings(): void`**: Propagates global animation speed (`syncSpeed`) to active document stylesheets.
- **`destroy(): void`**: Disconnects the `IntersectionObserver`, clears live DOM elements, empties active target registries, and purges all template caches across all domain sub-services.

#### Subsystem Domain Services (`src/services/animation/`)

- **`AnimationClassifier` (`AnimationClassifier.ts`)**:
  - `isAnimatedIcon(iconId: string): boolean`: Evaluates animation markup with $O(1)$ prefix pre-checks.
  - `isSmilAnimated(iconId: string): boolean`: Detects `<animate*>` / `<set>` SMIL elements.
  - `isLoopingAnimatedIcon(iconId: string): boolean`: Checks for continuous loops or ping-pong chains (`cf_l[ab]_`, `.end+`).
  - `clearCache(): void`: Flushes classification memoization maps.
- **`AnimationTemplateFactory` (`AnimationTemplateFactory.ts`)**:
  - `getTemplate(iconId: string, rawSvg?: string, forceRaw?: boolean): HTMLElement | null`: Synthesizes, sanitizes, and returns cached DOM template wrapper.
  - `stripOuterBoxes(doc: Document): void`: Recursively locates and purges framing rectangles and 32x32 hit targets (`pointer-events="all"`).
  - `clearCache(): void`: Flushes template `LRUCache`.
- **`AnimationViewportManager` (`AnimationViewportManager.ts`)**:
  - `observe(el: HTMLElement): void`: Adds element to single shared `IntersectionObserver`.
  - `unobserve(el: HTMLElement): void`: Removes element from observer and weak set.
  - `wakeElement(el: HTMLElement): void`: Re-clones fresh SVG template when an element scrolls into view to recover stalled Chromium SMIL timebases.
  - `handleVisibilityChange(): void`: Toggles playback state when app or pop-out window loses focus.
  - `syncSpeed(speed: number): void`: Updates `--cf-icon-speed-scale` CSS variable on document roots.
- **`AnimationPlaybackEngine` (`AnimationPlaybackEngine.ts`)**:
  - `handleDelegatedClick(target: HTMLElement): boolean`: Resolves clicked icon wrappers, throttling multi-clicks to 300ms.
  - `replayElement(el: HTMLElement): void`: Triggers SMIL `beginElement()` restarts or WAAPI animation resets.
  - `replayTargetByPath(targetPath: string): void`: Replays visible single-shot animations for specific vault path.
- **`AnimationDomMounter` (`AnimationDomMounter.ts`)**:
  - `syncActiveTargets(targets: Map<string, RegisteredAnimatedTarget>): void`: Synchronizes registered targets with DOM nodes.
  - `mountOrUpdateLiveIcon(titleEl: HTMLElement, targetRow: HTMLElement, iconId: string, isFolder: boolean, isClosedFolder: boolean): void`: Unified DRY mounting function reconciling live DOM nodes.
  - `clearAllLiveIcons(): void`: Detaches all `.cf-live-animated-icon` elements and strips state classes.
- **`AnimationTypes` (`AnimationTypes.ts`)**:
  - `ANIMATED_PACK_PREFIXES`: Canonical tuple of supported animated icon prefixes (`line-md-`, `meteocons-`, `generative-`, `useanimations-`).
  - `ANIMATION_SELECTORS`: Consolidated CSS selectors (`NAV_ROW`, `TARGET_ROW_IS`, `NAV_TEXT`, `NN_ICON_SLOT`, `LIVE_ICON`, `CLOSED_LIVE_ICON`, `OPEN_LIVE_ICON`).
  - `RegisteredAnimatedTarget`: Interface defining mapped animation targets (`iconId`, `closedIconId`, `openIconId`).

### `DOMObserverService` (`src/services/DOMObserverService.ts`)
Zero-DOM observer coordination service managing dataset tagging and container scroll listeners:
- **`syncTagPaneDataset(): void`**: Stamps `data-tag-name` on Tag Pane tree items using Obsidian's in-memory `tagDoms` dictionary without layout thrashing.
- **`initDividerObserver(): void`**: Sets up `childList` mutation observers and passive scroll listeners on native and Notebook Navigator containers, automatically throttled during active scrolling.
- **`disposeDividerObserver(): void`**: Disconnects mutation observers and cancels pending animation frame synchronizations.
- **`destroy(): void`**: Detaches scroll event listeners from all explorer containers and cleans up timeout timers.

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
- **`matchesPackId(iconKey: string, packId: string): boolean` (static)**: Centralized predicate checking if an icon key matches a pack identifier or prefix.
- **`getPackPrefix(id: string): string` (static)**: Returns canonical pack prefix string with trailing hyphen.

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

### `SettingSection` (`src/ui/settings/SettingSection.ts`)
Abstract base class for all setting tab sections.
- **`protected refreshTab(): void`**: Type-safe tab refresh template method, encapsulating settings tab re-render without unsafe `any` casts.

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
- **`isSupported(settings: ColorfulFoldersSettings): boolean`**: Validates whether Notebook Navigator integration is enabled.
- **`showFileBg(settings: ColorfulFoldersSettings): boolean`**: Determines if file item colored background blocks are active.
- **`generateIntegratedStyles(...)`**: Emits complete CSS blocks for folders and files in Notebook Navigator using dual-target selectors (`.nn-file-icon-slot` and `.nn-file-icon`) and dimension-locking properties.
- **`getScopedNavSelectors(path: string): string[]`**: Returns scoped selectors matching real vault folders in Notebook Navigator while filtering system views.
- **`getScopedFileSelector(path: string): string`**: Returns scoped selector matching vault files in Notebook Navigator.

### `GraphColorSync`
- `syncGraphColors(plugin)`: Builds color groups from the vault state and merges them into `graph.json`, preserving user-created groups.
- `clearGraphColors(plugin)`: Removes all plugin-generated groups from `graph.json`.
- `buildColorGroups(plugin)`: Traverses the vault to build color query arrays for valid folders.

### `TagColorSync`
- `generateCss(plugin, context, folderColorMap?)`: Generates high-efficiency Flyweight CSS rules that colorize `#tags` in Live Preview, Reading view, and the Sidebar Tag Pane (`.tag-container`). Reuses in-flight folder colors (`folderColorMap`) to avoid duplicate vault sweeps, or performs an iterative stack DFS over `TFolder` nodes.
- `clearCache()`: Resets the internal deterministic memoization cache.
- **Settings keys**: `tagSyncEnabled`, `tagSyncMatchFolders`, `tagPaneSyncEnabled`, `tagSyncRules`.

### `OutlineSync`
- `generateCss(plugin, context)`: Generates memory-efficient Flyweight CSS rules synchronizing the Outline Pane table of contents (`.outline-view` / `[data-type="outline"]`) and in-note headings (H1–H6 in `.markdown-rendered` and `.cm-editor`). Structural styles are emitted once globally, with levels binding CSS custom variables (`--cf-h-*`).
- `clearCache()`: Resets the internal deterministic state-keyed memoization cache.
- **Settings keys**: `outlineSyncEnabled`, `noteHeadingsSyncEnabled`.

---

> [!TIP]
> Use the `TraversalState` object to pass context through recursive calls without creating new objects on every frame.
