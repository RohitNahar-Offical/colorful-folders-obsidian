# Updates for Colorful Folders

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
* **Instant Priority Reordering**: Re-order the priority ranking of all icon packs (Lucide, Bootstrap, Simple Icons, Tabler, Remix, FontAwesome, Material, Feather, Native Emojis)

### 🔄 4. Deterministic Icon Loading & Restart Stability
* **Startup Race Condition Fix**: Awaits local filesystem icon loading (`await loadLocalIcons()`) before generating initial styles on vault launch.
* **Deterministic File & Key Sorting**: Sorted filesystem traversal and icon index keys deterministically (`localeCompare()`), guaranteeing 100% consistent and static icon assignments across every restart.

### 💬 5. Divider Hover Message Preview Fix
* **In-Modal Live Preview Positioning**: Added anchor hover message previews inline inside the editor modal, preventing preview popovers from rendering off-screen.
* **Active Popover Cleanup**: Automatically dismisses active sidebar popovers whenever opening divider configuration modals.

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
