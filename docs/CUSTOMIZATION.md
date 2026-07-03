# Customization Guide

This guide provides technical instructions and CSS snippets for advanced customization of the **Colorful Folders** plugin.

## High-Specificity Overrides

The plugin uses `!important` on many of its core styles to ensure cross-theme compatibility. To override these in your own snippets, you must use **higher specificity selectors**.

### 🛠️ Pro Techniques for Increasing Weight
If your styles aren't applying, try these "Weight Boosting" techniques:

1.  **Parent Scoping**: Prefix your selectors with `body` or `.nav-files-container`.
2.  **Selector Chaining**: Instead of `.is-active`, use `.nav-file-title.is-active`.
3.  **Pseudo-class Stacking**: Add `:not(#ignore)` to a selector. Even if `#ignore` doesn't exist, it adds the weight of an **ID** to your selector.
4.  **Class Doubling**: You can repeat a class to double its weight: `.nav-folder-title.nav-folder-title`.

### Example: Top-Level Override
```css
/* Normal Specificity (May fail) */
.nav-file-title.is-active { background: red; }

/* High Specificity (Recommended) */
body .nav-files-container .nav-file-title.is-active { 
    background-color: rgba(255, 0, 0, 0.2) !important;
}

/* "The Hulk" Specificity (Nuclear Option) */
body:not(#_) .nav-files-container .nav-file-title.is-active:not(.nn-file) {
    background-color: #ff0000 !important;
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
    --cf-active-color: #ffffff !important;
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

> [!TIP]
> You can now adjust the base thickness of these lines directly in the plugin settings under **General > Path and typography > Path line thickness** without using custom CSS.

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

## Graph View Color Sync

The plugin can automatically sync your custom folder colors to Obsidian's native **Graph View**. 

### Enabling Graph Sync
1. Open Colorful Folders settings.
2. Navigate to **Integrations > Sync folder colors to Graph View**.
3. Toggle the setting to **On**.

Once enabled, the plugin will inject custom color groups into your `.obsidian/graph.json`. 
- **Non-Destructive**: The plugin preserves any manual color groups you have already created in your graph settings. Your manual groups will always have higher priority.
- **Clean Uninstallation**: If you disable the setting, the plugin automatically removes only its generated groups from the graph configuration.

---

## Notebook Navigator Customization

Since Notebook Navigator uses its own CSS classes, you must use specific selectors to override its styles.

```css
/* Change background of a specific folder in NN */
body .notebook-navigator .nn-navitem[data-path="Your Folder"] {
    background-color: gold !important;
    border-radius: 8px !important;
}

/* Customize the selection glow in NN */
body .notebook-navigator .is-active {
    box-shadow: 0 0 15px var(--interactive-accent) !important;
    filter: brightness(1.2);
}

/* Custom icons in NN list view */
body .notebook-navigator .nn-file[data-path$=".md"] .nn-file-name::before {
    content: "📝 " !important;
}
```

---

## Best Practices
1. **Use `data-path`**: Use the `data-path` attribute to target specific folders/files without affecting others.
2. **Respect Variables**: Use Obsidian CSS variables (like `var(--interactive-accent)`) to ensure your snippets adapt to light/dark modes.
3. **Check for `:has()`**: The plugin uses `:has()` for some layout overrides. Ensure your browser/Obsidian version supports it if you are writing complex parent-targeting CSS.

---

## 🔌 Modern CSS Variable Hook Engine (No `!important` Needed)

The plugin's styling engine dynamically exposes standard **CSS Variable Hooks** on all folder and file paths. By scoping overrides to these variables inside standard selectors, you can customize the appearance of any element **natively without using a single `!important` declaration**!

### 📊 Available Hook Variables

| Hook Variable | Description | Default Fallback Value |
| :--- | :--- | :--- |
| `--cf-file-bg` | Background color for files | Active dynamic/tinted background color |
| `--cf-file-color` | Text color for files | Calculated WCAG contrast text color |
| `--cf-folder-bg` | Background color for folders | Dynamic folder background |
| `--cf-folder-color` | Text color for folders | Dynamic folder text color |
| `--cf-active-bg` | Background color for active files | Active highlight color (configured or tinted glass) |
| `--cf-active-color` | Text and border color for active files | Active text highlight color |
| `--cf-selection-bg` | Custom multi-selection background shade | Calculated transparent color overlay (color + 0.15 opacity) |
| `--cf-tag-bg` | Background for tags/flairs/metadata | Dynamic parent 15% opacity color tint |
| `--cf-tag-color` | Text color for tags/flairs/metadata | Calculated contrast text color |

### 🛠️ Hover and Selection Hook Override Examples

Instead of writing high-specificity overrides that need `!important` to fight with the theme, you can seamlessly bind your custom color design tokens to these variables:

```css
body {
    /* Define your design tokens */
    --nav-item-background-hover: gray;
    --nav-item-color-hover: black;
    --nav-item-background-selected: green;
    --nav-item-color-selected: yellow;
}

