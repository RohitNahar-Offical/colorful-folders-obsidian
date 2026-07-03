# Updates for Colorful Folders

## 🚀 4.2.0 - The "Advanced Features & Ultimate Performance" Update
This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults.

### ⚡ 1. Perfect Scroll Performance
- **Zero Scroll Lag**: We completely rewrote the icon injection engine. Rapidly scrolling through hundreds of folders in the virtualized list is now perfectly smooth with zero layout thrashing or CPU spikes. 

### 🏷️ 2. Tag Color Synchronization
- **Unify Your Vault**: Folder colors can now automatically synchronize with Obsidian tags!
- **Match Folders**: Automatically color tags that perfectly match a styled folder's name (e.g. styling the folder "Work" automatically styles `#Work`).
- **Custom Tag Rules**: Use the new Tag Sync Rules setting to map specific tags to any styled folder path manually (e.g. `#todo = /Projects/Active`).

### 🎨 3. Graph View Color Sync
- **Colorful Nodes**: Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups, giving you a perfectly unified aesthetic across your entire workspace.

### 🧩 4. Advanced Auto-Icon Builder & Local Packs
- **Regex Icon Matching**: The Custom Icon Rules engine now supports powerful Regular Expressions. Match multiple folders instantly using flexible patterns instead of strict names.
- **`.obsidian/icons` Support**: The plugin now automatically detects and loads any SVG icons placed in the standard `.obsidian/icons` directory! (Includes parallel loading for near-instant startups even with 1000+ icons).

---
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

### 🛠️ 4. Obsidian 1.13+ API Compatibility & Legacy Support
- **Deprecation Fixes**: Safely bypassed developer console warnings for older APIs (like `setWarning()` and `display()`) instead of migrating to newer ones, guaranteeing that the plugin remains fully backwards-compatible with Obsidian 1.4.4+.
- **CSS Optimization**: Improved CSS selector specificity (e.g. `.is-invalid` fields) and removed all `!important` flags for a cleaner styles structure.
- **Linter Compliance**: Updated project typing to align with the latest `obsidian` API definitions while preserving backwards compatibility.

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
