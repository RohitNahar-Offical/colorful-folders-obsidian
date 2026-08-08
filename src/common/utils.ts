const MAX_CACHE_SIZE = 1000;
const rgbCache = new Map<string, {r: number, g: number, b: number} | null>();

function parseHexNibble(code: number): number {
    if (code >= 48 && code <= 57) return code - 48; // '0'-'9'
    if (code >= 97 && code <= 102) return code - 87; // 'a'-'f'
    if (code >= 65 && code <= 70) return code - 55; // 'A'-'F'
    return -1;
}

export function hexToRgbObj(hex: string): {r: number, g: number, b: number} | null {
    if (!hex || typeof hex !== 'string') return null;
    const cached = rgbCache.get(hex);
    if (cached !== undefined) return cached;

    if (rgbCache.size > MAX_CACHE_SIZE) {
        for (const k of rgbCache.keys()) {
            rgbCache.delete(k);
            break;
        }
    }

    // Strip leading/trailing whitespace & optional leading '#'
    let start = 0;
    const len = hex.length;
    while (start < len && hex.charCodeAt(start) <= 32) start++;
    if (start < len && hex.charCodeAt(start) === 35) start++; // '#' = 35

    let end = len;
    while (end > start && hex.charCodeAt(end - 1) <= 32) end--;

    const hexLen = end - start;

    if (hexLen === 3) {
        const rVal = parseHexNibble(hex.charCodeAt(start));
        const gVal = parseHexNibble(hex.charCodeAt(start + 1));
        const bVal = parseHexNibble(hex.charCodeAt(start + 2));
        if (rVal < 0 || gVal < 0 || bVal < 0) {
            rgbCache.set(hex, null);
            return null;
        }
        const res = { r: (rVal << 4) | rVal, g: (gVal << 4) | gVal, b: (bVal << 4) | bVal };
        rgbCache.set(hex, res);
        return res;
    }

    if (hexLen === 6) {
        const r1 = parseHexNibble(hex.charCodeAt(start));
        const r2 = parseHexNibble(hex.charCodeAt(start + 1));
        const g1 = parseHexNibble(hex.charCodeAt(start + 2));
        const g2 = parseHexNibble(hex.charCodeAt(start + 3));
        const b1 = parseHexNibble(hex.charCodeAt(start + 4));
        const b2 = parseHexNibble(hex.charCodeAt(start + 5));

        if (r1 < 0 || r2 < 0 || g1 < 0 || g2 < 0 || b1 < 0 || b2 < 0) {
            rgbCache.set(hex, null);
            return null;
        }

        const res = {
            r: (r1 << 4) | r2,
            g: (g1 << 4) | g2,
            b: (b1 << 4) | b2
        };
        rgbCache.set(hex, res);
        return res;
    }

    rgbCache.set(hex, null);
    return null;
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

export function adjustBrightnessValues(r: number, g: number, b: number, amount: number): { r: number, g: number, b: number } {
    let nr: number, ng: number, nb: number;
    if (amount < 0) {
        const factor = 1 + amount;
        nr = (r * factor + 0.5) | 0;
        ng = (g * factor + 0.5) | 0;
        nb = (b * factor + 0.5) | 0;
    } else {
        const invAmount = 1 - amount;
        nr = (255 - (255 - r) * invAmount + 0.5) | 0;
        ng = (255 - (255 - g) * invAmount + 0.5) | 0;
        nb = (255 - (255 - b) * invAmount + 0.5) | 0;
    }
    return {
        r: nr < 0 ? 0 : (nr > 255 ? 255 : nr),
        g: ng < 0 ? 0 : (ng > 255 ? 255 : ng),
        b: nb < 0 ? 0 : (nb > 255 ? 255 : nb)
    };
}

export function adjustBrightnessRgb(rgb: string, amount: number): string {
    if (!rgb || rgb.indexOf('var(') !== -1) return "120, 120, 120";

    let str = rgb;
    const startParen = str.indexOf('(');
    if (startParen !== -1) {
        const endParen = str.indexOf(')', startParen);
        str = endParen !== -1 ? str.substring(startParen + 1, endParen) : str.substring(startParen + 1);
    }
    
    let r = 120, g = 120, b = 120;
    let idx1 = str.indexOf(',');
    if (idx1 !== -1) {
        let idx2 = str.indexOf(',', idx1 + 1);
        if (idx2 !== -1) {
            r = parseInt(str.substring(0, idx1).trim(), 10);
            g = parseInt(str.substring(idx1 + 1, idx2).trim(), 10);
            b = parseInt(str.substring(idx2 + 1).trim(), 10);
            if (isNaN(r)) r = 120;
            if (isNaN(g)) g = 120;
            if (isNaN(b)) b = 120;
        }
    }

    const res = adjustBrightnessValues(r, g, b, amount);
    return `${res.r}, ${res.g}, ${res.b}`;
}

export function normalizeVaultPath(path: string): string {
    if (!path) return "";
    return path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '')
        .trim();
}

