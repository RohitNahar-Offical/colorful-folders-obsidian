/**
 * IconRuleSet — SRP module that owns ALL custom icon rule compilation,
 * storage, and scoped lookup.
 *
 * Extracted from IconRepository so that rule-management concerns are
 * fully separate from icon-resolution concerns.
 *
 * Rule serialization (backward-compatible):
 *   pattern = icon [@priority] [::target]
 *
 *   target  = "folders" | "files" | "all"  (default: "all")
 *
 * @module IconRuleSet
 */

/** Which node types a rule applies to. */
export type RuleTarget = 'all' | 'folders' | 'files';

/** A compiled, bucket-ready icon rule. */
export interface CompiledRule {
    /** The compiled regex used for matching. */
    rex: RegExp;
    /** Emoji / icon string (fallback). */
    emoji: string;
    /** Lucide icon id (preferred). */
    lucide: string;
    /** Numeric priority; higher wins. */
    priority: number;
    /** Always true for custom rules. */
    isCustom: boolean;
    /** Scope: folders-only, files-only, or both. */
    target: RuleTarget;
    /** true = plain-word (stored in O(1) Map); false = regex (stored in array). */
    isExact: boolean;
    /** Lower-case normalized key used as the Map key (only when isExact = true). */
    exactKey?: string;
}

/**
 * Dual-bucket rule engine — O(1) exact/token lookup + O(n_regex) regex scan.
 *
 * Keeps three sets of buckets, one per target scope (folders, files, all).
 * On lookup the caller passes `isFile` so only the relevant + universal
 * buckets are queried, completely skipping rules meant for the other type.
 */
export class IconRuleSet {
    // ── Exact-match Maps (O(1)) ────────────────────────────────────────────
    private _folderExact    = new Map<string, CompiledRule>();
    private _fileExact      = new Map<string, CompiledRule>();
    private _universalExact = new Map<string, CompiledRule>();

    // ── Regex arrays (sorted by priority desc) ─────────────────────────────
    private _folderRegex:    CompiledRule[] = [];
    private _fileRegex:      CompiledRule[] = [];
    private _universalRegex: CompiledRule[] = [];

    /** Total number of rules successfully compiled. */
    private _size = 0;

    // ── Public API ─────────────────────────────────────────────────────────

    get size(): number  { return this._size; }
    get isEmpty(): boolean { return this._size === 0; }

