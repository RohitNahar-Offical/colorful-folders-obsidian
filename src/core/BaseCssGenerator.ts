import { ColorfulFoldersSettings } from '../common/types';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';
import { safeEscape } from '../common/utils';

export function generateGlobalBaseCss(settings: ColorfulFoldersSettings): string {
    return `
        /* ── NUCLEAR SPECIFICITY NAV ITEM LAYOUT ───────────────────────────────
           We use high-specificity selectors to defeat theme overrides (like Prism).
        ──────────────────────────────────────────────────────────────────────── */
        /* ── FOLDER NOTE INTEGRATION & CONFLICT PREVENTION ────────────────── */
        body .is-folder-note,
        body .is-folder-note-hidden,
        body .fn-hidden,
        body .folder-note-hidden,
        body .cf-fn-hidden,
        body [data-folder-note="true"],
        body [data-is-folder-note="true"] {
            display: none !important;
        }

        body .nav-folder-title:not([style*="display: none"]),
        body .nav-file-title:not([style*="display: none"]),
        body .tree-item-self:not([style*="display: none"]):not(.is-folder-note):not(.fn-hidden) {
            display: flex;
            align-items: center !important;
            justify-content: flex-start !important;
            overflow: visible !important;
        }



        /* Force all immediate children and pseudo-elements to perfectly center vertically */
        body .nav-folder-title > *,
        body .nav-file-title > *,
        body .tree-item-self > *,
        body .nav-folder-title:not(.nn-navitem)::before,
        body .nav-file-title:not(.nn-file)::before,
        body .tree-item-self:not(.nn-file):not(.nn-navitem)::before,
        body .nav-folder-title::after,
        body .nav-file-title::after,
        body .tree-item-self::after {
            align-self: center !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
        }

        body .nav-folder-collapse-indicator,
        body .tree-item-collapse-indicator,
        body .collapse-indicator,
        body .tree-item-icon.collapse-indicator,
        body .collapse-icon,
        body .tree-item-icon.collapse-icon {
            display: ${settings.showCollapseIndicator !== false ? 'flex' : 'none'} !important;
            align-items: center !important;
            justify-content: center !important;
            height: auto !important;
        }

        /* ── CONTENT ELEMENT: always flex row, icon or not ───────────────── */
        body .nav-folder-title-content,
        body .nav-file-title-content,
        body .tree-item-inner {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 6px !important;
            margin-left: 2px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            min-width: 0 !important;
            flex-grow: 1 !important;
        }

        /* ── ICON SUPPRESSION & CONFLICT PREVENTION ─────────────────────── */
        body [data-cf-path] .nav-folder-title-content > svg:not(.cf-icon-wrapper svg),
        body [data-cf-path] .nav-file-title-content > svg:not(.cf-icon-wrapper svg),
        body [data-cf-path] .tree-item-inner > svg:not(.cf-icon-wrapper svg),
        body [data-cf-path] .nav-folder-title-content > .nav-folder-icon,
        body [data-cf-path] .nav-file-title-content > .nav-file-icon,
        body [data-path] .nav-folder-title-content > svg:not(.cf-icon-wrapper svg),
        body [data-path] .nav-file-title-content > svg:not(.cf-icon-wrapper svg),
        body [data-path] .tree-item-inner > svg:not(.cf-icon-wrapper svg),
        body [data-path] .nav-folder-title-content > .nav-folder-icon,
        body [data-path] .nav-file-title-content > .nav-file-icon {
            display: none !important;
        }

        body .nav-folder-title-content.cf-icon-active::before,
        body .nav-file-title-content.cf-icon-active::before,
        body .tree-item-inner.cf-icon-active::before,
        body .nav-folder-title-content:has(.cf-icon-wrapper)::before,
        body .nav-file-title-content:has(.cf-icon-wrapper)::before,
        body .tree-item-inner:has(.cf-icon-wrapper)::before,
        body .nav-files-container [data-path] .nav-folder-title-content.cf-icon-active::before,
        body .nav-files-container [data-path] .nav-file-title-content.cf-icon-active::before,
        body .nav-files-container [data-path] .tree-item-inner.cf-icon-active::before,
        body .nav-files-container [data-path] .nav-folder-title-content:has(.cf-icon-wrapper)::before,
        body .nav-files-container [data-path] .nav-file-title-content:has(.cf-icon-wrapper)::before,
        body .nav-files-container [data-path] .tree-item-inner:has(.cf-icon-wrapper)::before {
            display: none !important;
            content: none !important;
            -webkit-mask-image: none !important;
            mask-image: none !important;
            width: 0 !important;
            height: 0 !important;
        }

        .cf-icon-wrapper {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: center !important;
            flex-shrink: 0 !important;
            overflow: visible !important;
        }

        /* ── METADATA WRAPPING RULES (FILES WITH WORD COUNT ONLY) ─────────── */
        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]),
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title),
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]),
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) {
            flex-wrap: wrap !important;
            align-items: flex-start !important;
            height: auto !important;
            max-height: none !important;
            min-height: 30px !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
            position: relative !important;
        }

        /* First-line items (indicator, icons) top-align to align with the first-line text */
        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) > *:not(::after),
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) > *:not(::after),
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) > *:not(::after),
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) > *:not(::after) {
            align-self: flex-start !important;
            margin-top: 2px !important;
        }

        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .cf-icon-wrapper,
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .cf-icon-wrapper,
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .cf-icon-wrapper,
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .cf-icon-wrapper {
            align-self: flex-start !important;
            margin-top: 2px !important;
        }

        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-title-content,
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-inner,
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-title-content,
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-inner {
            margin-top: 0 !important;
            align-self: flex-start !important;
        }

        /* Force only the ::after pseudo-element (which holds the counts) to wrap to the next line */
        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "])::after,
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title)::after,
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "])::after,
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title)::after {
            width: 100% !important;
            flex: 0 0 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            font-size: 0.85em !important;
            opacity: 0.85 !important;
            box-sizing: border-box !important;
            margin-top: 4px !important;
            padding-left: 0px !important;
            background-position: 0px center !important;
        }

        /* Position file tags and flairs on the top right so they never wrap or stretch */
        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .tree-item-flair,
        body.cf-wrap-metadata .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-tag,
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-flair,
        body.cf-wrap-metadata .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .nav-file-tag,
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .tree-item-flair,
        body.is-mobile .nav-file-title[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]) .nav-file-tag,
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .tree-item-flair,
        body.is-mobile .tree-item-self[data-novel-word-count-plugin]:not([data-novel-word-count-plugin=""]):not([data-novel-word-count-plugin=" "]):not(.nav-folder-title) .nav-file-tag {
            position: absolute !important;
            right: 14px !important;
            top: 6px !important;
            margin: 0 !important;
            height: 18px !important;
            line-height: 18px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        /* Reset the inner content wrappers */
        body .app-container .workspace-split .workspace-leaf-content[data-type="file-explorer"] .tree-item-inner,
        body .app-container .workspace-split .workspace-leaf-content[data-type="file-explorer"] .nav-folder-title-content {
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Add spacing between folders */
        body .nav-folder-title,
        body .tree-item-self {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
        }
    `;
}

