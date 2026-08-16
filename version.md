# Updates for Colorful Folders

## 🛠️ 5.0.2 - Performance, Auto-Detect Icons, Mobile Dividers & Sync

This release restores ultra-fast (~0ms) startup speeds, introduces an automatic **Self-Check & Auto-Detect Icon Packs** tool in Settings, fixes section dividers on mobile devices, eliminates UI freezing in the icon picker, and adds real-time PC & Mobile sync proofing.

---

### ⚡ 1. Ultra-Fast Startup & Non-Blocking Initialization
* **~0ms Startup Lag**: Plugin initialization and layout-ready hooks are non-blocking; initial folder styles render immediately (<1ms) while local icon scans run in the background.
* **Parallel Icon Scanning**: Parallelized SVG file scanning on disk using `Promise.all` for fast local asset loading.
* **Targeted Workspace Observers**: Scoped style-stripping mutation observers strictly to file explorer containers instead of watching `doc.body`.

### 🔍 2. Auto-Detect & Self-Check Icon Packs
* **Self-Check Icon Packs Tool**: Added an **"Auto-detect existing icon packs"** button in **Settings -> Custom icon management** that scans local vault storage (`.obsidian/icons` and `colorful-folders/icons/`), repairs registrations, and reports accurate icon counts.
* **Comprehensive Alias Detection**: Installation detection now recognizes all pack ID aliases (`tb-`, `si-`, `fa-`, `ri-`, local SVGs) so Featured Icon Packs accurately display `✓ Installed (X icons)`.

### 🚀 3. Freeze-Free Icon Picker & Divider Rendering
* **Chunked Batch Grid Rendering**: `IconPickerModal` renders icons in smooth incremental batches of 60 items with scroll-based lazy loading and 150ms search debouncing to eliminate main-thread freezes.
* **O(1) DOM Template Cloning**: Parsed SVG template elements are cached and cloned with `cloneNode(true)` for fast DOM cell creation.
* **Safe Divider Icon Renderer**: `DividerModal` header previews and setting buttons safely support custom SVGs, emojis, Lucide icons, and fallbacks without JS errors.

### 📱 4. Mobile Dividers & Real-Time Cross-Device Sync
* **Mobile Dividers Support**: Section dividers now render properly in mobile phone file lists with smart text trimming and touch controls.
* **Real-Time Cross-Device Sync**: Vault modification listeners on `data.json` and custom icon directories automatically sync settings and icons between PC and Mobile in real-time across Obsidian Sync, WebDAV, Git, or iCloud.

---

## 🛠️ 5.0.1 - Bug Fixes and Improvements

This release resolves layout alignment issues, eliminates UI stutter, introduces the Icon Pack Priority Hierarchy system, and fixes icon stability across vault restarts.

---

### 🎨 1. Root Folder & Text Vertical Alignment Fix
* **Inline-Flex Alignment**: Restructured `RainbowManager` styling rules to use `display: inline-flex` with `align-items: center` for root folder elements.
* **Pixel-Perfect Placement**: Prevents icon and folder label misalignments across different Obsidian themes and custom font settings.

### ⚡ 2. Stutter & UI Performance Fixes
* **Frame-Scheduled Observer**: Scheduled DOM observer queries via `requestAnimationFrame` batching to eliminate main-thread stutter during fast sidebar expand/collapse actions.
* **Glassmorphism Scope Optimization**: Restricted glassmorphism CSS strictly to active file selection when enabled in settings, eliminating heavy backdrop-blur recalculations on unselected file and folder rows.

