import { IColorfulFoldersPlugin } from '../common/types';
import { LRUCache } from '../common/LRUCache';
import { safeEscape } from '../common/utils';

export class AnimatedIconService {
    private plugin: IColorfulFoldersPlugin;
    private _animatedTemplateCache: LRUCache<string, HTMLElement> = new LRUCache<string, HTMLElement>(256);
    private _domParser: DOMParser | null = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    /**
     * Checks whether an icon SVG contains SMIL animation elements or CSS keyframes
     */
    public isAnimatedIcon(iconId: string): boolean {
        if (!iconId) return false;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw) return false;
        return /<animate|<animateTransform|<animateMotion|<set|@keyframes|animation:\s*/i.test(raw);
    }

    /**
     * Returns a sanitized, pre-compiled template element for an animated icon
     */
    public getAnimatedIconElement(iconId: string): HTMLElement | null {
        if (!iconId) return null;
        if (this._animatedTemplateCache.has(iconId)) {
            return this._animatedTemplateCache.get(iconId) || null;
        }

        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw || !this.isAnimatedIcon(iconId)) return null;

        try {
            const parser = this._domParser;
            if (!parser) return null;

            let doc = parser.parseFromString(raw, 'image/svg+xml');
            if (doc.getElementsByTagName("parsererror").length > 0) {
                doc = parser.parseFromString(raw, 'text/html');
            }

            // Security: strip active scripts, iframes, and on* handlers
            const dangerousTags = ['script', 'iframe', 'object', 'embed', 'foreignobject'];
            for (const tag of dangerousTags) {
                doc.querySelectorAll(tag).forEach(el => el.remove());
            }
            doc.querySelectorAll('*').forEach(el => {
                const attrs = Array.from(el.attributes);
                for (const attr of attrs) {
                    if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
                }
            });

            const svg = doc.querySelector('svg');
            if (!svg) return null;

            if (!svg.hasAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.removeAttribute('width');
            svg.removeAttribute('height');

            const wrap = createSpan({ cls: 'cf-live-animated-icon' });
            wrap.appendChild(svg);

            this._animatedTemplateCache.set(iconId, wrap);
            return wrap;
        } catch {
            return null;
        }
    }

    private _hasAnimatedCache: boolean | null = null;

    /**
     * Fast O(1) check if any animated icons are currently configured
     */
    public hasAnyAnimatedIcons(): boolean {
        if (this._hasAnimatedCache !== null) return this._hasAnimatedCache;

        const customFolderColors = this.plugin.settings.customFolderColors || {};
        const customIcons = this.plugin.settings.customIcons || {};
        for (const p in customFolderColors) {
            const style = customFolderColors[p];
            const iconId = (typeof style === 'object' && style !== null) ? style.iconId : undefined;
            if (iconId && this.isAnimatedIcon(iconId)) {
                this._hasAnimatedCache = true;
                return true;
            }
        }
        for (const p in customIcons) {
            const style = customIcons[p];
            const iconId = typeof style === 'string' ? style : (typeof style === 'object' && style !== null ? (style as { iconId?: string }).iconId : undefined);
            if (iconId && this.isAnimatedIcon(iconId)) {
                this._hasAnimatedCache = true;
                return true;
            }
        }
        this._hasAnimatedCache = false;
        return false;
    }

    /**
     * Invalidate cached templates and animation flags when custom icons or styles change
     */
    public invalidateCache(iconId?: string): void {
        this._hasAnimatedCache = null;
        if (iconId) {
            this._animatedTemplateCache.delete(iconId);
        } else {
            this._animatedTemplateCache.clear();
        }
    }

    /**
     * Synchronizes all animated icons across all open file explorer views.
     * Pure O(1) NO-OP if no animated icons exist in user settings.
     */
    public syncAnimatedIcons(): void {
        if (!this.hasAnyAnimatedIcons()) {
            return;
        }

        const customFolderColors = this.plugin.settings.customFolderColors || {};
        const customIcons = this.plugin.settings.customIcons || {};

        const animatedTargetsMap = new Map<string, string>();
        for (const p in customFolderColors) {
            const style = customFolderColors[p];
            const iconId = (typeof style === 'object' && style !== null) ? style.iconId : undefined;
            if (iconId && this.isAnimatedIcon(iconId)) {
                animatedTargetsMap.set(p, iconId);
            }
        }
        for (const p in customIcons) {
            const style = customIcons[p];
            const iconId = typeof style === 'string' ? style : (typeof style === 'object' && style !== null ? (style as { iconId?: string }).iconId : undefined);
            if (iconId && this.isAnimatedIcon(iconId)) {
                animatedTargetsMap.set(p, iconId);
            }
        }

        if (animatedTargetsMap.size === 0) return;

        const allContainers = this.plugin.getAllExplorerContainers();
        if (allContainers.length === 0) return;

        for (let i = 0; i < allContainers.length; i++) {
            const container = allContainers[i];

            // 1. Clean up any stale animated icons that are no longer in animatedTargetsMap
            const existingLiveIcons = container.querySelectorAll<HTMLElement>('.cf-live-animated-icon');
            for (let j = 0; j < existingLiveIcons.length; j++) {
                const liveIcon = existingLiveIcons[j];
                const rowEl = liveIcon.closest<HTMLElement>('.nav-folder-title, .nav-file-title, .tree-item-self');
                const rowPath = rowEl?.getAttribute('data-path');
                const currentAnimatedIconId = rowPath ? animatedTargetsMap.get(rowPath) : undefined;

                if (!rowPath || !currentAnimatedIconId || liveIcon.getAttribute('data-icon-id') !== currentAnimatedIconId) {
                    rowEl?.classList.remove('cf-animated-icon-active');
                    liveIcon.remove();
                }
            }

            // 2. Mount or update active animated icons
            for (const [targetPath, iconId] of animatedTargetsMap.entries()) {
                const template = this.getAnimatedIconElement(iconId);
                if (!template) continue;

                const safePath = safeEscape(targetPath);
                const titleEl = container.querySelector<HTMLElement>(
                    `.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"], .tree-item-self[data-path="${safePath}"]`
                );
                if (!titleEl) continue;

                const textEl = titleEl.querySelector<HTMLElement>('.nav-folder-title-content, .nav-file-title-content, .tree-item-inner');
                if (!textEl) continue;

                const existingIcon = titleEl.querySelector<HTMLElement>('.cf-live-animated-icon');
                if (!existingIcon) {
                    const cloned = template.cloneNode(true) as HTMLElement;
                    cloned.setAttribute('data-icon-id', iconId);
                    titleEl.classList.add('cf-animated-icon-active');
                    textEl.parentElement?.insertBefore(cloned, textEl);
                } else if (existingIcon.getAttribute('data-icon-id') !== iconId) {
                    existingIcon.remove();
                    const cloned = template.cloneNode(true) as HTMLElement;
                    cloned.setAttribute('data-icon-id', iconId);
                    titleEl.classList.add('cf-animated-icon-active');
                    textEl.parentElement?.insertBefore(cloned, textEl);
                }
            }
        }
    }
}
