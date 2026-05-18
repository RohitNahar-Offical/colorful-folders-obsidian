# Updates for Colorful Folders

## ⚡ 4.1.6 - The "CSS Variable Hook Engine" Update
This release introduces a modern, developer-friendly styling engine featuring dynamic CSS Variable Hooks, alongside complete documentation synchronization to ensure robust, non-destructive customization.

### 🔌 1. Modern CSS Variable Hook Engine
- **Non-Destructive Hooks**: Refactored the Traversal Engine (`StyleGenerator.ts`) to wrap dynamic background and color declarations inside standard CSS custom properties:
  - `--cf-file-bg` / `--cf-file-color` (File layout hooks)
  - `--cf-folder-bg` / `--cf-folder-color` (Folder layout hooks)
  - `--cf-active-bg` / `--cf-active-color` (Active selection hooks)
  - `--cf-tag-bg` / `--cf-tag-color` (Metadata flair hooks)
- **Zero-Specificity Customization**: You can now override active states, selections, and hover highlights natively within your custom stylesheets or snippets without using a single `!important` rule.

### 📑 2. Documentation Standardization & Synchronization
- **FolderStyle Schema Realignment**: Fully audited `DATA_SCHEMA.md` to document over 12 previously hidden TypeScript properties (including typography modifiers, interactive divider settings, and custom pill parameters).
- **Adopted Stylesheet Troubleshooting**: Updated troubleshooting guidelines inside `CONTRIBUTING.md` to reflect the linter-compliant `document.adoptedStyleSheets` container instead of the deprecated `<style>` tag elements.
- **Rendering Engine Internals**: Synchronized `ARCHITECTURE.md` to document the dynamic variable wrapping pipelines inside the traversed CSS generation flow.

---

## ⚡ 4.1.5 - The "Native-Bridge" & Stability Update
This release focuses on structural stabilization and provides new powerful ways to customize your active workspace elements.

### 📐 1. Dynamic Path Thickness
- **User-Defined Weight**: Introducing a new **Path line thickness** slider. You can now adjust the base weight of vertical indentation guides and active highlights (1.0px to 10.0px) for a perfectly tailored look.
- **Visual Harmony**: The engine automatically scales related borders proportionately to maintain structural hierarchy, ensuring the file tree remains crisp and organized regardless of thickness.

### 🎨 2. Active File Customization
- **Personalized Highlights**: You can now explicitly override the active file color in settings. 
- **User-Driven Design**: Under the "Active Item Appearance" section, toggle the custom color picker to set your own background and text colors for the currently selected file.

### 🚀 3. Performance & Stability
- **Deep Code Audit**: Purged redundant logic and dead code across all core modules.
- **Zero-Animation Mandate**: UI updates now occur with absolute zero latency for a sharp, responsive feel.
- **Luminous Default**: Finalized the premium glass sheen as the standard for active items.

### 🧩 4. Notebook Navigator Integration (Native-Bridge)
- **CSS Firewall Architecture**: Implemented a "Native-Bridge" selector system using `:not()` exclusions. This prevents standard explorer styles from leaking into Notebook Navigator, permanently resolving the "Double Icon" issue.
- **Zero-Blank Policy**: Added an intelligent fallback system. Items without a manual icon will now show a professional Lucide folder or file icon.
- **Pure CSS Rendering**: Purged legacy DOM injection for integrated panes, ensuring 100% flicker-free performance in virtualized lists.
- **Decoupled Scaling**: Optimized icon scaling (1.1em) specifically for the Notebook Navigator card layout.


---

## ⚡ 4.1.4 - The "Visual & Performance" Update
This release focuses on elevating visual elegance through the Luminous Selection default, alongside powerful Engine Micro-Optimizations.

### 🌟 1. The New "Luminous" Default
- **Permanent Elegance**: The subtle glass highlight, dynamic white gradient overlay, and 3D micro-bevel sheen are now the permanent default styles for active files.
- **Unified Aesthetics**: Your active files will always feel premium and tactile, independent of the Radiant Path settings.

### 📏 2. Flawless Divider Integration
- **Negative Line Gaps**: You can now push divider lines inward using negative gaps (down to **-10px**) for a seamless intersection with pills.
- **Layering Precision**: Upgraded z-index management guarantees that intersecting lines tuck cleanly behind the divider chips.

### 🚀 3. Engine Performance & Architecture
- **Radiant Path Stability**: Standardized the glowing connecting trail to a strict `2px` thickness, completely resolving the browser sub-pixel "thinning line" rendering glitch for deeply nested files.
- **Full Animation Decommissioning**: Removed all legacy animation logic and keyframes (Breathe, Neon, Shimmer) to prioritize zero-lag performance and visual hardening. All visuals are now hardcoded to high-performance static standards.
