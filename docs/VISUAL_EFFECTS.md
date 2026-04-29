# ✨ Visual Effects and Advanced Rendering

> [!NOTE]
> This document explains the "Eye Candy" logic—the advanced visual effects that make **Colorful Folders** feel premium.

---

## 1. Active Path Glow (Connecting Line)

The **Active Path Glow** is a dynamic line that visually connects the currently open file to its root parent.

### 🛠️ Implementation Logic:
1.  **Detection**: `main.ts` listens for `file-open`.
2.  **Path Resolution**: Iterates through all ancestors using `file.parent`.
3.  **Selector**: Targets `.nav-folder-title.is-active-path`.
4.  **Pseudo-Element**:
    ```css
    .nav-folder-title.is-active-path::after {
        content: ""; position: absolute;
        left: 10px; width: 2px;
        background: var(--interactive-accent);
        box-shadow: 0 0 8px var(--interactive-accent);
    }
    ```
5.  **Animation**: If enabled, `@keyframes cf-shimmer` creates a flowing light effect.

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
