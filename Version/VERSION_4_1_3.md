# ⚡ 4.1.3 - The "Premium Polish" Update
This release introduces advanced layout controls and a complete UI standard audit to ensure the plugin feels like a native part of the Obsidian ecosystem.

## 🏷️ 1. High-visibility metadata
- **Bold extensions & tags**: File extensions (PDF, JPEG, etc.) and tags are now explicitly set to a high-visibility bold weight (**900**) for faster identification in dense lists.
- **Enhanced item counters**: Item counters for folders and files now feature improved contrast and alignment, syncing perfectly with your folder's primary color.

## 📐 2. Asymmetrical divider spacing
- **Independent padding**: Added `dividerLinePaddingLeft` and `dividerLinePaddingRight` to allow independent spacing between the lines and the central text/pill.
- **Migration logic**: Automatically migrates legacy padding settings to the new asymmetrical system for a seamless upgrade.
- **Enhanced DividerModal**: Integrated dual sliders into the per-divider configuration modal for granular control.

## 🏎️ 3. Optimization engine
- **Optimized divider reconciliation**: Switched to a `replaceWith()` strategy for dividers, ensuring configuration updates are applied instantly without full DOM refreshes.
- **High-speed CSS assembly**: Refactored the `StyleGenerator` to use an array-based string builder, drastically reducing the overhead of generating global styles.

# Version 4.1.0 - The "Premium Organization & Stealth" Release
## 💎 4.1.0 - High-End Management & Privacy
This major release introduces the high-end Hover Message system and a robust, password-protected Stealth system.

### 🕵️ 1. New: Stealth & Privacy Engine
- **Visual Privacy**: Hide any file or folder from the sidebar with a single click via the context menu.
- **Ghost Mode**: Toggle semi-transparent viewing of hidden items with a sleek blur effect.
- **Password Protection**: Secure your privacy settings with a custom Password Modal featuring shake animations for invalid attempts.
- **Management Dashboard**: A new "Privacy & stealth" card in settings to manage all hidden items and recovery options.
- **Rapid Access**: Use the sidebar ribbon icon or the **Ctrl+Shift+Q** shortcut (e.g.) to toggle stealth mode instantly.

### ➕ 2. New: Premium Divider Hovers
- **Markdown Support**: Dividers now support rich Markdown descriptions in a premium, glassmorphic floating popover.
- **Smart Editor**: Includes a dedicated modal with real-time preview and **Smart Suggester** for internal links (`[[`) and tags (`#`).
- **Native Shortcuts & Toolbar**: The editor now supports **Ctrl+C / V / X** natively, along with a formatting toolbar and hotkeys (**Ctrl+B, I, K**) for rapid Markdown editing.
- **Improved Code Visibility**: Inline code and code blocks in popovers now feature distinct, high-contrast styling for better readability.
- **Contextual Organization**: Use dividers not just as lines, but as "section intros" for your project folders.

### 🎨 3. Enhanced Divider Customization
- **Icon Positioning**: Added granular control for divider icon placement (Left, Right, or Both).
- **Improved Alignment**: Refined vertical and horizontal centering for pixel-perfect layouts.

### 🔗 4. Notebook Navigator Restoration
- **Full Compatibility**: Completely re-engineered the **Notebook Navigator** integration.
- **Scoped Styling**: Specialized DOM selectors ensure NN items match the native Obsidian aesthetic.

### 🚀 5. Engine Hardening & Bug Fixes
- **Fixed: Double Icon Glitch**: Eliminated the redundant rendering where both native and custom icons appeared simultaneously by hardening the icon-swapping logic.
- **Fixed: Ghost White Icons**: Resolved a critical rendering issue where certain icons lost their details when colored.
- **Fixed: Live Color Sync**: The icon picker now updates colors *instantly* without requiring a re-click.
- **Fixed: Color Picker Jumps**: Standardized HSV synchronization logic to prevent the color thumb from jumping during adjustment.
- **Fixed: hubot Text Glitch**: Fixed a rendering bug where certain auto-icon matches would display the text "hubot" instead of an SVG icon by refining the Lucide variety list.
- **Hardened: Explicit Reset**: Improved "OFF" states to ensure the vault returns to a perfectly clean native look when features are disabled.

---

### 🎥 Feature Showcase
https://github.com/user-attachments/assets/17276285-a641-4d74-8ddc-a583bf9b7c5a

