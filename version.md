# Updates for Colorful Folders

## 🚀 4.2.0 - The "Advanced Features & Ultimate Performance" Update
This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults.

### ⚡ 1. Perfect Scroll & Instant Startup
- **Instant Startup**: Optimized the plugin loading cycle. Folder styles and settings load instantly when you open your vault.
- **Smooth Sidebar Scrolling**: Rewrote the background styling engine. Scrolling through thousands of folders and files is now buttery smooth, with zero lag or stutter.
- **Smart Background Icon Loading**: Custom icons are now loaded gently in the background. The plugin waits 2 seconds after startup before scanning files, ensuring it never freezes your Obsidian app.
- **Cached Folder Colors**: Folder colors and styles are calculated once and stored in memory. The plugin doesn't need to recalculate them constantly, saving your device's CPU.

### 🏷️ 2. Tag Color Synchronization
- **Unify Your Vault**: Folder colors can now automatically synchronize with Obsidian tags!
- **Match Folders**: Automatically color tags that perfectly match a styled folder's name (e.g. styling the folder "Work" automatically styles `#Work`).
- **Custom Tag Rules**: Use the new Tag Sync Rules setting to map specific tags to any styled folder path manually (e.g. `#todo = /Projects/Active`).

### 🎨 3. Graph View Color Sync
- **Colorful Nodes**: Your beautiful folder colors now sync directly into Obsidian's built-in Graph View as color groups, giving you a perfectly unified aesthetic across your entire workspace.

### 🧩 4. Advanced Auto-Icon Builder & Local Packs
- **Regex Icon Matching**: The Custom Icon Rules engine now supports powerful Regular Expressions. Match multiple folders instantly using flexible patterns instead of strict names.
- **`.obsidian/icons` Support**: The plugin now automatically detects and loads any SVG icons placed in the standard `.obsidian/icons` directory! (Includes parallel loading for near-instant startups even with 1000+ icons).

---