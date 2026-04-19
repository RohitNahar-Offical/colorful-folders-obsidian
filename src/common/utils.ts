import { ColorfulFoldersSettings, AutoIconData, FolderStyle } from './types';
import { AUTO_ICON_CATEGORIES } from './constants';

export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function hsvToRgb(h: number, s: number, v: number) {
    let r: number = 0, g: number = 0, b: number = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = (v / 100) * (1 - s / 100);
    const q = (v / 100) * (1 - f * s / 100);
    const t = (v / 100) * (1 - (1 - f) * s / 100);
    const vv = v / 100;
    switch (i % 6) {
        case 0: r = vv, g = t, b = p; break;
        case 1: r = q, g = vv, b = p; break;
        case 2: r = p, g = vv, b = t; break;
        case 3: r = p, g = q, b = vv; break;
        case 4: r = t, g = p, b = vv; break;
        case 5: r = vv, g = p, b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function rgbToHsv(r: number, g: number, b: number) {
    let rr = r / 255, gg = g / 255, bb = b / 255;
    let max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h: number = 0, s: number, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break;
            case gg: h = (bb - rr) / d + 2; break;
            case bb: h = (rr - gg) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hexToRgbObj(hex: string) {
    if (!hex) return { r: 255, g: 255, b: 255 };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

export function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function anyToHex(colorStr: string) {
    if (!colorStr) return "#ffffff";
    if (colorStr.startsWith('#')) return colorStr;
    if (colorStr.startsWith('rgb')) {
        const m = colorStr.match(/\d+/g);
        if (m && m.length >= 3) {
            return rgbToHex(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
        }
    }
    return "#ffffff";
}

export function adjustBrightnessRgb(rgbStr: string, amount = 0) {
    const parts = rgbStr.split(',').map(p => parseInt(p.trim()));
    if (parts.length !== 3) return rgbStr;
    const [r, g, b] = parts.map(c => {
        if (amount < 0) {
            return Math.max(0, Math.round(c * (1 + amount)));
        } else {
            return Math.min(255, Math.round(c + (255 - c) * amount));
        }
    });
    return `${r}, ${g}, ${b}`;
}

export function safeEscape(path: string): string {
    if (!path) return "";
    return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function getAutoIconData(name: string, settings: ColorfulFoldersSettings, isFile = false): AutoIconData | null {
    if (!settings.autoIcons) return null;
    
    // For files, strip the extension to avoid matching against ".md" or similar
    let lName = name.toLowerCase();
    if (isFile && lName.includes('.')) {
        lName = lName.split('.').slice(0, -1).join('.');
    }

    let categories = [...AUTO_ICON_CATEGORIES].map(c => ({...c, rex: new RegExp(c.rex, 'i')}));

    // Parse Custom Rules (Original Logic: regex, icon, priority)
    if (settings.customIconRules && settings.customIconRules.trim().length > 0) {
        const rules = settings.customIconRules.split('\n');
        for (const rule of rules) {
            if (!rule.trim() || !rule.includes('=')) continue;
            
            try {
                // Support format: Pattern = IconID @Priority
                // Example: Work = briefcase @200
                const mainParts = rule.split('=').map(p => p.trim());
                if (mainParts.length < 2) continue;

                const pattern = mainParts[0];
                let secondHalf = mainParts[1];
                let priority = 1500; // Custom rules get high priority by default

                if (secondHalf.includes('@')) {
                    const prioParts = secondHalf.split('@').map(p => p.trim());
                    secondHalf = prioParts[0];
                    priority = parseInt(prioParts[1]) || 1500;
                }

                categories.push({
                    rex: new RegExp(pattern, 'i'),
                    emoji: secondHalf,
                    lucide: secondHalf,
                    priority: priority,
                    isCustom: true
                });
            } catch (e) {
                console.error("Colorful Folders: Failed to parse custom icon rule", rule, e);
            }
        }
    }

    const matches = categories.filter(cat => cat.rex.test(lName));
    matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (settings.iconDebugMode && matches.length > 0) {
        console.debug(`Colorful Folders [Debug]: Match for "${name}" ->`, matches[0]);
    }

    if (matches.length > 0) {
        // CLONE the match so we don't modify the references for other items
        const match = { ...matches[0] }; 
        if (settings.autoIconVariety) {
            const h = hashString(name);
            if (match.emojis && match.emojis.length > 0) {
                match.emoji = match.emojis[h % match.emojis.length];
            }
            if (match.lucides && match.lucides.length > 0) {
                match.lucide = match.lucides[h % match.lucides.length];
            }
        }
        return match;
    }

    return null;
}

export function parseCustomPalette(hexString: string): { rgb: string, hex: string }[] | null {
    if (!hexString) return null;
    const hexes = hexString.split(',').map(s => s.trim().toLowerCase());
    const result: { rgb: string, hex: string }[] = [];
    for (let hex of hexes) {
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
    return result.length > 0 ? result : null;
}
