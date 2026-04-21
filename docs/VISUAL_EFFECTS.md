# ✨ Visual Effects & Advanced Rendering

This document explains the "Eye Candy" logic—the advanced visual effects that make Colorful Folders feel premium.

## 1. Active Path Glow (The Connecting Line)

The **Active Path Glow** is a dynamic line that visually connects the currently open file to its root parent in the explorer.

### Implementation Logic:
1.  **Detection**: `main.ts` listens for the `file-open` event.
2.  **Path Resolution**: It iterates through all parents of the active file using `file.parent`.
3.  **Selector Generation**: For each ancestor folder, we generate a CSS rule that targets `.nav-folder-title.is-active-path`.
4.  **Pseudo-Element Injection**:
    ```css
    .nav-folder-title.is-active-path::after {
        content: "";
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--interactive-accent);
        box-shadow: 0 0 8px var(--interactive-accent);
    }
    ```
5.  **Animation**: If `animateActivePath` is enabled, we apply `@keyframes cf-shimmer` to this pseudo-element, creating a flowing light effect.

---

## 2. Dynamic Contrast Engine

To prevent "unreadable text on bright backgrounds," we use a weighted luminance formula.

### The Formula:
Based on the **WCAG 2.0** relative luminance formula:
`L = 0.2126 * R + 0.7152 * G + 0.0722 * B`

### Logic Trace:
1.  Convert the background `hex` to `RGB`.
2.  Normalize values to `0-1`.
3.  Calculate `L`.
4.  If `L > 0.5` (Bright background), we force the text to be **20% darker** than the primary color.
5.  If `L < 0.5` (Dark background), we force it to be **30% lighter**.

This ensures the plugin is usable even with extreme custom palettes (e.g., "Neon Cyberpunk").

---

## 3. Premium Popover Positioning

The `DividerManager` popovers aren't simple tooltips; they are full Markdown containers.

### Smart Overflow Logic:
When a popover is shown:
1.  We measure the `rect` of the divider chip.
2.  We measure the `window.innerWidth`.
3.  If `chip.right + popoverWidth > window.innerWidth`, we flip the popover to the **left** of the chip.
4.  This prevents the "Clipping Bug" common in simpler Obsidian plugins.

---

## 4. Glassmorphism & Backdrop Filtering

We use the `backdrop-filter` CSS property to achieve the "Frosted Glass" look.

### The Stack:
```css
.glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px) saturate(150%);
    -webkit-backdrop-filter: blur(12px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```
*Note: We apply a fallback background color for older Electron versions that do not support backdrop-filter.*

---

## 5. Sequential vs. Deterministic Coloring

*   **Sequential (Cycle)**: Uses the item's index in the folder list. This creates a "Rainbow" flow but can change if you add a new folder at the top.
*   **Deterministic (File Hashing)**: For files, we use `hashString(filename) % palette.length`. This ensures that `Notes.md` always has the same color, no matter where it is moved.
