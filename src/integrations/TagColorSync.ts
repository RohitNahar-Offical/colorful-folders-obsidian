import { IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { adjustBrightnessRgb, hexToRgbObj } from '../common/utils';

export class TagColorSync {
    static generateCss(plugin: IColorfulFoldersPlugin, context: StyleContext): string {
        if (!plugin.settings.tagSyncEnabled) return '';

        const tagMap = new Map<string, string>(); // tag name -> hex color

        // 1. Folders Matching
        if (plugin.settings.tagSyncMatchFolders) {
            for (const [path, style] of Object.entries(plugin.settings.customFolderColors)) {
                if (typeof style === 'object' && !style.hasDivider && style.hex) {
                    const parts = path.split('/');
                    const name = parts[parts.length - 1];
                    if (name) {
                        const cleanName = name.replace(/[^\w-]/g, '').toLowerCase();
                        if (cleanName) {
                            tagMap.set(cleanName, style.hex);
                        }
                    }
                }
            }
        }

        // 2. Explicit Rules (overrides folder matching)
        if (plugin.settings.tagSyncRules) {
            const rules = plugin.settings.tagSyncRules.split('\n');
            for (const rule of rules) {
                const parts = rule.split('=').map(p => p.trim());
                if (parts.length >= 2 && parts[1].startsWith('#')) {
                    const cleanName = parts[0].replace(/#/g, '').replace(/[^\w-]/g, '').toLowerCase();
                    if (cleanName) {
                        tagMap.set(cleanName, parts[1]);
                    }
                }
            }
        }

        if (tagMap.size === 0) return '';

        let css = '';

        tagMap.forEach((hex, tag) => {
            const rgb = hexToRgbObj(hex);
            if (!rgb) return;
            const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

            const adjust = context.isDark ? Math.max(context.brightnessAmount, 0) : (context.brightnessAmount === 0 ? -0.5 : context.brightnessAmount);
            const t = (context.isDark && adjust === 0) ? hex : `rgb(${adjustBrightnessRgb(rgbStr, adjust)})`;

            css += `
body .cm-s-obsidian .cm-hashtag.cm-tag-${tag},
body .markdown-rendered a.tag[href="#${tag}"] {
    --cf-tag-bg: rgba(${rgbStr}, 0.2) !important;
    --cf-tag-color: ${t} !important;
    background-color: var(--cf-tag-bg) !important;
    color: var(--cf-tag-color) !important;
    border: 1px solid rgba(${rgbStr}, 0.3) !important;
}
body .cm-s-obsidian .cm-hashtag.cm-tag-${tag}:hover,
body .markdown-rendered a.tag[href="#${tag}"]:hover {
    --cf-tag-bg: rgba(${rgbStr}, 0.3) !important;
    background-color: var(--cf-tag-bg) !important;
}
`;
        });

        return css;
    }
}
