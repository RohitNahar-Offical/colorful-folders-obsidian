import { IColorfulFoldersPlugin } from '../common/types';

export class StyleSheetDeltaEngine {
    plugin: IColorfulFoldersPlugin;
    private sheet: CSSStyleSheet = new CSSStyleSheet();
    private ruleIndexMap: Map<string, number> = new Map();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    /**
     * Attaches programmatic stylesheet to all active workspace documents safely.
     */
    initializeStyles(): void {
        this.plugin.getOpenDocuments().forEach(doc => {
            if (!doc.adoptedStyleSheets.includes(this.sheet)) {
                doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
            }
        });
    }

    /**
     * Full replacement fallback used during initial plugin load or full vault re-indexing.
     */
    replaceSync(cssString: string): void {
        try {
            this.sheet.replaceSync(cssString);
            this.ruleIndexMap.clear();
        } catch (e) {
            console.error('Colorful Folders: StyleSheetDeltaEngine.replaceSync failed', e);
        }
    }

    /**
     * Inserts or replaces a specific CSS rule for a path key in O(1) time.
     */
    updatePathRule(pathKey: string, cssRuleString: string): void {
        try {
            const existingIndex = this.ruleIndexMap.get(pathKey);
            if (existingIndex !== undefined && existingIndex < this.sheet.cssRules.length) {
                this.sheet.deleteRule(existingIndex);
                const insertedIdx = this.sheet.insertRule(cssRuleString, existingIndex);
                this.ruleIndexMap.set(pathKey, insertedIdx);
            } else {
                const insertedIdx = this.sheet.insertRule(cssRuleString, this.sheet.cssRules.length);
                this.ruleIndexMap.set(pathKey, insertedIdx);
            }
        } catch {
            // If granular insertion fails (e.g. invalid rule string), trigger a clean full rebuild
            this.plugin.generateStylesDebounced?.();
        }
    }

    /**
     * Deletes a CSS rule for a path key in O(1) time.
     */
    deletePathRule(pathKey: string): void {
        const existingIndex = this.ruleIndexMap.get(pathKey);
        if (existingIndex !== undefined && existingIndex < this.sheet.cssRules.length) {
            try {
                this.sheet.deleteRule(existingIndex);
                this.ruleIndexMap.delete(pathKey);
                // Shift subsequent indexes down by 1
                for (const [k, idx] of this.ruleIndexMap.entries()) {
                    if (idx > existingIndex) {
                        this.ruleIndexMap.set(k, idx - 1);
                    }
                }
            } catch (e) {
                console.error('Colorful Folders: StyleSheetDeltaEngine.deletePathRule failed', e);
            }
        }
    }

    /**
     * Detaches stylesheet from all workspace documents on plugin unload.
     */
    unload(): void {
        this.plugin.getOpenDocuments().forEach(doc => {
            doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(s => s !== this.sheet);
        });
        this.ruleIndexMap.clear();
    }
}
