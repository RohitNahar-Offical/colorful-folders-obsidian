# ✨ Visual Effects and Advanced Rendering

> [!NOTE]
> This document explains the "Eye Candy" logic—the advanced visual effects that make **Colorful Folders** feel premium.

---

## 0.1 The Structural Foundation
Before any visual effects (glows, paths, tints) are applied, the plugin enforces a rigid **Structural Grid** in `styles.css`. This ensures that "Eye Candy" doesn't lead to layout instability.
- **Strict 32px Verticality**: Every row in the explorer is locked to exactly 32px. This prevents the "shivering" effect when complex glows or icons are toggled.
- **Fixed-Width Icon Locking**: Collapse arrows and folder icons are pinned to a 20px flex-container. This prevents text from jumping horizontally when folders are expanded.

## 1. Radiant Path and Luminous Selection

The plugin features a two-part system to highlight the currently active file:

### 🌟 Luminous Selection (Default)
The file itself receives a permanent, premium highlight to ensure the user always knows what is active:
- **Glassmorphism**: `backdrop-filter: blur(8px)` with a subtle white gradient overlay.
- **Micro-Bevel**: An inset box-shadow creates a 3D sheen.
- **Status**: This is the default behavior and is independent of the Radiant Path settings.

### ⚡ Radiant Path (Connecting Trails)
A dynamic vertical trail that visually connects the currently open file to its root parent.
- **Stability**: The base thickness is user-defined (via `pathLineThickness` setting, Default: `2.0px`) and scales proportionately across folders and files to maintain visual hierarchy.
- **Proportional Scaling**: Icons and paths utilize independent scaling constants (e.g., 1.1em for Notebook Navigator cards vs 1.3em for the standard sidebar) to ensure visual balance across different UI layouts.
- **Performance Hardening**: All legacy path animations (Breathe, Neon, Shimmer) have been decommissioned in favor of zero-lag static standards. This ensures that massive folder structures can be scrolled without any GPU position-recalculation overhead.

---

## 2. Dynamic Contrast Engine

To prevent "unreadable text on bright backgrounds," we use a weighted luminance formula.

### 📐 The Formula:
`L = 0.2126 * R + 0.7152 * G + 0.0722 * B` (WCAG 2.0)

### 🧠 Logic Trace:
1.  Convert background `hex` to `RGB`.
2.  Calculate relative luminance `L`.
3.  **Bright BG** (`L > 0.5`): Force text **20% darker**.
4.  **Dark BG** (`L < 0.5`): Force text **30% lighter**.

---

## 3. Premium Popover Positioning

Divider popovers are full Markdown containers with smart positioning.

### 🧩 Logic Flow:
- **Markdown Rendering**: Uses `obsidian.MarkdownRenderer` to support `[[links]]` and `#tags`.
- **Horizontal**: If `chip.right + width > screen.width`, shift the popover left.
- **Vertical**: If space above is tight, flip the popover to render **below** the divider.
- **Hover Bridge**: 150ms delay on `mouseleave` to allow cursor travel to the popover.

---

## 4. Glassmorphism and Backdrop Filtering

Achieving the "Frosted Glass" look via `backdrop-filter`.

