import { IColorfulFoldersPlugin } from '../common/types';
import { LRUCache } from '../common/LRUCache';
import { safeEscape } from '../common/utils';

export interface RegisteredAnimatedTarget {
    iconId?: string;
    closedIconId?: string;
    openIconId?: string;
}

export class AnimatedIconService {
    private plugin: IColorfulFoldersPlugin;
    private _animatedTemplateCache: LRUCache<string, HTMLElement> = new LRUCache<string, HTMLElement>(256);
    private _domParser: DOMParser | null = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    private _intersectionObserver: IntersectionObserver | null = null;
    private _observed: WeakSet<HTMLElement> = new WeakSet<HTMLElement>();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        if (typeof IntersectionObserver !== 'undefined') {
            this._intersectionObserver = new IntersectionObserver((entries) => {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry.target && entry.target.instanceOf(HTMLElement)) {
                        const targetEl = entry.target as HTMLElement & { _cfWasOffscreen?: boolean };
                        if (entry.isIntersecting) {
                            targetEl.setAttribute('data-cf-visible', 'true');
                            const mode = targetEl.getAttribute('data-cf-anim-mode') || this.plugin.settings?.animationMode || 'click';

                            if (mode === 'infinite') {
                                if (targetEl._cfWasOffscreen) {
                                    targetEl._cfWasOffscreen = false;
                                    this.wakeAnimatedElement(targetEl);
                                }
                                const svg = targetEl.querySelector('svg') as unknown as { unpauseAnimations?: () => void };
                                if (svg && typeof svg.unpauseAnimations === 'function') {
                                    try { svg.unpauseAnimations(); } catch { void 0; }
                                }
                            } else if (mode === 'once') {
                                if (!targetEl.getAttribute('data-cf-played')) {
                                    targetEl.setAttribute('data-cf-played', 'true');
                                    this.wakeAnimatedElement(targetEl);
                                    this._intersectionObserver?.unobserve(targetEl);
                                    this._observed.delete(targetEl);
                                }
                            } else {
                                targetEl._cfWasOffscreen = false;
                            }
                        } else {
                            targetEl.setAttribute('data-cf-visible', 'false');
                            targetEl._cfWasOffscreen = true;
                            const svg = targetEl.querySelector('svg') as unknown as { pauseAnimations?: () => void };
                            if (svg && typeof svg.pauseAnimations === 'function') {
                                try { svg.pauseAnimations(); } catch { void 0; }
                            }
                        }
                    }
                }
            }, { root: null, rootMargin: '48px', threshold: 0.05 });
        }

        try {
            this.plugin.getOpenDocuments().forEach(doc => {
                doc.addEventListener('visibilitychange', this.onVisibilityChange);
            });
        } catch {
            void 0;
        }
    }

    private onVisibilityChange = (): void => {
        const docs = this.plugin.getOpenDocuments();
        let anyHidden = false;
        for (let i = 0; i < docs.length; i++) {
            if (docs[i].hidden) {
                anyHidden = true;
                break;
            }
        }
        const playState = anyHidden ? 'paused' : 'running';
        docs.forEach(doc => {
            doc.documentElement?.style.setProperty('--cf-icon-play-state', playState);
        });

        const allContainers = this.getAllNavContainers();
        for (let i = 0; i < allContainers.length; i++) {
            const icons = allContainers[i].querySelectorAll<HTMLElement>('.cf-live-animated-icon, .cf-animated-icon');
            for (let j = 0; j < icons.length; j++) {
                const svg = icons[j].querySelector('svg') as unknown as { pauseAnimations?: () => void; unpauseAnimations?: () => void };
                if (svg) {
                    if (anyHidden && typeof svg.pauseAnimations === 'function') {
                        try { svg.pauseAnimations(); } catch { void 0; }
                    } else if (!anyHidden && typeof svg.unpauseAnimations === 'function') {
                        if (icons[j].getAttribute('data-cf-visible') === 'true') {
                            try { svg.unpauseAnimations(); } catch { void 0; }
                        }
                    }
                }
            }
        }
    };

    public syncSettings(): void {
        const mode = this.plugin.settings?.animationMode || 'click';
        const speed = this.plugin.settings?.animationSpeed ?? 1;

        this.plugin.getOpenDocuments().forEach(doc => {
            if (doc.documentElement) {
                doc.documentElement.dataset.cfAnimMode = mode;
                doc.documentElement.style.setProperty('--cf-icon-speed-scale', String(speed));
            }
        });

        if (mode === 'once') {
            const allContainers = this.getAllNavContainers();
            for (let i = 0; i < allContainers.length; i++) {
                const icons = allContainers[i].querySelectorAll<HTMLElement>('.cf-live-animated-icon, .cf-animated-icon');
                for (let j = 0; j < icons.length; j++) {
                    const el = icons[j];
                    el.removeAttribute('data-cf-played');
                    if (this._intersectionObserver) {
                        this._intersectionObserver.unobserve(el);
                        this._observed.delete(el);
                        this._observed.add(el);
                        this._intersectionObserver.observe(el);
                    }
                }
            }
        }
    }

    public triggerIconAnimation(iconEl: HTMLElement): void {
        const mode = iconEl.getAttribute('data-cf-anim-mode') || this.plugin.settings?.animationMode || 'click';
        if (mode !== 'click') return;

        // Cancel active compositor animations directly to avoid forced synchronous reflows
        iconEl.classList.remove('is-cf-animating');
        const svg = iconEl.querySelector('svg');
        if (svg && typeof svg.getAnimations === 'function') {
            const activeAnims = svg.getAnimations();
            for (let i = 0; i < activeAnims.length; i++) {
                try { activeAnims[i].cancel(); } catch { void 0; }
            }
        }

        // Restart SMIL animation if applicable
        this.replayAnimatedElement(iconEl);

        const currentEl = iconEl;
        const win = iconEl.ownerDocument?.defaultView || window;
        win.requestAnimationFrame(() => {
            currentEl.classList.add('is-cf-animating');
        });

        const animEndHandler = () => {
            currentEl.classList.remove('is-cf-animating');
            currentEl.removeEventListener('animationend', animEndHandler);
        };
        currentEl.addEventListener('animationend', animEndHandler, { once: true });
        win.setTimeout(animEndHandler, 1500);
    }

    public handleDelegatedClick = (evt: MouseEvent): void => {
        if (!this.hasAnyAnimatedIcons()) return;
        const target = (evt.target as Element | null)?.closest<HTMLElement>('.cf-live-animated-icon, .cf-animated-icon');
        let iconEl: HTMLElement | null = target;
        if (!iconEl) {
            const row = (evt.target as Element | null)?.closest<HTMLElement>(
                '.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file'
            );
            if (row) {
                const isCollapsed = row.closest('.is-collapsed') !== null;
                if (isCollapsed) {
                    iconEl = row.querySelector<HTMLElement>('.cf-live-animated-icon.cf-animated-closed, .cf-live-animated-icon:not(.cf-animated-open), .cf-animated-icon.cf-animated-closed, .cf-animated-icon:not(.cf-animated-open)');
                } else {
                    iconEl = row.querySelector<HTMLElement>('.cf-live-animated-icon.cf-animated-open, .cf-live-animated-icon:not(.cf-animated-closed), .cf-animated-icon.cf-animated-open, .cf-animated-icon:not(.cf-animated-closed)');
                }
            }
        }
        if (!iconEl) return;
        this.triggerIconAnimation(iconEl);
    };

    /**
     * Checks whether an icon SVG relies on SMIL animations (<animate>, <animateTransform>, etc.)
     */
    public isSmilAnimated(iconId: string): boolean {
        if (!iconId) return false;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw) return false;
        return /<animate|<animateTransform|<animateMotion|<set/i.test(raw);
    }

    /**
     * Wakes or restarts SMIL animations if Chromium paused or broke syncbases while scrolled offscreen
     */
    public wakeAnimatedElement(el: HTMLElement): void {
        const iconId = el.getAttribute('data-icon-id');
        if (!iconId || !this.isSmilAnimated(iconId)) return;

        const template = this.getAnimatedIconElement(iconId);
        if (!template) return;

        const freshSvg = template.querySelector('svg')?.cloneNode(true);
        if (!freshSvg) return;

        const oldSvg = el.querySelector('svg');
        if (oldSvg) {
            el.replaceChild(freshSvg, oldSvg);
        } else {
            el.appendChild(freshSvg);
        }
    }

    public clearAllLiveAnimatedIconsFromDom(): void {
        const allContainers = this.getAllNavContainers();
        for (let i = 0; i < allContainers.length; i++) {
            const container = allContainers[i];
            const liveIcons = container.querySelectorAll<HTMLElement>('.cf-live-animated-icon');
            for (let j = 0; j < liveIcons.length; j++) {
                const liveIcon = liveIcons[j];
                const rowEl = liveIcon.closest<HTMLElement>('.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file');
                rowEl?.classList.remove('cf-animated-icon-active', 'cf-has-animated-closed', 'cf-has-animated-open');
                this._intersectionObserver?.unobserve(liveIcon);
                liveIcon.remove();
            }
        }
    }

    public destroy(): void {
        try {
            this.plugin.getOpenDocuments().forEach(doc => {
                doc.removeEventListener('visibilitychange', this.onVisibilityChange);
            });
        } catch {
            void 0;
        }
        this._intersectionObserver?.disconnect();
        this._intersectionObserver = null;
        this.clearAllLiveAnimatedIconsFromDom();
        this._registeredAnimatedTargets.clear();
        this.invalidateCache();
    }

    private _isAnimatedIconCache: Map<string, boolean> = new Map<string, boolean>();
    private _isLoopingIconCache: Map<string, boolean> = new Map<string, boolean>();
    private _registeredAnimatedTargets: Map<string, RegisteredAnimatedTarget> = new Map<string, RegisteredAnimatedTarget>();

    public clearRegisteredAnimatedTargets(): void {
        this._registeredAnimatedTargets.clear();
    }

    public registerActiveAnimatedTarget(path: string, iconId: string, state: 'closed' | 'open' | 'both' = 'both'): void {
        if (!path || !iconId) return;
        let target = this._registeredAnimatedTargets.get(path);
        if (!target) {
            target = {};
            this._registeredAnimatedTargets.set(path, target);
        }
        if (state === 'closed') {
            target.closedIconId = iconId;
        } else if (state === 'open') {
            target.openIconId = iconId;
        } else {
            target.iconId = iconId;
        }
        this._hasAnimatedCache = true;
    }

    /**
     * Checks whether an animated icon loops continuously (repeatCount="indefinite", repeatDur="indefinite", or CSS infinite).
     * Non-looping icons are single-shot animations that freeze upon completion.
     */
    public isLoopingAnimatedIcon(iconId: string): boolean {
        if (!iconId) return false;
        const lower = iconId.toLowerCase();
        if (lower.includes('-loop') || lower.endsWith('_loop')) {
            return true;
        }
        const cached = this._isLoopingIconCache.get(iconId);
        if (cached !== undefined) return cached;

        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw) {
            this._isLoopingIconCache.set(iconId, false);
            return false;
        }

        const isLoop = /repeatCount=["']indefinite["']|repeatDur=["']indefinite["']|\binfinite\b/i.test(raw);
        this._isLoopingIconCache.set(iconId, isLoop);
        return isLoop;
    }

    /**
     * Replays single-shot (non-looping) animated icons upon click or activation.
     * Continuous loop icons are left to run uninterrupted.
     */
    public replayAnimatedElement(el: HTMLElement): void {
        const iconId = el.getAttribute('data-icon-id');
        if (!iconId || !this.isSmilAnimated(iconId)) return;
        if (this.isLoopingAnimatedIcon(iconId)) return; // Continuous loops keep playing as normal!

        const now = Date.now();
        const targetEl = el as HTMLElement & { _cfLastReplay?: number };
        if (targetEl._cfLastReplay && (now - targetEl._cfLastReplay) < 300) {
            return; // Throttle rapid-fire double clicks
        }
        targetEl._cfLastReplay = now;

        const template = this.getAnimatedIconElement(iconId);
        if (!template) return;

        const freshSvg = template.querySelector('svg')?.cloneNode(true);
        if (!freshSvg) return;

        const oldSvg = el.querySelector('svg');
        if (oldSvg) {
            el.replaceChild(freshSvg, oldSvg);
        } else {
            el.appendChild(freshSvg);
        }
    }

    /**
     * Finds and replays any non-looping animated icon associated with a specific file or folder path.
     */
    public replayTargetByPath(targetPath: string): void {
        if (!targetPath || !this.hasAnyAnimatedIcons()) return;
        const allContainers = this.getAllNavContainers();
        const safePath = safeEscape(targetPath);
        for (let i = 0; i < allContainers.length; i++) {
            const container = allContainers[i];
            const titleEl = container.querySelector<HTMLElement>(
                `.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"], .tree-item-self[data-path="${safePath}"], .nn-navitem[data-path="${safePath}"], .nn-file[data-path="${safePath}"]`
            );
            if (!titleEl) continue;
            const liveIcons = titleEl.querySelectorAll<HTMLElement>('.cf-live-animated-icon');
            for (let j = 0; j < liveIcons.length; j++) {
                const liveIcon = liveIcons[j];
                if (liveIcon.offsetParent !== null || liveIcon.offsetWidth > 0 || liveIcon.offsetHeight > 0) {
                    this.replayAnimatedElement(liveIcon);
                }
            }
        }
    }

    /**
     * Checks whether an icon SVG contains SMIL animation elements or CSS keyframes
     */
    public isAnimatedIcon(iconId: string): boolean {
        if (!iconId) return false;
        // Fast O(1) prefix check for animated icon packs (line-md, meteocons, generative)
        if (
            iconId.startsWith('line-md-') || iconId.startsWith('linemd-') || iconId.startsWith('line-md:') || iconId.startsWith('line-md_') ||
            iconId.startsWith('meteocons-') || iconId.startsWith('meteocons:') || iconId.startsWith('meteocons_') ||
            iconId.startsWith('generative-') || iconId.startsWith('generative:') || iconId.startsWith('generative_') ||
            iconId.startsWith('useanimations-') || iconId.startsWith('useanimations:') || iconId.startsWith('useanimations_') || iconId.startsWith('ua-')
        ) {
            return true;
        }
        const cached = this._isAnimatedIconCache.get(iconId);
        if (cached !== undefined) {
            return cached;
        }
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw) {
            this._isAnimatedIconCache.set(iconId, false);
            return false;
        }
        const isAnim = /<animate|<animateTransform|<animateMotion|<set|@keyframes|animation:\s*/i.test(raw);
        this._isAnimatedIconCache.set(iconId, isAnim);
        return isAnim;
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

            // Strip dummy hit-target / bounding-box rects from Lottie interactive exports
            doc.querySelectorAll('rect').forEach(rect => {
                const w = rect.getAttribute('width');
                const h = rect.getAttribute('height');
                const pe = rect.getAttribute('pointer-events');
                const id = rect.getAttribute('id') || '';
                if (
                    (w === '32' && h === '32' && (!rect.hasAttribute('rx') && !rect.hasAttribute('stroke') && (rect.getAttribute('fill') === 'none' || !rect.hasAttribute('fill')))) ||
                    pe === 'all' ||
                    id.endsWith('_a') || id.endsWith('_b')
                ) {
                    rect.remove();
                }
            });

            const svg = doc.querySelector('svg');
            if (!svg) return null;

            if (!svg.hasAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.removeAttribute('width');
            svg.removeAttribute('height');

            const wrap = createSpan({ cls: 'cf-live-animated-icon cf-animated-icon' });
            wrap.setAttribute('data-icon-id', iconId);
            if (iconId.startsWith('meteocons-') || iconId.startsWith('meteocons:') || iconId.startsWith('meteocons_')) {
                wrap.classList.add('cf-meteocons');
            }
            if (this.isLoopingAnimatedIcon(iconId)) {
                wrap.classList.add('cf-has-native-loop');
            }
            wrap.appendChild(svg);

            this._animatedTemplateCache.set(iconId, wrap);
            return wrap;
        } catch {
            return null;
        }
    }

    private _hasAnimatedCache: boolean | null = null;
    private _libraryHasAnimatedCache: boolean | null = null;

    /**
     * Checks whether any animated icons exist in the custom icon repository or settings
     */
    public hasAnyAnimatedIconsInLibrary(): boolean {
        if (this._libraryHasAnimatedCache !== null) return this._libraryHasAnimatedCache;
        const local = this.plugin.localCustomIcons || {};
        for (const k in local) {
            if (this.isAnimatedIcon(k)) {
                this._libraryHasAnimatedCache = true;
                return true;
            }
        }
        const custom = this.plugin.settings?.customIcons || {};
        for (const k in custom) {
            if (this.isAnimatedIcon(k)) {
                this._libraryHasAnimatedCache = true;
                return true;
            }
        }
        this._libraryHasAnimatedCache = false;
        return false;
    }

    /**
     * Fast O(1) check if any animated icons are currently configured or in active use
     */
    public hasAnyAnimatedIcons(): boolean {
        if (this._registeredAnimatedTargets.size > 0) return true;
        if (this._hasAnimatedCache !== null) return this._hasAnimatedCache;

        if (this.plugin.settings?.defaultClosedFolderIcon && this.isAnimatedIcon(this.plugin.settings.defaultClosedFolderIcon)) {
            this._hasAnimatedCache = true;
            return true;
        }
        if (this.plugin.settings?.defaultOpenFolderIcon && this.isAnimatedIcon(this.plugin.settings.defaultOpenFolderIcon)) {
            this._hasAnimatedCache = true;
            return true;
        }

        const customFolderColors = this.plugin.settings?.customFolderColors || {};
        for (const p in customFolderColors) {
            const style = customFolderColors[p];
            if (typeof style === 'object' && style !== null) {
                if (style.iconId && this.isAnimatedIcon(style.iconId)) {
                    this._hasAnimatedCache = true;
                    return true;
                }
                if (style.expandedIconId && this.isAnimatedIcon(style.expandedIconId)) {
                    this._hasAnimatedCache = true;
                    return true;
                }
                if (style.activeIconId && this.isAnimatedIcon(style.activeIconId)) {
                    this._hasAnimatedCache = true;
                    return true;
                }
            }
        }

        const customIcons = this.plugin.settings?.customIcons || {};
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
        this._libraryHasAnimatedCache = null;
        if (iconId) {
            this._animatedTemplateCache.delete(iconId);
            this._isAnimatedIconCache.delete(iconId);
            this._isLoopingIconCache.delete(iconId);
        } else {
            this._animatedTemplateCache.clear();
            this._isAnimatedIconCache.clear();
            this._isLoopingIconCache.clear();
        }
    }

    /**
     * Retrieves all native file explorer containers, plus Notebook Navigator containers if enabled
     */
    public getAllNavContainers(): HTMLElement[] {
        const containers = [...this.plugin.getAllExplorerContainers()];
        if (this.plugin.settings?.notebookNavigatorSupport && this.plugin.app?.workspace) {
            this.plugin.app.workspace.iterateAllLeaves((leaf) => {
                if (!leaf || !leaf.view) return;
                const view = leaf.view as unknown as { getViewType?: () => string; containerEl?: HTMLElement };
                if (typeof view.getViewType === 'function' && view.getViewType() === 'notebook-navigator') {
                    if (view.containerEl && !containers.includes(view.containerEl)) {
                        containers.push(view.containerEl);
                    }
                }
            });
        }
        return containers;
    }

    /**
     * Synchronizes all animated icons across all open file explorer views.
     * Pure O(1) NO-OP if no animated icons exist in user settings or library.
     */
    public syncAnimatedIcons(): void {
        if (!this.hasAnyAnimatedIcons()) {
            return;
        }

        const customFolderColors = this.plugin.settings?.customFolderColors || {};
        const customIcons = this.plugin.settings?.customIcons || {};
        const animatedTargetsMap = new Map<string, RegisteredAnimatedTarget>();

        // Fast path: use already registered targets from StyleGenerator (O(K) where K is active animated count)
        if (this._registeredAnimatedTargets.size > 0) {
            for (const [p, registered] of this._registeredAnimatedTargets.entries()) {
                animatedTargetsMap.set(p, { ...registered });
            }
        } else {
            // Fallback path: only if no targets registered yet (e.g. pre-render check)
            for (const p in customFolderColors) {
                const style = customFolderColors[p];
                if (typeof style === 'object' && style !== null) {
                    const target: RegisteredAnimatedTarget = {};
                    let hasAny = false;
                    if (style.iconId && this.isAnimatedIcon(style.iconId)) {
                        target.closedIconId = style.iconId;
                        hasAny = true;
                    }
                    if (style.expandedIconId && this.isAnimatedIcon(style.expandedIconId)) {
                        target.openIconId = style.expandedIconId;
                        hasAny = true;
                    }
                    if (hasAny) {
                        animatedTargetsMap.set(p, target);
                    }
                }
            }
            for (const p in customIcons) {
                const style = customIcons[p];
                const iconId = typeof style === 'string' ? style : (typeof style === 'object' && style !== null ? (style as { iconId?: string }).iconId : undefined);
                if (iconId && this.isAnimatedIcon(iconId)) {
                    let target = animatedTargetsMap.get(p);
                    if (!target) {
                        target = { iconId };
                        animatedTargetsMap.set(p, target);
                    } else {
                        target.iconId = iconId;
                    }
                }
            }
        }

        if (animatedTargetsMap.size === 0) return;

        const allContainers = this.getAllNavContainers();
        if (allContainers.length === 0) return;

        for (let i = 0; i < allContainers.length; i++) {
            const container = allContainers[i];

            // 1. Clean up any stale animated icons that are no longer in animatedTargetsMap
            const existingLiveIcons = container.querySelectorAll<HTMLElement>('.cf-live-animated-icon');
            for (let j = 0; j < existingLiveIcons.length; j++) {
                const liveIcon = existingLiveIcons[j];
                const rowEl = liveIcon.closest<HTMLElement>('.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file');
                const rowPath = rowEl?.getAttribute('data-path');
                const targetConfig = rowPath ? animatedTargetsMap.get(rowPath) : undefined;

                if (!rowPath || !targetConfig) {
                    rowEl?.classList.remove('cf-animated-icon-active', 'cf-has-animated-closed', 'cf-has-animated-open');
                    this._intersectionObserver?.unobserve(liveIcon);
                    this._observed.delete(liveIcon);
                    liveIcon.remove();
                    continue;
                }

                const state = liveIcon.getAttribute('data-state');
                const iconId = liveIcon.getAttribute('data-icon-id');
                const expectedIconId = state === 'open' ? targetConfig.openIconId : (state === 'closed' ? targetConfig.closedIconId : targetConfig.iconId);

                if (!expectedIconId || iconId !== expectedIconId) {
                    this._intersectionObserver?.unobserve(liveIcon);
                    this._observed.delete(liveIcon);
                    liveIcon.remove();
                }
            }

            // 2. Mount or update active animated icons
            for (const [targetPath, targetConfig] of animatedTargetsMap.entries()) {
                const safePath = safeEscape(targetPath);
                const titleEl = container.querySelector<HTMLElement>(
                    `.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"], .tree-item-self[data-path="${safePath}"], .nn-navitem[data-path="${safePath}"], .nn-file[data-path="${safePath}"]`
                );
                if (!titleEl) continue;

                const textEl = titleEl.querySelector<HTMLElement>('.nav-folder-title-content, .nav-file-title-content, .tree-item-inner, .nn-navitem-name, .nn-file-name');
                if (!textEl) continue;

                const styleObj = customFolderColors[targetPath] || customIcons[targetPath];
                const customIconColor = (typeof styleObj === 'object' && styleObj !== null) ? styleObj.iconColor : undefined;

                // Support Notebook Navigator dedicated icon container
                const nnIconSlot = titleEl.querySelector<HTMLElement>('.nn-navitem-icon, .nn-file-icon-slot, .nn-file-icon');

                // Update row classes for CSS ::before suppression
                if (targetConfig.iconId) {
                    titleEl.classList.add('cf-animated-icon-active');
                    titleEl.classList.remove('cf-has-animated-closed', 'cf-has-animated-open');
                } else {
                    titleEl.classList.remove('cf-animated-icon-active');
                    if (targetConfig.closedIconId) {
                        titleEl.classList.add('cf-has-animated-closed');
                    } else {
                        titleEl.classList.remove('cf-has-animated-closed');
                    }
                    if (targetConfig.openIconId) {
                        titleEl.classList.add('cf-has-animated-open');
                    } else {
                        titleEl.classList.remove('cf-has-animated-open');
                    }
                }

                const mountOrUpdate = (iconId: string, stateCls: 'cf-animated-closed' | 'cf-animated-open' | null, stateAttr: 'closed' | 'open' | 'both') => {
                    const template = this.getAnimatedIconElement(iconId);
                    if (!template) return;

                    const selector = stateCls ? `.cf-live-animated-icon.${stateCls}` : `.cf-live-animated-icon:not(.cf-animated-closed):not(.cf-animated-open)`;
                    const existingIcon = titleEl.querySelector<HTMLElement>(selector);

                    if (!existingIcon) {
                        const cloned = template.cloneNode(true) as HTMLElement & { _cfWasOffscreen?: boolean };
                        cloned.setAttribute('data-icon-id', iconId);
                        cloned.setAttribute('data-state', stateAttr);
                        cloned.setAttribute('data-cf-visible', 'true');
                        if (stateCls) cloned.classList.add(stateCls);
                        if (iconId.startsWith('meteocons-') || iconId.startsWith('meteocons:') || iconId.startsWith('meteocons_')) {
                            cloned.classList.add('cf-meteocons');
                        }
                        cloned._cfWasOffscreen = false;
                        if (customIconColor) {
                            cloned.setCssProps({ '--cf-animated-icon-color': customIconColor });
                        }
                        if (nnIconSlot) {
                            nnIconSlot.appendChild(cloned);
                        } else {
                            textEl.parentElement?.insertBefore(cloned, textEl);
                        }
                        if (!this._observed.has(cloned)) {
                            this._observed.add(cloned);
                            this._intersectionObserver?.observe(cloned);
                        }
                    } else if (existingIcon.getAttribute('data-icon-id') !== iconId) {
                        this._intersectionObserver?.unobserve(existingIcon);
                        this._observed.delete(existingIcon);
                        existingIcon.remove();
                        const cloned = template.cloneNode(true) as HTMLElement & { _cfWasOffscreen?: boolean };
                        cloned.setAttribute('data-icon-id', iconId);
                        cloned.setAttribute('data-state', stateAttr);
                        cloned.setAttribute('data-cf-visible', 'true');
                        if (stateCls) cloned.classList.add(stateCls);
                        if (iconId.startsWith('meteocons-') || iconId.startsWith('meteocons:') || iconId.startsWith('meteocons_')) {
                            cloned.classList.add('cf-meteocons');
                        }
                        cloned._cfWasOffscreen = false;
                        if (customIconColor) {
                            cloned.setCssProps({ '--cf-animated-icon-color': customIconColor });
                        }
                        if (nnIconSlot) {
                            nnIconSlot.appendChild(cloned);
                        } else {
                            textEl.parentElement?.insertBefore(cloned, textEl);
                        }
                        if (!this._observed.has(cloned)) {
                            this._observed.add(cloned);
                            this._intersectionObserver?.observe(cloned);
                        }
                    } else {
                        // Update color without tearing down active animation
                        if (customIconColor) {
                            existingIcon.setCssProps({ '--cf-animated-icon-color': customIconColor });
                        }
                    }
                };

                if (targetConfig.iconId) {
                    mountOrUpdate(targetConfig.iconId, null, 'both');
                } else {
                    if (targetConfig.closedIconId) {
                        mountOrUpdate(targetConfig.closedIconId, 'cf-animated-closed', 'closed');
                    }
                    if (targetConfig.openIconId) {
                        mountOrUpdate(targetConfig.openIconId, 'cf-animated-open', 'open');
                    }
                }
            }
        }
    }
}
