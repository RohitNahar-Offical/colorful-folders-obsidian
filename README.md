![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

<a href="https://github.com/sponsors/RohitNahar-Offical">
  <img src="https://img.shields.io/badge/Sponsor-RohitNahar--Offical-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor RohitNahar-Offical" />
</a>

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.**

Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you prefer a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace absolutely beautiful.

---
## What's New in Colorful Folders

## 🚀 5.0.8 — Advanced Custom Icon Rules, Scope Autonomy & Performance Caching

This update introduces a major overhaul of the **Custom Icon Rules** system, giving you complete autonomy to target icon rules to **Folders only**, **Files only**, or **Both**, powered by a dedicated high-performance `IconRuleSet` engine with dual-bucket caching. It also resolves parent folder context leakage so child notes never inherit unwanted folder icons, restores folder palette colors in Hierarchy mode, and modernizes the rule builder with native Lucide icon dropdowns.

---

### 🎯 1. Target-Scoped Icon Rules — Folders, Files, or Both

* **Complete Autonomy**: When writing an icon rule, you can now explicitly choose its scope:
  - **📁 Folders**: Rules apply only to folders matching the pattern.
  - **📄 Files**: Rules apply only to files/notes matching the pattern.
  - **📁+📄 All**: Rules apply universally across both folders and files.
* **Native Lucide Scope Selector**: Replaced generic dropdowns with sleek native Obsidian buttons featuring clean Lucide vector icons (`folder`, `file-text`, `layers`) and active checkmarks.
* **Inline Syntax Support**: Easily serialize and edit scopes with the `::target` syntax (e.g. `work = lucide-briefcase @150 ::folders` or `draft = lucide-file-clock ::files`).
* **Visual Scope Help Guide**: An interactive in-settings guide breaks down exactly how scopes work, with real-world examples and matching rules.

### 🛡️ 2. Parent Folder Context Isolation (No More Folder Bleed)

* **Isolated Matching**: Custom rules now evaluate strictly against the item's own name (`itemContexts`), completely omitting parent directory ancestry.
* **Zero Child Contamination**: Defining a folder rule for `resource = lucide-folder ::folders` will now color only the `resource` folder itself. Child notes like `resource/notes.md` will no longer inherit the folder's icon.

### ⚡ 3. High-Performance `IconRuleSet` Engine & 2-Layer Caching

* **Dual-Bucket Fast-Paths**: Rules with exact names (no regex symbols) hit an $O(1)$ dictionary lookup instantly. Complex regular expressions are pre-compiled and sorted by priority descending.
* **Layer 2 Dedicated LRU Cache**: Evaluated patterns are memoized in an internal 2,048-entry LRU cache (`_lookupCache`), delivering sub-microsecond repeat lookups across identical file names (such as `index.md` or `README.md`) without regex parsing.
* **Self-Healing Cache Invalidation**: Modifying custom rules in settings automatically clears stale results and repaints the file tree instantly.

### 🎨 4. Restored Folder Hierarchy Colors & Polish

* **Hierarchy Mode Folder Color Fix**: Fixed an issue in Hierarchy level mode where folders without manual styling could fall back to neutral text colors (`var(--text-normal)`), appearing black or gray. The icon fallback chain now properly honors `color.hex` across all color generation modes.
* **All 8 Locales Updated**: Full translations added for rule scope selectors and helper guides across English, German, Spanish, French, Japanese, Slovak, Simplified Chinese, and Traditional Chinese.

---

# ✨ Core Features

### 🎨 Vivid Color & Visual Hierarchy

* **Color-Coding Hierarchy:** Automatically assigns beautiful, distinct colors to top-level and nested folders.
* **Auto Contrast Engine:** Dynamically calculates WCAG-compliant text and icon colors with custom shift steps and snap tolerance thresholds, ensuring optimal readability against any theme background while notifying active themes of contrast state.
* **Per-Color Auto Toggle:** Master auto contrast switch with individual Auto checkboxes per palette color, allowing you to mix automatic contrast with hand-pinned custom text and icon pairs.
* **Interactive Palette Table:** Modern palette configuration table featuring live previews of text and icon colors, drag-and-drop reordering, and one-click color deletion.
* **Customizable Heatmap Age Limits:** In Heatmap mode, configure custom age limit bands (in days) instead of relying on defaults. Applies across all palettes with synchronized table age columns and zero-heap $O(\log K)$ binary search.
* **Visual Wayfinding:** Glowing connector lines create a clear "breadcrumb trail" to your currently active file.
* **Smart Rainbow Logic & Text:** Cycle files through your palette, enable custom rainbow text gradients on individual items, or use the **Adaptive Heatmap** to sync colors.
* **Curated Palettes:** Premium built-in palettes (including Tailwind UI, Tailwind UI Dark, Cyberpunk, Nord, and Pastel).
* **Minimalist Modes:** Force subfolders to inherit parent colors, or use **Outline Only Mode** to remove background tints while keeping bright connecting lines.

### 🤖 Smart Iconography & Custom Packs

* **Target-Scoped Custom Rules:** Define custom regex or exact icon rules scoped strictly to Folders (`::folders`), Files (`::files`), or Both (`::all`) with custom priority weights.
* **Dual-Bucket `IconRuleSet` Engine:** $O(1)$ dictionary lookups for exact matches and priority-sorted regexes with 2,048-entry LRU caching and safe ReDoS limits.
* **Context-Isolated Item Matching:** Evaluates item names independently (`itemContexts`), ensuring folder rules never bleed into nested child notes.
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
* **Notebook Navigator Row Layout Controls:** Customize colored accent border widths, row spacing gaps, text font weight, and corner border-radius directly for Notebook Navigator rows.

### 🕵️ Stealth & Privacy Engine

* **Visual Privacy:** Hide any file or folder from the sidebar instantly via context menu.
* **Ghost Mode:** Toggle semi-transparent viewing of hidden items with a sleek blur effect.
* **Password Protection:** Secure privacy settings with a custom modal.

### 🛡️ Stability & Performance Engine

* **Zero-DOM Engine:** High-performance `adoptedStyleSheets` engine with zero GPU lag, even in 10,000+ note vaults.
* **Theme-Friendly CSS Variables:** Publishes `--cf-color`, `--cf-subfolder-opacity`, `--cf-bg-alpha`, and manual override states (`--cf-has-custom-text`, `--cf-has-custom-icon`) so community themes can inspect runtime styling and contrast without guesswork.
* **Multilingual Localization:** All settings, tooltips, and helper guides are fully translated across 8 languages (English, German, Spanish, French, Japanese, Slovak, Simplified Chinese, Traditional Chinese).
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
