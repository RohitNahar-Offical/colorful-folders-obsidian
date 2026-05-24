# 🚨 INCIDENT LOG — THINGS THAT BROKE & WHY

This file records real bugs that happened during development.
Read before making ANY architectural changes.

---

## Incident #1 — CSS Variable Refactor (2026-05-06)
**What was attempted**: Replace `<style>` tag with CSS variables applied directly to DOM elements.
**Why it was done**: To pass Obsidian store linter rule `obsidianmd/no-forbidden-elements`.
**What broke**:
- Random vertical lines appeared in the file explorer.
- Colors disappeared after scrolling (DOM virtualization issue).
- Icons misaligned — floated outside folder rows.
- Top-level folder colors vanished after subfolder was expanded.
**Root cause**: DOM-based styling cannot handle Obsidian's virtual scroll list. When rows are recycled during scroll, the inline styles are lost.
**Resolution**: Reverted to `<style>` tag. Added linter comment with description.
**Lesson**: NEVER use DOM-based styling for the color engine.

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
**Why it was done**: This was the original stable architecture for CSS injection.
**What broke**: The Obsidian store bot rejected the submission — disabling the `no-forbidden-elements` rule is never permitted, even with a description.
**Resolution**: Replaced `createEl("style")` with the native `CSSStyleSheet` API:
- `initializeStyles()` → `new CSSStyleSheet()` + `document.adoptedStyleSheets`
- `generateStyles()` → `this.sheet.replaceSync(css)`
- `onunload()` → filter the sheet out of `adoptedStyleSheets`
- `StyleGenerator.ts` was **not touched** — same CSS string, different delivery
**Lesson**: The `CSSStyleSheet` API is the correct, linter-compliant way to inject dynamic CSS in Obsidian plugins. It is functionally identical to a `<style>` tag for virtualised lists and never triggers `no-forbidden-elements`.
---

## Incident #6 — Store Rejection: Unsafe any & Unused Variables (2026-05-07)
**What was attempted**: Implementing Backup/Restore functionality with standard JSON parsing and object destructuring.
**Why it was done**: To allow users to export and import their folder/divider configurations.
**What broke**: The Obsidian store bot rejected the submission with "Unexpected any. Specify a different type." and "Async arrow function has no 'await' expression."
**Root cause**: 
- `JSON.parse` returns `any`, leading to unsafe member access errors.
- Object destructuring used to "omit" properties (e.g., `const { hasDivider, ...folderProps } = value`) created unused variables.
- Using `document.createElement` instead of `activeDocument.createEl` triggered "prefer-create-el" warnings.
**Resolution**:
- Created a `BackupData` interface to type the `parsed` object.
- Replaced property destructuring with an explicit `delete` loop on a shallow clone.
- Replaced `document` with `activeDocument` for popout window compatibility.
- Fixed unnecessary type assertions and removed unused `async` keywords.
**Lesson**: Always run the linter (`node node_modules/eslint/bin/eslint.js`) before pushing, especially after adding new features that use generic objects or DOM manipulation.

---

## Incident #7 — Notebook Navigator Flickering (2026-05-12)
**What was attempted**: Implementing Notebook Navigator backgrounds and icons via DOM manipulation (`IconManager` adding classes and inline styles).
**Why it was done**: To create a cleaner "CSS Variable Bridge" between plugins.
**What broke**: 
- Background colors "flickered" (showed white for a split second) during scroll.
- Icons occasionally disappeared or moved during rapid scrolling.
- Some rows remained completely uncolored if scrolled past too quickly.
**Root cause**: Notebook Navigator uses a **Virtualized List** (React). DOM rows are recycled instantly. JavaScript observers cannot keep up with the scroll speed to inject styles.
**Resolution**: Reverted to the **"Native-Bridge" (Pure CSS)** strategy from version 4.1.4. The engine now generates static CSS rules targeting items by `data-path`.
**Lesson**: For virtualized lists, NEVER rely on JavaScript to inject styles or classes. Use direct, high-specificity CSS selectors (`[data-path="..."]`) for O(1) rendering.

---

## Incident #8 — Native File Explorer Layout Collapse (2026-05-15)
**What was attempted**: Creating a universal "Perfect Alignment Engine" in `styles.css` using broad selectors like `.nn-navitem` and `display: flex !important;`.
**Why it was done**: To enforce strict 32px heights and fix text truncation across both native Obsidian and Notebook Navigator without needing user snippets.
**What broke**: 
- Notebook Navigator layout entirely collapsed.
- Inline metadata (like `.nav-folder-note-count`) misaligned and broke the flex flow.
**Root cause**: Notebook Navigator automatically injects native `.nav-folder-title` classes into its virtualized rows to ensure theme compatibility. By aggressively targeting the outer `.nn-navitem` wrapper and forcing it to be a flex container, the plugin destroyed the row's internal DOM structure. Additionally, forcing `margin-left: auto` onto internal tags (which are not flex siblings) broke their layout.
**Resolution**: Reverted to using the exact, simple native selectors (e.g., `.nav-folder-title`), but anchored them with `body` and `!important` to ensure they win the CSS loading order battle against themes.
**Lesson**: When styling Notebook Navigator, do not over-engineer or target its wrapper classes (`.nn-navitem`) for layout mechanics. Rely on the native classes it injects (`.nav-folder-title`) and elevate their specificity safely using `body`.

