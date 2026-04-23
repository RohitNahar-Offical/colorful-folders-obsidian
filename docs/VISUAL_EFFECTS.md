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
6.  **Mode Default**: Dark mode defaults to `0.1`, Light mode to `0.15` if no settings exist.

---

## 7. Section Dividers & Modern Pill Design

Dividers provide structural separation between groups of folders or files.

### The "Bridge" Layout:
We use a flexbox "bridge" strategy to align the divider elements:
1.  **Divider Lines**: Use `flex-grow: 1` to fill remaining space.
2.  **Gap Control**: `dividerLinePadding` (8px by default) controls the white space between the lines and the central label.
3.  **Line Styles**: Supports `solid`, `dashed`, `dotted`, and `double` strokes using CSS borders or linear gradients.

### Modern Pill Design:
The "Pill" design wraps the divider text/icon in a rounded background.
-   **Color Inheritance**: By default, pills inherit the color of the parent folder at **15% opacity**.
-   **Visual Picker**: Integrated rich visual color picker with **Alpha support** allows for precise RGBA overrides.
-   **Glassmorphism Integration**: If enabled, pills use `backdrop-filter: blur(16px)` for a frosted effect.

---

## 8. Sequential vs. Deterministic Coloring

*   **Sequential (Cycle)**: Uses the item's index in the folder list. This creates a "Rainbow" flow but can change if you add a new folder at the top.
*   **Deterministic (File Hashing)**: For files, we use `hashString(filename) % palette.length`. This ensures that `Notes.md` always has the same color, no matter where it is moved.

---

## 9. Transparency Hardening & Explicit "OFF" State

The plugin manages background opacity through a strict hierarchy to ensure visual consistency:

### Transparency Hierarchy:
1.  **Manual Override**: Defined via the modal opacity slider (Saved in `FolderStyle.opacity`).
2.  **Global Fallback**: Defined in settings (`fileBackgroundOpacity`).
3.  **Mode Default**: Dark mode defaults to `0.1`, Light mode to `0.15` if no settings exist.

### The Explicit "OFF" Logic:
When a user toggles Auto-Color Mode **OFF**, the rendering engine does not simply stop styling. Instead, it injects an explicit reset:
```css
.nav-file-title:not(.custom-styled) {
    background-color: transparent !important;
    border-left: none !important;
}
```
This prevents "ghost colors" from themes or previous states from lingering, ensuring the vault returns to a perfectly clean, native Obsidian appearance instantly.

---

## 10. High-Visibility Metadata & Counters

The plugin emphasizes readability for essential metadata (folder counts, file counts, and tags).

### Item Counters
*   **Dual-Indicator Design**: We use a custom SVG that shows both folder and file counts side-by-side.
*   **Bold Weight (900)**: These numbers use the maximum font weight to ensure they are readable even in dense file explorers.
*   **Dynamic Tinting**: The SVG color is automatically synced to the folder's primary color or its custom contrast-adjusted label color.

### Bold Metadata Labels
*   **Targeted Boldness**: Elements on the right side of the explorer (tags, note counts, file extensions) are explicitly set to `font-weight: 900`.
*   **Theme Integration**: This is implemented via the recursive `StyleGenerator`, ensuring that these labels stand out regardless of whether you are using a native Obsidian theme or a highly customized community theme.

