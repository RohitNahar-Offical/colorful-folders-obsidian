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

---

## 2. `StyleGenerator` (Static Engine)

### `generateCss(plugin: IColorfulFoldersPlugin): string`
Generates the full CSS bundle for the current vault state.

### `traverse(folder: TFolder, depth: number, state: TraversalState): void`
Recursive engine that walks the file tree.
- **State**: Tracks color indices and parent styles.

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

### `normalizeSvg(svgStr: string)`
Hardens raw SVG strings for CSS masks.
- **Logic**: Strips backgrounds, removes hardcoded colors.

### `colorizeSvg(svgStr: string, color: string)`
Intelligently tints an SVG by rewriting path attributes.

### `invalidateCategoryCache()`
Clears the category memoization and normalization caches. Called when icon settings are modified.

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

---

## 6. Integrations

### `NotebookNavigatorIntegration`
- `getExtraContainers(app)`: Finds elements matching `.nn-navitem`.

---

> [!TIP]
> Use the `TraversalState` object to pass context through recursive calls without creating new objects on every frame.
