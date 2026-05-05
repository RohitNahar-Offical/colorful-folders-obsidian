# Customization Guide

This guide provides technical instructions and CSS snippets for advanced customization of the **Colorful Folders** plugin.

## High-Specificity Overrides

The plugin uses `!important` on many of its core styles to ensure cross-theme compatibility. To override these in your own snippets, you must use **higher specificity selectors**.

> [!TIP]
> Always prefix your selectors with `body` or `.nav-files-container` to ensure your overrides take priority.

### Example: Customizing a Specific Folder
```css
/* Override the background for a specific folder */
body .nav-folder-title[data-path="Your/Folder/Path"] {
    background-color: rgba(255, 0, 0, 0.2) !important;
    border-left: 4px solid #ff0000 !important;
}

/* Customizing the folder name color */
body .nav-folder-title[data-path="Your/Folder/Path"] .nav-folder-title-content {
    color: #ff0000 !important;
    font-weight: 800 !important;
}
```

---

## Icon Customization

### Adjusting Icon Scaling
While the plugin has a global scale slider, you can fine-tune specific icon types (Lucide vs. Custom) using CSS.

```css
/* Resize all custom icons */
body .cf-icon-wrapper svg {
    width: 20px !important;
    height: 20px !important;
}

/* Add a hover animation to icons */
body .cf-icon-wrapper:hover {
    transform: scale(1.2) rotate(5deg);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

---

## Divider Customization

### Premium Divider Styling
You can transform the look of section dividers by targeting the `.cf-divider-pill` and `.cf-divider-line` classes.

```css
/* Create a neon glow effect for dividers */
body .cf-divider-pill {
    box-shadow: 0 0 10px rgba(var(--interactive-accent-rgb), 0.4) !important;
    border: 1px solid var(--interactive-accent) !important;
    background: rgba(var(--interactive-accent-rgb), 0.1) !important;
    backdrop-filter: blur(8px) !important;
}

/* Thicker, gradient divider lines */
body .cf-divider-line {
    height: 3px !important;
    background: linear-gradient(to right, transparent, var(--interactive-accent), transparent) !important;
}

### Divider Hover Popovers
The premium markdown hover messages can be styled for better readability or thematic consistency.

```css
/* Glassmorphic Popover Styling */
body .cf-premium-popover {
    background: rgba(var(--mono-rgb-100), 0.1) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(var(--mono-rgb-100), 0.2) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
    border-radius: 12px !important;
}

/* Adjusting the text inside the popover */
body .cf-popover-content {
    font-size: 13px !important;
    line-height: 1.6 !important;
    color: var(--text-normal) !important;
}
```
```

---

## Advanced Visual Effects

### Luminous Selection (Active File)
The "Luminous Selection" effect highlights the currently active file with gradients and glassmorphism.

#### 🎨 Customization via UI
You can now customize these colors directly in the plugin settings without writing any code:
1. Go to **General > Active item appearance**.
2. Toggle **Use custom active file colors**.
3. Use the **Visual Color Picker** (palette icon) to design your background and text.

#### 🔧 Customization via CSS Variables
The plugin exposes specific variables that you can override in your snippets for a cleaner implementation:

```css
/* Simplest override using CSS variables */
body .nav-file-title.is-active {
    --cf-active-bg: rgba(255, 255, 255, 0.2) !important;
    --cf-active-text: #ffffff !important;
}

/* Full manual override for custom effects */
body .nav-file-title.is-active {
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 0 2px var(--interactive-accent) !important;
    border: 1px solid var(--interactive-accent) !important;
}
```

#### 🚀 The Nuclear Option (Overriding Everything)
If you encounter a theme that is extremely aggressive, or if you want to force colors that the UI settings won't allow, you can use a **"Specificity Hack"**. This selector is designed to "win" against almost any other rule.

```css
/* Forces colors even over Luminous Selection */
body:not(.is-grabbing) .nav-files-container .nav-file-title.is-active:not(.nn-file), 
body:not(.is-grabbing) .nav-files-container .tree-item-self.is-active:not(.nn-file) {
    background-color: white !important;
    color: silver !important;
    
    /* Optional: Disable plugin effects */
    backdrop-filter: none !important;
    background-image: none !important;
    box-shadow: none !important;
    border: 1px solid silver !important;
}
```

### Radiant Paths (Connecting Lines)
The connecting lines are rendered as borders on the folder's children container.

```css
/* Make the connecting vertical lines thicker and more vibrant */
body .nav-folder-children, 
body .tree-item-children {
    border-left: 3px solid rgba(var(--interactive-accent-rgb), 0.5) !important;
    border-bottom: 3px solid rgba(var(--interactive-accent-rgb), 0.5) !important;
    border-bottom-left-radius: 12px !important;
}

/* Specific color for the path leading to the active file */
body .nav-folder:has(.is-active) > .nav-folder-title ~ .nav-folder-children {
    border-left-color: var(--interactive-accent) !important;
    border-bottom-color: var(--interactive-accent) !important;
}
```

### Rainbow Root Text
If you use the Rainbow Root Text feature, you can customize the gradient:

```css
/* Custom Rainbow Text Gradient */
body .nav-folder-title[data-path$="/"] .nav-folder-title-content {
    background-image: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    color: transparent !important;
}
```

---

## Glassmorphism & Performance

### Adjusting Blur Intensity
```css
/* Increase the blur for all glassmorphic elements */
body .cf-glass {
    backdrop-filter: blur(15px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(15px) saturate(150%) !important;
}
```

### Mobile Optimizations
```css
/* Reduce effects on mobile to save battery */
@media (max-width: 768px) {
    body .nav-file-title.is-active {
        backdrop-filter: none !important;
        box-shadow: none !important;
        border: 1px solid var(--interactive-accent) !important;
    }
}
```

---

## Best Practices
1. **Use `data-path`**: Use the `data-path` attribute to target specific folders/files without affecting others.
2. **Respect Variables**: Use Obsidian CSS variables (like `var(--interactive-accent)`) to ensure your snippets adapt to light/dark modes.
3. **Check for `:has()`**: The plugin uses `:has()` for some layout overrides. Ensure your browser/Obsidian version supports it if you are writing complex parent-targeting CSS.
