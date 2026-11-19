import * as obsidian from 'obsidian';
import { ColorfulFoldersSettings, IColorfulFoldersPlugin } from '../common/types';
import { CF_FOLDER_CLOSED, CF_FILE_DEFAULT } from '../common/constants';
import { MenuHelper } from '../ui/MenuHelper';
import { safeEscape } from '../common/utils';
import { CssGrouper } from '../core/CssGrouper';

interface NNPlugin {
    registerFileMenu?: (cb: (menu: obsidian.Menu, file: obsidian.TAbstractFile) => void) => void;
    registerFolderMenu?: (cb: (menu: obsidian.Menu, folder: obsidian.TAbstractFile) => void) => void;
}

/**
 * Notebook Navigator Integration
 * Centralizes all DOM selectors and NN-specific logic.
 */
export const NN_SELECTORS = {
    CONTAINERS: '.workspace-leaf-content[data-type="notebook-navigator"], .nn-navigation-pane-content, .nn-list-view, .nn-explorer-content, div.notebook-navigator',
    NAV_ITEM: '.nn-navitem',
    FILE_ITEM: '.nn-file',
    NAV_NAME: '.nn-navitem-name',
    NAV_ICON: '.nn-navitem-icon, .nn-navitem-icon-slot, .nn-icon-container, .nn-nav-icon',
    FILE_NAME: '.nn-file-name',
    FILE_ICON: '.nn-file-icon, .nn-file-icon-slot, .nn-icon-container, .nn-file-icon',
};

export class NotebookNavigatorIntegration {
    /** Row layout, set from settings on load/save. */
    static layout = { border: -1, radius: 6, spacing: 2, weight: 800 };
    /** Palette text/icon pairs, synced and normalized from settings before style generation. */
    static activePairs = new Map<string, { text?: string; icon?: string }>();

    static isSupported(settings: ColorfulFoldersSettings): boolean {
        return !!settings.notebookNavigatorSupport;
    }

    static showFileBg(settings: ColorfulFoldersSettings): boolean {
        return !!(settings.notebookNavigatorSupport && settings.notebookNavigatorFileBackground);
    }

    /**
     * Returns a scoped selector that ONLY matches real vault items in Notebook Navigator.
     * Hardened to exclude system views (Tags/Properties) via attribute filtering.
     */
    static getScopedNavSelectors(path: string): string[] {
        const safePath = safeEscape(path);
        return [
            `.notebook-navigator .nn-navitem[data-path="${safePath}"]:not(.nn-header)`,
            `.notebook-navigator .nn-shortcut-item[data-path="${safePath}"]`
        ];
    }

    static getScopedFileSelector(path: string): string {
        const safePath = safeEscape(path);
        return `.notebook-navigator .nn-file[data-path="${safePath}"]:not(.nn-header)`;
    }

    static getNavNameSelector(): string {
        return NN_SELECTORS.NAV_NAME;
    }

    static getFileNameSelector(): string {
        return NN_SELECTORS.FILE_NAME;
    }

    static getNavIconSelector(): string {
        return NN_SELECTORS.NAV_ICON;
    }

    static getFileIconSelector(): string {
        return NN_SELECTORS.FILE_ICON;
    }

    /**
     * Generates a complete, hardened CSS block for a specific item in Notebook Navigator.
     * Implements the 'Native-Bridge' architecture.
     */

