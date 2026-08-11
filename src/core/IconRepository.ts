import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES, STOP_WORDS, GENERIC_SUFFIX_WORDS } from '../common/constants';
import { hashString, stemWord, stripIconPrefix } from '../common/utils';
import { IconPackIndex } from './IconPackIndex';
import { LRUCache } from '../common/LRUCache';
import { CategoryTrie } from './CategoryTrie';

export class IconRepository {
    plugin: IColorfulFoldersPlugin;

    private _customRulesCache: AutoIconData[] = [];
    private _categoryCache: AutoIconData[] | null = null;
    private _categoryTrie = new CategoryTrie();
    private _customRulesKey: string = '';
    private _normCache = new LRUCache<string, string>(2048);
    private _dataUriCache = new LRUCache<string, string>(2048);
    private _findPackIconCache = new LRUCache<string, string | null>(2048);
    private _autoIconResultCache = new LRUCache<string, AutoIconData | null>(4096);
    private _iconValidityCache = new LRUCache<string, boolean>(2048);
    private _packIndex: IconPackIndex = new IconPackIndex();
    private _domParser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

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

    getAutoIconData(name: string, path?: string): AutoIconData | null {
        if (!name) return null;
        const cacheKey = path ? `${name}::${path}` : name;
        const hit = this._autoIconResultCache.get(cacheKey);
        if (hit !== undefined) {
            return hit;
        }

        const result = this._computeAutoIconData(name, path);
        this._autoIconResultCache.set(cacheKey, result);
        return result;
    }

    private _computeAutoIconData(name: string, path?: string): AutoIconData | null {
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

                // Tier 0.5: Tag-driven auto icon
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
                        const tagIcon = this.getAutoIconData(tag);
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

        // Tier 0.7: File Extension Awareness for Non-Markdown Files
        if (path) {
            const extMatch = path.match(/\.([a-z0-9]+)$/i);
            if (extMatch) {
                const ext = extMatch[1].toLowerCase();
                const EXTENSION_ICON_MAP: Record<string, string> = {
                    'pdf': 'file-text',
                    'png': 'image',
                    'jpg': 'image',
                    'jpeg': 'image',
                    'gif': 'image',
                    'svg': 'image',
                    'webp': 'image',
                    'bmp': 'image',
                    'mp4': 'video',
                    'mkv': 'video',
                    'mov': 'video',
                    'avi': 'video',
                    'webm': 'video',
                    'mp3': 'music',
                    'wav': 'music',
                    'flac': 'music',
                    'ogg': 'music',
                    'm4a': 'music',
                    'js': 'code',
                    'ts': 'code',
                    'py': 'code',
                    'html': 'code',
                    'css': 'code',
                    'json': 'code',
                    'cpp': 'code',
                    'rs': 'code',
                    'go': 'code',
                    'zip': 'package',
                    'tar': 'package',
                    'gz': 'package',
                    '7z': 'package',
                    'rar': 'package',
                    'csv': 'bar-chart-2',
                    'xlsx': 'bar-chart-2',
                    'xls': 'bar-chart-2',
                    'tsv': 'bar-chart-2'
                };
                if (ext !== 'md' && EXTENSION_ICON_MAP[ext]) {
                    const iconId = EXTENSION_ICON_MAP[ext];
                    return {
                        tier: 0.7,
                        rex: new RegExp(`\\.${ext}$`, 'i'),
                        emoji: iconId,
                        lucide: iconId,
                        priority: 2000,
                        packSource: 'file-extension'
                    };
                }
            }
        }

        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const currentKey = settings.customIconRules || '';

        if (!this._categoryCache || this._customRulesKey !== currentKey) {
            const categories: AutoIconData[] = [...AUTO_ICON_CATEGORIES];
            const customRules: AutoIconData[] = [];
            if (currentKey) {
                const rules = currentKey.split('\n').filter((r: string) => r.trim());
                for (const rule of rules) {
                    try {
                        const mainParts = rule.split('=').map((p: string) => p.trim());
                        if (mainParts.length < 2) continue;

                        const pattern = mainParts[0];
                        let secondHalf = mainParts[1];
                        let priority = 1500;

                        if (secondHalf.includes('@')) {
                            const prioParts = secondHalf.split('@').map((p: string) => p.trim());
                            secondHalf = prioParts[0];
                            priority = parseInt(prioParts[1]) || 1500;
                        }

                        const isRegexMeta = /[.*+?^${}()|[\]\\]/.test(pattern);
                        const rex = isRegexMeta ? new RegExp(pattern, 'i') : new RegExp(`^${pattern}$|\\b${pattern}\\b|${pattern}`, 'i');

                        const ruleData: AutoIconData = {
                            rex,
                            emoji: secondHalf,
                            lucide: secondHalf,
                            priority: priority,
                            isCustom: true
                        };

                        customRules.push(ruleData);
                        categories.push(ruleData);
                    } catch (e) {
                        console.error("Colorful Folders: Failed to parse custom icon rule", rule, e);
                    }
                }
            }
            customRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            categories.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            this._customRulesCache = customRules;
            this._categoryCache = categories;
            this._categoryTrie.build(categories);
            this._customRulesKey = currentKey;
        }

        let sanitized = lName.trim();
        const dotIdx = sanitized.lastIndexOf('.');
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
            sanitized = sanitized.substring(0, dotIdx);
        }
        const cleanSanitized = sanitized.replace(/[^\p{L}\p{N}\s_-]/gu, '').trim();
        const fullHyphenated = sanitized.replace(/[\s_]+/g, '-');
        const cleanHyphenated = cleanSanitized.replace(/[\s_]+/g, '-');