export function generateDividerCss(settings: ColorfulFoldersSettings): string {
    if (!(settings.showFileDivider || Object.values(settings.customFolderColors).some((v) => typeof v === 'object' && v !== null && (v).hasDivider))) {
        return "";
    }

    const spacing = settings.dividerSpacing || 16;
    const dividerHeight = (spacing * 2) + 20;

    return `
        /* Stability: Core Divider Container - Now Layout Neutral */
        .cf-interactive-divider {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: ${dividerHeight}px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            user-select: none !important;
            z-index: 5 !important;
            padding: 0 !important;
            margin: 0 !important;
            pointer-events: all !important;
        }

        /* Parent item reserves the space for the absolute divider */
        .cf-has-divider {
            position: relative !important;
            padding-top: ${dividerHeight}px !important;
            display: flex !important;
            flex-direction: column !important;
        }

        /* Ensure folder lines/children start below the divider */
        .cf-has-divider > .nav-folder-title,
        .cf-has-divider > .nav-folder-children {
            position: relative !important;
        }

        .cf-interactive-divider:hover {
            filter: brightness(1.12);
        }
        .cf-interactive-divider:hover .cf-divider-chip {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            border-color: rgba(var(--mono-rgb-100), 0.3) !important;
        }

        /* Liquid Glass Markdown Popover */
        .cf-premium-popover {
            position: fixed !important;
            z-index: 10000 !important;
            background: rgba(26, 26, 36, 0.55) !important;
            backdrop-filter: blur(28px) saturate(210%) contrast(110%) !important;
            -webkit-backdrop-filter: blur(28px) saturate(210%) contrast(110%) !important;
            border: 1px solid rgba(255, 255, 255, 0.18) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.35) !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        0 0 24px rgba(var(--interactive-accent-rgb, 120, 120, 255), 0.12) !important;
            padding: 14px 18px !important;
            max-width: 340px !important;
            min-width: 220px !important;
            max-height: 400px !important;
            overflow-y: auto !important;
            transform: translate(-50%, -100%) !important;
            color: var(--text-normal) !important;
            font-size: 0.9em !important;
            pointer-events: auto !important;
            animation: cf-popover-appear 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .theme-light .cf-premium-popover {
            background: rgba(255, 255, 255, 0.65) !important;
            border: 1px solid rgba(0, 0, 0, 0.12) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.8) !important;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.9),
                        0 0 20px rgba(var(--interactive-accent-rgb, 120, 120, 255), 0.1) !important;
        }

        .cf-premium-popover.is-below {
            transform: translate(-50%, 0) !important;
        }

        @keyframes cf-popover-appear {
            from { opacity: 0; transform: translate(-50%, -90%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }

        .cf-premium-popover.is-below {
            animation: cf-popover-appear-below 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes cf-popover-appear-below {
            from { opacity: 0; transform: translate(-50%, -10%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }

        .cf-popover-content p {
            margin: 4px 0 !important;
        }

        .cf-divider-chip.cf-has-description {
            cursor: pointer !important;
        }
        
        .cf-divider-chip {
            display: flex !important;
            align-items: center !important;
            padding: ${settings.dividerPillMode ? '6px 20px' : '2px 6px'} !important;
            font-size: var(--cf-divider-font-size, 10.5px) !important;
            font-weight: var(--cf-divider-font-weight, 800) !important;
            letter-spacing: var(--cf-divider-letter-spacing, 0.15em) !important;
            text-transform: var(--cf-divider-text-transform, uppercase) !important;
            white-space: nowrap !important;
            border-radius: 40px !important;
            width: fit-content !important;
            max-width: 85% !important;
            gap: 0 !important;
            ${settings.dividerPillMode ? `
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(var(--mono-rgb-100), 0.15);
            ` : `
                box-shadow: none;
                border: none;
                background: transparent;
            `}
            z-index: 6 !important;
        }

        .cf-divider-emoji-icon {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 24px !important;
            font-size: 1.2em !important;
        }

        .cf-divider-icon {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 24px !important;
        }

        .cf-divider-label {
            display: block !important;
            margin: 0 12px !important;
            transform: translateX(0.075em) !important;
        }
        
        .cf-interactive-divider.is-collapsed .cf-divider-chip {
            opacity: 0.6 !important;
        }

        .cf-divider-collapse-indicator {
            display: flex !important;
            align-items: center !important;
            opacity: 0.6 !important;
            margin-left: 10px !important;
        }
        .cf-interactive-divider.is-collapsed .cf-divider-collapse-indicator {
            transform: rotate(-90deg);
        }
        
        .cf-divider-bridge {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
            gap: 0px !important;
        }
        
        .cf-divider-line {
            z-index: 4 !important;
            pointer-events: none !important;
        }
        
        .cf-divider-hidden {
            display: none !important;
        }

        /* Fix for folder vertical lines */
        .cf-has-divider > .nav-folder-children {
            border-left: none !important;
        }

        /* Premium Smart Suggester (Glassmorphism) */
        .cf-suggestion-container {
            background: rgba(25, 25, 25, 0.75) !important;
            backdrop-filter: blur(24px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            border-radius: 12px !important;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5) !important;
            overflow: hidden !important;
            min-width: 280px !important;
            animation: cf-suggestion-reveal 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cf-suggestion-reveal {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cf-suggestion {
            display: flex !important;
            flex-direction: column !important;
            padding: 6px !important;
        }

        .cf-suggestion-item {
            display: flex !important;
            align-items: center !important;
            padding: 10px 14px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            color: var(--text-normal) !important;
            font-size: 0.9em !important;
            transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, color 0.2s ease !important;
            gap: 10px !important;
        }

        .cf-suggestion-item:hover {
            background: rgba(255, 255, 255, 0.08) !important;
        }

        .cf-suggestion-item.is-selected {
            background: var(--interactive-accent) !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(var(--interactive-accent-rgb), 0.3) !important;
        }

        .cf-suggestion-content {
            flex: 1 !important;
            font-weight: 500 !important;
        }
    `;
}

