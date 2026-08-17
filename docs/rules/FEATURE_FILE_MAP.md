# 🔗 FEATURE → FILE MAP (Quick Reference — v5.0.0+ Zero-DOM Architecture)

Use this to instantly know WHICH file to edit for any task.

## "I want to change stylesheet adoption or CSS injection"
→ Edit `src/services/AdoptedStyleSheetService.ts`.

## "I want to change how colors, text contrast, or opacity work"
→ Edit `src/core/ColorResolver.ts`.

## "I want to change the rendering traversal logic, pseudo-element icons, or flat CSS generation"
→ Edit `src/core/StyleGenerator.ts` inside `traverse()`. Custom icons use CSS Data-URIs on `::before` pseudo-elements.

## "I want to add or modify a setting"
→ Edit `src/common/types.ts` (add to `ColorfulFoldersSettings`) + `src/common/constants.ts` (add default) + appropriate section in `src/ui/settings/` (`GeneralSettingSection.ts`, `AISettingSection.ts`, `AdvancedSettingSection.ts`, etc.) and `src/ui/SettingTab.ts`.

## "I want to change icon resolution rules, auto-download, or SVG Data URIs"
→ Edit `src/core/IconRepository.ts` (Tiers resolution logic), `src/core/IconPackIndex.ts` (O(1) pack index), `src/core/CategoryTrie.ts` (Trie candidate matching), `src/common/LRUCache.ts` (LRU caches), or `src/core/IconManager.ts` (facade wrapper). Raw & encoded Data-URIs are generated in `IconRepository.ts` and rendered via CSS in `StyleGenerator.ts`.

## "I want to change Zero-DOM dataset attribute tagging or observers"
→ Edit `src/services/DOMObserverService.ts` (`data-cf-path` attribute tagging). Dataset attribute updates do NOT fire `childList` mutations.

## "I want to fix alignment, layout, or base CSS rules"
→ Edit `src/core/BaseCssGenerator.ts` or `styles.css` scoped strictly to `[data-cf-path]` and `[data-path]` selectors.

## "I want to change folder-notes compatibility, active parent highlights, or file hiding"
→ Edit `src/services/EventTrackerService.ts` (`updateActiveFolderClasses`), `src/core/BaseCssGenerator.ts` (base CSS), `src/core/StyleGenerator.ts` (`isFolderNote`), and `src/main.ts` (`initStaircaseStyleStripper`).

## "I want to add a new CSS effect (glow, glassmorphism, blur, shadow)"
→ Edit `src/core/StyleGenerator.ts`.

## "I want to fix Notebook Navigator compatibility"
→ Edit `src/integrations/NotebookNavigator.ts`. Read `docs/NOTEBOOK_NAVIGATOR.md` for architecture details.

## "I want to change section dividers (Zero-DOM)"
→ Edit `src/core/DividerManager.ts` (`data-cf-divider` attribute tagging) & `src/core/BaseCssGenerator.ts` (pseudo-element divider CSS).

## "I want to fix build or linter errors"
→ Check `src/common/types.ts` for interface mismatches or package versions in `package.json`. Run `npm run build` and `npm run lint`.

## "I want to add or change a user-facing UI string"
→ Edit `src/lang/locale/en.ts` to add the key, then add the translated equivalent in ALL locale files (`sk.ts`, `de.ts`, `es.ts`, `fr.ts`, `ja.ts`, `zh-cn.ts`, `zh-tw.ts`). Replace hardcoded strings with `t("your.key")`. See `docs/LOCALIZATION.md` for full workflow.

## "I want to add a new language"
→ Create `src/lang/locale/<code>.ts`, export a default object with all keys from `en.ts`, and register it in `src/lang/helpers.ts` inside `localeMap`. Read `docs/LOCALIZATION.md`.

## "I want to change the Section Divider editor modal"
→ Edit `src/ui/modals/DividerModal.ts` for UI settings and layout. For divider CSS logic, edit `src/core/BaseCssGenerator.ts`. All strings must use `t(...)`.

## "I want to change the Hover Message (popover) editor"
→ Edit `src/ui/modals/HoverMessageModal.ts`. All strings must use `t(...)`.
