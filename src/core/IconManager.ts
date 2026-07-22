import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { hashString } from '../common/utils';

export class IconManager {
    plugin: IColorfulFoldersPlugin;

    // --- Performance Caches ---
    private _categoryCache: AutoIconData[] | null = null;
    private _customRulesKey: string = '';
    private _normCache: Map<string, string> = new Map();
    private _domTemplateCache: Map<string, DocumentFragment> = new Map();

    // --- FIX 3: RAF-batched injection queue ---
    // Pending icon injections are collected synchronously and flushed
    // in a single requestAnimationFrame to avoid interleaved read/write
    // layout thrashing when many icons need to be rendered at once.
    private _pendingInjections: Array<{ el: HTMLElement; style: FolderStyle }> = [];
    private _rafPending = false;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    getAutoIconData(name: string, path?: string): AutoIconData | null {
        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const currentKey = settings.customIconRules || '';

        // Rebuild category list only when customIconRules has changed (P3 fix)
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

        // Check if any loaded local filesystem icon pack or custom icon has a matching icon name
        let sanitized = lName.trim();
        const dotIdx = sanitized.lastIndexOf('.');
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
            sanitized = sanitized.substring(0, dotIdx);
        }
        const fullHyphenated = sanitized.replace(/[\s_]+/g, '-');

        // 1. Exact full name match in installed local icon packs / custom icons (Priority 2000)
        let exactMatchedIconId = this.findIconInPacks(fullHyphenated);
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

