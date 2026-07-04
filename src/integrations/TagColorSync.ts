import { TFolder } from 'obsidian';
import { IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { adjustBrightnessRgb, hexToRgbObj } from '../common/utils';

export class TagColorSync {
    static generateCss(plugin: IColorfulFoldersPlugin, context: StyleContext): string {
        if (!plugin.settings.tagSyncEnabled) return '';

        const tagMap = new Map<string, string>(); // tag name -> hex color

        // 1. Folders Matching
        if (plugin.settings.tagSyncMatchFolders) {
            const folders = plugin.app.vault.getAllLoadedFiles().filter((f): f is TFolder => f instanceof TFolder);
            for (const folder of folders) {
                const effStyle = plugin.getEffectiveStyle(folder);
                if (effStyle && effStyle.hex) {
                    const name = folder.name;
                    if (name) {
                        const cleanName = name.replace(/[^\w-]/g, '').toLowerCase();
                        if (cleanName) {
                            tagMap.set(cleanName, effStyle.hex);
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
/* Unified styling for Live Preview and Reading Mode */
body .cm-hashtag.cm-tag-${tag},
body .markdown-rendered a.tag[href="#${tag}" i] {
    --cf-tag-bg: rgba(${rgbStr}, 0.2) !important;
    --cf-tag-color: ${t} !important;
    background-color: var(--cf-tag-bg) !important;
    color: var(--cf-tag-color) !important;
}

/* Reading mode border and shape */
body .markdown-rendered a.tag[href="#${tag}" i] {
    border: 1px solid rgba(${rgbStr}, 0.3) !important;
    border-radius: 4px !important;
}

/* Editing mode (CodeMirror 6) seamless borders and shape for #begin and end tokens */
body .cm-hashtag.cm-tag-${tag} {
    border-top: 1px solid rgba(${rgbStr}, 0.3) !important;
    border-bottom: 1px solid rgba(${rgbStr}, 0.3) !important;
}
body .cm-hashtag-begin.cm-tag-${tag} {
    border-left: 1px solid rgba(${rgbStr}, 0.3) !important;
    border-right: none !important;
    border-top-left-radius: 4px !important;
    border-bottom-left-radius: 4px !important;
}
body .cm-hashtag-end.cm-tag-${tag} {
    border-right: 1px solid rgba(${rgbStr}, 0.3) !important;
    border-left: none !important;
    border-top-right-radius: 4px !important;
    border-bottom-right-radius: 4px !important;
}

/* Hover effects */
body .cm-hashtag.cm-tag-${tag}:hover,
body .markdown-rendered a.tag[href="#${tag}" i]:hover {
    --cf-tag-bg: rgba(${rgbStr}, 0.3) !important;
    background-color: var(--cf-tag-bg) !important;
}
`;
        });

        return css;
    }
}
