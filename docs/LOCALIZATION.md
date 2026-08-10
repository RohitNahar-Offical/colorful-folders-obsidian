# 🌐 Localization (i18n) System

> [!NOTE]
> This document describes the internationalization architecture of **Colorful Folders**, including how to add new languages, how translation keys are resolved, and the complete locale file structure.

---

## 1. Architecture Overview

Colorful Folders uses a **compile-time typed translation key system** (`src/lang/helpers.ts`). All user-facing strings — setting titles, descriptions, button labels, modal text, notices, tooltips, and placeholders — are extracted into typed locale dictionaries.

### Key Design Principles

- **`en.ts` is the source of truth**: All keys must exist in `en.ts` first. TypeScript derives `TranslationKey` directly as `keyof typeof en`, giving compile-time validation on every `t()` call.
- **Partial locale files**: Non-English locale files are typed as `Partial<LocaleDictionary>`, so missing keys gracefully fall back to English without build errors.
- **Variable interpolation**: Strings support `{{var}}` placeholders. The `t(key, { var: value })` call replaces all occurrences at runtime.
- **Language detection**: `getLanguage()` checks `obsidian.getLanguage()` → `localStorage["language"]` → `moment.locale()` in order.

---

## 2. Translation Function API

### `t(key: TranslationKey, vars?: Record<string, string | number>): string`

Located in `src/lang/helpers.ts`. Used everywhere across the UI.

```typescript
import { t } from '../../lang/helpers';

// Simple lookup
t("common.cancel")               // → "Cancel" (en) / "Zrušiť" (sk)

// With variable interpolation
t("settings.download_success", { count: 42, name: "Simple Icons" })
// → "Successfully downloaded 42 icons for Simple Icons!"

// Notice with template variable
t("notice.fetching_icon_pack", { url: "https://..." })
// → "Fetching icon pack from https://......"
```

### Language Resolution Order

```
obsidian.getLanguage()
    ↓ (if undefined)
localStorage.getItem("language")
    ↓ (if null)
obsidian.moment.locale()
    ↓ (fallback)
"en"
```

---

## 3. Supported Locales

