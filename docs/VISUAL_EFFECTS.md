# ✨ Visual Effects and Advanced Rendering

> [!NOTE]
> This document explains the "Eye Candy" logic—the advanced visual effects that make **Colorful Folders** feel premium.

---

## 1. Radiant Path and Luminous Selection

The plugin features a two-part system to highlight the currently active file:

### 🌟 Luminous Selection (Default)
The file itself receives a permanent, premium highlight to ensure the user always knows what is active:
- **Glassmorphism**: `backdrop-filter: blur(8px)` with a subtle white gradient overlay.
- **Micro-Bevel**: An inset box-shadow creates a 3D sheen.
- **Status**: This is the default behavior and is independent of the Radiant Path settings.

### ⚡ Radiant Path (Connecting Trails)
A dynamic vertical trail that visually connects the currently open file to its root parent.
- **Implementation**: Injects a `2px` solid border on `.nav-folder-children` containers.
- **Stability**: The `2px` thickness is strictly standardized across all nested levels to prevent browser sub-pixel rendering glitches (the "thinning line" bug).
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
