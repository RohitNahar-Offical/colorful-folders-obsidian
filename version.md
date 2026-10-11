# Updates for Colorful Folders

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

* **Editable Age Bands**: In Heatmap mode, folders change color based on how recently their contents were edited. You can now type in your own five age limits (in days) instead of using the defaults.
* **Applies to Every Palette**: Your custom age limits work across all palettes, not just the built-in ones.
* **Palette Age Column**: The palette table now shows an Age column that reflects the color generation mode you have selected, so everything stays in sync.

### 🧩 4. Notebook Navigator Row Layout & Icon Controls

* **Accent Border Width**: Adjust the colored left border on Notebook Navigator rows, or turn it off entirely.
* **Row Spacing**: Change the gap between rows in the Notebook Navigator list for a more compact or more spacious look.
* **Text Weight**: Make folder names in Notebook Navigator appear bolder or lighter to match your taste.
* **Border Radius**: Notebook Navigator rows now follow your chosen corner radius setting.

> [!TIP]
> **To show file icons in the Notebook Navigator pane**: Open **Notebook Navigator Settings** → Navigate to **File display** → Under the **Icon** section, make sure **Show file icons** and **Icons by file type** are enabled. You can also customize your preferred icon pack via **File icon preset** or add custom rules under **File type icon map**.

### 🔧 5. Behind the Scenes & High-Performance Improvements

* **Pre-Normalized $O(1)$ Palette Lookups**: Custom text and icon pairs are pre-indexed into a normalized map upfront, eliminating thousands of runtime string allocations and object lookups during style generation.
* **$O(\log K)$ Binary Search for Heatmaps**: Heatmap age bands are now calculated via an upper-bound binary search with zero heap allocations, keeping tree traversal instant even in large vaults.
* **In-Place Settings Table Updates**: Toggling auto contrast or editing color pairs in settings updates cells in-place without tearing down or rebuilding the entire table DOM.
* **Subfolder Opacity Published**: Themes can now read the subfolder opacity setting, so they can judge text contrast against what is actually painted on nested folder rows.
* **Per-Row Background Alpha**: Each colored row now reports how transparent its background is, giving themes an even better picture of what is on screen.
* **Robust Icon Repository Caching & Normalization**: Icon asset resolution and DOM sanitization passes now utilize internal SVG template caching and pre-normalized aspect ratios to deliver instant icon modal rendering with zero layout shifts.
* **All Languages Updated**: Every setting label and description has been translated into all supported languages.

> *Note: This update includes contributions by **Retron** ([@retronified](https://github.com/retronified) on GitHub), with additional modifications and refinements by Rohit Nahar. Thank you, Retron, for your valuable contributions!*

---

## 🚀 5.0.6 - Colored Tags & Outline Sync, Silky-Smooth Scrolling & Instant Note Opening

This update brings **full color matching to your Tags sidebar and Outline table of contents**, lets you **color headings inside your notes**, eliminates **scrolling lag in the file list**, and makes **notes open instantly without delays**.

---

### 🏷️ 1. Colored Tags in the Sidebar
* **Tags Match Your Folders**: Tags in your sidebar Tag Pane now automatically match your folder colors or custom tag rules!
* **Glow & Badges**: Selected tags now light up with a soft glow, and the note count badges next to each tag get a matching colored background.
* **Consistent Everywhere**: Your tag colors now stay in sync across the sidebar, Live Preview, and Reading View.
* **Instant Loading**: Folder colors are applied right away without any extra scanning or slowdowns.

---

### 📑 2. Outline (Table of Contents) & Heading Colors
* **Vibrant Outline View**: Your document outline (Table of Contents) now displays headings in beautiful colors from your active palette.
* **Colored Headings in Notes**: You can now colorize headings (H1 to H6) inside your notes so your content matches your vault's look and feel.
* **Lightweight & Battery-Friendly**: Built to use almost no extra memory or battery, keeping Obsidian quick and responsive.

---

### ⚡ 3. Silky-Smooth Scrolling & Instant Note Opening
* **Lag-Free File List**: Fixed scrolling lag and stutter in the file explorer—scrolling through large vaults is now buttery smooth.
* **Instant Note Opening**: Notes now open instantly when clicked, with zero hesitation or freeze.
* **Clean Staircase Alignment**: Nested subfolders stay neat, beautifully aligned, and easy to read.

---

### ✨ Summary of Features Added
* **Tag Pane Sync**: Enable in *Settings → Features → Tag Color Sync*.
* **Outline Sync**: Enable in *Settings → Features → Outline & Heading Sync*.
* **Heading Sync**: Color H1–H6 in your notes via *Settings → Features → Color in-note headings*.
* **Performance Boost**: Vault scrolling and note switching are faster and smoother than ever!