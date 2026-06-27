# Updates for Colorful Folders

## ⚡ 4.1.8 - The "Speed & Smoothness" Update
This release focuses entirely on making Colorful Folders feel lightning-fast and incredibly smooth to use, especially for users with massive vaults and lots of other plugins.

### 🚀 1. Faster Navigation
- **Instant Clicking**: Selecting files is now completely instant. We rebuilt the "active folder" highlighting engine from the ground up to completely eliminate input lag when opening files.
- **Notebook Navigator Sync**: We updated the *Notebook Navigator* integration so it natively supports the new, lightning-fast active highlights.

### ⚡ 2. Smooth Scrolling & Expanding
- **No More Stuttering**: Rapidly expanding or collapsing folders is now buttery smooth. The plugin smartly groups visual updates to prevent your screen from freezing during intense folder management.
- **Faster Startups & Edits**: Creating, deleting, or renaming files has been heavily optimized so Obsidian stays perfectly responsive while you work.

### 🛡️ 3. Zero Drag Lag & Better Compatibility
- **Smooth Mouse Movements**: Hovering over files, dragging items, or switching tabs will no longer cause CPU spikes. The plugin now safely ignores rapid mouse movements and only triggers visual updates when absolutely necessary (like when you switch between Light and Dark mode).
- **Third-Party Plugin Immunity**: Colorful Folders is now much smarter at ignoring visual "noise" injected by other plugins (like file counters or virtual scroll lists), completely preventing layout flickering and infinite reload loops.

### 🛠️ 4. Obsidian 1.13+ API Compatibility
- **Deprecation Fixes**: Addressed developer console warnings by migrating to the new `.setDestructive()` API for buttons and removing deprecated slider tooltips.
- **Linter Compliance**: Updated project typing to fully align with the latest `obsidian` API definitions.

---

## ⚡ 4.1.7 - Mobile Responsiveness & Layout Refinements
This release introduces a cleaner desktop context menu layout with submenu grouping, robust mobile-responsive styling for the configuration interface, custom metadata wrapping options, shorthand hex resolution, and crucial event listener cleanup to prevent memory leaks.

### 📱 1. Responsive Settings Tab & Desktop Submenus
- **Mobile-First Layout**: Introduced a dedicated `@media (max-width: 600px)` style block to ensure the settings card grid, action buttons, tab bars, and premium popovers scale elegantly on smaller phone and tablet viewports.

- **Wrap Metadata Option**: Added a toggle to wrap file counts, word counts, and other plugin metadata (e.g., from *Novel Word Count* plugin) to the next line on desktop. (This remains automatically active on mobile).

### 🔧 2. Bug Fixes & Code Hardening
- **Shorthand Hex Support**: Restructured the hex parsing logic to safely recognize and expand 3-digit shorthand hex codes (e.g., `#fff` to `#ffffff`) without throwing TypeErrors.
- **Scroll Listener Cleanup**: Fixed a minor memory leak by properly removing the container scroll event listener during the cleanup phase.
- **CSS Linter Compliance**: Resolved a series of CSS warnings related to vendor-specific prefixes for masks, scrollbars, and unnecessary `!important` overrides.

---
