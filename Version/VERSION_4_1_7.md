# ⚡ 4.1.7 - Mobile Responsiveness & Layout Refinements

This release introduces a cleaner desktop context menu layout with submenu grouping, robust mobile-responsive styling for the configuration interface, custom metadata wrapping options, shorthand hex resolution, and crucial event listener cleanup to prevent memory leaks.

### 📱 1. Responsive Settings Tab & Desktop Submenus
- **Mobile-First Layout**: Introduced a dedicated `@media (max-width: 600px)` style block to ensure the settings card grid, action buttons, tab bars, and premium popovers scale elegantly on smaller phone and tablet viewports.

- **Wrap Metadata Option**: Added a toggle to wrap file counts, word counts, and other plugin metadata (e.g., from *Novel Word Count* plugin) to the next line on desktop. (This remains automatically active on mobile).

### 🔧 2. Bug Fixes & Code Hardening
- **Shorthand Hex Support**: Restructured the hex parsing logic to safely recognize and expand 3-digit shorthand hex codes (e.g., `#fff` to `#ffffff`) without throwing TypeErrors.
- **Scroll Listener Cleanup**: Fixed a minor memory leak by properly removing the container scroll event listener during the cleanup phase.
- **CSS Linter Compliance**: Resolved a series of CSS warnings related to vendor-specific prefixes for masks, scrollbars, and unnecessary `!important` overrides.
