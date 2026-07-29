# 🗺️ Colorful Folders — Comprehensive Documentation Index

Welcome to the **Colorful Folders** master documentation index. This document provides an exhaustive, in-depth directory of all documentation files, engineering specs, architectural diagrams, API surfaces, data schemas, security audits, and developer guides.

---

## 🏗️ 1. Architecture & Rendering Engine

### **[ARCHITECTURE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/ARCHITECTURE.md)** — Engine Architecture Deep-Dive
- **Core Subject**: Architectural specification of the Zero-DOM / `document.adoptedStyleSheets` rendering engine.
- **Inner Workings & Technical Details**:
  - **Zero-DOM Rendering Strategy**: Explains why the plugin avoids injecting physical HTML wrapper elements into Obsidian's file explorer DOM tree (preventing third-party observer feedback loops such as Incident #27 with Smart Connections).
  - **The 6-Step Rendering Pipeline**: Mermaid sequence flowchart tracking state resolution from `DOMObserverService` dataset attribute tagging (`data-cf-path`) to `AdoptedStyleSheetService` injection (`sheet.replaceSync()`).
  - **Modular Color & Opacity Resolution**: Mathematical color priority chain in `ColorResolver.ts`.
  - **The 4-Tier Icon Engine**: Exact pack matching, custom regex rules, true Node-based `CategoryTrie` prefix lookups, and optimized stemmed fuzzy searching.
  - **AI Icon Classification Service**: Details `AIIconClassifier` instance service architecture, `item_path` context payloading, `=>` / `->` arrow notation pre-sanitization, recursive map flattening, and flexible target resolution (`full path`, `normalized path`, `title`, `subpath`).
  - **Pack Priority Tie-Breaking**: `PACK_PRIORITY` hierarchy (`custom` > `lucide` > `tabler` > `simple-icons` > `remix` > `feather` > `font-awesome` > `material`).

### **[ENGINE_INTERNALS.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/ENGINE_INTERNALS.md)** — Low-Level Logic & Lifecycle Bus
- **Core Subject**: Reactive event bus mapping, low-level CSS attribute selectors, path key normalization, and string performance optimizations.
- **Inner Workings & Technical Details**:
  - **Global Event Lifecycle**: Event bus table mapping workspace/vault events (`modify`, `create`, `delete`, `layout-ready`, `dragstart`, `scroll`) to `PluginLifecycleService`, `DOMObserverService`, and `EventTrackerService`.
  - **Low-Level CSS Selectors**: Attribute selectors targeting `.nav-folder-title[data-cf-path="..."]` and `.nav-file-title[data-cf-path="..."]`.
  - **Structure-Preserving Path Key Normalization**: `normalizePathKey(path)` preserving slashes `/` to eliminate key collision bugs across subfolders.
  - **Stemming Engine & Fuzzy Optimizations**: `STOP_WORDS` filtering, `searchFuzzy` length-difference pruning, word-boundary alignment, and single-row Levenshtein memory buffer.
  - **$O(1)$ LRU Cache Systems**: Bounded 2048-capacity LRU caches (`_normCache`, `_dataUriCache`, `_findPackIconCache`).

---

## 📖 2. API Surface & Data Schema

### **[API_REFERENCE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/API_REFERENCE.md)** — Public & Internal API Reference
- **Core Subject**: Complete method signatures and parameter contracts across all core TypeScript modules.
- **Inner Workings & Technical Details**:
  - **`ColorfulFoldersPlugin`**: `generateStyles()`, `loadLocalIcons()`, `saveSettings()`.
  - **`PluginLifecycleService`**: `initializeDocumentTracking()`, `registerVaultCacheEvents()`, `onLayoutReady()`, `destroy()`.
  - **`StyleGenerator` & `StyleResolver`**: `generateCss()`, `traverse()`, `getStyle()`, and $O(\text{depth})$ path inheritance resolution using `FolderTrie`.
  - **`ColorResolver` & `BaseCssGenerator`**: Mathematical color calculations, global base CSS, divider CSS, and stealth mode CSS builders.
  - **`IconRepository`, `IconPackIndex`, `CategoryTrie`, & `AIIconClassifier`**: Auto-icon resolution, LRU caching, `searchFuzzy` single-row Levenshtein buffer, `CategoryTrie` prefix node lookup, and `AIIconClassifier` instance methods (`classifyVault`, `stopClassification`, `parseJsonResponse`, `unwrapOuterJsonObject`).
  - **`AdoptedStyleSheetService`**: `initializeStyles()`, `updateStyles()`, `clearStyles()`, and `unload()`.

### **[DATA_SCHEMA.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/DATA_SCHEMA.md)** — Persistent Data & JSON Schema
- **Core Subject**: Complete specification of persistent configuration files and JSON structures.
- **Inner Workings & Technical Details**:
  - **`ColorfulFoldersSettings`**: Exhaustive schema table covering 60+ settings keys (palettes, opacity sliders, auto-icons, section dividers, Notebook Navigator support, Tag Color Sync, Stealth Mode, and AI settings).
  - **AI Settings Keys**: `aiProvider`, `aiApiKey`, `aiModelName`, `aiOllamaEndpoint`, `aiCustomEndpoint`, `aiKeyConfirmed`, `aiIncludeFiles`.
  - **`FolderStyle` Interface**: Local override schema for hex colors, text gradients, icon IDs, bold/italic, and subfolder/file inheritance flags (`applyToSubfolders`, `applyToFiles`).
  - **`AutoIconData` Interface**: Resolution metadata returned by `IconRepository`.
  - **Linear Opacity Progression Formula**: Exact depth-based background transparency math (`depth 0: 50%` $\rightarrow$ `depth 5+: 5% hard floor`).
  - **Backup & Restore Wrapper Schema**: JSON structures for `cf-folder-backup` and `cf-divider-backup`.

