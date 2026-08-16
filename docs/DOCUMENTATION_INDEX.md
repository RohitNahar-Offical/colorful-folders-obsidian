# 🗺️ Colorful Folders — Master Documentation Index

Welcome to the **Colorful Folders** master documentation index. This directory contains 14 detailed architectural specs, data schemas, developer guides, security audits, and styling manuals.

---

## 🏗️ 1. Architecture & Engineering Deep-Dives

### **[ARCHITECTURE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/ARCHITECTURE.md)** — Engine Architecture Specification
* **Subject**: Full architectural specification of the Zero-DOM / `document.adoptedStyleSheets` rendering engine.
* **Key Content**:
  * Zero-DOM rendering strategy bypassing HTML node injection.
  * The 6-step rendering pipeline from native dataset attribute matching (`data-path`) to programmatic stylesheet adoption (`sheet.replaceSync()`).
  * Modular color resolution priority chain and depth opacity progression formulas.
  * The 5-Tier Icon Engine resolution chain.

### **[CODEBASE_GUIDE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CODEBASE_GUIDE.md)** — Ultimate Codebase & Subsystem Reference
* **Subject**: Exhaustive breakdown of **all 51 TypeScript source files** in `src/`.
* **Key Content**:
  * **Core Subsystem (`src/core/`)**: `StyleGenerator`, `StyleResolver`, `ColorResolver`, `BaseCssGenerator`, `CssGrouper`, `RainbowManager`, `DividerManager`, `IconManager`, `IconRepository`, `CategoryTrie`, `IconPackIndex`.
  * **Services Subsystem (`src/services/`)**: `PluginLifecycleService`, `DOMObserverService`, `EventTrackerService`, `AdoptedStyleSheetService`.
  * **Integrations Subsystem (`src/integrations/`)**: `embedingmodel`, `AIIconClassifier`, `NotebookNavigator`, `GraphColorSync`, `TagColorSync`.
  * **Localization (`src/lang/`)**: Typed translation helper `t()` and 8 locale dictionaries (`en`, `de`, `es`, `fr`, `ja`, `sk`, `zh-cn`, `zh-tw`).
  * **Common Utilities (`src/common/`)**: `LRUCache`, `utils` (fast-path `safeEscape`), `VaultUtils`, `constants`, `types`.
  * **UI Subsystem (`src/` & `src/ui/`)**: Entry point (`main.ts`), `SettingTab`, 5 modular setting sections, `ColorPicker`, and 7 modals.

### **[ENGINE_INTERNALS.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/ENGINE_INTERNALS.md)** — Low-Level Logic & Lifecycle Bus
* **Subject**: Event bus mapping tables, low-level CSS attribute selectors, path key normalization, and fuzzy matching algorithms.
* **Key Content**:
  * Workspace & vault event bus reactive mapping (`create`, `rename`, `delete`, `scroll`, `window-open`, `css-change`).
  * Low-level CSS attribute selectors targeting `.nav-folder-title[data-path="..."]`.
  * Structure-preserving path key normalization (`normalizePathKey`).
  * Stem-aware 1D Levenshtein fuzzy search and memory buffer optimizations.

---

## 📖 2. API Reference & Data Schemas

### **[API_REFERENCE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/API_REFERENCE.md)** — Public & Internal API Reference
* **Subject**: Method signatures, parameter contracts, and public API surfaces across all TypeScript core modules.
* **Key Content**:
  * `ColorfulFoldersPlugin` main class contracts.
  * `StyleGenerator`, `StyleResolver`, `ColorResolver`, `BaseCssGenerator`, and `CssGrouper` class signatures.
  * `IconManager`, `IconRepository`, `CategoryTrie`, `IconPackIndex`, and `AIIconClassifier` method specifications.
  * `AdoptedStyleSheetService` multi-window stylesheet lifecycle API.

