# 📋 COLORFUL FOLDERS — DEVELOPMENT RULES & GUIDELINES

> **⚠️ MANDATORY: Read ALL rules and core mechanics in this file BEFORE making any code changes, edits, or GitHub pushes.**
> Last updated: 2026-06-25

---

## 🌟 THE ESSENCE OF COLORFUL FOLDERS & HOW IT WORKS

`Colorful Folders` is a premium customization engine for Obsidian that allows users to color-code folders and files, assign custom icons, and insert styled interactive dividers in their file explorer. To build and maintain the plugin safely, you must understand its core mechanics:

### 1. The Dynamic Styling Engine (CSSStyleSheet API)
To comply with the Obsidian Store linter rule `obsidianmd/no-forbidden-elements` (which strictly bans dynamic `<style>` tags), the plugin uses the modern **Constructable Stylesheet** API:
* **Initialization**: `initializeStyles()` in `src/main.ts` creates a new instance of `CSSStyleSheet` and registers it directly to `activeDocument.adoptedStyleSheets`.
* **Generation**: `StyleGenerator.ts` compiles the active plugin configuration, theme settings, and file explorer traversal indices into a single, highly optimized CSS string.
* **Updates**: `generateStyles()` in `src/main.ts` updates the styles in real-time by calling `this.sheet.replaceSync(cssString)`. This runs in O(1) time without forcing browser layout collapses or causing scrolling flicker.
* **Cleanup**: On plugin unload, the stylesheet is systematically filtered out of the document's adopted style sheets.

### 2. Zero-Specificity Customization & CSS Variable Hooks
To ensure robust, non-destructive styling that plays nicely with custom user CSS snippets and third-party themes, the generated styles wrap variables inside standard CSS custom properties:
* **Variables**: `--cf-file-bg`, `--cf-file-color`, `--cf-folder-bg`, `--cf-folder-color`, `--cf-active-bg`, `--cf-active-color`, `--cf-tag-bg`, `--cf-tag-color`, and `--cf-selection-bg`.
* **Zero-Specificity Overrides**: Users and third-party themes can override file/folder backgrounds, texts, and active highlights inside custom stylesheets without using a single `!important` rule, ensuring theme stability.
* **Color-Matched Multi-Selections**: The `--cf-selection-bg` hook automatically shades multi-selected explorer items with a translucent hue matching the parent folder's color, falling back to the native accent color.

### 3. Hierarchical Traversal & O(1) Performance
To prevent performance degradation on large vaults, the plugin avoids binding recursive JavaScript listeners. Instead, `StyleGenerator.ts` traverses the vault hierarchy:
* **Traversal (`traverse()`)**: Traverses folders recursively, calculating colors based on active color modes (Vibrant, Pastel, Monochromatic, Custom, or Heatmap).
* **Positional Indexing**: Colors are assigned to folders based on parent/sibling positions, ensuring a deterministic "cycle" or gradient flow. Excluded folders are skipped during index calculations.
* **Inheritance Model**: Styles can be forced down to subfolders (`applyToSubfolders`) and files (`applyToFiles`) through hierarchical lookups.
* **Pure CSS Targeting**: Compiled CSS rules target specific explorer nodes via `[data-path="..."]` selectors. This provides O(1) browser rendering speeds, preventing the flickering commonly associated with virtualized DOM lists.

### 4. Dual-Path Icon Rendering
Because Obsidian's file explorer and virtualized panes (like Notebook Navigator) render elements differently, the plugin decouples its icon rendering:
* **Explorer View (DOM Injection)**: For the standard explorer, `IconManager.ts` dynamically inserts `.cf-icon-wrapper` elements containing inline SVG structures directly into titles. It hides native explorer icons (`.nav-folder-icon`, `.nav-file-icon`) while active.
* **Virtualized Panes (Surgical CSS Masking)**: For React-based virtualized lists (like Notebook Navigator) that recycle DOM elements rapidly, DOM manipulation fails. The plugin uses pure CSS rules inside `StyleGenerator.ts` to inject icons via `-webkit-mask-image` targeting `[data-path]`.
* **CSS Firewall**: Rules for the explorer use `:not(.nn-file):not(.nn-navitem)` to prevent leakage, ensuring that virtualized panes use only their dedicated rendering path.

