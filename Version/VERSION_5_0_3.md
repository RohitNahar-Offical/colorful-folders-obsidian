# ⚡ 5.0.3 - Ultra-Fast Startup, Auto-Detect Icon Packs & Freeze-Free Picker

This release restores the ultra-fast (~0ms) plugin reload and startup performance from v5.0.0, introduces an automatic **Self-Check & Auto-Detect Icon Packs** tool in Settings, eliminates UI freezing when picking or searching icons, and adds real-time PC and Mobile sync proofing.

---

### ⚡ 1. Ultra-Fast Startup & Non-Blocking Layout Ready
* **~0ms Startup Lag**: Made plugin initialization and layout-ready hooks non-blocking. Initial folder styles render immediately in <1ms, while local icon scans run asynchronously in the background.
* **Parallel Icon Scanning**: Parallelized subdirectory SVG file scanning using `Promise.all`, drastically reducing local icon loading time on disk.
* **Targeted Workspace Observer**: Scoped style-stripping observers strictly to file explorer containers instead of observing the entire workspace `doc.body`.

### 🔍 2. Auto-Detect & Self-Check Icon Packs
* **Self-Check Icon Packs Tool**: Added an **"Auto-detect existing icon packs"** button in **Settings -> Custom icon management** that scans local vault storage (`.obsidian/icons` and `colorful-folders/icons/`), self-checks missing icon pack registrations, repairs indices, and reports installed icon counts accurately.
* **Comprehensive Alias Matching**: Updated pack installation detection to recognize all pack ID aliases (`tb-`, `si-`, `fa-`, `ri-`, local SVGs, and custom JSON files). Featured Icon Packs now accurately display `✓ Installed (X icons)`.

### 🚀 3. Freeze-Free Icon Picker & Safe Divider Rendering
* **Chunked Batch Grid Rendering**: Updated `IconPickerModal` to render icons in smooth incremental batches of 60 items with scroll-based lazy loading, preventing main-thread freezes.
* **O(1) DOM Template Cloning**: Cached parsed SVG template elements (`svgTemplateCache`) and populated grid cells using `cloneNode(true)`, eliminating DOMParser overhead.
* **Debounced Search**: Added a 150ms search input debounce to ensure smooth, freeze-free typing when filtering thousands of icons.
* **Safe Divider Icon Renderer**: Updated `DividerModal` header previews and setting buttons to safely support custom SVGs, emojis, Lucide icons, and fallbacks without throwing unhandled exceptions.

### 📱 4. Real-Time PC & Mobile Sync Proofing
* **Automatic Vault Sync Listener**: Added vault modification event handlers for custom icon files and `data.json`. Any icon packs or settings added or edited on PC automatically sync and load in real-time on Mobile (and vice-versa) when using Obsidian Sync, Git, or WebDAV.
