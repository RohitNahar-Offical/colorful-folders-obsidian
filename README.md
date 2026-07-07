![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.**

Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you prefer a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace absolutely beautiful.

---

## 🚀 Latest: 4.2.0 - The "Advanced Features & Ultimate Performance" Update

This massive release brings powerful new customization options and resolves stubborn UI bugs for power users with huge vaults. [Read the Full Changelog](https://www.google.com/search?q=Version/VERSION_4_2_0.md)

### ⚡ Performance & Speed

* **Instant Startup:** Folder styles and settings load instantly the second you open your vault.
* **Smooth Scrolling:** A rewritten background styling engine ensures buttery smooth scrolling through thousands of folders with zero lag.
* **Smart Background Loading:** Custom icons load gently in the background (waiting 2 seconds after startup) to prevent app freezing.
* **Cached Colors:** Styles are calculated once and stored in memory, significantly reducing your CPU usage.

### 🎨 Synchronization & Ecosystem

* **Tag Color Sync:** Automatically color tags that perfectly match a styled folder's name (e.g., styling the folder "Work" styles `#Work`).
* **Custom Tag Rules:** Manually map specific tags to any styled folder path (e.g., `#todo = /Projects/Active`).
* **Graph View Sync:** Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups for a unified vault aesthetic.

### 🧩 Smart Icons & UI Enhancements

* **Regex Icon Matching:** Use powerful Regular Expressions to instantly match and auto-assign icons to multiple folders at once.
* **Local `.obsidian/icons` Support:** Automatically detects and parallel-loads SVG icons placed in your standard icons directory for near-instant startups.
* **Interactive Palette Builder:** A totally rewritten, side-by-side visual builder for custom hex palettes.
* **Visual Color Pickers:** Ditch raw hex codes. Use interactive sliders and swatch previews to build your aesthetic.
* **Debounced Saves:** A 300ms save delay prevents database lag and UI stutters when dragging color sliders.

---

## ✨ Core Features

### 🎨 Vivid Color & Visual Hierarchy

* **Color-Coding Hierarchy:** Automatically assigns beautiful, distinct colors to top-level and nested folders.
* **Visual Wayfinding:** Glowing connector lines create a clear "breadcrumb trail" to your currently active file.
* **Stunning Built-in Palettes:** Choose from preset themes like *Pastel Dreams* or *Tailwind UI*, or create your own brand-consistent hex palettes.
* **Smart Rainbow Logic:** Cycle files through your palette for a full rainbow effect, or use the **Adaptive Heatmap** to seamlessly sync with your chosen colors.
* **Minimalist Modes:** Force subfolders to inherit parent colors, or use **Outline Only Mode** to remove background tints while keeping bright connecting lines.

### 🤖 Smart Iconography

* **Auto-Icon Engine:** Automatically injects high-fidelity icons based on names (e.g., *Journal* -> 📅, *Finance* -> 💰).
* **6 Built-in Offline Libraries:** Includes Material, FontAwesome, and Vibrant packs for instant, zero-latency styling without internet.
* **Enhanced Iconify Support:** Import seamlessly with perfect alignment, alias preservation, and custom offsets.
* **Universal 18px Sizing:** All icons are standardized to a professional 18px baseline with perfect vertical centering.
* **Independent Styling:** Change icons and emojis without overriding your custom colors.

### 📁 Advanced Customization & Typography

* **Right-Click WYSIWYG Menu:** Select **"Set Custom File Style"** on any item to easily override its color, icon, and text formatting.
* **Context-Aware Styling:** The style modal pre-fills with currently visible colors and adapts to dark-mode brightness.
* **Advanced Typography:** Make key projects pop with bold, italic, and custom text color overrides.
* **Smart Inheritance:** Force a specific style down an entire folder tree with a single click.

### 📐 Organization & Spacing

* **Section Dividers:** Group files with vertical visual dividers. Supports Markdown glassmorphic popovers, asymmetrical spacing, and solid/dashed/dotted lines.
* **Dynamic Item Counters:** Display recursive statistics showing the total folder and file count inside a directory, perfectly color-matched.
* **Exclusion Lists:** Keep utility directories (like `attachments` or `templates`) standard and unaffected by plugin styling.

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

## 👨‍💻 Developer Documentation

Looking to understand the internal architecture, contribute features, or debug the styling engine? Check out our comprehensive technical guides:

* **[Developer Master Guide](https://www.google.com/search?q=DEVELOPER.md):** The entry point for all technical documentation.
* **[Internal Engine Architecture](https://www.google.com/search?q=docs/ARCHITECTURE.md):** Deep dive into the rendering pipeline and logic flow.
* **[API Reference](https://www.google.com/search?q=docs/API_REFERENCE.md):** Detailed class and method documentation.
* **[Customization Guide](https://www.google.com/search?q=docs/CUSTOMIZATION.md):** Advanced CSS snippets and styling overrides.

---

**Developed with ❤️ by [ROHIT-NAHAR**](https://github.com/RohitNahar-Offical)