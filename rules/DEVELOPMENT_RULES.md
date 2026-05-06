# 📋 COLORFUL FOLDERS — DEVELOPMENT RULES & GUIDELINES

> **⚠️ MANDATORY: Read ALL rules in this file BEFORE making any code changes, edits, or GitHub pushes.**
> Last updated: 2026-05-06

---

## 🏗️ RULE 1 — ARCHITECTURE: NEVER BREAK THE STYLING ENGINE

### The Core Engine (DO NOT REPLACE)
The plugin uses a **CSS string generation engine** via a `<style>` tag. This is intentional.

- **File**: `src/core/StyleGenerator.ts`
- **Key method**: `generateCss(): string`
- **Injected by**: `initializeStyles()` in `src/main.ts`
- **Applied by**: `generateStyles()` in `src/main.ts`

### ❌ NEVER DO THIS:
- Do NOT replace `generateCss()` with a "CSS variable" system that applies styles directly to DOM elements.
- Do NOT remove the `<style>` tag injection in `main.ts`.
- Do NOT try to use `MutationObserver` to replace the style engine.
- Do NOT change the traversal logic inside `StyleGenerator.ts` unless you are 100% sure it won't break existing colors.

### ✅ ALWAYS DO THIS:
- Add new CSS rules as additional strings inside `cssRules.push(...)` inside `generateCss()`.
- Keep the `traverse()` function intact. Add logic inside it, do not replace it.
- Test with a vault that has at least 3 levels of nested folders before pushing.

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
| **Active File Custom Color** | `useCustomActiveColor` | `activeBg` / `activeText` variables |
| **Subfolder Tinting** | `tintOpacity` | `depth > 0` tint block |
| **Dividers** | `hasDivider` / `showFileDivider` | Bottom of `generateCss()` |

---

## 🚫 RULE 3 — LINTER COMPLIANCE (OBSIDIAN STORE SUBMISSION)

### Known Linter Issues & How To Handle Them

#### Issue 1: `obsidianmd/no-forbidden-elements` (the `<style>` tag)
- **Status**: The `<style>` tag is required and cannot be removed without breaking the plugin.
- **Current Fix**: An `eslint-disable-next-line` with a **description** is required.
- **Correct Format**:
  ```ts
  // eslint-disable-next-line obsidianmd/no-forbidden-elements -- Dynamic folder-specific styling requires a style tag to prevent layout thrashing and maintain high performance in large vaults.
  this.styleTag = activeDocument.head.createEl("style", { ... });
  ```
- ❌ NEVER use a bare `eslint-disable` without a description — the scanner will reject it.

#### Issue 2: UI Text Must Be Sentence Case
- All `.setName()` and `.setDesc()` text in `src/ui/SettingTab.ts` must use **sentence case**.
- ✅ Correct: `"Show item counters"`
- ❌ Wrong: `"Show Item Counters"`
- ❌ Wrong: `"SHOW ITEM COUNTERS"`

#### Issue 3: No Bare `eslint-disable` Comments
- Every `eslint-disable` MUST have a description after `--`.
- ✅ Correct: `// eslint-disable-next-line rule-name -- Reason here.`
- ❌ Wrong: `// eslint-disable-next-line rule-name`

---

## 📁 RULE 4 — FILE RESPONSIBILITIES (DO NOT CROSS BOUNDARIES)

| File | Responsibility | Do NOT |
|---|---|---|
| `src/core/StyleGenerator.ts` | Generate ALL CSS as a string | Add DOM manipulation here |
| `src/core/IconManager.ts` | Inject SVG icons into DOM elements | Generate CSS here |
| `src/core/DividerManager.ts` | Create/manage divider DOM elements | Touch folder colors |
| `src/main.ts` | Orchestrate: load, observers, apply CSS | Put CSS generation logic here |
| `src/ui/SettingTab.ts` | UI settings panel only | Apply styles directly |
| `styles.css` | **Static** base styles only | Put per-folder dynamic CSS here |
| `src/common/types.ts` | TypeScript interfaces/types | Put logic here |
| `src/common/constants.ts` | Static data (palettes, icons) | Put settings here |
| `src/common/utils.ts` | Pure utility functions | Put plugin state here |

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
   - Folder colors appear correctly.
   - Auto icons show on "Templates", "Images", "Projects" folders.
   - Focus mode dims non-active items.
   - Radiant path glows when a file is active.
3. Run `git add . && git commit -m "..."` with a clear message.
4. Run `git push origin main`.

### Commit message format:
```
<type>: <short description>

Types: fix | feat | refactor | docs | style | chore
```
Examples:
- `fix: restore radiant path after observer refactor`
- `feat: add custom active file color picker`
- `docs: update CUSTOMIZATION.md with new CSS variables`

---

## ⚠️ RULE 6 — KNOWN DANGER ZONES (THINGS THAT HAVE BROKEN BEFORE)

### ❌ Danger #1: Replacing the style tag with CSS variables
- **What happened**: Tried to apply styles via CSS variables on DOM elements.
- **Result**: Broken borders (random vertical lines), colors vanishing after scroll, misaligned icons.
- **Lesson**: NEVER do this. The style tag approach is the only stable method.

### ❌ Danger #2: Removing `getEffectiveStyle()` from `main.ts`
- **What happened**: Removed helper method while refactoring.
- **Result**: TypeScript build errors, plugin fails to load.
- **Lesson**: Do not remove any public or private methods from `main.ts` without checking all call sites.

### ❌ Danger #3: Touching the global layout in `styles.css`
- **What happened**: Added `display: flex` globally in CSS without scoping.
- **Result**: Broken layout in non-plugin elements of Obsidian.
- **Lesson**: All layout changes must be scoped to `.nav-files-container` or specific data-path selectors.

### ❌ Danger #4: Changing `IColorfulFoldersPlugin` interface without updating all implementors
- **What happened**: Added/removed a property from the interface.
- **Result**: TypeScript error: `Class 'ColorfulFoldersPlugin' incorrectly implements interface`.
- **Lesson**: Any interface change in `types.ts` must be reflected in `main.ts` AND all mock/test implementations.

### ❌ Danger #5: Bare `eslint-disable` without a description
- **What happened**: Store submission scanner rejected the plugin.
- **Result**: Failed automated submission with error: "Unexpected undescribed directive comment."
- **Lesson**: ALL `eslint-disable` comments must include a `-- Description` explaining why.

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

- Version is tracked in: `manifest.json`, `package.json`, `versions.json`
- All three files MUST have the same version number before release.
- Version format: `MAJOR.MINOR.PATCH` (e.g., `4.1.5`)
- Only increment the version when you are ready for a store submission.

---

## 🗂️ RULE 9 — FILE STRUCTURE REFERENCE

```
colorful-folders/
├── rules/                     ← YOU ARE HERE — Read before editing
│   └── DEVELOPMENT_RULES.md
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
│   │   └── SettingTab.ts      ← Settings panel UI
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

1. Read `rules/DEVELOPMENT_RULES.md` (this file).
2. Read `src/core/StyleGenerator.ts` lines 1–50 to confirm the engine is intact.
3. Read `src/main.ts` lines 120–135 to confirm the `<style>` tag is in place.
4. Check the current git status: `git log --oneline -5` to see recent changes.
5. Identify what the user is asking to change and which Rule applies.
6. **Never make changes that violate Rules 1, 2, or 3.**

### Golden Rule:
> **When in doubt, do LESS. A stable plugin that looks great is always better than a broken plugin with a "safe" architecture.**
