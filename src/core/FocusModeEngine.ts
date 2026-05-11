import { ColorfulFoldersSettings, StyleContext } from '../common/types';
import { safeEscape } from '../common/utils';

export class FocusModeEngine {
    /**
     * Generates all CSS required for the "Strict Spotlight" Focus Mode.
     * @param settings The global plugin settings
     * @param context The current style context (contains the active path)
     * @returns A string containing the raw CSS rules to inject
     */
    static generateCss(settings: ColorfulFoldersSettings, context: StyleContext): string {
        if (!settings.focusMode || !context.activePath) {
            return "";
        }

        let css = "";
        
        // Tier 3: The Background Dimming
        css += this.generateBackgroundDimming(settings);

        // Tier 2: The Siblings (Optional)
        if (settings.focusShowSiblings) {
            css += this.generateSiblingRules(settings, context.activePath);
        }

        // Tier 1: The Strict Spotlight (Active File and Immediate Parent)
        css += this.generateStrictSpotlight(context.activePath);

        return css;
    }

    private static generateBackgroundDimming(settings: ColorfulFoldersSettings): string {
        // Hardened spotlight intensity
        const baseIntensity = settings.focusModeIntensity ?? 0.15;
        const bgOpacity = Math.max(0.2, 0.8 - (baseIntensity * 2));
        const focusFilter = settings.focusGrayscale 
            ? `grayscale(1) contrast(1.1) brightness(${bgOpacity + 0.1})` 
            : `contrast(1.1) brightness(${bgOpacity + 0.1})`;

        return `
            /* TIER 3: THE BACKGROUND (Deep Dimming) */
            .nav-file-title, 
            .nav-folder-title,
            .cf-interactive-divider {
                opacity: ${bgOpacity} !important;
                filter: ${focusFilter} !important;
                will-change: auto;
            }
            
            /* TIER 3b: Root Connectors and Path Lines (Dimmed) */
            .nav-folder-children,
            .tree-item-children {
                border-left: 2.5px solid rgba(var(--cf-rgb, 100, 100, 100), ${bgOpacity * 0.2}) !important;
                border-bottom: 2.5px solid rgba(var(--cf-rgb, 100, 100, 100), ${bgOpacity * 0.2}) !important;
                border-bottom-left-radius: 8px !important;
                margin-left: 12px !important;
                padding-left: 0 !important;
            }
        `;
    }

    private static generateSiblingRules(settings: ColorfulFoldersSettings, activePath: string): string {
        const parts = activePath.split('/');
        if (parts.length === 0) return "";

        const parentPath = parts.slice(0, -1).join('/');
        
        const baseIntensity = settings.focusModeIntensity ?? 0.15;
        const bgOpacity = Math.max(0.2, 0.8 - (baseIntensity * 2));
        const siblingOpacity = Math.min(0.7, bgOpacity * 2);

        if (parentPath) {
            const safeParent = safeEscape(parentPath);
            return `
                /* TIER 2: SIBLINGS (Capped Opacity) */
                .nav-folder:has(> .nav-folder-title[data-path="${safeParent}"]) > .nav-folder-children > .nav-file-title,
                .nav-folder:has(> .nav-folder-title[data-path="${safeParent}"]) > .nav-folder-children > .nav-folder-title,
                .tree-item:has(> .tree-item-self[data-path="${safeParent}"]) > .tree-item-children > .tree-item-self {
                    opacity: ${Math.min(0.7, siblingOpacity)} !important;
                    filter: none !important;
                }
            `;
        } else {
            return `
                /* TIER 2: ROOT SIBLINGS */
                .nav-files-container > div > .nav-file-title,
                .nav-files-container > div > .nav-folder-title {
                    opacity: ${siblingOpacity} !important;
                    filter: none !important;
                }
            `;
        }
    }

    private static generateStrictSpotlight(activePath: string): string {
        const safeActivePath = safeEscape(activePath);
        let css = `
            /* TIER 1a: THE ACTIVE FILE (Crystal Clarity) */
            .nav-file-title[data-path="${safeActivePath}"],
            .tree-item-self[data-path="${safeActivePath}"] {
                opacity: 1 !important;
                filter: none !important;
            }
        `;

        const parts = activePath.split('/');
        let currentPath = '';
        
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            const sc = safeEscape(currentPath);
            const isImmediateParent = i === parts.length - 2;
            
            if (isImmediateParent) {
                // ONLY THE IMMEDIATE PARENT GETS BRIGHT
                css += `
                    /* TIER 1b: THE IMMEDIATE PARENT (Spotlight Glow) */
                    .nav-folder-title[data-path="${sc}"],
                    .tree-item-self[data-path="${sc}"],
                    .tree-item-inner[data-path="${sc}"] {
                        opacity: 1 !important;
                        filter: none !important;
                        background-color: rgba(var(--cf-rgb, var(--interactive-accent-rgb)), 0.2) !important;
                        box-shadow: inset 4px 0 0 -2px rgb(var(--cf-rgb, var(--interactive-accent-rgb))), 0 0 15px rgba(var(--cf-rgb), 0.15) !important;
                        font-weight: 700 !important;
                    }
                    .nav-folder:has(> .nav-folder-title[data-path="${sc}"]) > .nav-folder-children {
                        opacity: 1 !important;
                        filter: none !important;
                        border-left: 2.5px solid rgba(var(--cf-rgb, var(--interactive-accent-rgb)), 0.6) !important;
                        border-bottom: 2.5px solid rgba(var(--cf-rgb, var(--interactive-accent-rgb)), 0.6) !important;
                        border-bottom-left-radius: 8px !important;
                        box-shadow: -2px 0 8px -2px rgba(var(--cf-rgb), 0.2);
                    }
                `;
            }
        }

        css += `
            /* HOVER BEAM: Restoration for usability */
            body:not(.is-mobile) .nav-file-title:hover,
            body:not(.is-mobile) .nav-folder-title:hover,
            body:not(.is-mobile) .cf-interactive-divider:hover {
                opacity: 1 !important;
                filter: none !important;
            }
        `;

        return css;
    }
}