export function safeEscape(path: string): string {
    if (!path) return "";
    const norm = normalizeVaultPath(path);
    return norm
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/=/g, '\\=')
        .replace(/\^/g, '\\^');
}

const paletteCache = new Map<string, { rgb: string, hex: string }[] | null>();

export function parseCustomPalette(hexString: string): { rgb: string, hex: string }[] | null {
    if (!hexString) return null;
    const cached = paletteCache.get(hexString);
    if (cached !== undefined) return cached;

    if (paletteCache.size > MAX_CACHE_SIZE) {
        for (const k of paletteCache.keys()) {
            paletteCache.delete(k);
            break;
        }
    }

    const hexes = hexString.split(',');
    const result: { rgb: string, hex: string }[] = [];
    for (let hex of hexes) {
        const rgb = hexToRgbObj(hex);
        if (rgb) {
            const canonicalHex = "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
            result.push({ rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: canonicalHex });
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
    if (!color || color.trim() === '') return { hex: "#ffffff", alpha: 1 };
    if (color.startsWith('#')) return { hex: color, alpha: 1 };
    if (color.startsWith('rgb')) {
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            let a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
            if (isNaN(a)) a = 1;
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

export function stemWord(word: string): string {
    if (!word || word.length <= 3) return word;
    let s = word.toLowerCase();
    if (s.endsWith('ing') && s.length > 5) {
        s = s.slice(0, -3);
    } else if (s.endsWith('ed') && s.length > 4) {
        s = s.slice(0, -2);
    } else if (s.endsWith('es') && s.length > 4) {
        s = s.slice(0, -2);
    } else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) {
        s = s.slice(0, -1);
    }
    return s;
}

export const ICON_PREFIX_REGEX = /^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide|bx|bxs|bxm|ph|heroicons|cf)[-_:]/i;
export const ICON_VARIANT_SUFFIX_REGEX = /[-_:](line|fill|filled|outline|outlined|solid|regular|bold|light|duotone|alt|off|2|3|1|plus|sharp|rounded|circle|square)$/i;

export function stripIconPrefix(iconId: string): string {
    if (!iconId) return '';
    return iconId.trim().toLowerCase().replace(ICON_PREFIX_REGEX, '');
}

export function stripIconVariantSuffix(iconId: string): string {
    if (!iconId) return '';
    return iconId.trim().toLowerCase().replace(ICON_VARIANT_SUFFIX_REGEX, '');
}

export function extractCoreIconKeyword(iconId: string): { noPrefix: string; core: string } {
    const noPrefix = stripIconPrefix(iconId);
    const core = stripIconVariantSuffix(noPrefix);
    return { noPrefix, core };
}

export function normalizePathKey(path: string): string {
    if (!path) return "";
    return path
        .replace(/\\/g, '/')
        .replace(/\.md$/i, '')
        .trim()
        .toLowerCase();
}


