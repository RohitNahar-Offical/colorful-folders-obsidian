# 🛠️ Contributing & Feature Implementation Guide

> [!NOTE]
> This guide provides step-by-step instructions for contributing to **Colorful Folders**. Follow these patterns to ensure code quality, theme harmony, and UI consistency.

---

## 1. Theme Compatibility & CSS Variable Hook Engine

Colorful Folders cooperates with Obsidian community themes rather than fighting them with brute-force overrides. When contributing styles or features, adhere to our theme-facing contract:

### 1.1 Published Theme State (on `<body>`)
In all open workspace windows (including popouts), the plugin publishes the active contrast state directly to `document.body`:
* **`.cf-folder-auto`**: Present whenever the **Auto contrast** engine is active.
* **`.cf-folder-auto-snap`**: Present when **Snap to black or white** is enabled.
* **`--cf-auto-steps`**: Lightness shift step multiplier (default: `3`).
* **`--cf-auto-tolerance`**: Snap boundary percentage (default: `0`).
* **`--cf-subfolder-opacity`**: Subfolder opacity setting so themes can compute perceived background luminosity.

### 1.2 Published Per-Row CSS Variables
Every styled item row exposes granular CSS variables consumed by themes and custom snippets:
* **`--cf-color`**: Raw hex color (e.g., `#6366f1`).
* **`--cf-color-rgb`**: RGB triplet (e.g., `99, 102, 241`).
* **`--cf-colored`**: Flag (`1`) indicating the item has an active Colorful Folders style. Enables CSS `@container style(--cf-colored: 1)` queries.
* **`--cf-bg-alpha`**: Effective alpha opacity of the painted row background after depth progression.
* **`--cf-folder-bg` / `--cf-file-bg`**: Dynamic background variable hook (overridable without `!important`).
* **`--cf-folder-color` / `--cf-file-color`**: Dynamic text variable hook.

### 1.3 Palette Text & Icon Pairing
* Pre-indexed in $O(1)$ `activePairs` map inside `StyleGenerator.prepareContext()`.
* Per-folder styles (`textColor`, `iconColor`) take precedence over palette pairs.
* If a pair has `auto: true`, the plugin steps aside and allows theme auto-contrast rules to determine text/icon contrast.

---

## 2. How to Add a New Coloring Mode

If you want to add a mode like "Sort-based Coloring":
1.  **Modify `types.ts`**: Add the mode to `ColorfulFoldersSettings.colorMode`.
2.  **Modify `GeneralSettingSection.ts`**: Add an option to the "Color generation mode" dropdown and add translation keys in `src/lang/locale/en.ts`.
3.  **Update `ColorResolver.ts`**: In `resolveColor()`, add color resolution logic for your new mode. Keep execution branchless or $O(\log K)$ without runtime heap allocations.
4.  **Update `StyleResolver.ts` / `StyleGenerator.ts`**: Pass any new context needed for the mode down to `ColorResolver.resolveColor(...)`.

---

## 3. How to Add a New Icon Pack (Built-in)

To add a featured pack (like "Remix Icons"):
1.  **Get the JSON**: Ensure the pack is in `{ 'id': '<svg...>' }` format.
2.  **Update `IconSettingSection.ts`**: Add an entry to the `featuredPacks` array in `display()`.
    ```typescript
    { name: "My Pack", url: "...", prefix: "mp" }
    ```
3.  **Verification**: Click "Download" in the settings tab to test the import logic and O(1) template caching.

---

## 4. Support a New 3rd Party Plugin or Virtualized List

1.  **Create Integration**: `src/integrations/MyPlugin.ts`.
2.  **Define Selectors**: Find the CSS classes the plugin uses for its items.
3.  **Zero-DOM Principle**:
    - Never inject physical DOM wrapper nodes into virtualized lists (like React recycling lists).
    - Always use CSS attribute selectors and constructable stylesheets adopted via `AdoptedStyleSheetService`.
    - Keep Section Dividers strictly isolated to native File Explorer containers (`.nav-files-container`).
4.  **Update `StyleGenerator.ts`**:
    - Route selectors through `CssGrouper` to ensure $O(1)$ native browser paint.

---