        const parentFolder = path ? path.split('/').slice(-2, -1)[0] : '';
        const searchContexts = [lName];
        if (sanitized && sanitized !== lName) searchContexts.push(sanitized);
        if (cleanSanitized && cleanSanitized !== sanitized && cleanSanitized !== lName) searchContexts.push(cleanSanitized);
        if (parentFolder && parentFolder.toLowerCase() !== 'root') {
            searchContexts.push(parentFolder.toLowerCase());
        }

        // Tier 0.8: Custom User Rules (Takes absolute top priority over standard pack names & defaults)
        if (this._customRulesCache && this._customRulesCache.length > 0) {
            for (const ctx of searchContexts) {
                for (const rule of this._customRulesCache) {
                    if (rule.rex.test(ctx)) {
                        return {
                            ...rule,
                            tier: 1,
                            packSource: 'custom-rule'
                        };
                    }
                }
            }
        }

        // Tier 1: Exact local pack / custom icon match (Priority 1800)
        const exactMatchedIconId = this.findIconInPacks(fullHyphenated) || (cleanHyphenated ? this.findIconInPacks(cleanHyphenated) : null);
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

    findIconInPacks(searchKey: string): string | null {
        if (!searchKey) return null;
        const hit = this._findPackIconCache.get(searchKey);
        if (hit !== undefined) {
            return hit;
        }

        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;

        // Build index once; only rebuild if icon maps actually changed
        if (!this._packIndex.getIsBuilt()) {
            this._packIndex.build(local, custom, this.plugin.settings.preferredIconPack || 'auto', this.plugin.settings.iconPackPriorityOrder, !!this.plugin.settings.wideAutoIcons);
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
        const custom = this.plugin.settings.customIcons;

        if (!this._packIndex.getIsBuilt()) {
            this._packIndex.build(local, custom, this.plugin.settings.preferredIconPack || 'auto', this.plugin.settings.iconPackPriorityOrder, !!this.plugin.settings.wideAutoIcons);
        }
        return this._packIndex.searchFuzzy(searchKey, options);
    }

    isEmojiIcon(iconId?: string | null): boolean {
        if (!iconId) return false;
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
        if (this.plugin.settings.customIcons && (this.plugin.settings.customIcons[iconId] || this.plugin.settings.customIcons[iconId.toLowerCase()])) {
            return false;
        }
        if (obsidian.getIconIds?.().includes(`lucide-${iconId}`) || obsidian.getIconIds?.().includes(iconId)) {
            return false;
        }
        // If it contains letters, it is a text ID / title name, NOT an emoji
        if (/[a-zA-Z]/.test(iconId)) {
            return false;
        }
        return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(iconId);
    }

    getIconSvg(iconId: string, shouldEncode = true): string {
        if (!iconId) return "";
        const cacheKey = `${iconId}-${shouldEncode ? 'enc' : 'raw'}`;
        if (this.plugin.iconCache) {
            const cached = this.plugin.iconCache.get(cacheKey);
            if (cached) return cached;
        }

        let svgStr = "";
        const custom = this.plugin.settings.customIcons;
        const local = this.plugin.localFileSystemIcons;

        if (custom) {
            svgStr = custom[iconId] || custom[iconId.toLowerCase()] || "";
        }
        
        if (!svgStr && local) {
            const lId = iconId.toLowerCase();
            const cleanId = lId.replace(/^lucide-/, '');
            const hyphenated = lId.replace(/[\s_:]+/g, '-').replace(/\//g, '-');

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

        if (!svgStr) {
            const candidateIds = [
                iconId,
                iconId.toLowerCase(),
                iconId.replace(/^lucide-/, ''),
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
                    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'foreignobject', 'animate', 'set'];
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
                            
                        const vbAttr = svg.getAttribute('viewBox');
                        if (!vbAttr && (svg.hasAttribute('width') || svg.hasAttribute('height'))) {
                            const w = svg.getAttribute('width')?.replace('px', '') || "24";
                            const h = svg.getAttribute('height')?.replace('px', '') || "24";
                            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
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
        this._categoryCache = null;
        this._customRulesKey = '';
        this._normCache.clear();
        this._dataUriCache.clear();
        this._findPackIconCache.clear();
        this._autoIconResultCache.clear();
        this._iconValidityCache.clear();
        this._packIndex.invalidate();
    }
}
