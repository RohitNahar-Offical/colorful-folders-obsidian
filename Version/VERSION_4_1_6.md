# ⚡ 4.1.6 - The "CSS Variable Hook Engine" Update

This release introduces a modern, developer-friendly styling engine featuring dynamic CSS Variable Hooks, alongside complete documentation synchronization to ensure robust, non-destructive customization.

### 🔌 1. Modern CSS Variable Hook Engine & Color-Matched Selections
- **Non-Destructive Hooks**: Refactored the Traversal Engine (`StyleGenerator.ts`) to wrap dynamic background and color declarations inside standard CSS custom properties:
  - `--cf-file-bg` / `--cf-file-color` (File layout hooks)
  - `--cf-folder-bg` / `--cf-folder-color` (Folder layout hooks)
  - `--cf-active-bg` / `--cf-active-color` (Active selection hooks)
  - `--cf-tag-bg` / `--cf-tag-color` (Metadata flair hooks)
- **Color-Matched Multi-Selections**: Introduced `--cf-selection-bg` to automatically shade multi-selected items with a translucent hue matching the parent folder's color, while cleanly falling back to match the active accent/selection color of your theme.
- **Zero-Specificity Customization**: You can now override active states, selections, and hover highlights natively within your custom stylesheets or snippets without using a single `!important` rule.
- **Theme Stability Overrides**: Cleaned up the core plugin's `styles.css` sheet by stripping hardcoded native fallbacks, ensuring robust compatibility with third-party themes (like Minimal Theme) without clobbering theme selection variables.

### 📑 2. Documentation Standardization & Synchronization
- **FolderStyle Schema Realignment**: Fully audited `DATA_SCHEMA.md` to document over 12 previously hidden TypeScript properties (including typography modifiers, interactive divider settings, and custom pill parameters).
- **Adopted Stylesheet Troubleshooting**: Updated troubleshooting guidelines inside `CONTRIBUTING.md` to reflect the linter-compliant `document.adoptedStyleSheets` container instead of the deprecated `<style>` tag elements.
- **Rendering Engine Internals**: Synchronized `ARCHITECTURE.md` to document the dynamic variable wrapping pipelines inside the traversed CSS generation flow.
