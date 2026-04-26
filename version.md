# Version History - Colorful Folders for Obsidian

## ⚡ 4.3.0 - The "Premium Polish" Update
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

## ⚡ 4.1.2 - Engine Stability & Performance
This release focused on core engine optimizations and stability.

- **DOM lookup consolidation**: Optimized `IconManager` and `DividerManager` to reduce layout thrashing by consolidating container queries.
- **Zero-latency refresh**: Improved debouncing logic to ensure UI updates are responsive without blocking the main thread.

---

## 🎨 4.1.1 - Advanced Divider Customization
A visual-focused update that introduces modern design options and interactive color tools.

### 💊 1. Modern Pill Design
- **Pill Design Mode**: A new optional design that wraps divider labels in a premium rounded background.
- **Color Inheritance**: Pills automatically inherit the parent folder's color with a smart 15% opacity fallback.
- **Custom Spacing**: Added a "Line-to-text gap" setting to precisely control the padding between lines and labels.

### 🌈 2. Visual Color Tools
- **Rich Visual Color Picker**: Integrated a high-end color board and alpha slider for all divider and pill settings.
- **RGBA Support**: Full transparency support for pill backgrounds, allowing for sophisticated glassmorphic or subtle tinted effects.
- **Live Preview**: The divider creation modal now features a centered, real-time preview of your designs.

---

## 💎 4.1.0 - High-End Management & Privacy
This major release introduces the high-end Hover Message system and a robust, password-protected Stealth system.

### 🕵️ 1. New: Stealth & Privacy Engine
- **Visual Privacy**: Hide any file or folder from the sidebar with a single click via the context menu.
- **Ghost Mode**: Toggle semi-transparent viewing of hidden items with a sleek blur effect.
- **Password Protection**: Secure your privacy settings with a custom Password Modal featuring shake animations for invalid attempts.
- **Management Dashboard**: A new "Privacy & stealth" card in settings to manage all hidden items and recovery options.
- **Rapid Access**: Use the sidebar ribbon icon or the **Ctrl+Shift+Q** shortcut to toggle stealth mode instantly.

### ➕ 2. New: Premium Divider Hovers
- **Markdown Support**: Dividers now support rich Markdown descriptions in a premium, glassmorphic floating popover.
- **Smart Editor**: Includes a dedicated modal with real-time preview and **Smart Suggester** for internal links (`[[`) and tags (`#`).
- **Native Shortcuts & Toolbar**: The editor supports **Ctrl+C / V / X**, a formatting toolbar, and hotkeys (**Ctrl+B, I, K**).
- **Improved Code Visibility**: Inline code and code blocks in popovers feature distinct, high-contrast styling.

### 🎨 3. Enhanced Divider Customization
- **Icon Positioning**: Added granular control for divider icon placement (Left, Right, or Both).
- **Improved Alignment**: Refined vertical and horizontal centering for pixel-perfect layouts.

### 🔗 4. Notebook Navigator Restoration
- **Full Compatibility**: Completely re-engineered the **Notebook Navigator** integration.
- **Scoped Styling**: Specialized DOM selectors ensure NN items match the native Obsidian aesthetic.

---

## 🚀 4.0.7 - Major Feature Debut
4.0.7 marks the official launch of modern organizational tools, introducing section dividers and a smart icon engine.

- **Section Dividers**: Add visual dividers with glassmorphic styling to group your folders.
- **Smart Auto-Icon Engine**: Automatically detects folder names and assigns perfect icons.
- **Premium Production UI**: Rebranded and standardized to an 18px baseline.
- **Improved Visual Defaults**: Enhanced line patterns and auto-enabled Glassmorphism.

---

## 🍱 4.0.6 - Icon Pack Update
- **Standardized Icon Alignment**: Forced centering regardless of font size or theme.
- **Improved Iconify Importer**: Added support for SVG offsets and alias preservation.
- **New Built-in Icon Library**: Added 6 curated, local JSON icon packs.

---

> [!TIP]
> For more details on older versions, see the files in the `Version/` directory.