    static generateIntegratedStyles(
        grouper: CssGrouper,
        path: string, 
        isFolder: boolean, 
        color: { rgb: string, hex: string },
        bgAlpha: number,
        textCol: string, 
        iconId: string, 
        iconColor: string | null,
        isEmoji: boolean,
        iconSvg: string,
        activeBg: string, 
        activeText: string,
        isBold: boolean,
        isItalic: boolean,
        shouldColor: boolean,
        useGlass: boolean = false,
        tintOp: number = 0,
        baseThick: number = 2.0,
        outlineOnly: boolean = false,
        _useRadiantPath: boolean = false,
        effIconW: string = '1.3em',
        activeGlow: boolean = true
    ): void {
        const L = NotebookNavigatorIntegration.layout;
        const nnThick = L.border >= 0 ? L.border : baseThick + 0.5; // Scaled for NN visibility
        const activeThick = baseThick + 2.0;
        const safePath = safeEscape(path);
        const baseSels = isFolder ? this.getScopedNavSelectors(path) : [this.getScopedFileSelector(path)];
        const nameSel = isFolder ? this.getNavNameSelector() : this.getFileNameSelector();
        const countSel = '.nn-navitem-count';

        const iconTargets = isFolder
            ? [
                `body .notebook-navigator .nn-navitem[data-path="${safePath}"] .nn-navitem-icon`,
                `body .notebook-navigator .nn-navitem[data-path="${safePath}"] .nn-navitem-icon-slot`,
                `body .notebook-navigator .nn-navitem[data-path="${safePath}"] .nn-icon-container:not(.nn-file *)`
            ]
            : [
                `body .notebook-navigator .nn-file[data-path="${safePath}"] .nn-file-icon-slot`,
                `body .notebook-navigator .nn-file[data-path="${safePath}"] .nn-file-icon:not(.nn-file-icon-slot *)`,
                `body .notebook-navigator .nn-file[data-path="${safePath}"] .nn-icon-container`
            ];
        const hideSvgSpanSels = iconTargets.flatMap(target => [
            `${target} > svg:not(.cf-live-animated-icon svg)`,
            `${target} > span:not(.cf-live-animated-icon)`
        ]);
        const hideAllChildSels = iconTargets.flatMap(target => [
            `${target} > svg`,
            `${target} > span`
        ]);

        // CSS-Based Icon Injection (Clean O(1) targeting for Notebook Navigator)
        if (iconId) {
            if (isEmoji) {
                grouper.add(`
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: ${effIconW} !important;
                    height: ${effIconW} !important;
                    flex: 0 0 auto !important;
                    flex-shrink: 0 !important;
                    content: "${iconId}" !important;
                    font-style: normal !important;
                    background: none !important;
                    -webkit-mask-image: none !important;
                    mask-image: none !important;
                    visibility: visible !important;
                `, iconTargets, `nnEmoji_${iconId}_${effIconW}`);
                grouper.add(`display: none !important;`, hideAllChildSels, `nnDisplayNone`);
            } else if (iconSvg) {
                let isAnimated = false;
                try {
                    const raw = iconSvg.includes('%') ? decodeURIComponent(iconSvg) : iconSvg;
                    isAnimated = /<animate|<animateTransform|<animateMotion|<set|@keyframes|animation:\s*/i.test(raw);
                } catch {
                    isAnimated = /animate|animation/i.test(iconSvg);
                }
                if (isAnimated) {
                    grouper.add(`
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: ${effIconW} !important;
                        height: ${effIconW} !important;
                        flex: 0 0 auto !important;
                        flex-shrink: 0 !important;
                        visibility: visible !important;
                    `, iconTargets, `nnAnimated_${effIconW}`);
                    grouper.add(`display: none !important;`, hideSvgSpanSels, `nnDisplayNone`);
                } else {
                    grouper.add(`
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: ${effIconW} !important;
                        height: ${effIconW} !important;
                        flex: 0 0 auto !important;
                        flex-shrink: 0 !important;
                        background-color: ${iconColor || color.hex || textCol} !important;
                        -webkit-mask-image: url("data:image/svg+xml,${iconSvg}") !important;
                        mask-image: url("data:image/svg+xml,${iconSvg}") !important;
                        -webkit-mask-repeat: no-repeat !important;
                        mask-repeat: no-repeat !important;
                        -webkit-mask-position: center !important;
                        mask-position: center !important;
                        -webkit-mask-size: contain !important;
                        mask-size: contain !important;
                        content: "" !important;
                        opacity: 0.85 !important;
                        visibility: visible !important;
                    `, iconTargets, `nnSvg_${iconColor || color.hex || textCol}_${iconSvg}_${effIconW}`);
                    grouper.add(`display: none !important;`, hideSvgSpanSels, `nnDisplayNone`);
                }
            }
        } else {
            const fallbackSvg = isFolder ? CF_FOLDER_CLOSED : CF_FILE_DEFAULT;
            grouper.add(`
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: ${effIconW} !important;
                height: ${effIconW} !important;
                flex: 0 0 auto !important;
                flex-shrink: 0 !important;
                background-color: ${iconColor || color.hex || textCol} !important;
                -webkit-mask-image: url("data:image/svg+xml,${fallbackSvg}") !important;
                mask-image: url("data:image/svg+xml,${fallbackSvg}") !important;
                -webkit-mask-repeat: no-repeat !important;
                mask-repeat: no-repeat !important;
                -webkit-mask-position: center !important;
                mask-position: center !important;
                -webkit-mask-size: contain !important;
                mask-size: contain !important;
                content: "" !important;
                opacity: 0.65 !important;
                visibility: visible !important;
            `, iconTargets, `nnFallback_${fallbackSvg}_${effIconW}_${(iconColor || color.hex || textCol).replace(/\s+/g, '')}`);
            grouper.add(`display: none !important;`, hideAllChildSels, `nnDisplayNone`);
        }

        const hoverBody = `
            background-color: rgba(${color.rgb}, ${Math.min(1.0, (isFolder ? bgAlpha : (outlineOnly ? Math.max(bgAlpha, 0.12) : Math.max(bgAlpha, 0.18))) + 0.08)}) !important;
            filter: brightness(1.03) !important;
            z-index: 2 !important;
        `;
        grouper.add(hoverBody, baseSels.map(b => `${b}:hover`), `nnHover_${color.hex}_${bgAlpha}_${isFolder}_${outlineOnly}`);

        const metadataCol = `rgba(${color.rgb}, 0.65)`;
        const metadataSels = baseSels.flatMap(b => [
            `${b} .nn-navitem-date`,
            `${b} .nn-navitem-subtitle`,
            `${b} .nn-navitem-description`,
            `${b} .nn-file-date`
        ]);
        grouper.add(`color: ${metadataCol} !important; transition: color 0.2s ease !important;`, metadataSels, `nnMeta_${color.hex}`);

        if (isFolder) {
            const finalBgAlpha = outlineOnly ? 0 : bgAlpha;
            const finalBorderAlpha = outlineOnly ? 0.9 : 0.8;
            grouper.add(`
                --cf-color: ${color.hex};
                --cf-colored: 1;
                --cf-color-rgb: ${color.rgb};
                --cf-bg-alpha: ${finalBgAlpha};
                background-color: rgba(${color.rgb}, ${finalBgAlpha}) !important;
                border-left: ${nnThick}px solid rgba(${color.rgb}, ${finalBorderAlpha}) !important;
                border-radius: ${L.radius}px !important;
                ${tintOp > 0 ? `background-blend-mode: overlay;` : ''}
                transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
                margin-bottom: ${L.spacing}px !important;
            `, baseSels, `nnFolderBg_${color.hex}_${finalBgAlpha}_${finalBorderAlpha}_${tintOp}`);
        } else if (shouldColor) {
            const fileBg = outlineOnly ? Math.max(bgAlpha, 0.12) : Math.max(bgAlpha, 0.18);
            // Hand-picked text/icon colors for this palette color, when auto contrast is off for it.
            const filePair = NotebookNavigatorIntegration.activePairs.get(color.hex.toLowerCase());
            const filePairVars = filePair
                ? `${filePair.text ? `--cf-pair-text: ${filePair.text};` : ''}
                ${filePair.icon ? `--cf-pair-icon: ${filePair.icon};` : ''}`
                : '';
            const filePairKey = filePair ? `1_${filePair.text || ''}_${filePair.icon || ''}` : '0';
            grouper.add(`
                --cf-color: ${color.hex};
                --cf-colored: 1;
                --cf-color-rgb: ${color.rgb};
                ${filePairVars}
                --cf-bg-alpha: ${fileBg};
                background-color: rgba(${color.rgb}, ${fileBg}) !important;
                border-left: ${nnThick}px solid rgba(${color.rgb}, 0.6) !important;
                opacity: 1.0 !important;
                color: ${textCol} !important;
                font-weight: ${isBold ? L.weight : 'normal'} !important;
                font-style: ${isItalic ? 'italic' : 'normal'} !important;
                border-radius: ${L.radius}px;
                transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
                margin-bottom: ${L.spacing}px !important;
            `, baseSels, `nnFileBg_${color.hex}_${fileBg}_${textCol}_${isBold}_${isItalic}_${filePairKey}`);
        }

        if (shouldColor) {
            grouper.add(`
                border-left: ${outlineOnly ? 0 : nnThick}px solid rgba(${color.rgb}, ${outlineOnly ? 0 : tintOp}) !important;
                ${!outlineOnly ? 'padding-left: 4px !important;' : ''}
                margin-left: ${L.spacing}px !important;
            `, baseSels.map(b => `body ${b}`), `nnBase_${color.hex}_${outlineOnly}_${tintOp}`);

            grouper.add(`
                color: ${textCol} !important;
                ${isBold ? `font-weight: ${L.weight} !important;` : ''}
                ${isItalic ? 'font-style: italic !important;' : ''}
            `, baseSels.flatMap(b => [`body ${b} ${nameSel}`, `body ${b} ${countSel}`]), `nnName_${textCol}_${isBold}_${isItalic}`);
        }

        // Active / Selected Glow (Premium)
        const activeSel = `body .notebook-navigator .is-active[data-path="${safePath}"]`;
        
        grouper.add(`
            background-color: ${activeBg} !important;
            ${activeGlow ? `box-shadow: 0 4px 12px rgba(${color.rgb}, 0.2) !important;` : `box-shadow: none !important;`}
            border-left: ${activeThick}px solid rgba(${color.rgb}, 1.0) !important;
            --cf-rgb: ${color.rgb};
            color: ${activeText} !important;
            z-index: 20 !important;
        `, [activeSel], `nnActive_${activeBg}_${activeText}_${activeGlow}_${color.hex}`);
        
        grouper.add(`
            color: ${activeText} !important;
            ${isBold ? `font-weight: ${L.weight} !important;` : ''}
        `, [`${activeSel} ${nameSel}`], `nnActiveName_${activeText}_${isBold}`);
        
        grouper.add(`
            color: ${activeText} !important;
        `, [`${activeSel} ${countSel}`], `nnActiveCount_${activeText}`);
    }

