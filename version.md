# Updates for Colorful Folders

## ⚡ 4.1.7 - Mobile Responsiveness & Layout Refinements
This release introduces a cleaner desktop context menu layout with submenu grouping, robust mobile-responsive styling for the configuration interface, custom metadata wrapping options, shorthand hex resolution, and crucial event listener cleanup to prevent memory leaks.

### 📱 1. Responsive Settings Tab & Desktop Submenus
- **Mobile-First Layout**: Introduced a dedicated `@media (max-width: 600px)` style block to ensure the settings card grid, action buttons, tab bars, and premium popovers scale elegantly on smaller phone and tablet viewports.

- **Wrap Metadata Option**: Added a toggle to wrap file counts, word counts, and other plugin metadata (e.g., from *Novel Word Count* plugin) to the next line on desktop. (This remains automatically active on mobile).

### 🔧 2. Bug Fixes & Code Hardening
- **Shorthand Hex Support**: Restructured the hex parsing logic to safely recognize and expand 3-digit shorthand hex codes (e.g., `#fff` to `#ffffff`) without throwing TypeErrors.
- **Scroll Listener Cleanup**: Fixed a minor memory leak by properly removing the container scroll event listener during the cleanup phase.
- **CSS Linter Compliance**: Resolved a series of CSS warnings related to vendor-specific prefixes for masks, scrollbars, and unnecessary `!important` overrides.

---

## ⚡ 4.1.6 - The "CSS Variable Hook Engine" Update
This release introduces a modern, developer-friendly styling engine featuring dynamic CSS Variable Hooks, alongside complete documentation synchronization to ensure robust, non-destructive customization.

### 🔌 1. Modern CSS Variable Hook Engine & Color-Matched Selections
- **Non-Destructive Hooks**: Refactored the Traversal Engine (`StyleGenerator.ts`) to wrap dynamic background and color declarations inside standard CSS custom properties:
  - `--cf-file-bg` / `--cf-file-color` (File layout hooks)
  - `--cf-folder-bg` / `--cf-folder-color` (Folder layout hooks)
  - `--cf-active-bg` / `--cf-active-color` (Active selection hooks)
  - `--cf-tag-bg` / `--cf-tag-color` (Metadata flair hooks)
- **Color-Matched Multi-Selections**: Introduced `--cf-selection-bg` to automatically shade multi-selected items with a translucent hue matching the parent folder's color, while cleanly falling back to match your accent color.
- **Zero-Specificity Customization**: You can now override active states, selections, and hover highlights natively within your custom stylesheets or snippets without using a single `!important` rule.
- **Theme Stability Overrides**: Cleaned up the core plugin's `styles.css` sheet by stripping hardcoded native fallbacks, ensuring robust compatibility with third-party themes (like Minimal Theme) without clobbering theme selection variables.

### 📑 2. Documentation Standardization & Synchronization
- **FolderStyle Schema Realignment**: Fully audited `DATA_SCHEMA.md` to document over 12 previously hidden TypeScript properties (including typography modifiers, interactive divider settings, and custom pill parameters).
- **Adopted Stylesheet Troubleshooting**: Updated troubleshooting guidelines inside `CONTRIBUTING.md` to reflect the linter-compliant `document.adoptedStyleSheets` container instead of the deprecated `<style>` tag elements.
- **Rendering Engine Internals**: Synchronized `ARCHITECTURE.md` to document the dynamic variable wrapping pipelines inside the traversed CSS generation flow.