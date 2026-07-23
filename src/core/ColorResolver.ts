import { ColorfulFoldersSettings, FolderStyle } from '../common/types';
import { PALETTES } from '../common/constants';
import { hexToRgbObj, adjustBrightnessRgb, parseCustomPalette, hashString } from '../common/utils';

export function isDarkMode(): boolean {
    return activeDocument.body.classList.contains('theme-dark');
}

export function getCurrentPalette(
    settings: ColorfulFoldersSettings, 
    cachedPalette: { rgb: string, hex: string }[] | null,
    cachedPaletteKey: string
): { palette: { rgb: string, hex: string }[], newKey: string } {
    const isDark = isDarkMode();
    const activePaletteName = isDark 
        ? (settings.paletteDark ?? settings.palette ?? "Pastel Dreams")
        : (settings.paletteLight ?? settings.palette ?? "Tailwind UI");

    const key = `${activePaletteName}_${settings.customPalette}_${isDark}_${settings.rootStyle}_${settings.lightModeBrightness}_${settings.darkModeBrightness}`;
    if (cachedPalette && cachedPaletteKey === key) {
        return { palette: cachedPalette, newKey: key };
    }

    let currentPalette = PALETTES[activePaletteName] ?? PALETTES["Muted Dark Mode"];
    if (activePaletteName === "Custom") {
        const custom = parseCustomPalette(settings.customPalette);
        if (custom) currentPalette = custom;
    }

    if (!isDark) {
        currentPalette = currentPalette.map(c => {
            const darker = adjustBrightnessRgb(c.rgb, -0.15);
            const p = darker.split(',').map(s => parseInt(s.trim(), 10));
            const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
            return { rgb: darker, hex: hex };
        });
    }

    return { palette: currentPalette, newKey: key };
}

