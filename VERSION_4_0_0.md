# Colorful Folders 4.0.0 - The Performance & UI Overhaul 🚀

Version 4.0.0 is a milestone release focusing on extreme performance, a completely redesigned styling modal, and deep integration with Obsidian's native icon system.

## ✨ What's New in 4.0.0?

### ⚡ Extreme Performance (Debounced & Cached)
- **Fluid UI**: Introduced a **250ms debounce** to style regeneration. Obsidian No longer "stutters" during bulk file operations (moving/deleting hundreds of files).
- **Icon Caching**: Implemented a professional `iconCache` engine. Style regeneration is now up to **10x faster** in vaults with many custom icons.

### 🎨 Reimagined Styling Modal
The "Set Custom Style" modal has been completely rebuilt from the ground up:
- **Tabbed Interface**: Organized into **Appearance**, **Icon**, **Inheritance**, and **Presets** for a cleaner workflow.
- **Live Preview Header**: See your changes (color, icon, text styling) update in real-time in a beautiful premium header.
- **Improved Context Menu**: Simplified the file explorer context menu with a new **"Set Custom Style" submenu**.

### 🔎 Integrated Lucide Icon Picker
- **Native Integration**: Browse and search all ~600 built-in Lucide icons directly within Obsidian.
- **Searchable Grid**: Quickly find the perfect icon with a fast, filtered search bar.
- **Click-to-Apply**: Instantly swap icons for any file or folder with a single click.

### 🛠️ Internal Refinements
- **Centralized Path Escaping**: Optimized CSS selector generation for better reliability.
- **Heatmap Optimization**: Faster activity scanning for large vaults.
- **Memory Management**: Automatic cleanup of temporary styles during regeneration.

---

Thank you for being part of the Colorful Folders journey. Version 4.0.0 makes your Obsidian vault faster, more beautiful, and more powerful than ever before!
