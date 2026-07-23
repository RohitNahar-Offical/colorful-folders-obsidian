import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES, STOP_WORDS } from '../common/constants';
import { hashString, stemWord } from '../common/utils';
import { IconPackIndex } from './IconPackIndex';
import { LRUCache } from '../common/LRUCache';
import { CategoryTrie } from './CategoryTrie';

export class IconRepository {
    plugin: IColorfulFoldersPlugin;

    private _categoryCache: AutoIconData[] | null = null;
    private _categoryTrie = new CategoryTrie();
    private _customRulesKey: string = '';
    private _normCache = new LRUCache<string, string>(2048);
    private _dataUriCache = new LRUCache<string, string>(2048);
    private _findPackIconCache = new LRUCache<string, string | null>(2048);
    private _packIndex: IconPackIndex = new IconPackIndex();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    getAutoIconData(name: string, _path?: string): AutoIconData | null {
        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const currentKey = settings.customIconRules || '';

        if (!this._categoryCache || this._customRulesKey !== currentKey) {
            const categories: AutoIconData[] = [...AUTO_ICON_CATEGORIES];
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

                        categories.push({
                            rex: new RegExp(pattern, 'i'),
                            emoji: secondHalf,
                            lucide: secondHalf,
                            priority: priority,
                            isCustom: true
                        });
                    } catch (e) {
                        console.error("Colorful Folders: Failed to parse custom icon rule", rule, e);
                    }
                }
            }
            categories.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            this._categoryCache = categories;
            this._categoryTrie.build(categories);
            this._customRulesKey = currentKey;
        }

        let sanitized = lName.trim();
        const dotIdx = sanitized.lastIndexOf('.');
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
            sanitized = sanitized.substring(0, dotIdx);
        }
        const fullHyphenated = sanitized.replace(/[\s_]+/g, '-');

        // Tier 1: Exact local pack / custom icon match (Priority 1800)
        const exactMatchedIconId = this.findIconInPacks(fullHyphenated);
        if (exactMatchedIconId) {
            const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                tier: 1,
                rex: new RegExp(`^${safeRexStr}$`, 'i'),
                emoji: exactMatchedIconId,
                lucide: exactMatchedIconId,
                priority: 1800,
                isCustom: true
            };
        }

        // Tier 2 & 3: Custom Regex rules & Categories using CategoryTrie lookup
        const candidateCategories = this._categoryTrie.lookup(lName);
        for (let i = 0; i < candidateCategories.length; i++) {
            const cat = candidateCategories[i];
            if (cat.rex.test(lName)) {
                const tierVal: 2 | 3 = cat.isCustom ? 2 : 3;
                const match = { ...cat, tier: tierVal };
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

        // Tier 4: Stem-aware fuzzy multi-word & single-word fallback (Priority 50)
        let fuzzyMatchedIconId: string | null = null;
        const words = sanitized
            .split(/[\s_.-]+/)
            .map(w => w.toLowerCase())
            .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

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

        // 2. Individual words with stemming (scanning from last to first for subject preference)
        if (!fuzzyMatchedIconId) {
            for (let i = words.length - 1; i >= 0; i--) {
                const stemmed = stemWord(words[i]);
                const matched = this.findIconInPacks(stemmed) || this.findIconInPacks(words[i]);
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
                priority: 50
            };
        }

        return null;
    }

    findIconInPacks(searchKey: string): string | null {
        if (!searchKey || searchKey.length < 3) return null;
        const hit = this._findPackIconCache.get(searchKey);
        if (hit !== undefined) {
            return hit;
        }

        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;

        // Build index once; only rebuild if icon maps actually changed
        if (!this._packIndex.getIsBuilt()) {
            this._packIndex.build(local, custom);
        }
        const result = this._packIndex.findIcon(searchKey);
        this._findPackIconCache.set(searchKey, result);
        
        if (this.plugin.settings.iconDebugMode) {
            // eslint-disable-next-line obsidianmd/rule-custom-message
            console.log(`ColorfulFolders: Search icon match for "${searchKey}": ${result}`);
        }
        
        return result;
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
        if (iconId.length <= 2) return true;
        return /[^a-zA-Z0-9\-_/.]/.test(iconId);
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
                const baseName = lId.replace(/^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

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
            // Eagerly pre-warm opposite encoding state to avoid second DOMParser pass
            const altKey = (shouldEncode ? '0:' : '1:') + iconId;
            if (this.plugin.iconCache && !this.plugin.iconCache.has(altKey)) {
                const altNorm = this.normalizeSvg(svgStr, !shouldEncode);
                this.plugin.iconCache.set(altKey, altNorm);
            }
            return normalized;
        }

        return "";
    }

    /**
     * Eagerly normalizes and pre-caches raw and encoded Data-URI representations at load time.
     */
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

    /**
     * Memoized Data-URI generator using LRUCache.
     */
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
        const cacheKey = (shouldEncode ? '1:' : '0:') + svgStr;
        const hit = this._normCache.get(cacheKey);
        if (hit !== undefined) return hit;

        let result: string;
        try {
            if (!svgStr) { result = ""; }
            else {
                const rawSvg = svgStr.includes('%') ? decodeURIComponent(svgStr) : svgStr;
                if (!rawSvg.includes('<svg')) { result = svgStr; }
                else {
                    const parser = new DOMParser();
                    let doc = parser.parseFromString(rawSvg, 'image/svg+xml');
                    if (doc.getElementsByTagName("parsererror").length > 0) doc = parser.parseFromString(rawSvg, 'text/html');
                    
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
        this._packIndex.invalidate();
    }
}
