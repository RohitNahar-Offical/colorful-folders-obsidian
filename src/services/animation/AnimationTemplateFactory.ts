import { LRUCache } from '../../common/LRUCache';

/**
 * Compiles, sanitizes, and caches SVG template elements for live animated icons.
 * Enforces XSS security guards, strips bounding box hit targets, and normalizes aspect ratios.
 */
export class AnimationTemplateFactory {
    private _animatedTemplateCache = new LRUCache<string, HTMLElement>(512);
    private _domParser: DOMParser | null = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

    /**
     * Compiles a sanitized, pre-structured template element for an animated icon.
     */
    public getTemplate(iconId: string, rawSvg: string, isLooping: boolean): HTMLElement | null {
        if (!iconId) return null;

        const cached = this._animatedTemplateCache.get(iconId);
        if (cached) return cached;

        if (!rawSvg) return null;

        const parser = this._domParser;
        if (!parser) return null;

        try {
            let doc = parser.parseFromString(rawSvg, 'image/svg+xml');
            if (doc.getElementsByTagName('parsererror').length > 0) {
                doc = parser.parseFromString(rawSvg, 'text/html');
            }

            // Security: strip active scripts, iframes, and on* handlers
            const dangerousTags = ['script', 'iframe', 'object', 'embed', 'foreignobject'];
            for (let i = 0; i < dangerousTags.length; i++) {
                doc.querySelectorAll(dangerousTags[i]).forEach(el => el.remove());
            }
            if (rawSvg.includes('on') || rawSvg.includes('ON')) {
                doc.querySelectorAll('*').forEach(el => {
                    const attrs = Array.from(el.attributes);
                    for (let i = 0; i < attrs.length; i++) {
                        if (attrs[i].name.toLowerCase().startsWith('on')) {
                            el.removeAttribute(attrs[i].name);
                        }
                    }
                });
            }

            // Strip dummy hit-target / bounding-box rects and outer framing rects from Lottie interactive exports
            if (rawSvg.includes('rect') || rawSvg.includes('RECT')) {
                doc.querySelectorAll('rect').forEach(rect => {
                    const wStr = rect.getAttribute('width');
                    const hStr = rect.getAttribute('height');
                    const xStr = rect.getAttribute('x');
                    const yStr = rect.getAttribute('y');
                    const pe = rect.getAttribute('pointer-events');
                    const id = rect.getAttribute('id') || '';
                    const w = wStr ? parseFloat(wStr) : 0;
                    const h = hStr ? parseFloat(hStr) : 0;
                    const x = xStr ? parseFloat(xStr) : 0;
                    const y = yStr ? parseFloat(yStr) : 0;

                    const isHitTarget = (w === 32 && h === 32) || pe === 'all' || id.endsWith('_a') || id.endsWith('_b');
                    const isOuterFrame = (w >= 16 && h >= 16 && x <= 8 && y <= 8 && (rect.hasAttribute('stroke') || rect.getAttribute('fill') === 'none'));

                    if (isHitTarget || isOuterFrame) {
                        rect.remove();
                    }
                });
            }

            const svg = doc.querySelector('svg');
            if (!svg) return null;

            if (!svg.hasAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.setAttribute('overflow', 'visible');
            svg.removeAttribute('width');
            svg.removeAttribute('height');

            const wrap = createSpan();
            wrap.className = 'cf-live-animated-icon cf-animated-icon';
            wrap.setAttribute('data-icon-id', iconId);

            if (iconId.startsWith('meteocons-') || iconId.startsWith('meteocons:') || iconId.startsWith('meteocons_')) {
                wrap.classList.add('cf-meteocons');
            }
            if (isLooping) {
                wrap.classList.add('cf-has-native-loop');
            }
            wrap.appendChild(svg);

            this._animatedTemplateCache.set(iconId, wrap);
            return wrap;
        } catch {
            return null;
        }
    }

    /**
     * Clears template cache (for a single icon or globally).
     */
    public clearCache(iconId?: string): void {
        if (iconId) {
            this._animatedTemplateCache.delete(iconId);
        } else {
            this._animatedTemplateCache.clear();
        }
    }
}
