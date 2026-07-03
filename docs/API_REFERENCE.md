# 📖 API Reference

> [!NOTE]
> Detailed technical reference for the public and internal APIs of the **Colorful Folders** codebase.

---

## 1. `ColorfulFoldersPlugin` (Main Class)

| Method | Purpose | Key Action |
| :--- | :--- | :--- |
| `getEffectiveStyle` | Resolves visual state | Inheritance & Fallbacks |
| `generateStyles` | Main update trigger | CSS Injection |
| `registerCustomIcons` | Hydrates icon registry | `obsidian.addIcon()` |
| `toggleStealthMode` | Privacy switching | `PasswordModal` trigger |
| `loadLocalIcons` | Scans `.obsidian/icons` at startup | Parallel `Promise.all` reads into `localFileSystemIcons` |
| `saveSettings` | Persists data and triggers re-render | Selectively clears icon cache only when icon settings change |

### `localFileSystemIcons: Record<string, string>`
A map of SVG icon name → raw SVG content, populated by `loadLocalIcons()` at startup. Checked by `IconManager.getIconSvg()` after `customIcons` but before Lucide.

---

## 2. `StyleGenerator` (Static Engine)

### `generateCss(plugin: IColorfulFoldersPlugin): string`
Generates the full CSS bundle for the current vault state.

### `traverse(folder: TFolder, depth: number, state: TraversalState): void`
Recursive engine that walks the file tree.
- **State**: Tracks color indices and parent styles.

### Counter SVG Template Cache
Private fields `_counterSvgColor`, `_counterSvgPrefix`, `_counterSvgMid`, `_counterSvgSuffix` cache the pre-encoded static segments of the folder counter SVG. The template is rebuilt only when the folder color changes, reducing per-folder CPU cost from O(N·regex) to O(1).

---

## 3. `DividerManager` (DOM Controller)

### `syncDividers(): void`
Reconciles the DOM with the desired divider state.
- **Constraint**: Debounced to 50ms.

### `buildDividerNode(path, config, doc): HTMLElement`
HTML factory for the divider component.
- **Features**: Context menus & hover listeners.

---

## 4. `IconManager` (Rendering Central)

### `getAutoIconData(name: string)`
Matches filename against global regex category system.
- **Cache**: `_categoryCache` is rebuilt only when `customIconRules` changes, not on every call.

### `getIconSvg(iconId: string, encode?: boolean): string`
Resolves an icon ID to a normalized, optionally URL-encoded SVG string.
- **Priority**: `customIcons` → `localFileSystemIcons` → Lucide.
- **Cache**: Result stored in `plugin.iconCache` keyed by `${iconId}-${enc|raw}`.

### `normalizeSvg(svgStr: string)`
Hardens raw SVG strings for CSS masks.
- **Logic**: Strips backgrounds, removes hardcoded colors.

### `colorizeSvg(svgStr: string, color: string)`
Intelligently tints an SVG by rewriting path attributes.

### `invalidateCategoryCache()`
Clears the category memoization and normalization caches. Called **only** when icon-relevant settings (`customIcons`, `customIconRules`) are modified.

---

## 5. UI Modals

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