### 5. SVG Normalization & Sanitization
To prevent XSS vulnerabilities and layout breakages when users upload or register custom icons:
* **Sanitization**: `IconManager.ts` parses raw SVG strings using `DOMParser`, systematically removing forbidden tags (`script`, `iframe`, `object`, `embed`, `foreignObject`) and event handler attributes (`on*` / `javascript:`).
* **Normalization**: Strips hardcoded `width`, `height`, `style`, and background rectangles. Standardizes `viewBox` and sets `preserveAspectRatio`.
* **Color Compatibility**: Inspects the SVG structure. If a stroke outline exists without fills, it assigns `fill="none"` and `stroke="currentColor"`. Otherwise, it assigns `fill="currentColor"`. This guarantees the SVG dynamically responds to theme colorization.

### 6. Interactive Divider Bridge & Adaptive Markdown Popovers
The divider system splits folder/file listings with absolute-positioned dividers:
* **Divider Bridge**: Reconciles dividers across both standard explorers and Notebook Navigator containers. The parent container gets dynamic vertical padding to hold the absolute-positioned `.cf-interactive-divider` container.
* **Chip Customization**: Supports label alignments, uppercase styling, line patterns (solid, dotted, dashed), custom line margins, and pill styles (including glassmorphic backgrounds and auto-faded colors).
* **Adaptive Popovers**: Dividers with descriptions render rich Markdown using `MarkdownRenderer` inside a custom popup (`.cf-premium-popover`).
  * **Adaptive Positioning**: Automatically flips the popover position (above/below/left/right) depending on viewport constraints.
  * **Interactiveness**: Internal page links (`.internal-link`) and tags (`.tag`) are bound to workspace actions (opening documents, initiating global searches).
  * **Touch Compatibility**: Dismisses smoothly via tap-outside events on mobile and hover-bridge timers on desktop.

### 7. Performance Guardrails (Drag state & Debouncing)
* **Drag-and-Drop Suspension**: During workspace drag-and-drop operations, the body is tagged with `.cf-is-dragging`. This instantly disables transitions, blurs, backdrops, and active styling, ensuring butter-smooth native dragging.
* **Debounced Updates**: `generateStylesDebounced` and `processDividersDebounced` queue heavy CSS compiles and divider reconciliations, preventing frame drops during rapid system updates.

### 8. Theme Compatibility Engine
* **Style Settings Optimization**: To avoid collisions with third-party themes (specifically **Blue Topaz**), `optimizeBlueTopazStyleSettings()` automatically detects the active theme and deactivates conflicting folder/icon overrides in the *Style Settings* plugin, saving user settings and reloading cleanly.

---

## 🏗️ RULE 1 — ARCHITECTURE: NEVER BREAK THE STYLING ENGINE

### The Core Engine (DO NOT REPLACE)
The plugin uses the `CSSStyleSheet` API to inject generated CSS. This is the modern, linter-compliant replacement for a `<style>` tag.

* **File**: [StyleGenerator.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleGenerator.ts)
* **Key method**: `generateCss(): string`
* **Injected by**: `initializeStyles()` in [main.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/main.ts)
* **Applied by**: `generateStyles()` → `this.sheet.replaceSync(css)` in [main.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/main.ts)

### ❌ NEVER DO THIS:
* Do NOT replace `generateCss()` with a "CSS variable" system that applies styles directly to DOM elements.
* Do NOT remove the `sheet.replaceSync()` call in `main.ts`.
* Do NOT try to use `MutationObserver` to replace the style engine.
* Do NOT change the traversal logic inside `StyleGenerator.ts` unless you are 100% sure it won't break existing colors.

