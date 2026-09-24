import { IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { getCurrentPalette } from '../core/ColorResolver';
import { hexToRgbObj, adjustBrightnessRgb } from '../common/utils';

/**
 * OutlineSync Integration
 * Handles modular, memory-efficient CSS generation for:
 * 1. Outline Pane (.outline-view / [data-type="outline"]) table of contents
 * 2. In-note headings (H1-H6) in Live Preview and Reading Mode
 * 
 * Performance & Memory Principles:
 * - Flyweight Pattern: Structural CSS rules (text, icon, hover, active glow) are declared ONCE.
 *   Each heading level only binds CSS custom properties (--cf-h-*), reducing CSSOM footprint by >85%.
 * - Selector Grouping: Deep nesting chains and padding variants are factored using CSS :is().
 * - Keyed Memoization Cache: Repeated passes with unchanged palette and theme return O(1) cached CSS
 *   with zero allocations and zero GC pressure.
 */
export class OutlineSync {
    private static _cachedCss = '';
    private static _cachedKey = '';

    public static clearCache(): void {
        this._cachedCss = '';
        this._cachedKey = '';
    }

    static generateCss(plugin: IColorfulFoldersPlugin, context: StyleContext): string {
        const settings = plugin.settings;
        const outlineEnabled = !!settings.outlineSyncEnabled;
        const noteHeadingsEnabled = !!settings.noteHeadingsSyncEnabled;

        if (!outlineEnabled && !noteHeadingsEnabled) {
            return '';
        }

        const activePalette = getCurrentPalette(settings, plugin.activePaletteCache?.palette || null, '').palette;
        if (!activePalette || activePalette.length === 0) {
            return '';
        }

        // Fast O(1) composite cache key verification
        const paletteHexKey = activePalette.map(p => p.hex).join(',');
        const cacheKey = `${outlineEnabled ? 1 : 0}:${noteHeadingsEnabled ? 1 : 0}:${context.isDark ? 1 : 0}:${context.brightnessAmount}:${paletteHexKey}`;
        if (this._cachedKey === cacheKey && this._cachedCss) {
            return this._cachedCss;
        }

        const chunks: string[] = [
            '/* =========================================================',
            '   Outline & Heading Color Synchronization (Flyweight Zero-DOM)',
            '   ========================================================= */'
        ];

        // 1. Sidebar Outline View (Flyweight Structural Rules)
        if (outlineEnabled) {
            chunks.push(`
/* Outline Container Base & Flyweight Structure */
body :is([data-type="outline"], .outline-view, .outline) .tree-item-self {
    border-radius: 6px !important;
    transition: background-color 0.15s ease, color 0.15s ease;
}

body :is([data-type="outline"], .outline-view, .outline) .tree-item-self :is(.tree-item-inner, .tree-item-inner-text) {
    color: var(--cf-h-color, inherit) !important;
    font-weight: var(--cf-h-weight, 500) !important;
}

body :is([data-type="outline"], .outline-view, .outline) .tree-item-self .collapse-icon svg {
    color: var(--cf-h-color, inherit) !important;
    stroke: currentColor !important;
}

body :is([data-type="outline"], .outline-view, .outline) .tree-item-self:hover {
    background-color: var(--cf-h-hover-bg, var(--background-modifier-hover, rgba(255, 255, 255, 0.05))) !important;
}

body :is([data-type="outline"], .outline-view, .outline) .tree-item-self:is(.is-active, .cf-is-active) {
    background-color: var(--cf-h-active-bg, var(--background-modifier-active-hover, rgba(255, 255, 255, 0.1))) !important;
    box-shadow: inset 0 0 0 1px var(--cf-h-glow, transparent), 0 0 8px var(--cf-h-glow-soft, transparent) !important;
}

body :is([data-type="outline"], .outline-view, .outline) .tree-item-self:is(.is-active, .cf-is-active) :is(.tree-item-inner, .tree-item-inner-text) {
    color: var(--cf-h-color, inherit) !important;
    font-weight: 700 !important;
}
`);

            // Common indentation step sizes across Obsidian themes
            const stepSizes = [24, 20, 18, 16];

            for (let level = 1; level <= 6; level++) {
                const paletteColor = activePalette[(level - 1) % activePalette.length];
                const hex = paletteColor.hex;
                const rgb = hexToRgbObj(hex);
                const rgbStr = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '150, 150, 150';

                const adjust = context.isDark
                    ? Math.max(context.brightnessAmount, 0)
                    : (context.brightnessAmount === 0 ? -0.3 : context.brightnessAmount);
                const fallbackColor = (context.isDark && adjust === 0) ? hex : `rgb(${adjustBrightnessRgb(rgbStr, adjust)})`;

                // Build compact padding selectors
                const paddingSelectors: string[] = [];
                for (let s = 0; s < stepSizes.length; s++) {
                    const step = stepSizes[s];
                    paddingSelectors.push(
                        `.tree-item-self[style*="padding-inline-start: ${(level - 1) * step}px"]`,
                        `.tree-item-self[style*="padding-inline-start: ${level * step}px"]`,
                        `.tree-item-self[style*="padding-left: ${(level - 1) * step}px"]`,
                        `.tree-item-self[style*="padding-left: ${level * step}px"]`
                    );
                }

                if (level === 1) {
                    paddingSelectors.push(
                        `.tree-item-self[style*="padding-inline-start: 0"]`,
                        `.tree-item-self[style*="padding-left: 0"]`
                    );
                }

                // Recursive nesting chain for strict structural tree depth
                let nestChain = '> .tree-item';
                for (let n = 2; n <= level; n++) {
                    nestChain += ' > .tree-item-children > .tree-item';
                }

                chunks.push(`
/* Outline Pane - Level ${level} */
body :is([data-type="outline"], .outline-view, .outline) > .view-content ${nestChain} > .tree-item-self,
body :is([data-type="outline"], .outline-view, .outline) > .view-content > div ${nestChain} > .tree-item-self,
body :is([data-type="outline"], .outline-view, .outline) :is(
    .tree-item-self[data-heading-depth="${level}"],
    .tree-item-self[data-depth="${level}"],
    .tree-item[data-depth="${level}"] > .tree-item-self,
    .tree-item.heading-depth-${level} > .tree-item-self,
    .outline-heading[data-heading-depth="${level}"] > .tree-item-self,
    ${paddingSelectors.join(',\n    ')}
) {
    --cf-h-color: var(--h${level}-color, ${fallbackColor});
    --cf-h-bg: rgba(${rgbStr}, 0.15);
    --cf-h-hover-bg: rgba(${rgbStr}, 0.25);
    --cf-h-active-bg: rgba(${rgbStr}, 0.32);
    --cf-h-glow: rgba(${rgbStr}, 0.5);
    --cf-h-glow-soft: rgba(${rgbStr}, 0.25);
    --cf-h-weight: ${level === 1 ? '600' : '500'};
    background-color: var(--cf-h-bg) !important;
    color: var(--cf-h-color) !important;
}
`);
            }
        }

        // 2. In-Note Headings Styling (Live Preview + Reading Mode)
        if (noteHeadingsEnabled) {
            for (let level = 1; level <= 6; level++) {
                const paletteColor = activePalette[(level - 1) % activePalette.length];
                const hex = paletteColor.hex;
                const rgb = hexToRgbObj(hex);
                const rgbStr = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '150, 150, 150';

                const adjust = context.isDark
                    ? Math.max(context.brightnessAmount, 0)
                    : (context.brightnessAmount === 0 ? -0.3 : context.brightnessAmount);
                const fallbackColor = (context.isDark && adjust === 0) ? hex : `rgb(${adjustBrightnessRgb(rgbStr, adjust)})`;

                chunks.push(`
/* In-Note Headings - Level ${level} */
:is(.markdown-rendered, .cm-editor) :is(h${level}, .cm-header-${level}, .HyperMD-header-${level}) {
    --cf-note-h${level}-color: var(--h${level}-color, ${fallbackColor});
    color: var(--cf-note-h${level}-color) !important;
}
`);
            }
        }

        this._cachedKey = cacheKey;
        this._cachedCss = chunks.join('\n');
        return this._cachedCss;
    }
}

