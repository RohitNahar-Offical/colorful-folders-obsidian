# Colorful Folders 4.0.3 - Bug Fixes & Focus Mode 🛠️

Version 4.0.3 delivers critical bug fixes that correct the core color rendering engine and improve Focus Mode reliability.

## ✨ What's New in 4.0.3?

### 🐛 Critical Bug Fixes

- **Custom Colors Now Actually Work**: Fixed a fundamental bug where custom hex colors set via right-click → "Set Custom Style" were silently ignored. The plugin was picking a random palette color instead of your chosen color. This affects both folders and files.
- **Custom File Colors Fixed**: Same fix applied to per-file custom styling — your picked hex is now always respected.
- **Added `hexToRgb()` Utility**: Introduced a proper internal hex-to-RGB converter so single hex values (e.g. `#eb6f92`) are always resolved correctly, instead of falling back to palette defaults.

### 🔆 Focus Mode (Dim Mode) — Complete Rewrite

- **Now Actually Works**: Rewrote the Focus Mode CSS from scratch using a reliable "dim everything, undim active path" strategy.
- **Smart Gating**: Dimming now only activates when a file is actually open — nothing gets dimmed in an idle vault.
- **Active Path Preserved**: The open file and all its parent folders remain at full brightness automatically.
- **Hover to Reveal**: Hovering any dimmed item temporarily restores it to full brightness.

### 🧹 UI & Settings Cleanup

- **Removed "Expanded Icon Variety" Toggle**: This option was redundant — all 20+ icon categories are now always active when Auto Icons is enabled. Cleaner settings panel.
- **Fixed Duplicate Settings Heading**: "Active Path & Typography" section header was appearing twice. Removed the duplicate.
- **Standalone File Styling Fixed**: Files with custom styles no longer render as solid opaque color blocks. They now correctly show a subtle tint overlay.
- **Border Accent Added**: Files with custom styles now also get a left-side accent border for visual consistency.

---

Thank you for your continued feedback — 4.0.3 is the most stable and correct release to date.
