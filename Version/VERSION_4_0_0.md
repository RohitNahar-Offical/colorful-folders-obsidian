# Colorful Folders 4.0.0 - The Visual Intelligence & Performance Overhaul 🚀

Version 4.0.0 is a milestone release that transforms the file explorer into a professional, high-fidelity visual dashboard. This update focuses on extreme performance, a completely reimagined styling modal, and deep, automated integration with your vault's structure.

## ✨ What's New in 4.0.0?

### ⚡ Extreme Performance (Debounced & Cached)
- **Fluid UI**: Introduced a **250ms debounce** to style regeneration. Obsidian no longer "stutters" during bulk file operations (moving/deleting hundreds of files).
- **Icon Caching**: Implemented a professional `iconCache` engine. Style regeneration is now up to **10x faster** in large vaults.

### 🎨 Reimagined Styling Modal
The "Set Custom Style" modal has been completely rebuilt:
- **Tabbed Interface**: Organized into **Appearance**, **Icon**, **Inheritance**, and **Presets** for a high-end workflow.
- **Live Preview Header**: See your changes (color, icon, text styling) update in real-time in a beautiful premium header.
- **Improved Context Menu**: Simplified the file explorer context menu with a new **"Set Custom Style" submenu**.

### 🔎 Integrated Lucide Icon Picker
- **Native Integration**: Browse and search all ~600 built-in Lucide icons directly within Obsidian.
- **Searchable Grid**: Quickly find the perfect icon with a fast, filtered search bar.
- **Click-to-Apply**: Instantly swap icons for any file or folder with a single click.

### 📅 Auto-Generated Lucide Icons
- **20+ Smart Categories**: Automatically injects high-fidelity icons for common folder and file names (e.g., *Journal* -> 📅, *Finance* -> 💰, *Tech* -> 💻).
- **Universal Scope**: Icons are applied to both folders and files, dynamically tinted to match your chosen colors.
- **Wider, HD Rendering**: Replaces standard emojis with high-clarity SVGs for a modern, pro look.

### 📊 Dynamic Item Counters
- **Recursive Statistics**: Displays the total count of folders and files contained within each directory.
- **High-Visibility Design**: Uses a custom, combined SVG design with a sleek "folder-open" icon and plural "files" icon for maximum clarity.
- **Perfect Integration**: Counters are perfectly aligned at the right edge and inherit the exact hex color of their parent folder.

### 📱 Notebook Navigator Compatibility
- **Deep Integration**: Explicitly supports the **"Notebook Navigator"** plugin.
- **Native Icon Replacement**: Automatically hides native icons and injects custom, color-synced Lucide icons for a unified workspace.

### 🛠️ Internal Refinements
- **Unified 17px Standards**: All icons are now professionally sized at 170px with 6px right-margins for perfect alignment.
- **Centralized Path Escaping**: Optimized CSS selector generation for absolute reliability.
- **Heatmap Optimization**: Faster activity scanning for activity-based coloring.

---

Thank you for being part of the Colorful Folders journey. Version 4.0.0 makes your Obsidian vault faster, more beautiful, and more powerful than ever before!
