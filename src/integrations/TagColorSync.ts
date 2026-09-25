import { StyleResolver } from '../core/StyleResolver';
import { TFolder } from 'obsidian';
import { IColorfulFoldersPlugin, StyleContext } from '../common/types';
import { adjustBrightnessRgb, hexToRgbObj } from '../common/utils';

/**
 * TagColorSync Integration
 * Handles modular, memory-efficient CSS generation for:
 * 1. Markdown tags (#tag) in Live Preview and Reading Mode
 * 2. Tag Pane (.tag-container / [data-type="tag"]) sidebar tree items
 * 
 * Performance & Memory Principles:
 * - O(1) In-Flight Traversal Reuse: When called from StyleGenerator, accepts pre-resolved folder colors
 *   eliminating duplicate filesystem sweeps entirely.
 * - Iterative Stack DFS: If called standalone, traverses strictly TFolder nodes on vault.getRoot()
 *   with O(depth) stack space, eliminating getAllLoadedFiles() multi-megabyte array allocations.
 * - Flyweight Structural CSS: Emits shared tag borders and hover rules ONCE.
 *   Tags only bind CSS custom properties (--cf-tag-*), reducing CSS text size by >75%.
 * - Case-Insensitive Matching: Uses standard CSS [href="#tag" i] and [data-tag-name="tag" i]
 *   instead of duplicating uppercase/lowercase selector blocks.
 * - Deterministic Memoization: O(1) cache lookup for stable settings and palettes.
 */
export class TagColorSync {
    private static _cachedCss = '';
    private static _cachedKey = '';

    public static clearCache(): void {
        this._cachedCss = '';
        this._cachedKey = '';
    }

