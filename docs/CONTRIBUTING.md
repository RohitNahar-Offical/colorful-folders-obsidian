# 🛠️ Feature Implementation Guide

> [!NOTE]
> This guide provides step-by-step instructions for contributing to **Colorful Folders**. Follow these patterns to ensure code quality and UI consistency.

---

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
- Inspect `<style id="colorful-folders-styles">`.
- Search for the `data-path` of the folder in question.

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
| `main.ts` | Lifecycle, Events, & High-level state |
| `StyleGenerator.ts` | Recursive CSS engine & backgrounds |
| `IconManager.ts` | SVG normalization & Sanitization |
| `DividerManager.ts` | DOM reconciliation for dividers |
| `ColorPickerModal.ts` | Primary manual styling UI |
| `DividerModal.ts` | Divider & section configuration |

---

> [!IMPORTANT]
> Always run `npm run lint` before committing. We maintain a zero-warning policy to satisfy Obsidian's strict plugin requirements.
