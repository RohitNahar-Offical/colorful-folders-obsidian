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

#### `toggleStealthMode(): void`
*   **Purpose**: Switches the vault between "Protected" and "Stealth" states.
*   **Logic**: Triggers the `PasswordModal` if a password is set, or initializes the first-time setup.

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

#### `buildDividerNode(path: string, config: FolderStyle, doc: Document): HTMLElement`
*   **Purpose**: HTML factory for the divider component.
*   **Logic**: Attaches context menus and hover listeners. Requires `doc` for multi-window support.

---

## 4. `utils.ts` (Core Helpers)

#### `hexToRgbObj(hex: string): {r, g, b}`
*   **Purpose**: Accurate hex parsing for math operations.

#### `adjustBrightnessRgb(rgb: string, amount: number): string`
*   **Purpose**: Generates contrasting text colors.
*   **Formula**: `color * (1 + amount/100)`, clamped to `[0, 255]`.

---

## 5. `NotebookNavigatorIntegration` (Third-Party)

#### `getExtraContainers(app: App): HTMLElement[]`
*   **Purpose**: Finds the DOM nodes used by the Notebook Navigator plugin.
*   **Return**: Elements matching `.nn-navitem` parents.

---

## 6. `IconManager` (Rendering Central)

#### `getAutoIconData(name: string): AutoIconData | null`
*   **Purpose**: Matches a filename against the global regex category system to suggest an icon.
*   **Logic**: Uses weighted priority scoring to pick the best match.

#### `normalizeSvg(svgStr: string): string`
*   **Purpose**: Hardens raw SVG strings for use in CSS masks.
*   **Action**: Strips backgrounds, removes hardcoded colors, and ensures `currentColor` bindings.

#### `colorizeSvg(svgStr: string, color: string): string`
*   **Purpose**: Dynamically tints an SVG by rewriting its path attributes.
*   **Logic**: Intelligent attribute replacement that preserves complex path data while updating color.

---

## 7. UI Modals (Component Reference)

#### `DividerModal`
*   **File**: `src/ui/modals/DividerModal.ts`
*   **Purpose**: Per-divider configuration (text, icon, padding, color).
*   **Features**: Live-sync preview using the standard `DividerManager` factory.

#### `HoverMessageModal`
*   **File**: `src/ui/modals/HoverMessageModal.ts`
*   **Purpose**: Markdown-supported editor for divider popovers.
*   **Features**: Real-time Markdown rendering, link/tag suggester, and native keyboard shortcuts.

#### `ColorPickerModal`
*   **File**: `src/ui/modals/ColorPickerModal.ts`
*   **Purpose**: The central styling engine for folders/files.
*   **Features**: Tabbed interface (Appearance, Icon, Inheritance, Presets), visual color pickers, and live mini-preview.
