# 🌈 Colorful Folders for Obsidian

**Transform your Obsidian file explorer from a plain text list into a vibrant, organized, and fast visual dashboard.**

Colorful Folders automatically applies curated color palettes, smart icons, and visual hierarchy to your vault. Whether you want a clean, minimalist workspace or a neon cyberpunk look, this plugin makes finding your notes intuitive and your workspace effortless to scan.

---

## 🚀 Latest Update: v5.0.9 — New Animated Icon Pack & Smoother Performance

* **✨ New "Line icons (Animated)" Pack:** Install 1,200+ smooth animated icons directly from **Settings > Icon Settings**, and set their priority so they take precedence when auto-matching.

* **⚡ Stutter-Free Scrolling:** Enjoy 60+ FPS scrolling in your file explorer with zero lag, even in massive vaults.
* **🎯 Smarter Icon Pack Priorities:** Fixed pack priority ranking so your preferred icon sets strictly take precedence for auto-matching and category rules.


---

## ✨ Core Features

### 🎨 Vivid Colors & Visual Hierarchy

* **Automatic Folder Coloring:** Assign distinct colors to top-level and nested folders using three modes:
* *Cycle:* Rotates sequentially through your active color palette.
* *Hierarchy Level:* Colors folders based on their nesting depth, keeping full palette colors vibrant across every level.
* *Adaptive Heatmap:* Colors items dynamically based on file age.


* **Custom Heatmap Age Limits:** Set your own age bands (in days) for Heatmap mode instead of relying on defaults, backed by synchronized table columns and fast binary search ($O(\log K)$).
* **Curated & Custom Palettes:** Choose from built-in themes (Tailwind UI, Tailwind UI Dark, Cyberpunk, Nord, Pastel) or build your own using an interactive table with live text/icon previews, drag-and-drop reordering, and one-click deletion.
* **Auto Contrast Engine:** Automatically calculates readable, WCAG-compliant text and icon colors against any Obsidian theme using custom shift steps and snap tolerances—complete with per-color checkboxes so you can mix auto-contrast with hand-picked colors.
* **Minimalist & Icon-Only Modes:**
* *Subfolder Inheritance:* Force child folders to match their parent folder's color.
* *Outline Only Mode:* Remove background tints while keeping bright connecting lines.
* *Icon-Only & Files-Only Modes:* Color only the icons and collapse arrows (or only file text) while keeping folder icons and collapse chevrons fully colored with their palette colors.


* **Visual Wayfinding & Rainbow Text:** Highlight your path to the active note with glowing connector lines, or apply custom rainbow text gradients to standout items.

---

### 🤖 Smart Icons & Custom Rules

* **Simple Custom Icon Rules:** Create custom rules using a clean grid builder with dropdowns for **Scope** (Folders, Files, or All—keeping folder icons isolated from nested notes), **Matching Mode**, **Lucide Icon Picker**, and **Priority Weight** (works seamlessly across all supported languages):
* **Plain-English Matching Modes (No Regex Required):** Match names using **Contains** (e.g., `meeting` matches `Team Meeting Notes`), **Exact match** (`Inbox` matches only `Inbox`), **Starts with** (`Daily` matches `Daily 2026-11-08`), **Ends with** (`Template` matches `Meeting Template`), or **Regex** (with a built-in cheat sheet for patterns like dates `^\d{4}-\d{2}-\d{2}` or numbered folders `01 Projects`).


* **Smart Auto-Icons & Overrides:** Automatically assigns relevant icons based on names (e.g., *Journal* → 📅, *Finance* → 💰, plus `.canvas` and `.excalidraw` support), while letting you pin manual icons to permanently override suggestions.
* **Open & Closed Folder States:** Set different icons for expanded versus collapsed folders globally or per folder.
* **Built-In, Animated & Custom Icon Packs:** Includes offline libraries (Lucide, FontAwesome, Tabler, Material, Simple Icons, Line icons, Line icons Animated, Bootstrap, Remix, Feather, Emoji), supports custom packs via `.obsidian/icons`, and lets you drag-and-drop pack priority order.
* **Standardized Alignment:** Every icon is automatically sized to an 18px baseline and vertically centered.

---

### 📁 Per-Item Styling & Layout Controls

