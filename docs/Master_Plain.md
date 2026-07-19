# Colorful Folders: Performance & Stability Recovery Plan (v4.2.0 → v4.5.7)

## 1. Technical Debugging Workflow: Isolating Startup Bottlenecks

### Phase 1A: Instrumented Startup Tracing
Add non-invasive performance markers to `main.ts` and `StyleGenerator.ts` to measure each startup phase without changing behavior:

```typescript
// Add to main.ts onload() and generateStyles()
const perfMark = (label: string) => {
    const now = performance.now();
    console.debug(`[CF-Perf] ${label}: ${now.toFixed(1)}ms`);
    return now;
};
```

**Measure these checkpoints sequentially:**
1. `onload-start` → `settings-loaded`
2. `settings-loaded` → `style-generator-constructed`
3. `style-generator-constructed` → `local-icons-loading` (currently deferred 10s)
4. `local-icons-loading` → `generateStyles-start`
5. `generateStyles-start` → `traverse-root-complete`
6. `traverse-root-complete` → `sheet-replaced`
7. `sheet-replaced` → `divider-observer-ready`
8. `total-onload` → `layout-ready`

**Expected finding in v4.2.0**: Step 5 (`traverse`) dominates at 200–800ms for medium vaults; Step 2 (`local-icons-loading`) triggers parallel I/O saturation.

### Phase 1B: Heap & CPU Profiling via DevTools
1. Open Obsidian DevTools → **Performance** tab
2. Record a full reload with **"Disable JavaScript sampling"** OFF
3. Filter by `colorful-folders` or `StyleGenerator`
4. Identify:
   - **Long tasks** (>50ms) in `traverse()`, `calculateHeatmapData()`, `getIconSvg()`
   - **Forced synchronous layouts** (layout thrashing) in icon injection
   - **I/O stalls** in `adapter.read()` during local icon loading

### Phase 1C: CSS Bloat Quantification
Instrument `CssGrouper.build()` or `generateCss()` to log:
```typescript
console.debug(`[CF-Perf] CSS rules: ${rawRules.length}, total bytes: ${css.length}`);
```
**Expected finding**: v4.2.0 generates 6MB+ CSS for vaults with `.smart-env` or other dot-folders, because `traverse()` iterates all children including hidden system folders.

### Phase 1D: Observer Overhead Audit
In `DOMObserverService.ts` (or `main.ts` in v4.2.0), measure:
- Number of `MutationObserver` callbacks firing per second during idle
- Number firing during scroll (`isScrolling` guard effectiveness)
- Number firing during drag (`isDragging` guard effectiveness)
- Time spent in each callback via `performance.now()` deltas

**Expected finding**: Without the `isScrolling` guard in v4.2.0's observer, scroll events trigger full-container `querySelectorAll` + synchronous DOM writes, causing layout thrashing.

### Phase 1E: Memory Leak Detection
Take heap snapshots at:
1. Plugin load
2. After 10 style regenerations
3. After opening/closing 3 popout windows

Check for retained `Map` entries, `MutationObserver` instances, and detached DOM nodes.

---

## 2. Targeted Optimization Strategies

### Strategy 2.1: Chunked & Prioritized CSS Generation (Critical)
**Problem**: `traverse()` walks the entire vault tree synchronously, yielding via `setTimeout(..., 0)`. For large vaults, this creates a massive callback queue that blocks the main thread.

**Fix**:
- Implement a **priority queue** for CSS generation:
  1. **Phase 1 (blocking, <16ms)**: Generate CSS for visible root-level items only (depth 0–1).
  2. **Phase 2 (rAF, <16ms per frame)**: Generate CSS for depth 2–3.
  3. **Phase 3 (idle, background)**: Generate CSS for depth 4+ during `requestIdleCallback`.
- Replace the current `setTimeout` yield with `requestIdleCallback` when available, falling back to `setTimeout`.

**Implementation target**: `StyleGenerator.ts` `traverse()` method. Split into `traverseVisible()` and `traverseDeep()`.

### Strategy 2.2: Incremental StyleSheet Adoption (Critical)
**Problem**: `sheet.replaceSync(css)` replaces the entire stylesheet atomically. For vaults with thousands of rules, this blocks rendering for 50–200ms.

