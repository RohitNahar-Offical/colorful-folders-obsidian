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

## "I want to change icon resolution rules, pack priority hierarchy, auto-download, or SVG Data URIs"
→ Edit `src/core/IconRepository.ts` (Tiers resolution logic), `src/core/IconRuleSet.ts` (custom user rule parser, operator matching modes `contains`/`exact`/`starts_with`/`ends_with`/`regex`, target scoping `folders`/`files`/`all`, native string matching, O(1) exact map, and LRU cache), `src/ui/settings/IconSettingSection.ts` (CSS Grid rule table, scope & mode dropdowns, and Icon Pack Priority Hierarchy reordering UI), `src/core/IconPackIndex.ts` (O(1) pack index with priority-aware `exactMap`, `coreMap`, and `suffixMap`), `src/core/CategoryTrie.ts` (Trie candidate matching with 512 LRU cache), `src/common/LRUCache.ts` (LRU caches), or `src/core/IconManager.ts` (facade wrapper). Raw & encoded Data-URIs are generated in `IconRepository.ts` and rendered via CSS in `StyleGenerator.ts`.

## "I want to change icon variety, seeded re-rolls, or the Shuffle Icons feature"
→ Edit `src/core/IconRepository.ts` (`settings.autoIconVariety`, `settings.varietySeed`, seeded hash key generation `${baseStr}#${seed}`, array rotation, and self-healing cache guards) and `src/ui/settings/IconSettingSection.ts` (Shuffle icons button, cache flush, immediate style generation, and Notice feedback).

## "I want to change live animated icons (SMIL, ping-pong loops, boxless SVG sanitization, play-on-click, optical sizing, or folder open/close coexistence)"
→ Edit `src/services/AnimatedIconService.ts` (orchestrating Facade), `src/services/animation/` (`AnimationClassifier.ts` for detection/caching, `AnimationTemplateFactory.ts` for box stripping/XSS sanitization, `AnimationViewportManager.ts` for `IntersectionObserver` & SMIL wake, `AnimationPlaybackEngine.ts` for click throttle/replay, `AnimationDomMounter.ts` for DRY mounting), `icons/generative.json` (native ping-pong SMIL syncbase chains), `src/core/BaseCssGenerator.ts` (scoped `.cf-has-animated-open` / `.cf-has-animated-closed` pseudo-element suppression rules and optical scale `calc(1.3em * iconScale * wideScale * 1.15)`), `src/core/StyleGenerator.ts` (state-scoped registration during traverse), and `src/services/EventTrackerService.ts` (play-on-click throttling and file-open replay).

## "I want to change plugin startup, pre-warming, idle initialization, or teardown lifecycle"
→ Edit `src/services/PluginLifecycleService.ts` (`initializeDocumentTracking`, `onLayoutReady`, deferred idle icon pre-warming via `requestIdleCallback`, and complete teardown in `destroy`), `src/services/DOMObserverService.ts` (`destroy` container scroll listener removal), and `src/main.ts` (`onload` / `onunload`).

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

## "I want to change Outline pane or in-note heading synchronization"
→ Edit `src/integrations/OutlineSync.ts`. Configured in `src/ui/settings/FeaturesSettingSection.ts`.

## "I want to change Tag pane or in-note tag synchronization"
→ Edit `src/integrations/TagColorSync.ts`. Configured in `src/ui/settings/FeaturesSettingSection.ts`.
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
