import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { hashString } from '../common/utils';

export class IconRepository {
    plugin: IColorfulFoldersPlugin;

    private _categoryCache: AutoIconData[] | null = null;
    private _customRulesKey: string = '';
    private _normCache: Map<string, string> = new Map();
    private _dataUriCache: Map<string, string> = new Map();

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
            this._categoryCache = categories;
            this._customRulesKey = currentKey;
        }

        let sanitized = lName.trim();
        const dotIdx = sanitized.lastIndexOf('.');
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
            sanitized = sanitized.substring(0, dotIdx);
        }
        const fullHyphenated = sanitized.replace(/[\s_]+/g, '-');

        // Tier 1: Exact local pack / custom icon match (Priority 2000)
        const exactMatchedIconId = this.findIconInPacks(fullHyphenated);
        if (exactMatchedIconId) {
            const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                rex: new RegExp(`^${safeRexStr}$`, 'i'),
                emoji: exactMatchedIconId,
                lucide: exactMatchedIconId,
                priority: 2000,
                isCustom: true
            };
        }

        // Tier 2 & 3: Custom Regex rules & Categories (Priority 1500 & 80-100)
        const matches = this._categoryCache.filter(cat => cat.rex.test(lName));
        matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (matches.length > 0) {
            const match = { ...matches[0] };
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

        // Tier 4: Fuzzy multi-word fallback (Priority 50)
        let fuzzyMatchedIconId: string | null = null;
        const stopWords = new Set(['and', 'the', 'for', 'with', 'about', 'from', 'into', 'notes', 'thoughts', 'draft', 'list', 'page', 'doc', 'text', 'file', 'folder']);
        const words = sanitized.split(/[\s_.-]+/).filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()));

        for (let i = 0; i < words.length - 1; i++) {
            const pair = `${words[i]}-${words[i + 1]}`;
            const matched = this.findIconInPacks(pair);
            if (matched) {
                fuzzyMatchedIconId = matched;
                break;
            }
        }

        if (!fuzzyMatchedIconId) {
            for (const word of words) {
                const matched = this.findIconInPacks(word);
                if (matched) {
                    fuzzyMatchedIconId = matched;
                    break;
                }
            }
        }

        if (fuzzyMatchedIconId) {
            const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return {
                rex: new RegExp(`^${safeRexStr}$`, 'i'),
                emoji: fuzzyMatchedIconId,
                lucide: fuzzyMatchedIconId,
                priority: 50,
                isCustom: true
            };
        }

        return null;
    }

    private _findPackIconCache = new Map<string, string | null>();

    findIconInPacks(searchKey: string): string | null {
        if (!searchKey || searchKey.length < 3) return null;
        if (this._findPackIconCache.has(searchKey)) {
            return this._findPackIconCache.get(searchKey) || null;
        }

        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;

        const s = searchKey.toLowerCase().replace(/[\s_:]+/g, '-').replace(/\//g, '-');
        const cleanS = s.replace(/^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

        let result: string | null = null;
        if (custom) {
            if (custom[s]) result = s;
            else if (custom[cleanS]) result = cleanS;
            else if (custom[`feather-${cleanS}`]) result = `feather-${cleanS}`;
            else if (custom[`simple-icons-${cleanS}`]) result = `simple-icons-${cleanS}`;
            else {
                for (const key of Object.keys(custom)) {
                    if (key === s || key === cleanS || key.endsWith(`-${s}`) || key.endsWith(`-${cleanS}`) || key.endsWith(`/${cleanS}`)) {
                        result = key;
                        break;
                    }
                }
            }
        }

        if (!result && local) {
            if (local[s]) result = s;
            else if (local[cleanS]) result = cleanS;
            else if (local[`feather-${cleanS}`]) result = `feather-${cleanS}`;
            else if (local[`simple-icons-${cleanS}`]) result = `simple-icons-${cleanS}`;
            else {
                for (const key of Object.keys(local)) {
                    if (key === s || key === cleanS || key.endsWith(`-${s}`) || key.endsWith(`-${cleanS}`) || key.endsWith(`/${cleanS}`)) {
                        result = key;
                        break;
                    }
                }
            }
        }

        if (this._findPackIconCache.size > 2000) this._findPackIconCache.clear();
        this._findPackIconCache.set(searchKey, result);
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
                    for (const key of Object.keys(local)) {
                        if (key === baseName || key.endsWith(`-${baseName}`) || key.endsWith(`/${baseName}`)) {
                            svgStr = local[key] || "";
                            if (svgStr) break;
                        }
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
            return normalized;
        }

        return "";
    }

    /**
     * Memoized Data-URI generator. Encodes SVG to CSS Data-URI exactly once per unique icon.
     */
    getDataUri(iconId: string): string {
        if (!iconId) return "";
        const hit = this._dataUriCache.get(iconId);
        if (hit !== undefined) return hit;

        if (this._dataUriCache.size > 2000) this._dataUriCache.clear();
        const rawSvg = this.getIconSvg(iconId, true);
        const dataUri = rawSvg ? `url("data:image/svg+xml,${rawSvg}")` : "";
        this._dataUriCache.set(iconId, dataUri);
        return dataUri;
    }

    normalizeSvg(svgStr: string, shouldEncode = true): string {
        const cacheKey = (shouldEncode ? '1:' : '0:') + svgStr;
        const hit = this._normCache.get(cacheKey);
        if (hit !== undefined) return hit;

        if (this._normCache.size > 2000) this._normCache.clear();

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
    }
}
