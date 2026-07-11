import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { hashString } from '../common/utils';

interface ParsedIcon {
    id: string;
    isLucide: boolean;
    suffix: string;
    significantParts: Set<string>;
}

export class IconManager {
    plugin: IColorfulFoldersPlugin;

    // --- Performance Caches ---
    private _categoryCache: AutoIconData[] | null = null;
    private _customRulesKey: string = '';
    private _normCache: Map<string, string> = new Map();
    private _parsedIcons: ParsedIcon[] | null = null;
    private _resolvedIconIdCache: Map<string, string | null> = new Map();
    private _lastIconIdsCheckTime: number = 0;



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

        // 1. Get Fuzzy Name Match
        const fuzzyIconId = this.findIconId(lName);
        const hasCustomFuzzy = fuzzyIconId && !fuzzyIconId.startsWith('lucide-');
        
        const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


        // 2. Standard Regex Match
        const matches = this._categoryCache.filter(cat => cat.rex.test(lName));
        matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        let finalMatch: AutoIconData | null = null;

        // 3. Priority Resolution
        if (hasCustomFuzzy) {
            // Ultimate priority: Custom Icon exact/fuzzy match
            finalMatch = {
                rex: new RegExp(`^${escapeRegExp(lName)}$`, 'i'),
                emoji: fuzzyIconId!,
                lucide: fuzzyIconId!,
                priority: 2000
            };
        } else if (matches.length > 0) {
            // Fallback 1: Curated Regex rules (with variants)
            const match = { ...matches[0] };
            if (settings.autoIconVariety) {
                const targetToHash = (path || name) + (settings.varietySeed || 0).toString();
                const h = hashString(targetToHash);
                if (match.emojis && match.emojis.length > 0) {
                    match.emoji = match.emojis[h % match.emojis.length];
                }
                if (match.lucides && match.lucides.length > 0) {
                    match.lucide = match.lucides[h % match.lucides.length];
                }
            }
            finalMatch = match;
            
            // Smart Icon Resolution
            if (finalMatch && finalMatch.lucide && !this.isEmojiIcon(finalMatch.lucide)) {
                finalMatch.lucide = this.resolveIconId(finalMatch.lucide);
            }
        } else if (fuzzyIconId) {
            // Fallback 2: Lucide generic fuzzy match
            finalMatch = {
                rex: new RegExp(`^${escapeRegExp(lName)}$`, 'i'),
                emoji: fuzzyIconId,
                lucide: fuzzyIconId,
                priority: 1000
            };
        }

        if (settings.iconDebugMode && finalMatch) {
            console.debug(`Colorful Folders [Debug]: Match for "${name}" ->`, finalMatch);
        }

