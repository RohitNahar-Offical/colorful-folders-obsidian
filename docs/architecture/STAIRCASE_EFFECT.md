# 🪜 The Staircase Effect & Modern Inline Style Stripper

This document explains what the **"Staircase Effect"** is in Obsidian file-explorer rendering, why it occurs, and how **Colorful Folders** eliminates it using the **Style Stripper Engine**.

---

## 1. What is the Staircase Effect?

In Obsidian's native file explorer (especially when third-party themes like Blue Topaz, Prism, or custom CSS snippets are active), nested file and folder items (`.tree-item-self`) often receive dynamic inline `padding-left` or `margin-left` inline style assignments injected by Obsidian's virtualized list renderer.

### Visual Manifestation
- Nested subfolders and files incrementally shift further to the right on every re-render frame.
- Indentation lines break out of alignment.
- Tree items take on a diagonal, "staircase" visual appearance that pushes text off-screen.

---

## 2. Technical Root Cause

1. **Inline Style Assignment Invalidation**: Obsidian's internal file explorer view dynamically writes inline styles (e.g. `element.style.paddingLeft = "24px"`) directly to `.tree-item-self` nodes during DOM recycling and virtualized scroll events.
2. **CSS Specificity Clashes**: Inline `style="..."` attributes have higher CSS specificity ($1,0,0,0$) than class-based theme stylesheets ($0,1,0$), causing inline layout offsets to override theme CSS rules.

---

## 3. How the Style Stripper Engine Works

Colorful Folders resolves this issue at the runtime level via `initStaircaseStyleStripper()` in [src/main.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/main.ts#L302-L378).

```mermaid
graph TD
    A[Plugin Load / Vault Ready] --> B[initStaircaseStyleStripper]
    B --> C[Initial Pass: Strip style attribute from existing .tree-item-self nodes]
    C --> D[Attach MutationObserver to document.body]
    D --> E{DOM Event: Attribute / ChildList Mutation}
    E -->|Target is .tree-item-self| F{Is Explicit Folder Note?}
    F -- Yes --> G[Add .cf-fn-hidden class; preserve folder note state]
    F -- No --> H[Strip style attribute via el.removeAttribute('style')]
    H --> I[Native C++ AdoptedStyleSheet handles layout & indentation]
```

### Key Components:

1. **Initial Cleanup Pass**:
   - Immediately queries all `.tree-item-self` elements across open workspace documents.
   - Strips interfering inline `style` attributes upon plugin load.

2. **Reactive `MutationObserver` (`win._testerObserver`)**:
   - Observes `childList`, `subtree`, and `attributes` (`attributeFilter: ["style"]`) on `document.body`.
   - Listens for React or virtualized scroll re-injections of inline `style` attributes on `.tree-item-self` nodes.

3. **Folder Note Preservation Guard**:
   - Checks if target or parent elements match explicit Folder Note plugin selectors (`.is-folder-note`, `.fn-hidden`, `[data-folder-note="true"]`).
   - If marked as a folder note, preserves hiding behavior (`.cf-fn-hidden`) instead of stripping styles.

4. **Zero-DOM CSS Replacement**:
   - Once inline layout offsets are stripped, `BaseCssGenerator` and `AdoptedStyleSheetService` inject high-specificity flex layouts and custom CSS variables (`--cf-indent-level`), restoring perfectly aligned vertical indentation.

---

## 4. Summary of Benefits

- **Zero Layout Shift**: Indentation remains rock-solid during fast scrolling and vault expansion.
- **Theme Interoperability**: Seamlessly prevents theme-specific inline padding hacks from breaking tree layout.
- **High Performance**: The `isStripping` guard flag eliminates recursive observer loops, maintaining $O(1)$ mutation processing overhead.
