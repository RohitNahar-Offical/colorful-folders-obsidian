# ⚙️ Engine Internals: Low-Level Logic

> [!NOTE]
> This document details the low-level internals of **Colorful Folders** under the Zero-DOM / `document.adoptedStyleSheets` architecture and the Tiered Icon Selection Engine.

---

## 1. Global Event Lifecycle

Colorful Folders hooks into the Obsidian event bus and DOM observers reactively:

| Event | Handler | Rationale |
| :--- | :--- | :--- |
| `layout-change` | `DOMObserverService` | Re-attaches window document stylesheets to newly rendered explorer containers. |
| `css-change` | `EventTrackerService` | Theme switches (Light/Dark) trigger debounced contrast recalculations. |
| `file-open` | `EventTrackerService` | Updates active folder path markers dynamically (`.is-active-path`). |
| `dragstart` | `EventTrackerService` | Sets `plugin.isDragging = true` and suspends all styling and observer work during drag. |
| `dragend` | `EventTrackerService` | Resets `isDragging` and runs a catch-up render. |
| `create` / `delete` / `modify` | `PluginLifecycleService` | Vault structure changes; invalidates item count, container, and icon caches. File modification events are strictly scoped to plugin files. |
| `scroll` (container) | `DOMObserverService` | Suspends observer calculations during active scroll, queuing a single debounced catch-up sync after scroll stops. |
| `layout-ready` | `PluginLifecycleService` | Triggers startup cache pre-warming via `requestIdleCallback()` for core folder and document icons. |
| `generateStyles` (post-render) | `main.ts / GraphColorSync` | Syncs folder colors to `.obsidian/graph.json` color groups if `graphColorSync` is enabled. |

---

## 2. Low-Level Flat Selector Map

The Zero-DOM engine uses flat attribute selectors to target file explorer items directly via Obsidian's native `data-path` attribute:

### 📂 Folder Elements
- `.nav-folder-title[data-path="..."]`: Target folder title bar.
- `.nav-folder-title[data-path="..."] .nav-folder-title-content::before`: Icon rendered via SVG Data URI mask or Emoji.
- `.nav-folder-title[data-path="..."] ~ .nav-folder-children`: Container tint for nested items.

### 📄 File Elements
- `.nav-file-title[data-path="..."]`: File title bar.
- `.nav-file-title[data-path="..."] .nav-file-title-content::before`: File icon rendered via SVG Data URI mask.

### 📏 Section Dividers
- `.cf-has-divider[data-cf-divider="true"]::before`: Section divider bridge line and pill label.

---

## 3. Tiered Icon Selection Engine Internals

`IconRepository` processes icon resolution across a multi-tier hierarchy using optimized internal data structures:

```mermaid
graph TD
    A[Query: IconRepository.getAutoIconData name, path, isFile] --> T0{Tier 0: Frontmatter Icon}
    T0 -- Match --> Z0[Return Tier 0 Data]
    T0 -- Miss --> T05{Tier 0.5: Tag Sync Match}
    T05 -- Match --> Z05[Return Tier 0.5 Data]
    T05 -- Miss --> T08{Tier 0.8: IconRuleSet itemContexts}
    T08 -- Match --> Z08[Return Tier 0.8 Custom Rule Data]
    T08 -- Miss --> T09{Tier 0.9: Non-Markdown Ext & isFile}
    T09 -- Match --> Z09[Return Tier 0.9 Static Descriptor Data]
    T09 -- Miss --> T1{Tier 1: IconPackIndex.findIcon}
    T1 -- Match --> Z1[Return Tier 1 Data + packSource]
    T1 -- Miss --> T2{Tier 2 & 3: CategoryTrie.lookup}
    T2 -- Match --> Z2[Return Tier 2/3 Data + packSource]
    T2 -- Miss --> T4{Tier 4: STOP_WORDS + stemWord}
    T4 --> T4A[Query IconPackIndex for Stemmed Pairs / Single Words]
    T4A -- Match --> Z3[Return Tier 4 Data + packSource]
    T4A -- Miss --> T5[Tier 5: Concept / Sentence Palette Hash Fallback]
    T5 --> Z4[Return Concept or Sentence Icon]
```

