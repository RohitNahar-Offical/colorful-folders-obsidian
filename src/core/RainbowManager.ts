import { hexToRgbObj, adjustBrightnessValues, adjustBrightnessRgb } from '../common/utils';
import { LRUCache } from '../common/LRUCache';

export interface RainbowGradientOpts {
    angle?: number;
    isDark?: boolean;
    isBold?: boolean;
    isItalic?: boolean;
    extraCss?: string;
    isTransparentBg?: boolean;
    outlineOnly?: boolean;
    skipBrightnessAdjustment?: boolean;
}

export class RainbowManager {
    // Curated high-contrast 3-stop neon rainbow combinations guaranteed to show color shifts across short words
    private static CURATED_RAINBOW_COMBINATIONS = [
        ['#ff2a85', '#00f0ff', '#ffc800'], // 0: Cyberpunk Neon Pink -> Electric Cyan -> Solar Gold
        ['#00e676', '#3b82f6', '#ff3b5c'], // 1: Emerald -> Electric Sapphire -> Neon Coral
        ['#a855f7', '#ff3b5c', '#00f0ff'], // 2: Neon Purple -> Vivid Coral -> Electric Cyan
        ['#00f0ff', '#ffc800', '#ff2a85'], // 3: Electric Cyan -> Solar Gold -> Neon Pink
        ['#ff3b5c', '#ff2a85', '#00e676'], // 4: Neon Coral -> Vivid Magenta -> Emerald
        ['#3b82f6', '#00e676', '#ff2a85']  // 5: Sapphire -> Emerald -> Neon Pink
    ];

    private static gradientCssCache = new LRUCache<string, string>(1024);

    /**
     * Clears the memoized gradient CSS cache.
     */
    public static clearCache(): void {
        RainbowManager.gradientCssCache.clear();
    }

