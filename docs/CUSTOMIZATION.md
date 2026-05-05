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
```

---

## Radiant Path & Active Glow

### Customizing the Active Glow
```css
/* Change the glow intensity of the active file */
body .nav-file-title.is-active {
    box-shadow: 0 0 15px 2px rgba(var(--interactive-accent-rgb), 0.5) !important;
}
```

### Customizing Radiant Paths
```css
/* Make the connecting vertical lines thicker */
body .nav-folder-content::before {
    width: 2px !important;
    opacity: 0.8 !important;
}
```

---

## Best Practices
1. **Use `data-path`**: Use the `data-path` attribute to target specific folders/files without affecting others.
2. **Respect Variables**: Use Obsidian CSS variables (like `var(--interactive-accent)`) to ensure your snippets adapt to light/dark modes.
3. **Check for `:has()`**: The plugin uses `:has()` for some layout overrides. Ensure your browser/Obsidian version supports it if you are writing complex parent-targeting CSS.
