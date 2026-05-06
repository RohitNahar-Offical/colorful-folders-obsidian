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
