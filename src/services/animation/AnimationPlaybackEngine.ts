import { AnimationClassifier } from './AnimationClassifier';
import { AnimationTemplateFactory } from './AnimationTemplateFactory';
import { ANIMATION_SELECTORS } from './AnimationTypes';

/**
 * Handles animation replay, delegated click events, and playback dispatching.
 * Implements clean polymorphic playback strategies across SMIL, Web Animations API, and interactive morph states.
 */
export class AnimationPlaybackEngine {
    private _classifier: AnimationClassifier;
    private _templateFactory: AnimationTemplateFactory;
    private _getRawSvg: (iconId: string) => string;

    constructor(
        classifier: AnimationClassifier,
        templateFactory: AnimationTemplateFactory,
        getRawSvg?: (iconId: string) => string
    ) {
        this._classifier = classifier;
        this._templateFactory = templateFactory;
        this._getRawSvg = getRawSvg || (() => '');
    }

    /**
     * Replays animated icons upon click or programmatic activation.
     * Throttles rapid clicks, resets SMIL time containers, and executes vector animations cleanly.
     */
    public replayElement(el: HTMLElement, rawSvg?: string): void {
        const iconId = el.getAttribute('data-icon-id');
        if (!iconId) return;

        const now = Date.now();
        const targetEl = el as HTMLElement & { _cfLastReplay?: number; _cfToggleState?: boolean };
        if (targetEl._cfLastReplay && (now - targetEl._cfLastReplay) < 200) {
            return; // Throttle rapid-fire multi-clicks (200ms)
        }
        targetEl._cfLastReplay = now;

        const raw = rawSvg || this._getRawSvg(iconId);
        const isLooping = this._classifier.isLoopingAnimatedIcon(iconId, raw);

        // Strategy 1: Dual-state morphs with .click triggers
        const animElements = el.querySelectorAll<SVGAnimationElement>('animate, animateTransform, animateMotion, set');
        if (animElements.length > 0) {
            let hasClickTrigger = false;
            for (let i = 0; i < animElements.length; i++) {
                const b = animElements[i].getAttribute('begin') || '';
                if (b.includes('.click')) {
                    hasClickTrigger = true;
                    break;
                }
            }

            if (hasClickTrigger) {
                const isStateA = !targetEl._cfToggleState;
                targetEl._cfToggleState = isStateA;
                const targetSuffix = isStateA ? '_a.click' : '_b.click';

                let triggered = 0;
                for (let i = 0; i < animElements.length; i++) {
                    const anim = animElements[i];
                    const b = anim.getAttribute('begin') || '';
                    if (b.includes(targetSuffix) || (!b.includes('_a.click') && !b.includes('_b.click') && b.includes('.click'))) {
                        try {
                            anim.beginElement();
                            triggered++;
                        } catch {
                            void 0;
                        }
                    }
                }
                if (triggered > 0) return;
            }
        }

        // Strategy 2: SMIL animations (line-md, generative, meteocons, etc.)
        if (this._classifier.isSmilAnimated(iconId, raw)) {
            const template = this._templateFactory.getTemplate(iconId, raw, isLooping);
            if (template) {
                const freshSvg = (template.querySelector('svg')?.cloneNode(true) || null) as SVGElement | null;
                const oldSvg = el.querySelector('svg');
                if (freshSvg && oldSvg) {
                    el.replaceChild(freshSvg, oldSvg);
                    try {
                        (freshSvg as unknown as { unpauseAnimations?: () => void }).unpauseAnimations?.();
                        (freshSvg as unknown as { setCurrentTime?: (t: number) => void }).setCurrentTime?.(0);
                    } catch {
                        void 0;
                    }
                    // Trigger beginElement on initial animations (begin="0s" or no begin delay)
                    const freshAnims = freshSvg.querySelectorAll<SVGAnimationElement>('animate, animateTransform, animateMotion, set');
                    for (let i = 0; i < freshAnims.length; i++) {
                        const b = freshAnims[i].getAttribute('begin') || '0s';
                        if (b === '0s' || b.startsWith('0s;') || !freshAnims[i].hasAttribute('begin')) {
                            try {
                                freshAnims[i].beginElement();
                            } catch {
                                void 0;
                            }
                        }
                    }
                    return;
                }
            }
        }

        // Strategy 3: Web Animations API / CSS keyframe animations (e.g. useanimations)
        const svg = el.querySelector('svg');
        if (svg && typeof svg.getAnimations === 'function') {
            const animations = svg.getAnimations({ subtree: true });
            for (let i = 0; i < animations.length; i++) {
                try {
                    animations[i].currentTime = 0;
                    animations[i].play();
                } catch {
                    void 0;
                }
            }
        }
    }

    /**
     * Resolves the target icon element from a delegated click event on the file explorer.
     */
    public handleDelegatedClick(evt: MouseEvent, hasActiveIcons: boolean): void {
        if (!hasActiveIcons) return;
        const target = evt.target as Element | null;
        let iconEl: HTMLElement | null = target?.closest<HTMLElement>(ANIMATION_SELECTORS.ANY_ANIMATED_ICON) || null;
        const row = target?.closest<HTMLElement>(ANIMATION_SELECTORS.NAV_ROW) || null;

        if (!iconEl && row) {
            const folder = row.closest('.nav-folder');
            const isCollapsed = folder ? folder.classList.contains('is-collapsed') : false;
            if (isCollapsed) {
                iconEl = row.querySelector<HTMLElement>(ANIMATION_SELECTORS.CLOSED_LIVE_ICON);
            } else {
                iconEl = row.querySelector<HTMLElement>(ANIMATION_SELECTORS.OPEN_LIVE_ICON);
            }
            if (!iconEl) {
                iconEl = row.querySelector<HTMLElement>(ANIMATION_SELECTORS.LIVE_ICON);
            }
        }

        if (iconEl) {
            this.replayElement(iconEl);
        }

        // If a folder row was clicked, also schedule a replay check after Obsidian toggles the folder state
        const navFolder = row?.closest('.nav-folder');
        if (navFolder) {
            window.setTimeout(() => {
                const nowCollapsed = navFolder.classList.contains('is-collapsed');
                const nextIcon = nowCollapsed
                    ? row?.querySelector<HTMLElement>(ANIMATION_SELECTORS.CLOSED_LIVE_ICON)
                    : row?.querySelector<HTMLElement>(ANIMATION_SELECTORS.OPEN_LIVE_ICON);
                if (nextIcon) {
                    this.replayElement(nextIcon);
                }
            }, 30);
        }
    }
}