        return finalMatch;
    }

    /**
     * Searches installed packs for an icon matching the request.
     * Returns null if no match is found anywhere. Uses O(1) cache.
     */
    findIconId(requestedIcon: string): string | null {
        if (!requestedIcon) return null;

        // Sanitize the name
        let sanitized = requestedIcon.toLowerCase().trim();
        
        // Strip file extensions if present (e.g., 'amazon.md' -> 'amazon')
        const dotIdx = sanitized.lastIndexOf('.');
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
            sanitized = sanitized.substring(0, dotIdx);
        }
        
        // Replace spaces or special characters with hyphens to match icon naming conventions
        sanitized = sanitized.replace(/[\s_]+/g, '-').replace(/[^a-z0-9\-]/g, '');

        if (!sanitized) return null;

        // O(1) Cache Lookup (using the original requested string)
        if (this._resolvedIconIdCache.has(requestedIcon)) {
            return this._resolvedIconIdCache.get(requestedIcon) || null;
        }

        // Ensure available icons are populated and parsed once (or re-parsed if new icons were registered)
        const now = Date.now();
        if (!this._parsedIcons || (now - this._lastIconIdsCheckTime > 5000)) {
            this._lastIconIdsCheckTime = now;
            const currentRawIds = obsidian.getIconIds();
            
            if (!this._parsedIcons || this._parsedIcons.length !== currentRawIds.length) {
                const genericModifiers = new Set(['fill', 'line', 'solid', 'regular', 'thin', 'light', 'bold', 'duotone', 'brands']);
                
                this._parsedIcons = currentRawIds.map(id => {
                    const parts = id.split('-');
                return {
                    id,
                    isLucide: id.startsWith('lucide-'),
                    suffix: parts[parts.length - 1],
                    significantParts: new Set(parts.filter(p => p !== parts[0] && !genericModifiers.has(p)))
                };
            });

                // If we just discovered new icons, our previous "not found" caches might be invalid now.
                this._resolvedIconIdCache.clear();
            }
        }

        // Priority 1: Exact global match on the sanitized string
        const exactMatch = this._parsedIcons.find(icon => icon.id === sanitized);
        if (exactMatch) {
            this._resolvedIconIdCache.set(requestedIcon, sanitized);
            return sanitized;
        }

        let customSuffixMatch: string | null = null;
        let customContainsMatch: string | null = null;
        let lucideSuffixMatch: string | null = null;
        let lucideContainsMatch: string | null = null;
        const exactLucide = `lucide-${sanitized}`;
        let exactLucideMatch: string | null = null;

        for (const icon of this._parsedIcons) {
            if (icon.id === exactLucide) {
                exactLucideMatch = icon.id;
            }

            // Check suffix match
            if (icon.suffix === sanitized) {
                if (!icon.isLucide && !customSuffixMatch) customSuffixMatch = icon.id;
                else if (icon.isLucide && !lucideSuffixMatch) lucideSuffixMatch = icon.id;
            }

            // Smart Inclusion
            if (icon.id.includes(`-${sanitized}-`) || icon.id.startsWith(`${sanitized}-`) || icon.id.includes(sanitized)) {
                if (!icon.isLucide && !customContainsMatch) customContainsMatch = icon.id;
                else if (icon.isLucide && !lucideContainsMatch) lucideContainsMatch = icon.id;
            }
        }

        // Top Priority: Custom Suffix > Custom Contains
        // Fallback Priority: Exact Lucide > Lucide Suffix > Lucide Contains
        let resolved = customSuffixMatch || customContainsMatch || exactLucideMatch || lucideSuffixMatch || lucideContainsMatch || null;
        
        // --- Keyword Fallback ---
        if (!resolved && sanitized.includes('-')) {
            const keywords = sanitized.split('-').filter(w => w.length >= 4);

            let bestCustomMatch: string | null = null;
            let bestLucideMatch: string | null = null;

            for (const keyword of keywords) {
                let kwCustomMatch: string | null = null;
                let kwLucideMatch: string | null = null;

                for (const icon of this._parsedIcons) {
                    if (icon.significantParts.has(keyword)) {
                        if (!icon.isLucide && !kwCustomMatch) kwCustomMatch = icon.id;
                        else if (icon.isLucide && !kwLucideMatch) kwLucideMatch = icon.id;
                    }
                }
                
                if (kwCustomMatch && !bestCustomMatch) bestCustomMatch = kwCustomMatch;
                if (kwLucideMatch && !bestLucideMatch) bestLucideMatch = kwLucideMatch;
            }
            
            resolved = bestCustomMatch || bestLucideMatch || null;
        }

        // Cache and return
        this._resolvedIconIdCache.set(requestedIcon, resolved);
        return resolved;
    }

    /**
     * Resolves a generic requested icon (e.g., "github") to a concrete installed pack ID
     * (e.g., "remix-github-fill"). Returns the original string if not found.
     */
    resolveIconId(requestedIcon: string): string {
        const found = this.findIconId(requestedIcon);
        return found || requestedIcon;
    }

    /** Clears the category and normalization caches — call when icon settings change. */
    invalidateCategoryCache() {
        this._categoryCache = null;
        this._customRulesKey = '';
        this._normCache.clear();
        this._parsedIcons = null;
        this._lastIconIdsCheckTime = 0;
        this._resolvedIconIdCache.clear();
    }

    /**
     * Returns true if the given iconId is an Emoji rather than a Lucide/custom SVG ID.
     * Lucide and custom icon IDs only contain a-z, 0-9, dashes and underscores.
     * Anything with non-standard characters (or very short) is an emoji.
     */
    isEmojiIcon(iconId: string): boolean {
        if (!iconId) return false;
        if (iconId.length <= 2) return true; // Single/double char emojis
        return /[^a-zA-Z0-9\-_]/.test(iconId); // Contains non-standard chars
    }


    /**
     * Gets a normalized SVG string, handling cache.
     */
    getIconSvg(iconId: string, shouldEncode = true): string {
        const cacheKey = `${iconId}-${shouldEncode ? 'enc' : 'raw'}`;
        let cached = this.plugin.iconCache.get(cacheKey);
        if (cached) return cached;

        let svgStr = "";
        // 1. Try Custom Icons
        if (this.plugin.settings.customIcons[iconId]) {
            svgStr = this.plugin.settings.customIcons[iconId];
        } else if (this.plugin.localFileSystemIcons && this.plugin.localFileSystemIcons[iconId]) {
            // 2. Try Local Filesystem Icons (from .obsidian/icons)
            svgStr = this.plugin.localFileSystemIcons[iconId];
        } else {
            // 3. Try Lucide Icons
            const tempEl = activeDocument.createElementNS('http://www.w3.org/1999/xhtml', 'div') as HTMLDivElement;
            obsidian.setIcon(tempEl, iconId);
            if (!tempEl.querySelector('svg') && !iconId.startsWith('lucide-')) {
                obsidian.setIcon(tempEl, `lucide-${iconId}`);
            }
            const svgEl = tempEl.querySelector('svg');
            if (svgEl) {
                svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                svgStr = svgEl.outerHTML;
            }
        }

        if (svgStr) {
            const normalized = this.normalizeSvg(svgStr, shouldEncode);
            this.plugin.iconCache.set(cacheKey, normalized);
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
