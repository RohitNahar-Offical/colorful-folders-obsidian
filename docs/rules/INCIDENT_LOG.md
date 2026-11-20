# 🚨 INCIDENT LOG — THINGS THAT BROKE & WHY

> **Architecture Note (Version 5.0.0+)**: In Version 5.0.0 (Incident #28), `colorful-folders` completely migrated to a **Zero-DOM Architecture** (`document.adoptedStyleSheets`, `data-cf-path` dataset attributes, and CSS Data-URI pseudo-elements). Incidents #1, #7, #14, #20, and #27 detail historical physical DOM element injection attempts, which are now **SUPERSEDED** by the Zero-DOM architecture.
>
> Read before making ANY architectural changes to prevent regressions.

---

## Incident #1 — CSS Variable Refactor (2026-05-06) [SUPERSEDED by v5.0.0 Zero-DOM]
**What was attempted**: Replace `<style>` tag with CSS variables applied directly to DOM elements.
**Why it was done**: To pass Obsidian store linter rule `obsidianmd/no-forbidden-elements`.
**What broke**:
- Random vertical lines appeared in the file explorer.
- Colors disappeared after scrolling (DOM virtualization issue).
- Icons misaligned — floated outside folder rows.
- Top-level folder colors vanished after subfolder was expanded.
**Root cause**: DOM-based styling cannot handle Obsidian's virtual scroll list. When rows are recycled during scroll, inline styles are lost.
**Resolution**: Reverted to stylesheet adoption (`document.adoptedStyleSheets` in v5.0.0).
**Lesson**: NEVER use JS inline DOM manipulation for the core color engine. Use constructable stylesheets (`adoptedStyleSheets`).

---

## Incident #2 — Interface Mismatch (2026-05-06)
**What was attempted**: Remove `styleTag` property from `IColorfulFoldersPlugin`.
**Why it was done**: Seen as "obsolete" after a refactor.
**What broke**: TypeScript build error — `Class 'ColorfulFoldersPlugin' incorrectly implements interface`.
**Resolution**: Kept the property in the interface or ensured the class matched.
**Lesson**: ALWAYS check `types.ts` interface against `main.ts` class after any refactor.

---

## Incident #3 — Bare eslint-disable (2026-05-05)
**What was attempted**: Add `// eslint-disable-next-line obsidianmd/no-forbidden-elements` without a description.
**Why it was done**: Quick fix to suppress the linter.
**What broke**: Obsidian store automated scanner rejected the submission with: "Unexpected undescribed directive comment."
**Resolution**: Added `-- Dynamic folder-specific styling requires a style tag...` after the comment.
**Lesson**: Every `eslint-disable` MUST have a `-- description` explaining why it is needed.

---

## Incident #4 — Global Flex Layout in styles.css (2026-05-06)
**What was attempted**: Add `display: flex; align-items: center;` globally for `.nav-folder-title-content`.
**Why it was done**: To fix icon alignment.
**What broke**: Unscoped global styles affected non-plugin elements in Obsidian's interface.
**Resolution**: Scoped the rule to `.nav-files-container .nav-folder-title-content`.
**Lesson**: ALL CSS in `styles.css` must be scoped to plugin-specific containers.

---

## Incident #5 — Store Rejection: no-forbidden-elements (2026-05-06)
**What was attempted**: Submitting plugin to Obsidian store with `createEl("style")` + `eslint-disable` comment.
**Why it was done**: This was the original architecture for CSS injection.
**What broke**: The Obsidian store bot rejected the submission — disabling the `no-forbidden-elements` rule is never permitted.
**Resolution**: Replaced `createEl("style")` with the native `CSSStyleSheet` API (`document.adoptedStyleSheets`).
**Lesson**: The `CSSStyleSheet` API is the correct, linter-compliant way to inject dynamic CSS in Obsidian plugins.

---

## Incident #6 — Store Rejection: Unsafe any & Unused Variables (2026-05-07)
**What was attempted**: Implementing Backup/Restore functionality with standard JSON parsing and object destructuring.
**What broke**: The Obsidian store bot rejected the submission with "Unexpected any" and "Async arrow function has no await expression".
**Resolution**:
- Created a `BackupData` interface to type the `parsed` object.
- Replaced property destructuring with explicit `delete` loop on a shallow clone.
- Replaced `document` with `activeDocument` for popout window compatibility.
**Lesson**: Always run the linter before pushing, especially after adding new features that use generic objects or DOM manipulation.

---

## Incident #7 — Notebook Navigator Flickering (2026-05-12) [SUPERSEDED by v5.0.0 Zero-DOM]
**What was attempted**: Implementing Notebook Navigator background colors via JS DOM manipulation (`IconManager` adding classes and inline styles).
**What broke**: Background colors flickered during scroll; icons disappeared or moved.
**Root cause**: Notebook Navigator uses a Virtualized List (React). DOM rows are recycled instantly.
**Resolution**: Reverted to direct CSS rule generation (`data-path` attribute selectors) in `StyleGenerator.ts`.
**Lesson**: For virtualized lists, NEVER rely on JavaScript to inject classes or styles per-row during scroll.

---

## Incident #8 — Native File Explorer Layout Collapse (2026-05-15)
**What was attempted**: Creating a universal layout engine in `styles.css` using broad selectors like `.nn-navitem`.
**What broke**: Notebook Navigator layout collapsed and inline metadata misaligned.
**Resolution**: Reverted to using exact native selectors (`.nav-folder-title`), anchored with `body` and `!important`.
**Lesson**: Do not target wrapper classes (`.nn-navitem`) for layout mechanics. Rely on native classes (`.nav-folder-title`).

---

## Incident #9 — Double Icons & Selector Leakage (2026-05-16)
**What was attempted**: Finalizing icon synchronization for Notebook Navigator.
**What broke**: Side-by-side "double icons" appeared in the NN pane.
**Resolution**: Added `:not(.nn-file):not(.nn-navitem)` CSS firewall to all general icon rules.
**Lesson**: Hybrid rendering (JS + CSS) causes bugs in virtualized lists. Strictly isolate CSS using firewall selectors.

---

## Incident #10 — Blank Items in Integrated Views (2026-05-16)
**What was attempted**: Implementing the Pure CSS bridge for Notebook Navigator.
**What broke**: Items without a custom icon appeared completely blank.
**Resolution**: Implemented mandatory default icon injection in `NotebookNavigator.ts`.
**Lesson**: When overriding native UI elements in third-party plugins, always provide a neutral fallback.

---

## Incident #11 — GitHub Attestation Failure (2026-05-16)
**What was attempted**: Adding `actions/attest@v1` to the GitHub Actions workflow.
**What broke**: CI job failed with "Missing mandatory parameter" error.
**Resolution**: Specified explicit `predicate-type` (`https://slsa.dev/provenance/v1.0`) and `predicate-path`, and elevated permissions to `contents: write`.
**Lesson**: Attestation requires explicit predicate configuration, and release creation requires `contents: write`.

---

## Incident #12 — Color Parsing Crashes & Scroll Listener Leak (2026-05-24)
**What was attempted**: Adding support for 3-character hex colors (e.g. `#f00`).
**What broke**: Unhandled `TypeError` crashes on 3-char hex strings, and scroll event listeners leaked on unload.
**Resolution**: Refactored `hexToRgbObj` in `utils.ts` to expand shorthands, added defensive fallbacks, and explicitly removed event listeners in `onunload`.
**Lesson**: Normalize user inputs and mirror event listener registration/unregistration.

---

## Incident #13 — MutationObserver Layout Thrashing (2026-06-25)
**What was attempted**: Using `MutationObserver` on `activeDocument.body` to listen for class changes (like theme toggles).
**What broke**: Severe lag and CPU spikes during normal interaction because Obsidian appends interaction classes (`is-dragging`, `is-focused`) continuously.
**Resolution**: Added strict class whitelisting filter (`theme-dark`, `theme-light`, `cf-show-hidden`) to `styleObserver`.
**Lesson**: Never bind `MutationObserver` to high-traffic elements like `document.body` without strict class whitelisting.

---

## Incident #14 — Virtualized List Scroll Lag (2026-07-03) [SUPERSEDED by v5.0.0 Zero-DOM]
**What was attempted**: Ensuring icons stay visible when scrolling rapidly in the file explorer via DOM mutation observers.
**What broke**: Severe scroll lag and UI blocking due to `querySelectorAll` scans during scroll.
**Resolution**: Migrated to v5.0.0 Zero-DOM architecture (`data-cf-path` dataset attributes + CSS pseudo-elements).
**Lesson**: Never run full-container DOM scans inside observers attached to virtualized lists.

---

## Incident #15 — Drag Lag & Style Recalculation Thrashing (2026-07-03)
**What was attempted**: Optimizing dragging performance in the file explorer.
**What broke**: CSS `:has()` pseudo-classes forced Chrome to recalculate styles for 1,000+ elements on every mouse move.
**Resolution**: Replaced CSS `:has()` pseudo-classes with O(1) JavaScript class toggles (`.cf-has-divider`, `.cf-hidden`, `.cf-active-parent`).
**Lesson**: Avoid CSS `:has()` pseudo-classes in high-traffic trees like file structures.

---

## Incident #16 — Popout Window Drag Lag & Style Invalidation (2026-07-03)
**What was attempted**: Validating drag performance across all window contexts.
**What broke**: Popout windows have separate `Document` objects; file explorers in popouts were left unstyled.
**Resolution**: Implemented `getOpenDocuments()` helper and `"window-open"` workspace hooks to adopt stylesheets across all open windows.
**Lesson**: Always architect Obsidian style and event logic for multi-document contexts (`getOpenDocuments()`).

---

## Incident #17 — Style Engine Refactoring & Deduplication (2026-07-04)
**What was attempted**: Refactoring the style engine to eliminate code duplication between `getEffectiveStyle` and `StyleGenerator.traverse`.
**Resolution**: Extracted `resolveColor`, `resolveOpacity`, and `resolveTextColor` static helpers on `ColorResolver` and `StyleGenerator`.
**Lesson**: Keep core calculations strictly single-sourced (DRY).

---

## Incident #18 — Startup & Reload Performance Regression (2026-07-04)
**What was attempted**: Optimizing loading speed after refactoring.
**What broke**: Disk I/O saturation from parallel custom SVG file reads froze the main thread.
**Resolution**: Added palette caching (`_cachedPalette`), hex parser caching (`rgbCache`), deferred layout queries to `onLayoutReady()`, and chunked SVG reads in batches of 50.
**Lesson**: Avoid heavy disk I/O and expensive string parsing during startup. Cache palettes and batch filesystem queries.

---

## Incident #19 — High-frequency Settings Persistence Lag (2026-07-05)
**What was attempted**: Rebuilding the Palette Colors settings UI.
**What broke**: Updating settings on every mouse movement frame during color picker dragging caused input lag.
**Resolution**: Wrapped disk saving (`saveData()`) and stylesheet generation in a 300ms debounced function while keeping UI swatch updates synchronous.
**Lesson**: Always debounce setting persistence and style generation during visual slider/picker interactions.

---

## Incident #20 — Icons and Text Vertically Misaligned (2026-07-06) [SUPERSEDED by v5.0.0 Zero-DOM]
**What was attempted**: Injecting custom SVG icon wrappers (`cf-icon-wrapper`) inside content titles.
**What broke**: Custom icons appeared above text because content elements used `display: block`.
**Resolution**: In v5.0.0 Zero-DOM architecture, icons are rendered as CSS `::before` pseudo-elements on flex row containers (`display: flex; flex-direction: row; align-items: center`).
**Lesson**: Content containers holding icons and text must always be flex rows.

---

## Incident #21 — Gradient Text Not Applied to Files (2026-07-06)
**What was attempted**: Applying rainbow gradient text colors to files using `background-clip: text`.
**What broke**: Row background-color covered up the text gradient.
**Resolution**: Separated file CSS into a row rule (background-color) and a text-content child rule (gradient + `background-clip: text`).
**Lesson**: `background-clip: text` functions only when no other background competes on the same element layer.

---

## Incident #22 — Preview Bold Weight Mismatch (2026-07-06)
**What was attempted**: Live preview bar in ColorPickerModal.
**What broke**: Preview used `fontWeight: 700` and two-stop gradient, while renderer used `800` and three-stop gradient.
**Resolution**: Aligned preview bar formula to match `StyleGenerator.ts` renderer exactly.
**Lesson**: UI previews must use the identical rendering formula as the real style engine.

---

## Incident #23 — ColorPickerModal UI Toggles Mismatch (2026-07-06)
**What was attempted**: Adding Bold, Italic, and Gradient toggles to ColorPickerModal.
**What broke**: HTML checkboxes were small and non-native; gradient failed if start color was unpopulated.
**Resolution**: Replaced raw checkboxes with `new obsidian.Setting().addToggle()`, and auto-initialized default gradient colors on toggle enable.
**Lesson**: Use native Obsidian Setting controls and auto-initialize required compound fields.

---

## Incident #24 — Layout-Change Spam (2026-07-10)
**What was attempted**: Listening to workspace `layout-change` event to sync dividers.
**What broke**: Rapidly clicking files fired `layout-change` repeatedly, causing main-thread freezes.
**Resolution**: Wrapped observer initialization in a 500ms `obsidian.debounce`.
**Lesson**: Never bind synchronous heavy DOM logic directly to high-frequency workspace events like `layout-change`.

---

## Incident #25 — Phantom TypeScript Fixes & Missing Compilation (2026-07-15)
**What was attempted**: Modifying TypeScript source files to fix staircase layout effect.
**What broke**: Changes appeared to do nothing because `npm run build` was never executed; Obsidian was running old compiled `main.js`.
**Resolution**: Executed `npm run build`. Enforced rule: ALWAYS run `npm run build` after editing `.ts` files.
**Lesson**: Never assume TypeScript edits take effect automatically. Always compile `main.js` with `npm run build`.

---

## Incident #26 — Massive Freeze with Smart Connections (2026-07-18)
**What was attempted**: Running Colorful Folders in a vault with Smart Connections (`.smart-env` containing 10,000+ files).
**What broke**: Plugin froze Obsidian while generating CSS rules for hidden dot-folders.
**Resolution**: Explicitly excluded any file or folder starting with a dot (`.`) at the top of tree traversal loops in `StyleGenerator.ts` and `VaultUtils.ts`.
**Lesson**: Tree walkers must explicitly exclude hidden dot-folders (`.smart-env`, `.git`, `.obsidian`) at the root level.

---

## Incident #27 — DOM Duplication Race Condition (2026-07-22) [SUPERSEDED by v5.0.0 Zero-DOM]
**What was attempted**: Running alongside third-party DOM-editing plugins like Smart Connections.
**What broke**: Observer feedback loops duplicated HTML wrappers (`.cf-icon-wrapper`).
**Resolution**: In v5.0.0 Zero-DOM architecture, physical DOM wrapper injection was completely eliminated and replaced by `data-cf-path` dataset attributes and CSS pseudo-elements.
**Lesson**: Attribute updates do NOT fire `childList` mutation events, eliminating observer race conditions permanently.

---

## Incident #28 — Architectural Overhaul: Complete Zero-DOM Migration (2026-07-22)
**What was attempted**: Complete migration from physical HTML DOM element injections to a pure Zero-DOM / `document.adoptedStyleSheets` architecture.
**Resolution**:
1. **Dataset Attribute Tagging (`DOMObserverService.ts`)**: `DOMObserverService` performs `data-cf-path="<path>"` tagging only. Attribute updates do NOT fire `childList` mutation events.
2. **Programmatic Stylesheet Adoption (`AdoptedStyleSheetService.ts`)**: Managed constructable `CSSStyleSheet` attached directly to `document.adoptedStyleSheets`.
3. **SVG Data URIs (`StyleGenerator.ts`)**: Custom icons rendered via CSS Data-URIs on `::before` pseudo-elements.
4. **Zero-DOM Dividers (`DividerManager.ts`)**: Section dividers use `data-cf-divider="true"` attribute tagging and pseudo-elements.
**Lesson**: Zero-DOM architectures deliver maximum performance and 100% compatibility across third-party ecosystems.

---

## Incident #29 — Local Linter Silent Version Conflict (2026-08-08)
**What was attempted**: Running strict Obsidian Store linter rules locally.
**What broke**: Local `npm run lint` silently passed while the store bot found hundreds of errors due to `@typescript-eslint` version mismatch between `package.json` and `eslint-plugin-obsidianmd`.
**Resolution**: Pinned top-level `@typescript-eslint` packages to match `eslint-plugin-obsidianmd`'s bundled version (`8.65.0`).
**Lesson**: Pin top-level `@typescript-eslint` packages to match `eslint-plugin-obsidianmd`'s bundled version exactly.

---

## Incident #30 — Blanket Folder Note Hiding & Explorer Unresponsiveness (2026-08-17)
**What was attempted**: Integrating folder note support and active folder parent highlighting when notes are active.
**What broke**:
- Files and folders matching their parent folder name (e.g. `Projects/Projects.md`) or named `index.md` disappeared from File Explorer.
- When `folder-notes` plugin was installed, folder notes were forcibly hidden even when `folder-notes` settings had hiding disabled.
- Folders became unresponsive to click events or collapse toggles, and active folder parent highlights failed when a folder note was open.
**Root cause**:
1. **Nuclear CSS Rule**: `BaseCssGenerator.ts` injected a global `display: none !important` rule targeting `body .is-folder-note`, `body [data-folder-note="true"]`, `.fn-hidden`, and `.cf-fn-hidden`.
2. **Naive Filename Auto-Hiding**: `EventTrackerService.ts` automatically matched any file where `baseName === folderName` or `fileName === 'index.md'` and added `.cf-fn-hidden`.
3. **Invalid CSS Selector Target**: `StyleGenerator.ts` built active folder title selectors using `child.path` (`Projects/Projects.md`) instead of `folder.path` (`Projects`).
4. **Style Stripping Mutating DOM**: `main.ts` `initStaircaseStyleStripper` assigned `.cf-fn-hidden` during inline style stripping passes.
**Resolution**:
1. **Removed Nuclear Display Rule**: Removed blanket `display: none !important` from `BaseCssGenerator.ts` for folder note classes.
2. **Eliminated Naive Auto-Hiding**: Refactored `EventTrackerService.ts` to stop matching filenames against folder names. Only elements explicitly hidden via inline `display: none` or `.is-folder-note-hidden` are tracked for parent highlights.
3. **Fixed Folder Active Selectors**: Corrected `StyleGenerator.ts` to use `safeFolderPath` (`folder.path`) for parent folder active selectors.
4. **Cleaned Style Stripping**: Removed `.cf-fn-hidden` DOM assignment in `main.ts`.
**Lesson**:
1. Never inject global nuclear `display: none !important` rules for class names owned or added by other plugins (e.g. `.is-folder-note`, `[data-folder-note="true"]`).
2. Never assume files named after their parent folder or `index.md` are hidden folder notes — users frequently create matching filenames intentionally.
3. When targeting parent folder DOM elements in CSS generators, always ensure `data-path` attribute selectors use the folder path (`folder.path`), not the child file path.

---

## Incident #31 — Keystroke Main-Thread Blocking & Smooth Cursor Lag (2026-08-19)
**What was attempted**: Adding reactive `metadataCache.on('changed')` cache invalidation for auto-icons during live file editing.
**What broke**: Typing in markdown notes caused noticeable cursor animation stutter, frame drops, and typing lag when using editor plugins like Smooth Cursor.
**Root cause**:
1. **$O(N)$ Cache Array Allocation**: `IconRepository.invalidateAutoIconCache(file.path)` executed `Array.from(this._autoIconResultCache.keys())` on **every single keystroke** (via `metadataCache.on('changed')`).
2. **Main-Thread Blocking**: Creating a 4,096-element JS array and looping over 4,096 string keys on every character typed consumed 5ms to 10ms of main-thread execution per keystroke. Smooth Cursor requires a < 16.6ms frame budget for 60 FPS animations. Losing ~10ms per character caused dropped animation frames.
**Resolution**:
1. **$O(1)$ Direct Map Deletion**: Replaced the 4,096-item array allocation and loop with direct targeted Map key deletion in `IconRepository.ts` (`delete(path)` and `delete(fileName::path)`), reducing keystroke processing time from ~10ms down to **< 0.0001ms**.
2. **Gated Event Processing**: Gated `metadataCache.on('changed')` in `EventTrackerService.ts` to execute strictly when `settings.autoIcons` is enabled.
3. **Pre-Normalized SVG Mask Caching**: Added `getMaskDataUri()` in `IconRepository.ts` and `IconManager.ts` to cache `-webkit-mask-image: url("data:image/svg+xml,...")` Data URIs, eliminating repeated `DOMParser` instantiations during vault traversal.
4. **Incremental Heatmap Scanner**: Updated `vault.on('modify')` and `vault.on('create')` to incrementally update parent folder `mtime` values in $O(\text{depth})$ time (~0.01ms), bypassing 300ms+ full vault scans during style regenerations.
**Lesson**:
1. Never allocate arrays or loop over LRU cache keys inside high-frequency event handlers like `metadataCache.on('changed')` or `vault.on('modify')`. Always use $O(1)$ direct key operations.
2. Keystroke event listeners must execute in < 0.01ms to preserve the 16.6ms budget required for Smooth Cursor and 60 FPS editor responsiveness.

---

## Incident #32 — SMIL Animation Sanitization Stripping in Modals & Explorer (2026-08-24)
**What was attempted**: Sanitizing imported custom SVGs with `normalizeSvg` to prevent XSS.
**What broke**: Animated SVGs (SMIL) froze as static images in `IconPickerModal`, `ColorPickerModal`, and File Explorer.
**Root cause**: `dangerousTags` in `IconRepository.normalizeSvg` included `'animate'` and `'set'`, stripping legitimate SMIL elements.
**Resolution**:
1. Removed `'animate'` and `'set'` from `dangerousTags` while keeping dangerous executable tags (`script`, `iframe`, `object`, `embed`, `foreignobject`) stripped.
2. Created `AnimatedIconService` to manage live SMIL SVG mounting inside `.cf-live-animated-icon` containers.
3. Updated modals to use `getRawIconSvg()` for live animated preview in picker grids.
**Lesson**: SMIL animation tags (`<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`) are safe vector instructions and must not be grouped with executable script tags.

---

## Incident #33 — Auto-Icon Keyword Match Overriding Manual Icon Selection (2026-08-24)
**What was attempted**: Priority resolution for auto-icons in `StyleGenerator.ts`.
**What broke**: When a user picked a custom icon for a file or folder whose title matched an auto-icon keyword (e.g. "book"), changing color caused the icon to revert to the auto-icon instead of preserving the user's manual choice.
**Root cause**: `StyleGenerator.ts` gave auto-icons matching title keywords precedence over `fileStyle.iconId` whenever `isCustom` was true.
**Resolution**: Refactored `StyleGenerator.ts` so manual icon selections (`fileStyle.iconId` / `customStyle.iconId`) take **unconditional top priority**. Auto-icon prediction only runs as a fallback when no manual icon is set.
**Lesson**: User manual selections must always be the absolute top priority in style resolution pipelines.

---

## Incident #34 — Dual Location Vault Icon Accumulation & Hard Reset Bypassing (2026-08-24)
**What was attempted**: Hard cleaning custom icons and resetting styles via settings.
**What broke**: Even after clicking "Clear icon library" and "Factory reset", hundreds of icons remained visible in the icon picker.
**Root cause**:
1. Icons were loaded from two distinct directories: `.obsidian/plugins/colorful-folders/icons/` (plugin custom packs) AND `.obsidian/icons/` (vault-level SVG icons).
2. "Clear icon library" only deleted files from the plugin folder, leaving `.obsidian/icons/` untouched and re-populating `localFileSystemIcons` in memory.
3. `saveLocalCustomIcons()` was called immediately before deletion, re-writing `custom-icons.json` to disk.
**Resolution**:
1. Centralized cleanup into `clearAllIconPacksAndCustomIcons()` in `main.ts` to delete all files in both folders and wipe in-memory dictionaries.
2. Cleared all caches (`iconCache`, `iconManager`, `animatedIconService`) and synchronously unmounted live animated DOM nodes.
**Lesson**: All persistence layers (RAM dictionaries, multiple disk folders, and in-memory caches) must be purged in one atomic cleanup function.

---

## Incident #35 — Unbounded Icon Mask Cache & Narrow Viewport Tab Clipping (2026-08-24)
**What was attempted**: Storing generated SVG mask strings in memory and rendering settings tabs in a fixed row.
**What broke**: `iconCache` grew unbounded over long sessions, and the settings tab navigation bar clipped the "AI" and "Privacy" buttons on narrow windows.
**Root cause**:
1. `plugin.iconCache` was an unbounded plain `Map<string, string>`, accumulating mask data URIs indefinitely.
2. `.cf-tab-bar` had rigid flex formatting without wrapping or horizontal overflow handling.
**Resolution**:
1. Converted `iconCache` to `LRUCache<string, string>(1024)` and right-sized all internal caches.
2. Added dead-path garbage collection in `EventTrackerService.ts` on vault `"delete"` events.
3. Added adaptive multi-line wrapping and horizontal scroll fallbacks to `.cf-tab-bar` in `styles.css`.
**Lesson**: Always use bounded LRU caches for SVG strings/URIs and ensure all UI tab navigation bars support responsive multi-line wrapping.

---

## Incident #36 — SMIL Animated Icon Freezing on Scroll & Cold-Start Cache Poisoning (2026-08-25)
**What was attempted**: Adding SMIL animated SVG icons (e.g. `boom`) to file and folder tree items, and optimizing startup performance.
**What broke**:
1. Applying an animated icon appeared blank / failed to render after restarting Obsidian.
2. When scrolling away in the file explorer and scrolling back, the animated SVG froze on its initial frame and stopped animating.
**Root cause**:
1. `loadLocalCustomIcons()` was deferred to `scheduleIdle()`. On cold start, `hasAnyAnimatedIcons()` ran while `localCustomIcons` was `{}` and cached `_hasAnimatedCache = false` permanently. When custom icons loaded in the background, this cache was never invalidated, leaving the plugin permanently in static icon mode.
2. In Chromium / Blink, SMIL animations with chained event syncbases (e.g. `begin="0;SVGBBjjneux.end+0.15s"`) rely on `endEvent` notifications. When an element is scrolled off-screen, Chromium suppresses event dispatches to save CPU. Because the `.end` event never fires while off-screen, the chained loop permanently dies. Calling `unpauseAnimations()` or `setCurrentTime(0)` on an already-evaluated SVG cannot recover broken chained syncbases.
**Resolution**:
1. Restored synchronous `await this.loadLocalCustomIcons()` in `loadSettings()` (~70ms for 10k icons) and added cache invalidation (`animatedIconService.invalidateCache()`) on icon load and `saveSettings()`.
2. Created `wakeAnimatedElement(el)` in `AnimatedIconService` to replace the dead `<svg>` with a fresh cloned `<svg>` node (`el.replaceChild(freshSvg, oldSvg)`), creating a new active SMIL time container from $t=0$.
3. Hooked `IntersectionObserver` to trigger `wakeAnimatedElement()` whenever animated icons scroll back into view, and triggered `syncAnimatedIcons()` immediately after scrolling settles (80ms debounce).
**Lesson**: Off-screen Chromium SMIL animations with chained syncbases permanently die when off-screen event dispatches are skipped. To reliably resume them on scroll, replace the stalled `<svg>` with a fresh cloned `<svg>` node upon viewport re-entry.

---

## Incident #37 — File Explorer Scroll Lag, Jitter, and Freezing after Outline/Tag Pane Integration (2026-09-25)
**What was attempted**: Adding Outline Pane and Sidebar Tag Pane color synchronization with Flyweight CSS rules, and optimizing active leaf tracking.
**What broke**:
1. Fast scrolling in the File Explorer suffered from severe jitter, stutter, and frame drops (scrolling lag).
2. Note files took noticeably longer to load on click.
3. Gating the staircase stripper broke the staircase pill indentation layout.
**Root cause**:
1. **Unscoped Base CSS Selectors**: `BaseCssGenerator.ts` contained broad global selectors like `body :is(.nav-folder-title, .nav-file-title, .tree-item-self):not([style*="display: none"])`, `body .tree-item-self > *`, and `body .tree-item-inner`. Because `.tree-item-self` and `.tree-item-inner` are used by Obsidian across *all* sidebar panes (Outline, Tag pane, Search, Bookmarks, File Explorer), Chromium evaluated these rules on every DOM node during scrolling, defeating Blink's ancestor Bloom filter and forcing expensive style recalculations and layout cascades.
2. **Broad Ancestor Pseudo-Class Matching**: Top-level compound `:is()` selectors in `OutlineSync.ts` (`body :is([data-type="outline"], .outline-view, .outline) .tree-item-self`) and `TagColorSync.ts` (`body :is(.tag-container, [data-type="tag"], .tag-pane) .tree-item-self`) forced Blink's style resolver to crawl parent ancestor trees on every tree item in the File Explorer.
3. **Unfiltered `active-leaf-change` Handlers**: `EventTrackerService.ts` called `syncTagPaneDataset()` and `updateActiveFolderClasses()` on every leaf focus change, querying the entire workspace DOM and mutating classes even when opening standard markdown notes.
4. **Ribbon Icon Selector Collision**: In `NotebookNavigator.ts`, `NN_SELECTORS.CONTAINERS` matched `.notebook-navigator`, which matched `<svg class="svg-icon notebook-navigator">` in the workspace ribbon, causing DOM observers to hook into SVG elements.
5. **Third-Party Global MutationObserver Crashes**: When `initStaircaseStyleStripper()` stripped inline styles on `.tree-item-self`, global observers in third-party plugins (e.g., `special-callouts`) crashed on SVG elements (`cls.includes is not a function`), blocking the main JavaScript thread during scroll.
**Resolution**:
1. Strictly scoped all File Explorer base CSS rules in `BaseCssGenerator.ts` to `body .nav-files-container`.
2. Strictly scoped Outline styles to `.workspace-leaf-content[data-type="outline"]` and Tag Pane styles to `.workspace-leaf-content[data-type="tag"]`, allowing Chromium's ancestor Bloom filter to instantly reject unrelated panes in $O(1)$ time.
3. Filtered `active-leaf-change` in `EventTrackerService.ts` to only invoke `syncTagPaneDataset()` when `leaf?.view?.getViewType() === "tag"`, and removed redundant `updateActiveFolderClasses()` invocations on leaf change (already handled cleanly by `file-open`).
4. Updated `NN_SELECTORS.CONTAINERS` in `NotebookNavigator.ts` to `.workspace-leaf-content[data-type="notebook-navigator"], .nn-navigation-pane-content, .nn-list-view, .nn-explorer-content, div.notebook-navigator`, preventing SVG ribbon icon matches.
5. Maintained `initStaircaseStyleStripper()` unconditionally active to preserve the staircase design without regressions.
**Lesson**: Never declare generic `.tree-item-self` or `:is()` rules without strictly anchoring them to their specific workspace leaf container (`.nav-files-container`, `.workspace-leaf-content[data-type="..."]`). Unscoped selectors cause Chromium's style resolver to crawl ancestor chains for every DOM element across the entire workspace, leading to severe scroll jitter.

---

## Incident #38 — Tag Coloring & Custom Rules Blocked by Killswitch Gate & Case-Sensitivity (2026-09-25)
**What was attempted**: Enabling tag color styling in notes and the Sidebar Tag Pane via `TagColorSync.ts` with custom rules.
**What broke**:
1. Custom tag color rules defined in settings (`tagSyncRules`) failed to apply in notes and the Tag Pane.
2. In-note Live Preview tags (`#tag`) appeared cramped with zero visual spacing between `#` and the tag label.
3. Tags with uppercase or mixed-case names failed to match in Live Preview editor nodes.
**Root cause**:
1. **Killswitch Blocking Decoupled Custom Rules**: `TagColorSync.generateCss()` contained an early `if (!settings.tagSyncEnabled) return "";` check. If the main toggle was disabled, custom rules were silently skipped even if explicitly configured by the user.
2. **Case-Sensitive Class Matching**: Live Preview emits CSS classes formatted as `.cm-tag-myTag`. CSS class selectors without case-insensitivity flags (`.cm-tag-mytag`) failed when case differed between the rule and note text.
3. **Rigid Parsing Regex**: Regex sanitization stripped non-ASCII/Unicode letters, preventing international tags from matching custom rules.
4. **Hashtag Token Separation**: Live Preview renders tags as two distinct inline spans: `.cm-hashtag-begin` (`#`) and `.cm-hashtag-end` (tag text). Applying `margin-right` to `.cm-hashtag-begin` created an awkward transparent gap inside the colored pill background.
**Resolution**:
1. Decoupled custom rule execution so `tagSyncRules` always evaluate and emit styles regardless of general folder-matching toggle states, and set `DEFAULT_SETTINGS.tagSyncEnabled = true`.
2. Updated Live Preview tag selector to case-insensitive word matching: `body :is([class~="cm-tag-${t}" i], a.tag[href="#${t}" i])`.
3. Added 4px right padding directly on `.cm-hashtag-begin` (`padding-right: 4px !important;`) and `margin-right: 0.15em !important;` on `a.tag::first-letter` for Reading View. This creates a clean, readable separation while keeping the tag pill background, outline, and hover highlights unbroken.
**Lesson**: Always decouple user-defined explicit override rules from automated heuristic toggles, use case-insensitive class attribute selectors (`[class~="..." i]`) for CodeMirror tag tokens, and style multi-token pill spacing using inline padding rather than margin gaps.

---

## Incident #39 — Bootstrap Icons Render Off-Centered, Asymmetrical, and Scaled-Down (2026-10-11)
**What was attempted**: Using Bootstrap icons (`bi-*`) from local packs or downloading the remote Iconify raw icon pack (`https://raw.githubusercontent.com/iconify/icon-sets/master/json/bi.json`).
**What broke**:
1. All 2,090 Bootstrap icons rendered visibly off-centered, shifted toward the top-left, and lacked vertical/horizontal symmetry in both the File Explorer and the Icon Picker modal.
2. Icons appeared ~33% smaller than standard 16x16 / 24x24 icons despite using identical CSS dimensions (`24px`).
**Root cause**:
1. **Iconify Coordinate Grid Standard**: Unlike standard 24x24 icon sets (Feather, Tabler, Boxicons), Bootstrap icons are authored natively on a `16x16` coordinate grid (`0..16`).
2. **Missing Dimensions in Iconify JSON**: Iconify omits root `width` and `height` properties in `bi.json`, placing the default dimension under `info.height: 16`.
3. **Hardcoded 24x24 Fallback**: The downloader (`autoDownloadPack()`), setting importer (`processIconData()`), and SVG normalizer fell back to `24x24` when root dimensions were undefined. Wrapping a 16x16 path into a `0 0 24 24` viewBox confined the vector to the top-left corner with 8px of empty space on the right and bottom, causing off-centering and shrinking.
**Resolution**:
1. Updated `autoDownloadPack()` in `main.ts` and `processIconData()` in `SettingTab.ts` to inspect `data.info?.height`, `data.info?.width`, and explicitly check if `packPrefix === 'bi' || packPrefix === 'bootstrap'` to set default dimensions to `16x16` and produce `viewBox="0 0 16 16"`.
2. Updated all 2,090 stored icons in `icons/bi.json` to use `viewBox="0 0 16 16"`.
3. Added a runtime safeguard in `IconRepository.ts` (`normalizeSvg()`) to automatically normalize legacy Bootstrap icons with `viewBox="0 0 24 24"` to `0 0 16 16` on the fly.
**Lesson**: Always inspect `data.info.height`/`data.info.width` from Iconify manifests before falling back to default dimensions. Never assume all SVG icon packs use 24x24 grids—Bootstrap and Octicons use 16x16 native viewBoxes.

---

## Incident #40 — Uninstalled Icon Pack Shows "Installed (2 icons)" Due to Substring Matching (2026-10-11)
**What was attempted**: Removing the Bootstrap icon pack via Settings → Featured Icon Packs → Remove.
**What broke**:
After clicking "Remove", the pack badge changed to `✓ Installed (2 icons)` (or `3 icons`) and the button showed "Re-Download" instead of "Not installed". The 2–3 phantom icons were nowhere to be found in the Icon Picker modal.
**Root cause**:
1. **Loose Substring Matching**: In `IconSettingSection.ts` (`matchPack()`), `StyleGenerator.ts` (`matchesPackPrefix()`), and `IconPackIndex.ts` (`matchesPackId()`), Bootstrap detection checked `lower.startsWith('bi-') || lower.includes('bootstrap')`.
2. **Cross-Pack Icon Collisions**: Other installed packs (such as Simple Icons and Tabler) contained brand logos named `simple-icons-bootstrap`, `simple-icons-reactbootstrap`, and `tabler-brand-bootstrap`.
3. Because these IDs contained the substring `'bootstrap'`, they were falsely tallied as installed Bootstrap icons even though `bi.json` was completely removed from disk.
**Resolution**:
Replaced `lower.includes('bootstrap')` with strict prefix matching: `lower.startsWith('bi-') || lower.startsWith('bootstrap-') || lower.startsWith('bi:')` across `IconSettingSection.ts`, `StyleGenerator.ts`, and `IconPackIndex.ts`.
**Lesson**: Never use loose substring inclusion (`includes()`) for pack membership, counting, or categorization. Always match on strict pack prefix boundaries (`startsWith("<prefix>-")`).

---

## Incident #41 — All Folder Icons Turn Black/Gray in Hierarchy Mode Following Palette Pairing Refactor (2026-11-08)
**GitHub Issue**: [#33](https://github.com/RohitNahar-Offical/colorful-folders-obsidian/issues/33)
**What was attempted**: Adding text and icon color pairings for custom palette colors (`palettePairs`), publishing `--cf-color` CSS properties, and adding theme contrast state to `<body>` (PR #32).
**What broke**:
In v5.0.7, ALL folders on all levels became black (in light mode) or gray (in dark mode) when using "Hierarchy level" color generation mode. Only files retained the correct hierarchy colors, completely breaking the CherryTree-style hierarchy visualization (Issue #16).
**Root cause**:
1. **Accidental Omission of `color.hex` in Fallback Chain**:
   - In v5.0.6, folder icon color evaluated via:
     `const effFolderIconColor = customStyle?.iconColor || inheritedStyle?.iconColor || color.hex || folderStyles.t;`
   - In v5.0.7, PR #32 refactored folder icon resolution to support paired palette icons:
     `const pairedIconColor = customStyle?.iconColor || inheritedStyle?.iconColor || palettePair?.icon || folderStyles.t;`
     `const effFolderIconColor = pairedIconColor;`
   - Notice that `color.hex` was completely dropped from the fallback chain under the false assumption that folder icons should always match the text color (`folderStyles.t`).
2. **Coupling Icon Color to Text Color**:
   - When a user does not color folder text (`colorText: "none"` or `colorText: "files"`, typical for icon-only CherryTree setups), `ColorResolver.resolveTextColor()` returns `var(--text-normal)`.
   - In Obsidian, `var(--text-normal)` renders as black (`#222222` / `#111111`) in Light Mode and gray (`#dcddde`) in Dark Mode.
   - Because `palettePair?.icon` was undefined by default, `pairedIconColor` fell back directly to `folderStyles.t` (`var(--text-normal)`), rendering every folder icon in neutral text color instead of its resolved hierarchy palette color.
   - Meanwhile, file icon generation (`StyleGenerator.ts:479 & 497`) was untouched in PR #32 and still retained `iconColor || color.hex || textNative`, allowing files to show correct level colors while folders lost all color.
**Resolution**:
Restored `color.hex` in `src/core/StyleGenerator.ts:706` within `pairedIconColor`:
```typescript
const pairedIconColor = customStyle?.iconColor || inheritedStyle?.iconColor || palettePair?.icon || color.hex || folderStyles.t;
```
This guarantees that explicit icon selections (custom, inherited, or palette-paired) take top precedence, but uncustomized folders cleanly inherit their assigned palette color (`color.hex`) for all color modes (Hierarchy, Cycle, Monochromatic, Heatmap), with `folderStyles.t` acting solely as the final failsafe.
**Lesson**: NEVER remove `color.hex` from the icon resolution fallback chain or assume icon color should unilaterally tether to `folderStyles.t`. Keep icon and text color resolution independent so users configuring icon-only visual hierarchies (`colorText: "none"`) retain full palette color generation on folder icons.

---

## Incident #42 — Parent Folder Context Leaking into Custom User Rules (2026-11-08)
**What was attempted**: Extending custom icon rules with explicit target scoping (`::folders`, `::files`, `::all`) to allow users to assign icons to specific folder or file names via exact strings or regex patterns (e.g. `resource = lucide-folder ::folders`).
**What broke**:
When a user defined a rule matching a folder name, every note, file, and subfolder *inside* that folder unexpectedly inherited the rule's icon as well (e.g. `resource/note.md` was rendered with `lucide-folder`), completely hijacking child file icon resolution.
**Root cause**:
1. **Contaminated Context Array**: In `IconRepository.ts:getAutoIconData()`, the candidate contexts array (`searchContexts`) originally accumulated:
   ```typescript
   const searchContexts = [lName, sanitized, cleanSanitized];
   if (parentFolder) {
       searchContexts.push(parentFolder.toLowerCase());
   }
   ```
2. **Context Bleed During Tier 0.8 Evaluation**: When evaluating Tier 0.8 Custom User Rules via `ruleSet.evaluate(searchContexts, isFolder)`, every child file received its parent directory's name as its 4th search context.
3. If a user rule matched `"resource"` (with `::folders` or without), and a folder was named `"resource"`, child note `resource/meeting.md` passed `searchContexts = ["meeting.md", "meeting", "meeting", "resource"]`. The rule engine matched the 4th context (`"resource"`), erroneously overriding the child note's own icon resolution.
**Resolution**:
1. Strictly segregated candidate contexts into two isolated layers:
   - `itemContexts`: exclusively the item's own name variants `[lName, sanitized, cleanSanitized]`, strictly omitting `parentFolder`.
   - `searchContexts`: includes `itemContexts` plus `parentFolder.toLowerCase()` (reserved exclusively as a secondary heuristic hint for Tier 2/3 Category Trie classification).
2. Tier 0.8 Custom Rules now evaluate exclusively against `itemContexts`:
   ```typescript
   const customRuleResult = this._ruleSet.evaluate(itemContexts, isFolder);
   if (customRuleResult) {
       return { ...customRuleResult, packSource: customRuleResult.packSource || 'custom-rule' };
   }
   ```
3. Added target scoping (`folders`, `files`, `all`) with dual-bucket routing ($O(1)$ exact lookup maps and priority-sorted regex arrays) and dedicated 2048-entry LRU caching inside `IconRuleSet.ts`.
**Lesson**: User-defined custom rules (both exact matches and regular expressions) must evaluate strictly against the node's own name. Never inject directory ancestry or parent folder names into custom pattern evaluation chains. Directory ancestry should only ever serve as a low-priority classification hint in semantic category fallbacks.

---

## Incident #44 — Sync Amplification, Full Stylesheet Rebuild Lag, CJK Icon Gaps & AI Override Lockout (GitHub Issue #34) (2026-11-19)
**What was reported**:
1. `data.json` self-write listener caused a cross-device sync amplification loop in vaults synced via Obsidian Sync, iCloud, or WebDAV.
2. `generateStyles()` was always a full rebuild with no incremental short-circuit, continuously tearing down and replacing the entire CSSOM via `sheet.replaceSync(css)` even on byte-identical output.
3. `iconSource: "embedding"` entries permanently shadowed user rules in `customIconRules`, with no UI button to clear only AI-assigned icons.
4. Built-in icon rule table contained zero CJK (Chinese, Japanese, Korean) patterns, forcing standard folders like `笔记`, `项目`, `归档` to render default closed-folder icons.
5. Files lacked a per-state icon (`activeIconId`), whereas folders supported `expandedIconId`.
6. `vaultPassword` was serialized in plaintext in `data.json`.

**Root cause**:
1. `EventTrackerService.ts` registered `app.vault.on("modify")` for `data.json` without distinguishing self-writes from external sync events. Every local `saveSettings()` fired `modify`, triggering `loadSettings()` $\to$ `generateStyles()` $\to$ sync writeback on other devices.
2. `AdoptedStyleSheetService.updateStyles()` called `sheet.replaceSync(css)` unconditionally without caching `lastAppliedCss`.
3. In `StyleGenerator.ts`, `customStyle.iconId` was evaluated before `customIconRules` regardless of `iconSource`, allowing embedding suggestions to permanently lock out user rule updates.
4. `AUTO_ICON_CATEGORIES` relied on `\b` word boundaries and English-only terminology. CJK ideograms have no word boundaries and were omitted.
5. `FolderStyle` interface lacked `activeIconId` support for files.
6. `vaultPassword` lacked a hashing layer.

**Resolution**:
1. Implemented dual-guard write suppression in `main.ts` (`isSelfSavingSettings` and `lastSavedSettingsJson` fingerprint comparison in `EventTrackerService.ts`).
2. Added `lastAppliedCss` short-circuit in `AdoptedStyleSheetService.ts` and `lastGeneratedCss` in `main.ts`, bypassing `sheet.replaceSync` when CSS is unchanged.
3. Allowed `customIconRules` to override `embedding`/`ai-*` suggestions, and added a dedicated "Clear AI & Embedding Icons" button in `AISettingSection.ts`.
4. Added 20 comprehensive CJK category patterns to `AUTO_ICON_CATEGORIES` in `constants.ts` covering notes, projects, archives, images, media, math, code, algorithms, OS, and journals.
5. Added `activeIconId` support in `types.ts`, `ColorPickerModal.ts`, and `StyleGenerator.ts` targeting `.nav-file-title.is-active[data-path="..."] .nav-file-title-content::before`.
6. Migrated `vaultPassword` to `vaultPasswordHash` (SHA-256).

**Lesson**: Always protect synchronized configuration files against self-write echo loops with both in-flight locks and content fingerprints. Never re-parse constructable stylesheets when CSS string output is byte-identical. User-authored rules must unconditionally outrank automated machine-learning suggestions. Always provide CJK regexes without ASCII `\b` boundaries for international users.

---

## Incident #45 — Dynamic Animated SVG Parsing & Malformed URI Crash on Keyframes/Percentage Encoding (2026-11-19)
**What was reported**:
1. Console errors: `URIError: URI malformed at decodeURIComponent` inside `NotebookNavigator.generateIntegratedStyles`, `traverse`, and `IconRepository.normalizeSvg`.
2. Vector attribute errors: `<svg> attribute x: Expected length, "\\\"0\\\""`, `<path> attribute d: Expected moveto path command, "\\\"M89.284"`.
3. Animated icon packs (such as `line-md`) failed to render or rendered as blank invisible squares.
4. Color picker / icon picker preview grid crashed or showed empty tiles when recent history contained invalid/stale icon identifiers (e.g. `qw`).
5. Icon picker lacked an explicit filter for animated icon collections.

**Root cause**:
1. **Unshielded decodeURIComponent on CSS Keyframes**: Many animated SVGs (`line-md`, CSS keyframe loaders) contain raw CSS `@keyframes` blocks with percentage milestones (e.g. `0%`, `50%`, `100%`). Passing SVGs containing `%` directly into native `decodeURIComponent()` threw unhandled `URIError: URI malformed` whenever `%` was followed by non-hex sequences.
2. **Backslash-Escaped JSON Quotes**: When saving or reloading custom animated SVG bodies, unescaped literal backslash quotes (`\"`) leaked into SVG attributes, causing XML parser errors (`Expected length, "\\\"0\\\""`).
3. **Stroke Erasure in normalizeSvg**: `IconRepository.normalizeSvg()` only assigned `stroke="currentColor"` when `hasStroke && !hasFill`. Many stroke-based animated icons contain paths with both properties or no fill attribute, causing the stroke to be omitted and rendering icons invisible.
4. **Stale Recent History**: `recentlyUsedIcons` accumulated invalid icon keys (`qw`) that were not validated against `isValidIcon()`, producing broken DOM preview nodes in the modal grid.

**Resolution**:
1. Wrapped all `decodeURIComponent` calls in `try...catch` blocks across `NotebookNavigator.ts` and `IconRepository.ts`, with safe raw-string fallback if URI decoding fails.
2. Sanitized SVG strings with `.replace(/\\"/g, '"')` before XML/HTML DOM parsing in `IconRepository.ts` and `IconPickerModal.ts`.
3. Updated `IconRepository.normalizeSvg()` to unconditionally ensure `svg.setAttribute('stroke', 'currentColor')` whenever `hasStroke` is true.
4. Filtered `recentlyUsedIcons` using `isValidIconId()` and unified custom icons with `localFileSystemIcons` in `IconPickerModal.ts`. Added a dedicated `'animated': '✨ ANIMATED ICONS'` category filter in the icon picker modal.

**Lesson**: Never call `decodeURIComponent()` on arbitrary SVG source strings without defensive `try...catch` guards. Animated SVGs frequently contain CSS keyframe percentage signs that are not percent-encoded URI entities. Always sanitize stringified quote escaping and preserve stroke definitions for line-based icon sets.

---

## Incident #46 — Disappearing File Icons Caused by Overly Broad Double-Icon Suppression (2026-11-19)
**What was reported**:
File icons disappeared completely across the entire file explorer (e.g., standard notes under `Atlas > Dots > People` lost their document/auto icons).

**Root cause**:
1. **Relational Pseudo-Class Inadvertent Global Match**: To fix duplicate icons on Canvas (`.canvas`) and Excalidraw (`.excalidraw`) files (which render native `.tree-item-icon` elements alongside Colorful Folders' `::before` pseudo-element), an over-broad `:not(:has(> .tree-item-icon:not(.collapse-indicator):not(.collapse-icon)))` relational selector was added to `fileIconSels` in `StyleGenerator.ts`, along with a matching global suppression rule in `BaseCssGenerator.ts`.
2. When third-party plugins (such as `iconic` or *Novel Word Count*) or native Obsidian tree elements place icon containers or tags in file tree items, the `:has(> .tree-item-icon)` selector matched true. As a result, `:not(:has(...))` evaluated to false, completely suppressing the `::before` pseudo-element icon across all standard `.md` files in the vault.

**Resolution**:
1. Restored universal file icon selectors in `StyleGenerator.ts`:
   ```typescript
   const fileIconSels = fileTextSels.map(s => s + '::before');
   ```
2. Confined double-icon suppression strictly and explicitly to `.canvas` and `.excalidraw` file extensions in `BaseCssGenerator.ts`:
   ```css
   body .nav-files-container [data-path$=".canvas"]:not(.cf-has-custom-icon) .nav-file-title-content::before,
   body .nav-files-container [data-path$=".canvas"]:not(.cf-has-custom-icon) .tree-item-inner::before,
   body .nav-files-container [data-path*=".excalidraw"]:not(.cf-has-custom-icon) .nav-file-title-content::before,
   body .nav-files-container [data-path*=".excalidraw"]:not(.cf-has-custom-icon) .tree-item-inner::before {
       display: none !important;
       content: none !important;
   }
   ```
3. Guarded `StyleGenerator.ts` so Canvas and Excalidraw files without explicit custom icons (`!rawFileIcon`) do not receive auto-assigned or default file icons, while files with explicit custom icons hide the native icon via `hideNativeTreeIcon_${safePath}`.
4. Hardened default file icon mask `CF_FILE_TEXT_ICON_MASK_URL` with explicit `#000000` stroke to ensure 100% opaque mask alpha across all Chromium contexts, and restored `margin-right: 4px` and `align-self: center`.

**Lesson**: Never use global `:has()` relational selectors to suppress pseudo-elements when third-party plugins may inject child elements into tree nodes. Always scope format-specific conflicts (such as Canvas `#` or Excalidraw pencil icons) strictly to their file extensions (`[data-path$=".canvas"]`, `[data-path*=".excalidraw"]`).

---

## Incident #47 — File Explorer Scroll Lag and Stutter via Full-DOM Scanning (2026-11-19)
**What was reported**:
Severe stuttering, frame drops, and lag when scrolling through the File Explorer tree.

**Root cause**:
1. **Full-DOM Query on Every Scroll Frame**: `DOMObserverService.ts` bound a scroll listener to every file explorer container. Every 80ms during scrolling, and on every `MutationObserver` frame, it triggered `AnimatedIconService.syncAnimatedIcons()`.
2. Inside `syncAnimatedIcons()`, the code ran:
   ```typescript
   const visibleRows = container.querySelectorAll<HTMLElement>(
       '.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file'
   );
   ```
   For every row in the entire vault DOM (often 1,000+ nodes), it called `.matches()`, string slicing, `getAutoIconData()`, category trie matching, `resolveAutoIconCandidate()`, and `isAnimatedIcon()` regular expression evaluations on the main thread, producing 100-200ms frame stalls.

**Resolution**:
1. **Pre-Registration during Style Generation**: Transferred animated target discovery into `StyleGenerator.generateCss()`. Because `StyleGenerator` already traverses every folder and file in the vault, any path that resolves to an animated icon is pre-registered in `AnimatedIconService._registeredAnimatedTargets` in $O(1)$ memory.
2. **Eliminated Full-DOM Scanning**: Completely removed `container.querySelectorAll` from `syncAnimatedIcons()`. `hasAnyAnimatedIcons()` and `syncAnimatedIcons()` now check only configured settings and `_registeredAnimatedTargets`.
3. If no animated icons are in use, `syncAnimatedIcons()` exits in < 0.001ms. If animated icons exist, it queries only those specific paths via targeted `querySelector([data-path="..."])`.
4. Added `_isAnimatedIconCache` memoization map to eliminate redundant SVG regular expression checks.
5. In `DOMObserverService.ts`, set `isScrollingPublic = true` during active scrolling to suppress mutation observer sync callbacks, and increased scroll debounce to 120ms.

**Lesson**: Never execute `querySelectorAll` sweeps or auto-icon classification inside scroll listeners or mutation observer callbacks. Pre-register dynamic targets during stylesheet generation so runtime DOM synchronization is strictly $O(K)$ where $K$ is the number of active animated elements.

---

## Incident #48 — Disappearing File Icons in Notebook Navigator via Container Slot Omission (2026-11-19)
**What was reported**:
Standard notes in Notebook Navigator (e.g. `Atlas > Dots > People > Arnold Schwarzenegger.md`, `Bill Russell.md`) lost their file icons completely, displaying an empty blank gap in front of the filename even though folder icons (`Atlas`, `Dots`, `People`) were displaying properly.

**Root cause**:
1. **Empty Container Slot in Notebook Navigator**: In Notebook Navigator's DOM architecture, file rows render `<div class="nn-file-inner-content">`. If a file has no custom icon or preset assigned inside Notebook Navigator, it renders `<div class="nn-file-icon-slot"></div>` with **no** child `<span class="nn-file-icon">` element (the span child is `null`).
2. **Selector Target Mismatch**: In an earlier optimization, `NotebookNavigatorIntegration.ts` refactored `iconTarget` from `:is(.nn-file-icon, .nn-file-icon-slot)` to strictly `body .notebook-navigator .nn-file[data-path="${safePath}"] .nn-file-icon`. Because `.nn-file-icon` did not exist in the DOM for uncustomized files, the CSS selector matched 0 elements, leaving `.nn-file-icon-slot` completely empty.
3. **File Background Gating Overlap**: In `src/core/StyleGenerator.ts`, `generateIntegratedStyles()` for files was gated behind `if (nnFileBgActive)`, which checked `notebookNavigatorFileBackground`. If a user desired uncolored or default-background files in Notebook Navigator, file icon and typography generation was suppressed entirely.
4. **Data-URI Mask Stroke Opacity**: `CF_FILE_DEFAULT`, `CF_FOLDER_CLOSED`, and `CF_FOLDER_OPEN` in `constants.ts` used `stroke="currentColor"`. When loaded inside isolated CSS data-URI image contexts (`url("data:image/svg+xml,...")`), `currentColor` could fail to provide 100% opaque alpha strokes in certain Blink/WebKit rendering pipelines.

**Resolution**:
1. **Dual-Target Selector Bridge**: Updated `NotebookNavigator.ts` to target both `.nn-file-icon-slot` and `.nn-file-icon:not(.nn-file-icon-slot *)` via an array of selectors (`iconTargets`), adding `flex: 0 0 auto !important; flex-shrink: 0 !important;` to ensure slot dimensions are rock-solid.
2. **Flattened Child Suppression**: Replaced string-concatenated selector lists with `.flatMap()` targeting `${target} > svg` and `${target} > span` to prevent trailing comma selector syntax bugs.
3. **Decoupled File Styling from Background Toggle**: In `src/core/StyleGenerator.ts`, file integration styles are now generated whenever `NotebookNavigatorIntegration.isSupported(this.settings)` is true, allowing `shouldColorNN` to independently gate colored background blocks while preserving file icons and text colors.
4. **Opaque Alpha Mask Hardening**: Hardened `constants.ts` default SVG constants with explicit `#000000` stroke to ensure 100% opaque mask alpha across all browser engines.
5. **Animated Slot Integration**: Added `.nn-file-icon-slot` to `AnimatedIconService.ts` query selectors to ensure live animated SVGs mount properly in Notebook Navigator file rows.

**Lesson**: When styling third-party plugin containers, always inspect whether the container renders wrapper slot elements (`.slot`) or child target elements (`.icon`). Use dual-targeting with `:not(.slot *)` exclusions to guarantee matching whether the child element exists or the slot is empty, without creating duplicate icons.

---

## Incident #49 — Missing Icons on Canvas and Excalidraw Files via Special Format Suppression (2026-11-19)
**What was reported**:
`.canvas` and `.excalidraw` (and `.excalidraw.md`) files had no visual icons displayed in normal vaults unless explicitly assigned a manual custom icon.

**Root cause**:
1. An earlier workaround intended to avoid duplicate icons on native canvas/excalidraw files introduced an `isSpecialFormat` gate in `StyleGenerator.ts` (`if (!isSpecialFormat || rawFileIcon)`), blocking auto-icon resolution and fallback icon generation for these extensions.
2. In addition, `BaseCssGenerator.ts` contained a hardcoded rule suppressing `::before` pseudo-elements on `[data-path$=".canvas"]:not(.cf-has-custom-icon)` and `[data-path*=".excalidraw"]:not(.cf-has-custom-icon)`. Because `.cf-has-custom-icon` was never applied as a class to DOM elements, this rule unconditionally stripped all icons from canvas and excalidraw files.
3. Neither `canvas` nor `excalidraw` was mapped in `EXTENSION_AUTO_ICONS` (Tier 0.9).

**Resolution**:
1. Added first-class mappings for `canvas` (`lucide: 'frame'`) and `excalidraw` (`lucide: 'pencil-ruler'`) in `EXTENSION_AUTO_ICONS` in `IconRepository.ts`.
2. Supported both `.excalidraw` and `.excalidraw.md` in Tier 0.9 extension lookups.
3. Removed `isSpecialFormat` suppression gates from `StyleGenerator.ts`, allowing auto-icons, rules, and AI icons to resolve cleanly.
4. Removed the hardcoded CSS suppression rule from `BaseCssGenerator.ts`.
5. Retained path-specific `hideNativeTreeIcon_${safePath}` to hide Obsidian's native unstyled `.tree-item-icon`, cleanly replacing it with the colorful theme icon without duplicate icon artifacts.

**Lesson**: Avoid hardcoded CSS format suppressions based on unmanaged utility classes. Map unique file formats (`.canvas`, `.excalidraw`) directly in extension auto-icon dictionaries, and replace native icons via targeted path-level rules.

---

## Incident #50 — Missing "Line icons (Animated)" in Pack Priority Order & Alphabetical ExactMap Override (2026-11-19)
**What was reported**:
1. In the Icon Settings tab, the "Line icons (Animated)" pack was installed, but missing from the "Icon pack priority hierarchy" list card.
2. Changes to pack priority order in the settings hierarchy failed to alter icon resolution for common keyword stems because alphabetical pack sorting took precedence over priority rankings.

**Root cause**:
1. **Missing Constant Declarations**: `'line-md'` was not present in `DEFAULT_ICON_PACK_ORDER`, `DEFAULT_SETTINGS.iconPackPriorityOrder`, `PACK_PRIORITY`, `PACK_PREFIXES`, `ICON_PREFIX_REGEX`, or `packLabels` in `IconSettingSection.ts`.
2. **Alphabetical Overwrite in ExactMap**: In `IconPackIndex.ts`, `addIconKey()` stripped prefixes and inserted entries into `exactMap` and `suffixMap` using a naive `if (!this.exactMap.has(noPrefix))` check without comparing priority. Because local icons were iterated in alphabetical order (`Object.keys().sort()`), alphabetically earlier packs (such as `bi-` for Bootstrap) permanently locked the map entry, ignoring higher-ranked packs (such as `line-md-` or `lucide-`).
3. **Candidate Keyword Bypass in Auto-Icons**: When category rules returned a generic candidate keyword like `"search"` or `"folder"`, `resolveAutoIconCandidate()` only checked if the string began with `packId-`. If the keyword was unprefixed, it defaulted to Lucide and never probed whether a higher-ranked custom or animated pack possessed that icon.

**Resolution**:
1. **Added `line-md` to Priority Constants**:
   - Registered `'line-md'` in `DEFAULT_ICON_PACK_ORDER` (rank #3, between `lucide` and `bootstrap`).
   - Added `'line-md': 85` and `'bootstrap': 55` in `PACK_PRIORITY`.
   - Added `'line-md'` and `'linemd'` to `PACK_PREFIXES` and `ICON_PREFIX_REGEX`.
   - Added `'line-md': 'Line icons (Animated) (line-md-)'` to `packLabels` in `IconSettingSection.ts`.
2. **Priority-Aware `exactMap` and `suffixMap` Ingestion**: Updated `IconPackIndex.ts` so `exactMap` (for `noPrefix`) and `suffixMap` (for `suffix`) compare `newPrio > existingPrio` before replacing keys, guaranteeing that user-configured priorities strictly govern prefix-stripped matches.
3. **Priority Probing in `resolveAutoIconCandidate`**: Added `this.plugin.iconManager.findIconInPacks(candidateKey)` probing against the active `packId`, enabling high-priority installed packs (like animated Line Icons) to fulfill standard category rules seamlessly.
4. **Auto-Migration on Startup**: In `src/main.ts` `loadSettings()`, automatically merge any missing default packs into existing `iconPackPriorityOrder` settings while pinning `emoji` to the tail.

**Lesson**: Never populate priority-sensitive lookup maps using a first-write-wins (`!map.has(key)`) strategy when the input keys are alphabetically sorted. Always evaluate `newPrio > existingPrio` so user configuration strictly governs resolution.

---

## Incident #51 — Overlapping Static & Dynamic Icons on Folder Open/Close Actions & Optical Sizing Discrepancies (2026-11-20)
**What was reported**:
1. When a user assigned a static Lucide icon for the "Closed Folder" action and an animated SMIL/CSS dynamic icon for the "Open Folder" action (or vice versa), both icons rendered concurrently and overlapped on screen when the folder was opened or closed.
2. Animated SVGs rendered noticeably smaller than standard static icons, despite identical font size metrics.

**Root cause**:
1. **Scalar Target Tracking**: `AnimatedIconService` tracked animated rows using a scalar `iconId: string` inside `_registeredAnimatedTargets: Map<string, string>`. It could not distinguish whether the animated icon applied strictly to the closed state, open state, or both states.
2. **Coarse CSS Suppression**: `BaseCssGenerator.ts` applied a blanket suppression rule (`.cf-animated-icon-active::before { display: none !important; }`). When a folder had an animated icon for ONLY ONE action (e.g. open), this blanket rule either permanently suppressed the static icon in the other action, or if bypassed, caused the static CSS mask `::before` pseudo-element and the live SVG DOM element to display simultaneously.
3. **Optical ViewBox Metrics**: Static Lucide icons are injected via CSS masks using `var(--cf-icon-size, 1em)` with edge-to-edge geometry. Animated icons in `line-md` utilize embedded margins inside 24x24 viewBoxes, causing them to render ~15% smaller optically when rendered at identical CSS `em` dimensions.

**Resolution**:
1. **Granular State Architecture (`RegisteredAnimatedTarget`)**: Refactored `_registeredAnimatedTargets` to store `{ closedIconId?: string; openIconId?: string; iconId?: string }`.
2. **State-Scoped Target Registration**: `registerActiveAnimatedTarget(path, iconId, 'closed' | 'open' | 'both')` tracks folder open/close targets independently.
3. **Fine-Grained CSS Pseudo-Element Suppression**: Replaced blanket row suppression with scoped state rules in `BaseCssGenerator.ts`:
   ```css
   .nav-folder:not(.is-collapsed) > .cf-has-animated-open .nav-folder-title-content::before { display: none !important; }
   .nav-folder.is-collapsed > .cf-has-animated-closed .nav-folder-title-content::before { display: none !important; }
   ```
4. **State-Aware Mounting**: `syncAnimatedIcons()` mounts `.cf-live-animated-icon.cf-animated-closed` and `.cf-live-animated-icon.cf-animated-open` with CSS rules toggling `display: none !important` based on `.is-collapsed`.
5. **Optical Sizing Factor**: Scaled all animated icons to `calc(1.3em * iconScale * wideScale * 1.15)` across `BaseCssGenerator.ts` and `StyleGenerator.ts`.

**Lesson**: When supporting dual-action visual states (open vs. closed), never represent dynamic targets with scalar identifiers. Use state-specific registration and high-specificity state-scoped CSS suppression rules to allow static CSS masks and live DOM SVGs to coexist without interference.

---

## Incident #52 — Inoperative "Shuffle icons" Button via Omitted Variety Seed & Cache Invalidation Failure (2026-11-20)
**What was reported**:
Clicking the "Shuffle icons" button in **Settings > Icon Settings** had no visual effect on the vault; icon assignments remained unchanged.

**Root cause**:
1. **Omitted Seed in Hash Calculation**: In `IconRepository.ts:306-314`, variety icons were resolved using:
   ```typescript
   const h = hashString(name);
   match.lucide = match.lucides[h % match.lucides.length];
   ```
   `settings.varietySeed` was completely omitted from `h`. As a result, `h` was 100% deterministic based solely on item name and never changed regardless of seed values.
2. **Missing Cache Invalidation**: `IconRepository` memoizes resolved auto-icons in `_autoIconResultCache`. The button click handler in `IconSettingSection.ts` saved `settings.varietySeed` and triggered debounced styling, but failed to invalidate `_autoIconResultCache` or `animatedIconService` caches.
3. **Array Fallback Order**: Downstream pack resolution in `StyleGenerator.ts` inspected `match.lucides[0]` if custom packs were configured, which did not reflect the variety selection.
4. **Silent Action**: Clicking the button provided zero visual feedback (no Obsidian `Notice`).

**Resolution**:
1. **Integrated Seed into Hash Key**: In `IconRepository.ts`, updated variety resolution to factor in the seed:
   ```typescript
   const seed = settings.varietySeed || 0;
   const baseStr = path || name;
   const hashKey = seed !== 0 ? `${baseStr}#${seed}` : baseStr;
   const h = hashString(hashKey);
   ```
2. **Array Rotation**: Rotated `match.emojis` and `match.lucides` arrays (`[selected, ...remaining]`) so that downstream pack resolvers and fallback chains always prioritize the variety pick.
3. **Self-Healing Cache Guards**: Added `_lastVarietySeed` and `_lastVarietyEnabled` tracking in `getAutoIconData()` to automatically clear `_autoIconResultCache` on seed or toggle changes.
4. **Immediate Flush & Notice**: In `IconSettingSection.ts`, clicking "Shuffle icons" clears `iconManager` and `animatedIconService` caches, generates styles immediately (`await this.plugin.generateStyles()`), and displays `new Notice('🎲 Variety icons shuffled successfully!')`.

**Lesson**: Random seed features must always be factored into the mathematical hashing formula, backed by self-healing cache invalidation guards, and verified across all fallback resolution chains.

---

## Incident #53 — Cold Start Regex Overhead, Unbounded Reload Detached Elements, & Observer CPU Inefficiencies (2026-11-20)
**What was reported**:
Auditing cold start, plugin reload, and file explorer scrolling revealed potential main-thread lag, redundant setting scans, and memory retention during plugin reload/unload.

**Root cause**:
1. **Cold Start Regex Evaluation**: `isAnimatedIcon(iconId)` was called for every file and folder in the vault during initial style generation. For uncached icons, it read the raw SVG and ran regular expressions on every node.
2. **Scroll-Sync Full Map Rescans**: `syncAnimatedIcons()` re-iterated through all entries in `customFolderColors` and `customIcons` on every scroll debounced frame, creating $O(N)$ CPU load instead of relying on the active targets already registered during style generation ($O(K)$).
3. **Detached DOM SVGs on Reload**: `AnimatedIconService.destroy()` disconnected its `IntersectionObserver`, but failed to remove `.cf-live-animated-icon` elements and animation state classes from the Obsidian DOM. On plugin reload, duplicate elements and stale classes accumulated.
4. **Unconditional Document Click Listeners**: `EventTrackerService.registerClickEventsForDoc()` attached a document-wide click handler that traversed DOM rows and scheduled timeouts on every click even when no animated icons were in use.

**Resolution**:
1. **$O(1)$ Prefix Check**: Added instant prefix checks for `line-md-` / `linemd-` in `isAnimatedIcon()`, bypassing raw SVG retrieval and regex evaluation for the animated pack.
2. **$O(K)$ Fast Path for Viewport Synchronization**: `syncAnimatedIcons()` now reads directly from `_registeredAnimatedTargets`, turning scroll synchronization into an instant $O(K)$ operation ($\le 0.001$ms).
3. **Complete Teardown (`clearAllLiveAnimatedIconsFromDom()`)**: On plugin destroy, removes all live animated SVG elements from the DOM, strips row state classes, clears container scroll listeners (including Notebook Navigator), and frees LRU caches.
4. **Zero-Cost Click & File-Open Bypass**: Added `hasAnyAnimatedIcons()` early exits to click and `file-open` event handlers.

**Lesson**: High-frequency listeners (scroll, click, file-open) must always have an $O(1)$ feature-flag early exit. Plugin teardown must actively remove all injected DOM nodes and classes to prevent memory leaks and duplicate elements across reloads.








