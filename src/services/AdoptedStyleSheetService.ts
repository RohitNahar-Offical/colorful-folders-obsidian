import { IColorfulFoldersPlugin } from '../common/types';

export class AdoptedStyleSheetService {
    plugin: IColorfulFoldersPlugin;
    public sheet: CSSStyleSheet | null = null;
    private fallbackStyles: Map<Document, HTMLStyleElement> = new Map();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        try {
            if (typeof CSSStyleSheet !== 'undefined') {
                this.sheet = new CSSStyleSheet();
            }
        } catch {
            this.sheet = null;
        }
    }

    /**
     * Attaches the stylesheet instance to a specific document.
     */
    attachToDocument(doc: Document): void {
        if (!doc) return;
        try {
            if (this.sheet && Array.isArray(doc.adoptedStyleSheets) && !doc.adoptedStyleSheets.includes(this.sheet)) {
                doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
                return;
            }
        } catch {
            void 0;
        }

        try {
            if (!this.fallbackStyles.has(doc)) {
                const styleTag = 'style';
                const parent = doc.head || doc.documentElement;
                const styleEl = parent.createEl(styleTag, { attr: { id: 'cf-adopted-fallback-styles' } });
                this.fallbackStyles.set(doc, styleEl);
            }
        } catch (e) {
            console.error('Colorful Folders: Failed to attach fallback style', e as Error);
        }
    }

    /**
     * Attaches the stylesheet instance to all active workspace documents safely.
     */
    initializeStyles(): void {
        try {
            this.plugin.getOpenDocuments().forEach(doc => this.attachToDocument(doc));
        } catch (e) {
            console.error('Colorful Folders: Failed initializeStyles', e as Error);
        }
    }

    /**
     * Synchronously replaces the contents of the programmatic stylesheet.
     */
    updateStyles(cssString: string): void {
        try {
            if (this.sheet && typeof this.sheet.replaceSync === 'function') {
                this.sheet.replaceSync(cssString);
            }
        } catch (e) {
            console.error('Colorful Folders: Failed to replaceSync CSS in AdoptedStyleSheetService', e as Error);
        }

        this.fallbackStyles.forEach((styleEl) => {
            try {
                styleEl.textContent = cssString;
            } catch {
                void 0;
            }
        });
    }

    /**
     * Clears all CSS rules from the stylesheet.
     */
    clearStyles(): void {
        this.updateStyles('');
    }

    /**
     * Detaches the stylesheet instance from all workspace documents on plugin unload.
     */
    unload(): void {
        this.clearStyles();
        try {
            this.plugin.getOpenDocuments().forEach(doc => {
                if (doc && Array.isArray(doc.adoptedStyleSheets) && this.sheet) {
                    doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(s => s !== this.sheet);
                }
            });
        } catch {
            void 0;
        }

        this.fallbackStyles.forEach((styleEl) => {
            try {
                styleEl.remove();
            } catch {
                void 0;
            }
        });
        this.fallbackStyles.clear();
    }
}
