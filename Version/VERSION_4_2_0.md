# 🚀 4.2.0 - The "Advanced Features & Ultimate Performance" Update

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults.

### ⚡ 1. Perfect Scroll & Instant Startup
* **Instant Obsidian Startup**: Refactored the core settings loading and local icon fetching to completely eliminate startup delays. Local `.obsidian/icons` discovery is deferred by 2 seconds to move file scanning out of the critical startup path.
* **Batched SVG Loading**: Custom icons are loaded in batches of **50 concurrent operations** instead of loading hundreds of files simultaneously, completely eliminating Electron thread pool freeze and disk I/O saturation.
* **O(1) Palette & Parser Caching**: Color palettes and hex parser translations are computed once and stored in global memory caches. Lookups and `getEffectiveStyle` queries run in O(1) time without performing redundant math.
* **Zero Scroll Lag**: We completely rewrote the icon injection engine. Rapidly scrolling through hundreds of folders in the virtualized list is now perfectly smooth with zero layout thrashing or CPU spikes. 
* **Targeted Updates**: The plugin now intelligently updates only the specific icons that just appeared on screen, rather than scanning the entire file explorer.
* **RAF Batching**: All visual updates are now grouped using `requestAnimationFrame`, eliminating layout stutter on first load.
* **Removed Redundant Observers**: Removed premature observer calls from the `onload()` startup phase, preventing premature layout reflows before workspace leaves are fully loaded.

### 🏷️ 2. Tag Color Synchronization
* **Unify Your Vault**: Folder colors can now automatically synchronize with Obsidian tags!
* **Match Folders**: Automatically color tags that perfectly match a styled folder's name (e.g. styling the folder "Work" automatically styles `#Work`).
* **Custom Tag Rules**: Use the new Tag Sync Rules setting to map specific tags to any styled folder path manually (e.g. `#todo = /Projects/Active`).

### 🎨 3. Graph View Color Sync
* **Colorful Nodes**: Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups, giving you a perfectly unified aesthetic across your entire workspace.

### 🧩 4. Advanced Auto-Icon Builder & Local Packs
* **Regex Icon Matching**: The Custom Icon Rules engine now supports powerful Regular Expressions. Match multiple folders instantly using flexible patterns instead of strict names.
* **`.obsidian/icons` Support**: The plugin now automatically detects and loads any SVG icons placed in the standard `.obsidian/icons` directory! (Includes parallel loading for near-instant startups even with 1000+ icons).

### 🖌️ 5. Visual Settings Pickers & Interactive UI
* **Visual Global Backgrounds**: The global background setting now uses an interactive visual color picker instead of forcing you to type raw hex codes.
* **Interactive Palette Builder**: The Custom Hex Palette setting has been completely rewritten into a side-by-side interactive builder.
* **Swatch Previews**: See all your palette colors as real swatches, click them to open a side-panel visual color picker, and manage them effortlessly with new "Add Color" and "Reset to Default" buttons.
* **Smooth Performance (Debounced Saves)**: Added a 300ms save/build debouncer to prevent database lag and UI stutters when dragging visual color picker sliders.

---

## 🛠️ Behind the Scenes (Developer Updates)
* **O(1) Palette & Parser Caching**: Implemented a caching mechanism (`_cachedPalette`, `_cachedPaletteKey`) in `getCurrentPalette()` and global parsing caches (`rgbCache` and `paletteCache` in `utils.ts`) to make styling lookups O(1) and avoid recalculations.
* **Batched & Deferred I/O**: Swapped raw parallel `Promise.all` reads in `loadLocalIcons()` for a chunking strategy (batch size 50) and deferred scanning by 2 seconds using `window.setTimeout` to prevent Electron IPC bottlenecks and thread congestion.
* **Redundant Observer Removal**: Removed premature observer calls from the `onload()` constructor, deferring layout observer registrations strictly to `onLayoutReady()`.
* **MutationObserver Guards**: Implemented strict `isScrolling` guards on the global file explorer observer to prevent cascade rendering.
* **Documentation Overhaul**: Updated the `ENGINE_INTERNALS.md`, `ARCHITECTURE.md`, `API_REFERENCE.md`, and `INCIDENT_LOG.md` to map the new scroll performance systems and Regex Icon Builder internals.
* **Data Schema Updated**: All new settings (`tagSyncEnabled`, `tagSyncMatchFolders`, `tagSyncRules`, `graphColorSync`) have been documented in `DATA_SCHEMA.md`.
