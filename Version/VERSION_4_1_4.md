# 🎨 Colorful Folders | Release Notes (v4.1.4)

> [!NOTE]
> Welcome to version **4.1.4**! This update focuses on elevating the visual elegance of your vault through refined connectivity, unified styling, and powerful under-the-hood engine optimizations. 

---

## ✨ Design & Visual Upgrades for Active Files Paths 

### 🌟 The New "Luminous" Default
We've completely decoupled the premium active file highlight from the Radiant Path settings.
- **Permanent Elegance**: The subtle glass highlight, dynamic white gradient overlay, and 3D micro-bevel sheen are now the permanent default styles for active files. 
- **Unified Aesthetics**: Your active files will always feel premium and tactile, even if you prefer to keep the connecting vertical trails turned off for a cleaner aesthetic.

### 📏 Flawless Divider Integration
Section dividers have been upgraded to support tighter, more cohesive layouts.
- **Negative Line Gaps**: You can now push divider lines inward using negative gaps (down to **-10px**).

---

## 🚀 Engine Performance & Architecture

- **The Result**: By preventing the allocation of tens of thousands of function closures per render, we've drastically reduced JavaScript garbage collection (GC) stutters, resulting in lightning-fast style updates even on vaults with 20,000+ files.

## 🛡️ Hardening & Optimization: Animation Removal

To ensure maximum performance and visual stability, we have **completely decommissioned the legacy animation engine**.
- **Static Perfection**: All looping `@keyframes` (Breathe, Neon, Shimmer) have been replaced with high-performance static visual standards.
- **Luminous Selection**: The "Active File" highlight is now hardcoded to the premium frosted-glass standard, eliminating the overhead of constant background position recalculations.
- **Leaner Codebase**: Pruned redundant settings and logic branches, resulting in a significantly smaller and more stable `StyleGenerator`.

## 🔧 Bug Fixes & Stability

- **Radiant Path Stability**: Standardized the glowing connecting trail to a strict `2px` thickness across all nested folder levels. This completely resolves the browser sub-pixel "thinning line" rendering glitch when selecting deeply nested files.
- **Theme Compatibility**: Fixed a z-index layout bug where divider lines could erroneously overlap folder text in certain third-party themes.
- **Glassmorphism Contrast**: Upgraded the dynamic contrast algorithm to better handle extremely bright backgrounds while Glassmorphism is enabled.

---

> [!TIP]
> **Try the new Luminous Selection!** Click around your vault to feel the new tactile, frosted-glass active file highlights.
