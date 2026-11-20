import { AnimationClassifier } from './AnimationClassifier';
import { AnimationTemplateFactory } from './AnimationTemplateFactory';
import { ANIMATION_SELECTORS } from './AnimationTypes';

/**
 * Manages IntersectionObserver viewport culling and document visibility listeners.
 * Pauses off-screen animations to maintain 0% idle CPU and wakes/recovers SMIL syncbases when scrolled back into view.
 */
export class AnimationViewportManager {
    private _intersectionObserver: IntersectionObserver | null = null;
    private _observed = new WeakSet<HTMLElement>();
    private _classifier: AnimationClassifier;
    private _templateFactory: AnimationTemplateFactory;
    private _onVisibilityChangeHandler = (): void => {
        this.handleVisibilityChange();
    };
    private _getOpenDocuments: () => Document[];
    private _getAllContainers: () => HTMLElement[];
    private _getRawSvg: (iconId: string) => string;

    constructor(
        classifier: AnimationClassifier,
        templateFactory: AnimationTemplateFactory,
        getOpenDocuments: () => Document[],
        getAllContainers: () => HTMLElement[],
        getRawSvg?: (iconId: string) => string
    ) {
        this._classifier = classifier;
        this._templateFactory = templateFactory;
        this._getOpenDocuments = getOpenDocuments;
        this._getAllContainers = getAllContainers;
        this._getRawSvg = getRawSvg || (() => '');

        if (typeof IntersectionObserver !== 'undefined') {
            this._intersectionObserver = new IntersectionObserver((entries) => {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry.target && entry.target.instanceOf(HTMLElement)) {
                        const targetEl = entry.target as HTMLElement & { _cfWasOffscreen?: boolean };
                        if (entry.isIntersecting) {
                            targetEl.setAttribute('data-cf-visible', 'true');
                            const iconId = targetEl.getAttribute('data-icon-id');
                            if (targetEl._cfWasOffscreen) {
                                targetEl._cfWasOffscreen = false;
                                if (iconId && this._classifier.isLoopingAnimatedIcon(iconId, this._getRawSvg(iconId))) {
                                    this.wakeElement(targetEl);
                                }
                            }
                            const svg = targetEl.querySelector('svg') as unknown as { unpauseAnimations?: () => void };
                            if (svg && typeof svg.unpauseAnimations === 'function') {
                                try { svg.unpauseAnimations(); } catch { void 0; }
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

        this.registerVisibilityListeners();
    }

    private registerVisibilityListeners(): void {
        try {
            const docs = this._getOpenDocuments();
            for (let i = 0; i < docs.length; i++) {
                docs[i].addEventListener('visibilitychange', this._onVisibilityChangeHandler);
            }
        } catch {
            void 0;
        }
    }

    public handleVisibilityChange(): void {
        const docs = this._getOpenDocuments();
        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const isDocHidden = doc.hidden;
            doc.documentElement?.setCssProps({ '--cf-icon-play-state': isDocHidden ? 'paused' : 'running' });
        }

        const allContainers = this._getAllContainers();
        for (let i = 0; i < allContainers.length; i++) {
            const container = allContainers[i];
            const doc = container.ownerDocument;
            const isDocHidden = doc ? doc.hidden : false;
            const icons = container.querySelectorAll<HTMLElement>(ANIMATION_SELECTORS.ANY_ANIMATED_ICON);
            for (let j = 0; j < icons.length; j++) {
                const icon = icons[j];
                const svg = icon.querySelector('svg') as unknown as { pauseAnimations?: () => void; unpauseAnimations?: () => void };
                if (svg) {
                    if (isDocHidden && typeof svg.pauseAnimations === 'function') {
                        try { svg.pauseAnimations(); } catch { void 0; }
                    } else if (!isDocHidden && typeof svg.unpauseAnimations === 'function') {
                        if (icon.getAttribute('data-cf-visible') === 'true') {
                            try { svg.unpauseAnimations(); } catch { void 0; }
                        }
                    }
                }
            }
        }
    }

    public syncSpeed(speed: number): void {
        const docs = this._getOpenDocuments();
        for (let i = 0; i < docs.length; i++) {
            docs[i].documentElement?.setCssProps({ '--cf-icon-speed-scale': String(speed) });
        }
    }

    public observe(el: HTMLElement): void {
        if (!this._intersectionObserver || this._observed.has(el)) return;
        this._observed.add(el);
        this._intersectionObserver.observe(el);
    }

    public unobserve(el: HTMLElement): void {
        if (!this._intersectionObserver) return;
        this._observed.delete(el);
        this._intersectionObserver.unobserve(el);
    }

    /**
     * Recovers broken SMIL syncbases when an element scrolls into view by replacing
     * the stalled SVG with a freshly cloned template SVG node (AGENTS.md recovery rule).
     */
    public wakeElement(el: HTMLElement): void {
        const iconId = el.getAttribute('data-icon-id');
        const rawSvg = iconId ? this._getRawSvg(iconId) : '';
        if (!iconId || !this._classifier.isSmilAnimated(iconId, rawSvg)) return;

        const template = this._templateFactory.getTemplate(iconId, rawSvg, true);
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

    public destroy(): void {
        try {
            const docs = this._getOpenDocuments();
            for (let i = 0; i < docs.length; i++) {
                docs[i].removeEventListener('visibilitychange', this._onVisibilityChangeHandler);
            }
        } catch {
            void 0;
        }

        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
            this._intersectionObserver = null;
        }
    }
}
