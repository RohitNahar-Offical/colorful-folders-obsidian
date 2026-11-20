import { safeEscape } from '../../common/utils';
import { AnimationTemplateFactory } from './AnimationTemplateFactory';
import { AnimationViewportManager } from './AnimationViewportManager';
import { ANIMATION_SELECTORS, RegisteredAnimatedTarget } from './AnimationTypes';

/**
 * Handles DOM mounting, reconciliation, and cleanup of live animated icons.
 * Reconciles the in-memory animated target map against active DOM nodes in native Explorer and Notebook Navigator.
 * Strictly adheres to DRY principles by consolidating node synthesis and property injection into unified helpers.
 */
export class AnimationDomMounter {
    private _templateFactory: AnimationTemplateFactory;
    private _viewportManager: AnimationViewportManager;

    constructor(templateFactory: AnimationTemplateFactory, viewportManager: AnimationViewportManager) {
        this._templateFactory = templateFactory;
        this._viewportManager = viewportManager;
    }

    /**
     * Completely removes all live animated icon DOM elements and resets row classes across all containers.
     */
    public cleanAllLiveIcons(containers: HTMLElement[]): void {
        for (let i = 0; i < containers.length; i++) {
            const liveIcons = containers[i].querySelectorAll<HTMLElement>(ANIMATION_SELECTORS.LIVE_ICON);
            for (let j = 0; j < liveIcons.length; j++) {
                const liveIcon = liveIcons[j];
                const rowEl = liveIcon.closest<HTMLElement>(ANIMATION_SELECTORS.NAV_ROW);
                rowEl?.classList.remove('cf-animated-icon-active', 'cf-has-animated-closed', 'cf-has-animated-open');
                this._viewportManager.unobserve(liveIcon);
                liveIcon.remove();
            }
        }
    }

    /**
     * Reconciles animated icon targets across all visible navigation containers.
     */
    public reconcile(
        containers: HTMLElement[],
        animatedTargetsMap: Map<string, RegisteredAnimatedTarget>,
        customFolderColors: Record<string, unknown>,
        customIcons: Record<string, unknown>,
        getRawSvg: (iconId: string) => string
    ): void {
        if (containers.length === 0 || animatedTargetsMap.size === 0) return;

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];

            // 1. Clean up stale live icons that no longer match animatedTargetsMap
            this.pruneStaleIcons(container, animatedTargetsMap);

