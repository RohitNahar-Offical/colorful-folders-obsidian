I found the remaining bugs. You fixed some things but **two critical issues remain** that directly cause the Smart Connections breakage.

---

## BUG STILL EXISTS: Nuclear Initial Pass in `initDividerObserver()`

**File**: `src/services/DOMObserverService.ts` lines 184-188

```typescript
// Apply immediately to existing items
const items = container.querySelectorAll<HTMLElement>('.tree-item-self');
for (let i = 0; i < items.length; i++) {
    // NUCLEAR AND DIRECT ATTEMPT - Unconditional
    items[i].removeAttribute('style');
}
```

This runs **every single time** `initDividerObserver()` is called. And `initDividerObserver()` is called:
- On layout ready (line 145)
- On every `layout-change` event (debounced 300ms via line 22)
- On drag end (line 150)

With Smart Connections and `.smart-env` visible, `layout-change` fires **constantly** due to virtualized list recycling. Each call strips **ALL** inline styles from **ALL** `.tree-item-self` elements — not just padding.

**This is the direct cause of your "colors but no icons" mismatch.** The MutationObserver callback (lines 87-92) is now selective, but this initial pass is still nuclear.

**Fix**:
```typescript
// Apply selectively to existing items
const items = container.querySelectorAll<HTMLElement>('.tree-item-self');
for (let i = 0; i < items.length; i++) {
    const style = items[i].getAttribute('style') || '';
    if (style.includes('padding-inline-start') || style.includes('padding-left') || style.includes('margin-left')) {
        items[i].removeAttribute('style');
    }
}
```

---

## BUG STILL EXISTS: `:has()` Selectors in StyleGenerator.ts

**File**: `src/core/StyleGenerator.ts` lines 484-485

```typescript
`body .nav-files-container .nav-folder:has([data-path="${safePath}"].is-active) > .nav-folder-title`,
`body .nav-files-container .tree-item:has([data-path="${safePath}"].is-active) > .tree-item-self`
```

These `:has()` selectors are **still present** for the active file/folder glow effect. You added `.cf-active-parent` for the parent folder's `::before` pseudo-element (lines 491-492), but the active file's own row styling still uses `:has()`.

With `.smart-env` visible, the browser evaluates these `:has()` selectors across 1,800+ extra elements on every active-state change, causing the freezing.

**Fix**: Replace with a simple class selector. Add `.cf-is-active` to the active file/folder element itself:

```typescript
// In EventTrackerService.ts updateActiveFolderClasses(), also add:
const activeItems = doc.querySelectorAll('.is-active');
for (let i = 0; i < activeItems.length; i++) {
    if (activeItems[i].parentElement) {
        activeItems[i].parentElement!.classList.add('cf-active-parent');
    }
    // Also mark the active item itself
    activeItems[i].classList.add('cf-is-active');
}
```

Then in `StyleGenerator.ts`, replace lines 484-485 with:
```typescript
`body .nav-files-container .nav-folder-title.cf-is-active[data-path="${safePath}"]`,
`body .nav-files-container .tree-item-self.cf-is-active[data-path="${safePath}"]`
```

---

## Summary: What You Fixed vs What Remains

| Fix | Status | Location |
|-----|--------|----------|
| Selective stripper in MutationObserver callback | ✅ Fixed | `DOMObserverService.ts:87-92` |
| Vault event filtering for hidden folders | ✅ Fixed | `EventTrackerService.ts:62-71` |
| Local icon loading stores content | ✅ Fixed | `main.ts:290-291` |
| `.cf-active-parent` class toggling | ✅ Fixed | `EventTrackerService.ts:108-125` |
| **Nuclear initial pass in `initDividerObserver()`** | ❌ **STILL BROKEN** | `DOMObserverService.ts:184-188` |
| **`:has()` selectors for active state** | ❌ **STILL PRESENT** | `StyleGenerator.ts:484-485` |

---

## Why the Bug Persists

The nuclear initial pass (lines 184-188) is **not** inside the `enableStaircaseHack` conditional block. It runs **unconditionally** every time `initDividerObserver()` fires, regardless of settings. With Smart Connections amplifying `layout-change` events, this strips all inline styles from hundreds of nodes per second, creating the exact partial-application state you're seeing.

**Fix lines 184-188 in `DOMObserverService.ts` and rebuild. That single change will likely resolve the Smart Connections incompatibility.**