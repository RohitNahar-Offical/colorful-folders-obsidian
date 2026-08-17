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
