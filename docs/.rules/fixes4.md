Verified against current `IconRepository.ts`. The real state is more nuanced than the walkthrough claims.

---

## What's Actually in the Code

### 1. "Eager SVG Normalization & Dual Storage" — **Partially implemented, claim overstated**

**What exists (lines 256–261):**
```typescript
// Eagerly pre-warm opposite encoding state to avoid second DOMParser pass
const altKey = (shouldEncode ? '0:' : '1:') + iconId;
if (this.plugin.iconCache && !this.plugin.iconCache.has(altKey)) {
    const altNorm = this.normalizeSvg(svgStr, !shouldEncode);
    this.plugin.iconCache.set(altKey, altNorm);
}
```

**What this actually does:** When `getIconSvg()` is called with `shouldEncode=true`, it pre-computes and caches the `shouldEncode=false` variant in `this.plugin.iconCache` (not `_normCache`). The second call with the opposite encoding hits `iconCache` directly and returns without entering `normalizeSvg()`.

**What was claimed vs reality:**
| Claim | Reality |
|-------|---------|
| "normalize at write-time" | Still calls `this.normalizeSvg(svgStr, shouldEncode)` at line 252 on every first-access of a unique `iconId+encode` combination |
| "bypass DOMParser stalls" | Only bypasses DOMParser on the **second** encoding variant; the first variant still pays the full DOMParser cost |
| "dual storage" | The dual write is conditional (`!this.plugin.iconCache.has(altKey)`) and only pre-warms the opposite variant after the first call |

**Assessment:** This is a real optimization (cuts roughly half the DOMParser calls for icons accessed in both encodings), but it's not the "eager normalization at write-time" the plan described. The original raw SVG string is still retrieved, passed through `normalizeSvg()` on first access, and the normalized result is then cached. There is no path that avoids DOMParser entirely for the first request of any given icon.

### 2. "Category Trie & Candidate Pruning (Tier 3)" — **Implemented, but not a trie**

**What exists (lines 86–92):**
```typescript
const firstChar = lName.charAt(0);
for (let i = 0; i < this._categoryCache.length; i++) {
    const cat = this._categoryCache[i];
    if (!cat.isCustom && cat.rex.source.length > 3 
        && !cat.rex.source.includes(firstChar) 
        && !cat.rex.source.startsWith('.') 
        && !cat.rex.source.startsWith('\\')) {
        continue;
    }
    if (cat.rex.test(lName)) { ... }
}
```

**What this actually does:** A **first-character guard filter** — for non-custom categories with regex source length > 3, it skips the rule if the lowercased first character of the folder/file name does not appear anywhere in the regex source string (with safe-list exceptions for `.` and `\`-prefixed patterns).

**What was claimed vs reality:**
| Claim | Reality |
|-------|---------|
| "Category Trie" | No trie. No `CategoryTrieNode`, no prefix branching, no candidate collection. It's a flat `Array.filter` by first character. |
| "reduce evaluations from 80+ to ≤5 per query" | Metric depends on name distribution. For names starting with rare letters (e.g., 'z', 'q', 'x'), many more categories survive the filter. The guard is sound (cannot skip a matching category) but conservative. |

**Correctness assessment:** The filter is safe — a regex match requires the searched string to contain characters the pattern matches, so if the first character of the input doesn't appear anywhere in the regex source, no regex engine can produce a match for that input. The `startsWith('.')` and `startsWith('\\')` guards protect dotfile and escape-prefixed patterns. No false negatives possible.

---

## Summary

| Item | Claimed | Actual | Verdict |
|------|---------|--------|---------|
| Eager SVG normalization | Full eager normalization at write-time | Opposite-encoding pre-warm in `iconCache` after first `normalizeSvg()` call | **Partial** — real optimization, but not as described |
| Category trie | Prefix-trie pruning to ≤5 candidates | First-character guard filter on the linear scan | **Partial** — works, but is a much simpler heuristic than the plan's trie |

**Both items are improvements and safe.** Neither is a regression. The remaining gap vs the original plan is:
- No true write-time eager normalization (still have DOMParser on every new encoding variant)
- No structured trie for category pruning (still linear scan, just with a skip condition)

The build and lint are clean. The code is strictly better than the baseline, even if it doesn't match the full ambition of the plan documents.