# Updates for Colorful Folders

## 🚀 4.2.0 - The "Advanced Features & Ultimate Performance" Update
This massive release brings powerful new customization options and resolves one of the most stubborn UI bugs for power users with huge vaults.

### ⚡ 1. Perfect Scroll & Instant Startup
- **Instant Obsidian Startup**: Refactored the core settings loading and local icon fetching (using parallel `Promise.all` logic) to completely eliminate startup delays. Reloading the plugin or opening Obsidian is now significantly faster, even with hundreds of SVGs.
- **Zero Scroll Lag**: We completely rewrote the icon injection engine. Rapidly scrolling through hundreds of folders in the virtualized list is now perfectly smooth with zero layout thrashing or CPU spikes.

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