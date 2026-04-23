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
| `globalBackgroundColor` | `string` | Fallback color for all items when Auto-Color is OFF. |
| `vaultPassword` | `string` | Hashed password for the Stealth Mode (Data Hider). |
| `isVaultLocked` | `boolean` | Session-based state of the Stealth Mode lock. |
| `showRibbonIcon` | `boolean` | Controls visibility of the sidebar toggle button. |
| `showFileDivider` | `boolean` | Enables the automatic 'Files' divider in folders. |
| `dividerThickness` | `number` | Stroke width for all divider lines. |
| `dividerSpacing` | `number` | Vertical padding around dividers. |
| `dividerLinePadding` | `number` | Gap between divider lines and the central text/pill. |
| `dividerPillMode` | `boolean` | Global toggle for the pill background design. |
| `dividerPillColor` | `string` | Global default background color for divider pills. |
| `dividerLineStyle` | `string` | Global line style (solid, dashed, dotted, double). |
| `dividerUpper` | `boolean` | Global toggle for uppercase divider labels. |
| `dividerIconPosition` | `string` | Global default icon placement (left, right, both). |

---

## 2. `FolderStyle` (The Local Override)

This object is stored inside `customFolderColors` for specific paths.

```typescript
interface FolderStyle {
    hex?: string;              // Background color (hex)
    textColor?: string;        // Label color
    iconId?: string;           // Custom icon (lucide id or custom id)
    iconColor?: string;        // Explicit icon tint override
    opacity?: number;          // Background transparency (0-1)
    isBold?: boolean;          // Label font-weight override
    isItalic?: boolean;        // Label font-style override
    applyToSubfolders?: boolean; // Inheritance toggle for children
    applyToFiles?: boolean;      // Inheritance toggle for files
    hasDivider?: boolean;        // Whether this item has a divider above it
    dividerText?: string;        // Text shown in the divider chip
    dividerColor?: string;       // Color of the divider line/chip
    dividerAlignment?: string;   // 'left', 'center', or 'right'
    dividerIcon?: string;        // Lucide/Custom icon ID for divider
    dividerDescription?: string; // Markdown content for the hover popover
    dividerLineStyle?: string;   // 'solid', 'dashed', 'dotted', 'double', or 'global'
    dividerUpper?: boolean;      // Case override
    dividerGlass?: boolean;      // Backdrop blur toggle
    dividerIconPosition?: string; // 'left', 'right', or 'both'
    dividerPillMode?: string;    // 'on' or 'off'
    dividerPillColor?: string;   // Custom RGBA background for the pill
    isHidden?: boolean;          // Visibility toggle (Stealth Mode)
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
