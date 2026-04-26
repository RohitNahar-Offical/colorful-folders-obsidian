# ⚡ 4.1.3 - The "Premium Polish" Update

This release introduces advanced layout controls and a complete UI standard audit to ensure the plugin feels like a native part of the Obsidian ecosystem.

### 📐 1. Asymmetrical divider spacing
- **Independent padding**: Added `dividerLinePaddingLeft` and `dividerLinePaddingRight` to allow independent spacing between the lines and the central text/pill.
- **Migration logic**: Automatically migrates legacy padding settings to the new asymmetrical system for a seamless upgrade.
- **Enhanced DividerModal**: Integrated dual sliders into the per-divider configuration modal for granular control.

### 🎨 2. Sentence case UI audit
- **Standard compliance**: Performed a project-wide sweep to ensure all settings, placeholders, and tooltips follow Obsidian's sentence case guidelines.
- **Improved professionalism**: Updated featured icon pack names and import buttons for a cleaner, more consistent appearance.
- **Modal cleanup**: Standardized titles and button text across all premium modals.

### 🏎️ 3. Optimization engine
- **Optimized divider reconciliation**: Switched to a `replaceWith()` strategy for dividers, ensuring configuration updates are applied instantly without full DOM refreshes.
- **High-speed CSS assembly**: Refactored the `StyleGenerator` to use an array-based string builder, drastically reducing the overhead of generating global styles.

---
*Thank you for using Colorful Folders! If you enjoy the plugin, consider supporting development on GitHub.*