### ✅ ALWAYS DO THIS:
* Add new CSS rules as additional strings inside `cssRules.push(...)` inside `generateCss()`.
* Keep the `traverse()` function intact. Add logic inside it, do not replace it.
* Test with a vault that has at least 3 levels of nested folders before pushing.

---

## 🎨 RULE 2 — FEATURES: ALL PREMIUM FEATURES MUST BE PRESERVED

The following features MUST work at all times. Test each one before pushing:

| Feature | Setting Key | Where It Is Generated |
|---|---|---|
| **Folder Background Colors** | `customFolderColors` | `traverse()` → `cssRules.push()` |
| **Auto Color Files** | `autoColorFiles` | `copyFiles` loop in `traverse()` |
| **Focus Mode** | `focusMode` | Top of `generateCss()`, before traverse |
| **Radiant Path** | (always on) | `depth > 0` block in `traverse()` |
| **Rainbow Root Text** | `rainbowRootText` | `textCss` block in folder loop |
| **Heatmap Colors** | `colorMode === "heatmap"` | `getHeatmapColor()` function |
| **Glassmorphism** | `glassmorphism` | `glassCss` variable, applied per folder |
| **Auto Icons (SVG)** | `autoIcons` | `autoLucideId` block in folder loop |
| **Auto Icons (Emoji)** | `autoIcons` | `isEmoji` block in folder loop |
| **Custom Icons (per folder)** | `iconId` in `FolderStyle` | `activeStyle.iconId` block |
| **Item Counters** | `showItemCounters` | `countItems()` + `::after` CSS |
| **Hidden Items (Stealth)** | `isHidden` in `FolderStyle` | `generateStealthCss()` |
| **Notebook Navigator** | `notebookNavigatorSupport` | `nnActive` checks throughout |
| **Path Line Thickness** | `pathLineThickness` | `generateGlobalBaseCss` & `traverse` |
| **Decoupled Icon Scaling** | (Internal Logic) | `nnIconW` (1.1em) vs `effFileIconW` (1.3em) |

---

## 🚫 RULE 3 — LINTER COMPLIANCE (OBSIDIAN STORE SUBMISSION)

### Known Linter Issues & How To Handle Them

#### Issue 1: `obsidianmd/no-forbidden-elements` (RESOLVED ✅)
* **Status**: The `<style>` tag has been replaced with the native `CSSStyleSheet` API.
* **Current Fix**: `initializeStyles()` now uses `new CSSStyleSheet()` + `document.adoptedStyleSheets`.
* **No `eslint-disable` needed**: The new approach does not trigger this linter rule at all.
* ❌ NEVER reintroduce `createEl("style")` — this will re-trigger the store rejection.

#### Issue 2: UI Text Must Be Sentence Case
* All `.setName()` and `.setDesc()` text in [SettingTab.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/ui/SettingTab.ts) must use **sentence case**.
* ✅ Correct: `"Show item counters"`
* ❌ Wrong: `"Show Item Counters"`

#### Issue 3: No Bare `eslint-disable` Comments
* Every `eslint-disable` MUST have a description after `--`.
* ✅ Correct: `// eslint-disable-next-line rule-name -- Reason here.`
* ❌ Wrong: `// eslint-disable-next-line rule-name`

---

## 📁 RULE 4 — FILE RESPONSIBILITIES (DO NOT CROSS BOUNDARIES)

| File | Responsibility | Do NOT |
|---|---|---|
| [StyleGenerator.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleGenerator.ts) | Generate ALL CSS as a string | Add DOM manipulation here |
| [IconManager.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts) | Inject SVG icons into DOM elements (Standard Explorer) | Generate CSS or touch Notebook Navigator |
| [DividerManager.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/DividerManager.ts) | Create/manage divider DOM elements | Touch folder colors |
| [main.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/main.ts) | Orchestrate: load, observers, apply CSS | Put CSS generation logic here |
| [SettingTab.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/ui/SettingTab.ts) | UI settings panel only | Apply styles directly |
| [styles.css](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/styles.css) | **Static** base styles only | Put per-folder dynamic CSS here |
| [types.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/common/types.ts) | TypeScript interfaces/types | Put logic here |
| [constants.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/common/constants.ts) | Static data (palettes, icons) | Put settings here |
| [utils.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/common/utils.ts) | Pure utility functions | Put plugin state here |

