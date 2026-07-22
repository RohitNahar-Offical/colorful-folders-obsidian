import { IColorfulFoldersPlugin } from '../common/types';

export class AdoptedStyleSheetService {
    plugin: IColorfulFoldersPlugin;
    public sheet: CSSStyleSheet = new CSSStyleSheet();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    /**
     * Attaches the stylesheet instance to a specific document.
     */
    attachToDocument(doc: Document): void {
        if (!doc.adoptedStyleSheets.includes(this.sheet)) {
            doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, this.sheet];
        }
    }

    /**
     * Attaches the stylesheet instance to all active workspace documents safely
     * without overwriting existing sheets.
     */
    initializeStyles(): void {
        this.plugin.getOpenDocuments().forEach(doc => this.attachToDocument(doc));
    }

    /**
     * Synchronously replaces the contents of the programmatic stylesheet.
     */
    updateStyles(cssString: string): void {
        try {
            this.sheet.replaceSync(cssString);
        } catch (e) {
            console.error('Colorful Folders: Failed to replaceSync CSS in AdoptedStyleSheetService', e);
        }
    }

    /**
     * Detaches the stylesheet instance from all workspace documents on plugin unload.
     */
    unload(): void {
        this.plugin.getOpenDocuments().forEach(doc => {
            doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(s => s !== this.sheet);
        });
    }
}
