# 📓 Notebook Navigator Integration Guide

This guide explains the technical architecture, challenges, and solutions implemented to ensure **Colorful Folders** works flawlessly with the **Notebook Navigator** (NN) plugin.

---

## 1. The Core Challenge: Virtualized Lists

The biggest hurdle in styling Notebook Navigator is its use of a **Virtualized List** (via React). 

### The Problem:
In a virtualized list, the DOM elements (the rows you see in the sidebar) are constantly being created, recycled, and destroyed as you scroll. 
- If we use JavaScript to find an element and add a class (like `nn-has-custom-background`) or set an inline style, there is a delay.
- This delay causes **"Flickering"**: You scroll down, a row appears white for a split second, and then suddenly turns the correct color.
- Sometimes, if you scroll too fast, the JavaScript can't keep up, and rows remain unstyled.

---

## 2. The Solution: "Native-Bridge" (Pure CSS)

To achieve zero-lag, 100% stable styling, we moved away from JavaScript-driven decoration and back to a **Pure CSS Strategy**.

### How it works:
Instead of trying to "touch" the DOM elements with code, we generate a massive stylesheet that the browser loads once. This stylesheet contains rules that target elements by their unique attributes:

```css
/* Example of a generated rule */
.notebook-navigator .nn-navitem[data-path="Project A"] {
    background-color: rgba(235, 111, 146, 0.2) !important;
    border-radius: 4px !important;
}
```

### Why this is superior:
- **O(1) Performance**: The browser's native CSS engine is incredibly fast. It applies the style the exact nanosecond the row enters the DOM. 
- **Zero Flickering**: Because the style is already in the browser's memory, there is no "calculation" delay.
- **Immune to Virtualization**: It doesn't matter how many times React recycles the DOM row; as long as the row has `data-path="Project A"`, the browser will paint it correctly.

---

## 3. Icon Rendering Strategy

Notebook Navigator handles icons differently than the standard Obsidian explorer. We use a hybrid approach to ensure they look native.

### Auto-Icons (CSS Masking)
For auto-icons (Lucide/Emoji), we use CSS pseudo-elements (`::before`) and `-webkit-mask-image`. 
- We hide NN's native icon slot (`.nn-navitem-icon`).
- We inject our icon directly into the text span.
- This ensures the icon stays perfectly aligned with the text even during rapid scrolling.

### Manual Overrides (DOM Injection)
For custom icons selected via the Visual Picker, we use `IconManager.ts` to inject a `.cf-icon-wrapper` into the `.nn-navitem-name` / `.nn-file-name` spans.
- This is the "Indestructible" strategy inherited from version 4.1.4.
- By placing the icon *inside* the name span, we ensure it is treated as part of the text content by the browser, preventing layout shifts.

---

## 4. Why Version 4.1.4 was the "Golden Standard"

During development, we discovered that version 4.1.4 had the most stable Notebook Navigator integration. 
- **The Insight**: 4.1.4 relied heavily on direct CSS background-color overrides rather than trying to "cooperate" with NN's internal state variables.
- **The Action**: We have restored the exact CSS generation logic from 4.1.4 into the current 4.1.5 engine. 
- **Result**: You get the modern features of 4.1.5 (Active File Coloring, Focus Mode 3.0) with the rock-solid performance of 4.1.4.

---

## 5. Technical Selectors Reference

If you are writing your own CSS snippets for Notebook Navigator, use these high-specificity selectors:

| Element | Selector |
| :--- | :--- |
| **NN Folder Item** | `.notebook-navigator .nn-navitem` |
| **NN File Item** | `.notebook-navigator .nn-file` |
| **NN Item Name** | `.nn-navitem-name` / `.nn-file-name` |
| **NN Item Icon** | `.nn-navitem-icon` / `.nn-file-icon` |
| **Active/Selected** | `.is-active` / `.nn-selected` |

---

> [!TIP]
> **Performance First**: If you notice any lag in your sidebar, ensure you aren't using complex CSS filters (like `blur`) on every single item. Stick to `background-color` and `opacity` for the smoothest experience.