---

## 🔄 RULE 5 — THE CORRECT WORKFLOW FOR CHANGES

### Before ANY code change:
1. Read these rules.
2. Identify which file needs changing.
3. Check that the feature you are changing is listed in Rule 2.
4. Make the change in the correct file (Rule 4).

### Before pushing to GitHub:
1. Run `node esbuild.config.mjs production` — build MUST succeed with 0 errors.
2. Verify in Obsidian that the following still work:
   * Folder colors appear correctly.
   * Auto icons show on "Templates", "Images", "Projects" folders.
   * Focus mode dims non-active items.
   * Radiant path glows when a file is active.
3. Run `git add . && git commit -m "..."` with a clear message.
4. Run `git push origin main`.

### Commit message format:
```
<type>: <short description>

Types: fix | feat | refactor | docs | style | chore
```
Examples:
* `fix: restore radiant path after observer refactor`
* `feat: add custom active file color picker`
* `docs: update CUSTOMIZATION.md with new CSS variables`

---

## ⚠️ RULE 6 — KNOWN DANGER ZONES (THINGS THAT HAVE BROKEN BEFORE)

### ❌ Danger #1: Replacing the style tag with CSS variables
* **Root cause**: DOM-based styling cannot handle Obsidian's virtual scroll list. When rows are recycled during scroll, inline styles are lost, causing flickering and vanished colors.
* **Lesson**: NEVER use DOM-based styling for the color engine.

### ❌ Danger #2: Removing `getEffectiveStyle()` from `main.ts`
* **Root cause**: Removed helper method during a refactor.
* **Lesson**: Do not remove any public or private methods from `main.ts` without checking all call sites.

### ❌ Danger #3: Touching the global layout in `styles.css`
* **Root cause**: Unscoped global layout styles affected non-plugin sidebar elements.
* **Lesson**: All layout changes must be scoped to `.nav-files-container` or specific data-path selectors.

### ❌ Danger #4: Changing `IColorfulFoldersPlugin` interface without updating all implementors
* **Root cause**: Class mismatches after types refactor.
* **Lesson**: Any interface change in `types.ts` must be reflected in `main.ts` AND all mock/test implementations.

### ❌ Danger #5: Bare `eslint-disable` without a description
* **Root cause**: Failed automated submission scanners.
* **Lesson**: ALL `eslint-disable` comments must include a `-- Description` explaining why.

### ❌ Danger #6: Styling virtualized lists with JavaScript
* **Root cause**: React recycles DOM elements faster than JS can track, creating severe flickering.
* **Lesson**: Use **Pure CSS targeting `data-path`** for virtualized views to achieve O(1) performance.

### ❌ Danger #7: Over-engineering wrapper classes in integrations
* **Root cause**: Layout collapsed by targeting `.nn-navitem` wrapper classes in Notebook Navigator.
* **Lesson**: Rely on the native classes it injects (`.nav-folder-title`) and elevate specificity safely using `body`.

### ❌ Danger #8: Double Icons in Virtualized Lists
* **Root cause**: Used both DOM injection (`IconManager`) and CSS masking (`StyleGenerator`) for Notebook Navigator.
* **Lesson**: Virtualized views must use a SINGLE rendering path. All NN icons must be handled by the **Surgical Container Replacement** (CSS) strategy.

### ❌ Danger #9: Broad Selector Leakage
* **Root cause**: Applied `::before` icons to `.tree-item-inner` without exclusions, leaking icons into NN rows.
* **Lesson**: ALWAYS use the CSS Firewall: add `:not(.nn-file):not(.nn-navitem)` to all general explorer rules.

