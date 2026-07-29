The error keeps recurring because the root cause is systemic — the AI returns human-readable concept names (with spaces, version suffixes, and multi-word phrases) that don't match any icon ID format. The `resolveSmartIcon` pipeline has gaps at every stage. Here's a logical, comprehensive fix that works for all files.

---

### Why It Happens for ALL Files with Multi-Word Concepts

The AI doesn't know your installed icon IDs. It returns what it thinks is a reasonable name — `"Places MOC-1.6"`, `"Project Management"`, `"Data Analysis"` — but your icon packs use IDs like `"map"`, `"briefcase"`, `"bar-chart-2"`. The resolution pipeline fails because:

1. **Spaces** — no icon ID contains spaces
2. **Version suffixes** — the AI appends `-1.6`, `-2.0`, etc. from the concept name
3. **Multi-word concepts** — no single word in `"Places MOC"` matches an icon ID
4. **The compound substring list** (line 290) only has 18 entries — it misses most real-world concepts
5. **Word extraction** (step 5) splits on hyphens/underscores but individual words like `"moc"` and `"places"` aren't valid icons either
6. **Fuzzy search** (step 4) uses a 0.8 threshold — too strict for short, dissimilar words

---

### Fix: 4-Layer Defense

**Layer 1 — Normalize AI output before resolution** (prevents the problem at the source)

Add a normalization step right after `cleanIcon` is computed (line 242):

```typescript
const cleanIcon = String(rawIcon).trim();
if (cleanIcon) {
    // Normalize: strip version suffixes, replace spaces with hyphens, remove invalid chars
    const normalized = cleanIcon
        .replace(/[-_]v?\d+(\.\d+)*$/, '')   // strip "-1.6", "_2.0" suffixes
        .replace(/[\s_]+/g, '-')              // spaces/underscores → hyphens
        .replace(/[^a-z0-9\-]/gi, '')         // remove non-alphanumeric (except hyphens)
        .replace(/-+/g, '-')                  // collapse multiple hyphens
        .replace(^-+|-+$/g, '')               // trim leading/trailing hyphens
        .toLowerCase();
```

Use `normalized` in the `resolveSmartIcon` call instead of `cleanIcon`. This converts `"Places MOC-1.6"` → `"places-moc"` before resolution even starts.

**Layer 2 — Expand compound substring matching** (catches what word extraction misses)

Replace the 18-entry hardcoded list with a comprehensive one covering all icon categories:

```typescript
const COMPOUND_SUBSTRINGS = [
    // Navigation & location
    'map', 'pin', 'marker', 'location', 'geo', 'globe', 'compass', 'direction', 'route', 'navigation',
    // Objects & items
    'book', 'file', 'folder', 'document', 'note', 'text', 'write', 'pen', 'pencil', 'paper',
    // Technology & code
    'code', 'terminal', 'cpu', 'chip', 'dev', 'gear', 'settings', 'wrench', 'tool', 'build', 'plug', 'api',
    // Media
    'image', 'photo', 'video', 'music', 'audio', 'sound', 'play', 'film', 'camera', 'microphone', 'speaker',
    // Data & analytics
    'data', 'chart', 'graph', 'analytics', 'stats', 'number', 'calc', 'math', 'formula', 'function',
    // People & social
    'user', 'people', 'team', 'group', 'chat', 'message', 'comment', 'social', 'contact', 'account', 'profile',
    // Actions & status
    'download', 'upload', 'share', 'sync', 'export', 'import', 'copy', 'paste', 'delete', 'trash', 'add', 'create',
    // States & qualities
    'lock', 'unlock', 'shield', 'security', 'key', 'password', 'safe', 'check', 'checkmark', 'done', 'complete',
    'alert', 'warn', 'error', 'help', 'info', 'question', 'search', 'filter', 'sort', 'view', 'eye', 'visible',
    // Time & calendar
    'calendar', 'clock', 'time', 'date', 'schedule', 'event', 'reminder', 'history', 'archive', 'backup',
    // Places & spaces
    'home', 'house', 'building', 'office', 'room', 'place', 'spot', 'area', 'zone', 'floor', 'wall',
    // Nature & elements
    'plant', 'leaf', 'tree', 'flower', 'sun', 'moon', 'star', 'weather', 'rain', 'cloud', 'snow', 'wind',
    // Emotions & abstract
    'brain', 'think', 'idea', 'lightbulb', 'spark', 'heart', 'love', 'favorite', 'star', 'like',
    // Business & finance
    'money', 'dollar', 'coin', 'credit', 'bank', 'wallet', 'briefcase', 'work', 'job', 'career', 'meeting',
    // Health & fitness
    'health', 'fitness', 'exercise', 'workout', 'gym', 'run', 'walk', 'heart', 'pulse', 'medical', 'hospital',
    // Travel & transport
    'travel', 'flight', 'plane', 'car', 'vehicle', 'drive', 'road', 'trip', 'vacation', 'hotel', 'map',
    // Education
    'school', 'study', 'learn', 'course', 'class', 'book', 'graduation', 'student', 'teacher', 'exam',
    // Communication
    'mail', 'email', 'message', 'chat', 'comment', 'notification', 'bell', 'phone', 'call', 'video',
];
```

