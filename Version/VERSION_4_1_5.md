# ⚡ 4.1.5 - The "Stability & Customization" Update

This release delivers a comprehensive architectural cleanup and introduces advanced customization options for active workspace elements, prioritizing high-performance rendering and visual consistency.

### 📐 1. Radiant Path Stabilization
- **Thickness Standardization**: We have standardized all Radiant Path lines (side and bottom accents) to a robust **2.5px** thickness. This ensures a bold, high-end look across all themes.
- **Eliminated "Thinning" Glitches**: Resolved a long-standing sub-pixel rendering issue where borders would appear inconsistently thin (1px) depending on folder selection states.
- **Bottom Shelf Restoration**: Fixed a visual regression where horizontal bottom borders were missing on certain active path segments. Every parent path now features a complete, solid frame.

### 🎨 2. Active Item Appearance Engine
- **Custom Selection Colors**: Under the new "Active item appearance" card in settings, you can now explicitly override your theme's default selection colors.
- **Independent Control**: Set custom hex or RGBA values for both the **Active Background** and **Active Text Color**. This ensures your current file is always perfectly legible, even with the most vibrant palettes.
- **Luminous Priority**: These custom overrides utilize high-specificity CSS to ensure they remain dominant over theme-level selection rules.

### 🚀 3. The "Instant UI" Performance Model
- **Zero-Animation Mandate**: We have purged expensive CSS transitions from the File Explorer's core rendering logic. The UI now updates with **absolute zero latency**, providing a sharp, responsive experience that feels instantaneous.
- **GPU Optimization**: Internal CSS rules have been optimized to reduce layout thrashing, ensuring 60fps scrolling performance even in vaults with thousands of folders.

### 🛠️ 4. Engine Hardening & Cleanup
- **Architectural Cleanup**: Performed a deep-clean of the styling engine, removing experimental isolation strategies to focus on a rock-solid core experience.
- **Notebook Navigator Bridge**: Refined the integration with Notebook Navigator to ensure perfectly synchronized row heights and icon alignment across both views.
- **Type Safety**: Fully hardened the settings schema and internal state management for better plugin stability and future-proofing.
