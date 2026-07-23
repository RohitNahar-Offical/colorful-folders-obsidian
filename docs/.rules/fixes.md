Here is the design document, anchored to the actual Colorful Folders v4.x codebase (`IconRepository.ts`, `AUTO_ICON_CATEGORIES`, `main.ts` icon-loading logic, `StyleGenerator.ts` invocation sites).

---

# Technical Design: Tiered Icon Selection Engine for Colorful Folders

## 1. Executive Summary

The current `IconRepository.getAutoIconData()` already implements a four-tier priority system (Exact Pack Match → Custom Rules + `AUTO_ICON_CATEGORIES` → Fuzzy Multi-Word → Null). This design **extends** that architecture into a formalized, high-performance engine that integrates **all discovered icon packs under a unified registry**, with an explicit priority hierarchy, typed match keys, index-based selection, and zero synchronous I/O on the hot path.

---

## 2. Priority Hierarchy — The Decision Pyramid

The hierarchy is expressed as a numeric **priority score**, where higher values win. Every `AutoIconData` record carries a `priority` field. The current `AUTO_ICON_CATEGORIES` already uses values like 100, 110, 90, 85, 80, 75. The design ratchets these into a **stopped scale** to prevent accidental overlap.

### 2.1 Priority Scaffold

| Tier | Numeric Range | Source | Description |
|------|--------------|--------|-------------|
| **Tier 0** | `2000` | Explicit per-item `style.customIconId` set by user via FolderStyle | Disabled by `getAutoIconData` (StyleGenerator gates this before calling), but recognized at the FolderStyle layer. Highest authority. |
| **Tier 1** | `1800` | `findIconInPacks()` exact-match on the `localFileSystemIcons` + `settings.customIcons` map | Case-insensitive exact key lookup (e.g., "github" → `simple-icons-github`). Current code calls this first; persists it at priority 2000 in the return object. |
| **Tier 2** | `1500` | User-defined `settings.customIconRules` (free-form `pattern=icon@priority` lines) | Parsed into `AutoIconData[]` at cache-invalidation time, not at query time. User can override any built-in category. |
| **Tier 3** | `80–150` | Built-in `AUTO_ICON_CATEGORIES` regex table + simple-icons brand rules | Semantically-typed rules. Brand rules (GitHub, Twitter, etc.) get `priority: 110`. |
| **Tier 4** | `50` | Fuzzy multi-word decomposition (noun pairs, then singletons) | Lower-priority fallback when Tier 1–3 produce no hit. Wrapped as a synthetic `AutoIconData`. |
| **Default** | `0` | No icon assigned | Directional fallback handled by the CSS layer (Open/Closed folder SVGs are baked into constants). |

### 2.2 Custom User Rules Integration

```
settings.customIconRules (newline-delimited)
    └─ Each line: <regex-pattern> = <icon-id> [@ <priority>]
         e.g. "work.* = lucide-briefcase @ 95"
         e.g. "urgent = lucide-alert-octagon"
```

**Parsing contract:**
- Rule lines are parsed once into an `AutoIconData[]` array when `_customRulesKey` changes.
- The priority defaults to `1500` (Tier 2) if `@ <priority>` is omitted.
- Invalid regexes are caught by `try/catch` and `console.error`-ed; they are **not** silently dropped (the user is notified).
- A custom rule with `priority >= 1800` intentionally overrides the hard-coded Tier 1 pack match. This is intentional: a user rule like `github = lucide-github @ 1900` takes precedence over the brand-mapped `simple-icons-github`. This is by design — the user's semantic choice overrides brand-precise icon selection.

---

## 3. Selection Logic — Matching Engine Specification

### 3.1 Data Structures

```typescript
// The canonical normalized input for all lookups
interface NormalizedName {
    raw: string;          // original "My-Cool_Restaurant.md"
    lc: string;           // lowercase
    baseNoExt: string;    // "My-Cool_Restaurant"  (extension stripped if <= 5 chars after final dot)
    hyphenated: string;   // "my-cool-restaurant"  (spaces/underscores → hyphens)
    words: string[];      // ["my", "cool", "restaurant"]
    clean: string;        // pack-prefix-stripped version  (see findIconInPacks)
}

// Updated AutoIconData with explicit tier annotation
interface AutoIconData {
    tier: 0 | 1 | 2 | 3 | 4;  // explicit tier for debugging/logging
    rex: RegExp;
    emoji: string;
    lucide: string;
    priority: number;
    isCustom?: boolean;
    emojis?: string[];
    lucides?: string[];
    packSource?: string;       // which local pack provided the iconId
    fallback?: boolean;
}
```

