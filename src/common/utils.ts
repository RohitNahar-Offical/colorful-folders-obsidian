const MAX_CACHE_SIZE = 1000;
const rgbCache = new Map<string, {r: number, g: number, b: number} | null>();

export function hexToRgbObj(hex: string): {r: number, g: number, b: number} | null {
    if (!hex || typeof hex !== 'string') return null;
    const cached = rgbCache.get(hex);
    if (cached !== undefined) return cached;

    if (rgbCache.size > MAX_CACHE_SIZE) {
        rgbCache.clear();
    }

    let cleanHex = hex.trim().toLowerCase();
    
    const hasHash = cleanHex.startsWith('#');
    let hexDigits = hasHash ? cleanHex.slice(1) : cleanHex;
    
    if (/^[a-f\d]{3}$/i.test(hexDigits)) {
        hexDigits = hexDigits[0] + hexDigits[0] + hexDigits[1] + hexDigits[1] + hexDigits[2] + hexDigits[2];
    }
    
    if (!/^[a-f\d]{6}$/i.test(hexDigits)) {
        rgbCache.set(hex, null);
        return null;
    }
    
    const result = {
        r: parseInt(hexDigits.slice(0, 2), 16),
        g: parseInt(hexDigits.slice(2, 4), 16),
        b: parseInt(hexDigits.slice(4, 6), 16)
    };
    rgbCache.set(hex, result);
    return result;
}

export function anyToHex(color: string): string {
    if (!color) return "#000000";
    if (color.startsWith('#')) return color;
    if (color.startsWith('rgb')) {
        const rgb = color.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            return "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
        }
    }
    return "#000000";
}

export function adjustBrightnessRgb(rgb: string, amount: number): string {
    if (!rgb || rgb.includes('var(')) return "120, 120, 120";
    const [r, g, b] = rgb.split(',').map(c => {
        const val = parseInt(c.trim());
        if (isNaN(val)) return 120;
        if (amount < 0) {
            return Math.max(0, Math.round(val * (1 + amount)));
        } else {
            return Math.min(255, Math.round(val + (255 - val) * amount));
        }
    });
    return `${r}, ${g}, ${b}`;
}

export function safeEscape(path: string): string {
    if (!path) return "";
    return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const paletteCache = new Map<string, { rgb: string, hex: string }[] | null>();

export function parseCustomPalette(hexString: string): { rgb: string, hex: string }[] | null {
    if (!hexString) return null;
    const cached = paletteCache.get(hexString);
    if (cached !== undefined) return cached;

    if (paletteCache.size > MAX_CACHE_SIZE) {
        paletteCache.clear();
    }

    const hexes = hexString.split(',').map(s => s.trim().toLowerCase());
    const result: { rgb: string, hex: string }[] = [];
    for (let hex of hexes) {
        if (!hex.startsWith('#') && /^[0-9a-f]{3,6}$/i.test(hex)) {
            hex = '#' + hex;
        }

        if (/^#[0-9a-f]{3}$/i.test(hex)) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (/^#[0-9a-f]{6}$/i.test(hex)) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            result.push({ rgb: `${r}, ${g}, ${b}`, hex: hex });
        }
    }
    const finalVal = result.length > 0 ? result : null;
    paletteCache.set(hexString, finalVal);
    return finalVal;
}
export function rgbToHsv(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { 
        h: Math.round(h * 360), 
        s: Math.round(s * 100), 
        v: Math.round(v * 100) 
    };
}

export function hsvToRgb(h: number, s: number, v: number) {
    h /= 360; s /= 100; v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
export function parseColorToHexAlpha(color: string): { hex: string, alpha: number } {
    if (!color) return { hex: "#ffffff", alpha: 0 };
    if (color.startsWith('#')) return { hex: color, alpha: 1 };
    if (color.startsWith('rgb')) {
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            return { hex, alpha: a };
        }
    }
    return { hex: "#ffffff", alpha: 1 };
}

export function hexAlphaToRgba(hex: string, alpha: number): string {
    const rgb = hexToRgbObj(hex);
    if (!rgb) return "transparent";
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
