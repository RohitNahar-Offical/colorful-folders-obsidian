# 🎨 Colorful Folders | Developer Master Guide

Welcome to the internal engineering documentation for **Colorful Folders**. This guide is designed to provide a "clonable" understanding of the project—meaning that after reading these documents, a developer should be able to rebuild or extend the plugin from scratch.

## 📖 Table of Contents
1.  **[Architecture Deep-Dive](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/ARCHITECTURE.md)**: The "engine" behind the styles.
2.  **[Data & Schema](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/DATA_SCHEMA.md)**: How settings are stored and resolved.
3.  **[UI & Styling System](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/STYLE_GUIDE.md)**: Design tokens, CSS-in-TS, and animations.
4.  **[API Reference](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/API_REFERENCE.md)**: Detailed class and method documentation.
5.  **[Feature Implementation Guide](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/CONTRIBUTING.md)**: Step-by-step instructions for common tasks.
6.  **[Engine Internals](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/ENGINE_INTERNALS.md)**: Absolute low-level logic and debugging.
7.  **[Visual Effects](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/VISUAL_EFFECTS.md)**: Logic for animations, glow effects, and contrast.
8.  **[Security & Sanitization](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/blob/main/docs/SECURITY_AUDIT.md)**: How we handle custom SVGs and path escaping safely.

---

## 🚀 Quick Start for Contributors

### Development Environment
1.  **Clone**: `git clone <repo-url>`
2.  **Install**: `npm install`
3.  **Build (Dev)**: `npm run dev` (starts esbuild in watch mode)
4.  **Install in Obsidian**: 
    *   Create a folder `vault/.obsidian/plugins/colorful-folders`
    *   Symlink or copy `main.js`, `manifest.json`, and `styles.css` into that folder.

### Project Philosophy
*   **Performance First**: CSS should be generated once and cached by the browser. Avoid DOM manipulation inside the render loop whenever possible.
*   **Non-Destructive**: Never modify the user's files. All styling is transient and lives in a dedicated `<style>` tag.
*   **Inheritance is Key**: The "Effective Style" calculation is the most important part of the UX. Child items should feel like part of their parent container.

---

## 📂 Project Structure

```text
colorful-folders/
├── src/
│   ├── main.ts              # Entry point & Lifecycle
│   ├── core/
│   │   ├── StyleGenerator.ts # Recursive CSS Engine
│   │   └── DividerManager.ts # DOM Reconciliation for Dividers
│   ├── ui/
│   │   ├── SettingTab.ts    # Main Config UI
│   │   ├── MenuHelper.ts    # Context Menu Integration
│   │   ├── modals/          # Complex UI components
│   │   └── components/      # Reusable UI widgets
│   ├── common/
│   │   ├── types.ts         # Type definitions & Interfaces
│   │   ├── constants.ts     # Palettes, Icons, & Regex
│   │   └── utils.ts         # Math, Hashing, & Color tools
│   └── integrations/        # 3rd party plugin support (Notebook Navigator)
├── esbuild.config.mjs       # Build pipeline
└── manifest.json            # Obsidian plugin metadata
```

---

## 🛠️ Tech Stack
*   **TypeScript**: Primary language.
*   **esbuild**: Lightning-fast bundler.
*   **Obsidian API**: The core framework.
*   **CSS-in-TS**: We generate raw CSS strings in TypeScript and inject them into the DOM.
*   **MutationObserver**: Used to keep our injected UI (Dividers) in sync with Obsidian's virtualized explorer.

---

*This documentation is living. If you find gaps, please update it.*
