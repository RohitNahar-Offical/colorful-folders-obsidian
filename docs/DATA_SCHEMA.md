# 🗄️ Data & Schema

This document defines how Colorful Folders stores and resolves its state. All persistent data lives in the plugin's `data.json` file.

## 1. `ColorfulFoldersSettings` (The Global Config)

Defined in `src/common/types.ts`. This interface represents the entire `data.json` structure.

| Key | Type | Description |
| :--- | :--- | :--- |
| `palette` | `string` | Name of the active palette (e.g., "Pastel Dreams"). |
| `colorMode` | `string` | `cycle`, `monochromatic`, or `heatmap`. |
| `customFolderColors` | `Record<string, FolderStyle>` | Key = File Path. Value = Style overrides. |
| `customIcons` | `Record<string, string>` | Key = Icon ID. Value = Raw SVG string. |
| `glassmorphism` | `boolean` | Enables backdrop-blur effects. |
| `activeGlow` | `boolean` | Draws a line connecting the active file to the root. |

---

## 2. `FolderStyle` (The Local Override)

This object is stored inside `customFolderColors` for specific paths.

```typescript
interface FolderStyle {
    hex?: string;              // Background color (hex)
    textColor?: string;        // Label color
    iconId?: string;           // Custom icon (lucide id or custom id)
    applyToSubfolders?: boolean; // Inheritance toggle for children
    applyToFiles?: boolean;      // Inheritance toggle for files
    hasDivider?: boolean;        // Whether this item has a divider above it
    dividerText?: string;        // Text shown in the divider chip
    dividerDescription?: string; // Markdown content for the hover popover
}
```

---

## 3. The Palette System

Palettes are hardcoded in `src/common/constants.ts` under `PALETTES`. Each entry contains:
*   `hex`: The string used in CSS.
*   `rgb`: A comma-separated string (e.g., `235, 111, 146`) used for `rgba()` color generation.

### Adding a Palette:
To add a new palette, simply append a new key to the `PALETTES` object in `constants.ts`:
```typescript
"Ocean Deep": [
    { rgb: "0, 105, 148", hex: "#006994" },
    // ... add 11 more colors
]
```

---

## 4. Automation Rules (Auto-Icons)

Auto-icons work via a priority-based regex matching system defined in `AUTO_ICON_CATEGORIES`.

### Match Logic:
1.  The plugin takes the folder/file name.
2.  It iterates through `AUTO_ICON_CATEGORIES`.
3.  The first regex that matches the name "wins".
4.  If `autoIconVariety` is enabled, the plugin uses `hashString(name)` to pick a random index from the category's `lucides` array.

---

## 5. Persistence Strategy

*   **Saving**: We use `this.saveData(this.settings)`. This is wrapped in `plugin.saveSettings()` which also triggers a style refresh.
*   **Loading**: Handled in `onload()` via `this.loadData()`. We use `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` to ensure new features have default values even for old users.
*   **Debouncing**: Settings changes that trigger CSS regeneration are debounced to prevent disk I/O bottlenecks and UI lag.
