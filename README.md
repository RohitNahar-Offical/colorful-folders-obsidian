![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.**

Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you prefer a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace absolutely beautiful.

---
# What's New in Colorful Folders

## 🚀 5.0.4 - Live Animated Icons, Locked-In Choices & Speed Optimization

---
### 🎬 1. Live Animated Icons (Moving Sidebar Icons)
* **Smooth Motion in Your Sidebar**: Bring your vault to life with animated SVG icons that play real-time animations right in your File Explorer sidebar.
* **Live Picker Previews**: Browse and preview animated icons in real-time inside the icon picker and color modal before applying them.
* **Zero Lag & Battery-Friendly**: Runs smoothly with dedicated, isolated DOM rendering and zero battery drain.

### 👑 2. Your Chosen Icons Always Stay Locked In
* **Your Choices Come First**: Explicit manual icon selections always win. Automatic keyword matches will never overwrite or hijack your chosen icon.
* **Color Changes Won't Reset Icons**: Adjusting background colors, text colors, or folder names preserves your custom icon permanently.
* **Frontmatter Control**: Adding `icon: ...` in note frontmatter/properties guarantees instant display.

### ⚡ 3. Memory Optimization & Faster Performance
* **Ultra-Low Memory Footprint**: Smarter bounded caching keeps memory usage minimal, ensuring butter-smooth scrolling even in vaults with 10,000+ notes.
* **Dead-Path Garbage Collection**: Deleting notes or folders immediately purges internal cache data to prevent memory accumulation.

### 🧹 4. Complete Library Clean & Hard Reset
* **One-Click Library Wipe**: Clicking **"Clear icon library"** completely purges all downloaded packs and custom imports from disk and memory.
* **Red Danger Buttons**: Destructive actions (*Factory reset*, *Reset styles*, *Clear icon library*) are styled in clear red.

### 📱 5. Responsive Settings on Small Windows
* **No More Cut-Off Tabs**: Settings tabs (*General*, *Features*, *Icons*, *AI*, *Privacy*) automatically wrap onto multiple lines when the window is narrow.

---

## ✨ Core Features

### 🎨 Vivid Color & Visual Hierarchy

* **Color-Coding Hierarchy:** Automatically assigns beautiful, distinct colors to top-level and nested folders.
* **Visual Wayfinding:** Glowing connector lines create a clear "breadcrumb trail" to your currently active file.
* **Smart Rainbow Logic & Text:** Cycle files through your palette, enable custom rainbow text gradients on individual items, or use the **Adaptive Heatmap** to sync colors.
* **Curated Palettes:** Premium built-in palettes (including Tailwind UI, Tailwind UI Dark, Cyberpunk, Nord, and Pastel).
* **Minimalist Modes:** Force subfolders to inherit parent colors, or use **Outline Only Mode** to remove background tints while keeping bright connecting lines.

### 🤖 Smart Iconography & Custom Packs

* **Live Animated Icons:** Full support for animated SVG icons that play real-time animations directly in your File Explorer sidebar.
* **Auto-Icon Engine:** Automatically injects high-fidelity icons based on item names (e.g., *Journal* -> 📅, *Finance* -> 💰).
* **Locked-In Manual Priority:** Explicit manual icon choices permanently override auto-icons and title predictions.
* **Local Icon Pack Support:** Drop any custom SVG icon pack into `.obsidian/icons` or `.obsidian/plugins/colorful-folders/icons` for instant offline loading.
* **Custom Open/Closed Icons:** Define custom global defaults or per-item overrides for open and closed folder states.
* **Built-in Offline Libraries:** Includes Material, FontAwesome, Lucide, Tabler, Simple Icons, and Vibrant packs for instant offline rendering.
* **Universal 18px Sizing:** All icons are standardized to a professional 18px baseline with perfect vertical centering.

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

* **Tag Color Sync:** Automatically color tags matching styled folder names (e.g., styling "Work" styles `#Work`).
* **Custom Tag Rules:** Manually map specific tags to any styled folder path (e.g., `#todo = /Projects/Active`).
* **Graph View Sync:** Folder colors sync directly into Obsidian's built-in Graph View as color groups.
* **Notebook Navigator Integration:** Seamless style synchronization with Notebook Navigator.

### 🕵️ Stealth & Privacy Engine

* **Visual Privacy:** Hide any file or folder from the sidebar instantly via context menu.
* **Ghost Mode:** Toggle semi-transparent viewing of hidden items with a sleek blur effect.
* **Password Protection:** Secure privacy settings with a custom modal.

### 🛡️ Stability & Performance Engine

* **Zero-DOM Engine:** High-performance `adoptedStyleSheets` engine with zero GPU lag, even in 10,000+ note vaults.
* **Cross-Platform:** Flawless performance across Windows, macOS, Linux, Android, and iOS.
* **Strict Network Privacy:** 100% private offline styling engine with zero user data transmission.

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

* **[Master Documentation Index](docs/DOCUMENTATION_INDEX.md):** The entry point for all technical documentation and subsystem guides.
* **[Internal Engine Architecture](docs/architecture/ARCHITECTURE.md):** Deep dive into the Zero-DOM rendering pipeline and logic flow.
* **[Codebase Subsystems Guide](docs/architecture/CODEBASE_GUIDE.md):** Comprehensive guide to all source files and services.
* **[Customization Guide](docs/styling/CUSTOMIZATION.md):** Advanced CSS snippets and styling overrides.

---

**Developed with ❤️ by [ROHIT-NAHAR](https://github.com/RohitNahar-Offical)**