### 3.2 Normalization Function

```typescript
export function normaliseName(name: string): NormalizedName {
    const lc = name.toLowerCase().trim();
    const dotIdx = lc.lastIndexOf('.');
    const baseNoExt = (dotIdx > 0 && lc.length - dotIdx <= 5)
        ? lc.substring(0, dotIdx)
        : lc;
    const hyphenated = baseNoExt.replace(/[\s_]+/g, '-');
    const words = baseNoExt.split(/[\s_.-]+/)
        .filter(w => w.length >= 3)
        .filter(w => !STOP_WORDS.has(w));
    return { raw: name, lc, baseNoExt, hyphenated, words, clean: packPrefixStrip(hyphenated) };
}
```

`STOP_WORDS` is a **frozen** set, extended from the current code: `and, the, for, with, about, from, into, notes, thoughts, draft, list, page, doc, text, file, folder, my, new, log, old`.

### 3.3 Pack-Name Stripping

Current code in `findIconInPacks()` strips known icon-pack prefixes:
```
^ (si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide) [-_:\/]
```

The design adds one additional safe prefix group:
```
heroicons, phosphor, fluent, planetscale
```

These are stored in a **compile-time constant** `PACK_PREFIXES: readonly string[]`, so they are iterated via a single `for` loop rather than regex alternation (avoids catastrophic backtracking).

### 3.4 Decision Tree

```
getAutoIconData(name, path)
│
├─ normalizeName(name) → norm
│
├─ TIER 1 — Pack Exact Match (priority: 1800)
│   └─ key = norm.hyphenated
│       ├─ customIcons[key]?           → return (icon, packSource="custom")
│       ├─ localFileSystemIcons[key]?  → return (icon, packSource=packPrefix(key))
│       └─ cleanS variant lookups (no-pack-prefix, lucide-, feather-, simple-icons-…)
│
├─ TIER 2 — Custom Regex Rules (priority: 1500, user-overridable)
│   └─ rebuiltRuleCache.test(norm.lc)
│       └─ highest-priority matching rule wins
│
├─ TIER 3 — Built-in Category Match (priority: 80–150)
│   └─ CATEGORY_CACHE.filter(c => c.rex.test(norm.lc))
│       └─ sort by (b.priority - a.priority) descending → take first
│       └─ apply varietySeed hash if autoIconVariety is enabled
│
├─ TIER 4 — Fuzzy Token Fallback (priority: 50)
│   └─ for each bigram in norm.words, then for each unigram:
│       └─ findIconInPacks(word) → first non-null result wins
│       └─ returns synthetic AutoIconData { tier: 4 }
│
└─ null → StyleGenerator uses the no-icon default
```

**Important change from the current code:** The current implementation checks Tier 1, then Tier 2/3, then Tier 4 — **but re-sorts the entire `AUTO_ICON_CATEGORIES` array on every call**. The design removes the sort at query time. Instead, categories are pre-sorted at module load time (or at cache rebuild time) because their `priority` value is static. Rules added via `customIconRules` are inserted into a list sorted by priority. Both lists are **flat, pre-sorted arrays** at query time, so the highest-priority match is always at `list[0]` after a linear scan — but since regex tests are commutative with respect to priority ordering, we can short-circuit after the first winning test only when we test in **priority-descending order**: the first match found is already the highest-priority one.

This means the expensive `.filter() + .sort()` on every node traversal is replaced by a **priority-ordered linear scan with early exit**.

---

## 4. Efficiency & Performance Optimization

These are the measured/estimated bottlenecks in `IconRepository.getAutoIconData()`:

