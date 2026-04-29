# 🎨 Colorful Folders | Release Notes (v4.1.4)

> [!NOTE]
> Welcome to version **4.1.4**! This major update focuses on elevating the visual elegance of your vault through refined connectivity, unified styling, and powerful under-the-hood engine optimizations. 

---

## ✨ Design & Visual Upgrades

### 🌟 The New "Luminous" Default
We've completely decoupled the premium active file highlight from the Radiant Path settings.
- **Permanent Elegance**: The subtle glass highlight, dynamic white gradient overlay, and 3D micro-bevel sheen are now the permanent default styles for active files. 
- **Unified Aesthetics**: Your active files will always feel premium and tactile, even if you prefer to keep the connecting vertical trails turned off for a cleaner aesthetic.

### 📏 Flawless Divider Integration
Section dividers have been upgraded to support tighter, more cohesive layouts.
- **Negative Line Gaps**: You can now push divider lines inward using negative gaps (down to **-10px**).
- **Flush Intersections**: Achieve a seamless, professional look where the divider lines perfectly intersect your central pills or icon backgrounds.
- **Layering Precision**: Upgraded z-index management guarantees that intersecting lines tuck cleanly behind the divider chips.

### 🖋️ UI Text Standardization
We performed a massive project-wide audit to ensure the plugin feels like a native part of Obsidian.
- **Strict Sentence Case**: Every setting name, description, button, and placeholder has been unified to standard sentence casing (e.g., "Add hover message").
- **Polished Phrasing**: Replaced informal ampersands (`&`) with "and" across all section headers for maximum professionalism.

---

## 🚀 Engine Performance & Architecture

### ⚡ CSS Generation Micro-Optimizations
We conducted deep memory profiling of the `StyleGenerator` core to eliminate rendering bottlenecks during massive vault traversals.
- **Zero-Allocation Loops**: Complex variables and local helper functions have been hoisted completely out of recursive rendering loops.
- **The Result**: By preventing the allocation of tens of thousands of function closures per render, we've drastically reduced JavaScript garbage collection (GC) stutters, resulting in lightning-fast style updates even on vaults with 20,000+ files.

### 📖 Complete Documentation Overhaul
The developer documentation suite (in `/docs` and `DEVELOPER.md`) has been entirely rewritten to meet the latest Obsidian plugin submission standards.
- **Premium Structure**: Now featuring advanced Markdown styling, Mermaid.js architectural diagrams, and technical callouts.
- **Deep Dives**: Added comprehensive guides detailing the **IconManager** sanitization flow, the **DividerManager** virtual DOM reconciliation loop, and our dynamic release notes system.
- **Security Audit**: Formally documented the DOM-based sanitization engine that rigidly protects against XSS when processing custom SVGs.

---

## 🔧 Bug Fixes & Stability

- **Radiant Path Stability**: Standardized the glowing connecting trail to a strict `2px` thickness across all nested folder levels. This completely resolves the browser sub-pixel "thinning line" rendering glitch when selecting deeply nested files.
- **Theme Compatibility**: Fixed a z-index layout bug where divider lines could erroneously overlap folder text in certain third-party themes.
- **Glassmorphism Contrast**: Upgraded the dynamic contrast algorithm to better handle extremely bright backgrounds while Glassmorphism is enabled.

---

> [!TIP]
> **Try the new Luminous Selection!** Click around your vault to feel the new tactile, frosted-glass active file highlights.