    static generateCss(plugin: IColorfulFoldersPlugin, context: StyleContext, folderColorMap?: Map<string, string>): string {
        if (!plugin.settings.tagSyncEnabled) return '';

        const tagMap = new Map<string, string>(); // normalized tag name -> hex color

        // 1. Folders Matching
        if (plugin.settings.tagSyncMatchFolders) {
            if (folderColorMap && folderColorMap.size > 0) {
                // Algorithmic optimization: Direct O(K) reuse of pre-resolved folder colors
                for (const [cleanName, hex] of folderColorMap) {
                    tagMap.set(cleanName, hex);
                }
            } else {
                // Algorithmic optimization: Iterative stack DFS traversing strictly TFolder nodes (zero TFile allocations)
                const root = plugin.app.vault.getRoot();
                if (root) {
                    const stack: TFolder[] = [root];
                    while (stack.length > 0) {
                        const current = stack.pop();
                        if (!current) continue;

                        if (!current.isRoot()) {
                            const effStyle = StyleResolver.getEffectiveStyle(current, plugin);
                            if (effStyle?.hex && current.name) {
                                const cleanName = current.name.replace(/[^\w-]/g, '').toLowerCase();
                                if (cleanName) {
                                    tagMap.set(cleanName, effStyle.hex);
                                }
                            }
                        }

                        const children = current.children;
                        for (let i = 0, len = children.length; i < len; i++) {
                            const child = children[i];
                            if (child instanceof TFolder && !child.name.startsWith('.')) {
                                stack.push(child);
                            }
                        }
                    }
                }
            }
        }

        // 2. Explicit Rules (overrides folder matching)
        if (plugin.settings.tagSyncRules) {
            const rules = plugin.settings.tagSyncRules.split('\n');
            for (let i = 0, len = rules.length; i < len; i++) {
                const rule = rules[i].trim();
                if (!rule) continue;
                const eqIdx = rule.indexOf('=');
                if (eqIdx !== -1) {
                    const rawName = rule.slice(0, eqIdx).trim();
                    const rawColor = rule.slice(eqIdx + 1).trim();
                    if (rawColor.startsWith('#')) {
                        const cleanName = rawName.replace(/#/g, '').replace(/[^\w/-]/g, '').toLowerCase();
                        if (cleanName) {
                            tagMap.set(cleanName, rawColor);
                        }
                    }
                }
            }
        }

        if (tagMap.size === 0) return '';

        // Deterministic cache validation
        const tagEntries = Array.from(tagMap.entries());
        const tagSig = tagEntries.map(([k, v]) => `${k}:${v}`).join(';');
        const tagPaneEnabled = plugin.settings.tagPaneSyncEnabled !== false;
        const cacheKey = `${tagPaneEnabled ? 1 : 0}:${context.isDark ? 1 : 0}:${context.brightnessAmount}:${tagSig}`;
        if (this._cachedKey === cacheKey && this._cachedCss) {
            return this._cachedCss;
        }

        const chunks: string[] = [
            '/* =========================================================',
            '   Tag Color Synchronization (Flyweight Zero-DOM)',
            '   ========================================================= */'
        ];

        // 3. Shared In-Note Tag Structural Rules (Flyweight)
        const tagClasses = tagEntries.map(([t]) => `.cm-tag-${t.replace(/\//g, '')}`).join(', ');
        const tagLinks = tagEntries.map(([t]) => `a.tag[href="#${t}" i]`).join(', ');

        chunks.push(`
/* In-Note Tag Base Structure & Shared Borders */
body :is(${tagLinks}, .tag:is(${tagClasses})) {
    border: 1px solid var(--cf-tag-border) !important;
    border-radius: 12px !important;
    padding: 2px 8px !important;
}

body .cm-hashtag:is(${tagClasses}) {
    border-top: 1px solid var(--cf-tag-border) !important;
    border-bottom: 1px solid var(--cf-tag-border) !important;
}

body .cm-hashtag-begin:is(${tagClasses}) {
    border-left: 1px solid var(--cf-tag-border) !important;
    border-right: none !important;
    border-top-left-radius: 12px !important;
    border-bottom-left-radius: 12px !important;
    padding-left: 8px !important;
    padding-right: 0 !important;
}

body .cm-hashtag-end:is(${tagClasses}) {
    border-right: 1px solid var(--cf-tag-border) !important;
    border-left: none !important;
    border-top-right-radius: 12px !important;
    border-bottom-right-radius: 12px !important;
    padding-right: 8px !important;
    padding-left: 0 !important;
}

body :is(.cm-hashtag:is(${tagClasses}), .tag:is(${tagClasses}), ${tagLinks}):hover {
    background-color: var(--cf-tag-hover-bg) !important;
}
`);

        // 4. Per-Tag Variable Binding (In-Note & Reading View)
        for (let i = 0, len = tagEntries.length; i < len; i++) {
            const [tag, hex] = tagEntries[i];
            const rgb = hexToRgbObj(hex);
            if (!rgb) continue;
            const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

            const adjust = context.isDark
                ? Math.max(context.brightnessAmount, 0)
                : (context.brightnessAmount === 0 ? -0.5 : context.brightnessAmount);
            const t = (context.isDark && adjust === 0) ? hex : `rgb(${adjustBrightnessRgb(rgbStr, adjust)})`;

            const cmClass = `.cm-tag-${tag.replace(/\//g, '')}`;

            chunks.push(`
/* Tag #${tag} */
body :is(${cmClass}, .tag${cmClass}, .markdown-rendered a.tag[href="#${tag}" i]) {
    --cf-tag-bg: rgba(${rgbStr}, 0.2);
    --cf-tag-color: ${t};
    --cf-tag-border: rgba(${rgbStr}, 0.3);
    --cf-tag-hover-bg: rgba(${rgbStr}, 0.3);
    background-color: var(--cf-tag-bg) !important;
    color: var(--cf-tag-color) !important;
}
`);

            // 5. Sidebar Tag Pane Per-Tag Rule
            if (tagPaneEnabled) {
                chunks.push(`
.workspace-leaf-content[data-type="tag"] .tree-item-self:is([data-tag-name="${tag}" i], [data-tag-name^="${tag}/" i]) {
    --cf-tag-pane-bg: rgba(${rgbStr}, 0.12);
    --cf-tag-pane-color: ${t};
    --cf-tag-pane-flair-bg: rgba(${rgbStr}, 0.22);
    --cf-tag-pane-hover-bg: rgba(${rgbStr}, 0.2);
    --cf-tag-pane-active-bg: rgba(${rgbStr}, 0.3);
    --cf-tag-pane-glow: rgba(${rgbStr}, 0.5);
    --cf-tag-pane-glow-soft: rgba(${rgbStr}, 0.25);
    background-color: var(--cf-tag-pane-bg) !important;
    border-radius: 6px !important;
}
`);
            }
        }

        // 6. Sidebar Tag Pane Shared Structural Rules
        if (tagPaneEnabled) {
            const tagPaneSels = tagEntries.map(([t]) => `[data-tag-name="${t}" i], [data-tag-name^="${t}/" i]`).join(', ');

            chunks.push(`
/* Tag Pane Shared Structural Styling */
.workspace-leaf-content[data-type="tag"] .tree-item-self:is(${tagPaneSels}) {
    margin-top: 2px !important;
    margin-bottom: 2px !important;
    border-radius: 6px !important;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.workspace-leaf-content[data-type="tag"] .tree-item-self:is(${tagPaneSels}) .tree-item-inner-text {
    color: var(--cf-tag-pane-color) !important;
}

.workspace-leaf-content[data-type="tag"] .tree-item-self:is(${tagPaneSels}) .tree-item-flair {
    background-color: var(--cf-tag-pane-flair-bg) !important;
    color: var(--cf-tag-pane-color) !important;
    border-radius: 10px !important;
}

.workspace-leaf-content[data-type="tag"] .tree-item-self:is(${tagPaneSels}):hover {
    background-color: var(--cf-tag-pane-hover-bg) !important;
}

.workspace-leaf-content[data-type="tag"] .tree-item-self:is(${tagPaneSels}):is(.is-active, .cf-is-active) {
    background-color: var(--cf-tag-pane-active-bg) !important;
    box-shadow: inset 0 0 0 1px var(--cf-tag-pane-glow), 0 0 8px var(--cf-tag-pane-glow-soft) !important;
}
`);
        }

        this._cachedKey = cacheKey;
        this._cachedCss = chunks.join('\n');
        return this._cachedCss;
    }
}

