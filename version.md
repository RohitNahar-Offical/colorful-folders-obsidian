# Updates for Colorful Folders

## 🚀 5.0.6 - Outline & Sidebar Tag Pane Sync

This update brings **Outline Pane and Sidebar Tag Pane color synchronization**, introduces the **Flyweight CSS Pattern** for ultra-efficient stylesheet generation.

---

### 🏷️ 1. Colored Tags in the Sidebar
* **Tags Match Your Folders**: Tags in your sidebar Tag Pane now automatically match your folder colors or custom tag rules!
* **Glow & Badges**: Selected tags light up with a soft glow, and count badges adopt matching colored background pills.
* **Consistent Everywhere**: Your tag colors stay in sync across the sidebar, Live Preview, and Reading View.

### 📑 2. Outline (Table of Contents) & Heading Colors
* **Vibrant Outline View**: Your document outline table of contents now displays headings in beautiful colors from your active palette.
* **Colored Headings in Notes**: You can now colorize headings (H1 to H6) inside your notes to match your vault's color scheme.

---

## 🛠️ 5.0.5 - Animated Icon Scroll Recovery, Instant Cold-Start & Notebook Navigator Isolation

This update fixes **animated icons freezing after scrolling**, guarantees **instant icon loading on vault startup and reloads**, cleanly isolates **Notebook Navigator integration** to prevent startup lag, and adds **CodeQL security hardening**.

---

### 🎬 1. Live Animated Icon Scroll Recovery & Instant Startup
* **Continuous Scroll Playback**: Animated icons no longer freeze when scrolling through large file trees. An `IntersectionObserver` automatically restarts SMIL animation timelines cleanly from frame 0 when icons scroll back into view.
* **Instant Cold-Start Appearance**: Fixed animated icons failing to appear upon Obsidian startup or plugin reloads due to premature cache evaluation.
* **Custom Color Inheritance**: Custom icon colors are now cleanly passed to live animated SVGs via CSS custom properties (`--cf-animated-icon-color`).

### ⚡ 2. Notebook Navigator Isolation & Cold-Start Optimization
* **Clean Selector Isolation**: Decoupled Notebook Navigator integration styles and excluded virtual containers from divider observers to eliminate cold-start loading clashes.
* **Security Hardened**: Fully sanitized SVG DOM parsing and escaped CSS attribute selectors to resolve all CodeQL security alerts.

---
