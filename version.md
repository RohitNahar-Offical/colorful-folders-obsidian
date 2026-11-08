# Updates for Colorful Folders

## 🚀 5.0.8 — Smarter Icon Rules, Matching Modes & Speed Boost

This update makes **Custom Icon Rules** much easier and more flexible to use. You can now choose whether an icon rule applies to **Folders only**, **Files only**, or **Both**, and pick exact matching modes like **Contains**, **Exact match**, **Starts with**, or **Ends with** without writing complicated regex. Folder rules will no longer accidentally spill over to files inside that folder, the Active Rules table features a clean, pixel-perfect layout, folder colors have been restored in Hierarchy mode, and icon matching is faster than ever.

---

### 🎯 1. Choose Where Icons Apply — Folders, Files, or Both

* **Full Control Over Rules**: You can now choose exactly where each custom icon appears:
  - **📁 Folders**: The icon only shows on folders that match your rule.
  - **📄 Files**: The icon only shows on notes and files that match your rule.
  - **📁+📄 All**: The icon shows on both folders and files.
* **Easy One-Click Picker**: Click the scope button next to any rule to open a neat popup menu with folder and file icons to switch between them instantly.
* **Inline Syntax Support**: Easily type or edit scopes in rule text with the `::target` syntax (e.g. `work = lucide-briefcase @100 ::folders` or `draft = lucide-file-clock ::files`).
* **Helpful Built-In Guide**: A friendly guide box right below your rules in Settings explains how each option works with clear examples.

---

### 🔍 2. Choose How Rules Match — Contains, Exact, Starts With, Ends With & Regex

You no longer have to write complex regular expressions just to match an exact word or prefix! Every rule now has a dedicated matching mode selector:

* **🔍 Contains (Default)**: Matches if the name contains the word anywhere.
  - *Example*: `work` matches `my-work-notes`, `work`, and `homework`.
* **＝ Exact match**: Matches only when the item name equals the word exactly.
  - *Example*: `work` matches the `work` folder, but will **not** accidentally match `homework`, `network`, or `workout`.
* **⇤ Starts with**: Matches notes or folders that begin with that word.
  - *Example*: `Daily` matches `Daily 2026-11-08` and `Daily Review`. Perfect for daily journals and recurring logs!
* **⇥ Ends with**: Matches notes or folders that end with that word.
  - *Example*: `backup` matches `vault-backup` and `system-backup`.
* **.* Regex pattern**: For advanced power users who want full regular expression control (e.g. `^v\d+` for version folders). Slashed patterns like `/^v\d+/` and flags are automatically handled.
* **One-Click Dropdown**: Switch matching modes with one click in the Settings table.
* **Inline Syntax**: You can also write rules with `::mode` directly in text, e.g. `work = lucide-briefcase @100 ::folders ::exact` or combined `::folders:exact`.

---

### 🎨 3. Restored Folder Hierarchy Colors & Polish

* **Vibrant Folder Colors Restored**: Fixed an issue where folders could turn plain black or gray in "Hierarchy level" coloring mode. Folders now always shine with their proper palette colors.


---

## Full Changelog: https://github.com/RohitNahar-Offical/colorful-folders-obsidian/compare/5.0.7...5.0.8

---

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

## What's Changed
* Palette text/icon pairing, `--cf-color` variable, and in-order heatmap for short palettes by @retronified in https://github.com/RohitNahar-Offical/colorful-folders-obsidian/pull/32

## New Contributors
* @retronified made their first contribution in https://github.com/RohitNahar-Offical/colorful-folders-obsidian/pull/32

**Full Changelog**: https://github.com/RohitNahar-Offical/colorful-folders-obsidian/compare/5.0.6...5.0.7

---
