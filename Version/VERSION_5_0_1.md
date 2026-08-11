# Colorful Folders 5.0.1 - Bug Fixes & Performance Patch 🛠️

Version 5.0.1 is a targeted maintenance update resolving UI alignment issues, main-thread stuttering, icon pack hierarchy reordering, and restart icon stability across Obsidian themes.

## ✨ What's Fixed & Improved in 5.0.1?

### 🎨 Root Folder Icon & Text Alignment Fix
- **Inline-Flex Layout**: Refactored `RainbowManager` styling rule definitions to use `display: inline-flex` with `align-items: center`.
- **Pixel-Perfect Alignment**: Ensures root folder icons and folder titles align perfectly without vertical misalignments across custom Obsidian font sizes and community themes.

### ⚡ UI Stutter & Performance Optimization
- **Frame-Scheduled Observers**: Batched DOM observer checks via `requestAnimationFrame` to eliminate UI stuttering when rapidly expanding/collapsing deep folder trees.
- **Glassmorphism Scoping**: Restricted glassmorphism CSS strictly to active file selection when enabled in settings, eliminating unnecessary main-thread backdrop-blur recalculations on unselected file and folder rows.

### 🏆 Icon Pack Priority Hierarchy (Up ▲ & Down ▼ System)
- **Instant Priority Reordering**: Re-order the priority ranking of all icon packs with instant (<1ms) Up/Down button responsiveness.
- **Simplified Settings**: Removed redundant preferred icon pack dropdown in favor of the flexible, visual priority ranking list.
- **Native Emoji Demotion**: Native emojis are ranked at the bottom of the priority order (#10) by default, ensuring vector SVG icons are always preferred.

### 🔍 Lucide & Vector SVG Icon Resolver Fix
- **Hyphenated Lucide Icon Resolution**: Fixed Lucide pack prefix matching for icons containing hyphens (e.g., `help-circle`, `message-square-question`, `badge-help`, `file-text`, `book-open`).
- **No Unwanted Emoji Fallbacks**: Resolves vector SVG icons properly without falling back to native emojis when valid SVG candidates exist.

### 🔄 Deterministic Icon Loading & Restart Stability
- **Startup Race Condition Fix**: Awaits local filesystem icon loading (`await loadLocalIcons()`) before generating initial styles on vault launch.
- **Deterministic File & Key Sorting**: Sorted filesystem traversal and icon index keys deterministically (`localeCompare()`), guaranteeing 100% consistent and static icon assignments across every restart.

### 💬 Divider Hover Message Preview Fix
- **Inline Modal Preview**: Added `.cf-modal-preview` CSS specificity overrides so that hover message previews remain anchored inline (`position: relative`) within the "Edit hover message" modal instead of jumping off-screen.
- **Active Popover Cleanup**: Added static cleanup logic to close active sidebar popovers whenever an edit modal opens.

---

Thank you for using Colorful Folders!
