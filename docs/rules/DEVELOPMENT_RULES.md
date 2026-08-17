# Colorful Folders: Core Development Rules & Post-Mortems

> This document is the consolidated **'source of truth'** for developing this plugin. It was updated for **Version 5.0.0+ Zero-DOM Architecture** after battling **30 distinct incidents** involving performance bottlenecks, virtualized DOM rendering, and third-party plugin interactions.
>
> **ALL AGENTS AND DEVELOPERS MUST ADHERE TO THESE RULES TO PREVENT REGRESSIONS.**

---

## 1. CSS & DOM Styling (The Virtualized List & Zero-DOM Rules)

**RULE 1.1: Never style virtualized lists with JS inline styles.**
Obsidian (and Notebook Navigator) recycle DOM rows instantly during scrolling. Inline styles injected by JS will be wiped out or flicker. *(Incident #1 [superseded], #7 [superseded])*

**RULE 1.2: Use `CSSStyleSheet` for dynamic CSS, NEVER `<style>`.**
To pass Obsidian's `no-forbidden-elements` linter rule, inject dynamic CSS using `new CSSStyleSheet()` and `document.adoptedStyleSheets`. *(Incident #5, #28)*

**RULE 1.3: Strip React's inline styles cleanly without DOM thrashing.**
If Obsidian's React engine forces unwanted inline styles (e.g., `padding-inline-start`), do not fight it with aggressive DOM observers unless gated by opt-in settings. Re-apply layouts using clean static CSS. *(Incident #24, #25, #26)*

**RULE 1.4: Scope all global CSS.**
Any generic CSS rules (e.g., `display: flex`) must be strictly scoped to `.nav-files-container` to prevent layout collapse in the rest of the Obsidian UI. *(Incident #4)*

**RULE 1.5: `background-clip: text` isolation.**
Gradients must be applied directly to the text-content child (e.g., `.nav-folder-title-content`, `.nav-file-title-content`), NEVER to a parent row container that also has a `background-color`. If both coexist on the same element, the browser renders the background-color over the gradient. *(Incident #21)*

**RULE 1.6: Zero-DOM Pseudo-Element Icons.**
Do not inject physical HTML elements (`.cf-icon-wrapper`, `<div>`, `<svg>`) into file tree nodes. Render all custom icons via CSS `::before` / `::after` pseudo-elements using `data-cf-path` attribute selectors and CSS `-webkit-mask-image` data URIs. *(Incident #20 [superseded], #28)*

**RULE 1.7: Use `[data-path]` selectors for virtualized list styling.**
For virtualized lists (Obsidian file explorer and Notebook Navigator), use direct high-specificity CSS selectors targeting `[data-path="..."]` for O(1) rendering. Never rely on JavaScript to inject classes or styles per-row during scroll. *(Incident #7 [superseded])*

**RULE 1.8: CSS Firewall for third-party plugin isolation.**
When generating CSS that could leak into Notebook Navigator or other file-tree plugins, append `:not(.nn-file):not(.nn-navitem)` to general icon/layout selectors. Never mix JS DOM injection + CSS styling for the same visual element in virtualized contexts. *(Incident #9)*

**RULE 1.9: Target native classes, not wrapper classes, in Notebook Navigator.**
Do not target NN's wrapper classes (`.nn-navitem`) for layout mechanics. Rely on the native classes it injects (`.nav-folder-title`, `.nav-file-title`) and elevate specificity safely using the `body` prefix. *(Incident #8)*

**RULE 1.10: Respect Third-Party Plugin Visibility (Folder Notes).**
Never inject global nuclear `display: none !important` rules targeting class names or attributes owned by third-party plugins (e.g. `.is-folder-note`, `[data-folder-note="true"]`). Respect the host app's and target plugin's visibility state. *(Incident #30)*

---

## 2. Main Thread Performance (Scroll, Drag, & Startup Lag)

**RULE 2.1: NO Dynamic `:has()` for high-traffic states.**
Never use CSS `:has()` for drag, hover, or active states (e.g., `.nav-folder:has(.is-active)`). Replace with O(1) JavaScript class toggles (e.g., `.cf-has-divider`, `.cf-hidden`, `.cf-active-parent`). *(Incident #15)*

**RULE 2.2: Observer Scroll Guards & RAF Batching.**
Never run full `querySelectorAll` or synchronous DOM injections inside observers attached to the file explorer. Use `!this.isScrolling` guards to pause during scroll, pass `addedNodes` directly instead of full-container scans, and batch DOM writes in `requestAnimationFrame`. *(Incident #14 [superseded])*

**RULE 2.3: Debounce Observer initialization on rapid events.**
Never bind synchronous observer setup/teardown logic directly to high-frequency events like `layout-change`. Wrap the initialization in a 500ms `obsidian.debounce`. *(Incident #24)*

**RULE 2.4: Guard observer init during drag operations.**
Add `if (this.isDragging) return;` at the start of observer re-initialization functions. Obsidian's mid-drag hover events fire `layout-change`, which can re-create observers and cause layout thrashing. *(Incident #15)*

**RULE 2.5: Chunk heavy I/O and defer initialization.**
Defer layout queries to `app.workspace.onLayoutReady()`, and chunk file I/O using `setTimeout(..., 0)` to prevent startup freezes. Batch large filesystem operations (e.g., custom SVG file reads) in chunks of 50. Skip hidden dot-folders (`.smart-env`, `.git`, `.obsidian`) at the root level. *(Incident #18, #26)*

**RULE 2.6: Debounce Settings Persistence.**
Aggressively debounce disk writes (`saveData()`) and stylesheet generation when the user is interacting with UI sliders or color pickers. Keep visual feedback synchronous but defer persistence to a 300ms+ trailing edge. *(Incident #19)*

**RULE 2.7: Zero-DOM Data-Attribute Tagging.**
Tag file tree nodes using `data-cf-path` dataset attributes instead of modifying child DOM structure. Dataset attribute updates do NOT fire `childList` mutation events, eliminating third-party observer race conditions with plugins like *Smart Connections*. *(Incident #27 [superseded], #28)*

**RULE 2.8: Whitelist MutationObserver class filters.**
Never bind `MutationObserver` to high-traffic elements like `document.body` without extreme filtering. Always whitelist the specific classes you care about (e.g., `theme-dark`, `theme-light`, `cf-show-hidden`) and ignore noisy interaction classes (`is-dragging`, `is-focused`, `workspace-leaf-active`). *(Incident #13)*

**RULE 2.9: Cache expensive computations.**
Cache color palette lookups (`_cachedPalette`, `_cachedPaletteKey`), hex-to-RGB parsing (`rgbCache`), and other frequently-called utility results. Avoid rebuilding palettes on every `getEffectiveStyle()` call. *(Incident #18)*

---

## 3. Multi-Window & Ecosystem Compatibility

**RULE 3.1: Architect for Popout Windows.**
Do not assume the plugin only runs in `activeDocument`. Bind stylesheets, drag events, and observers to ALL open documents using a `getOpenDocuments()` helper, and hook into `"window-open"` to dynamically adopt sheets and register hooks on new windows. *(Incident #16)*

**RULE 3.2: Always provide a neutral UI fallback.**
When overriding UI elements in third-party plugins, always provide a default fallback (e.g., a Lucide folder/file icon at 50% opacity) to prevent blank items. *(Incident #10)*

**RULE 3.3: Use `activeDocument` instead of `document`.**
Always use `activeDocument` (or iterate `getOpenDocuments()`) for DOM queries. Using bare `document` will fail silently in popout windows and trigger the `obsidianmd/prefer-active-doc` linter rule. *(Incident #6, #16)*

---

## 4. TypeScript, Build Integrity & Code Quality

**RULE 4.1: ALWAYS run `npm run build`.**
TypeScript does not run natively in Obsidian. If you modify `.ts` files, you **must** compile the `main.js` bundle before testing. *(Incident #25)*

**RULE 4.2: Describe all Linter disables.**
Always use `// eslint-disable-next-line rule-name -- Reason here`. Bare `eslint-disable` comments without descriptions will be rejected by the Obsidian store automated scanner. *(Incident #3)*

**RULE 4.3: Safely parse JSON.**
`JSON.parse` returns `any`. Use strict interfaces (e.g., `BackupData`) to type it. Replace property destructuring with explicit `delete` loops on shallow clones to avoid unused variables. *(Incident #6)*

**RULE 4.4: Keep core math single-sourced (DRY).**
Do not duplicate color calculation or opacity math. Export static calculations (`resolveColor`, `resolveOpacity`, `resolveTextColor`) as shared utility functions. Use a singleton `StyleGenerator` instance, not dynamic reinstantiation. *(Incident #17)*

**RULE 4.5: Always verify interface ↔ class alignment after refactors.**
After removing or renaming properties in `types.ts`, verify the implementing class in `main.ts` still satisfies the interface contract. *(Incident #2)*

**RULE 4.6: Consolidate shared DOM queries.**
Do not have 4+ different container query blocks scattered across files. Consolidate into a single shared helper (e.g., `getAllExplorerContainers()`) used by `main.ts`, `DividerManager.ts`, and `DOMObserverService.ts`. *(Incident #17)*

**RULE 4.7: Run the linter before pushing.**
Always run `npm run lint` before committing, especially after adding features that use generic objects or DOM manipulation. *(Incident #6)*

**RULE 4.8: Pin `@typescript-eslint` to match `eslint-plugin-obsidianmd`'s bundled version.**
Check what version of `typescript-eslint` is bundled inside `eslint-plugin-obsidianmd` (`npm list eslint-plugin-obsidianmd`). Pin your top-level `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` to that **exact same version** (e.g., `8.65.0`). A version mismatch causes type-aware rules to crash silently, making local lint pass while the store bot fails. *(Incident #29)*

---

## 5. UI/UX Standards & Edge Cases

**RULE 5.1: Use Native Obsidian UI Components.**
Use `new obsidian.Setting().addToggle()` instead of raw `<input type="checkbox">` to ensure visual consistency, correct scaling across themes, and accessibility. *(Incident #23)*

**RULE 5.2: Previews must share the exact rendering engine.**
A UI preview must use the identical utility functions, gradient stop counts, font-weight values, and CSS reset values (e.g., `"initial"` not `"normal"`) as the actual renderer. Codify shared utility functions for gradient rendering. *(Incident #22)*

**RULE 5.3: Normalize User Inputs & Auto-Initialize.**
Validate and expand all user inputs (e.g., converting `#f00` to `#ff0000`). When enabling a compound feature (like a gradient), auto-initialize all required fields. *(Incident #12, #23)*

**RULE 5.4: Always Mirror Event Listeners.**
Any event listener registered on an element MUST be explicitly unregistered in the `onunload()` lifecycle. *(Incident #12)*

**RULE 5.5: Reset UI state on Reset buttons.**
When providing "Reset" buttons in modals, store references to `ToggleComponent` instances, and explicitly call `.setValue(false)` to keep the UI in sync with data. *(Incident #23)*

**RULE 5.6: All new user-facing strings MUST use `t()` from the i18n system.**
Never add hardcoded strings to UI files. Add every key in `src/lang/locale/en.ts` and all supported locale files, and use `t("your.key")`. *(Post-localization refactor)*

---

## 6. CI/CD & Release Pipeline

**RULE 6.1: GitHub Attestation requires explicit predicate configuration.**
`actions/attest@v1` requires both an explicit `predicate-type` (matching SLSA spec, e.g., `https://slsa.dev/provenance/v1.0`) AND a `predicate-path`. *(Incident #11)*

**RULE 6.2: Release creation requires `contents: write` permission.**
While `read` is sufficient for building and attesting, `write` is mandatory for creating GitHub Releases and generating notes. Standardize release tags to semantic version only (e.g., `5.0.2`). *(Incident #11)*

---

## Appendix: Incident Cross-Reference Table

| Rule | Incident(s) |
|------|-------------|
| 1.1 | #1 *(superseded by v5.0.0 Zero-DOM)*, #7 *(superseded)* |
| 1.2 | #5, #28 *(Zero-DOM)* |
| 1.3 | #24, #25, #26 |
| 1.4 | #4 |
| 1.5 | #21 |
| 1.6 | #20 *(superseded)*, #28 *(Zero-DOM)* |
| 1.7 | #7 *(superseded)* |
| 1.8 | #9 |
| 1.9 | #8 |
| 1.10 | #30 *(Folder Notes)* |
| 2.1 | #15 |
| 2.2 | #14 *(superseded)* |
| 2.3 | #24 |
| 2.4 | #15 |
| 2.5 | #18, #26 |
| 2.6 | #19 |
| 2.7 | #27 *(superseded)*, #28 *(Zero-DOM)* |
| 2.8 | #13 |
| 2.9 | #18 |
| 3.1 | #16 |
| 3.2 | #10 |
| 3.3 | #6, #16 |
| 4.1 | #25 |
| 4.2 | #3 |
| 4.3 | #6 |
| 4.4 | #17 |
| 4.5 | #2 |
| 4.6 | #17 |
| 4.7 | #6 |
| 4.8 | #29 |
| 5.1 | #23 |
| 5.2 | #22 |
| 5.3 | #12, #23 |
| 5.4 | #12 |
| 5.5 | #23 |
| 5.6 | Post-localization refactor |
| 6.1 | #11 |
| 6.2 | #11 |
