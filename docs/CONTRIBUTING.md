# 🛠️ Feature Implementation Guide

> [!NOTE]
> This guide provides step-by-step instructions for contributing to **Colorful Folders**. Follow these patterns to ensure code quality and UI consistency.

---

## 1. How to Add a New Coloring Mode

If you want to add a mode like "Sort-based Coloring":
1.  **Modify `types.ts`**: Add the mode to `ColorfulFoldersSettings.colorMode`.
2.  **Modify `SettingTab.ts`**: Add an option to the "Color generation mode" dropdown.
3.  **Update `ColorResolver.ts`**: In `resolveColor()`, add color resolution logic for your new mode.
4.  **Update `StyleResolver.ts` / `StyleGenerator.ts`**: Pass any new context needed for the mode down to `ColorResolver.resolveColor(...)`.

---

## 2. How to Add a New Icon Pack (Built-in)

To add a featured pack (like "Remix Icons"):
1.  **Get the JSON**: Ensure the pack is in `{ 'id': '<svg...>' }` format.
2.  **Update `SettingTab.ts`**: Add an entry to the `packs` array in `display()`.
    ```typescript
    { name: "My Pack", url: "...", prefix: "mp" }
    ```
3.  **Verification**: Click "Download" in the settings tab to test the import logic.

---

## 3. Support a New 3rd Party Plugin

1.  **Create Integration**: `src/integrations/MyPlugin.ts`.
2.  **Define Selectors**: Find the CSS classes the plugin uses for its items.
3.  **Update `StyleGenerator.ts`**: 
    - In `generateCss()`, call `MyPlugin.getExtraContainers()`.
    - In `traverse()`, generate extra rules using the plugin's specific selectors.

---

## 4. Debugging Tips

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

## 5. Coding Standards

- **Case Sensitivity**: Folder matching should always be case-insensitive.
- **Path Escaping**: Always use `utils.safeEscape(path)` for CSS selectors.
- **Sentence Case**: All UI labels must follow sentence case (e.g., `Add new folder`).
- **Aesthetics**: Follow the "Premium UI" guidelines. Use gradients, subtle shadows, and consistent padding.

---

## 6. Core Files Overview

| File | Responsibility |
| :--- | :--- |
| `main.ts` | Orchestrator & Plugin instance |
| `DOMObserverService.ts` | UI layout observation (file explorer) & DOM mutations |
| `EventTrackerService.ts` | Workspace/Vault event registration and cleanup |
| `StyleGenerator.ts` | Recursive CSS engine & traversal |
| `ColorResolver.ts` | Core mathematical colors, opacity, and text contrast resolving |
| `StyleResolver.ts` | High-level `EffectiveStyle` compilation and customized overrides helper |
| `BaseCssGenerator.ts` | Renders base global base, interactive dividers, and stealth CSS properties |
| `VaultUtils.ts` | Pure functions for Vault traversal caches and item counting |
| `IconRepository.ts` | Core 4-tier icon resolution engine, stemming, and LRU cache coordinator |
| `IconPackIndex.ts` | In-memory $O(1)$ pack lookup index with `PACK_PRIORITY` tie-breaking |
| `CategoryTrie.ts` | Multi-word initial character prefix candidate trie for category rules |
| `LRUCache.ts` | Bounded $O(1)$ Least-Recently-Used cache with `Map` key reordering |
| `IconManager.ts` | Rendering facade & SVG normalization |
| `DividerManager.ts` | DOM reconciliation for dividers |
| `ColorPickerModal.ts` | Primary manual styling UI |
| `DividerModal.ts` | Divider & section configuration |

---

## 7. Mandatory Development Rules

> [!IMPORTANT]
> 1. **Obsidian Plugin Compilation**: Whenever modifying TypeScript source files (`src/*.ts`), **ALWAYS run `npm run build` immediately** after edits. Obsidian reads `main.js`, so your changes will not take effect until built.
> 2. **DOM Styling Compliance**: **NEVER** write inline property assignments or set static style properties directly using `el.style.setProperty()`. Use `el.setCssProps({ '--cf-variable': 'value' })` to assign CSS custom properties and consume them in CSS stylesheets.
> 3. **DOM Injection Performance**: Never call `require()` or parse SVG strings repeatedly inside DOM node iteration loops. Construct DOM elements as single templates outside loops and use `.cloneNode(true)`.
> 4. **Visual Styling Decoupling**: Never bundle text/icon color logic together with background block/border logic into a single boolean gate in `StyleGenerator.ts`. Text/icon auto-colors must evaluate independently.
> 5. **Package Updates**: When updating the `obsidian` type definitions package, ALWAYS simultaneously update `eslint` and `eslint-plugin-obsidianmd` to keep type definitions and linting synchronized.
> 6. **Zero Warning Policy**: Always run `npm run lint` (`eslint src --max-warnings 0`) before finishing tasks. Maintain 0 warnings and 0 errors.
