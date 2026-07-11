# 🚀 4.2.5 - The "Ultimate Performance" Update

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

This hyper-optimized release brings unprecedented speed and stability to massive vaults (10,000+ files), alongside a highly-requested fix for folder color inheritance and brand new Tailwind UI palettes!

### 🌟 Highlight: The Smart Icon Manager
* **Local Icon Packs Support**: You can now drop any custom SVG icon pack directly into your `.obsidian/icons` folder! The plugin automatically detects and loads them using a blazingly fast parallel scanner, meaning even thousands of custom icons won't slow down your startup.
* **Completely Optimized Caching**: The Icon Manager has been completely rebuilt! The plugin now intelligently caches your custom SVG icons and strictly reloads them *only* when you change your icon settings. This completely eliminates unnecessary lag when tweaking other options, giving you a lightning-fast customization experience!

### ⚡ 1. Lightning Fast & Butter Smooth Architecture
* **Instant Load Times (O(1) CSS Grouping)**: We've completely eliminated the old "string-hashing" method that caused huge vaults to choke on startup. The plugin now uses a highly optimized grouping engine with deterministic signature keys to calculate and group styles instantly. No more waiting 10 seconds for colors to appear when you open Obsidian!
* **Zero UI Freezing (Asynchronous Yielding)**: We've completely rewritten how the plugin processes huge folder trees in the background. It now gracefully pauses to let the app breathe (yielding every 50ms), meaning you can scroll, click, and type without any stuttering even while the plugin is working hard in the background.
* **Ultra-Snappy Responsiveness (100ms Debouncer)**: We slashed the internal refresh delay by 3x! When you change a setting, move a file, or create a new folder, the UI updates almost instantaneously.
* **Lighter Memory Footprint**: We streamlined the core engine to prevent memory bloat, bypassing caching for mathematically unique items (like dynamic item counters), keeping your Obsidian workspace incredibly light and fast.

### 🛠️ 2. Bug Fixes & Integrations
* **Inheritance Problem SOLVED!**: Fixed a stubborn bug where subfolders and files were not correctly inheriting colors from their parent folders. Your entire tree will now flawlessly inherit and display the correct colors!
* **Flawless Integrations (Unified CSS Orchestration)**: Re-architected how third-party plugins (like Notebook Navigator) interact with our colors. Instead of duplicating effort, Notebook Navigator now directly pipes its styling into our central `CssGrouper`. Everything is now perfectly synchronized, eliminating duplicate styles and boosting overall speed.
* **Squeaky Clean Codebase**: Cleared out all underlying code warnings and strict TypeScript compiler mismatches for a rock-solid, crash-free experience.

### 🎨 3. New Features
* **New Tailwind UI Palettes**: Added two beautiful new built-in color palettes (`Tailwind UI` and `Tailwind UI Dark`) to bring modern, punchy web-design colors directly into your vault.