| Locale Code | Language | File | Status |
|:---|:---|:---|:---|
| `en` | English | [`en.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/en.ts) | ✅ Source of truth (624 keys) |
| `sk` | Slovak | [`sk.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/sk.ts) | ✅ Full — 624 keys |
| `de` | German | [`de.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/de.ts) | ✅ Full — all keys |
| `es` | Spanish | [`es.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/es.ts) | ✅ Full — all keys |
| `fr` | French | [`fr.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/fr.ts) | ✅ Full — all keys |
| `ja` | Japanese | [`ja.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/ja.ts) | ✅ Full — all keys |
| `zh` / `zh-cn` | Simplified Chinese | [`zh-cn.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/zh-cn.ts) | ✅ Full — all keys |
| `zh-tw` / `zh-hk` | Traditional Chinese | [`zh-tw.ts`](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/lang/locale/zh-tw.ts) | ✅ Full — all keys |

---

## 4. Key Namespace Structure

All translation keys follow a structured prefix hierarchy:

| Prefix | Scope | Examples |
|:---|:---|:---|
| `common.*` | Shared buttons & labels | `common.cancel`, `common.save`, `common.on`, `common.off` |
| `settings.tab.*` | Top-level tab labels | `settings.tab.general`, `settings.tab.ai` |
| `settings.palette.*` | Color palette option names | `settings.palette.vibrant_rainbow` |
| `settings.ai.*` | AI classifier section | `settings.ai.provider.name`, `settings.ai.btn_auto_assign` |
| `settings.divider_icon_position.*` | Divider icon placement options | `settings.divider_icon_position.left` |
| `settings.option.*` | Generic dropdown options | `settings.option.left`, `settings.option.solid` |
| `section.*` | DividerModal section headers | `section.label_and_appearance`, `section.icon_settings` |
| `notice.*` | Dynamic runtime notices | `notice.vector_scanning`, `notice.fetching_icon_pack` |
| `modal.confirm.*` | Confirm modal strings | `modal.confirm.reset_styles` |
| `modal.changelog.*` | Changelog modal strings | `modal.changelog.got_it` |
| `modal.hover_message.*` | Hover popover editor strings | `modal.hover_message.tooltip.bold` |
| `modal.divider.*` | Section Divider editor strings | `modal.divider.subtitle`, `modal.divider.pill_mode` |
| `modal.password.*` | Password/vault lock strings | `modal.password.enter_password_desc` |
| `misc.*` | Miscellaneous labels | `misc.sponsor_iframe_title` |

---

## 5. Adding a New Language

1. **Create locale file**: `src/lang/locale/<code>.ts`

```typescript
export default {
    "common.cancel": "...",
    // ... all keys from en.ts
} as const;

export default myLocale;
```

> [!IMPORTANT]
> Keys do not need to be typed `as const` in partial locale files. The file can be a plain `export default { ... }`.

2. **Register in `helpers.ts`**:

```typescript
import myLang from './locale/my-lang';

const localeMap = {
    en,
    // ... existing entries
    'my-code': myLang,
};
```

3. **Add to `sk.ts` for parity check** (optional): Since `sk.ts` is the most complete reference locale, comparing against it helps ensure coverage.

4. **Build & lint**: Always run `npm run build && npm run lint` to ensure the new locale doesn't break type checking.

---

## 6. Localized Strings Coverage Map

The following UI components have been fully refactored to use `t(...)`:

| Component File | Strings Covered |
|:---|:---|
| `SettingTab.ts` | Tab labels, import URL notices, icon pack import notices |
| `GeneralSettingSection.ts` | Palette header, reset/add color buttons, text gradient angle setting |
| `IconSettingSection.ts` | Download/Re-download/Downloading buttons, filter placeholder, empty notice, show-more button |
| `FeaturesSettingSection.ts` | Live preview label, divider icon position dropdown, tag sync banner, Smart Connections setting |
| `AISettingSection.ts` | Experimental banner, provider/URL/model settings, token overview, AI action buttons, vector embedding card, scanning notices |
| `HoverMessageModal.ts` | Editor label, textarea placeholder, toolbar tooltips (bold/italic/code/link), live preview label, empty preview notice |
| `DividerModal.ts` | All section headers, setting names/descs, alignment/pill/line style dropdowns, hover message button, footer buttons |
| `PasswordModal.ts` | Password entry description |

---

## 7. ESLint / Linter Compliance

The localization system itself is transparent to the linter. All `t()` call sites are just regular TypeScript function calls. The only lint consideration is:

- **`obsidianmd/ui/sentence-case`** rule: Setting names and descriptions passed via `t()` must use sentence case in English. Any string with acronyms or product names (e.g. `Bge-m3`, `Ollama`) must capitalize the **first character only**.

```typescript
// ✅ Correct
.setPlaceholder("Bge-m3")

// ❌ Wrong — triggers sentence-case warning
.setPlaceholder("bge-m3")
```

---

## 8. Developer Checklist for New UI Strings

When adding any new user-facing text to the plugin:

- [ ] Add the English string as a new key in `en.ts`
- [ ] Add the corresponding translation in `sk.ts` (and ideally all other locales)
- [ ] Replace the hardcoded string in the source file with `t("your.new.key")`
- [ ] For strings with runtime values, use `t("your.key", { varName: value })`
- [ ] Run `npm run lint` to verify no missing-key TypeScript errors
- [ ] Run `npm run build` to compile the bundle

> [!TIP]
> TypeScript will report a compile error if you pass a string that is not a valid `TranslationKey`. This acts as an automatic coverage check — the build fails if a key used in source does not exist in `en.ts`.
