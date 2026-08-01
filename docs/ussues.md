=Refactored `embedingmodel.ts` with the following improvements:

**Performance Optimizations:**
- Added LRU query cache (max 2048 entries) with 5-minute TTL to avoid recomputing identical lookups
- Pre-normalized and cached `IconVector` structures (tokens, normalized Map, domain Set) instead of recomputing per query
- Three-gram generation now bounded by `THREE_GRAM_MIN_LENGTH` (5) and `THREE_GRAM_MAX_LENGTH` (16) with a static cache to prevent token explosion
- Cosine similarity iterates over the smaller vector for fewer Map lookups
- Dictionary brand matching uses prefix matching for partial hits
- `classifyTargets` deduplicates paths before classification

**Intelligence & Accuracy Improvements:**
- Introduced `QueryContext` capturing filename, extension, parent folder, path depth, and folder flag
- Added `FILE_EXTENSION_DOMAINS` mapping (`.py` → python/code, `.md` → file-text/pen-tool, etc.) that boosts contextually relevant icons by 1.25x
- Added `FOLDER_HINT_DOMAINS` mapping (`src` → code/terminal, `assets` → image/layers, etc.)
- Direct dictionary hits now check prefix matches (`react-native` → `react`)
- Returns confidence tiers (`high`/`medium`/`low`) based on score thresholds
- Graceful fallback to extension and folder-hint icons when no strong match exists
- Stopped-word filtering remains, but filtered words fallback to raw words to prevent empty queries

**API Changes:**
- `findBestIcons` now accepts optional `isFolder` in options for folder-aware scoring
- Returns `confidence` field in `VectorMatchResult`
- Added `getCacheStats()` and `clearCache()` for observability

TypeScript compilation passes cleanly.