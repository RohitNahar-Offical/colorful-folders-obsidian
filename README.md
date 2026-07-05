![Downloads](https://img.shields.io/github/downloads/RohitNahar-Offical/colorful-folders-obsidian/total?style=for-the-badge&logo=github&logoColor=white&color=0A66C2&label=Downloads)
# 🌈 Colorful Folders for Obsidian

**Transform your Obsidian file explorer from a dull list into a vibrant, organized, and high-performance visual dashboard.** Colorful Folders automatically applies premium color palettes, smart icons, and structural intelligence to your vault. Whether you want a strictly organized, monochromatic workspace or a neon-glowing cyberpunk aesthetic, this plugin makes navigation intuitive and your workspace beautiful.

---

## 🚀 Latest: 4.2.0 - The "Advanced Features & Ultimate Performance" Update
This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults. [Full Changelog](Version/VERSION_4_2_0.md)

### ⚡ 1. Perfect Scroll & Instant Startup
* **Instant Startup**: Optimized the plugin loading cycle. Folder styles and settings load instantly when you open your vault.
* **Smooth Sidebar Scrolling**: Rewrote the background styling engine. Scrolling through thousands of folders and files is now buttery smooth, with zero lag or stutter.
* **Smart Background Icon Loading**: Custom icons are now loaded gently in the background. The plugin waits 2 seconds after startup before scanning files, ensuring it never freezes your Obsidian app.
* **Cached Folder Colors**: Folder colors and styles are calculated once and stored in memory. The plugin doesn't need to recalculate them constantly, saving your device's CPU.

### 🏷️ 2. Tag Color Synchronization
* **Unify Your Vault**: Folder colors can now automatically synchronize with Obsidian tags!
* **Match Folders**: Automatically color tags that perfectly match a styled folder's name (e.g. styling the folder "Work" automatically styles `#Work`).
* **Custom Tag Rules**: Use the new Tag Sync Rules setting to map specific tags to any styled folder path manually (e.g. `#todo = /Projects/Active`).

### 🎨 3. Graph View Color Sync
* **Colorful Nodes**: Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups, giving you a perfectly unified aesthetic across your entire workspace.

### 🧩 4. Advanced Auto-Icon Builder & Local Packs
* **Regex Icon Matching**: The Custom Icon Rules engine now supports powerful Regular Expressions. Match multiple folders instantly using flexible patterns instead of strict names.
* **`.obsidian/icons` Support**: The plugin now automatically detects and loads any SVG icons placed in the standard `.obsidian/icons` directory! (Includes parallel loading for near-instant startups even with 1000+ icons).

### 🖌️ 5. Visual Settings Pickers & Interactive UI
* **Visual Global Backgrounds**: The global background setting now uses an interactive visual color picker instead of forcing you to type raw hex codes.
* **Interactive Palette Builder**: The Custom Hex Palette setting has been completely rewritten into a side-by-side interactive builder.
* **Swatch Previews**: See all your palette colors as real swatches, click them to open a side-panel visual color picker, and manage them effortlessly with new "Add Color" and "Reset to Default" buttons.
* **Smooth Performance (Debounced Saves)**: Added a 300ms save/build debouncer to prevent database lag and UI stutters when dragging visual color picker sliders.

---

## ✨ Core Features

### 🎨 Vivid Color & Visual Hierarchy

  * **Color-Coding Hierarchy:** Automatically assigns distinct, beautiful colors to your top-level and nested folders.
  * **Visual Wayfinding:** Uses glowing connector lines to create a clear "breadcrumb trail" to your currently active file.
  * **Stunning Built-in Palettes:** Choose from preset themes like soft *Pastel Dreams* or high-contrast *Neon Cyberpunk*, or enter your own comma-separated hex codes for brand consistency.
  * **Smart Rainbow Logic:** Cycle files independently through your palette for a full rainbow effect, or use the **Adaptive Heatmap** that seamlessly syncs with your chosen colors.
  * **Minimalist & Monochromatic Modes:** Force subfolders to inherit their parent's color for strict organization, or use **Outline Only Mode** to remove background tints entirely while keeping the bright connecting lines.

### 🤖 Smart Iconography

  * **Auto-Icon Engine:** Automatically detects folder and file names and injects high-fidelity Lucide/SVG icons based on categories (e.g., *Journal* -\> 📅, *Finance* -\> 💰, *Tech* -\> 💻).
  * **Built-in Offline Libraries:** Ships with 6 curated local icon sets (including Material, FontAwesome, and Vibrant packs) for instant, zero-latency styling without an internet connection.
  * **Enhanced Iconify Support:** Import seamlessly from Iconify with perfect alignment, alias preservation, and custom offset support.
  * **Independent Icon Styling:** Change icons and emojis without overriding your custom colors. Native icons are automatically replaced for a unified workspace.
  * **Universal 18px Sizing:** All icons are standardized to a professional 18px baseline with perfect vertical centering across all themes and font sizes.

### 📁 Advanced Customization & Typography

  * **Individual File/Folder Styling:** Right-click any item and select **"Set Custom File Style"** to override its color, icon, and text formatting.
  * **WYSIWYG Menu:** The custom style modal intelligently pre-fills with the exact colors currently visible in your vault, sensitive to dark-mode brightness.
  * **Advanced Typography:** Instantly make key projects stand out with bold and italic toggles, or custom text color overrides.
  * **Smart Inheritance:** Force a specific style down an entire folder tree or instantly style all files within a folder to match its aesthetic.

### 📐 Organization & Spacing

  * **Section dividers**: Add vertical visual dividers to group your files and folders. Includes **Markdown support** for rich descriptions in glassmorphic popovers and a dedicated smart editor. Features **asymmetrical spacing** (independent left/right gaps) and support for solid, dashed, or dotted lines.
  * **Dynamic item counters**: Display recursive statistics showing the total count of folders and files contained within a directory, color-matched to their parent folder.
  * **Exclusion Lists:** Keep utility directories like `attachments` or `templates` looking standard and unaffected by plugin styling.

### 🕵️ Stealth & Privacy Engine

  * **Visual Privacy:** Hide any file or folder from the sidebar with a single click via the context menu.
  * **Ghost Mode:** Toggle semi-transparent viewing of hidden items with a sleek blur effect.
  * **Password Protection:** Secure your privacy settings with a custom Password Modal featuring shake animations for invalid attempts.
  * **Management Dashboard:** A new "Privacy & stealth" card in settings to manage all hidden items and recovery options.

### ⚡ Performance & Visual Stability
  * **Cross-Platform Engine**: Built for zero-lag performance with a robust CSS engine that works identically on Windows, macOS, Linux, Android, and iOS.
  * **Static Premium Standards**: All animations have been decommissioned in favor of hardcoded, high-performance static visual standards (e.g., Luminous Selection) to ensure zero GPU stutter.
  * **Vault Maintenance Tools**: Includes one-click buttons to "Reset All Styling" or "Clear Icon Library", plus an Icon Debug Mode to track exactly how auto-icons are being applied.

### 🌐 Network Usage & Privacy

  * **External Requests**: Colorful Folders makes exactly **one necessary network call** to `raw.githubusercontent.com` to fetch the changelog file (`version.md`) when the plugin is updated to a new version. This call is only performed to display update notes, does not transmit any user or vault data, and requires no authentication.

-----

## 🛠️ Installation

### Via Obsidian Community Plugins (Official & Recommended)
**Colorful Folders is now officially available in the Obsidian Community Plugins gallery!**

1. Open Obsidian and navigate to **Settings** > **Community plugins**.
2. Click **Browse** next to Community plugins.
3. Search for **Colorful Folders**.
4. Click **Install**, then click **Enable**.

---

### Via BRAT (For Beta Releases)
If you would like to test the absolute latest beta features, presets, and updates before they hit the main store, you can use BRAT:

1.  Install the **BRAT** plugin from the Obsidian Community Plugins gallery.
2.  Go to **Settings** \> **BRAT** \> **Beta Plugin List**.
3.  Click **Add Beta plugin**.
4.  Paste the repository URL: `https://github.com/RohitNahar-Offical/colorful-folders-obsidian`
5.  Click **Add Plugin**.
6.  Enable **Colorful Folders** under your **Community plugins** tab.

-----

## 💡 Pro Tip

You can access all styling configurations by navigating to **Settings \> Colorful Folders**. Look for the large "💡 Pro Tip" banner at the top of the settings page for hidden tricks, including how to set up custom overriding colors\!

-----

---

## 👨‍💻 Developer Documentation

If you are a developer looking to understand the internal architecture, contribute features, or debug the styling engine, please refer to our comprehensive technical guides:

*   **[Developer Master Guide](DEVELOPER.md)**: The entry point for all technical documentation.
*   **[Internal Engine Architecture](docs/ARCHITECTURE.md)**: Deep dive into the rendering pipeline and logic flow.
*   **[API Reference](docs/API_REFERENCE.md)**: Detailed class and method documentation.
*   **[Customization Guide](docs/CUSTOMIZATION.md)**: Advanced CSS snippets and styling overrides.

---

**Developed with ❤️ by [ROHIT-NAHAR](https://github.com/RohitNahar-Offical)**