            // 2. Mount or update active animated icons for each target
            this.mountActiveTargets(container, animatedTargetsMap, customFolderColors, customIcons, getRawSvg);
        }
    }

    private pruneStaleIcons(container: HTMLElement, targetsMap: Map<string, RegisteredAnimatedTarget>): void {
        const existingLiveIcons = container.querySelectorAll<HTMLElement>(ANIMATION_SELECTORS.LIVE_ICON);
        for (let j = 0; j < existingLiveIcons.length; j++) {
            const liveIcon = existingLiveIcons[j];
            const rowEl = liveIcon.closest<HTMLElement>(ANIMATION_SELECTORS.NAV_ROW);
            const rowPath = rowEl?.getAttribute('data-path');
            const targetConfig = rowPath ? targetsMap.get(rowPath) : undefined;

            if (!rowPath || !targetConfig) {
                rowEl?.classList.remove('cf-animated-icon-active', 'cf-has-animated-closed', 'cf-has-animated-open');
                this._viewportManager.unobserve(liveIcon);
                liveIcon.remove();
                continue;
            }

            const state = liveIcon.getAttribute('data-state');
            const iconId = liveIcon.getAttribute('data-icon-id');
            const expectedIconId = state === 'open' ? targetConfig.openIconId : (state === 'closed' ? targetConfig.closedIconId : targetConfig.iconId);

            if (!expectedIconId || iconId !== expectedIconId) {
                this._viewportManager.unobserve(liveIcon);
                liveIcon.remove();
            }
        }
    }

    private mountActiveTargets(
        container: HTMLElement,
        targetsMap: Map<string, RegisteredAnimatedTarget>,
        customFolderColors: Record<string, unknown>,
        customIcons: Record<string, unknown>,
        getRawSvg: (iconId: string) => string
    ): void {
        for (const [targetPath, targetConfig] of targetsMap.entries()) {
            const safePath = safeEscape(targetPath);
            const titleEl = container.querySelector<HTMLElement>(
                `.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"], .tree-item-self[data-path="${safePath}"], .nn-navitem[data-path="${safePath}"], .nn-file[data-path="${safePath}"]`
            );
            if (!titleEl) continue;

            const textEl = titleEl.querySelector<HTMLElement>(ANIMATION_SELECTORS.NAV_TEXT);
            if (!textEl) continue;

            const styleObj = customFolderColors[targetPath] || customIcons[targetPath];
            const customIconColor = (typeof styleObj === 'object' && styleObj !== null) ? (styleObj as { iconColor?: string }).iconColor : undefined;

            // Notebook Navigator dedicated icon container slot
            const nnIconSlot = titleEl.querySelector<HTMLElement>(ANIMATION_SELECTORS.NN_ICON_SLOT);

            // Synchronize row classes for CSS ::before static icon suppression
            this.syncRowStateClasses(titleEl, targetConfig);

            // DRY Mounting: single unified helper replacing duplicate code
            if (targetConfig.iconId) {
                this.mountOrUpdateLiveIcon(titleEl, textEl, nnIconSlot, targetConfig.iconId, null, 'both', customIconColor, getRawSvg);
            } else {
                if (targetConfig.closedIconId) {
                    this.mountOrUpdateLiveIcon(titleEl, textEl, nnIconSlot, targetConfig.closedIconId, 'cf-animated-closed', 'closed', customIconColor, getRawSvg);
                }
                if (targetConfig.openIconId) {
                    this.mountOrUpdateLiveIcon(titleEl, textEl, nnIconSlot, targetConfig.openIconId, 'cf-animated-open', 'open', customIconColor, getRawSvg);
                }
            }
        }
    }

    private syncRowStateClasses(titleEl: HTMLElement, config: RegisteredAnimatedTarget): void {
        if (config.iconId) {
            titleEl.classList.add('cf-animated-icon-active');
            titleEl.classList.remove('cf-has-animated-closed', 'cf-has-animated-open');
        } else {
            titleEl.classList.remove('cf-animated-icon-active');
            titleEl.classList.toggle('cf-has-animated-closed', !!config.closedIconId);
            titleEl.classList.toggle('cf-has-animated-open', !!config.openIconId);
        }
    }

    /**
     * Single unified, DRY helper for creating, updating, and injecting live icon elements.
     */
    private mountOrUpdateLiveIcon(
        titleEl: HTMLElement,
        textEl: HTMLElement,
        nnIconSlot: HTMLElement | null,
        iconId: string,
        stateCls: 'cf-animated-closed' | 'cf-animated-open' | null,
        stateAttr: 'closed' | 'open' | 'both',
        customIconColor: string | undefined,
        getRawSvg: (iconId: string) => string
    ): void {
        const rawSvg = getRawSvg(iconId);
        const template = this._templateFactory.getTemplate(iconId, rawSvg, false);
        if (!template) return;

        const selector = stateCls ? `.cf-live-animated-icon.${stateCls}` : `.cf-live-animated-icon:not(.cf-animated-closed):not(.cf-animated-open)`;
        const existingIcon = titleEl.querySelector<HTMLElement>(selector);

        if (!existingIcon) {
            this.insertNewLiveIcon(titleEl, textEl, nnIconSlot, template, iconId, stateCls, stateAttr, customIconColor);
        } else if (existingIcon.getAttribute('data-icon-id') !== iconId) {
            this._viewportManager.unobserve(existingIcon);
            existingIcon.remove();
            this.insertNewLiveIcon(titleEl, textEl, nnIconSlot, template, iconId, stateCls, stateAttr, customIconColor);
        } else if (customIconColor) {
            // Update color without tearing down active animation
            existingIcon.setCssProps({ '--cf-animated-icon-color': customIconColor });
        }
    }

    private insertNewLiveIcon(
        titleEl: HTMLElement,
        textEl: HTMLElement,
        nnIconSlot: HTMLElement | null,
        template: HTMLElement,
        iconId: string,
        stateCls: 'cf-animated-closed' | 'cf-animated-open' | null,
        stateAttr: 'closed' | 'open' | 'both',
        customIconColor: string | undefined
    ): void {
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

        this._viewportManager.observe(cloned);
    }
}