### **[DATA_SCHEMA.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/DATA_SCHEMA.md)** — Persistent Data & JSON Schema
* **Subject**: Full specification of `data.json` configuration structures, local icon asset storage, and setting interfaces.
* **Key Content**:
  * Lightweight `data.json` baseline design (~5KB) preventing WebDAV / Obsidian Sync data loss.
  * Modular Local Icon Storage Schema (`.obsidian/plugins/colorful-folders/icons/`).
  * `ColorfulFoldersSettings` specification covering 60+ settings keys.
  * `FolderStyle` interface schema for local folder/file overrides (`hex`, `textColor`, `iconId`, `isBold`, `applyToSubfolders`, `applyToFiles`).
  * Backup & restore JSON payload wrappers (`cf-folder-backup`, `cf-divider-backup`).

---

## 🎨 3. Styling, Customization & Visual Effects

### **[CUSTOMIZATION.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CUSTOMIZATION.md)** — CSS Customization & User Styling Manual
* **Subject**: Guide for overriding layout styles, custom CSS variables, user styling rules, and section dividers.
* **Key Content**:
  * Consuming custom CSS variables (`--cf-file-bg`, `--cf-folder-bg`).
  * Configuring Zero-DOM section dividers (`data-cf-divider`) with bridge lines and pill label modes.

### **[VISUAL_EFFECTS.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/VISUAL_EFFECTS.md)** — Visual Effects Engine Manual
* **Subject**: Guide for glassmorphism backdrop filters, multi-stop neon rainbow text gradients, stealth mode, and active glow effects.
* **Key Content**:
  * Glassmorphism CSS specifications (`backdrop-filter: blur(8px)`).
  * Neon rainbow gradient algorithms (`RainbowManager.buildGradientCss()`).
  * Active selection glow and custom highlight states.

### **[STYLE_GUIDE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/STYLE_GUIDE.md)** — Design System Tokens & Aesthetics
* **Subject**: Curated color palettes, visual design system tokens, typography standards, and contrast guidelines.
* **Key Content**:
  * Built-in light/dark theme palette arrays (`PALETTES`).
  * WCAG AA/AAA contrast calculation standards (`ColorResolver.resolveTextColor`).

### **[STAIRCASE_EFFECT.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/STAIRCASE_EFFECT.md)** — Layout Alignment & Tree Override Guide
* **Subject**: Technical explanation of Obsidian layout alignment and dynamic CSS custom property overrides.
* **Key Content**:
  * Defeating native inline layout overrides using high-specificity selectors.
  * Using `el.setCssProps()` and CSS custom properties instead of static inline styles.

---

## 🔌 4. Integrations & Internationalization

### **[NOTEBOOK_NAVIGATOR.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/NOTEBOOK_NAVIGATOR.md)** — Notebook Navigator Integration Manual
* **Subject**: Integration guide for styling the *Notebook Navigator* community plugin.
* **Key Content**:
  * Dynamic class generation to prevent style collisions in Notebook Navigator views.
  * Document-based event tracking in `EventTrackerService`.

### **[LOCALIZATION.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/LOCALIZATION.md)** — i18n Translation & Locale System
* **Subject**: Guide to the compile-time typed localization system (`t()`).
* **Key Content**:
  * `TranslationKey` auto-derivation from `en.ts`.
  * Adding new locale dictionaries (`src/lang/locale/`).

---

## 🛡️ 5. Security, Governance & Development

### **[SECURITY_AUDIT.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/SECURITY_AUDIT.md)** — Security & XSS Defense Audit
* **Subject**: Audit of security controls, DOMParser SVG sanitization, and script execution prevention.
* **Key Content**:
  * DOMParser recursive tree walking defense stripping `<script>`, `<iframe>`, `<object>`, and `on*` attributes.
  * CSS `-webkit-mask-image` URL isolation preventing script execution.

### **[CONTRIBUTING.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CONTRIBUTING.md)** — Development Setup & Contribution Guide
* **Subject**: Developer setup, build pipeline scripts, code style requirements, and pull request workflow.
* **Key Content**:
  * `npm run dev`, `npm run build`, `npm run lint` commands.
  * Community linter compliance rules.
