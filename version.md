# Updates for Colorful Folders

## ⚡ 4.1.5 - The "Native-Bridge" & Stability Update
This release finalizes the integration with Notebook Navigator and introduces a series of architectural hardening measures for a flawlessly synchronized experience.

### 🧩 1. Hardened Notebook Navigator Integration
- **CSS Firewall Architecture**: Implemented a "Native-Bridge" selector system using `:not()` exclusions. This prevents standard explorer styles from leaking into Notebook Navigator, permanently resolving the "Double Icon" issue.
- **Pure CSS Rendering**: Purged legacy DOM injection for integrated panes, ensuring 100% flicker-free performance in virtualized lists.
- **Decoupled Scaling**: Optimized icon scaling (1.1em) specifically for the Notebook Navigator card layout, ensuring visual parity with the standard sidebar (1.3em).

### 🎨 2. Fallback Icon System
- **Zero-Blank Policy**: Added an intelligent fallback system for Notebook Navigator. Items without a manual or auto-assigned icon will now show a professional Lucide folder or file icon.
- **Perfect Synchronization**: These icons correctly inherit your configured colors and opacity for a unified aesthetic.

### 📐 3. Dynamic Path Thickness
- **User-Defined Weight**: Introducing a new **Path line thickness** slider. You can now adjust the base weight of vertical indentation guides and active highlights (1.0px to 10.0px).
- **Visual Harmony**: The engine automatically scales related borders proportionately to maintain structural hierarchy.

### 🚀 4. Performance & Stability
- **Deep Code Audit**: Purged redundant logic and dead code across all core modules.
- **Zero-Animation Mandate**: UI updates now occur with absolute zero latency for a sharp, responsive feel.
- **Luminous Default**: Finalized the premium glass sheen as the standard for active items.


---

## ⚡ 4.1.4 - The "Visual & Performance" Update
This release focuses on elevating visual elegance through the Luminous Selection default, alongside powerful Engine Micro-Optimizations.

### 🌟 1. The New "Luminous" Default
- **Permanent Elegance**: The subtle glass highlight, dynamic white gradient overlay, and 3D micro-bevel sheen are now the permanent default styles for active files.
- **Unified Aesthetics**: Your active files will always feel premium and tactile, independent of the Radiant Path settings.

### 📏 2. Flawless Divider Integration
- **Negative Line Gaps**: You can now push divider lines inward using negative gaps (down to **-10px**) for a seamless intersection with pills.
- **Layering Precision**: Upgraded z-index management guarantees that intersecting lines tuck cleanly behind the divider chips.

### 🚀 3. Engine Performance & Architecture
- **Radiant Path Stability**: Standardized the glowing connecting trail to a strict `2px` thickness, completely resolving the browser sub-pixel "thinning line" rendering glitch for deeply nested files.
- **Full Animation Decommissioning**: Removed all legacy animation logic and keyframes (Breathe, Neon, Shimmer) to prioritize zero-lag performance and visual hardening. All visuals are now hardcoded to high-performance static standards.

---

## ⚡ 4.1.3 - The "Premium Polish" Update
This release introduces advanced layout controls and a complete UI standard audit to ensure the plugin feels like a native part of the Obsidian ecosystem.

### 🏷️ 1. High-visibility metadata
- **Bold extensions & tags**: File extensions (PDF, JPEG, etc.) and tags are now explicitly set to a high-visibility bold weight (**900**) for faster identification in dense lists.
- **Enhanced item counters**: Item counters for folders and files now feature improved contrast and alignment, syncing perfectly with your folder's primary color.

### 📐 2. Asymmetrical divider spacing
- **Independent padding**: Added `dividerLinePaddingLeft` and `dividerLinePaddingRight` to allow independent spacing between the lines and the central text/pill.
- **Migration logic**: Automatically migrates legacy padding settings to the new asymmetrical system for a seamless upgrade.
- **Enhanced DividerModal**: Integrated dual sliders into the per-divider configuration modal for granular control.

### 🏎️ 3. Optimization engine
- **Optimized divider reconciliation**: Switched to a `replaceWith()` strategy for dividers, ensuring configuration updates are applied instantly without full DOM refreshes.
- **High-speed CSS assembly**: Refactored the `StyleGenerator` to use an array-based string builder, drastically reducing the overhead of generating global styles.

### 🎨 4. Sentence case UI audit
- **Standard compliance**: Performed a project-wide sweep to ensure all settings, placeholders, and tooltips follow Obsidian's sentence case guidelines.
- **Improved professionalism**: Updated featured icon pack names and import buttons for a cleaner, more consistent appearance.
- **Modal cleanup**: Standardized titles and button text across all premium modals.
