# 🗄️ Data and Schema

This document defines how **Colorful Folders** stores and resolves its state. All persistent data lives in the plugin's `data.json` file.

---

## 1. `ColorfulFoldersSettings` (Global Config)

Representing the entire `data.json` structure. Defined in `src/common/types.ts`.

| Key | Type | Description |
| :--- | :--- | :--- |
| **Visual Palette** | | |
| `paletteLight` | `string` | Active palette name for Light Mode. |
| `paletteDark` | `string` | Active palette name for Dark Mode. |
| `palette` | `string` | Legacy active palette name. |
| `customPalette` | `string` | Comma-separated hex list for the "Custom" palette mode. |
| `colorMode` | `string` | `cycle` (sequential), `monochromatic` (fixed root color), or `heatmap` (by age). |
| `cycleOffset` | `number` | Shifts the starting point of the color cycle. |
| **Opacity & Accents** | | |
| `rootOpacity` | `number` | Starting opacity for depth-0 folder title backgrounds. Default: `0.50`. Used as the base for the depth progression formula. |
| `subfolderOpacity` | `number` | Legacy setting — currently not used in the depth progression formula. Reserved for future per-level overrides. |
| `tintOpacity` | `number` | Minimum opacity for `.nav-folder-children` container tints. Default: `0.028`. Floored to `0.12` at depth-0 and `0.05` at deeper levels. |
| `rootTintOpacity` | `number` | Specific tint transparency for root folders. |
| `fileBackgroundOpacity` | `number` | Transparency for file background highlights. |
| `globalBackgroundColor` | `string` | Forces a specific hex/color across all items if set. |
| `glassmorphism` | `boolean` | Toggles glassmorphism effect (frosted glass). |
| **Radiant Path & Active Highlighting** | | |
| `activeGlow` | `boolean` | Applies a luminous box-shadow and gradient sheen to the active item. |
| `pathLineThickness` | `number` | Dynamic stroke width for Radiant Path indentation lines and active highlights. Default: `3`. |
| `useCustomActiveColor` | `boolean` | Enables the UI-driven active file color picker. |
| `customActiveBg` | `string` | User-defined background for the active file. |
| `customActiveText` | `string` | User-defined text color for the active file. |
| **Auto-Icons & Scaling** | | |
| `autoIcons` | `boolean` | Automatically assigns icons based on folder/file names. |
| `autoIconVariety` | `boolean` | Assigns different icons to items within the same category. |
| `wideAutoIcons` | `boolean` | Prefers Lucide icons over emojis for automatic assignment. |
| `customIconRules` | `string` | Simple pattern match string (e.g., `Work = briefcase @200`). |
| `iconScale` | `number` | Multiplier for all folder/file icons. |
| `customIcons` | `Record<string, string>` | Custom SVG icons mapping (ID to SVG content). |
| `iconDebugMode` | `boolean` | Enables debug logging for icon selection logic. |
| **Typography & Structure** | | |
| `rootStyle` | `string` | `translucent` or `solid` design for root folders. |
| `rainbowRootText` | `boolean` | Applies horizontal rainbow gradients to root folder text. |
| `rainbowRootBgTransparent`| `boolean` | Removes root background box when rainbow text is active. |
| `showItemCounters` | `boolean` | Displays recursive item counts next to folders. |
| `autoColorFiles` | `boolean` | Automatically assigns colors to files based on parent or name. |
| `wrapMetadata` | `boolean` | Wraps file metadata to ensure readability. |
| **Section Dividers** | | |
| `showFileDivider` | `boolean` | Toggles the dedicated files separator in folders. |
| `fileDividerText` | `string` | Text label for the files section divider. |
| `dividerThickness` | `number` | Stroke width for section divider lines. |
| `dividerSpacing` | `number` | Vertical padding above/below dividers. |
| `dividerLineStyle` | `string` | `solid`, `dashed`, or `dotted`. |
| `separatorColor` | `string` | Custom color applied to the section separators. |
| `dividerLinePadding` | `number` | General gap between line and text. |
| `dividerLinePaddingLeft` | `number` | Gap between line and text (Left). |
| `dividerLinePaddingRight` | `number` | Gap between line and text (Right). |
| `dividerPillMode` | `boolean` | Enables/Disables the "Modern Pill" design wrapper. |
| `dividerPillColor` | `string` | Universal background color for all divider pills. |
| `dividerIconPosition` | `string` | Universal position for divider icons (`left`, `right`, or `both`). |
| **Integrations** | | |
| `notebookNavigatorSupport` | `boolean` | Enables styling for Notebook Navigator items. |
| `notebookNavigatorFileBackground` | `boolean` | Applies background colors to NN file items. |
| `notebookNavigatorOutlineOnly` | `boolean` | Force outline-only mode specifically for NN items. |
| `notebookNavigatorIconScale` | `number` | Independent icon scale multiplier strictly for NN items. |
| `graphColorSync` | `boolean` | Syncs assigned folder colors to Graph View nodes. |
| `tagSyncEnabled` | `boolean` | Enables syncing folder colors to their respective tags. |
| `tagSyncMatchFolders` | `boolean` | Auto-syncs tags that perfectly match a styled folder name. |
| `tagSyncRules` | `string` | Custom line-by-line mapping rules (`#tag = /path`). |
| **System & Privacy** | | |
| `presets` | `Record<string, FolderStyle>` | User-saved custom folder styles templates. |
| `recentlyUsedIcons` | `string[]` | List of recently chosen icon IDs. |
| `showHiddenItems` | `boolean` | Toggles "Stealth Mode" visibility. |
| `showRibbonIcon` | `boolean` | Displays the Stealth Mode eye icon in the sidebar. |
| `vaultPassword` | `string` | Hashed password for privacy lock. |
| `isVaultLocked` | `boolean` | Session state of the password lock. |
| `lastVersion` | `string` | Tracks the last version to show the changelog on update. |

