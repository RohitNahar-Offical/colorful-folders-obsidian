# 📜 Version History - Colorful Folders

Keep track of the evolution of the Colorful Folders plugin. Each update brings better visualization, smarter automation, and improved vault performance.

---

## 🚀 Version 4.0.7 - The "Production Stability" Release
This milestone release marks the official transition to the stable production branch with refined aesthetics and a smarter organization engine.

### 🤖 1. Smarter Auto-Icon Engine
- **10+ New Categories**: Automatically assigns high-quality icons for deeper organizational terms:
    - `Question` / `Help` / `FAQ` -> ❓
    - `TV Series` / `Episodes` / `Shows` -> 📺
    - `Quotes` / `References` -> 💬
    - `Templates` / `Layouts` -> 📝
    - `Drafts` / `WIP` / `Building` -> 🚧
    - `Recent` / `History` / `New` -> 🕒
    - `Review` / `Feedback` -> 🔎
- **Diverse Matching**: Improved regex patterns ensure more hits and higher icon variety across your vault.

### 🎨 2. Premium UI & Visibility
- **Standardized Pro Sizing**: All icons (Auto, Custom, and Default) are now locked to a professional **18px baseline** for perfect visual harmony.
- **Enhanced Dividers**: Increased thickness and opacity for **Dotted** and **Dashed** patterns to ensure they stand out across all themes.
- **Glassmorphism by Default**: New section dividers now ship with the modern **Glassmorphism** effect enabled out-of-the-box, providing a premium, blurred look immediately.

### 🧹 3. Production Cleanup
- **Full Rebranding**: Reverted all internal IDs and display names from "Colorful Folders (TS)" to the primary **"Colorful Folders"** brand.
- **Purged Non-functional Features**: Successfully removed the legacy "Show File Separator" feature and its associated UI settings, resulting in a leaner and more focused interface.
- **Cleaned Codebase**: Removed all redundant comments and internal debug logic to ensure maximum plugin stability.

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
