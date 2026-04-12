![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.** Colorful Folders automatically applies premium color palettes and structural intelligence to your vault, making navigation intuitive and your workspace beautiful.

---

## ✨ What does it do?

Obsidian's default file explorer can feel cluttered as your vault grows. **Colorful Folders** solves this by:

1.  **Color-Coding Hierarchy**: Automatically assigns distinct, beautiful colors to your top-level and nested folders.
2.  **Visual Wayfinding**: Uses glowing connector lines to create a clear "breadcrumb trail" to your active file.
3.  **Cross-Platform Performance**: Built for zero-lag with a robust CSS engine that works identically on Windows, macOS, Linux, Android and iOS.

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

## 🚀 Version 4.0.2 - Optimized Factory Defaults
Version 4.0.2 hard-codes the user's preferred global configuration for all new installations, while keeping personal data private.

- **Global Baseline**: Hand-curated defaults for palette, opacity, and animations.
- **Privacy Mode**: Custom folder styles and personal presets were excluded from the source code.
- **Improved Performance**: Optimized settings initialization for a faster out-of-the-box experience.

---

## 🚀 Version 4.0.1 - The Reliability & Consistency Patch

## 🚀 Version 4.0.0 - The Visual Intelligence & Performance Overhaul

Version 4.0.0 is a milestone release that transforms the file explorer into a professional, high-fidelity visual dashboard.

### 📅 1. Auto-Generated Lucide Icons
- **20+ Smart Categories**: Automatically injects high-fidelity icons for common folder and file names (e.g., *Journal* -> 📅, *Finance* -> 💰, *Tech* -> 💻).
- **Universal Scope**: Icons are applied to both folders and files, dynamically tinted to match your chosen colors.
- **Wider, HD Rendering**: Replaces standard emojis with high-clarity SVGs for a modern, pro look.

### 📊 2. Dynamic Item Counters
- **Recursive Statistics**: Displays the total count of folders and files contained within each directory.
- **High-Visibility Design**: Uses a custom, combined SVG design with a sleek "folder-open" icon and plural "files" icon for maximum clarity.
- **Perfect Integration**: Counters are perfectly aligned at the right edge and inherit the exact hex color of their parent folder.

### 📱 3. Deep Notebook Navigator Support
- **Native Icon Replacement**: Automatically hides native icons and replaces them with premium, color-synced Lucide icons for a unified workspace.

### ⚡ 4. Extreme Performance & Pro Sizing
- **Unified 17px Standard**: All icons are professionally sized at 17px with 6px right-margins for perfect alignment.
- **Fluent UI**: Introduced a **250ms debounce** and an `iconCache` engine to ensure zero lag, even in very large vaults.

---

## 🚀 Version 3.5.8 - The "Polish & Purity" Update

### 🎨 1. Two Stunning New Color Palettes
- **Pastel Dreams**: Soft, relaxing, low-saturation hues for a clean minimalist look.
- **Neon Cyberpunk**: High-contrast, saturated glows for a striking, vibrant vault.

### ✨ 2. Subtle & Non-Distracting Animations
- **Animated Toggles**: Choose from **Smooth Breathe**, **Neon Flicker**, or **Color Shimmer** for your active path glow.
- **Duration Slider**: Control the speed of your vault's "heartbeat" from 0.5s to 10s.

### 🌈 3. Smart Rainbow Logic
- **Rainbow Root Text**: Override folder backgrounds without losing your text gradients.
- **Auto-Color Rainbow Files**: Files cycle independently through your palette for a full rainbow effect.

---

## 🚀 Version 3.5.0 - Individual File Styling & Typography

### 📁 1. Custom File Style
Right-click any **File** and select **"Set Custom File Style"** to override its color, icon, and text formatting.

### 🅱️ 2. Advanced Typography
Take full control of your folder and file titles:
- **Bold & Italic Toggles**: Make key projects stand out instantly.
- **Custom Text Color**: Override default theme colors for specific items.

### 🔄 3. Smart Inheritance
- **Apply to Subfolders**: Force a specific style down the entire folder tree.
- **Apply to Files**: Instantly style all files within a folder to match its aesthetic.

---

## 🎨 Core Customization
* **Monochromatic Mode**: Force subfolders to inherit their parent's color for a strictly organized look.
* **Outline Only Mode**: Minimalist? Remove background tints entirely and keep only the bright connecting lines and text.
* **Custom Palettes**: Enter your own comma-separated list of Hex codes to use your own brand colors.
* **Exclusion List**: Keep utility folders like `attachments` or `templates` looking standard.

---

## 🛠️ Installation

### 1. Via BRAT (Recommended & Fastest)
Using the **BRAT** (Beta Reviewer's Auto-update Tool) plugin is the fastest way to get the latest features and ensures the plugin stays updated automatically.

1.  Install the **BRAT** plugin from the Obsidian Community Plugins gallery.
2.  Go to **Settings** > **BRAT** > **Beta Plugin List**.
3.  Click **Add Beta plugin**.
4.  Paste the repository URL: `https://github.com/RohitNahar-Offical/colorful-folders-obsidian`
5.  Click **Add Plugin**.
6.  Enable **Colorful Folders** under **Community plugins**.

> [!TIP]
> **Why use BRAT?**
> Manual installations do not update automatically. Using BRAT ensures you stay up-to-date with the latest bug fixes and color presets the moment they are released.

---

## 💡 Pro Tip
You can access all these settings by going to **Settings > Colorful Folders**. Look for the large "💡 Pro Tip" banner at the top of the settings page for more hidden tricks, including custom overriding colors!

---

**Developed with ❤️ by [ROHIT-NAHAR](https://github.com/RohitNahar-Offical)**