---

## 2. `FolderStyle` (Local Override)

Stored inside `customFolderColors` for specific paths.

> [!TIP]
> Items marked with `applyToSubfolders: true` will cascade their visual style down the entire directory tree.

```typescript
interface FolderStyle {
    hex?: string;                    // Background color (hex)
    textColor?: string;              // Label color override (hex) — also the gradient Start Color
    textGradient?: boolean;          // Enables custom rainbow gradient on folder/file text
    textGradientEnd?: string;        // Gradient end color (hex); used with textGradient
    rainbowBrightness?: number;      // Gradient brightness override (1–100, default 50)
    iconColor?: string;              // Custom icon color override (hex)
    iconId?: string;                 // Custom icon ID (Lucide, emoji, or Custom)
    opacity?: number;                // Background transparency (0-1). Overrides depth-based progression when set.
    isBold?: boolean;                // Label bold font-weight override
    isItalic?: boolean;              // Label italic style override
    applyToSubfolders?: boolean;     // Cascade color+style to ALL nested subfolders (recursive)
    applyToFiles?: boolean;          // Cascade color+style to files in the immediate folder at each inherited level
    hasDivider?: boolean;            // Displays a section divider before this item
    dividerText?: string;            // Text label inside the divider pill
    dividerColor?: string;           // Custom color for the divider line/pill
    dividerAlignment?: string;       // Alignment of the divider text ('left', 'center', 'right')
    dividerLineStyle?: string;       // Line pattern ('solid', 'dashed', 'dotted', 'double')
    dividerIcon?: string;            // Custom Lucide/emoji divider icon ID
    dividerIconColor?: string;       // Custom color override for the divider icon
    dividerUpper?: boolean;          // Force uppercase on the divider label text
    dividerGlass?: boolean;          // Glassmorphic backdrop filter on the divider
    dividerIconPosition?: 'left' | 'right' | 'both'; // Placement of the divider icon
    dividerPillMode?: 'global' | 'on' | 'off';     // Interactive Pill Mode override
    dividerDescription?: string;     // Premium Markdown hover popover content
    dividerPillColor?: string;       // Background color override for the divider pill
    dividerLinePaddingLeft?: number; // Asymmetrical padding between line and text (Left)
    dividerLinePaddingRight?: number;// Asymmetrical padding between line and text (Right)
    isHidden?: boolean;              // Stealth Mode privacy hide toggle
}
```

---

## 3. The Palette System

Palettes are defined in `src/common/constants.ts` under `PALETTES`. 

```mermaid
graph LR
    P[Palette Name] --> C1[Color 1]
    P --> C2[Color 2]
    P --> Cn[...]
    C1 --> R1[RGB: 235, 111, 146]
    C1 --> H1[HEX: #eb6f92]
```

---

## 4. Automation Rules (Auto-Icons)

Auto-icons use a priority-based regex matching system in `AUTO_ICON_CATEGORIES`.

> [!IMPORTANT]
> **Priority Scoring**:
> 1. The plugin takes the folder/file name.
> 2. It iterates through `AUTO_ICON_CATEGORIES`.
> 3. The **first** regex that matches the name "wins".

---

## 5. Persistence Strategy

- **Saving**: `this.saveData(this.settings)`. Wrapped in `plugin.saveSettings()` to trigger UI refreshes.
- **Loading**: `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` ensures schema compatibility.
- **Debouncing**: Settings changes are debounced to prevent disk I/O bottlenecks.

---

## 5b. Opacity Depth Progression

The background opacity of folder title rows follows a **fixed linear descent** from the root opacity setting:

```
depth 0 (root)  → rootOpacity (default 0.50 = 50%)
depth 1         → rootOpacity - 0.10 (40%)
depth 2         → rootOpacity - 0.20 (30%)
depth 3         → rootOpacity - 0.30 (20%)
depth 4         → rootOpacity - 0.40 (10%)
depth 5+        → HARD FLOOR: 0.05 (5%) — never goes to zero
```

This formula is implemented in `ColorResolver.resolveOpacity()`. An individual folder can override its own opacity by setting `FolderStyle.opacity`, which bypasses the progression entirely for that specific folder's title row.

The **container tint** (`.nav-folder-children` background) uses a separate, simpler formula:
```
tintOp = max(settings.tintOpacity, depth === 0 ? 0.12 : 0.05)
```
This is always applied using the **child's own resolved color**, not the grandparent's color.

---
---

## 6. Backup & Restore Schema

When exporting data via the "Database management" tools, the generated JSON files follow a standardized wrapper format.

### Folder Style Backup (`cf-folder-backup`)
```json
{
  "type": "cf-folder-backup",
  "version": "1.0",
  "data": {
    "Work/Project-A": {
      "hex": "#ff0000",
      "iconId": "lucide-star"
    }
  },
  "presets": { ... }
}
```

### Divider Backup (`cf-divider-backup`)
```json
{
  "type": "cf-divider-backup",
  "version": "1.0",
  "data": {
    "Resources": {
      "hasDivider": true,
      "dividerText": "Library",
      "dividerColor": "#00ff00"
    }
  }
}
```

> [!NOTE]
> During restore, the plugin validates the `type` field to ensure the data is merged into the correct properties of the `customFolderColors` record.