* **Right-Click Style Menu:** Select **"Set Custom File Style"** on any file or folder to customize its color, icon, corner border-radius (via a range slider), and typography (bold, italic, custom text color, or rainbow gradient).
* **One-Click Tree Inheritance:** Push a folder's custom style down to everything inside it with a single click.
* **Organization Tools:**
* *Section Dividers:* Group files using vertical dividers with custom line styles and glassmorphic popovers.
* *Dynamic Item Counters:* Show recursive folder and file counts right next to folder names.
* *Collapse Indicators & Exclusions:* Show or hide folder collapse arrows, and exclude utility folders (like `attachments` or `templates`) from styling.



---

### 🔗 Vault-Wide Sync & Ecosystem

* **Tag Color Sync:** Tags in Reading Mode, Live Preview, and the Sidebar Tag Pane automatically match styled folder names (e.g., styling a "Work" folder styles `#Work` with luminous glow badges and pill counters) or custom tag rules (e.g., `garden/plant = #5ebd8e`).
* **Outline & Heading Sync:** Sync your active color palette and glow highlights to the Outline Pane table of contents and in-note headings (`H1–H6`).
* **Graph View Sync:** Automatically pushes folder colors into Obsidian's Graph View as color groups.
* **Notebook Navigator Support:** Runs cleanly alongside the Notebook Navigator plugin without loading conflicts, and lets you customize row accent border widths, row spacing gaps, font weights, and corner radius.

---

### 🕵️ Privacy, Speed & Reliability

* **Stealth & Privacy Controls:** Hide sensitive files or folders from the sidebar via the right-click menu, preview them semi-transparently with a blur effect using **Ghost Mode**, and lock privacy settings behind a password modal.
* **Zero-DOM Performance Engine:** Built on `adoptedStyleSheets` with $O(1)$ lookups, 2,048-entry LRU caching, and safe ReDoS limits—delivering zero GPU lag and 60+ FPS scrolling even in 10,000+ note vaults.
* **Theme-Friendly & Standards Compliant:** Uses standard CSS masks (`mask-image` and `-webkit-mask-*`) and exposes CSS variables (`--cf-color`, `--cf-subfolder-opacity`, `--cf-bg-alpha`, `--cf-has-custom-text`, `--cf-has-custom-icon`) so community themes can adapt automatically.
* **Cross-Platform & Multilingual:** Works seamlessly on Windows, macOS, Linux, Android, and iOS, with full translations in 8 languages (English, German, Spanish, French, Japanese, Slovak, Simplified Chinese, Traditional Chinese).
* **100% Offline & Secure:** Zero data is ever sent over the network, and all SVG parsing and CSS selectors are sanitized for vault safety.

---

## 🛠️ Installation

### Via Obsidian Community Plugins (Recommended)

1. Open Obsidian and go to **Settings > [Community plugins**](https://community.obsidian.md/plugins/colorful-folders).
2. Click **Browse**, then search for **[Colorful Folders](https://community.obsidian.md/plugins/colorful-folders)**.
3. Click **Install**, then **Enable**.

### Via BRAT (Beta Releases)

1. Install the **BRAT** plugin from the Obsidian Community gallery.
2. Go to **Settings > BRAT > Beta Plugin List** and click **Add Beta plugin**.
3. Paste `[https://github.com/RohitNahar-Offical/colorful-folders-obsidian](https://github.com/RohitNahar-Offical/colorful-folders-obsidian)` and click **Add Plugin**.
4. Enable **Colorful Folders** under **Settings > Community plugins**.

---

## 💡 Pro Tip

Open **Settings > Colorful Folders** and check the **"💡 Pro Tip"** banner at the top of the settings page for hidden shortcuts, including how to set up custom color overrides.

---

## 👨‍💻 Developer Documentation

Want to explore the architecture, contribute, or write custom CSS snippets? Check out the technical guides:

* **[Master Documentation Index](https://www.google.com/search?q=docs/DOCUMENTATION_INDEX.md):** Entry point for all technical documentation and subsystem guides.
* **[Internal Engine Architecture](https://www.google.com/search?q=docs/architecture/ARCHITECTURE.md):** Deep dive into the Zero-DOM rendering pipeline and logic flow.
* **[Codebase Subsystems Guide](https://www.google.com/search?q=docs/architecture/CODEBASE_GUIDE.md):** Guide to all source files and services.
* **[Customization Guide](https://www.google.com/search?q=docs/styling/CUSTOMIZATION.md):** Advanced CSS snippets and styling overrides.

---

**Developed with ❤️ by [ROHIT-NAHAR**](https://github.com/RohitNahar-Offical)