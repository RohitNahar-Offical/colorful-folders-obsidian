# Colorful Folders 5.0.1 - Bug Fixes & Performance Patch 🛠️

Version 5.0.1 is a targeted maintenance update resolving UI alignment issues and main-thread stuttering across Obsidian themes.

## ✨ What's Fixed & Improved in 5.0.1?

### 🎨 Root Folder Icon & Text Alignment Fix
- **Inline-Flex Layout**: Refactored `RainbowManager` styling rule definitions to use `display: inline-flex` with `align-items: center`.
- **Pixel-Perfect Alignment**: Ensures root folder icons and folder titles align perfectly without vertical misalignments across custom Obsidian font sizes and community themes.

### ⚡ UI Stutter & Performance Optimization
- **Frame-Scheduled Observers**: Batched DOM observer checks via `requestAnimationFrame` to eliminate UI stuttering when rapidly expanding/collapsing deep folder trees.
- **Glassmorphism Scoping**: Restricted glassmorphism CSS processing to file nodes, eliminating unnecessary main-thread recalculations on parent folder containers.

### 💬 Divider Hover Message Preview Fix
- **Inline Modal Preview**: Added `.cf-modal-preview` CSS specificity overrides so that hover message previews remain anchored inline (`position: relative`) within the "Edit hover message" modal instead of jumping off-screen.
- **Active Popover Cleanup**: Added static cleanup logic to close active sidebar popovers whenever an edit modal opens.

---

Thank you for using Colorful Folders!