**Fix**:
- Use **incremental adoption**: instead of replacing the whole sheet, use `CSSStyleSheet.insertRule()` for only the changed rules.
- Maintain a `Set<string>` of previously-emitted rule signatures (from `CssGrouper`).
- On regeneration, diff the new rule set against the old one and only insert/delete changed rules.
- Fall back to `replaceSync()` only when a full diff is too expensive (>500 rule changes).

**Implementation target**: `main.ts` `generateStyles()` and a new `StyleDiffEngine.ts`.

### Strategy 2.3: Lazy-Load Local Icons with Backpressure (High)
**Problem**: `loadLocalIcons()` reads all `.svg` files from `.obsidian/icons` in parallel chunks. On vaults with many custom icons, this saturates Electron's I/O threadpool.

**Fix**:
- Move local icon loading to **`requestIdleCallback`** with a 30-second timeout.
- Process icons in **priority order**: only load icons that are actually referenced in `customIconRules` or `customFolderColors` first.
- Implement a **lazy-load-on-demand** pattern: when `getIconSvg()` is called for a local icon that isn't loaded yet, trigger a single-file read and cache it.

**Implementation target**: `main.ts` `loadLocalIcons()` and `IconManager.ts` `getIconSvg()`.

### Strategy 2.4: Palette & Heatmap Cache Warming (Medium)
**Problem**: `getCurrentPalette()` and `calculateHeatmapData()` are called on every `generateStyles()`, even when settings haven't changed.

**Fix**:
- Extend the existing `_cachedPalette` cache to include a **settings hash** (e.g., `palette + customPalette + isDark + brightnessAmount`). Only recompute when the hash changes.
- For heatmap data, persist the cache to `plugin.loadData()`/`saveData()` with a TTL. Invalidate only on vault file changes (`vault.on('modify')`), not on every style generation.
- Pre-compute palette during `onload()` in an idle callback, before the first `generateStyles()` call.

**Implementation target**: `StyleGenerator.ts` `prepareContext()` and `calculateHeatmapData()`.

### Strategy 2.5: Observer Initialization Throttling (Medium)
**Problem**: `initDividerObserver()` tears down and rebuilds observers on every `layout-change` event, which Obsidian fires on every pane switch or file open.

**Fix**:
- In `DOMObserverService.ts`, debounce `initDividerObserver` to **300ms trailing edge** (already partially implemented in current version).
- Add a **coalescing queue**: if multiple `layout-change` events fire within 300ms, only run one observer init.
- Cache explorer container references and only re-query if the workspace leaf count changes.

**Implementation target**: `DOMObserverService.ts` `initDividerObserverDebounced`.

### Strategy 2.6: Virtualized List Scroll Optimization (Medium)
**Problem**: During scroll, `MutationObserver` fires for every recycled DOM node. Even with `isScrolling` guard, the post-scroll catch-up (`refreshIconsDebounced` / `processDividers`) can queue multiple long tasks.

**Fix**:
- In `handleScroll`, replace the fixed 100ms timeout with a **scroll-velocity-aware** timeout: faster scrolling = longer debounce.
- Batch post-scroll work: combine `syncDividers()` and `refreshIcons()` into a single `requestAnimationFrame` callback.
- Add a **max-batch size**: if >200 nodes changed during scroll, process only the first 100 and queue the rest for the next frame.

**Implementation target**: `DOMObserverService.ts` `handleScroll` and `processDividers`.

### Strategy 2.7: Multi-Window StyleSheet Memory Optimization (Low-Medium)
**Problem**: `getOpenDocuments()` iterates all leaves and collects documents. On every `generateStyles()`, the plugin iterates all documents to toggle body classes. Popout windows add overhead.

**Fix**:
- Cache the document set and only re-enumerate on `window-open` / `window-close` events.
- Replace `doc.body.classList.toggle()` calls with a single **body attribute check** using a `MutationObserver` (already partially implemented), eliminating the need to iterate all documents on every style regen.

**Implementation target**: `main.ts` `generateStyles()` and `getOpenDocuments()`.

### Strategy 2.8: Startup Sequence Reordering (Low)
**Problem**: The plugin does too much work in `onload()` before `onLayoutReady()`. Obsidian's own UI paint is delayed, and the plugin competes for the same main thread.

