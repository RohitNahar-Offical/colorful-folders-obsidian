import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { hashString } from '../common/utils';

export class IconManager {
    plugin: IColorfulFoldersPlugin;

    // --- Performance Caches ---
    private _categoryCache: AutoIconData[] | null = null;
    private _customRulesKey: string = '';
    private _normCache: Map<string, string> = new Map();



    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    getAutoIconData(name: string): AutoIconData | null {
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

        const matches = this._categoryCache.filter(cat => cat.rex.test(lName));
        matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (settings.iconDebugMode && matches.length > 0) {
            console.debug(`Colorful Folders [Debug]: Match for "${name}" ->`, matches[0]);
        }

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

        return null;
    }

    /** Clears the category and normalization caches — call when icon settings change. */
    invalidateCategoryCache() {
        this._categoryCache = null;
        this._customRulesKey = '';
        this._normCache.clear();
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
