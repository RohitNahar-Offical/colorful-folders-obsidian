import { LRUCache } from '../../common/LRUCache';
import { ANIMATED_PACK_PREFIXES } from './AnimationTypes';

/**
 * Handles fast, cached classification of icon animations (SMIL, Web Animations, Keyframes, and Looping behavior).
 * Adheres to the Single Responsibility Principle and encapsulates all regular expressions and prefix heuristics.
 * Uses bounded LRU caches to prevent unbounded memory retention across long sessions in large vaults.
 */
export class AnimationClassifier {
    private _isAnimatedIconCache = new LRUCache<string, boolean>(1024);
    private _isLoopingIconCache = new LRUCache<string, boolean>(1024);
    private _isSmilCache = new LRUCache<string, boolean>(1024);

    /**
     * Checks whether an icon ID belongs to an animated icon pack via fast O(1) prefix matching.
     */
    public hasAnimatedPrefix(iconId: string): boolean {
        if (!iconId) return false;
        for (let i = 0; i < ANIMATED_PACK_PREFIXES.length; i++) {
            if (iconId.startsWith(ANIMATED_PACK_PREFIXES[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks whether an icon SVG contains SMIL animation elements or CSS keyframes.
     */
    public isAnimatedIcon(iconId: string, rawSvg?: string): boolean {
        if (!iconId) return false;
        if (this.hasAnimatedPrefix(iconId)) {
            return true;
        }

        const cached = this._isAnimatedIconCache.get(iconId);
        if (cached !== undefined) return cached;

        // Never poison cache with false if rawSvg hasn't been loaded yet
        if (!rawSvg) return false;

        const isAnim = /<animate|<animateTransform|<animateMotion|<set|@keyframes|animation:\s*/i.test(rawSvg);
        this._isAnimatedIconCache.set(iconId, isAnim);
        return isAnim;
    }

    /**
     * Checks whether an icon SVG relies on SMIL animations (<animate>, <animateTransform>, <animateMotion>, <set>).
     */
    public isSmilAnimated(iconId: string, rawSvg?: string): boolean {
        if (!iconId) return false;
        const cached = this._isSmilCache.get(iconId);
        if (cached !== undefined) return cached;

        // Never poison cache with false if rawSvg hasn't been loaded yet
        if (!rawSvg) return false;

        const isSmil = /<animate|<animateTransform|<animateMotion|<set/i.test(rawSvg);
        this._isSmilCache.set(iconId, isSmil);
        return isSmil;
    }

    /**
     * Checks whether an animated icon loops continuously:
     * - Known always-looping packs: generative-* (all native loops/ping-pong), meteocons-*
     * - Name hints: -loop or _loop suffix
     * - W3C SMIL attributes: repeatCount="indefinite", repeatDur="indefinite", or CSS infinite
     * - Chained syncbase ping-pong loops: .end+ or cf_l[ab]_
     */
    public isLoopingAnimatedIcon(iconId: string, rawSvg?: string): boolean {
        if (!iconId) return false;
        const lower = iconId.toLowerCase();

        // Fast-path known looping packs and loop suffixes
        if (lower.startsWith('generative-') || lower.startsWith('generative:') || lower.startsWith('generative_') ||
            lower.startsWith('meteocons-') || lower.startsWith('meteocons:') || lower.startsWith('meteocons_') ||
            lower.includes('-loop') || lower.endsWith('_loop')) {
            return true;
        }

        const cached = this._isLoopingIconCache.get(iconId);
        if (cached !== undefined) return cached;

        // Never poison cache with false if rawSvg hasn't been loaded yet
        if (!rawSvg) return false;

        const isLoop = /repeatCount=["']indefinite["']|repeatDur=["']indefinite["']|\binfinite\b|\.end\+|cf_l[ab]_/i.test(rawSvg);
        this._isLoopingIconCache.set(iconId, isLoop);
        return isLoop;
    }

    /**
     * Invalidates classification caches (either for a specific icon or globally).
     */
    public clearCache(iconId?: string): void {
        if (iconId) {
            this._isAnimatedIconCache.delete(iconId);
            this._isLoopingIconCache.delete(iconId);
            this._isSmilCache.delete(iconId);
        } else {
            this._isAnimatedIconCache.clear();
            this._isLoopingIconCache.clear();
            this._isSmilCache.clear();
        }
    }
}
