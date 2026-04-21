# 📖 API Reference

This document provides a detailed technical reference for the public and internal APIs of the Colorful Folders codebase.

## 1. `ColorfulFoldersPlugin` (Main Class)

### Methods:

#### `getEffectiveStyle(target: TAbstractFile): EffectiveStyle`
*   **Purpose**: Resolves the "true" visual state of an item.
*   **Logic**:
    1.  Local override? Use it.
    2.  Inherited from parent? Use it.
    3.  Global generation mode (Heatmap, Cycle, Mono)? Compute and return.

#### `generateStyles(): void`
*   **Purpose**: The main trigger for UI updates.
*   **Action**: Calls `StyleGenerator.generateCss()`, updates `this.styleTag`, and calls `dividerManager.syncDividers()`.

#### `registerCustomIcons(): void`
*   **Purpose**: Hydrates Obsidian's internal icon registry with user-imported SVG packs.
*   **Action**: Iterates `settings.customIcons` and calls `obsidian.addIcon()`.

---

## 2. `StyleGenerator` (Static Engine)

### Methods:

#### `generateCss(plugin: IColorfulFoldersPlugin): string`
*   **Purpose**: Generates the full CSS bundle for the current vault state.
*   **Return**: A multi-kilobyte string containing all path-specific rules.

#### `traverse(folder: TFolder, depth: number, state: TraversalState): void`
*   **Purpose**: Recursive engine that walks the file tree.
*   **State**: Tracks color indices and parent styles to ensure consistent generation.

---

## 3. `DividerManager` (DOM Controller)

### Methods:

#### `syncDividers(): void`
*   **Purpose**: Reconciles the DOM with the desired divider state.
*   **Constraint**: Must be called after every folder expansion/collapse or settings change.

#### `buildDividerNode(path: string, config: FolderStyle): HTMLElement`
*   **Purpose**: HTML Factory for the divider component.
*   **Logic**: Attaches context menus and hover listeners.

---

## 4. `utils.ts` (Core Helpers)

#### `hexToRgbObj(hex: string): {r, g, b}`
*   **Purpose**: Accurate hex parsing for math operations.

#### `adjustBrightnessRgb(rgb: string, amount: number): string`
*   **Purpose**: Generates contrasting text colors.
*   **Formula**: `color * (1 + amount/100)`, clamped to `[0, 255]`.

#### `getAutoIconData(name: string, settings: ColorfulFoldersSettings): {iconId, emoji}`
*   **Purpose**: Logic for the "Auto-Icon" engine.
*   **Logic**: Loops through categories and uses `hashString` if variety is enabled.

---

## 5. `NotebookNavigatorIntegration` (Third-Party)

#### `getExtraContainers(app: App): HTMLElement[]`
*   **Purpose**: Finds the DOM nodes used by the Notebook Navigator plugin.
*   **Return**: Elements matching `.nn-navitem` parents.
