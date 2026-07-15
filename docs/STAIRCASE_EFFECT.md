# The Staircase Effect Hack

This document outlines the mechanics of the "Staircase Effect" hack used to defeat Obsidian's React engine and enforce custom visual folder indentation (while keeping background highlight colors spanning the full width of the file explorer row).

## The Problem
By default, Obsidian uses its React engine to calculate the depth of folders/files in the file explorer. It enforces this indentation natively by writing an inline `style="padding-inline-start: XXpx;"` directly onto the `.tree-item-self` DOM element.

If a plugin wishes to style the background of these elements (so the background highlight color stretches from the absolute left edge of the pane to the right), it must set the padding of `.tree-item-self` to `0px`. However, doing so eliminates the native staircase indentation effect. 

## The Synergistic Solution

To maintain a full-width background **while** preserving the indented staircase text effect, we must separate the native padding logic from the text alignment logic. This requires two coordinated parts:

### Part 1: The Stripper Script (`main.ts`)
We inject a continuous `MutationObserver` directly into the plugin's startup sequence (currently isolated in `main.ts` inside a 5-second `setTimeout`). 

This observer's sole job is to aggressively watch every `.tree-item-self` element in the file explorer. Whenever Obsidian's React engine attempts to inject its native `style` attribute, the observer immediately strips it away using `el.removeAttribute('style')`.

This completely neutralizes Obsidian's native indentation calculations and collapses all file explorer items to a `0px` baseline.

### Part 2: The Visual Offset CSS Hack (e.g. `nuke.css`)
With the native padding stripped, all items are flush-left. To restore the staircase effect, a CSS snippet must be applied that manually shifts the *inner* text/icon elements back into a staircase shape, without affecting the `.tree-item-self` background wrapper.

```css
/* 1. Set a forced global baseline on the outer wrapper */
body .workspace-leaf-content[data-type="file-explorer"] .tree-item-self {
    padding-inline-start: 30px !important;
}

/* 2. Negatively shift the inner text and icons leftward */
body .workspace-leaf-content[data-type="file-explorer"] .tree-item-self > .tree-item-icon,
body .workspace-leaf-content[data-type="file-explorer"] .tree-item-self > .tree-item-inner {
    position: relative !important;
    left: -20px !important; 
}
```

### Result
1. The `.tree-item-self` (which holds the background hover/active color) stays visually pinned and full-width.
2. The inner contents (`.tree-item-inner`) visually render shifted, creating an identical visual representation of Obsidian's staircase structure without being restricted by inline DOM styles.
3. Because the React inline styles are being continuously stripped in JavaScript, the CSS properties correctly govern the layout hierarchy 100% of the time.