### 3.1 `IconRuleSet` (`src/core/IconRuleSet.ts`)
- **Single Responsibility Principle (SRP)**: Dedicated, decoupled engine for parsing, compiling, and evaluating user-configured custom icon rules (`settings.customIconRules`).
- **Matching Operator Modes**:
  - `contains`: Substring evaluation via native V8 C++ `String.prototype.includes`.
  - `exact`: Exact equality via native `===` and $O(1)$ exact lookup maps.
  - `starts_with`: Prefix evaluation via native `String.prototype.startsWith`.
  - `ends_with`: Suffix evaluation via native `String.prototype.endsWith`.
  - `regex`: Evaluated via compiled `RegExp` with automatic slash/flags cleanup and ReDoS protections.
- **Dual-Bucket Partitioning & Performance Guards**:
  - Exact match maps (`_folderExact`, `_fileExact`, `_universalExact`): Instant $O(1)$ hash map lookups.
  - Fast-Path Bypass (`_exactRuleCount`): If no exact rules exist, Fast Path A is skipped in $O(1)$ with zero array allocations or lambda closures.
- **Scope Targeting**: Directs rules to `folders`, `files`, or `all` via the `::target` token syntax (`::folders`, `::files`, `::all`).
- **Context Isolation & Leak Prevention (Incident #42)**: Evaluates exclusively against `itemContexts` (`[lName, sanitized, cleanSanitized]`), strictly omitting `parentFolder` so parent folder rules never hijack nested child files.
- **Two-Layer Caching Architecture**:
  - Layer 1: `IconRepository._autoIconResultCache` (4096 entries, keyed by path/name).
  - Layer 2: `IconRuleSet._lookupCache` (2048 entries, keyed by `scope:ctx1\0ctx2\0ctx3` with zero-allocation single-string optimization `scope:ctx`).
- **Robust Regex & Delimiter Parser**:
  - Distinguishes rule assignment delimiters (`' = '`) from regex lookaheads containing `=` (e.g., `(?=project).+ = lucide-folder ::regex`).
  - Automatically strips enclosing `/.../` and unsets global `/g` flags to eliminate stateful `lastIndex` alternation bugs.
- **Shared Static Helpers (DRY)**: Exposes `IconRuleSet.parseRule(line)` and `IconRuleSet.formatRule(pattern, icon, priority, target, mode)` consumed by both runtime compilation and the Settings Rule Builder UI.

### 3.2 `IconPackIndex` (`src/core/IconPackIndex.ts`)
- Maintains `exactMap`, `coreMap`, and `suffixMap` to enable $O(1)$ icon lookups.
- Builds once per session with version-snapshot checking (`_localVersion`, `_customVersion`).
- Resolves suffix collisions at build time using `PACK_PRIORITY` weights:
  `custom` (100) > `lucide` (90) > `tabler` (80) > `simple-icons` (70) > `remix` (60) > `feather` (50) > `font-awesome` (40) > `material` (30).
  - **Structure-Preserving Path Key Normalization**: `normalizePathKey(path)` preserving slashes `/` to eliminate key collision bugs across subfolders.
  - **Memory-Efficient Hierarchy Depth Scanner (`getFastPathSlashes`)**: Zero-allocation $O(\text{len})$ char-code scanner (`charCodeAt(i) === 47`) replacing expensive `path.split('/')` heap allocations during color resolution.
  - **Hierarchy Level Color Mode (`colorMode: "hierarchy"`)**: Directly maps folder color indices to tree depth (`(depth + cycleOffset) % palette.length`) with zero array allocations.
  - **Stemming Engine & Fuzzy Optimizations**: `STOP_WORDS` filtering, `searchFuzzy` length-difference pruning, word-boundary alignment, and single-row Levenshtein memory buffer.

### 3.3 `CategoryTrie` (`src/core/CategoryTrie.ts`)
- Indexes `AUTO_ICON_CATEGORIES` using a true Node-based Prefix Trie (`TrieNode`).
- **Decoupled from Custom Rules**: Built once for built-in categories; custom rules evaluate separately in Tier 0.8 with strict scoping.
- **512-Entry LRU Cache**: Memoizes resolved category candidate arrays for recurring vault terms (`daily`, `notes`, `archive`, `work`) with normalized lowercase keys.
- **Zero-Allocation Parent Resolution**: Extracts parent directory tokens via native `lastIndexOf('/')` and `substring()` without creating intermediate arrays.

### 3.4 Path Key Normalization (`normalizePathKey` / `normalizeIconName`)
- `normalizePathKey(path)` lowercases paths and strips `.md` extensions while preserving `/` path slashes. Prevents key collisions between subfolder files (`"Dev/Notes.md"` $\rightarrow$ `"dev/notes"`) and top-level files (`"DevNotes.md"` $\rightarrow$ `"devnotes"`).
- `normalizeIconName(iconId)` unifies icon key formatting across AI classification, auto-icon matching, and pack index searches.

### 3.5 Stemming & Stop-Word Engine (`STOP_WORDS` / `stemWord`)
- `STOP_WORDS` filters out question words (`how`, `why`, `where`), auxiliary verbs (`is`, `are`, `works`), and structural nouns (`folder`, `file`).
- `stemWord()` strips common English suffixes (`-ing`, `-ed`, `-es`, `-s`) before pack queries.
- Single-word scanning iterates from right to left (last to first) to prioritize primary subject nouns over leading filler words.

### 3.6 $O(1)$ LRU Cache & Targeted Eviction Engine (`src/common/LRUCache.ts`)
- All string, mask Data-URIs, and icon validity lookups are bounded by `LRUCache(2048)` instances (`_normCache`, `_dataUriCache`, `_findPackIconCache`, `_autoIconResultCache`).
- Uses `Map` delete-and-set key reordering for $O(1)$ amortized get/set/eviction operations.
- **$O(1)$ Targeted Auto-Icon Eviction (`invalidateAutoIconCache(path)`)**: Directly deletes `path` and `${fileName}::${path}` from `_autoIconResultCache` in $O(1)$ time (< 0.0001ms), eliminating keystroke main-thread stalls, array allocations, and Smooth Cursor animation lag.
- **Pre-Normalized Mask Data-URI Caching (`getMaskDataUri(iconId, rawSvg)`)**: Caches `-webkit-mask-image: url("data:image/svg+xml,...")` Data-URIs directly in `_dataUriCache`, bypassing `DOMParser` instantiation, regex sanitization loops, and `encodeURIComponent()` overhead during vault CSS traversals.

---

## 4. Performance & Caching Engine

### Debounced & Incremental Architecture

- **`generateStylesDebounced` (100ms)**: Coalesces rapid style updates into a single `generateStyles()` execution.
- **`saveDataDebounced` (1000ms)**: Debounces settings disk writes.
- **Incremental Heatmap Parent Scanner**: `vault.on('modify')` and `vault.on('create')` incrementally update parent folder `mtime` values in $O(\text{depth})$ time (~0.01ms), eliminating 300ms+ full vault rescans during style generation in Heatmap mode.

---

## 5. AdoptedStyleSheet Lifecycle & Mobile Fallback Engine

- Programmatic `CSSStyleSheet` instance owned by `AdoptedStyleSheetService`.
- Attached to `activeDocument.adoptedStyleSheets` and all popout window documents.
- `sheet.replaceSync(cssString)` executes in < 0.1ms without creating HTML `<style>` elements or modifying DOM child nodes.
- **Mobile & Legacy WebKit Fallback**: For older mobile OS versions or webviews that lack `CSSStyleSheet` constructor or `adoptedStyleSheets` support, `AdoptedStyleSheetService` automatically injects and manages a fallback dynamic `<style id="cf-dynamic-styles">` element inside `doc.head`, guaranteeing 100% rendering compatibility across iOS, Android, Linux, and Windows.