        // 2. Custom Regex rules & Built-in Auto-Icon Categories (Priority 1500 for user rules, 80-100 for categories)
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
            if (settings.iconDebugMode) {
                console.debug(`Colorful Folders [Debug]: Category match for "${name}" ->`, match);
            }
            return match;
        }

        // 3. Fallback: Multi-word word pairs and single brand/tool word matches against installed packs
        let fuzzyMatchedIconId: string | null = null;
        const stopWords = new Set(['and', 'the', 'for', 'with', 'about', 'from', 'into', 'notes', 'thoughts', 'draft', 'list', 'page', 'doc', 'text', 'file', 'folder']);
        const words = sanitized.split(/[\s_.-]+/).filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()));

        // Try 2-word combinations (e.g. "nintendo-switch", "nintendoswitch")
        for (let i = 0; i < words.length - 1; i++) {
            const pair = `${words[i]}-${words[i + 1]}`;
            const matched = this.findIconInPacks(pair);
            if (matched) {
                fuzzyMatchedIconId = matched;
                break;
            }
            const pairNoDash = `${words[i]}${words[i + 1]}`;
            const matchedNoDash = this.findIconInPacks(pairNoDash);
            if (matchedNoDash) {
                fuzzyMatchedIconId = matchedNoDash;
                break;
            }
        }

        // Try single words (e.g. "nintendo")
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

    findIconInPacks(searchKey: string): string | null {
        if (!searchKey || searchKey.length < 3) return null;
        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;

        const s = searchKey.toLowerCase().replace(/[\s_:]+/g, '-').replace(/\//g, '-');
        const cleanS = s.replace(/^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

        // 1. Check custom installed icon packs (e.g. simple-icons, feather, or user SVGs)
        if (custom) {
            if (custom[s]) return s;
            if (custom[cleanS]) return cleanS;
            if (custom[`feather-${cleanS}`]) return `feather-${cleanS}`;
            if (custom[`simple-icons-${cleanS}`]) return `simple-icons-${cleanS}`;
            for (const key of Object.keys(custom)) {
                if (key === s || key === cleanS || key.endsWith(`-${s}`) || key.endsWith(`-${cleanS}`) || key.endsWith(`/${cleanS}`)) {
                    return key;
                }
            }
        }

        // 2. Check local filesystem icon packs (.obsidian/icons)
        if (local) {
            if (local[s]) return s;
            if (local[cleanS]) return cleanS;
            if (local[`feather-${cleanS}`]) return `feather-${cleanS}`;
            if (local[`simple-icons-${cleanS}`]) return `simple-icons-${cleanS}`;
            for (const key of Object.keys(local)) {
                if (key === s || key === cleanS || key.endsWith(`-${s}`) || key.endsWith(`-${cleanS}`) || key.endsWith(`/${cleanS}`)) {
                    return key;
                }
            }
        }
        return null;
    }

    /** Clears the category and normalization caches — call when icon settings change. */
    invalidateCategoryCache() {
        this._categoryCache = null;
        this._customRulesKey = '';
        this._normCache.clear();
    }

    /** Compatibility method for Zero-DOM architecture. */
    injectIconsForNodes(_nodes: NodeList | Node[]) {
        // Zero-DOM Architecture: Icons are rendered via adoptedStyleSheets CSS Data URIs.
    }

    /** Compatibility method for Zero-DOM architecture. */
    injectIcon(_el: HTMLElement, _style: FolderStyle) {
        // Zero-DOM Architecture: Icons are rendered via adoptedStyleSheets CSS Data URIs.
    }

    /** Compatibility method for Zero-DOM architecture. */
    doInjectIcon(_el: HTMLElement, _style: FolderStyle) {
        // Zero-DOM Architecture: Icons are rendered via adoptedStyleSheets CSS Data URIs.
    }

    /**
     * Returns true if the given iconId is an Emoji rather than a Lucide/custom SVG ID.
     * Lucide and custom icon IDs only contain a-z, 0-9, dashes and underscores.
     * Anything with non-standard characters (or very short) is an emoji.
     */
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

    /**
     * Gets a normalized SVG string, handling cache.
     */
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

        // 1. Try Custom Settings Icons
        if (custom) {
            svgStr = custom[iconId] || custom[iconId.toLowerCase()] || "";
        }
        
        // 2. Try Local Filesystem Icons (from .obsidian/icons and all pack subfolders)
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

        // 3. Try Obsidian Registered Icons (Lucide, Iconize, IconFolder, SimpleIcons, FontAwesome, etc.)
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
     * Cleans and standardizes SVG strings.
     */
    public normalizeSvg(svgStr: string, shouldEncode = true): string {
        // P7 fix: cache results so CF_FOLDER_CLOSED/OPEN and repeated icons are only parsed once
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
                        const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'foreignObject'];
                        
                        const sanitizeNode = (el: Element) => {
                            const tag = el.tagName.toLowerCase();
                            if (FORBIDDEN_TAGS.includes(tag)) { el.remove(); return; }
                            const attrs = Array.from(el.attributes);
                            for (const attr of attrs) {
                                const name = attr.name.toLowerCase();
                                const val = attr.value.toLowerCase();
                                if (name.startsWith('on') || val.includes('javascript:')) {
                                    el.removeAttribute(attr.name);
                                }
                            }
                            Array.from(el.children).forEach(child => sanitizeNode(child));
                        };

                        sanitizeNode(svg);

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

                        const vb = (svg.getAttribute('viewBox') || "0 0 24 24").split(/\s+|,/);
                        const vbW = parseFloat(vb[2]) || 24;
                        const vbH = parseFloat(vb[3]) || 24;

                        Array.from(svg.children).forEach((child) => {
                            const tagName = child.tagName.toLowerCase();
                            if (tagName === 'rect' || tagName === 'path' || tagName === 'circle') {
                                let isBackground = false;
                                if (tagName === 'rect') {
                                    const w = parseFloat(child.getAttribute('width') || '0');
                                    const h = parseFloat(child.getAttribute('height') || '0');
                                    if (w >= vbW * 0.9 && h >= vbH * 0.9) isBackground = true;
                                } else if (tagName === 'path') {
                                    const d = child.getAttribute('d') || '';
                                    if (d.length < 100 && (d.includes('M0 0') || d.includes('M0,0')) && (d.includes(`${vbW}`) || d.includes('100%'))) isBackground = true;
                                }
                                if (isBackground) child.remove();
                            }
                        });

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

    private colorizeSvg(svgStr: string, color: string): string {
        try {
            if (!svgStr || !color) return svgStr;

            const parser = new DOMParser();
            const doc = parser.parseFromString(svgStr, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) return svgStr;

            const isStroke = svgStr.includes('stroke=') && !svgStr.includes('stroke="none"');
            const isFill = svgStr.includes('fill=') && !svgStr.includes('fill="none"');
            
            // Remove existing fill/stroke attributes if they aren't 'none' to prepare for new color
            if (svg.getAttribute('fill') !== 'none') svg.removeAttribute('fill');
            if (svg.getAttribute('stroke') !== 'none') svg.removeAttribute('stroke');

            if (isStroke && !isFill) {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', color);
            } else {
                svg.setAttribute('fill', color);
            }

            const serializer = new XMLSerializer();
            return serializer.serializeToString(doc);
        } catch (e) {
            console.error("Colorful Folders: colorizeSvg failed", e);
            return svgStr;
        }
    }
}