---

## 🛡️ 3. Security & Roadmap Tracking

### **[SECURITY_AUDIT.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/SECURITY_AUDIT.md)** — Security & XSS Defense Audit
- **Core Subject**: Security safeguards, SVG sanitization defense, and XSS prevention audit.
- **Inner Workings & Technical Details**:
  - **SVG Sanitization Defense**: DOMParser-based recursive tree walker that strips dangerous tags (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<foreignobject>`), `on*` event attributes, and external `<use>` schemes while preserving internal symbol anchors (`<use href="#symbol-id">`).
  - **CSS Mask Isolation**: SVG Data URIs rendered inside `-webkit-mask-image: url(...)` preventing script execution by the browser engine.
  - **Path Selector Escaping**: Single quote, double quote, and backslash escaping in `safeEscape()`.
  - **AI Privacy & Endpoint Security**: Explicit privacy consent modal (`aiKeyConfirmed`) and HTTPS/localhost URL scheme validation.

### **[fix.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/fix.md)** — Optimization & Security Roadmap
- **Core Subject**: Status tracker for security, performance, code quality, and architecture refactoring phases.
- **Inner Workings & Technical Details**:
  - Documents 100% completion across **Phase 1** (Security), **Phase 2** (Performance), **Phase 3** (Code Quality & Test Scaffolding), and **Phase 4** (Architecture Refactoring & `PluginLifecycleService`).

---

## 🎨 4. User Customization & Design System

### **[CUSTOMIZATION.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CUSTOMIZATION.md)** — User Customization & Modal Guide
- **Core Subject**: Complete user guide for manual folder styling, auto-icons, and settings.
- **Inner Workings & Technical Details**:
  - **The Color Picker Modal**: Guide to Appearance, Icon, Inheritance, Dividers, and Presets tabs.
  - **Inheritance Rules**: Difference between `applyToSubfolders` (cascades recursively) and `applyToFiles` (applies to files in the directory).
  - **Custom Icon Packs**: Installing featured icon packs (Simple Icons, Feather, Remix, Tabler, FontAwesome) and mapping brand assets.

### **[STYLE_GUIDE.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/STYLE_GUIDE.md)** — Design Tokens & UI Aesthetics
- **Core Subject**: UI/UX design tokens, modern aesthetic guidelines, and styling standards.
- **Inner Workings & Technical Details**:
  - **Design System**: Typography standards, curated HSL color palettes, frosted glassmorphism rules (`backdrop-filter: blur()`), and active item glow effects.
  - **UI Principles**: Sentence-case labels, dynamic slider tooltips, and instant reset buttons.

### **[VISUAL_EFFECTS.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/VISUAL_EFFECTS.md)** — Animations & Radiant Path
- **Core Subject**: Guide to visual animations, radiant path indentation, and text typography.
- **Inner Workings & Technical Details**:
  - **Radiant Path**: Configurable stroke thickness (`pathLineThickness`) and indentation line guides.
  - **Typography Effects**: Rainbow text gradients (`textGradient`, `textGradientEnd`) and letter/word spacing modes (`spacedTextMode`).

---

## 🛠️ 5. Integrations & Developer Guides

### **[CONTRIBUTING.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/CONTRIBUTING.md)** — Developer Guidelines & Standards
- **Core Subject**: Step-by-step developer contribution guidelines and mandatory engineering rules.
- **Inner Workings & Technical Details**:
  - **Adding Features**: How to add new color modes, icon packs, or third-party plugin integrations.
  - **Core Files Table**: Breakdown of all 18 core TypeScript files and their individual responsibilities.
  - **Mandatory Development Rules**: Rules regarding immediate `npm run build` after TypeScript edits, non-static CSS property assignments (`el.setCssProps`), decoupled visual styling, package update synchronization, and zero-warning lint policies.

### **[NOTEBOOK_NAVIGATOR.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/NOTEBOOK_NAVIGATOR.md)** — 3rd-Party Plugin Integration
- **Core Subject**: Integration documentation for the third-party Notebook Navigator plugin.
- **Inner Workings & Technical Details**:
  - **Container Target Selectors**: Target selectors (`.nn-navitem`, `.nn-file`, `.nn-folder`).
  - **ContextMenu Extension**: Right-click menu injection into Notebook Navigator item lists.
  - **Integrated CSS Rules**: Synchronized color backgrounds, outlines, and icon scales for dual-navigation setups.

### **[STAIRCASE_EFFECT.md](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/docs/STAIRCASE_EFFECT.md)** — Theme Indentation Conflict Remedies
- **Core Subject**: Technical explanation of theme layout conflict fixes and staircase indentation remedies.
- **Inner Workings & Technical Details**:
  - **Staircase Bug**: Remedies inline margin/padding overrides injected by certain Obsidian themes.
  - **`initStaircaseStyleStripper()`**: MutationObserver that strips conflicting inline `style` attributes on `.tree-item-self` elements while preserving folder note titles.
