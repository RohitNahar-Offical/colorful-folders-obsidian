# Updates for Colorful Folders

## 🚀 4.2.5 - The "Ultimate Performance" Update

This hyper-optimized release brings unprecedented speed and stability to massive vaults, alongside a highly-requested fix for folder color inheritance!

### 🌟 Highlight: The Smart Icon Manager
- **Local Icon Packs Support**: You can now drop any custom SVG icon pack directly into your `.obsidian/icons` folder! The plugin automatically detects and loads them using a blazingly fast parallel scanner, meaning even thousands of custom icons won't slow down your startup.
- **Completely Optimized Caching**: The Icon Manager has been completely rebuilt! The plugin now intelligently caches your custom SVG icons and strictly reloads them *only* when you change your icon settings. This completely eliminates unnecessary lag when tweaking other options, giving you a lightning-fast customization experience!

### ⚡ Lightning Fast & Butter Smooth
- **Instant Load Times**: The plugin now uses a highly optimized grouping engine to calculate styles instantly. No more waiting 10 seconds for colors to appear when you open Obsidian!
- **Zero UI Freezing**: We've completely rewritten how the plugin processes huge folder trees in the background. It now gracefully pauses to let the app breathe, meaning you can scroll and click without any stuttering.
- **Ultra-Snappy Responsiveness**: We slashed the refresh delay by 3x! When you change a setting or move a file, the UI updates almost instantaneously.
- **Lighter Memory Footprint**: We streamlined the core engine to prevent memory bloat, keeping your Obsidian workspace incredibly light and fast.

### 🎨 New Features, Fixes & Integrations
- **New Tailwind UI Palettes**: Added two beautiful new built-in color palettes (`Tailwind UI` and `Tailwind UI Dark`) to bring modern, punchy web-design colors directly into your vault.
- **Inheritance Problem SOLVED!**: Fixed a stubborn bug where subfolders and files were not correctly inheriting colors from their parent folders. Your entire tree will now flawlessly inherit and display the correct colors!
- **Flawless Integrations**: Re-architected how third-party plugins (like Notebook Navigator) interact with our colors. Everything is now perfectly synchronized, eliminating duplicate styles and boosting overall speed.
- **Squeaky Clean Codebase**: Cleared out all underlying code warnings and strict errors for a rock-solid, crash-free experience.

---

## 🌟 4.2.0 - The "Advanced Features" Update

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults.

### ⚡ 1. Perfect Scroll & Instant Startup
- **Instant Startup**: Optimized the plugin loading cycle. Folder styles and settings load instantly when you open your vault.
- **Smooth Sidebar Scrolling**: Rewrote the background styling engine. Scrolling through thousands of folders and files is now buttery smooth, with zero lag or stutter.
- **Smart Background Icon Loading**: Custom icons are now loaded gently in the background. The plugin waits 2 seconds after startup before scanning files, ensuring it never freezes your Obsidian app.
- **Cached Folder Colors**: Folder colors and styles are calculated once and stored in memory. The plugin doesn't need to recalculate them constantly, saving your device's CPU.

### 🏷️ 2. Tag Color Synchronization
- **Unify Your Vault**: Folder colors can now automatically synchronize with Obsidian tags!
- **Match Folders**: Automatically color tags that perfectly match a styled folder's name (e.g. styling the folder "Work" automatically styles `#Work`).
- **Custom Tag Rules**: Use the new Tag Sync Rules setting to map specific tags to any styled folder path manually (e.g. `#todo = /Projects/Active`).
- **Interactive Tag Rules Builder**: Added a visual rules builder in the settings. Click to pick tag colors using a color picker and manage rules with buttons instead of typing them manually.
- **True Capsule Pill Styling**: Styled tags now display as beautiful rounded pills in both Reading Mode and Live Preview (writing mode), with seamless border corners and balanced spacing.

### 🎨 3. Graph View Color Sync
- **Colorful Nodes**: Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups, giving you a perfectly unified aesthetic across your entire workspace.

### 🧩 4. Advanced Auto-Icon Builder & Local Packs
- **Regex Icon Matching**: The Custom Icon Rules engine now supports powerful Regular Expressions. Match multiple folders instantly using flexible patterns instead of strict names.
- **`.obsidian/icons` Support**: The plugin now automatically detects and loads any SVG icons placed in the standard `.obsidian/icons` directory! (Includes parallel loading for near-instant startups even with 1000+ icons).

### 🖌️ 5. Visual Settings Pickers & Interactive UI
- **Visual Global Backgrounds**: The global background setting now uses an interactive visual color picker instead of forcing you to type raw hex codes.
- **Interactive Palette Builder**: The Custom Hex Palette setting has been completely rewritten into a side-by-side interactive builder.
- **Swatch Previews**: See all your palette colors as real swatches, click them to open a side-panel visual color picker, and manage them effortlessly with new "Add Color" and "Reset to Default" buttons.
- **Smooth Performance (Debounced Saves)**: Added a 300ms save/build debouncer to prevent database lag and UI stutters when dragging visual color picker sliders.

---