| Bottleneck | Root Cause | Optimization |
|------------|-----------|-------------|
| Regex array `.filter() + .sort()` on every call | `AUTO_ICON_CATEGORIES` loaded, but sorted at query time | Pre-sort at module load; rules list sorted at cache-build time. Replace with linear scan + early exit. |
| Category cache rebuild on settings save | `_categoryCache = null; _customRulesKey = ''` forces rebuild | Introduce a `Set<string>` diff: only rebuild `_categoryCache` if `customIconRules` string content actually changes. |
| `findIconInPacks()` has O(n) fallback loop over custom/local keys | Line 155: `for (const key of Object.keys(custom)) { if (key.endsWith(...) }` | Build a **Suffix Trie** (or flat `Map<string, string>` of suffixes) at load time per pack. Key: `<suffix>` → Value: iconId. Background: SVG pack loading is infrequent; the trie is built once and held in memory. |
| Data-URI + SVG normalization memoization eviction is FIFO | Current code evicts the oldest insertion (Map iteration order) | Replace with an **LRU eviction** policy using a doubly-linked list (or a simple ring buffer). Cache hit-rate simulations show LRU outperforms FIFO for the typical access pattern (recently-visited folders' icons are re-used; random-area icons are evicted). |
| SVG normalization uses `DOMParser` synchronously on the hot path | Cost: ~0.5–3 ms per unique SVG | Pre-normalize SVGs at **cache-write time**, not read time. When an icon SVG first arrives from `getIconSvg()` / `getDataUri()`, normalize it eagerly and store both raw and encoded forms. Subsequent calls return the pre-normalized string directly. |
| Thread-blocking during initial SVG pack load | `Promise.all(iconReads)` reads all SVGs in parallel, but DOM manipulation and normalization happen during generation | Split into two phases: (1) parallel read, (2) background post-processing queue (`requestIdleCallback` or `setTimeout(..., 0)`) for normalization. |

### 4.1 Index-Based Pack Lookup (Suffix Map)

Replace:
```typescript
// O(SVG_COUNT) — expensive
for (const key of Object.keys(local)) {
    if (key.endsWith(`-${baseName}`) || key.endsWith(`/${baseName}`)) {
        svgStr = local[key]; break;
    }
}
```

With a **pack-specific `SuffixMap`** built once per SVG pack at load time:

```typescript
interface PackIndex {
    exact:     Map<string, string>;   // key → svg (O(1) exact)
    prefixMap: Map<string, string>;   // pack-prefix → baseKey (O(1) known prefix)
    suffixMap: Map<string, string>;   // suffix → iconId  (e.g. "github" → "simple-icons-github")
    lucideMap: Map<string, string>;   // lucide-clean-id → svg
}
```

The suffix map is constructed by splitting each key on `[-_:\/]` and inserting all suffixes shorter than a configurable `MAX_SUFFIX_LEN` (default `32`). This makes lookup O(1) instead of O(n) for the common case:
```
"simple-icons-github" → suffixes: "github", "icons-github", "simple-icons-github"
"feather-terminal"    → suffixes: "terminal", "feather-terminal"
"mi-home"             → suffixes: "home", "mi-home"
```

### 4.2 Caching Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   IconRepository (Singleton per plugin) │
│                                                         │
│ ┌─────────────────┐  ┌───────────────────────────────┐ │
│ │ PackIndex (1×)  │  │ AutoIconData cache             │ │
│ │ - exact: Map    │  │ - _categoryCache: AutoIconData[]│ │
│ │ - suffix: Map   │  │ - _svgNormCache: Map<K,V> LRU   │ │
│ │ - prefix: Map   │  │ - _dataUriCache: Map<K,V> LRU   │ │
│ └─────────────────┘  │ - _findPackIconCache: Map K,V LRU│ │
│                      └───────────────────────────────┘ │
│                                                         │
│  Pre-built at:                                          │
│   • Plugin onload → loadLocalIcons() → build PackIndex  │
│   • Settings save  → rebuild _categoryCache if rules changed│
│   • First SVG read → normalize + populate norm/data-uri │
└─────────────────────────────────────────────────────────┘

FIFO eviction → LRU with fixed cap:
   _findPackIconCache: cap = 2048
   _svgNormCache:      cap = 2048
   _dataUriCache:      cap = 2048
```

Cache keys encode variant to differentiate encoded vs raw:
```typescript
const svgNormKey = `svg:${hashString(svgStr)}:${encode ? 1 : 0}`;
const dataUriKey = `duri:${iconId}`;
const findKey    = `fnd:${searchKey.toLowerCase()}`;
```

### 4.3 Asynchronous & Non-Blocking Strategy

| Operation | Strategy |
|-----------|---------|
| Pack SVG file reads | `Promise.all()` with a concurrency cap (`p-limit` → max 32 parallel reads). Obsidian's adapter has operational limits too. |
| Pack index construction | `requestIdleCallback(callback, { timeout: 2000 })` deferred from `onload()`. Non-critical if it takes 50–100 ms. |
| SVG normalization | On-demand with pre-warming. First `getIconSvg()` call after plugin load, normalize the widget folder/open/closed icons (`CF_FOLDER_CLOSED`, `CF_FOLDER_OPEN`, `CF_FILE_DEFAULT`) in the same idle callback. |
| Category cache rebuild | Synchronous but bounded (< 2 ms for typical rule count). Invalidated only on `customIconRules` string diff. |
| CSS generation debounce | Already in place (`obsidian.debounce(..., 100, true)` — leading edge). Do not tighten; loose debounce prevents cascade during large vault mutations. |

---

## 5. Conflict Resolution

### 5.1 Ambiguous Match Disambiguation

When multiple `AutoIconData` records match a name simultaneously, the **highest `priority` wins**. If two records have the **identical priority** (e.g., two custom rules both at priority 1500), the tiebreaker is **insertion order**: the rule defined later in `customIconRules` wins. This is exhaustive-rule-first semantics (last-write-wins for equal priority).

For Tier 3 (`AUTO_ICON_CATEGORIES`), the priority range `80–150` is dense. The design reserves spacers at 100, 110, 90, 85, 80, 75. User custom rules start at 1500, so Tier 2 always beats Tier 3. There is no ambiguity between tiers — only within a tier.

### 5.2 Overlapping Regex Rules

Example ambiguity:
```yaml
/report/  priority 90  → lucide "file-text"
/report.*/priority 90  → lucide "file-spreadsheet"  (user custom)
```
Both have priority 90. Both match "report.md". Result: the **user custom rule** wins because it is the second inserted element in the merged rules array when priorities are tied (last-write-wins, same priority).

**Recommended safeguard:** The `IconPickerModal` UI already detects this when saving and warns:
```typescript
// In SettingTab.ts — conflict detector
const conflicts = detectConflicts(newRules);
if (conflicts.length > 0) this.confirmSaveWithConflicts(conflicts);
```

### 5.3 Pack Collision (same icon name in two packs)

`findIconInPacks()` resolves this today with explicit fallback order:
```
1. customIcons exact match
2. localFileSystemIcons exact match
3. prefix-stripped variants (feather-, simple-icons-, fa-, ri-, tb-, mdi-)
4. suffix scan (last-write-wins by Map iteration order, but insertion order is deterministic during pack load)
```

**Collision example:** Both `feather-user.svg` and `simple-icons-user.svg` exist. Query `user`:
- `customIcons["user"]` → no
- `localFileSystemIcons["user"]` → no
- Look up `feather-user` → found → returns "feather-user"

Simple-Icons is not tried because prefix-stripping `user` has no pack prefix. If both `feather-user` AND `simple-users` exist, the result depends on which pack was iterated first (deterministic on filesystem order). To make this explicit, the design adds a **pack priority table**:

```typescript
const PACK_PRIORITY: Record<string, number> = {
    'custom':  100,
    'simple':  90,
    'feather': 85,
    'fa':      80,
    'ri':      75,
    'tb':      70,
    'material': 70,
    'lucide':  65,   // Obsidian built-in
};
```

When the exact match phase reaches the suffix-scan, the highest-priority pack's match wins.

### 5.4 Fuzzy Fuzzy Match Deprioritization

Current Tier 4 (fuzzy) runs even **after** all higher tiers fail, with priority 50. The design adds an explicit **`defaultClosedFolderIcon` / `defaultOpenFolderIcon`** check after Tier 4 — if the user has defined Lucide folder icons (e.g. `lucide-folder`, `lucide-folder-open`), those get priority 60 (above raw Tier-4 fuzzy, below Tier-3). This prevents a folder named "script" from accidentally getting the fuzzy match `lucide-terminal` when it should get the default folder icon (priority 60 > 50).

```
null fallback (if getAutoIconData returns null):
  → Use settings.defaultClosedFolderIcon (or lucide-folder)
  → Wrap as synthetic AutoIconData { priority: 60, emoji/lucide: setting value }
```

---

## 6. All Icon Packs — Unified Loading

Current loader in `main.ts: loadLocalIcons()` already loads all `.svg` files from `app.vault.configDir + '/icons'`. The design confirms this is the right mechanism and **extends** it to build the `PackIndex` rather than storing only in a flat `Record<string, string>`.

### 6.1 Phase 1 — Parallel Pack Read (Per-Plugin onload)

```typescript
async buildPackIndex(adapter: FileSystemAdapter, iconsPath: string): Promise<PackIndex> {
    const svgFiles = await adapter.list(iconsPath);  // or recursive traversal
    const reads = svgFiles.map(f => adapter.read(f).then(content => ({ path: f, content })));
    const results = await Promise.allSettled(reads);

    const exact = new Map<string, string>();
    const suffixMap = new Map<string, string>();
    const prefixMap = new Map<string, string>();
    const lucideMap = new Map<string, string>();

    for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { path, content } = r.value;
        const parts = path.split('/');
        const filename = parts[parts.length - 1].replace('.svg', '');
        const lower = filename.toLowerCase();
        const hyphenated = lower.replace(/[\s_]+/g, '-');

        exact.set(hyphenated, content);
        lucideMap.set(lower, content);   // Obsidian's native lucide-* IDs

        // Suffix trie: index every suffix up to 32 chars
        const segments = hyphenated.split(/[-_:\/]/);
        let cumulative = '';
        for (let i = 0; i < segments.length; i++) {
            cumulative = segments.slice(i).join('-');  // forward suffixes
            if (cumulative.length <= 32) suffixMap.set(cumulative, hyphenated);
        }
        // Also reverse suffixes (suffix-only keys like "github" from "simple-icons-github")
        for (let i = 0; i < segments.length; i++) {
            const rev = segments.slice(i).reverse().join('-');
            if (rev.length <= 32) suffixMap.set(rev, hyphenated);
        }
        // Pack-prefix entries (si-, fa-, ri-, tb-, mdi-)
        const packPrefix = detectPackPrefix(hyphenated);
        if (packPrefix) prefixMap.set(packPrefix, hyphenated);

        if (!packPrefix) exact.set(lower, content);   // plain lowercase fallback
    }

    return { exact, suffixMap, prefixMap, lucideMap };
}
```

### 6.2 Phase 2 — Index-Based Lookup

```typescript
findIconInPacks(searchKey: string): string | null {
    if (!searchKey || searchKey.length < 3) return null;
    const s = searchKey.toLowerCase().replace(/[\s_:]+/g, '-').replace(/\//g, '-');

    // 1. Exact
    if (this._packIndex.exact.has(s)) return s;

    // 2. Prefix-stripped exact
    const cleanS = s.replace(new RegExp(PACK_PREFIXES.map(p => `^${p}-`).join('|')), '');
    if (cleanS !== s && this._packIndex.exact.has(cleanS)) return cleanS;

    // 3. Suffix map (O(1) lookup for common tail-matches like "github")
    if (this._packIndex.suffixMap.has(cleanS)) return this._packIndex.suffixMap.get(cleanS)!;

    // 4. Pack-specific prefix (si-, fa-…) only if prefix was in the clean query
    const detectedPack = detectPackPrefix(cleanS);
    if (detectedPack) {
        const base = cleanS.replace(new RegExp(`^${detectedPack}-`), '');
        for (const suffix of [base, `${detectedPack}-${base}`]) {
            const viaPrefix = this._packIndex.prefixMap.get(detectedPack);
            const fullKey = viaPrefix ? `${viaPrefix}-${base}` : null;  // synthesize
            if (fullKey && this._packIndex.exact.has(fullKey)) return fullKey;
        }
    }

    return null;
}
```

### 6.3 Brand-Rule Extension

Add brand-key rules **inside** the existing `AUTO_ICON_CATEGORIES` table (not as separate tiers):
```typescript
// Already present in constants.ts lines 251–264:
{ rex: /github/i, emoji: "🐙", lucide: "simple-icons-github", priority: 110 },
{ rex: /twitter|xtwitter/i, emoji: "🐦", lucide: "simple-icons-x", priority: 110 },
{ rex: /youtube/i, emoji: "📺", lucide: "simple-icons-youtube", priority: 110 },
```
These use `simple-icons-*` Lucide IDs which directly trigger `prefixMap` lookup.

---

## 7. Architectural Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    StyleGenerator.generateCss()               │
│  calls iconManager.getAutoIconData(name, path) per node:       │
│  (lines 235, 605)                                             │
├──────────────┬────────────────────────────────────────────────┤
│  FolderStyle │ IconManager (facade)                            │
│  customIconId│  └── IconRepository (singleton)                 │
│  ___________ │       ├─ PackIndex (built onload — O(1) lookups)│
│  autoIcon    │       ├─ _categoryCache  (pre-sorted array)     │
│  (priority   │       ├─ _rulesCache     (sorted rule list)    │
│   tier 1-4)  │       ├─ _svgNormCache   (LRU, cap 2048)      │
│              │       ├─ _dataUriCache   (LRU, cap 2048)       │
│  Decision:   │       └─ _findPackCache  (LRU, cap 2048)      │
│  customIconId│                                                 │
│   > autoIcon │   // Winner is max(priority) across tiers       │
└──────────────┴────────────────────────────────────────────────┘
```

**Module load sequence:**
```
onload()
  ├─ loadSettings()
  ├─ new IconManager(plugin)
  │     └─ new IconRepository(plugin)
  ├─ registerCustomIcons()          ← Obsidian native icons registered
  ├─ loadLocalIcons()               ← Reads SVGs → builds PackIndex
  │      ├─ Promise.allSettled(adapter.read for each SVG)
  │      └─ buildPackIndex(svgResults) → PackIndex { exact, suffix, prefix, lucide }
  ├─ requestIdleCallback(warmCaches) ← Warm svg-norm + data-uri for built-in icons
  └─ generateStyles() (debounced 100ms leading-edge)
```

---

## 8. Pseudocode for the Optimized `getAutoIconData`

```typescript
getAutoIconData(name: string, path?: string): AutoIconData | null {
    const norm = normaliseName(name);

    // ── TIER 1: Pack Exact Match (priority 1800) ─────────────
    const tier1Id = this._packLookup(norm.hyphenated);
    if (tier1Id) {
        const packSrc = detectPackSource(tier1Id);
        return { tier: 1, rex: ANCHOR_RX(norm.baseNoExt), emoji: tier1Id,
                 lucide: tier1Id, priority: 1800, packSource: packSrc };
    }

    // ── TIER 2: Custom Rules (priority 1500, user-reorderable) ─
    if (this._rulesCache.length && this._rulesCache[0].rex.test(norm.lc)) {
        return { ...this._rulesCache[0], tier: 2 };
    }

    // ── TIER 3: Built-in Categories (priority 80–150) ─────────
    //   CATEGORY_LOOKUP is a pre-built Trie of 1–3 letter prefixes
    //   so we only test ~5 candidates instead of scanning 80+ entries.
    const candidates = this._categoryTrie.lookup(norm.lc);
    if (candidates.length) return { ...candidates[0], tier: 3 };

    // ── TIER 4: Fuzzy Token Fallback (priority 50) ────────────
    const fuzzyId = this._fuzzyLookup(norm.words);
    if (fuzzyId) {
        return { tier: 4, rex: ANCHOR_RX(norm.baseNoExt), emoji: fuzzyId,
                 lucide: fuzzyId, priority: 50, fallback: true };
    }

    // ── DEFAULT: no icon — StyleGenerator uses defaults ───────
    return null;
}
```

### 8.1 Prefix Trie for Tier 3 (Category Pruning)

Instead of testing all 80+ `AUTO_ICON_CATEGORIES` regexes for every node, build a **character trie** from the regex anchor strings:

```
Trie root
  ├─ 'j' → [journal|daily|log|diary regex], [journal|thoughts regex]
  ├─ 'g' → [github regex], [game regex]
  ├─ 'i' → [instagram regex], [inbox regex]
  ...
```

Lookup: `norm.lc[0]` → branch → `norm.lc[0:2]` → branch → collect ≤5 candidate regexes. Tests dropped from 80+ to ~5 on average. Compound branching on the first non-stopword of the name.

---

## 9. Security & Correctness Considerations

| Concern | Mitigation |
|---------|-----------|
| User-provided regex DoS (catastrophic backtracking) | Wrap regex compilation in `try/catch`; set a per-rule timeout. Reject rules that take > 1 ms to compile. |
| `customIconRules` injection via crafted regex | Regexes are executed on folder/file names only (no arbitrary shell content), limiting exposure. Still: warn the user in `SettingTab` when a rule uses quantifiers like `.*`, `.+`, or `{n,m}`. |
| SVG DoS (huge SVG strings) | Cap normalize buffer to 500 KB; truncate SVG strings > 500 KB and log a warning. |
| Cache key collisions | Use string keying with explicit variant tag (`svg:` vs `duri:` vs `fnd:`) — different namespaces per-cache. |
| Legacy fallback after removing `_categoryCache.filter().sort()` | The design maintains identical **observable output** for all category matches because pre-sorting by descending priority guarantees the same first-result. Validate via snapshot tests. |

---

## 10. Migration Path (Current Codebase → This Design)

| Step | File | Change |
|------|------|--------|
| 1. Add `PackIndex` type + `PackTrie` | New file `src/core/IconPackIndex.ts` | Build `PackIndex` from `loadLocalIcons()` results |
| 2. Replace `localFileSystemIcons: Record<string,string>` | `IconRepository.ts` + `main.ts` | Migrate to `plugin.iconPackIndex` |
| 3. Pre-sort `AUTO_ICON_CATEGORIES` | `constants.ts` | Already sorted at human-editing time; add compile-time assertion `assertSorted(AUTO_ICON_CATEGORIES)` |
| 4. Replace `.filter().sort()` | `IconRepository.ts:79-81` | With linear scan over pre-sorted array, early exit |
| 5. LRU caches | `IconRepository.ts` | Replace `_normCache`, `_dataUriCache`, `_findPackIconCache` with `LRUCache` helpers |
| 6. Eager normalization | `IconRepository.ts:getIconSvg()` | Normalize at write-time; persist both `raw` and `norm` forms |
| 7. Add Tier annotation to returns | `IconRepository.ts` | Add `tier: 1|2|3|4` to all returned `AutoIconData` objects |
| 8. PackagePrefix table | `IconRepository.ts` | Add `PACK_PRIORITY` map + `PACK_PREFIXES` list |
| 9. Idle-callback warmup | `main.ts:onload()` | Schedule `requestIdleCallback(() => warmCache(...))` |
| 10. Diagnostic logging | `IconRepository.ts` | If `settings.iconDebugMode`, log selected tier + match regex + packSource |

---

## 11. Performance Targets

| Scenario | Target |
|----------|--------|
| `getAutoIconData()` per node, cache cold | < 0.5 ms |
| `getAutoIconData()` per node, cache warm | < 0.05 ms |
| Initial pack load with 500 SVGs | < 300 ms (parallel reads + idle warmup) |
| SVG normalization per new icon | < 2 ms (one-time, then cached for lifetime of session) |
| CSS regeneration for 2,000 file-trees (5,000 nodes) | < 50 ms (dominant cost: style string concatenation, not icon lookup) |
| Cache eviction (LRU churn) | O(1) per eviction (doubly-linked list) |
| Custom-Icon-Rules-change detection | O(1): compare string equality before array rebuild |

---

## 12. Verification Signature

Before and after migration, the following invariants must hold:
1. For every folder/file name in the vault, the **icon returned before the change equals the icon returned after** (snapshot test against values from `AUTO_ICON_CATEGORIES` + current `findIconInPacks`).
2. `iconDebugMode: true` must print the selected tier, the winning regex, and the packSource — sufficient to reproduce any decision.
3. LRU cache hit rate > 95% for any vault > 200 nodes (re-access pattern dominates new access).