export function generateStealthCss(settings: ColorfulFoldersSettings): string {
    let stealthCss = "";
    const styles = settings.customFolderColors;

    for (const path in styles) {
        const style = styles[path];
        if (typeof style === 'object' && style !== null && style.isHidden) {
            const safePath = safeEscape(path);

            stealthCss += `
                body:not(.cf-show-hidden) .nav-folder-title[data-path="${safePath}"],
                body:not(.cf-show-hidden) .nav-folder-title[data-path="${safePath}"] + .nav-folder-children,
                body:not(.cf-show-hidden) .nav-file-title[data-path="${safePath}"],
                body:not(.cf-show-hidden) .tree-item-self[data-path="${safePath}"] {
                    display: none !important;
                }

                body.cf-show-hidden .nav-folder-title[data-path="${safePath}"],
                body.cf-show-hidden .nav-file-title[data-path="${safePath}"],
                body.cf-show-hidden .tree-item-self[data-path="${safePath}"] {
                    opacity: 0.3 !important;
                    filter: grayscale(1) blur(0.5px) !important;
                }
            `;

            if (settings.notebookNavigatorSupport) {
                const nnSelector = NotebookNavigatorIntegration.getScopedNavSelector(path);
                const nnFileSelector = NotebookNavigatorIntegration.getScopedFileSelector(path);

                stealthCss += `
                    body:not(.cf-show-hidden) ${nnSelector},
                    body:not(.cf-show-hidden) ${nnFileSelector} {
                        display: none !important;
                    }

                    body.cf-show-hidden ${nnSelector},
                    body.cf-show-hidden ${nnFileSelector} {
                        opacity: 0.3 !important;
                        filter: grayscale(1) blur(0.5px) !important;
                    }
                `;
            }
        }
    }
    return stealthCss;
}
