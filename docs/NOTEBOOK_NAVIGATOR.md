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

## 2. The Solution: Unified CSS Orchestration

To achieve zero-lag, 100% stable styling without duplicating code, we re-architected Notebook Navigator to pipe all of its styling directly into Colorful Folder's central `CssGrouper`.

### How it works:
Instead of Notebook Navigator generating its own massive, independent block of CSS (which bloated memory and caused duplicate work), it now uses the **Unified CSS Orchestration** engine. The integration evaluates the required color for a row, determines the correct native Notebook Navigator selector (e.g., `.notebook-navigator .nn-navitem[data-path="..."]`), and hands it off to the core engine.

The core engine groups this selector alongside standard explorer selectors under a single, shared CSS block using a deterministic signature key (e.g., `fileRow_#eb6f92`).

### Why this is superior:
- **O(1) CSS Grouping**: The browser's native CSS engine parses fewer, highly grouped rules. It applies the style the exact nanosecond the row enters the DOM. 
- **Eliminates Duplicate CSS**: By sharing color classes with the standard explorer, the total volume of generated CSS is slashed dramatically.
- **Immune to Virtualization**: It doesn't matter how many times React recycles the DOM row; as long as the row has `data-path="Project A"`, the browser will paint it correctly.

### 3. Surgical Icon Replacement
We use the **CSS Masking Strategy** to swap native NN icons for Colorful Folders icons. 
- This ensures the icon remains in its **exact layout position** within the NN row, preventing any "double icon" or alignment issues during rapid scrolling.

### 4. The Fallback Icon System
To ensure the UI is never blank, the integration bridge implements a mandatory **Zero-Blank Policy**:
- **Automatic Fallback**: If an item does not have a manual icon or an auto-detected rule, the bridge automatically injects a professional Lucide folder or file icon.
- **Dynamic Styling**: These fallback icons inherit the folder's primary color and opacity, ensuring they look like a native part of your configuration.

### 5. The CSS Firewall (Double Icon Fix)
To prevent visual regressions, the plugin implements a **Strict CSS Firewall**. All general icon rules that add `::before` elements to the standard explorer are explicitly scoped with `:not(.nn-file):not(.nn-navitem)`. This ensures that Notebook Navigator is only styled by its dedicated integration layer.

### 6. Decoupled Sizing Optimization
Notebook Navigator cards use a denser layout than the standard sidebar. To maintain visual balance:
- **Standard Explorer**: Icons are scaled at a **1.3em** base and use the **Global icon scaling** setting.
- **Notebook Navigator**: Icons are optimized at a **1.1em** base and use the independent **Navigator icon scaling** setting (defaults to 0.8).
This allows you to dial in the perfect icon size for the tight Notebook Navigator rows without ruining the proportions of your standard file explorer.

---

## 4. Stability & Performance

The integration bridge leverages the plugin's new **Non-Blocking Architecture**:
- **O(1) CSS Grouping**: CSS generation avoids expensive string-hashing, using signature keys to instantly route NN selectors.
- **Asynchronous Yielding**: The integration runs asynchronously, gracefully pausing every `50ms` to prevent the UI thread from locking up when evaluating huge virtualized lists.
- **React-Native Rendering**: Because we use pure CSS, the styles are applied at the browser's paint level, bypassing the React reconciliation loop entirely for maximum scroll performance.

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

