# 📜 Version History - Colorful Folders

Keep track of the evolution of the Colorful Folders plugin. Each update brings better visualization, smarter automation, and improved vault performance.

---

## 🚀 Version 4.0.7 - The "Major Feature Debut" Release
This milestone release marks the official launch of modern organizational tools, introducing section dividers and a smart icon engine to the production branch.

### ➕ 1. New: Section Dividers
- **Vertical Organization**: For the first time, you can now add visual dividers to group your folders and files.
- **Dynamic Styling**: Choose from **Solid**, **Dashed**, or **Dotted** lines to create a clean visual hierarchy.
- **Glassmorphic Chip**: Dividers feature a premium, translucent pill-label that automatically blurs the background for a high-end aesthetic.
- **Icon Support**: Add any Lucide icon or emoji to your dividers for even faster navigation.

### 🤖 2. New: Smart Auto-Icon Engine
- **Automatic Folder Styling**: A brand new system that detects folder names and assigns perfect icons automatically.
- **10+ Launch Categories**: Out-of-the-box support for:
    - `Question` / `FAQ` -> ❓
    - `TV Series` / `Shows` -> 📺
    - `Quotes` / `References` -> 💬
    - `Templates` / `Layouts` -> 📝
    - `Drafts` / `WIP` -> 🚧
    - `Recent` / `History` -> 🕒
    - `Review` / `Feedback` -> 🔎
- **Diverse Matching & Variety**: High-priority regex patterns ensure higher icon hits, while the new **Icon Variety Mode** prevents repetitive icons by intelligently cycling through multiple variants for items in the same category.

### 🎨 3. Premium Production UI
- **Unified 18px Sizing**: Standardized all icons (Auto and Custom) to a professional **18px baseline** for perfect consistency.
- **Full Rebranding**: Launching officially as **"Colorful Folders"** with a streamlined, clutter-free settings interface.
- **Performance First**: Optimized the CSS engine to ensure zero lag, even while applying complex gradients and icons.

---

## 🚀 Version 4.0.6 - The "Precision & Maintenance" Update
Version 4.0.6 focuses on professional visual alignment, robust icon pack integration, and new maintenance tools for vault health.

### 📐 1. Professional Visual Alignment
- **Universal Middle-Alignment**: Standardized all icons (custom, auto, and default) to `vertical-align: middle` for perfect centering across all Obsidian themes and font sizes.
- **Smart Cache Invalidation**: The icon cache now intelligently clears when settings are saved, ensuring that changes to **Global Icon Scaling** are reflected instantly without a reload.

### 📦 2. Enhanced Iconify Importer
- **ViewBox & Offset Support**: Fixed the "Small Icon Clipping" bug. The importer now correctly handles `left`, `top`, `width`, and `height` properties from Iconify JSON packs.
- **Alias Preservation**: Properly imports aliases and transformations from icon packs, significantly expanding available icon variety.

### 🍱 3. New Built-in Icon Library
Version 4.0.6 now ships with **6 curated local icon sets** for instant, zero-latency styling. No internet connection required:
- **Material & FontAwesome**: Professional, globally recognized icons.
*   **Vibrant & System Essentials**: Packs specifically designed to match the plugin's rainbow aesthetic.
- **Community Core**: The most popular custom icons requested by power users.

### 🛠️ 4. Maintenance & Discovery
- **"Reset All Styling" Button**: New safety feature to clear all custom folder/file overrides and presets in one click.
- **"Clear Icon Library" Button**: Easily remove all imported icon packs if your library becomes cluttered.
- **Icon Debug Mode**: Exposed a toggle to log matching logic to the console, making it easy to see exactly why a folder chose a specific auto-icon.

### 📊 5. Adaptive Heatmap
- **Palette Sync**: Heatmap mode now uses your currently selected Color Palette instead of a hardcoded rainbow, keeping your vault's look perfectly unified.

---

## 🚀 Version 4.0.5 - The "Independence & Stability" Release

### 🎨 1. Independent Icon Styling
- **"Apply Icon Only" Mode**: Change icons and emojis without overriding your rainbow colors or custom tints. Icons are now fully decoupled from style inheritance.
- **Emoji Folder Support**: Fixed manual emoji assignment—folders now correctly display custom emojis alongside Lucide icons.

### 🧠 2. Smart Color Pre-filling
- **WYSIWYG Modal**: The custom style menu now automatically pre-fills with the *effective* colors currently visible in your vault, making customization effortless.
- **Dark Mode Sensitivity**: Intelligently handles dark-mode brightness adjustments when detecting colors.

### 🌈 3. Visual & Performance Polish
- **Restored Vibrancy**: Eliminated the "Double-Dimming" bug that made nested folders look faint.
- **Full Glassmorphism**: Restored backdrop blur support for subfolders.
- **Rainbow Compatibility**: Icons no longer disrupt the premium **Rainbow Root Text** gradient effect.
- **Streamlined Engine**: Removed 150+ lines of redundant CSS logic for a leaner, faster UI.

---

## 🚀 Version 4.0.0 - The Visual Intelligence & Performance Overhaul
- **Auto-Generated Lucide Icons**: 20+ Smart Categories for automatic organization.
- **Dynamic Item Counters**: Recursive statistics for folders and files.
- **Deep Notebook Navigator Support**: Native icon replacement and theme syncing.
- **Extreme Performance**: 250ms debounce and persistent icon caching.

---

## 🚀 Older Versions (3.x and below)
- **Individual File Styling & Typography**: Custom colors and icons for individual files.
- **Advanced Path Animations**: Breathe, Neon, and Shimmer effects for active documents.
- **Monochromatic Mode**: Depth-based shading for strictly organized vaults.
- **Outline Only Mode**: Minimalist visual style for professional environments.