### 🏆 3. Icon Pack Priority Hierarchy (Up ▲ & Down ▼ System)
* **Instant Priority Reordering**: Re-order the priority ranking of all icon packs (Lucide, Bootstrap, Simple Icons, Tabler, Remix, FontAwesome, Material, Feather, Native Emojis) with instant (<1ms) Up/Down button responsiveness.
* **Simplified Settings**: Removed redundant preferred icon pack dropdown in favor of the flexible, visual priority ranking list.
* **Native Emoji Demotion**: Native emojis are ranked at the bottom of the priority order (#10) by default, ensuring vector SVG icons are always preferred.
* **Startup Race Condition Fix**: Awaits local filesystem icon loading (`await loadLocalIcons()`) before generating initial styles on vault launch.
* **Deterministic File & Key Sorting**: Sorted filesystem traversal and icon index keys deterministically (`localeCompare()`), guaranteeing 100% consistent and static icon assignments across every restart.

### 📱 6. Mobile Section Divider & Instant Drawer Sync Fixes
* **Mobile DOM Tree Support**: Added native support for `.tree-item` and `.tree-item-self` DOM nodes used in Mobile Obsidian file explorer drawers.
* **Instant Drawer Display**: Automatically invalidates stale container caches and syncs dividers on `layout-change` and `active-leaf-change`, eliminating the bug where separators only appeared after clicking.
* **Modal Live-Sync Freeze Prevention**: Filtered out text nodes and internal child mutations inside `.cf-interactive-divider` in `DOMObserverService`, eliminating main-thread infinite re-render loops during modal editing.

### ⚡ 7. Sub-Millisecond $O(1)$ Mobile Calculation & Memory Reclamation
* **O(1) Indexed Map Resolution**: Replaced sequential DOM queries with single-pass `[data-path]` map indexing (`domPathMap`), delivering sub-millisecond calculation speeds on mobile phones.
* **Immediate Garbage Collection**: Explicitly clears temporary map/set data structures in a `finally` block to instantly reclaim heap RAM without waiting for JS garbage collection.
* **Cross-Device Settings & Divider Sync**: Listens to external modifications of `colorful-folders/data.json` via `vault.on("modify")`, automatically syncing divider configs and styles across devices when using WebDAV Sync, Obsidian Sync, Git, or iCloud.
* **Mobile Phone Responsive UI**: Added `touch-action: none` to color pickers, auto-truncating section chips (`text-overflow: ellipsis`), and adaptive flex footers for mobile viewports.

---

## 🚀 5.0.0 - Architectural Overhaul & New Features

Welcome to **Colorful Folders 5.0.0**! This major update brings smart AI icon matching, blistering performance improvements for large vaults, and bulletproof stability with other Obsidian plugins.

---
### 🌲 1. Perfect Folder Scope Hierarchy (New Mode under Hierarchy Mode)
* **Matching Colors by Tree Depth**: Notes and subfolders at the exact same depth level receive matching colors for a clean, balanced layout:
  - **Level 1** (Root folders & root notes) = Color A
  - **Level 2** (Subfolders & notes inside root folders) = Color B
  - **Level 3** (Deeper subfolders) = Color C
* **No Level Mismatches**: Notes align visually with their exact folder depth in your sidebar.

### ⚡ 2. Instant Auto-Icons (Offline & Free)
* **No API Keys Needed**: Automatically pick perfect icons for your notes and folders in seconds—completely offline, private, and 100% free!
* **Blazing Fast**: Classifies hundreds of notes in less than a second.
* **Smart Matching**: Connect your favorite local AI models (via Ollama) for intelligent icon selection.
* **Live Progress Bar**: Watch real-time scanning progress as your vault gets automatically styled.

---

### 🤖 3. Smart AI Icon Assistant
* **Context-Aware Styling**: Automatically style your vault based on the actual topics and content of your notes.
* **Automatic Icon Fallbacks**: If a suggested icon isn't installed, the plugin automatically finds the closest matching alternative from Lucide, Simple Icons, or FontAwesome.

---
### 🚀 4. Butter-Smooth Performance & Zero Conflicts
* **Rebuilt Styling Engine**: Redesigned how colors are rendered under the hood for faster updates and zero layout glitches.
* **Zero Lag in Large Vaults**: Ultra-optimized calculations keep scrolling completely smooth, even in vaults with 10,000+ files.

---
