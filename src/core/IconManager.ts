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
        const cleanS = s.replace(/^(si|simple|simple-icons|simpleicons|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

        if (local) {
            if (local[s]) return s;
            if (local[cleanS]) return cleanS;
            for (const key of Object.keys(local)) {
                if (key === s || key === cleanS || key.endsWith(`-${s}`) || key.endsWith(`-${cleanS}`) || key.endsWith(`/${cleanS}`)) {
                    return key;
                }
            }
        }
        if (custom) {
            if (custom[s]) return s;
            if (custom[cleanS]) return cleanS;
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
                const baseName = lId.replace(/^(si|simple|simple-icons|simpleicons|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

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

    refreshIcons() {
        const containers: Element[] = [];
        this.plugin.app.workspace.getLeavesOfType('file-explorer').forEach(leaf => {
            containers.push(leaf.view.containerEl);
        });

        containers.forEach(container => {
            const items = container.querySelectorAll('.nav-folder-title, .nav-file-title, .tree-item-self');
            items.forEach(item => {
                const path = (item as HTMLElement).dataset.path;
                if (!path) return;

                const style = this.plugin.getStyle(path);
                
                // Toggle cf-hidden class on wrapper
                const wrapper = item.closest('.nav-folder, .nav-file, .tree-item, .nn-navitem');
                if (wrapper) {
                    wrapper.classList.toggle('cf-hidden', !!(style && typeof style === 'object' && style.isHidden));
                }

                if (style && style.iconId) {
                    // FIX 3: Route through RAF queue so bulk renders don't thrash layout
                    this._queueInjection(item as HTMLElement, style);
                } else {
                    this.removeInjectedIcon(item as HTMLElement);
                }
            });
        });
    }

    /**
     * FIX 2: Targeted injection for specific nodes from a MutationRecord.
     * Instead of re-scanning the entire explorer container (O(N-total)),
     * this only processes the nodes that actually changed (O(N-changed)),
     * which is typically 1-5 nodes during a virtual-list scroll recycle.
     */
    injectIconsForNodes(nodes: NodeList) {
        nodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as HTMLElement;

            // The added node could be the title element itself, or a parent wrapper.
            // Check the node and its direct title child.
            const titleSelectors = '.nav-folder-title, .nav-file-title, .tree-item-self';
            const candidates: HTMLElement[] = [];
            if (el.matches(titleSelectors)) {
                candidates.push(el);
            } else {
                el.querySelectorAll<HTMLElement>(titleSelectors).forEach(c => candidates.push(c));
            }

            for (const titleEl of candidates) {
                const path = titleEl.dataset.path;
                if (!path) continue;
                const style = this.plugin.getStyle(path);
                
                // Toggle cf-hidden class on wrapper
                const wrapper = titleEl.closest('.nav-folder, .nav-file, .tree-item, .nn-navitem');
                if (wrapper) {
                    wrapper.classList.toggle('cf-hidden', !!(style && typeof style === 'object' && style.isHidden));
                }

                if (style && style.iconId) {
                    this._queueInjection(titleEl, style);
                } else {
                    this.removeInjectedIcon(titleEl);
                }
            }
        });
    }

    /** FIX 3: Enqueue an icon injection to be flushed on the next animation frame. */
    private _queueInjection(el: HTMLElement, style: FolderStyle) {
        this._pendingInjections.push({ el, style });
        if (!this._rafPending) {
            this._rafPending = true;
            window.requestAnimationFrame(() => {
                this._flushInjections();
                this._rafPending = false;
            });
        }
    }

    /** FIX 3: Execute all queued injections in one batch. */
    private _flushInjections() {
        const batch = this._pendingInjections.splice(0);
        for (const { el, style } of batch) {
            this._doInjectIcon(el, style);
        }
    }

    /**
     * Public entry point: routes through the RAF queue for scroll-safe rendering.
     */
    injectIcon(el: HTMLElement, style: FolderStyle) {
        this._queueInjection(el, style);
    }

    /**
     * FIX 3 + 4: The actual synchronous injection work, called only from _flushInjections.
     * Contains the FIX 4 version-stamp early-exit guard.
     */
    private _doInjectIcon(el: HTMLElement, style: FolderStyle) {
        if (!style.iconId) return;

        // Get RAW cleaned SVG
        const svgStr = this.getIconSvg(style.iconId, false);
        if (!svgStr) {
            this.removeInjectedIcon(el);
            return;
        }

        const color = style.iconColor || style.hex || style.textColor || 'var(--text-normal)';

        // FIX 4: Version-stamp early-exit. If the wrapper already shows the correct
        // icon and color, skip ALL DOM work — this makes repeat refreshIcons() calls
        // essentially free for already-rendered elements.
        const existingWrapper = el.querySelector<HTMLElement>('.cf-icon-wrapper');
        if (existingWrapper &&
            existingWrapper.dataset.cfIconId === style.iconId &&
            existingWrapper.dataset.cfIconColor === color) {
            return;
        }

        // Prepare or find wrapper
        const doc = el.ownerDocument || activeDocument;
        const content = el.querySelector('.nav-folder-title-content, .nav-file-title-content, .tree-item-inner');
        if (content) {
            content.addClass('cf-icon-active');
            // Proactively hide any existing default SVG icons or tags
            content.querySelectorAll(':scope > svg:not(.cf-icon-wrapper svg), :scope > .nav-folder-icon, :scope > .nav-file-icon').forEach((s: HTMLElement) => {
                s.setCssStyles({ display: 'none' });
            });
        }

        let wrapper = el.querySelector<HTMLElement>('.cf-icon-wrapper');
        if (!wrapper) {
            wrapper = doc.createElement('span');
            wrapper.classList.add('cf-icon-wrapper');
            wrapper.setCssStyles({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginRight: '6px',
                flexShrink: '0',
                overflow: 'visible'
            });
            if (content) content.prepend(wrapper);
        }

        const wideScale = this.plugin.settings.wideAutoIcons ? 1.05 : 1.0;
        const scale = (this.plugin.settings.iconScale || 1.0) * wideScale;

        wrapper.setCssStyles({
            width: `calc(1.3em * ${scale})`,
            height: `calc(1.3em * ${scale})`
        });
        
        const coloredSvg = this.colorizeSvg(svgStr, color);
        wrapper.empty();
        // eslint-disable-next-line no-unsanitized/method -- contextual fragment is safe here as coloredSvg is derived from sanitized/built-in icons
        const frag = doc.createRange().createContextualFragment(coloredSvg);
        
        // Ensure the SVG perfectly fills our responsive wrapper
        const svgEl = frag.querySelector('svg');
        if (svgEl) {
            (svgEl as unknown as HTMLElement).setCssStyles({
                width: '100%',
                height: '100%',
                display: 'block'
            });
        }
        
        wrapper.appendChild(frag);

        // FIX 4: Stamp the rendered icon ID and color so repeat calls can early-exit
        wrapper.dataset.cfIconId = style.iconId;
        wrapper.dataset.cfIconColor = color;
    }

    removeInjectedIcon(el: HTMLElement) {
        const wrapper = el.querySelector('.cf-icon-wrapper');
        if (wrapper) wrapper.remove();
        
        const content = el.querySelector('.nav-folder-title-content, .nav-file-title-content, .tree-item-inner');
        if (content) {
            content.removeClass('cf-icon-active');
            // Restore hidden SVGs if they were hidden by us
            content.querySelectorAll(':scope > svg:not(.cf-icon-wrapper svg), :scope > .nav-folder-icon, :scope > .nav-file-icon').forEach((s: HTMLElement) => {
                s.setCssStyles({ display: '' });
            });
        }
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