export class ColorResolver {
    public static resolveColor(
        path: string,
        name: string,
        isFile: boolean,
        depth: number,
        validIndex: number,
        rootIndex: number,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        passedColor: { rgb: string, hex: string } | null,
        colorMode: string,
        cycleOffset: number,
        palette: { rgb: string, hex: string }[],
        heatmapMtime: number,
        globalBackgroundColor: string,
        autoColorFiles: boolean,
        isNNActive: boolean
    ): { rgb: string, hex: string } {
        const getFolderColor = (vIdx: number, d: number, rIdx: number) => {
            if (colorMode === "heatmap") {
                if (!heatmapMtime) return palette[palette.length - 1];
                const diffDays = (Date.now() - heatmapMtime) / (1000 * 60 * 60 * 24);
                if (diffDays <= 1) return palette[0];
                if (diffDays <= 3) return palette[Math.min(2, palette.length - 1)];
                if (diffDays <= 7) return palette[Math.min(7, palette.length - 1)];
                if (diffDays <= 15) return palette[Math.min(4, palette.length - 1)];
                if (diffDays <= 30) return palette[Math.min(10, palette.length - 1)];
                return palette[palette.length - 1];
            } else if (colorMode === "monochromatic") {
                if (d === 0) return palette[vIdx % palette.length];
                return palette[rIdx % palette.length];
            } else if (colorMode === "hierarchy") {
                return palette[(d + cycleOffset) % palette.length];
            } else {
                return palette[(vIdx + d + rIdx + cycleOffset) % palette.length];
            }
        };

        if (customStyle?.hex) {
            const cp = parseCustomPalette(customStyle.hex);
            const rgb = hexToRgbObj(customStyle.hex);
            return cp
                ? cp[0]
                : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: customStyle.hex } : palette[0]);
        } else if (inheritedStyle?.applyToSubfolders && !isFile && passedColor) {
            return passedColor;
        } else if (inheritedStyle?.applyToSubfolders && !isFile && inheritedStyle.hex) {
            const cp = parseCustomPalette(inheritedStyle.hex);
            const rgb = hexToRgbObj(inheritedStyle.hex);
            return cp
                ? cp[0]
                : (rgb ? { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: inheritedStyle.hex } : palette[0]);
        } else if (isFile) {
            const parentColor = passedColor ?? (depth > 0 ? getFolderColor(0, depth - 1, rootIndex) : null);
            if (inheritedStyle?.applyToFiles && parentColor) {
                const hObj = hexToRgbObj(inheritedStyle.hex ?? parentColor.hex) ?? { r: 235, g: 111, b: 146 };
                const nameHash = hashString(name);
                const offset = ((nameHash % 5) - 2) * 5;
                return {
                    rgb: `${Math.max(0, Math.min(255, hObj.r + offset))}, ${Math.max(0, Math.min(255, hObj.g + offset))}, ${Math.max(0, Math.min(255, hObj.b + offset))}`,
                    hex: inheritedStyle.hex ?? parentColor.hex,
                };
            } else if (autoColorFiles || isNNActive) {
                const nameHash = hashString(name);
                return palette[(validIndex + nameHash + cycleOffset) % palette.length];
            } else {
                const gHex = globalBackgroundColor || "";
                const gRgb = hexToRgbObj(gHex);
                return parentColor ?? (gRgb ? { rgb: `${gRgb.r}, ${gRgb.g}, ${gRgb.b}`, hex: gHex } : { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" });
            }
        } else {
            return getFolderColor(validIndex, depth, rootIndex);
        }
    }

    public static resolveOpacity(
        isFile: boolean,
        depth: number,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        fileBackgroundOpacity: number | undefined,
        rootOpacity: number | undefined,
        subfolderOpacity: number | undefined,
        rootStyle: string,
        autoColorFiles: boolean,
        isNNActive: boolean,
        isDark: boolean
    ): number {
        if (customStyle?.opacity !== undefined) {
            return customStyle.opacity;
        } else if (customStyle?.hex) {
            return isFile ? (fileBackgroundOpacity ?? (isDark ? 0.1 : 0.15)) : (rootOpacity ?? 0.50);
        } else if (isFile) {
            const isAutoOn = autoColorFiles || isNNActive;
            const baseOpacity = fileBackgroundOpacity ?? (isDark ? 0.1 : 0.15);

            if (inheritedStyle?.applyToFiles) {
                // If autoColorFiles is enabled, inherit background color (1 shade lighter)
                if (autoColorFiles) {
                    return Math.max(0.04, baseOpacity * 0.65);
                } else {
                    return 0.0;
                }
            } else if (isAutoOn) {
                return baseOpacity;
            } else {
                return 0.0;
            }
        } else if (depth === 0) {
            if (rootStyle === "solid") {
                return 1.0;
            } else {
                return rootOpacity ?? 0.50;
            }
        } else {
            const baseOp = subfolderOpacity ?? 0.40;
            let startOp = baseOp;
            if (inheritedStyle?.opacity !== undefined) {
                startOp = Math.min(baseOp, inheritedStyle.opacity);
            }
            let op = startOp - ((depth - 1) * 0.08);
            if (op < 0.10) {
                op = 0.05;
            }
            return parseFloat(op.toFixed(3));
        }
    }

    public static resolveTextColor(
        isFile: boolean,
        depth: number,
        colorHex: string,
        colorRgb: string,
        customStyle: FolderStyle | null,
        inheritedStyle: FolderStyle | null,
        isDark: boolean,
        brightnessAmount: number,
        rootStyle: string,
        outlineOnly: boolean,
        shouldColor: boolean
    ): string {
        const effectiveTextColor = customStyle?.textColor ?? 
            (!isFile ? inheritedStyle?.textColor : (inheritedStyle?.applyToFiles ? inheritedStyle?.textColor : null)) ?? 
            null;
        
        if (effectiveTextColor) return effectiveTextColor;

        if (shouldColor) {
            const contrastColor = isDark ? "#ffffff" : "#111111";

            if (!isFile && depth === 0 && rootStyle === "solid" && !outlineOnly) {
                return contrastColor;
            }

            const adjust = isDark
                ? Math.max(brightnessAmount, 0)
                : brightnessAmount === 0
                    ? -0.5
                    : brightnessAmount;

            return isDark && adjust === 0
                ? colorHex
                : `rgb(${adjustBrightnessRgb(colorRgb, adjust)})`;
        }
        return "var(--text-normal)";
    }
}