### ❌ Danger #10: Blank Items in Integrated Panes
* **Root cause**: Suppressing native icons left unmatched rows blank.
* **Lesson**: Integrated views must have fallbacks. Inject a default Lucide folder/file icon via CSS mask when no icon matches.

### ❌ Danger #11: Unsafe color parsing & leaking event listeners
* **Root cause**: Call parsing on shorthand hex values caused TypeErrors. Neglected to remove scroll listener on unload.
* **Lesson**: Defend against `null` returns when parsing color strings, and ensure all dynamic DOM event listeners are matched with cleanup in `onunload`.

---

## 🧪 RULE 7 — TESTING CHECKLIST BEFORE EVERY PUSH

Run through this list manually in Obsidian:

- [ ] Folder colors appear at root level.
- [ ] Subfolder colors inherit correctly from parent.
- [ ] Auto icons appear on "Templates", "Images", "Calendar" folders.
- [ ] Custom icons (set via settings) show correctly.
- [ ] Item counters appear as `::after` on folder titles.
- [ ] Dividers show between folder groups.
- [ ] Focus Mode: non-active folders/files are dimmed.
- [ ] Radiant Path: active folder's border glows.
- [ ] Rainbow Text: root folder names use gradient text.
- [ ] Heatmap: recently modified folders are brighter.
- [ ] Hidden items: folders marked as hidden are not shown.
- [ ] Notebook Navigator (if installed): colors apply there too.
- [ ] Dark mode and Light mode both render correctly.
- [ ] No broken borders or unexpected lines appear.
- [ ] Build runs with 0 errors: `node esbuild.config.mjs production`

---

## 📦 RULE 8 — VERSION & RELEASE MANAGEMENT

* Version is tracked in: `manifest.json`, `package.json`, `versions.json`
* All three files MUST have the same version number before release.
* Version format: `MAJOR.MINOR.PATCH` (e.g., `4.1.7`)
* Only increment the version when you are ready for a store submission.

---

## 🗂️ RULE 9 — FILE STRUCTURE REFERENCE

```
colorful-folders/
├── docs/                      ← All documentation
│   ├── .rules/                ← YOU ARE HERE — Read before editing
│   │   ├── DEVELOPMENT_RULES.md
│   │   ├── FEATURE_FILE_MAP.md
│   │   └── INCIDENT_LOG.md
│   └── ARCHITECTURE.md        ← Details of style engine architecture
├── src/
│   ├── main.ts                ← Plugin lifecycle, style application
│   ├── common/
│   │   ├── types.ts           ← All TypeScript interfaces
│   │   ├── constants.ts       ← Palettes, icon data, defaults
│   │   └── utils.ts           ← Pure helper functions
│   ├── core/
│   │   ├── StyleGenerator.ts  ← THE BRAIN — CSS generation
│   │   ├── IconManager.ts     ← SVG icon injection
│   │   └── DividerManager.ts  ← Divider DOM management
│   ├── ui/
│   │   ├── SettingTab.ts      ← Settings panel UI
│   │   └── modals/            ← All interactive UI modals
│   └── integrations/
│       └── NotebookNavigator.ts ← NN plugin integration
├── styles.css                 ← Static base styles only
├── manifest.json              ← Plugin metadata & version
├── package.json               ← NPM metadata & version
└── versions.json              ← Version history
```

---

## 🤖 RULE 10 — FOR THE AI (ANTIGRAVITY) — CONTEXT PRESERVATION

When starting a new session on this plugin, do the following **before writing any code**:

1. Read `docs/.rules/DEVELOPMENT_RULES.md` (this file).
2. Read `src/core/StyleGenerator.ts` lines 1–50 to confirm the engine is intact.
3. Read `src/main.ts` lines 135–150 to confirm the adopted stylesheet setup is in place.
4. Check the current git status: `git log --oneline -5` to see recent changes.
5. Identify what the user is asking to change and which Rule applies.
6. **Never make changes that violate Rules 1, 2, or 3.**

### Golden Rule:
> **When in doubt, do LESS. A stable plugin that looks great is always better than a broken plugin with a "safe" architecture.**
