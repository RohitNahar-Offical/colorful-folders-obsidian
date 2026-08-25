# Updates for Colorful Folders

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

## 🛠️ 5.0.4 - Live Animated Icons, Locked-In Custom Choices, Faster Performance & Clean Resets

This update brings **moving animated icons** right into your sidebar, ensures your **manually chosen icons always stay locked in**, keeps the plugin **fast and lightweight**, and makes **resetting and cleaning settings reliable**.

---

### 🎬 1. Live Animated Icons
* **Moving Icons in Your Sidebar**: You can now use animated SVG icons that play smooth animations right next to your folders and files in the sidebar!
* **Live Previews in the Icon Picker**: When browsing icons in the icon picker or color modal, animated icons will animate in real-time so you can see how they move before picking them.
* **Smooth & Battery-Friendly**: Animations run smoothly without slowing down your vault or draining battery.

### 👑 2. Your Chosen Icons Always Stay Locked In
* **Your Choices Come First**: When you manually pick an icon for a folder or note, the plugin will never change it or overwrite it with an automatic guess.
* **Color Changes Won't Reset Icons**: Changing a folder's background color or text color will safely keep your chosen icon intact.
* **Frontmatter Control**: If you write `icon: ...` in a note's properties/frontmatter, that icon is guaranteed to show.

### ⚡ 3. Faster Performance & Lower Memory Usage
* **Lighter on Memory**: Improved how icons and styles are stored in the background, keeping Obsidian fast and snappy even if you have thousands of notes.
* **Automatic Vault Cleanup**: Deleting notes or folders immediately cleans up internal cache data so no unused memory is wasted over time.

### 🧹 4. Reliable "Clean & Reset" Tools
* **Complete Library Wipe**: Clicking **"Clear icon library"** in Settings now fully removes all downloaded icon packs and custom icons from both memory and disk.
* **Red Warning Buttons**: Danger buttons (like *Factory reset*, *Reset styles*, and *Clear icon library*) are now styled in clear red so you can easily spot them.

### 📱 5. Better Settings for Small Windows
* **No More Cut-Off Tabs**: When the Obsidian window is narrow or small, the settings tabs (*General*, *Features*, *Icons*, *AI*, *Privacy*) automatically wrap onto multiple lines so every tab is easy to click.

---

## 🛠️ 5.0.3 - Architecture Modularization, Native Selector Optimization & Documentation

This release modularizes core plugin architecture (introducing dedicated service classes), optimizes CSS selector resolution using native `data-path` attributes, enhances event tracking and hidden state detection, and updates complete project documentation.

---

### 🏗️ 1. Architecture Modularization & Modular Core
* **Dedicated Service Classes**: Modularized plugin codebase by extracting `BaseCssGenerator`, `EventTrackerService`, and `LRUCache` into decoupled core modules.
* **Streamlined Plugin Entry**: Refactored `main.ts` entry point to delegate style generation and lifecycle tracking cleanly to specialized sub-services.

### ⚡ 2. Native `data-path` Selector Optimization
* **Native Selector Resolution**: Replaced custom `data-cf-path` attributes with native `data-path` selectors across `BaseCssGenerator` and `StyleGenerator`.
* **Reduced CSS Payload**: Direct `data-path` attribute targeting eliminates duplicate attribute injection and reduces overall stylesheet payload size.

### 🔍 3. Refined Event Tracking & Folder Note Detection
* **Explicit Hidden State Handling**: Updated `EventTrackerService` to track explicit hidden state toggles accurately.
* **Escaped Selector Specificity**: Improved parent path style calculations with escaped path rules for folder notes and nested structures.

### 📚 4. Reorganized Documentation & Project Index
* **Hierarchical Rules & Specs**: Reorganized technical documentation into categorized subdirectories (architecture, governance, integrations, rules, styling) with an updated master index.

---