**Layer 3 — Lower the fuzzy search threshold for individual words** (step 5)

The current `searchFuzzy` uses threshold 0.8 — too strict for short, dissimilar words like `"moc"` vs `"map"`. Add a secondary fuzzy pass with threshold 0.5:

```typescript
// After step 4 (pack search), add:
const fuzzyHit = plugin.iconManager.searchFuzzy(lowerClean, { threshold: 0.5 });
if (fuzzyHit) return fuzzyHit;
```

And in the word extraction loop (step 5), add the same relaxed fuzzy pass for each individual word:

```typescript
const fuzzyWordHit = plugin.iconManager.searchFuzzy(word, { threshold: 0.5 });
if (fuzzyWordHit) return fuzzyWordHit;
```

**Layer 4 — Final fallback to auto-icon system** (prevents the error entirely)

When `resolveSmartIcon` returns null, instead of just logging a warning and skipping, fall back to the plugin's existing auto-icon system. This ensures every file gets an icon:

```typescript
const matchedIcon = resolveSmartIcon(cleanIcon);
if (matchedIcon) {
    conceptMap.set(key, matchedIcon);
    conceptMap.set(normalizeKey(key), matchedIcon);
} else {
    // Fallback: use the auto-icon system based on the file/folder name
    const autoIcon = plugin.iconManager.getAutoIconData(
        batchTargets.find(t => t.path === key)?.name || key
    );
    if (autoIcon) {
        const fallbackIcon = plugin.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji;
        conceptMap.set(key, fallbackIcon);
        conceptMap.set(normalizeKey(key), fallbackIcon);
    } else {
        console.warn(`Colorful Folders AI: Skipping invalid icon string "${cleanIcon}" for "${key}"`);
    }
}
```

---

### Why This Works for ALL Files

| Layer | What it catches | Example |
|-------|----------------|---------|
| **1. Normalization** | Version suffixes, spaces, invalid chars | `"Places MOC-1.6"` → `"places-moc"` |
| **2. Expanded substrings** | Multi-word concepts the AI returns | `"places-moc"` contains `"place"` → matches `"place"` icon |
| **3. Relaxed fuzzy** | Short/dissimilar word matches | `"moc"` fuzzy-matches `"map"` at 0.5 threshold |
| **4. Auto-icon fallback** | Anything the AI returns that can't be resolved | Falls back to the existing auto-icon system, so no file is ever skipped |

The combination means every AI-returned icon string either gets resolved to a valid icon or falls back to the auto-icon system — eliminating the warning entirely.