    /**
     * Builds a contrast-boosted, theme-aware CSS linear-gradient string for text gradients.
     */
    public static buildGradientCss(
        colors: string[],
        opts: RainbowGradientOpts = {}
    ): string {
        if (!colors || colors.length === 0) {
            colors = ['#ff2a85', '#00f0ff', '#ffc800'];
        }

        const angle = opts.angle ?? 90;
        const isDark = opts.isDark !== false;
        const isBold = opts.isBold !== false;
        const isItalic = opts.isItalic ?? false;
        const extraCss = opts.extraCss || '';
        const isTransparentBg = opts.isTransparentBg ?? false;
        const outlineOnly = opts.outlineOnly ?? false;
        const skipBrightness = opts.skipBrightnessAdjustment ?? false;

        let colorKey = '';
        for (let i = 0; i < colors.length; i++) {
            colorKey += (i > 0 ? ',' : '') + colors[i];
        }
        const cacheKey = `${colorKey}_${angle}_${isDark ? 1 : 0}_${isBold ? 1 : 0}_${isItalic ? 1 : 0}_${isTransparentBg ? 1 : 0}_${outlineOnly ? 1 : 0}_${skipBrightness ? 1 : 0}_${extraCss}`;
        const cached = RainbowManager.gradientCssCache.get(cacheKey);
        if (cached) return cached;

        const processedColors = colors.map(c => {
            if (!c) return 'rgb(140, 140, 140)';
            const clean = c.trim();
            if (skipBrightness) return clean;
            let r = 140, g = 140, b = 140;
            let parsed = false;
            if (clean.charCodeAt(0) === 35 /* '#' */) {
                const rgb = hexToRgbObj(clean);
                if (rgb) { r = rgb.r; g = rgb.g; b = rgb.b; parsed = true; }
            } else if (clean.startsWith('rgb')) {
                const idx1 = clean.indexOf('(');
                const idx2 = clean.indexOf(')');
                if (idx1 !== -1 && idx2 !== -1) {
                    const raw = clean.substring(idx1 + 1, idx2);
                    const p1 = raw.indexOf(',');
                    const p2 = raw.indexOf(',', p1 + 1);
                    if (p1 !== -1 && p2 !== -1) {
                        r = parseInt(raw.substring(0, p1).trim(), 10);
                        g = parseInt(raw.substring(p1 + 1, p2).trim(), 10);
                        b = parseInt(raw.substring(p2 + 1).trim(), 10);
                        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) parsed = true;
                    }
                }
            } else if (clean.indexOf(',') !== -1) {
                const p1 = clean.indexOf(',');
                const p2 = clean.indexOf(',', p1 + 1);
                if (p1 !== -1 && p2 !== -1) {
                    r = parseInt(clean.substring(0, p1).trim(), 10);
                    g = parseInt(clean.substring(p1 + 1, p2).trim(), 10);
                    b = parseInt(clean.substring(p2 + 1).trim(), 10);
                    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) parsed = true;
                }
            }
            if (!parsed) return clean;

            if (isDark) {
                const maxChannel = Math.max(r, g, b);
                const effAdjust = maxChannel > 210 ? Math.max(0, 0.20 - (maxChannel - 210) * 0.004) : 0.20;
                const adj = adjustBrightnessValues(r, g, b, effAdjust);
                return `rgb(${adj.r}, ${adj.g}, ${adj.b})`;
            } else {
                const minChannel = Math.min(r, g, b);
                const effAdjust = minChannel < 60 ? Math.min(0, -0.15 + (60 - minChannel) * 0.003) : -0.15;
                const adj = adjustBrightnessValues(r, g, b, effAdjust);
                return `rgb(${adj.r}, ${adj.g}, ${adj.b})`;
            }
        });

        const stops = processedColors.length === 1 
            ? `${processedColors[0]}, ${processedColors[0]}`
            : processedColors.join(', ');

        const shadowFilter = (isTransparentBg || outlineOnly)
            ? 'filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.9)) !important;'
            : (isDark 
                ? 'filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.45)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85)) !important;'
                : 'filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15)) !important;');

        const result = `
            background-image: linear-gradient(${angle}deg, ${stops}) !important;
            background-clip: text !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            color: transparent !important;
            font-weight: ${isBold ? '800' : 'normal'} !important;
            font-style: ${isItalic ? 'italic' : 'normal'} !important;
            display: inline-flex !important;
            align-items: center !important;
            width: fit-content !important;
            max-width: 100% !important;
            flex: 0 0 auto !important;
            flex-grow: 0 !important;
            ${shadowFilter}
            ${extraCss}
        `;

        RainbowManager.gradientCssCache.set(cacheKey, result);
        return result;
    }

    /**
     * Resolves the multi-stop spectrum for root level rainbow text.
     * Uses active palette when available, or falls back to curated combinations.
     */
    public static resolveRootSpectrum(
        index: number,
        palette: { rgb: string; hex: string }[],
        _isDark: boolean
    ): string[] {
        if (palette && palette.length >= 3) {
            const start = palette[index % palette.length];
            const mid = palette[(index + 1) % palette.length];
            const end = palette[(index + 2) % palette.length];
            const startCol = start.hex || (start.rgb ? `rgb(${start.rgb})` : '#ff2a85');
            const midCol = mid.hex || (mid.rgb ? `rgb(${mid.rgb})` : '#00f0ff');
            const endCol = end.hex || (end.rgb ? `rgb(${end.rgb})` : '#ffc800');
            return [startCol, midCol, endCol];
        }
        if (palette && palette.length === 2) {
            const start = palette[index % palette.length];
            const end = palette[(index + 1) % palette.length];
            const startCol = start.hex || (start.rgb ? `rgb(${start.rgb})` : '#ff2a85');
            const endCol = end.hex || (end.rgb ? `rgb(${end.rgb})` : '#00f0ff');
            return [startCol, endCol];
        }
        if (palette && palette.length === 1) {
            const col = palette[0].hex || (palette[0].rgb ? `rgb(${palette[0].rgb})` : '#ff2a85');
            return [col, col];
        }

        const combinations = RainbowManager.CURATED_RAINBOW_COMBINATIONS;
        return combinations[index % combinations.length];
    }

    /**
     * Resolves custom gradient stops with brightness adjustment.
     */
    public static resolveCustomStops(
        startHex: string,
        endHex: string,
        rainbowBrightness: number | undefined,
        isDark: boolean
    ): string[] {
        const bVal = rainbowBrightness !== undefined ? rainbowBrightness : 50;
        const amount = (bVal - 50) / 50;
        const effAmount = bVal === 50 ? (isDark ? 0.15 : 0) : Math.max(amount, -1.0);

        let sC = startHex;
        let eC = endHex;

        if (effAmount !== 0) {
            const rgbS = hexToRgbObj(sC);
            if (rgbS) sC = `rgb(${adjustBrightnessRgb(`${rgbS.r},${rgbS.g},${rgbS.b}`, effAmount)})`;

            const rgbE = hexToRgbObj(eC);
            if (rgbE) eC = `rgb(${adjustBrightnessRgb(`${rgbE.r},${rgbE.g},${rgbE.b}`, effAmount)})`;
        }

        return [sC, eC];
    }

    /**
     * Attaches the RainbowManager to the specified window for global or multi-window access.
     */
    public static attachToWindow(targetWin?: Window): void {
        const win = targetWin || (typeof window !== 'undefined' ? window : null);
        if (win) {
            (win as unknown as { ColorfulFoldersRainbow: typeof RainbowManager }).ColorfulFoldersRainbow = RainbowManager;
        }
    }
}

// Automatically bind to current window scope if available
if (typeof window !== 'undefined') {
    RainbowManager.attachToWindow(window);
}