---

## Incident #9 — Double Icons & Selector Leakage (2026-05-16)
**What was attempted**: Finalizing icon synchronization for Notebook Navigator.
**What broke**: 
- Side-by-side "double icons" appeared in the NN pane.
- Icons in NN appeared "massive" compared to the sidebar.
**Root cause**: 
- **Leakage**: General CSS rules for the explorer (targeting `.tree-item-inner`) were leaking into NN rows.
- **Redundancy**: `IconManager.ts` was still attempting DOM injection for NN while `StyleGenerator.ts` was also applying a CSS mask.
- **Scale**: NN cards use a larger font; the standard `1.3em` multiplier was too big for card layouts.
**Resolution**:
- **CSS Firewall**: Added `:not(.nn-file):not(.nn-navitem)` to all general icon rules.
- **DOM Cleanup**: Removed NN support from `IconManager.ts` (Pure CSS only for NN).
- **Decoupled Scaling**: Reduced NN icon base multiplier to **1.1em**.
**Lesson**: Hybrid rendering (JS + CSS) is fatal in virtualized lists. Choose one path and strictly isolate it using the CSS Firewall.

---

## Incident #10 — Blank Items in Integrated Views (2026-05-16)
**What was attempted**: Implementing the Pure CSS bridge for Notebook Navigator.
**What broke**: 
- Items that didn't match a custom icon appeared completely blank (no folder/file icons).
**Root cause**: 
- The bridge targeted the native NN icon slots but didn't provide a fallback when the user's configuration was empty.
**Resolution**:
- **Surgical Fallback**: Implemented a mandatory default icon injection in `NotebookNavigator.ts`. If no icon matches, a Lucide folder/file is injected via CSS mask at 50% opacity.
**Lesson**: When overriding native UI elements in third-party plugins, always provide a "Neutral Fallback" to prevent layout collapse or missing information.

---

## Incident #11 — GitHub Attestation Failure (2026-05-16)
**What was attempted**: Adding `actions/attest@v1` to the GitHub Actions workflow for build provenance.
**Why it was done**: To secure the release pipeline and provide verifiable build artifacts.
**What broke**: 
- The CI job failed with a "Missing mandatory parameter" error.
- Attestations were not generated for `main.js`, `manifest.json`, or `styles.css`.
**Root cause**: The `actions/attest@v1` action requires both an explicit `predicate-type` AND a `predicate-path` (or inline `predicate`). Furthermore, the `predicate-type` must strictly match the SLSA specification version (e.g., `https://slsa.dev/provenance/v1.0`), as `v1` alone may be rejected by the attestation API.
**Resolution**: 
1. Created `.github/predicates/predicate.json` with build metadata.
2. Updated `.github/workflows/build.yml` to use `https://slsa.dev/provenance/v1.0` and specified the `predicate-path`.
3. Elevated `contents` permissions to `write` to allow automated GitHub Release creation and note generation.
4. Standardized release tags to use the semantic version only (e.g., `4.1.5`).
**Lesson**: Attestation and Release actions have distinct permission requirements. While `read` is sufficient for building and attesting, `write` is mandatory for modifying repository resources like Releases and generating notes.

---

## Incident #12 — Color Parsing Crashes & Scroll Listener Leak (2026-05-24)
**What was attempted**: Adding support for 3-character hex colors (e.g., `#f00`) and optimizing scroll-based divider positioning.
**Why it was done**: To improve shorthand color support, prevent TypeErrors from invalid color inputs, and resolve memory leaks.
**What broke**: 
- Inputting a 3-character hex shorthand returned `null` from `hexToRgbObj`, causing unhandled `TypeError` crashes when accessing `.r`, `.g`, or `.b` in `main.ts` and `StyleGenerator.ts`.
- Scroll event listeners bound to workspace explorer containers during divider synchronization were never cleaned up, resulting in memory and class instance leaks on plugin unload.
**Resolution**:
1. Refactored `hexToRgbObj` in `utils.ts` to support both 3-digit and 6-digit hex strings and automatically expand shorthands.
2. Added defensive checks and theme-safe fallbacks for all color parser results in `main.ts` and `StyleGenerator.ts`.
3. Refactored the scroll listener to use a class-level bound method and explicitly unregistered it from all containers in `onunload`.
**Lesson**: Always normalize user inputs (like shorthand hexes), ensure parsing helpers return default fallbacks, and always mirror registration and unregistration of event listeners to prevent memory leaks in the Obsidian lifecycle.

