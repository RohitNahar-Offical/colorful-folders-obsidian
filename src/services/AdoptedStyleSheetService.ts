import { IColorfulFoldersPlugin } from '../common/types';

export class AdoptedStyleSheetService {
    plugin: IColorfulFoldersPlugin;
    public sheet: CSSStyleSheet | null = null;
    private fallbackStyleEls: Map<Document, HTMLStyleElement> = new Map();
    private isAdoptedSupported = false;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        try {
            if (typeof CSSStyleSheet === 'function' && typeof activeDocument !== 'undefined' && Array.isArray(activeDocument.adoptedStyleSheets)) {
                this.sheet = new CSSStyleSheet();
                this.isAdoptedSupported = true;
            }
        } catch {
            this.isAdoptedSupported = false;
            this.sheet = null;
        }
    }

    /**
     * Attaches the stylesheet instance or fallback <style> element to a specific document.
     */
    attachToDocument(doc: Document): void {
        if (this.isAdoptedSupported && this.sheet && doc.adoptedStyleSheets) {
            if (!doc.adoptedStyleSheets.includes(this.sheet)) {
                doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
            }
        } else {
            let styleEl = this.fallbackStyleEls.get(doc);
            if (!styleEl || !doc.head.contains(styleEl)) {
                styleEl = doc.createElement('style');
                styleEl.id = 'cf-dynamic-styles';
                doc.head.appendChild(styleEl);
                this.fallbackStyleEls.set(doc, styleEl);
            }
        }
    }

    /**
     * Attaches the stylesheet instance to all active workspace documents safely.
     */
    initializeStyles(): void {
        this.plugin.getOpenDocuments().forEach(doc => this.attachToDocument(doc));
    }

    /**
     * Synchronously replaces the contents of the programmatic stylesheet.
     */
    updateStyles(cssString: string): void {
        if (this.isAdoptedSupported && this.sheet) {
            try {
                this.sheet.replaceSync(cssString);
                return;
            } catch (e) {
                console.error('Colorful Folders: Failed to replaceSync CSS in AdoptedStyleSheetService', e);
            }
        }

        // Fallback for mobile WebKit / older webviews lacking adoptedStyleSheets
        this.plugin.getOpenDocuments().forEach(doc => {
            this.attachToDocument(doc);
            const styleEl = this.fallbackStyleEls.get(doc);
            if (styleEl) {
                styleEl.textContent = cssString;
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
        if (this.isAdoptedSupported && this.sheet) {
            this.plugin.getOpenDocuments().forEach(doc => {
                if (doc.adoptedStyleSheets) {
                    doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(s => s !== this.sheet);
                }
            });
        }
        this.fallbackStyleEls.forEach((styleEl) => {
            styleEl.remove();
        });
        this.fallbackStyleEls.clear();
    }
}
