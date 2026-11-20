import { IColorfulFoldersPlugin } from '../common/types';
import { safeEscape } from '../common/utils';
import { AnimationClassifier } from './animation/AnimationClassifier';
import { AnimationTemplateFactory } from './animation/AnimationTemplateFactory';
import { AnimationViewportManager } from './animation/AnimationViewportManager';
import { AnimationPlaybackEngine } from './animation/AnimationPlaybackEngine';
import { AnimationDomMounter } from './animation/AnimationDomMounter';
import { RegisteredAnimatedTarget, AnimationPlaybackState } from './animation/AnimationTypes';

export type { RegisteredAnimatedTarget } from './animation/AnimationTypes';

/**
 * AnimatedIconService (Facade & Orchestrator)
 *
 * Coordinates the animated icon subsystem across file explorer views and Notebook Navigator.
 * Adheres to Object-Oriented Design (OOP) principles by delegating distinct responsibilities
 * to specialized, highly-cohesive components:
 * - AnimationClassifier: Classification and looping heuristics
 * - AnimationTemplateFactory: Template sanitization, XSS security, and LRU caching
 * - AnimationViewportManager: IntersectionObserver off-screen culling and tab visibility
 * - AnimationPlaybackEngine: Click replay, SMIL syncbase triggers, and Web Animations API
 * - AnimationDomMounter: DOM reconciliation, row state synchronization, and clean injection
 */
export class AnimatedIconService {
    private readonly plugin: IColorfulFoldersPlugin;
    private readonly classifier: AnimationClassifier;
    private readonly templateFactory: AnimationTemplateFactory;
    private readonly viewportManager: AnimationViewportManager;
    private readonly playbackEngine: AnimationPlaybackEngine;
    private readonly domMounter: AnimationDomMounter;

    private _registeredAnimatedTargets = new Map<string, RegisteredAnimatedTarget>();
    private _hasAnimatedCache: boolean | null = null;
    private _libraryHasAnimatedCache: boolean | null = null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.classifier = new AnimationClassifier();
        this.templateFactory = new AnimationTemplateFactory();
        this.viewportManager = new AnimationViewportManager(
            this.classifier,
            this.templateFactory,
            () => this.plugin.getOpenDocuments(),
            () => this.getAllNavContainers()
        );
        this.playbackEngine = new AnimationPlaybackEngine(this.classifier, this.templateFactory);
        this.domMounter = new AnimationDomMounter(this.templateFactory, this.viewportManager);
    }

    /**
     * Checks whether an icon SVG contains SMIL animation elements or CSS keyframes.
     */
    public isAnimatedIcon(iconId: string): boolean {
        if (!iconId) return false;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        return this.classifier.isAnimatedIcon(iconId, raw);
    }

    /**
     * Checks whether an icon SVG relies on SMIL animations (<animate>, <animateTransform>, etc.).
     */
    public isSmilAnimated(iconId: string): boolean {
        if (!iconId) return false;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        return this.classifier.isSmilAnimated(iconId, raw);
    }

    /**
     * Checks whether an animated icon loops continuously.
     */
    public isLoopingAnimatedIcon(iconId: string): boolean {
        if (!iconId) return false;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        return this.classifier.isLoopingAnimatedIcon(iconId, raw);
    }

    /**
     * Returns a sanitized, pre-compiled template element for an animated icon.
     */
    public getAnimatedIconElement(iconId: string): HTMLElement | null {
        if (!iconId || !this.isAnimatedIcon(iconId)) return null;
        const raw = this.plugin.iconManager?.getRawIconSvg(iconId);
        if (!raw) return null;
        const isLooping = this.isLoopingAnimatedIcon(iconId);
        return this.templateFactory.getTemplate(iconId, raw, isLooping);
    }

    /**
     * Wakes or restarts SMIL animations when scrolled back into the visible viewport.
     */
    public wakeAnimatedElement(el: HTMLElement): void {
        this.viewportManager.wakeElement(el);
    }

    /**
     * Triggers playback on an icon element.
     */
    public triggerIconAnimation(iconEl: HTMLElement): void {
        this.replayAnimatedElement(iconEl);
    }

    /**
     * Replays single-shot animated icons upon user interaction.
     */
    public replayAnimatedElement(el: HTMLElement): void {
        const iconId = el.getAttribute('data-icon-id');
        const raw = iconId ? this.plugin.iconManager?.getRawIconSvg(iconId) : undefined;
        this.playbackEngine.replayElement(el, raw);
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
     * Delegated click event listener attached to the global document.
     */
    public handleDelegatedClick = (evt: MouseEvent): void => {
        this.playbackEngine.handleDelegatedClick(evt, this.hasAnyAnimatedIcons());
    };

    /**
     * Registers an animated target from StyleGenerator.
     */
    public registerActiveAnimatedTarget(path: string, iconId: string, state: AnimationPlaybackState = 'both'): void {
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
     * Clears all registered target configurations.
     */
    public clearRegisteredAnimatedTargets(): void {
        this._registeredAnimatedTargets.clear();
    }

    /**
     * Fast O(1) check if any animated icons are currently configured or in active use.
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
                if ((style.iconId && this.isAnimatedIcon(style.iconId)) ||
                    (style.expandedIconId && this.isAnimatedIcon(style.expandedIconId)) ||
                    (style.activeIconId && this.isAnimatedIcon(style.activeIconId))) {
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
     * Checks whether any animated icons exist in the custom icon repository or settings.
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
     * Reconciles animated icon elements across all visible file explorer views.
     */
    public syncAnimatedIcons(): void {
        if (!this.hasAnyAnimatedIcons()) return;

        const customFolderColors = this.plugin.settings?.customFolderColors || {};
        const customIcons = this.plugin.settings?.customIcons || {};
        const animatedTargetsMap = new Map<string, RegisteredAnimatedTarget>();

        // Fast path: use already registered targets from StyleGenerator
        if (this._registeredAnimatedTargets.size > 0) {
            for (const [p, registered] of this._registeredAnimatedTargets.entries()) {
                animatedTargetsMap.set(p, { ...registered });
            }
        } else {
            // Fallback path: pre-render scan if no targets registered yet
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

        const containers = this.getAllNavContainers();
        this.domMounter.reconcile(
            containers,
            animatedTargetsMap,
            customFolderColors,
            customIcons,
            (id: string) => this.plugin.iconManager?.getRawIconSvg(id) || ''
        );
    }

    /**
     * Synchronizes animation settings (e.g. speed factor) to CSS custom properties.
     */
    public syncSettings(): void {
        const speed = this.plugin.settings?.animationSpeed ?? 1;
        this.viewportManager.syncSpeed(speed);
    }

    /**
     * Removes all live animated icon DOM elements.
     */
    public clearAllLiveAnimatedIconsFromDom(): void {
        const containers = this.getAllNavContainers();
        this.domMounter.cleanAllLiveIcons(containers);
    }

    /**
     * Retrieves all native file explorer containers, plus Notebook Navigator containers if enabled.
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
     * Invalidates cached templates and animation flags when custom icons or styles change.
     */
    public invalidateCache(iconId?: string): void {
        this._hasAnimatedCache = null;
        this._libraryHasAnimatedCache = null;
        this.classifier.clearCache(iconId);
        this.templateFactory.clearCache(iconId);
    }

    /**
     * Clean teardown when plugin is disabled or unloaded.
     */
    public destroy(): void {
        this.viewportManager.destroy();
        this.clearAllLiveAnimatedIconsFromDom();
        this._registeredAnimatedTargets.clear();
        this.invalidateCache();
    }
}