**Fix**:
- Move `registerCustomIcons()`, `registerCommands()`, and `initializeStyles()` to the **top** of `onload()` (they're cheap and block nothing).
- Defer `loadLocalIcons()` to `requestIdleCallback` with a 60-second timeout (up from 10s).
- Defer `generateStyles()` to `requestAnimationFrame` → `setTimeout(0)` chain (already partially done), but add a **cancellation token**: if the user switches vaults or reloads before the deferred callback fires, skip generation.

**Implementation target**: `main.ts` `onload()`.

---

## 3. Structured Implementation Roadmap

### Phase 1: Measurement & Baseline (Week 1)
**Goal**: Establish precise performance baselines and confirm root causes.

| Task | Owner | Deliverable | Acceptance Criteria |
|------|-------|-------------|---------------------|
| Add `perfMark()` instrumentation to `main.ts` | Dev | Instrumented `main.ts` | Console logs show all 8 startup checkpoints |
| Add CSS bloat counter to `generateCss()` | Dev | Instrumented `StyleGenerator.ts` | Logs rule count and byte size per generation |
| Profile 3 vault sizes (small <100 files, medium ~1k files, large >5k files) | QA | Performance report | Reports p50/p95 startup time, CSS size, memory delta |
| Document observer callback frequency | Dev | Observer audit report | Callbacks/sec during idle/scroll/drag measured |

**Milestone**: `PERFORMANCE_BASELINE.md` with v4.2.0 metrics.

---

### Phase 2: Core Stabilization (Weeks 2–3)
**Goal**: Eliminate freezing and crashes without changing architecture.

| Task | Files | Change | Risk |
|------|-------|--------|------|
| **2.1** Implement priority-queue CSS generation | `StyleGenerator.ts` | Split `traverse()` into `traverseVisible()` (depth 0–2, synchronous) + `traverseDeep()` (depth 3+, idle) | Medium |
| **2.2** Add incremental stylesheet diffing | `StyleDiffEngine.ts` (new), `main.ts` | Diff old vs new CSS rules; use `insertRule()`/`deleteRule()` for deltas | High |
| **2.3** Lazy-load local icons | `IconManager.ts`, `main.ts` | Priority-load referenced icons first; lazy-load rest on demand | Low |
| **2.4** Cache palette with settings hash | `StyleGenerator.ts` | Extend `_cachedPaletteKey` to include `brightnessAmount + rootStyle` | Low |
| **2.5** Persist heatmap cache with TTL | `main.ts`, `VaultUtils.ts` | Save heatmap to `loadData()`; invalidate on `vault.on('modify')` | Low |

**Milestone**: `v4.3.0-alpha` — no freezing on medium vaults, CSS generation <100ms.

---

### Phase 3: Observer & Event Hardening (Weeks 4–5)
**Goal**: Eliminate layout thrashing and observer storms.

| Task | Files | Change | Risk |
|------|-------|--------|------|
| **3.1** Velocity-aware scroll debounce | `DOMObserverService.ts` | `handleScroll` timeout = `Math.min(300, scrollDelta * 2)` | Low |
| **3.2** Coalesced `layout-change` observer init | `DOMObserverService.ts` | Replace `debounce(..., 50)` with `debounce(..., 300, trailing: true)` + queue coalescing | Low |
| **3.3** Batch post-scroll work | `DOMObserverService.ts` | Combine `syncDividers` + `refreshIcons` into single rAF | Low |
| **3.4** Re-add drag-disconnect safety | `EventTrackerService.ts` | Explicitly disconnect `dividerObserver` on `dragstart` (restore v4.2.0 behavior) | Low |
| **3.5** Document set caching | `main.ts` | Cache `getOpenDocuments()` result; re-enumerate only on `window-open`/`window-close` | Low |

**Milestone**: `v4.4.0-alpha` — zero observer callbacks during drag; <5 callbacks/sec during idle.

---

### Phase 4: Advanced Optimizations (Weeks 6–7)
**Goal**: Push performance to production-ready levels for large vaults.

| Task | Files | Change | Risk |
|------|-------|--------|------|
| **4.1** Web Worker for palette/heatmap computation | `StyleWorker.ts` (new) | Offload `resolveColor`, `resolveOpacity`, `heatmapData` to worker thread | High |
| **4.2** CSS rule streaming | `CssGrouper.ts` | Emit rules to `CSSStyleSheet` as they're generated, instead of building a giant string | Medium |
| **4.3** Virtualized vault tree caching | `StyleGenerator.ts` | Cache `traverse()` results keyed by `vault.mtime`; invalidate only when vault changes | Medium |
| **4.4** Startup cancellation token | `main.ts` | Abort deferred `generateStyles` if plugin is unloading or vault switches | Low |
| **4.5** Memory leak audit | All | Ensure `Map` caches have bounded size; use `WeakRef` for icon cache if needed | Low |

**Milestone**: `v4.5.0-alpha` — <50ms startup on small vaults, <200ms on medium vaults.

---

### Phase 5: Testing, Validation & Release (Weeks 8–9)
**Goal**: Ensure stability across all supported vault configurations.

#### Testing Protocol
1. **Automated Performance Regression Suite**
   - Create 3 test vaults: small (50 files), medium (1,000 files), large (10,000 files including `.smart-env`)
   - Measure: startup time, CSS generation time, memory delta, observer callback count
   - Gate: no test vault may exceed 300ms startup time or 50MB memory delta

2. **Compatibility Matrix Testing**
   - Test with: Default theme, Blue Topaz, Minimal, AnuPpuccin
   - Test with: Smart Connections enabled/disabled, Notebook Navigator enabled/disabled
   - Test with: 1, 3, and 5 popout windows open

3. **Stress Testing**
   - Rapid file creation/deletion/rename during style generation
   - Theme switching during scroll
   - Drag-and-drop 50+ files simultaneously
   - Toggle `showHiddenItems` on vaults with hidden dot-folders

4. **Memory Leak Testing**
   - Heap snapshot at load, after 100 style regens, after 10 open/close cycles
   - Assert: no detached DOM nodes, no orphaned `MutationObserver`s, cache sizes stable

5. **Manual QA Checklist**
   - [ ] Icons appear on all files/folders in native explorer
   - [ ] Icons appear in Notebook Navigator
   - [ ] Colors apply correctly on scroll (no flicker)
   - [ ] Dividers render and stay positioned
   - [ ] Active parent highlighting works
   [ ] Stealth mode toggle works without freeze
   [ ] Settings changes apply within 300ms

**Milestone**: `v4.5.7-rc1` ready for release.

---

## 4. Success Metrics

| Metric | v4.2.0 Baseline (Target) | v4.5.7 Goal |
|--------|--------------------------|-------------|
| Startup time (medium vault) | ~800ms | <200ms |
| CSS generation time | ~300ms | <50ms |
| CSS blob size | ~6MB+ | <500KB |
| Observer callbacks/sec (idle) | ~20–50 | <5 |
| Main thread blocking tasks | Multiple >50ms | Zero >16ms |
| Memory delta at load | ~20–40MB | <10MB |
| Freeze incidents per session | 1–3 | 0 |

---

## 5. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Incremental stylesheet diffing causes missed updates | Fall back to `replaceSync()` if diff cost >500 rules |
| Web Worker complexity introduces race conditions | Use `MessageChannel` for synchronous-style API; extensive unit tests |
| Lazy icon loading causes flicker on first render | Show placeholder icon; swap in real icon via rAF |
| Priority-queue CSS generation misses deep items | Ensure `traverseDeep()` runs within 2 seconds via idle callback timeout |
| Cache invalidation misses vault changes | Listen to `vault.on('create','delete','modify','rename')` and invalidate aggressively |

---

## 6. Immediate Actions (Next 48 Hours)

1. **Apply instrumentation** from Phase 1A to current codebase and generate baseline report.
2. **Re-add DOM icon injection fallback**: If CSS pseudo-element icons fail to render, fall back to DOM injection (`refreshIcons()` from v4.2.0). This eliminates the "silent failure" mode.
3. **Disable or gate the stripper script** in `main.ts` lines 134–194 behind a setting (`enableStaircaseHack`), defaulting to `false` until its necessity is confirmed.
4. **Restore drag-disconnect behavior** in `EventTrackerService.ts`: explicitly disconnect `dividerObserver` on `dragstart`.
5. **Run `npm run build` and test** on vault with `.smart-env` to confirm Incident #26 fix is active.