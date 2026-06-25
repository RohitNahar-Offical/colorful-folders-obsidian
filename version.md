# Updates for Colorful Folders

## ⚡ 4.1.8 - Performance Optimization & Refined Active State Engine
This release introduces major performance optimizations for large vaults, decoupling active selection styling from the dynamic stylesheet generation engine, debouncing folder icon refreshes, and refactoring integrations to prevent rendering overhead and input lag.

### 🚀 1. Active Selection Engine Refactor
- **Class-Based Dynamic Highlighting**: Decoupled active path highlighting from the main stylesheet generator. Instead of rebuilding and parsing a massive CSS string on every file selection event, the plugin now dynamically applies lightweight `.cf-active-parent` classes to the DOM, eliminating file-open input lag.
- **Notebook Navigator Integration**: Refactored the integration for the *Notebook Navigator* plugin to natively support and align with the new class-based dynamic highlight engine.

### ⚡ 2. Rendering Optimization & Debouncing
- **Icon Refresh Debouncing**: Added a 100ms debouncer to the icon refresh cycle to prevent layout thrashing and stuttering when expanding folders rapidly.
- **Startup & Event Optimization**: Optimized startup routines and file mutation handlers (create, delete, rename) to run on a debounced cycle, ensuring the main thread remains fully responsive during heavy vault operations.

---

## ⚡ 4.1.7 - Mobile Responsiveness & Layout Refinements
This release introduces a cleaner desktop context menu layout with submenu grouping, robust mobile-responsive styling for the configuration interface, custom metadata wrapping options, shorthand hex resolution, and crucial event listener cleanup to prevent memory leaks.

### 📱 1. Responsive Settings Tab & Desktop Submenus
- **Mobile-First Layout**: Introduced a dedicated `@media (max-width: 600px)` style block to ensure the settings card grid, action buttons, tab bars, and premium popovers scale elegantly on smaller phone and tablet viewports.

- **Wrap Metadata Option**: Added a toggle to wrap file counts, word counts, and other plugin metadata (e.g., from *Novel Word Count* plugin) to the next line on desktop. (This remains automatically active on mobile).

### 🔧 2. Bug Fixes & Code Hardening
- **Shorthand Hex Support**: Restructured the hex parsing logic to safely recognize and expand 3-digit shorthand hex codes (e.g., `#fff` to `#ffffff`) without throwing TypeErrors.
- **Scroll Listener Cleanup**: Fixed a minor memory leak by properly removing the container scroll event listener during the cleanup phase.
- **CSS Linter Compliance**: Resolved a series of CSS warnings related to vendor-specific prefixes for masks, scrollbars, and unnecessary `!important` overrides.

---