## 5. Debugging Tips

### 🔍 Style Debugging
- Open Obsidian Developer Tools (`Ctrl+Shift+I`).
- Inspect elements and look at the **Adopted Stylesheets** applied to the DOM.
- Search for the `data-path` of the folder in question inside the active stylesheet rules.

### 🔍 Icon Debugging
- Enable **"Icon debug mode"** in settings.
- Check the console for logs starting with `[Colorful Folders Icon Debug]`.

### 🔍 Divider Debugging
- Dividers are identified by the `cf-interactive-divider` class.
- Inspect the DOM hierarchy to see where the divider is injected relative to `.nav-folder-title`.

---

## 6. Coding Standards

- **Case Sensitivity**: Folder matching should always be case-insensitive.
- **Path Escaping**: Always use `utils.safeEscape(path)` for CSS selectors.
- **Sentence Case**: All UI labels must follow sentence case (e.g., `Add new folder`).
- **Aesthetics**: Follow the "Premium UI" guidelines. Use gradients, subtle shadows, and consistent padding.

---

## 7. Core Files Overview

| File | Responsibility |
| :--- | :--- |
| `main.ts` | Plugin entry point & settings lifecycle orchestrator |
| `PluginLifecycleService.ts` | Document tracking, window listeners, vault events, & unload cleanup |
| `DOMObserverService.ts` | UI layout observation (file explorer) & DOM attribute tagging |
| `EventTrackerService.ts` | Active file navigation & drag-and-drop event listeners |
| `AdoptedStyleSheetService.ts` | Multi-window `document.adoptedStyleSheets` CSS manager |
| `StyleGenerator.ts` | Recursive CSS engine & traversal |
| `ColorResolver.ts` | Core mathematical colors, opacity, and text contrast resolving |
| `StyleResolver.ts` | High-level `EffectiveStyle` compilation & `FolderTrie` path lookup helper |
| `BaseCssGenerator.ts` | Renders base global base, interactive dividers, and stealth CSS properties |
| `VaultUtils.ts` | Pure functions for Vault traversal caches and item counting |
| `IconRepository.ts` | Core 4-tier icon resolution engine, stemming, and LRU cache coordinator |
| `IconPackIndex.ts` | In-memory $O(1)$ pack lookup index with `PACK_PRIORITY` tie-breaking |
| `CategoryTrie.ts` | Multi-word initial character prefix candidate trie for category rules |
| `LRUCache.ts` | Bounded $O(1)$ Least-Recently-Used cache with `Map` key reordering |
| `IconManager.ts` | Rendering facade & SVG normalization |
| `AIIconClassifier.ts` | LLM context-aware classification & candidate synonym matcher |
| `DividerManager.ts` | DOM reconciliation for dividers |
| `ColorPickerModal.ts` | Primary manual styling UI |
| `DividerModal.ts` | Divider & section configuration |

---

## 8. Mandatory Development Rules

> [!IMPORTANT]
> 1. **Obsidian Plugin Compilation**: Whenever modifying TypeScript source files (`src/*.ts`), **ALWAYS run `npm run build` immediately** after edits. Obsidian reads `main.js`, so your changes will not take effect until built.
> 2. **DOM Styling Compliance**: **NEVER** write inline property assignments or set static style properties directly using `el.style.setProperty()`. Use `el.setCssProps({ '--cf-variable': 'value' })` to assign CSS custom properties and consume them in CSS stylesheets.
> 3. **DOM Injection Performance**: Never call `require()` or parse SVG strings repeatedly inside DOM node iteration loops. Construct DOM elements as single templates outside loops and use `.cloneNode(true)`.
> 4. **Visual Styling Decoupling**: Never bundle text/icon color logic together with background block/border logic into a single boolean gate in `StyleGenerator.ts`. Text/icon auto-colors must evaluate independently.
> 5. **Package Updates**: When updating the `obsidian` type definitions package, ALWAYS simultaneously update `eslint` and `eslint-plugin-obsidianmd` to keep type definitions and linting synchronized.
> 6. **Zero Warning Policy**: Always run `npm run lint` (`eslint src --max-warnings 0`) before finishing tasks. Maintain 0 warnings and 0 errors.

