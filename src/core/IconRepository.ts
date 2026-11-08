import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES, STOP_WORDS, GENERIC_SUFFIX_WORDS } from '../common/constants';
import { hashString, stemWord, stripIconPrefix } from '../common/utils';
import { IconPackIndex } from './IconPackIndex';
import { LRUCache } from '../common/LRUCache';
import { CategoryTrie } from './CategoryTrie';
import { IconRuleSet } from './IconRuleSet';

/** Pre-compiled static descriptor map for non-markdown file extensions (zero-allocation). */
const EXTENSION_AUTO_ICONS: Record<string, AutoIconData> = {
    'pdf':  { tier: 0.9, rex: /\.pdf$/i,  emoji: 'file-text',   lucide: 'file-text',   priority: 2000, packSource: 'file-extension' },
    'png':  { tier: 0.9, rex: /\.png$/i,  emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'jpg':  { tier: 0.9, rex: /\.jpg$/i,  emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'jpeg': { tier: 0.9, rex: /\.jpeg$/i, emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'gif':  { tier: 0.9, rex: /\.gif$/i,  emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'svg':  { tier: 0.9, rex: /\.svg$/i,  emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'webp': { tier: 0.9, rex: /\.webp$/i, emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'bmp':  { tier: 0.9, rex: /\.bmp$/i,  emoji: 'image',       lucide: 'image',       priority: 2000, packSource: 'file-extension' },
    'mp4':  { tier: 0.9, rex: /\.mp4$/i,  emoji: 'video',       lucide: 'video',       priority: 2000, packSource: 'file-extension' },
    'mkv':  { tier: 0.9, rex: /\.mkv$/i,  emoji: 'video',       lucide: 'video',       priority: 2000, packSource: 'file-extension' },
    'mov':  { tier: 0.9, rex: /\.mov$/i,  emoji: 'video',       lucide: 'video',       priority: 2000, packSource: 'file-extension' },
    'avi':  { tier: 0.9, rex: /\.avi$/i,  emoji: 'video',       lucide: 'video',       priority: 2000, packSource: 'file-extension' },
    'webm': { tier: 0.9, rex: /\.webm$/i, emoji: 'video',       lucide: 'video',       priority: 2000, packSource: 'file-extension' },
    'mp3':  { tier: 0.9, rex: /\.mp3$/i,  emoji: 'music',       lucide: 'music',       priority: 2000, packSource: 'file-extension' },
    'wav':  { tier: 0.9, rex: /\.wav$/i,  emoji: 'music',       lucide: 'music',       priority: 2000, packSource: 'file-extension' },
    'flac': { tier: 0.9, rex: /\.flac$/i, emoji: 'music',       lucide: 'music',       priority: 2000, packSource: 'file-extension' },
    'ogg':  { tier: 0.9, rex: /\.ogg$/i,  emoji: 'music',       lucide: 'music',       priority: 2000, packSource: 'file-extension' },
    'm4a':  { tier: 0.9, rex: /\.m4a$/i,  emoji: 'music',       lucide: 'music',       priority: 2000, packSource: 'file-extension' },
    'js':   { tier: 0.9, rex: /\.js$/i,   emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'ts':   { tier: 0.9, rex: /\.ts$/i,   emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'py':   { tier: 0.9, rex: /\.py$/i,   emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'html': { tier: 0.9, rex: /\.html$/i, emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'css':  { tier: 0.9, rex: /\.css$/i,  emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'json': { tier: 0.9, rex: /\.json$/i, emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'cpp':  { tier: 0.9, rex: /\.cpp$/i,  emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'rs':   { tier: 0.9, rex: /\.rs$/i,   emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'go':   { tier: 0.9, rex: /\.go$/i,   emoji: 'code',        lucide: 'code',        priority: 2000, packSource: 'file-extension' },
    'zip':  { tier: 0.9, rex: /\.zip$/i,  emoji: 'package',     lucide: 'package',     priority: 2000, packSource: 'file-extension' },
    'tar':  { tier: 0.9, rex: /\.tar$/i,  emoji: 'package',     lucide: 'package',     priority: 2000, packSource: 'file-extension' },
    'gz':   { tier: 0.9, rex: /\.gz$/i,   emoji: 'package',     lucide: 'package',     priority: 2000, packSource: 'file-extension' },
    '7z':   { tier: 0.9, rex: /\.7z$/i,   emoji: 'package',     lucide: 'package',     priority: 2000, packSource: 'file-extension' },
    'rar':  { tier: 0.9, rex: /\.rar$/i,  emoji: 'package',     lucide: 'package',     priority: 2000, packSource: 'file-extension' },
    'csv':  { tier: 0.9, rex: /\.csv$/i,  emoji: 'bar-chart-2', lucide: 'bar-chart-2', priority: 2000, packSource: 'file-extension' },
    'xlsx': { tier: 0.9, rex: /\.xlsx$/i, emoji: 'bar-chart-2', lucide: 'bar-chart-2', priority: 2000, packSource: 'file-extension' },
    'xls':  { tier: 0.9, rex: /\.xls$/i,  emoji: 'bar-chart-2', lucide: 'bar-chart-2', priority: 2000, packSource: 'file-extension' },
    'tsv':  { tier: 0.9, rex: /\.tsv$/i,  emoji: 'bar-chart-2', lucide: 'bar-chart-2', priority: 2000, packSource: 'file-extension' }
};

export class IconRepository {
    plugin: IColorfulFoldersPlugin;

    /** Compiled custom rule engine (SRP: rule concern isolated to IconRuleSet). */
    private _ruleSet = new IconRuleSet();
    private _categoryTrie = new CategoryTrie();
    private _categoryTrieBuilt = false;
    private _customRulesKey: string = '';
    private _normCache = new LRUCache<string, string>(1024);
    private _dataUriCache = new LRUCache<string, string>(1024);
    private _findPackIconCache = new LRUCache<string, string | null>(512);
    private _autoIconResultCache = new LRUCache<string, AutoIconData | null>(4096);
    private _iconValidityCache = new LRUCache<string, boolean>(512);
    private _packIndex: IconPackIndex = new IconPackIndex();
    private _domParser: DOMParser | null = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    isValidIcon(id: string | null | undefined): boolean {
        if (!id) return false;
        const cached = this._iconValidityCache.get(id);
        if (cached !== undefined) return cached;

        let isValid = false;
        if (this.isEmojiIcon(id)) {
            isValid = true;
        } else {
            const svg = this.getIconSvg(id, false);
            isValid = !!svg && svg.length > 0;
        }

        this._iconValidityCache.set(id, isValid);
        return isValid;
    }

    /**
     * Resolve the best auto-icon for a vault node.
     *
     * @param name    File/folder base name (no path).
     * @param path    Full vault-relative path (optional, enables Tier 0 & Tier 0.7).
     * @param isFile  true = file, false = folder, undefined = unknown.
     *                When defined, custom rules are scoped to the correct type —
     *                preventing folder-only rules from firing on files and vice-versa.
     */
    getAutoIconData(name: string, path?: string, isFile?: boolean): AutoIconData | null {
        if (!name) return null;

        // Self-healing cache guard: if custom rules changed in settings, clear stale cache immediately
        const currentRules = this.plugin.settings?.customIconRules || '';
        if (this._customRulesKey !== currentRules) {
            this._autoIconResultCache.clear();
        }

        // Cache key includes type prefix to prevent folder/file name collisions
        const typePrefix = isFile === undefined ? 'u:' : (isFile ? 'file:' : 'dir:');
        const cacheKey   = path ? `${typePrefix}${name}::${path}` : `${typePrefix}${name}`;
        const hit = this._autoIconResultCache.get(cacheKey);
        if (hit !== undefined) {
            return hit;
        }

        const result = this._computeAutoIconData(name, path, isFile);
        this._autoIconResultCache.set(cacheKey, result);
        return result;
    }

    private _computeAutoIconData(name: string, path?: string, isFile?: boolean): AutoIconData | null {
        // Tier 0 & Tier 0.5: Frontmatter & Tag Auto-Icon Resolution (only for Markdown files)
        if (path && path.endsWith('.md') && this.plugin.app?.vault && this.plugin.app?.metadataCache) {
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (file instanceof obsidian.TFile) {
                const cache = this.plugin.app.metadataCache.getFileCache(file);

                // Tier 0: Explicit frontmatter icon property (icon, iconId, emoji, icon-id)
                if (cache?.frontmatter) {
                    const fm = cache.frontmatter as Record<string, unknown>;
                    const fmIcon = fm.icon || fm.iconId || fm.emoji || fm['icon-id'];
                    if (fmIcon && typeof fmIcon === 'string' && fmIcon.trim().length > 0) {
                        const cleanFmIcon = fmIcon.trim();
                        return {
                            tier: 0,
                            rex: /.*/,
                            emoji: cleanFmIcon,
                            lucide: cleanFmIcon,
                            priority: 2500,
                            isCustom: true,
                            packSource: 'frontmatter'
                        };
                    }
                }

                // Tier 0.5: Tag-driven auto icon (strictly gated by user setting tagSyncEnabled)
                if (this.plugin.settings.tagSyncEnabled) {
                    const tags: string[] = [];
                    if (cache?.frontmatter?.tags) {
                        const rawTags = (cache.frontmatter as Record<string, unknown>).tags;
                        const fmTags: string[] = Array.isArray(rawTags)
                            ? rawTags.map(t => String(t))
                            : typeof rawTags === 'string'
                                ? rawTags.split(',').map(t => t.trim())
                                : [];
                        tags.push(...fmTags);
                    }
                    if (cache?.tags) {
                        for (const tObj of cache.tags) {
                            if (tObj.tag) tags.push(tObj.tag);
                        }
                    }

                    if (tags.length > 0) {
                        const uniqueTags = Array.from(new Set(tags.map(t => t.replace(/^#/, '').trim().toLowerCase()))).filter(t => t.length > 0);
                        for (const tag of uniqueTags) {
                            // Query auto-icon for tag name (without path to prevent infinite recursion)
                            // isFile = undefined: tags apply to all types — do not let folder-scoped rules leak
                            const tagIcon = this.getAutoIconData(tag, undefined, undefined);
                            if (tagIcon) {
                                return {
                                    ...tagIcon,
                                    tier: 0.5,
                                    packSource: 'tag-sync'
                                };
                            }
                        }
                    }
                }
            }
        }

        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const currentKey = settings.customIconRules || '';

        // Recompile custom rules only if settings string actually changed
        if (this._customRulesKey !== currentKey) {
            this._ruleSet.build(currentKey);
            this._customRulesKey = currentKey;
        }

        // Initialize built-in CategoryTrie once
        if (!this._categoryTrieBuilt) {
            this._categoryTrie.build(AUTO_ICON_CATEGORIES);
            this._categoryTrieBuilt = true;
        }

        let sanitized = lName.trim();
        // Only strip dot-extensions for files, preserving folder names with dots (e.g. "Release 5.0" or "node.js")
        if (isFile !== false) {
            const dotIdx = sanitized.lastIndexOf('.');
            if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
                sanitized = sanitized.substring(0, dotIdx);
            }
        }
        const cleanSanitized = sanitized.replace(/[^\p{L}\p{N}\s_-]/gu, '').trim();

        // Item-only contexts: contains variants of THIS item's own name ONLY.
        // Never includes parent folder name, preventing a folder name rule from hijacking child files.
        const itemContexts = [lName];
        if (sanitized && sanitized !== lName) itemContexts.push(sanitized);
        if (cleanSanitized && cleanSanitized !== sanitized && cleanSanitized !== lName) itemContexts.push(cleanSanitized);

        // Tier 0.8: Custom User Rules — evaluates ONLY the item's own name variants!
        // Evaluated before generic extension icons so custom file rules take precedence.
        // isFile scoping ensures folder-only rules don't fire on files and vice-versa.
        if (!this._ruleSet.isEmpty) {
            const ruleHit = this._ruleSet.lookup(itemContexts, isFile);
            if (ruleHit) {
                return {
                    tier: 0.8,
                    rex:        ruleHit.rex,
                    emoji:      ruleHit.emoji,
                    lucide:     ruleHit.lucide,
                    priority:   ruleHit.priority,
                    isCustom:   true,
                    targetScope: ruleHit.target,
                    packSource: 'custom-rule'
                };
            }
        }

        // Tier 0.9: File Extension Awareness for Non-Markdown Files (Zero-allocation static lookup)
        // Strictly restricted to files: folders with dots (e.g. "node.js") are never treated as file extensions.
        if (isFile !== false && path) {
            const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
            const lastDot = cleanPath.lastIndexOf('.');
            if (lastDot > 0 && lastDot > cleanPath.lastIndexOf('/')) {
                const ext = cleanPath.slice(lastDot + 1).toLowerCase();
                if (ext !== 'md' && EXTENSION_AUTO_ICONS[ext]) {
                    return EXTENSION_AUTO_ICONS[ext];
                }
            }
        }

        // Tier 1: Exact local pack / custom icon match (Priority 1800)
        // Deferred string operations: only performed if custom rules and extensions missed.
        const fullHyphenated = sanitized.replace(/[\s_]+/g, '-');
        const cleanHyphenated = cleanSanitized.replace(/[\s_]+/g, '-');
        const wordsNoStop = cleanSanitized
            .split(/[^\p{L}\p{N}]+/gu)
            .map(w => w.toLowerCase())
            .filter(w => w.length >= 1 && !STOP_WORDS.has(w));
        const noStopHyphenated = wordsNoStop.length > 1 ? wordsNoStop.join('-') : null;
        let exactMatchedIconId = this.findIconInPacks(fullHyphenated) || (cleanHyphenated ? this.findIconInPacks(cleanHyphenated) : null) || (noStopHyphenated ? this.findIconInPacks(noStopHyphenated) : null);
        if (!exactMatchedIconId && wordsNoStop.length > 0) {
            for (const word of wordsNoStop) {
                const stemmed = stemWord(word);
                const matched = this.findIconInPacks(word) || (stemmed !== word ? this.findIconInPacks(stemmed) : null);
                if (matched) {
                    exactMatchedIconId = matched;
                    break;
                }
            }
        }
        if (exactMatchedIconId) {
            const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                tier: 1,
                rex: new RegExp(`^${safeRexStr}$`, 'i'),
                emoji: exactMatchedIconId,
                lucide: exactMatchedIconId,
                priority: 1800,
                isCustom: true,
                packSource: exactMatchedIconId.includes('-') ? exactMatchedIconId.split('-')[0] : 'custom'
            };
        }

        // Tier 2 & 3: Categories using CategoryTrie lookup (with Parent Folder Context)
        // Zero-allocation parent folder extraction using native lastIndexOf
        let parentFolder = '';
        if (path) {
            const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
            const lastSlash = cleanPath.lastIndexOf('/');
            if (lastSlash > 0) {
                const prevSlash = cleanPath.lastIndexOf('/', lastSlash - 1);
                parentFolder = prevSlash >= 0 ? cleanPath.substring(prevSlash + 1, lastSlash) : cleanPath.substring(0, lastSlash);
            }
        }

        const searchContexts = [...itemContexts];
        if (parentFolder && parentFolder.toLowerCase() !== 'root') {
            searchContexts.push(parentFolder.toLowerCase());
        }

        for (const ctx of searchContexts) {
            const candidateCategories = this._categoryTrie.lookup(ctx);
            for (let i = 0; i < candidateCategories.length; i++) {
                const cat = candidateCategories[i];
                if (cat.rex.test(ctx)) {
                    const tierVal: 2 | 3 = cat.isCustom ? 2 : 3;
                    const match = { ...cat, tier: tierVal, packSource: cat.isCustom ? 'custom-rule' : 'category-default' };
                    if (settings.autoIconVariety) {
                        const h = hashString(name);
                        if (match.emojis && match.emojis.length > 0) {
                            match.emoji = match.emojis[h % match.emojis.length];
                        }
                        if (match.lucides && match.lucides.length > 0) {
                            match.lucide = match.lucides[h % match.lucides.length];
                        }
                    }
                    return match;
                }
            }
        }

        // Tier 4: Stem-aware fuzzy multi-word & single-word fallback (Priority 50)
        let fuzzyMatchedIconId: string | null = null;
        const words = sanitized
            .split(/[^\p{L}\p{N}]+/gu)
            .map(w => w.toLowerCase())
            .filter(w => w.length >= 1 && !STOP_WORDS.has(w));

        const domainWords = words.filter(w => !GENERIC_SUFFIX_WORDS.has(w));
        const suffixWords = words.filter(w => GENERIC_SUFFIX_WORDS.has(w));

        // 1. Multi-word pairs with stemming
        for (let i = 0; i < words.length - 1; i++) {
            const w1 = stemWord(words[i]);
            const w2 = stemWord(words[i + 1]);
            const pair = `${w1}-${w2}`;
            const matched = this.findIconInPacks(pair);
            if (matched) {
                fuzzyMatchedIconId = matched;
                break;
            }
        }

        // 2. Individual domain words with stemming (prioritized over generic suffix words)
        if (!fuzzyMatchedIconId) {
            for (let i = domainWords.length - 1; i >= 0; i--) {
                const stemmed = stemWord(domainWords[i]);
                const matched = this.findIconInPacks(stemmed) || this.findIconInPacks(domainWords[i]);
                if (matched) {
                    fuzzyMatchedIconId = matched;
                    break;
                }
            }
        }

        // 3. Fallback to generic suffix words if no domain word matched
        if (!fuzzyMatchedIconId) {
            for (let i = suffixWords.length - 1; i >= 0; i--) {
                const stemmed = stemWord(suffixWords[i]);
                const matched = this.findIconInPacks(stemmed) || this.findIconInPacks(suffixWords[i]);
                if (matched) {
                    fuzzyMatchedIconId = matched;
                    break;
                }
            }
        }

        if (fuzzyMatchedIconId) {
            const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                tier: 4,
                rex: new RegExp(`^${safeRexStr}$`, 'i'),
                emoji: fuzzyMatchedIconId,
                lucide: fuzzyMatchedIconId,
                priority: 50,
                packSource: fuzzyMatchedIconId.includes('-') ? fuzzyMatchedIconId.split('-')[0] : 'fuzzy-match'
            };
        }

        return null;
    }

    private _getCustomIcons(): Record<string, string> {
        return this.plugin.getCustomIconsMap();
    }

    findIconInPacks(searchKey: string): string | null {
        if (!searchKey) return null;
        const hit = this._findPackIconCache.get(searchKey);
        if (hit !== undefined) {
            return hit;
        }

        const local = this.plugin.localFileSystemIcons;
        const custom = this._getCustomIcons();

        // Build index once; only rebuild if icon maps actually changed
        if (!this._packIndex.getIsBuilt()) {
            this._packIndex.build(local, custom, this.plugin.settings.iconPackPriorityOrder, !!this.plugin.settings.wideAutoIcons);
        }
        const result = this._packIndex.findIcon(searchKey);
        this._findPackIconCache.set(searchKey, result);
        
        if (this.plugin.settings.iconDebugMode) {
            console.debug(`ColorfulFolders: Search icon match for "${searchKey}": ${result}`);
        }
        
        return result;
    }

    searchFuzzy(searchKey: string, options?: { threshold?: number }): string | null {
        if (!searchKey) return null;
        const local = this.plugin.localFileSystemIcons;
        const custom = this._getCustomIcons();

        if (!this._packIndex.getIsBuilt()) {
            this._packIndex.build(local, custom, this.plugin.settings.iconPackPriorityOrder, !!this.plugin.settings.wideAutoIcons);
        }
        return this._packIndex.searchFuzzy(searchKey, options);
    }

    private _cachedObsidianIconIds: Set<string> | null = null;

    private getObsidianIconIds(): Set<string> {
        if (!this._cachedObsidianIconIds) {
            const ids = obsidian.getIconIds?.() || [];
            this._cachedObsidianIconIds = new Set(ids);
        }
        return this._cachedObsidianIconIds;
    }

    isEmojiIcon(iconId?: string | null): boolean {
        if (!iconId) return false;
        // Fast-path: If it contains Latin alphabet letters, it is a text ID / icon name, NOT an emoji
        if (/[a-zA-Z]/.test(iconId)) {
            return false;
        }
        if (this.plugin.localFileSystemIcons) {
            const lId = iconId.toLowerCase();
            const cleanId = lId.replace(/^lucide-/, '');
            const hyphenated = lId.replace(/[\s_]+/g, '-').replace(/\//g, '-');
            if (this.plugin.localFileSystemIcons[iconId] || 
                this.plugin.localFileSystemIcons[lId] || 
                this.plugin.localFileSystemIcons[cleanId] || 
                this.plugin.localFileSystemIcons[hyphenated]) {
                return false;
            }
        }
        if (this.plugin.getCustomIcon(iconId) || this.plugin.getCustomIcon(iconId.toLowerCase())) {
            return false;
        }
        const obsIds = this.getObsidianIconIds();
        if (obsIds.has(`lucide-${iconId}`) || obsIds.has(iconId)) {
            return false;
        }
        return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(iconId);
    }

    getRawIconSvg(iconId: string): string {
        if (!iconId) return "";
        const lId = iconId.toLowerCase();
        const cleanId = lId.replace(/^lucide-/, '');
        const hyphenated = lId.replace(/[\s_:]+/g, '-').replace(/\//g, '-');

        // 1. Check custom icons & local custom icons
        let svgStr = this.plugin.getCustomIcon(iconId) || this.plugin.getCustomIcon(lId) ||
            this.plugin.localCustomIcons?.[iconId] || this.plugin.localCustomIcons?.[lId] ||
            this.plugin.localCustomIcons?.[cleanId] || this.plugin.localCustomIcons?.[hyphenated] || "";

        // 2. Check local file system pack icons
        const local = this.plugin.localFileSystemIcons;
        if (!svgStr && local) {
            svgStr = local[iconId] || local[lId] || local[cleanId] || local[hyphenated] || "";
            if (!svgStr) {
                const baseName = stripIconPrefix(lId);
                if (local[baseName]) {
                    svgStr = local[baseName];
                } else {
                    const matchedKey = this.findIconInPacks(baseName);
                    if (matchedKey && local[matchedKey]) {
                        svgStr = local[matchedKey];
                    }
                }
            }
        }

        // 3. Check Obsidian built-in icons
        if (!svgStr) {
            const candidateIds = [
                iconId,
                lId,
                cleanId,
                `lucide-${iconId}`,
                iconId.replace(/:/g, '-'),
                iconId.replace(/-/g, ':')
            ];
            for (const cand of candidateIds) {
                const svgEl = obsidian.getIcon(cand);
                if (svgEl) {
                    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    svgStr = svgEl.outerHTML;
                    break;
                }
            }
        }

        return svgStr;
    }

    getIconSvg(iconId: string, shouldEncode = true): string {
        if (!iconId) return "";
        const cacheKey = `${iconId}-${shouldEncode ? 'enc' : 'raw'}`;
        if (this.plugin.iconCache) {
            const cached = this.plugin.iconCache.get(cacheKey);
            if (cached) return cached;
        }

        const svgStr = this.getRawIconSvg(iconId);
        if (svgStr) {
            const normalized = this.normalizeSvg(svgStr, shouldEncode);
            if (this.plugin.iconCache) {
                this.plugin.iconCache.set(cacheKey, normalized);
            }
            const altKey = (shouldEncode ? '0:' : '1:') + iconId;
            if (this.plugin.iconCache && !this.plugin.iconCache.has(altKey)) {
                const altNorm = this.normalizeSvg(svgStr, !shouldEncode);
                this.plugin.iconCache.set(altKey, altNorm);
            }
            return normalized;
        }

        return "";
    }

    preNormalizeIcon(id: string, rawSvg: string): void {
        if (!id || !rawSvg) return;
        const normEncoded = this.normalizeSvg(rawSvg, true);
        const normRaw = this.normalizeSvg(rawSvg, false);

        if (this.plugin.iconCache) {
            this.plugin.iconCache.set(`1:${id}`, normEncoded);
            this.plugin.iconCache.set(`0:${id}`, normRaw);
        }
        this._dataUriCache.set(id, `url("data:image/svg+xml,${normEncoded}")`);
    }

    getDataUri(iconId: string): string {
        if (!iconId) return "";
        const hit = this._dataUriCache.get(iconId);
        if (hit !== undefined) return hit;

        const rawSvg = this.getIconSvg(iconId, true);
        const dataUri = rawSvg ? `url("data:image/svg+xml,${rawSvg}")` : "";
        this._dataUriCache.set(iconId, dataUri);
        return dataUri;
    }

    getMaskDataUri(iconId: string, rawSvg?: string): string {
        if (!iconId && !rawSvg) return "";
        const cacheKey = `mask:${iconId || hashString(rawSvg || '')}`;
        const hit = this._dataUriCache.get(cacheKey);
        if (hit !== undefined) return hit;

        const svg = rawSvg ? this.normalizeSvg(rawSvg, true) : this.getIconSvg(iconId, true);
        const maskUrl = svg ? `url("data:image/svg+xml,${svg}")` : "";
        this._dataUriCache.set(cacheKey, maskUrl);
        return maskUrl;
    }

    invalidateAutoIconCache(path?: string): void {
        if (path) {
            this._autoIconResultCache.delete(path);
            const fileName = path.includes('/') ? path.split('/').pop() : path;
            if (fileName) {
                this._autoIconResultCache.delete(`${fileName}::${path}`);
                this._autoIconResultCache.delete(`file:${fileName}::${path}`);
                this._autoIconResultCache.delete(`dir:${fileName}::${path}`);
                this._autoIconResultCache.delete(`u:${fileName}::${path}`);
                this._autoIconResultCache.delete(`file:${fileName}`);
                this._autoIconResultCache.delete(`dir:${fileName}`);
                this._autoIconResultCache.delete(`u:${fileName}`);
            }
        } else {
            this._autoIconResultCache.clear();
            this._ruleSet.clearCache();
        }
    }

    normalizeSvg(svgStr: string, shouldEncode = true): string {
        const cacheKey = `${shouldEncode ? '1:' : '0:'}${hashString(svgStr)}`;
        const hit = this._normCache.get(cacheKey);
        if (hit !== undefined) return hit;

        let result: string;
        try {
            if (!svgStr) { result = ""; }
            else {
                const rawSvg = svgStr.includes('%') ? decodeURIComponent(svgStr) : svgStr;
                if (!rawSvg.includes('<svg')) { result = svgStr; }
                else {
                    const parser = this._domParser;
                    let doc = parser.parseFromString(rawSvg, 'image/svg+xml');
                    if (doc.getElementsByTagName("parsererror").length > 0) doc = parser.parseFromString(rawSvg, 'text/html');

                    // Remove dangerous tags
                    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'foreignobject'];
                    for (const tag of dangerousTags) {
                        doc.querySelectorAll(tag).forEach(el => el.remove());
                    }
                    // Also check for case variations in SVG XML namespace like foreignObject
                    doc.querySelectorAll('*').forEach(el => {
                        if (dangerousTags.includes(el.tagName.toLowerCase())) {
                            el.remove();
                        }
                    });

                    // Remove elements with javascript: links in href or xlink:href
                    doc.querySelectorAll('a, use, image').forEach(el => {
                        const href = (el.getAttribute('href') || el.getAttribute('xlink:href') || '').trim().toLowerCase();
                        if (href.startsWith('javascript:') || href.startsWith('vbscript:') || href.startsWith('http:') || href.startsWith('https:') || href.startsWith('//') || (el.tagName.toLowerCase() === 'use' && href.startsWith('data:'))) {
                            el.remove();
                        }
                    });

                    // Strip all on* event handler attributes from every element (case-insensitive)
                    doc.querySelectorAll('*').forEach(el => {
                        const attrs = Array.from(el.attributes);
                        for (const attr of attrs) {
                            if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
                        }
                    });

                    const svg = doc.querySelector('svg');
                    if (!svg) { result = svgStr; }
                    else {
                        if (!svg.hasAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                            
                        let vbAttr = svg.getAttribute('viewBox');
                        if (!vbAttr && (svg.hasAttribute('width') || svg.hasAttribute('height'))) {
                            const w = svg.getAttribute('width')?.replace('px', '') || "24";
                            const h = svg.getAttribute('height')?.replace('px', '') || "24";
                            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                            vbAttr = `0 0 ${w} ${h}`;
                        }

                        // Safeguard for Bootstrap icons (bi-*) or 16px assets that were mistakenly saved with 0 0 24 24
                        if (vbAttr === '0 0 24 24' && (rawSvg.includes('class="bi ') || rawSvg.includes('bi-') || rawSvg.includes('xmlns:bi'))) {
                            svg.setAttribute('viewBox', '0 0 16 16');
                        }

                        svg.removeAttribute('width');
                        svg.removeAttribute('height');
                        svg.removeAttribute('style');

                        const hasStroke = rawSvg.includes('stroke=') && !rawSvg.includes('stroke="none"');
                        const hasFill = rawSvg.includes('fill=') && !rawSvg.includes('fill="none"');
                        if (hasStroke && !hasFill) {
                            svg.setAttribute('fill', 'none');
                            svg.setAttribute('stroke', 'currentColor');
                        } else {
                            svg.setAttribute('fill', 'currentColor');
                        }

                        const cleaned = svg.outerHTML.replace(/>\s+</g, '><').replace(/(\r\n|\n|\r)/gm, "");
                        result = shouldEncode ? encodeURIComponent(cleaned) : cleaned;
                    }
                }
            }
        } catch { result = svgStr; }

        this._normCache.set(cacheKey, result);
        return result;
    }

    invalidateCache(): void {
        this._categoryTrieBuilt = false;
        this._customRulesKey = '';
        this._cachedObsidianIconIds = null;
        this._normCache.clear();
        this._dataUriCache.clear();
        this._findPackIconCache.clear();
        this._autoIconResultCache.clear();
        this._iconValidityCache.clear();
        this._packIndex.invalidate();
        this._ruleSet.build('');
    }
}
