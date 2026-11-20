# Updates for Colorful Folders

## 🚀 5.1.0 — Icon Size & Coexistence Fixes

* **🎯 Fixed Static & Animated Icon Coexistence:** Fixed an issue where setting a static icon for the closed folder action and an animated icon for the open folder action (or vice versa) caused both icons to overlap. Scoped state-specific CSS suppression and structured target tracking ensure only the active icon renders cleanly with zero collision.
* **📐 Optical Sizing for Animated Icons:** Animated icons (such as Line-md) are now scaled optically by 1.15x to balance the embedded viewBox margins with standard static icons, ensuring all icons appear uniform and identical in visual size across your file tree.
* **⚡ Cold Start & Memory Optimizations:** Cold start and reload performance enhanced with O(1) high-frequency listener guards, prefix-based icon classification, and leak-free teardown routines.

---

## Full Changelog: https://github.com/RohitNahar-Offical/colorful-folders-obsidian/compare/5.0.9...5.1.0
