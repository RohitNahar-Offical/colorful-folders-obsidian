# ⚡ 4.1.6 - The "CSS Variable Hook Engine" Update

This release introduces a modern, developer-friendly styling engine featuring dynamic CSS Variable Hooks, alongside complete documentation synchronization to ensure robust, non-destructive customization.

### 🔌 1. Modern CSS Variable Hook Engine
- **Non-Destructive Hooks**: Refactored the Traversal Engine (`StyleGenerator.ts`) to wrap dynamic background and color declarations inside standard CSS custom properties:
  - `--cf-file-bg` / `--cf-file-color` (File layout hooks)
  - `--cf-folder-bg` / `--cf-folder-color` (Folder layout hooks)
  - `--cf-active-bg` / `--cf-active-color` (Active selection hooks)
  - `--cf-tag-bg` / `--cf-tag-color` (Metadata flair hooks)
- **Zero-Specificity Customization**: You can now override active states, selections, and hover highlights natively within your custom stylesheets or snippets without using a single `!important` rule.

### 🎨 2. Cross-Plugin Harmonization
- **Theme ACCENT Decoupling**: Added detailed implementation blueprints in `CUSTOMIZATION.md` showing how to construct unified brand palettes that share colors across both **Colorful Folders** and third-party widgets like Liam Cain's **Calendar** plugin.

### 📑 3. Documentation Standardization & Synchronization
- **FolderStyle Schema Realignment**: Fully audited `DATA_SCHEMA.md` to document over 12 previously hidden TypeScript properties (including typography modifiers, interactive divider settings, and custom pill parameters).
- **Adopted Stylesheet Troubleshooting**: Updated troubleshooting guidelines inside `CONTRIBUTING.md` to reflect the linter-compliant `document.adoptedStyleSheets` container instead of the deprecated `<style>` tag elements.
- **Rendering Engine Internals**: Synchronized `ARCHITECTURE.md` to document the dynamic variable wrapping pipelines inside the traversed CSS generation flow.
