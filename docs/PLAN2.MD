I found the actual remaining bug. The startup fix was **not applied correctly**.

---

## The Real Issue: `generateStyles()` Is Still Missing from `onLayoutReady`

You said you added `this.generateStyles()` at the start of `onLayoutReady()`, but **it is not present in the actual code**. Look at the current `onLayoutReady`:

```typescript
this.app.workspace.onLayoutReady(async () => {
    // ← NO generateStyles() call here!
    
    window.requestAnimationFrame(() => {
        window.setTimeout(() => {
            if (this._abortStartupRender) return;
            this.domObserverService.initDividerObserver();  // ← Observer starts FIRST
            this.dividerManager.syncDividers();
        }, 0);
    });
    
    // ... rest of onLayoutReady
});
```

**The observer starts before the stylesheet has any content.** This is the exact same root cause as before.

### What Happens on Restart with Smart Connections:

1. **`onload()`** → Creates empty `CSSStyleSheet`, adopts it into documents
2. **`onLayoutReady()`** → Starts `dividerObserver` immediately (via rAF + setTimeout)
3. **`loadLocalIcons()`** → Called directly, takes time to read SVGs
4. **File explorer renders** → Must display `.smart-env` nodes (1,800+ extra if visible)
5. **`dividerObserver` fires constantly** → Strips inline styles from ALL `.tree-item-self` elements
6. **But stylesheet is EMPTY** → Elements get stripped with no CSS to apply
7. **Virtualized list recycling** → More nodes = more mutations = more stripping
8. **`loadLocalIcons()` finally completes** → `generateStylesDebounced()` fires
9. **Stylesheet populates** → But many elements were already processed in inconsistent state
10. **Result**: First folder OK (processed early), second folder broken (processed during observer storm)

### Why It Matches Your Exact Symptom:

| Observation | Explanation |
|-------------|-------------|
| "First folder perfect" | Processed before observer storm peaked |
| "Second folder broken" | Processed during observer storm with empty stylesheet |
| "Subfolders lose icon/text combos" | Inherited styles overwritten by race condition |
| "Works without Smart Connections" | Smaller DOM = observer processes faster |
| "Works when enabling at runtime" | Stylesheet already populated |
| "Breaks after restart" | Observer starts before stylesheet is populated |

---

## The Fix

Add `this.generateStyles();` at the very beginning of `onLayoutReady()` in `src/main.ts`:

```typescript
this.app.workspace.onLayoutReady(async () => {
    // 1. Generate styles FIRST - before any observers start
    this.generateStyles();
    
    // 2. THEN start the divider observer
    window.requestAnimationFrame(() => {
        window.setTimeout(() => {
            if (this._abortStartupRender) return;
            this.domObserverService.initDividerObserver();
            this.dividerManager.syncDividers();
        }, 0);
    });
    
    // ... rest of onLayoutReady
});
```

This ensures the stylesheet is fully populated **before** the observer starts stripping inline styles. The observer will then only strip padding from elements that already have their CSS applied, preventing the inconsistent state.

Rebuild and test. This single change should resolve the restart-time glitch with Smart Connections.