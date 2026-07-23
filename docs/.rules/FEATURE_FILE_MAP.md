# 🔗 FEATURE → FILE MAP (Quick Reference)

Use this to instantly know WHICH file to edit for any task.

## "I want to change stylesheet adoption or CSS injection"
→ Edit `src/services/AdoptedStyleSheetService.ts`.

## "I want to change how colors or opacity work"
→ Edit `src/core/ColorResolver.ts`.

## "I want to change the rendering traversal logic or flat CSS generation"
→ Edit `src/core/StyleGenerator.ts` inside `traverse()`.

## "I want to add a new setting"
→ Edit `src/common/types.ts` (add to `ColorfulFoldersSettings`) + `src/common/constants.ts` (add default) + `src/ui/SettingTab.ts` (add UI).

## "I want to change icon resolution rules, auto-download, or SVG Data URIs"
→ Edit `src/core/IconRepository.ts` (Tiers resolution logic), `src/core/IconPackIndex.ts` (O(1) pack index), `src/core/CategoryTrie.ts` (Trie candidate matching), `src/common/LRUCache.ts` (LRU caches), or `src/core/IconManager.ts` (facade wrapper). Raw & encoded Data-URIs are generated in `IconRepository.ts` and rendered in `StyleGenerator.ts`.

## "I want to change DOM attribute tagging or observers"
→ Edit `src/services/DOMObserverService.ts`.

## "I want to fix alignment/layout"
→ Edit `src/core/BaseCssGenerator.ts` or `styles.css` scoped strictly to `[data-cf-path]` and `[data-path]` selectors.

## "I want to add a new CSS effect (glow, blur, shadow)"
→ Edit `src/core/StyleGenerator.ts`.

## "I want to fix Notebook Navigator compatibility"
→ Edit `src/integrations/NotebookNavigator.ts`. Read `docs/NOTEBOOK_NAVIGATOR.md` for architecture details.

## "I want to change section dividers"
→ Edit `src/core/DividerManager.ts` (attribute tagging) & `src/core/BaseCssGenerator.ts` (divider CSS).

## "I want to fix build errors"
→ Check `src/common/types.ts` — likely an interface mismatch. Run `npm run build` and `npm run lint`.
