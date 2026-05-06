# 🔗 FEATURE → FILE MAP (Quick Reference)

Use this to instantly know WHICH file to edit for any task.

## "I want to change how colors work"
→ Edit `src/core/StyleGenerator.ts` inside the `traverse()` function.

## "I want to add a new setting"
→ Edit `src/common/types.ts` (add to `ColorfulFoldersSettings`) + `src/ui/SettingTab.ts` (add UI).

## "I want to change how icons look"
→ Edit `src/core/IconManager.ts`.

## "I want to fix alignment/layout"
→ Edit `styles.css` BUT scope it strictly to `.nav-files-container` or `[data-path]` selectors.

## "I want to add a new CSS effect (glow, blur, shadow)"
→ Edit `src/core/StyleGenerator.ts` — add to `cssRules.push()` inside the folder loop.

## "I want to fix Notebook Navigator compatibility"
→ Edit `src/core/StyleGenerator.ts` — look for `nnActive` boolean checks.

## "I want to change dividers"
→ Edit `src/core/DividerManager.ts`. Divider CSS is in the bottom of `StyleGenerator.ts`.

## "I want to fix build errors"
→ Check `src/common/types.ts` — likely an interface mismatch.
→ Run `node esbuild.config.mjs production` to see the exact error.

## "I want to push to GitHub"
→ Follow Rule 5 in DEVELOPMENT_RULES.md. Build must pass first.
