![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.**

Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you prefer a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace absolutely beautiful.

---
## What's New in Colorful Folders

## 🚀 5.0.7 — Smart Contrast, Palette Precision & Customizable Heatmaps

This update introduces a new **Auto contrast** section that lets your themes automatically pick readable text and icon colors, a redesigned **Custom colors** palette table with live previews and drag-to-reorder, and **editable heatmap age limits** so you control exactly how long a note stays a certain color. It also adds new row layout controls for Notebook Navigator and publishes extra information for theme makers.

---

### 🎨 1. Auto Contrast — Readable Text & Icons, Automatically

* **Automatic Readability**: When turned on, the plugin shifts folder colors so the text and icons always stand out against the background — no more squinting at low-contrast combinations.
* **Four Easy Controls**: A master switch lets you turn auto contrast on or off. Three sliders fine-tune it: how far colors shift, whether colors that run out of room snap to pure white or black, and how close to white or black a color has to be before snapping.
* **Per-Color Auto Toggle**: Each color in your palette has its own Auto checkbox. Turn it off for a specific color to pin its text and icon exactly where you want them.
* **Theme-Friendly**: The plugin now tells your active theme what contrast state it is in, so your theme can apply its own styling rules instead of the plugin guessing.

### 🖌️ 2. Custom Colors — A Smarter, More Flexible Palette Table

* **Live Color Previews**: See the exact text and icon color the plugin will use for each palette color, updated in real time as you adjust things.
* **Drag to Reorder**: Reorder your custom palette colors by dragging them up or down.
* **Delete Any Color**: Remove a color from your custom palette with a single click.
* **Per-Color Auto Checkbox**: Each row has its own Auto toggle, so you can mix automatic and hand-picked colors in the same palette.
* **Cleaner Layout**: The palette table and its description now live together in one neatly framed group, spaced nicely from the rest of your settings.

### 🌡️ 3. Heatmap Age Limits — You Control the Clock

* **Editable Age Bands**: In Heatmap mode, folders change color based on how recently their contents were edited. You can now type in your own five age limits (in days) instead of using the defaults.s
* **Applies to Every Palette**: Your custom age limits work across all palettes, not just the built-in ones.
* **Palette Age Column**: The palette table now shows an Age column that reflects the color generation mode you have selected, so everything stays in sync.

### 🧩 4. Notebook Navigator Row Layout Controls

* **Accent Border Width**: Adjust the colored left border on Notebook Navigator rows, or turn it off entirely.
* **Row Spacing**: Change the gap between rows in the Notebook Navigator list for a more compact or more spacious look.
* **Text Weight**: Make folder names in Notebook Navigator appear bolder or lighter to match your taste.
* **Border Radius**: Notebook Navigator rows now follow your chosen corner radius setting.

### 🔧 5. Behind the Scenes Improvements

* **Subfolder Opacity Published**: Themes can now read the subfolder opacity setting, so they can judge text contrast against what is actually painted on nested folder rows.
* **Per-Row Background Alpha**: Each colored row now reports how transparent its background is, giving themes an even better picture of what is on screen.
* **Hand-Picked Color Detection**: When you manually choose a text or icon color for a folder, the plugin now tells themes to stand back and let your choice win, instead of fighting it.
* **All Languages Updated**: Every setting label and description has been translated into all supported languages.
 
> *Note: This update includes contributions by **Retron** ([@retronified](https://github.com/retronified) on GitHub), with additional modifications and refinements by Rohit Nahar. Thank you, Retron, for your valuable contributions!*

---

# ✨ Core Features

### 🎨 Vivid Color & Visual Hierarchy

* **Color-Coding Hierarchy:** Automatically assigns beautiful, distinct colors to top-level and nested folders.
* **Auto Contrast Engine:** Dynamically calculates WCAG-compliant text and icon colors with custom shift steps and snap tolerance thresholds.
* **Palette Text & Icon Pairing:** Customize text and icon pairings for each palette hex color with live preview and drag-to-reorder table UI.
* **Editable Heatmap Age Bands:** Fine-tune 5 custom day thresholds for heatmap mode with $O(\log K)$ zero-allocation binary search.
* **Visual Wayfinding:** Glowing connector lines create a clear "breadcrumb trail" to your currently active file.
* **Smart Rainbow Logic & Text:** Cycle files through your palette, enable custom rainbow text gradients on individual items, or use the **Adaptive Heatmap** to sync colors.
* **Curated Palettes:** Premium built-in palettes (including Tailwind UI, Tailwind UI Dark, Cyberpunk, Nord, and Pastel).
* **Minimalist Modes:** Force subfolders to inherit parent colors, or use **Outline Only Mode** to remove background tints while keeping bright connecting lines.

### 🤖 Smart Iconography & Custom Packs

* **Live Animated Icons:** Real-time animated SVG icons in your sidebar that play smoothly without freezing while scrolling and inherit custom folder colors.
* **Smart Auto-Icons:** Automatically matches relevant icons to your folder and file names (e.g., *Journal* -> 📅, *Finance* -> 💰).
* **Manual Override Priority:** Pin your preferred icons on any item to permanently override automatic suggestions.
* **Custom & Offline Icon Packs:** Built-in offline libraries (Lucide, FontAwesome, Tabler, Material, Simple Icons) plus custom pack support via `.obsidian/icons`.
* **Open & Closed States:** Set distinct icons for expanded versus collapsed folders globally or per folder.
* **Pixel-Perfect Alignment:** All icons are automatically standardized and vertically centered with clean 18px baseline sizing.

### 📁 Advanced Customization & Typography

* **Right-Click WYSIWYG Menu:** Select **"Set Custom File Style"** on any item to easily override its color, icon, border radius, and text formatting.
* **Custom Border Radius:** Adjust border-radius per folder or file using a smooth range slider in the style modal.
* **Advanced Typography:** Make key projects pop with bold, italic, custom text colors, and rainbow gradients.
* **Smart Inheritance:** Force a specific style down an entire folder tree with a single click.

### 📐 Organization & Appearance Controls

* **Toggle Collapse Indicators:** Easily show or hide folder collapse arrows in the file explorer via settings.
* **Section Dividers:** Group files with vertical visual dividers supporting glassmorphic popovers and custom line styles.
* **Dynamic Item Counters:** Display recursive statistics showing total folder and file counts.
* **Exclusion Lists:** Keep utility directories (like `attachments` or `templates`) standard and unaffected.

### 🎨 Synchronization & Ecosystem

* **Tag Color Sync:** Automatically color tags matching styled folder names (e.g., styling "Work" styles `#Work`) across Reading Mode, Live Preview, and the Sidebar Tag Pane with luminous glow badges.
* **Colored Tags in Sidebar:** Tags in the sidebar Tag Pane match folder colors or custom tag rules with glowing pill counters and uniform styling.
* **Custom Tag Rules:** Manually map specific tags to any hex color or folder path (e.g., `garden/plant = #5ebd8e`).
* **Outline & Heading Sync:** Match the Outline Pane table of contents and in-note headings (H1–H6) to your active color palette with glow highlights.
* **Graph View Sync:** Folder colors sync directly into Obsidian's built-in Graph View as color groups.
* **Notebook Navigator Integration:** Cleanly isolated selector styles and virtual container exclusions ensure zero cold-start loading clashes with Notebook Navigator.

### 🕵️ Stealth & Privacy Engine

* **Visual Privacy:** Hide any file or folder from the sidebar instantly via context menu.
* **Ghost Mode:** Toggle semi-transparent viewing of hidden items with a sleek blur effect.
* **Password Protection:** Secure privacy settings with a custom modal.

### 🛡️ Stability & Performance Engine

* **Zero-DOM Engine:** High-performance `adoptedStyleSheets` engine with zero GPU lag, even in 10,000+ note vaults.
* **Security Hardened:** Fully sanitized SVG DOM parsing and escaped CSS attribute selectors for maximum vault safety.
* **Cross-Platform:** Flawless performance across Windows, macOS, Linux, Android, and iOS.
* **Strict Network Privacy:** 100% private offline styling engine with zero user data transmission.

---

## 🛠️ Installation

### Via Obsidian Community Plugins (Official & Recommended)

1. Open Obsidian and navigate to **Settings** > **[Community plugins](https://community.obsidian.md/plugins/colorful-folders)**.
2. Click **Browse** next to Community plugins.
3. Search for **[Colorful Folders](https://community.obsidian.md/plugins/colorful-folders)**.
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

* **[Master Documentation Index](docs/DOCUMENTATION_INDEX.md):** The entry point for all technical documentation and subsystem guides.
* **[Internal Engine Architecture](docs/architecture/ARCHITECTURE.md):** Deep dive into the Zero-DOM rendering pipeline and logic flow.
* **[Codebase Subsystems Guide](docs/architecture/CODEBASE_GUIDE.md):** Comprehensive guide to all source files and services.
* **[Customization Guide](docs/styling/CUSTOMIZATION.md):** Advanced CSS snippets and styling overrides.

---

**Developed with ❤️ by [ROHIT-NAHAR](https://github.com/RohitNahar-Offical)**