    /**
     * Parse and compile a raw `customIconRules` string into buckets.
     * Calling build() with an empty string resets all state.
     *
     * @param rawRules  Newline-delimited string of rules.
     */
    build(rawRules: string): void {
        this._folderExact.clear();
        this._fileExact.clear();
        this._universalExact.clear();
        this._folderRegex    = [];
        this._fileRegex      = [];
        this._universalRegex = [];
        this._size           = 0;

        if (!rawRules) return;

        const lines = rawRules.split('\n').filter(r => r.trim().length > 0);

        for (const line of lines) {
            try {
                const rule = this._parseLine(line);
                if (!rule) continue;

                this._route(rule);
                this._size++;
            } catch (e) {
                console.error('Colorful Folders: Failed to compile icon rule:', line, e);
            }
        }

        // Sort regex arrays by priority descending so the first match wins
        this._folderRegex.sort(   (a, b) => (b.priority || 0) - (a.priority || 0));
        this._fileRegex.sort(     (a, b) => (b.priority || 0) - (a.priority || 0));
        this._universalRegex.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * Look up the best matching rule for a node.
     *
     * @param contexts  Array of name variants to test (e.g. [lName, sanitized, parentFolder]).
     * @param isFile    true = file node; false = folder node; undefined = unknown (try all).
     * @returns  The winning CompiledRule or null.
     */
    lookup(contexts: string[], isFile?: boolean): CompiledRule | null {
        // ── Fast Path A: O(1) exact + token matches ────────────────────────
        const hit = this._exactLookup(contexts, isFile);
        if (hit) return hit;

        // ── Fast Path B: Regex scan (only the relevant buckets) ───────────
        return this._regexLookup(contexts, isFile);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Parse one rule line into a CompiledRule (or null if invalid).
     *
     * Grammar:
     *   pattern = icon [@priority] [::target]
     */
    private _parseLine(line: string): CompiledRule | null {
        // Split on the first '=' only
        const eqIdx = line.indexOf('=');
        if (eqIdx < 0) return null;

        const pattern    = line.slice(0, eqIdx).trim();
        let   secondHalf = line.slice(eqIdx + 1).trim();

        if (!pattern || !secondHalf) return null;

        // Extract optional ::target suffix FIRST (so '@' in target label is safe)
        let target: RuleTarget = 'all';
        const scopeMatch = secondHalf.match(/::(\w+)\s*$/);
        if (scopeMatch) {
            const raw = scopeMatch[1].toLowerCase();
            if (raw === 'folders' || raw === 'folder') {
                target = 'folders';
            } else if (raw === 'files' || raw === 'file') {
                target = 'files';
            } else {
                target = 'all';
            }
            secondHalf = secondHalf.slice(0, secondHalf.length - scopeMatch[0].length).trim();
        }

        // Extract optional @priority suffix
        let priority = 1500;
        if (secondHalf.includes('@')) {
            const prioParts = secondHalf.split('@');
            secondHalf = prioParts[0].trim();
            const parsed = parseInt(prioParts[1]);
            if (!isNaN(parsed)) priority = parsed;
        }

        const iconStr = secondHalf.trim();
        if (!iconStr) return null;

        // Decide exact vs regex
        const hasRegexMeta = /[.*+?^${}()|[\]\\]/.test(pattern);
        let rex: RegExp;
        let isExact = false;
        let exactKey: string | undefined;

        if (!hasRegexMeta) {
            isExact  = true;
            exactKey = pattern.toLowerCase().trim();
            rex      = new RegExp(`^${pattern}$|\\b${pattern}\\b|${pattern}`, 'i');
        } else {
            rex = new RegExp(pattern, 'i');
        }

        return {
            rex,
            emoji:    iconStr,
            lucide:   iconStr,
            priority,
            isCustom: true,
            target,
            isExact,
            exactKey
        };
    }

    /** Route a compiled rule into the correct bucket(s). */
    private _route(rule: CompiledRule): void {
        if (rule.isExact && rule.exactKey) {
            const key = rule.exactKey;
            if (rule.target === 'folders') {
                if (!this._folderExact.has(key))    this._folderExact.set(key, rule);
            } else if (rule.target === 'files') {
                if (!this._fileExact.has(key))      this._fileExact.set(key, rule);
            } else {
                if (!this._universalExact.has(key)) this._universalExact.set(key, rule);
            }
        } else {
            if (rule.target === 'folders') {
                this._folderRegex.push(rule);
            } else if (rule.target === 'files') {
                this._fileRegex.push(rule);
            } else {
                this._universalRegex.push(rule);
            }
        }
    }

    /** O(1) exact + token-level lookup across the relevant Maps. */
    private _exactLookup(contexts: string[], isFile?: boolean): CompiledRule | null {
        const maps = this._mapsForType(isFile);
        if (maps.every(m => m.size === 0)) return null;

        // 1. Direct context hit
        for (const ctx of contexts) {
            for (const map of maps) {
                const hit = map.get(ctx);
                if (hit) return hit;
            }
        }

        // 2. Word-token hit (split on non-alphanum boundaries)
        const tokenSet = new Set<string>();
        for (const ctx of contexts) {
            for (const w of ctx.split(/[^\p{L}\p{N}]+/gu)) {
                if (w.length >= 1) tokenSet.add(w);
            }
        }
        for (const token of tokenSet) {
            for (const map of maps) {
                const hit = map.get(token);
                if (hit) return hit;
            }
        }

        return null;
    }

    /** Regex scan across the relevant arrays. */
    private _regexLookup(contexts: string[], isFile?: boolean): CompiledRule | null {
        const arrays = this._arraysForType(isFile);
        if (arrays.every(a => a.length === 0)) return null;

        for (const ctx of contexts) {
            for (const arr of arrays) {
                for (const rule of arr) {
                    if (rule.rex.test(ctx)) return rule;
                }
            }
        }
        return null;
    }

    /**
     * Return the Maps relevant for the node type.
     * isFile = true  → file + universal
     * isFile = false → folder + universal
     * isFile = undef → all three
     */
    private _mapsForType(isFile?: boolean): Map<string, CompiledRule>[] {
        if (isFile === true)  return [this._fileExact,   this._universalExact];
        if (isFile === false) return [this._folderExact, this._universalExact];
        return [this._folderExact, this._fileExact, this._universalExact];
    }

    /** Same logic for regex arrays. */
    private _arraysForType(isFile?: boolean): CompiledRule[][] {
        if (isFile === true)  return [this._fileRegex,   this._universalRegex];
        if (isFile === false) return [this._folderRegex, this._universalRegex];
        return [this._folderRegex, this._fileRegex, this._universalRegex];
    }
}