/* Override hover states cleanly across folders & files */
body:not(.is-grabbing) .nav-files-container .nav-file-title:not(.is-active):not(.is-selected):hover,
body:not(.is-grabbing) .nav-files-container .tree-item-self:not(.is-active):not(.is-selected):hover {
    --cf-file-bg: var(--nav-item-background-hover);
    --cf-file-color: var(--nav-item-color-hover);
    --cf-folder-bg: var(--nav-item-background-hover);
    --cf-folder-color: var(--nav-item-color-hover);
}

/* Override selection states cleanly across folders & files, inheriting custom selection backgrounds */
body:not(.is-grabbing) .nav-files-container .nav-file-title.is-selected:not(.nn-file),
body:not(.is-grabbing) .nav-files-container .tree-item-self.is-selected:not(.nn-file),
body:not(.is-grabbing) .nav-files-container .nav-file-title.is-selected:not(.nn-file):hover,
body:not(.is-grabbing) .nav-files-container .tree-item-self.is-selected:not(.nn-file):hover {
    --cf-file-bg: var(--cf-selection-bg, var(--nav-item-background-selected));
    --cf-file-color: var(--nav-item-color-selected);
    --cf-folder-bg: var(--cf-selection-bg, var(--nav-item-background-selected));
    --cf-folder-color: var(--nav-item-color-selected);
}
```

---

## 🎨 Cross-Plugin Interoperability (e.g. Calendar Integration)

When creating CSS snippets to customize multiple plugins at once (such as **Colorful Folders** alongside Liam Cain's **Calendar** plugin), it is best practice to decouple your styling declarations to prevent theme conflicts and ensure visual harmony.

By combining the **CSS Variable Hook Engine** of Colorful Folders with clean, variable-based overrides for third-party views, you can build unified theme controllers:

```css
body {
    /* Shared Branding Variables */
    --brand-accent: #ff7b00;
    --brand-accent-glow: rgba(255, 123, 0, 0.2);
    
    /* Calendar Plugin Customization Hooks */
    --calendar-active-day-bg: var(--brand-accent);
    --calendar-hover-day-bg: rgba(var(--mono-rgb-100), 0.08);

    /* Colorful Folders Customization Hooks */
    --cf-active-bg: var(--brand-accent-glow);
    --cf-active-color: var(--brand-accent);
}

/* Style Calendar active days and hover states natively */
.calendar-view .day.active {
    background-color: var(--calendar-active-day-bg) !important;
    border-radius: 50%;
}
.calendar-view .day:hover {
    background-color: var(--calendar-hover-day-bg);
}
```

---

## Tag Color Sync Customization

The **Tag Color Sync** feature injects CSS rules that colorize `#tags` in the editor and reading view to match your folder colors. You can override these styles using the exposed CSS variables.

### CSS Variables Exposed by Tag Color Sync
```css
/* All tag rules use these two variables */
.cm-hashtag.cm-tag-mytag {
    --cf-tag-bg: rgba(r, g, b, 0.2);
    --cf-tag-color: #hexcolor;
}
```

### Customization Examples
```css
/* Make ALL synced tags use a pill shape */
body .cm-s-obsidian .cm-hashtag[class*="cm-tag-"] {
    border-radius: 999px !important;
    padding: 1px 8px !important;
    font-size: 0.85em !important;
}

/* Override a specific tag's color without touching settings */
body .markdown-rendered a.tag[href="#projects"] {
    --cf-tag-bg: rgba(255, 100, 0, 0.2) !important;
    --cf-tag-color: #ff6400 !important;
}
```

### Custom Tag Rules Format (in Settings)
Go to **Integrations → Tag Color Sync → Custom tag rules** and add lines in the format:
```
tagname = #hexcolor
projects = #ff6400
areas = #00aaff
```
Rules here take priority over automatic folder-name matching.

---

## Advanced Auto-Icon Regex Builder

The **Regex Builder** UI lets you create custom icon matching rules in the **Icon Packs** settings tab. Rules follow the syntax:

```
<regex-pattern> = <icon-id> @<priority>
```

### Priority Range
- Valid range: **1 to 100** (integers only).
- **1** = lowest priority (will be overridden by most other rules).
- **100** = highest priority (wins over all other custom rules).
- The built-in icon categories use internal values; your custom rules always operate in the 1–100 range.

### Examples

| Goal | Rule |
| :--- | :--- |
| Match folders ending in `_Archive` | `_archive$ = lucide-archive @90` |
| Match files starting with a year | `^202[0-9]- = 📅 @85` |
| Match anything containing "work" | `work = lucide-briefcase @50` |
| Low-priority fallback for untitled | `^untitled = 📄 @1` |

### Live Testing
Type a folder or file name in the **Test name** input field in the Regex Builder UI. The icon that would be assigned is displayed immediately without requiring a reload.
