# Colorful Folders 4.0.5 - Stability & Independence 🚀

Version 4.0.5 delivers the highly requested "Independent Icon" system, alongside critical fixes for rendering vibrancy and state pre-filling.

## ✨ What's New in 4.0.5?

### 🎨 Independent Icon Styling
- **"Apply Icon Only" Button**: Added a dedicated button to the Custom Style modal's Icon tab. You can now change or add a folder icon/emoji without overriding your existing rainbow colors, text styles, or background tints. Perfectly decoupled.
- **Improved Emoji Support**: Fixed a bug where custom-assigned emojis were failing to render on folders. The engine now seamlessly handles both Lucide icons and colorful emojis for all folder types.

### 🧠 Smart Modal Pre-filling (WYSIWYG)
- **Live Color Detection**: The Custom Style modal now accurately pre-fills the Text Color, Icon Color, and Background Color pickers with the *calculated* colors currently shown in your vault. 
- **Predictive Brightness**: The pre-filling engine now understands dark-mode brightness adjustments and high-contrast solid root folder colors, providing a true "What You See Is What You Get" starting point for your customizations.
- **Hex/RGB Normalization**: Added a robust `anyToHex` utility to ensure that auto-calculated RGB colors are correctly converted to the Hex format required by the color pickers.

### 🌈 Visual Vibrancy Restoration
- **Stacked Folder Clarity**: Corrected a "Double-Dimming" bug where nested folders were appearing excessively faint. Subfolders now maintain their rich, intended color intensity relative to your root folders.
- **Rainbow Root Text Compatibility**: Fixed a logic error where adding an icon to a root folder would accidentally disable the premium **Rainbow Root Text** gradient effect. You can now enjoy both icons and vibrant text together.

### 🛠️ Core Engine Optimization
- **Single Source of Truth**: Removed over 150 lines of redundant, conflicting CSS generation code. This eliminates "styling flickering" and prevents custom file styles from overriding folder-level inheritance by mistake.
- **Enhanced Traverse Logic**: Unified the tree traversal and standalone file styling paths to ensure a perfectly stable and high-performance rendering experience across massive vaults.

---

Thank you for your fantastic feedback — 4.0.5 represents a major step forward in styling flexibility and visual polish.