    static initDeferredIntegration(plugin: IColorfulFoldersPlugin) {
        if (!this.isSupported(plugin.settings)) return;

        let attempts = 0;
        const maxAttempts = 10;
        const interval = 1500;
        let registeredMenus = false;

        const tryAttach = (): boolean => {
            try {
                interface InternalApp extends obsidian.App {
                    plugins?: {
                        getPlugin(id: string): Record<string, unknown> | null;
                    };
                }

                const app = plugin.app as InternalApp;
                if (!app.plugins || typeof app.plugins.getPlugin !== 'function') return false;

                const nnInstance = app.plugins.getPlugin('notebook-navigator');
                if (!nnInstance) return false;

                const nnPlugin = ((nnInstance as { api?: NNPlugin }).api || nnInstance) as NNPlugin;

                if (!registeredMenus && typeof nnPlugin.registerFileMenu === 'function' && typeof nnPlugin.registerFolderMenu === 'function') {
                    nnPlugin.registerFileMenu((menu: obsidian.Menu, file: obsidian.TAbstractFile) => {
                        MenuHelper.addContextMenuItems(menu, file, plugin);
                    });

                    nnPlugin.registerFolderMenu((menu: obsidian.Menu, folder: obsidian.TAbstractFile) => {
                        MenuHelper.addContextMenuItems(menu, folder, plugin);
                    });
                    registeredMenus = true;
                }

                // Check if NN containers exist yet in any active document
                let hasNNContainers = false;
                const docs: Document[] = [activeDocument];
                plugin.app.workspace.iterateAllLeaves((leaf) => {
                    const doc = leaf.view?.containerEl?.ownerDocument;
                    if (doc && !docs.includes(doc)) docs.push(doc);
                });

                for (const doc of docs) {
                    if (doc.querySelector(NN_SELECTORS.CONTAINERS)) {
                        hasNNContainers = true;
                        break;
                    }
                }

                if (hasNNContainers) {
                    plugin.invalidateExplorerContainersCache();
                    void plugin.generateStyles();
                    return registeredMenus;
                }

                return false;
            } catch {
                return false;
            }
        };

        // Schedule after initial startup idle window
        const scheduleDeferred = (fn: () => void) => {
            const win = window as unknown as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
            if (typeof win.requestIdleCallback === 'function') {
                win.requestIdleCallback(fn, { timeout: 3000 });
            } else {
                window.setTimeout(fn, 1500);
            }
        };

        scheduleDeferred(() => {
            if (plugin._isUnloading) return;
            if (!tryAttach()) {
                const timer = window.setInterval(() => {
                    attempts++;
                    if (plugin._isUnloading || tryAttach() || attempts >= maxAttempts) {
                        window.clearInterval(timer);
                    }
                }, interval);
            }
        });

        // Refresh container cache when workspace layout or active leaf changes
        try {
            plugin.registerEvent(
                plugin.app.workspace.on('layout-change', () => {
                    if (plugin._isUnloading) return;
                    plugin.invalidateExplorerContainersCache();
                    if (!registeredMenus) {
                        tryAttach();
                    }
                })
            );
        } catch {
            // Silently ignore if workspace unavailable
        }
    }
}
