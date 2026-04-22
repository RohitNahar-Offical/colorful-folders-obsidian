# 🛠️ Feature Implementation Guide (Contributing)

This document provides step-by-step instructions for adding new features to Colorful Folders.

## 1. How to Add a New Coloring Mode

If you want to add a mode like "Sort-based Coloring":
1.  **Modify `types.ts`**: Add the mode to `ColorfulFoldersSettings.colorMode`.
2.  **Modify `SettingTab.ts`**: Add an option to the "Color generation mode" dropdown.
3.  **Update `main.ts`**: In `getEffectiveStyle()`, add a handler for your new mode.
4.  **Update `StyleGenerator.ts`**: If your mode needs special CSS rules, update the `traverse` logic.

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

## 3. How to Support a New 3rd Party Plugin

If a plugin has its own file explorer (like "Recent Files"):
1.  **Create a new integration file**: `src/integrations/MyPlugin.ts`.
2.  **Define Selectors**: Find the CSS classes the plugin uses for its items.
3.  **Update `StyleGenerator.ts`**: 
    *   In `generateCss()`, call `MyPlugin.getExtraContainers()`.
    *   In `traverse()`, generate extra rules using the plugin's specific selectors.

---

## 4. Debugging Tips

### Style Debugging
*   Open Obsidian Developer Tools (`Ctrl+Shift+I`).
*   Go to the **Elements** tab.
*   Search for `<style id="colorful-folders-styles">`.
*   You can see exactly what CSS is being generated.

### Icon Debugging
*   Enable **"Icon debug mode"** in settings.
*   Check the console for logs starting with `[Colorful Folders Icon Debug]`.
*   This will show you which regex pattern matched a specific folder name.

### Divider Debugging
*   The `DividerManager` logs reconciliation steps if you add `console.log` inside `syncDividers()`.
*   Note: Dividers are identified by the `cf-interactive-divider` class.

---

## 5. Coding Standards

*   **Case Sensitivity**: Folder matching should always be case-insensitive where possible.
*   **Path Escaping**: Always use `utils.safeEscape(path)` before putting a path into a CSS selector.
*   **Aesthetics**: Follow the "Premium UI" guidelines. Use gradients, subtle shadows, and consistent padding.

---

## 6. Core Files Overview

*   **`main.ts`**: Plugin entry point, event listeners, and high-level state management.
*   **`src/core/StyleGenerator.ts`**: The recursive CSS engine for backgrounds and auto-icons.
*   **`src/core/IconManager.ts`**: The central service for SVG normalization, colorization, and DOM-based icon injection.
*   **`src/core/DividerManager.ts`**: Manages the injection and reconciliation of folder dividers.
*   **`src/ui/modals/ColorPickerModal.ts`**: The primary interface for manual styling overrides.
