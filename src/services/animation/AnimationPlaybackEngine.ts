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

    constructor(classifier: AnimationClassifier, templateFactory: AnimationTemplateFactory) {
        this._classifier = classifier;
        this._templateFactory = templateFactory;
    }

    /**
     * Replays single-shot (non-looping) animated icons upon click or programmatic activation.
     * Throttles rapid clicks, bypasses continuous loops, and executes the vector animation with zero DOM reflow.
     */
    public replayElement(el: HTMLElement, rawSvg?: string): void {
        const iconId = el.getAttribute('data-icon-id');
        if (!iconId) return;
        if (this._classifier.isLoopingAnimatedIcon(iconId, rawSvg)) return; // Continuous loops keep playing as normal

        const now = Date.now();
        const targetEl = el as HTMLElement & { _cfLastReplay?: number; _cfToggleState?: boolean };
        if (targetEl._cfLastReplay && (now - targetEl._cfLastReplay) < 250) {
            return; // Throttle rapid-fire double clicks
        }
        targetEl._cfLastReplay = now;

        // Strategy 1: Interactive toggle SMIL animations (dual-state morphs with .click triggers)
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

        // Strategy 2: Standard SMIL animations (line-md, meteocons, etc.)
        if (this._classifier.isSmilAnimated(iconId, rawSvg)) {
            const template = this._templateFactory.getTemplate(iconId, rawSvg || '', false);
            if (!template) return;

            const freshSvg = (template.querySelector('svg')?.cloneNode(true) || null) as SVGElement | null;
            if (!freshSvg) return;

            const oldSvg = el.querySelector('svg');
            if (oldSvg) {
                el.replaceChild(freshSvg, oldSvg);
            } else {
                el.appendChild(freshSvg);
            }

            // Immediately trigger animations on the fresh SVG
            const freshAnims = freshSvg.querySelectorAll<SVGAnimationElement>('animate, animateTransform, animateMotion, set');
            for (let i = 0; i < freshAnims.length; i++) {
                try {
                    freshAnims[i].beginElement();
                } catch {
                    void 0;
                }
            }
            return;
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
        const target = (evt.target as Element | null)?.closest<HTMLElement>(ANIMATION_SELECTORS.ANY_ANIMATED_ICON);
        let iconEl: HTMLElement | null = target;

        if (!iconEl) {
            const row = (evt.target as Element | null)?.closest<HTMLElement>(ANIMATION_SELECTORS.NAV_ROW);
            if (row) {
                const isCollapsed = row.closest('.is-collapsed') !== null;
                if (isCollapsed) {
                    iconEl = row.querySelector<HTMLElement>(ANIMATION_SELECTORS.CLOSED_LIVE_ICON);
                } else {
                    iconEl = row.querySelector<HTMLElement>(ANIMATION_SELECTORS.OPEN_LIVE_ICON);
                }
            }
        }

        if (!iconEl) return;
        this.replayElement(iconEl);
    }
}
