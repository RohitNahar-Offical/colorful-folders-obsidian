# 🎨 Colorful Folders | Release Notes (v4.1.4)

> [!NOTE]
> This update focuses on **Visual Connectivity**, **UI Standardization**, and a massive **Documentation Overhaul** to satisfy the latest Obsidian plugin submission guidelines.

---

## ✨ New Features and Improvements

### 📏 Enhanced Divider Connectivity
- **Negative Line Gaps**: You can now set divider line gaps as low as **-10px**.
- **Flush Design**: This allows divider lines to visually intersect the central "pill" or icon background for a seamless, professional connection.
- **Z-Index Optimization**: Improved layering ensures that lines correctly tuck behind the divider chip when using negative offsets.

### 🎨 UI Standardization (Sentence Case)
- **Project-Wide Audit**: Completed a comprehensive audit of all UI text.
- **Compliance**: Every setting name, description, button label, and placeholder now strictly follows **Sentence Case** (e.g., "Add hover message" instead of "Add Hover Message").
- **Professionalism**: Replaced all ampersands (`&`) in section headers and settings with "and" for a cleaner, native Obsidian feel.

---

## 🏗️ Internal Architectural Changes

### 📖 Documentation Overhaul
- **Premium Styled Docs**: The entire developer documentation suite in `/docs` and `DEVELOPER.md` has been overhauled with premium styling, Mermaid.js diagrams, and technical callouts.
- **Architectural Clarity**: Added detailed guides for the **IconManager** sanitization engine, **DividerManager** reconciliation loop, and the dynamic changelog system.

### 🛠️ Maintenance and Security
- **Security Audit**: Formally documented the **DOM-based sanitization** engine that protects against XSS when importing custom SVGs.
- **Linting Rigor**: Implemented stricter linting rules to ensure 100% compliance with `eslint-plugin-obsidianmd`.

---

## 🔧 Bug Fixes
- Fixed a minor visual glitch where divider lines could overlap text in certain third-party themes.
- Improved the contrast calculation for very light backgrounds in "Glassmorphism" mode.

---

> [!TIP]
> Enjoy the new flush divider designs! You can find the gap settings in any section divider configuration or the global **Dividers and sections** settings card.