```css
.glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 5. Modern Pill Design

"Pills" provide structural separation between groups.

- **Bridge Layout**: Flexbox strategy with `flex-grow: 1` lines.
- **Asymmetrical Spacing**: Independent `Left`/`Right` padding allows for offset designs.
- **Connectivity**: Supports **negative gaps** (-10px) to let lines intersect the pill.
- **Inheritance**: Pills inherit parent folder color at **15% opacity** by default.

---

## 6. Sequential vs. Deterministic Coloring

- 🌈 **Sequential (Cycle)**: Uses the item's index in the list. Creates a rainbow flow.
- 🎯 **Deterministic (File Hashing)**: Uses `hashString(filename) % length`. Ensures a file keeps its color even when moved.

---

## 7. High-Visibility Metadata

Readability for essential meta (counts, tags, extensions).

> [!TIP]
> **Font Weight 900**: Metadata elements are explicitly set to maximum boldness to ensure they stand out in dense explorers.

- **Dual-Indicator Design**: Folder and file counts shown side-by-side.
- **Dynamic Tinting**: Synced to the folder's primary color.
---

## 8. Focus Mode 3.0 (Strict Spotlight)

A complete architectural redesign of the focus engine to maximize concentration without visual "mud."

- **Instant Contrast**: Replaces `blur()` and `transition` with sharp, instantaneous dimming. Non-active items are pushed into the background using a high-performance `brightness()` and `opacity` filter.
- **Strict Spotlight**: Only the **active file** and its **immediate parent folder** remain at full brightness. All deep ancestors (grandparents) are automatically dimmed to keep focus strictly on the current directory.
- **Spotlight Pulse**: The selected folder receives a `700` font-weight and a subtle inset `box-shadow` glow to make it look "powered on."
- **Interaction Model**: Every shift in focus is 100% instantaneous. There are zero interpolated animations between states, ensuring the sidebar never feels "mushy" or slow.

---

## 9. Native-Speed Drag Override

To prevent lag during file movement, the plugin enters a "High-Performance State" during drag operations.

- **Decoration Suspension**: Box-shadows, animations, and complex filters are instantly disabled.
- **Opacity Normalization**: All explorer elements are forced to `opacity: 1` to prevent browser transparency calculations.
- **Logic Freeze**: The JavaScript `MutationObserver` is fully disconnected during the drag to give 100% CPU priority to Obsidian's native drag-and-drop logic.

---

## 10. Native-Bridge Architecture (Notebook Navigator)

To ensure visual parity with third-party integrated views (like Notebook Navigator), the plugin utilizes a **"Native-Bridge" (Pure CSS)** rendering strategy.

- **The CSS Firewall**: Implements a strict exclusion layer using `:not()` selectors. This prevents standard explorer styles (like custom folder icons) from leaking into virtualized views, resolving the "Double Icon" glitch.
- **Decoupled Scaling**: Icons in integrated views use a dedicated **1.1em** scale constant, separate from the standard explorer's **1.3em**. This maintains visual balance across the different row heights of each view.
- **Fallback Icon System**: To ensure no item ever appears blank, the bridge implements a mandatory fallback. If an item lacks a manual or auto-assigned icon, it is automatically injected with a professional Lucide folder or file icon via a CSS mask.
- **Zero-Flicker Virtualization**: By using static CSS rules instead of JavaScript DOM manipulation, the bridge ensures that styles are applied at the browser's hardware-accelerated paint level, making it immune to React row-recycling lag.

---

## 11. Per-Folder Custom Rainbow Gradient Text

Each folder and file can have an **independent custom gradient text** applied from the **Set Custom Style** modal → **Text styling** section.

### 🎨 How it Works

The gradient is powered by the CSS `background-clip: text` technique, injected on the **text content child** element (`.nav-folder-title-content` / `.nav-file-title-content`) — **not** the row container. This is critical: placing `background-image` on the same element as `background-color` would prevent the clip from working.

```css
/* Folder: textCss injected on .nav-folder-title-content */
.nav-folder-title[data-path="..."] .nav-folder-title-content {
    background-image: linear-gradient(90deg, #start, #end, #start);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}

/* File: fileTextCss injected on .nav-file-title-content */
.nav-file-title[data-path="..."] .nav-file-title-content {
    background-image: linear-gradient(90deg, #start, #end, #start);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}
```

### ⚙️ FolderStyle Fields

| Field | Type | Description |
|:---|:---|:---|
| `textColor` | `string` | Start color of the gradient (hex) |
| `textGradientEnd` | `string` | End color of the gradient (hex) |
| `textGradient` | `boolean` | Enables the gradient; requires both `textColor` and `textGradientEnd` |
| `rainbowBrightness` | `number` | Adjusts brightness of both gradient colors (1–100, default 50) |

### 🔆 Brightness Adjustment Formula
```
amount = (brightness - 50) / 50
// e.g. brightness=75 → amount=0.5 (50% brighter)
// e.g. brightness=25 → amount=-0.5 (50% darker)
```

### 🖼️ Live Preview Bar
The **Color Picker Modal** shows a sticky mini-preview bar at the top (above the scrollable tabs) that renders the gradient text in real-time as colors and brightness are adjusted. The preview uses the **identical gradient formula** as `StyleGenerator.ts` to ensure pixel-perfect consistency between what you see in the modal and what appears in the file explorer.

> [!NOTE]
> The **Brightness** slider is only shown for root-level folders (depth 0), as these are the primary use case for the global rainbow root text effect. Child folders and files use the raw start/end colors directly.

