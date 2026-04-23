import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle, AutoIconData } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { hashString } from '../common/utils';

export class IconManager {
    plugin: IColorfulFoldersPlugin;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    /**
     * Finds the best icon match for a given file/folder name.
     */
    getAutoIconData(name: string): AutoIconData | null {
        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const categories = [...AUTO_ICON_CATEGORIES];

        if (settings.customIconRules) {
            const rules = settings.customIconRules.split('\n').filter(r => r.trim());
            for (const rule of rules) {
                try {
                    const mainParts = rule.split('=').map(p => p.trim());
                    if (mainParts.length < 2) continue;

                    const pattern = mainParts[0];
                    let secondHalf = mainParts[1];
                    let priority = 1500;

                    if (secondHalf.includes('@')) {
                        const prioParts = secondHalf.split('@').map(p => p.trim());
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

        const matches = categories.filter(cat => cat.rex.test(lName));
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
        } else {
            // 2. Try Lucide Icons
            const tempEl = activeDocument.createElement('div');
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
     * Scans the visible DOM and injects icons where needed.
     */
    refreshIcons() {
        const containers: Element[] = [];
        this.plugin.app.workspace.getLeavesOfType('file-explorer').forEach(leaf => {
            containers.push(leaf.view.containerEl);
        });
        
        activeDocument.querySelectorAll('.nn-navigation-pane-content, .nn-virtual-container').forEach(c => containers.push(c));

        containers.forEach(container => {
            const items = container.querySelectorAll('.nav-folder-title, .tree-item-self, .nn-navitem, .nn-file');
            items.forEach(item => {
                const path = (item as HTMLElement).dataset.path;
                if (!path) return;

                const style = this.plugin.getStyle(path);
                if (style && style.iconId) {
                    this.injectIcon(item as HTMLElement, style);
                } else {
                    this.removeInjectedIcon(item as HTMLElement);
                }
            });
        });
    }

    /**
     * Injects a specific icon into an element.
     */
    injectIcon(el: HTMLElement, style: FolderStyle) {
        if (!style.iconId) return;

        // Get RAW cleaned SVG
        const svgStr = this.getIconSvg(style.iconId, false);
        if (!svgStr) {
            this.removeInjectedIcon(el);
            return;
        }

        // Prepare or find wrapper
        const doc = el.ownerDocument || activeDocument;
        const content = el.querySelector('.nav-folder-title-content, .tree-item-inner, .nn-navitem-name, .nn-file-name');
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
                verticalAlign: 'middle',
                marginRight: '6px',
                flexShrink: '0'
            });
            if (content) content.prepend(wrapper);
        }

        const color = style.iconColor || style.hex || style.textColor || 'var(--text-normal)';
        const baseSize = 18;
        const wideScale = this.plugin.settings.wideAutoIcons ? 1.05 : 1.0;
        const size = Math.round(baseSize * (this.plugin.settings.iconScale || 1.0) * wideScale);

        wrapper.style.width = `${size}px`;
        wrapper.style.height = `${size}px`;
        
        const coloredSvg = this.colorizeSvg(svgStr, color);
        wrapper.empty();
        // eslint-disable-next-line no-unsanitized/method -- contextual fragment is safe here as coloredSvg is derived from sanitized/built-in icons
        const frag = doc.createRange().createContextualFragment(coloredSvg);
        wrapper.appendChild(frag);
    }

    removeInjectedIcon(el: HTMLElement) {
        const wrapper = el.querySelector('.cf-icon-wrapper');
        if (wrapper) wrapper.remove();
        
        const content = el.querySelector('.nav-folder-title-content, .tree-item-inner, .nn-navitem-name, .nn-file-name');
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
        try {
            if (!svgStr) return "";
            const rawSvg = svgStr.includes('%') ? decodeURIComponent(svgStr) : svgStr;

            if (!rawSvg.includes('<svg')) return svgStr;

            const parser = new DOMParser();
            let doc = parser.parseFromString(rawSvg, 'image/svg+xml');
            if (doc.getElementsByTagName("parsererror").length > 0) doc = parser.parseFromString(rawSvg, 'text/html');
            
            const svg = doc.querySelector('svg');
            if (!svg) return svgStr;

            // --- Robust DOM-based Sanitization ---
            // We block only truly dangerous tags. 'defs' and 'style' are allowed 
            // for compatibility with complex icons (gradients/patterns).
            const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'foreignObject'];
            
            const sanitizeNode = (el: Element) => {
                const tag = el.tagName.toLowerCase();
                
                if (FORBIDDEN_TAGS.includes(tag)) {
                    el.remove();
                    return;
                }

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
            // -------------------------------------

            if (!svg.hasAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
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
                        // Detect background rectangles defined as paths
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
            return shouldEncode ? encodeURIComponent(cleaned) : cleaned;
        } catch { return svgStr; }
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
