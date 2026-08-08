![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.**

Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you prefer a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace absolutely beautiful.

---

# Updates for Colorful Folders

## 🚀 4.2.8 - Folder Scope Hierarchy & High-Performance Color Engine

This release introduces **Folder Scope Hierarchy** in File Color Mode and delivers massive performance optimizations to hex color parsing, brightness resolution, tree depth scanning, and gradient generation algorithms.

### 🌲 Folder Scope Hierarchy (Tree Depth Level)
- **Tree Depth Level Matching**: Added `Folder Scope Hierarchy` option under **File Color Mode** (`fileColorMode = "folder_scope"`).
- **Exact Level Color Uniformity**: Both folders and notes sitting at the exact same depth in the file explorer tree receive identical colors (Tree Depth 0 = Color A, Tree Depth 1 = Color B, Tree Depth 2 = Color C).
- **Solves Level Mismatches**: Eliminates the visual mismatch of `"Match parent folder color"` where depth 2 notes were colored with depth 1 parent colors.

### ⚡ Zero-Allocation Depth Scanner & Bitwise Color Engine
- **$O(1)$ Memory Tree Depth Scanner**: Replaced `path.split('/')` string array allocations with zero-allocation character code scanning (`getFastPathSlashes`), eliminating garbage collection pauses across massive vaults.
- **Fast Bitwise Hex Parsing**: Replaced RegEx validation (`/^[a-f\d]{6}$/i`) and substring slicing in `hexToRgbObj` with fast-path nibble evaluation (`parseHexNibble`) and bitwise bit shifts (`(num >> 16) & 255`). Up to **10x faster** with 0 intermediate string allocations.
- **Numeric Brightness Transformations**: Introduced `adjustBrightnessValues` for pure numeric RGB channel manipulation using bitwise truncation (`| 0`). Eliminated `.split(',').map(...)` array allocations in `adjustBrightnessRgb` (**5x–8x faster**).
- **Direct Palette Shading**: Transformed light mode palette brightness scaling in `getCurrentPalette` to calculate hex strings directly from bitwise values without string array re-parsing (**4x faster**).

---

This release introduces control over folder collapse indicators:

### 🌟 New Features & Fixes
- **Individual Folder Border Radius**: Set a custom border-radius with a range slider for individual folders/files inside the **"Set Custom File Style"** context menu modal.

- **Toggle Collapse Indicators**: Added a new setting toggle **Show collapse indicator** under the "Appearance and visibility" section in settings to let you hide or show folder collapse arrows in the file explorer.

- **Custom Default Open/Closed Folder Icons**: You can now define custom global defaults for both closed and open folder icons directly in the settings. Additionally, you can override these icons individually for any folder via the **"Set Custom File Style"** context menu modal.

- **Centered Icon and Text Alignment**: Fine-tuned visual alignment to ensure folder/file explorer items, their custom icons, collapse chevrons, and text titles are perfectly centered vertically and look extremely polished.

- **Minor Fixes**: Fixed styling inconsistencies and optimized background settings.

---

## ✨ Core Features

### ⚡ Ultra-Performance & Smart Icon Engine

* **Smart Icon Manager:** Automatically detects and loads custom SVG icon packs dropped into `.obsidian/icons` with a blazingly fast parallel scanner and intelligent LRU/setting-aware caching.
* **Instant Load Times & Zero UI Freezing:** Optimized grouping engine calculates styles instantly. Background processing pauses gracefully during heavy tree walks so scrolling remains butter-smooth.
* **Ultra-Snappy Responsiveness:** 3x faster UI refresh rates for immediate visual feedback on setting or file changes, supported by a lightweight memory footprint.
* **AdoptedStyleSheet Engine:** Zero-DOM rendering using native `document.adoptedStyleSheets` for high speed and 100% immunity against third-party observer race conditions.

### 🎨 Vivid Color & Visual Hierarchy

* **Color-Coding Hierarchy:** Automatically assigns beautiful, distinct colors to top-level and nested folders.
* **Visual Wayfinding:** Glowing connector lines create a clear "breadcrumb trail" to your currently active file.
* **Smart Rainbow Logic & Rainbow Text:** Cycle files through your palette for a full rainbow effect, use **Adaptive Heatmap**, or enable custom rainbow gradient text on any file/folder via the context menu.
* **Minimalist & Opacity Modes:** Force subfolders to inherit parent colors, or use **Outline Only Mode** to remove background tints while keeping bright connecting lines. Accurate custom opacity defaults (50% folders, 15% files) maintain visual consistency.
* **Modern Palettes:** Built-in curated palettes including **Tailwind UI** and **Tailwind UI Dark**.

### 🤖 Smart Iconography

* **Auto-Icon Engine:** Automatically injects high-fidelity icons based on names (e.g., *Journal* -> 📅, *Finance* -> 💰).
* **6 Built-in Offline Libraries:** Includes Material, FontAwesome, and Vibrant packs for instant, zero-latency styling without internet.
* **Enhanced Iconify Support:** Import seamlessly with perfect alignment, alias preservation, and custom offsets.
* **Universal 18px Sizing:** All icons are standardized to a professional 18px baseline with perfect vertical centering.
* **Independent Styling:** Change icons and emojis without overriding your custom colors.

### 📁 Advanced Customization & Typography

* **Right-Click WYSIWYG Menu:** Select **"Set Custom File Style"** on any item to easily override its color, icon, and text formatting.
* **Individual Border Radius:** Set a custom border radius (in pixels) with an interactive range slider for individual folders or files inside the **"Set Custom File Style"** modal.
* **Context-Aware Styling:** The style modal pre-fills with currently visible colors and adapts to dark-mode brightness.
* **Advanced Typography:** Make key projects pop with bold, italic, and custom text color overrides.
* **Flawless Inheritance:** Force a specific style down an entire folder tree or file hierarchy with a single click.

### 📐 Organization & Spacing

* **Section Dividers:** Group files with vertical visual dividers. Supports Markdown glassmorphic popovers, asymmetrical spacing, and solid/dashed/dotted lines.
* **Dynamic Item Counters:** Display recursive statistics showing the total folder and file count inside a directory, perfectly color-matched.
* **Exclusion Lists:** Keep utility directories (like `attachments` or `templates`) standard and unaffected by plugin styling.

### 🎨 Synchronization & Ecosystem

* **Tag Color Sync:** Automatically color tags that perfectly match a styled folder's name (e.g., styling the folder "Work" styles `#Work`).
* **Custom Tag Rules:** Manually map specific tags to any styled folder path (e.g., `#todo = /Projects/Active`).
* **Graph View Sync:** Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups for a unified vault aesthetic.
* **Flawless Third-Party Integrations:** Fully synchronized compatibility with plugins like Notebook Navigator and Smart Connections.

### 🕵️ Stealth & Privacy Engine

* **Visual Privacy:** Hide any file or folder from the sidebar instantly via the context menu.
* **Ghost Mode:** Toggle semi-transparent viewing of hidden items with a sleek blur effect.
* **Password Protection:** Secure your privacy settings with a custom modal (featuring shake animations for invalid attempts).
* **Management Dashboard:** Manage all hidden items and recovery options from a dedicated settings card.

### 🛡️ Stability & Network Privacy

* **Cross-Platform Engine:** Zero-lag performance on Windows, macOS, Linux, Android, and iOS.
* **Static Premium Standards:** High-performance static visuals replace heavy animations to ensure absolutely zero GPU stutter.
* **Vault Maintenance Tools:** One-click buttons to reset styling or clear icon libraries, plus an Icon Debug Mode.
* **Strict Network Privacy:** Makes only **one** necessary network call to GitHub to fetch the changelog on updates. No user data is ever transmitted.

---

## 🛠️ Installation

### Via Obsidian Community Plugins (Official & Recommended)

1. Open Obsidian and navigate to **Settings** > **Community plugins**.
2. Click **Browse** next to Community plugins.
3. Search for **Colorful Folders**.
4. Click **Install**, then click **Enable**.

### Via BRAT (For Beta Releases)

*Want to test the absolute latest features before they hit the store?*

1. Install the **BRAT** plugin from the Obsidian Community gallery.
2. Go to **Settings** > **BRAT** > **Beta Plugin List**.
3. Click **Add Beta plugin**.
4. Paste the repository URL: `https://github.com/RohitNahar-Offical/colorful-folders-obsidian`
5. Click **Add Plugin**.
6. Enable **Colorful Folders** in your **Community plugins** tab.

---

## 💡 Pro Tip

Access all styling configurations by navigating to **Settings > Colorful Folders**. Look for the large **"💡 Pro Tip"** banner at the top of the settings page to discover hidden tricks, including how to set up custom overriding colors!

---

## 👨💻 Developer Documentation

Looking to understand the internal architecture, contribute features, or debug the styling engine? Check out our comprehensive technical guides:

* **[Developer Master Guide](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/DOCUMENTATION_INDEX.md):** The entry point for all technical documentation.
* **[Internal Engine Architecture](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/ARCHITECTURE.md):** Deep dive into the rendering pipeline and logic flow.
* **[API Reference](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/API_REFERENCE.md):** Detailed class and method documentation.
* **[Customization Guide](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CUSTOMIZATION.md):** Advanced CSS snippets and styling overrides.
* **[Localization Architecture](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/LOCALIZATION.md):** Complete guide to the i18n translation system.

---

**Developed with ❤️ by [ROHIT-NAHAR](https://github.com/RohitNahar-Offical)**
**Developed with ❤️ by [ROHIT-NAHAR**](https://github.com/RohitNahar-Offical)