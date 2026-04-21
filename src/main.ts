import * as obsidian from 'obsidian';
import { 
    ColorfulFoldersSettings, 
    FolderStyle, 
    EffectiveStyle, 
    IColorfulFoldersPlugin
} from './common/types';
import { 
    DEFAULT_SETTINGS, 
    PALETTES 
} from './common/constants';
import { 
    getAutoIconData, 
    adjustBrightnessRgb, 
    hexToRgbObj,
    anyToHex,
    parseCustomPalette,
    hashString
} from './common/utils';
import { ColorPickerModal } from './ui/modals/ColorPickerModal';
import { DividerModal } from './ui/modals/DividerModal';
import { ColorfulFoldersSettingTab } from './ui/SettingTab';
import { PasswordModal } from './ui/modals/PasswordModal';
import { StyleGenerator } from './core/StyleGenerator';
import { DividerManager } from './core/DividerManager';
import { NotebookNavigatorIntegration } from './integrations/NotebookNavigator';

import { MenuHelper } from './ui/MenuHelper';

export default class ColorfulFoldersPlugin extends obsidian.Plugin implements IColorfulFoldersPlugin {
    settings: ColorfulFoldersSettings;
    styleTag: HTMLStyleElement;
    uiStyleTag: HTMLStyleElement;
    iconCache: Map<string, string> = new Map();
    heatmapCache: Map<string, number> | null = null;
    generateStylesDebounced: obsidian.Debouncer<[], void>;
    dividerObserver: MutationObserver | null = null;
    styleObserver: MutationObserver | null = null;
    dividerManager: DividerManager;
    isSyncingDividers: boolean = false;
    processDividersDebounced: obsidian.Debouncer<[], void>;
    ribbonEl: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.dividerManager = new DividerManager(this);
        this.initDividerObserver();

        // Register Notebook Navigator extensions
        this.app.workspace.onLayoutReady(() => {
            NotebookNavigatorIntegration.registerMenuExtensions(this);
        });

        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.generateStylesDebounced = obsidian.debounce(() => {
            this.generateStyles();
            this.initDividerObserver();
        }, 300, true);

        this.processDividersDebounced = obsidian.debounce(() => {
            if (this.isSyncingDividers) return;
            this.dividerManager.syncDividers();
        }, 50, true);

        this.refreshRibbon();

        this.uiStyleTag = activeDocument.createElement('style');
        this.uiStyleTag.id = 'colorful-folders-ui-style';
        this.uiStyleTag.textContent = `
            /* Premium Sliders styling */
            .colorful-folders-config .setting-item-control input[type="range"] {
                width: 160px !important;
                height: 8px !important;
                background: rgba(0, 0, 0, 0.2) !important;
                border-radius: 10px !important;
                appearance: none !important;
                cursor: pointer !important;
                border: 1px solid var(--background-modifier-border) !important;
            }
            .colorful-folders-config .setting-item-control input[type="range"]::-webkit-slider-thumb {
                appearance: none !important;
                width: 20px !important;
                height: 200px !important; /* Overridden below */
                height: 20px !important;
                background: var(--interactive-accent) !important;
                border: 3px solid var(--background-primary) !important;
                border-radius: 50% !important;
                box-shadow: 0 3px 10px rgba(0,0,0,0.4) !important;
                transition: transform 0.15s ease !important;
            }
            .colorful-folders-config .setting-item-control input[type="range"]:active::-webkit-slider-thumb {
                transform: scale(1.2);
            }
            @keyframes cf-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .is-invalid {
                border-color: var(--text-error) !important;
                animation: cf-shake 0.2s ease-in-out 0s 2 !important;
            }
        `;
        activeDocument.head.appendChild(this.uiStyleTag);

        this.initializeStyles();

        this.registerCustomIcons();
        this.registerEvents();
        this.registerCommands();
        this.initStyleObserver();
        
        // Initial stealth mode state
        activeDocument.body.classList.toggle('cf-show-hidden', this.settings.showHiddenItems);

        this.app.workspace.onLayoutReady(() => {
            this.generateStyles();
            this.initDividerObserver();
        });
    }

    initializeStyles() {
        this.styleTag = activeDocument.createElement('style');
        this.styleTag.id = 'colorful-folders-styles';
        activeDocument.head.appendChild(this.styleTag);
    }

    onunload() {
        if (this.styleTag) this.styleTag.remove();
        if (this.uiStyleTag) this.uiStyleTag.remove();
        if (this.dividerObserver) this.dividerObserver.disconnect();
        if (this.styleObserver) this.styleObserver.disconnect();

        this.cleanDividers();
    }

    cleanDividers() {
        activeDocument.querySelectorAll('.cf-has-divider').forEach(el => el.classList.remove('cf-has-divider'));
        this.dividerManager.clean();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ColorfulFoldersSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.iconCache.clear();
        this.generateStylesDebounced();
    }

    registerCustomIcons() {
        for (const [id, svg] of Object.entries(this.settings.customIcons)) {
            obsidian.addIcon(id, svg);
        }
    }

    registerEvents() {
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                MenuHelper.addContextMenuItems(menu, file, this);
            })
        );


        this.registerEvent(this.app.workspace.on('layout-change', () => this.initDividerObserver()));
        this.registerEvent(this.app.workspace.on('css-change', () => this.generateStyles()));

        this.registerEvent(this.app.vault.on('create', () => {
            this.heatmapCache = null;
            this.generateStylesDebounced();
        }));
        this.registerEvent(this.app.vault.on('delete', () => {
            this.heatmapCache = null;
            this.generateStylesDebounced();
        }));
        this.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {
            this.heatmapCache = null;
            if (this.settings.customFolderColors[oldPath]) {
                const style = this.settings.customFolderColors[oldPath];
                this.settings.customFolderColors[file.path] = style;
                delete this.settings.customFolderColors[oldPath];
                

                for (const key of Object.keys(this.settings.customFolderColors)) {
                    if (key.startsWith(oldPath + '/')) {
                        const newKey = file.path + key.slice(oldPath.length);
                        this.settings.customFolderColors[newKey] = this.settings.customFolderColors[key];
                        delete this.settings.customFolderColors[key];
                    }
                }
                await this.saveSettings();
            } else {
                this.generateStylesDebounced();
            }
        }));
    }

    registerCommands() {
        this.addCommand({
            id: 'open-color-picker',
            name: 'Open color picker for current file',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file) {
                    if (!checking) new ColorPickerModal(this.app, this, file).open();
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'clear-current-style',
            name: 'Clear style for current file',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file && this.settings.customFolderColors[file.path]) {
                    if (!checking) {
                        delete this.settings.customFolderColors[file.path];
                        void this.saveSettings();
                        new obsidian.Notice(`Cleared style for ${file.name}`);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'add-divider-current',
            name: 'Add/edit divider for current file',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file) {
                    if (!checking) {
                        new DividerModal(this.app, this, file).open();
                    }
                    return true;
                }

                return false;
            }
        });

        this.addCommand({
            id: 'remove-divider-current',
            name: 'Remove divider for current file',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file) {
                    const style = this.getStyle(file.path);
                    if (style && style.hasDivider) {
                        if (!checking) {
                            style.hasDivider = false;
                            void this.saveSettings();
                            this.generateStyles();
                            this.dividerManager.syncDividers();
                            new obsidian.Notice(`Removed divider for ${file.name}`);
                        }
                        return true;
                    }
                }
                return false;
            }
        });
        this.addCommand({
            id: 'toggle-stealth-mode',
            name: 'Toggle stealth mode',
            callback: () => {
                void this.toggleStealthMode();
            }
        });
    }

    async toggleStealthMode() {
        const applyToggle = async () => {
            this.settings.showHiddenItems = !this.settings.showHiddenItems;
            await this.saveSettings();
            this.generateStyles();
            new obsidian.Notice(`Stealth mode: ${this.settings.showHiddenItems ? 'Ghost' : 'Hidden'}`);
        };

        if (this.settings.vaultPassword && this.settings.isVaultLocked) {
            new PasswordModal(this.app, "Unlock stealth mode", async (pass) => {
                if (pass === this.settings.vaultPassword) {
                    this.settings.isVaultLocked = false;
                    await applyToggle();
                    return true;
                } else {
                    new obsidian.Notice("Incorrect password!");
                    return false;
                }
            }).open();
        } else {
            await applyToggle();
        }
    }

    refreshRibbon() {
        if (this.ribbonEl) {
            this.ribbonEl.remove();
            this.ribbonEl = null;
        }
        if (this.settings.showRibbonIcon) {
            this.ribbonEl = this.addRibbonIcon('eye-off', 'Toggle stealth mode', () => {
                void this.toggleStealthMode();
            });
        }
    }


    getStyle(path: string): FolderStyle | null {
        const style = this.settings.customFolderColors[path];
        if (!style) return null;
        if (typeof style === 'string') return { hex: style };
        return style;
    }

    getEffectiveStyle(target: obsidian.TAbstractFile): EffectiveStyle {
        try {
            const isDark = activeDocument.body.classList.contains('theme-dark');
            const brightnessAmount = (isDark ? this.settings.darkModeBrightness : this.settings.lightModeBrightness) / 100;
            const cycleOff = this.settings.cycleOffset || 0;

            // Build palette (same logic as StyleGenerator)
            let palette = PALETTES[this.settings.palette] || PALETTES['Muted Dark Mode'];
            if (this.settings.palette === 'Custom') {
                const custom = parseCustomPalette(this.settings.customPalette);
                if (custom) palette = custom;
            }
            if (!isDark) {
                palette = palette.map(c => {
                    const darker = adjustBrightnessRgb(c.rgb, -0.15);
                    const p = darker.split(',').map(s => parseInt(s.trim()));
                    const hex = '#' + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
                    return { rgb: darker, hex };
                });
            }

            const isFile = target instanceof obsidian.TFile;
            const path = target.path;

            // Direct custom style check
            let customStyle = this.getStyle(path);

            // Climb parents for inherited style
            let inheritedStyle: FolderStyle | null = null;
            let parent = target.parent;
            while (parent && !parent.isRoot()) {
                const pStyle = this.getStyle(parent.path);
                if (pStyle && (pStyle.applyToSubfolders || (isFile && pStyle.applyToFiles))) {
                    inheritedStyle = pStyle;
                    break;
                }
                parent = parent.parent;
            }

            // --- Compute positional index (simulating StyleGenerator's validIndex) ---
            // depth: how many levels below root
            const segments = path.split('/').filter(s => s.length > 0);
            const depth = isFile ? segments.length - 1 : segments.length - 1;

            const excludeFolders = (this.settings.exclusionList || "").toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0);

            // Get sorted siblings to find validIndex (ACCOUNTING FOR EXCLUSIONS)
            const parentFolder = target.parent;
            let validIndex = 0;
            if (parentFolder) {
                const siblings = parentFolder.children
                    .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                    .filter(c => !excludeFolders.includes(c.name.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                if (!isFile) {
                    validIndex = siblings.findIndex(s => s.path === path);
                    if (validIndex < 0) validIndex = 0;
                } else {
                    // For files, validIndex is 0 at the start of StyleGenerator's traverse
                    validIndex = 0;
                }
            }

            // Get rootIndex: position of the ancestor at depth 0 (ACCOUNTING FOR EXCLUSIONS)
            let rootIndex = 0;
            if (depth > 0) {
                const rootFolder = this.app.vault.getRoot();
                const rootSegment = segments[0];
                const rootSiblings = rootFolder.children
                    .filter((c): c is obsidian.TFolder => c instanceof obsidian.TFolder)
                    .filter(c => !excludeFolders.includes(c.name.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name));
                rootIndex = rootSiblings.findIndex(s => s.name === rootSegment);
                if (rootIndex < 0) rootIndex = 0;
            }

            // --- Helper: Calculate a folder's color based on its position ---
            const getFolderColor = (vIdx: number, d: number, rIdx: number, itemPath: string) => {
                if (this.settings.colorMode === 'heatmap') {
                    const heatmapCache = this.heatmapCache || new Map<string, number>();
                    const mtime = heatmapCache.get(itemPath) || 0;
                    const diffDays = mtime ? (Date.now() - mtime) / (1000 * 60 * 60 * 24) : Infinity;
                    if (diffDays <= 1) return palette[0];
                    if (diffDays <= 3) return palette[Math.min(2, palette.length - 1)];
                    if (diffDays <= 7) return palette[Math.min(7, palette.length - 1)];
                    if (diffDays <= 15) return palette[Math.min(4, palette.length - 1)];
                    if (diffDays <= 30) return palette[Math.min(10, palette.length - 1)];
                    return palette[palette.length - 1];
                } else if (this.settings.colorMode === 'monochromatic') {
                    if (d === 0) return palette[vIdx % palette.length];
                    return palette[rIdx % palette.length];
                } else {
                    return palette[(vIdx + d + rIdx + cycleOff) % palette.length];
                }
            };

            // --- Compute live color ---
            let color: { rgb: string; hex: string };

            if (customStyle && customStyle.hex) {
                const cp = parseCustomPalette(customStyle.hex);
                const rgb = hexToRgbObj(customStyle.hex);
                color = cp ? cp[0] : { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: customStyle.hex };
            } else if (inheritedStyle && inheritedStyle.hex) {
                const cp = parseCustomPalette(inheritedStyle.hex);
                const rgb = hexToRgbObj(inheritedStyle.hex);
                color = cp ? cp[0] : { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: inheritedStyle.hex };
            } else if (isFile) {
                const parentColor = parentFolder && !parentFolder.isRoot() ? getFolderColor(0, depth - 1, rootIndex, parentFolder.path) : null;
                const isNNActive = this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground;
                
                if (inheritedStyle && inheritedStyle.applyToFiles && parentColor) {
                    const hObj = hexToRgbObj(inheritedStyle.hex || parentColor.hex);
                    const nameHash = hashString(target.name);
                    const offset = ((nameHash % 5) - 2) * 5;
                    color = {
                        rgb: `${Math.max(0, Math.min(255, hObj.r + offset))}, ${Math.max(0, Math.min(255, hObj.g + offset))}, ${Math.max(0, Math.min(255, hObj.b + offset))}`,
                        hex: inheritedStyle.hex || parentColor.hex
                    };
                } else if (this.settings.autoColorFiles || isNNActive) {
                    const nameHash = hashString(target.name);
                    color = palette[(validIndex + nameHash + cycleOff) % palette.length];
                } else {
                    color = parentColor || { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" };
                }
            } else {
                color = getFolderColor(validIndex, depth, rootIndex, path);
            }

            // --- Compute live opacity ---
            let effOpacity: number;
            if (customStyle && customStyle.opacity !== undefined) {
                effOpacity = customStyle.opacity;
            } else if (isFile) {
                const isAutoOn = this.settings.autoColorFiles || (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground);
                if (isAutoOn || (inheritedStyle && inheritedStyle.applyToFiles)) {
                    effOpacity = this.settings.fileBackgroundOpacity !== undefined ? this.settings.fileBackgroundOpacity : (isDark ? 0.1 : 0.15);
                } else {
                    effOpacity = 0.0;
                }
            } else if (depth === 0) {
                if (this.settings.rootStyle === 'solid') {
                    effOpacity = 1.0;
                } else {
                    effOpacity = this.settings.rootTintOpacity !== undefined ? this.settings.rootTintOpacity : 0.06;
                }
            } else {
                effOpacity = this.settings.subfolderOpacity !== undefined ? this.settings.subfolderOpacity : 0.4;
            }

            // Text color
            let effText = (customStyle && customStyle.textColor) ? customStyle.textColor
                : (inheritedStyle ? inheritedStyle.textColor : null);
            if (!effText) {
                const contrastColor = isDark ? "#ffffff" : "#111111";
                if (depth === 0 && this.settings.rootStyle === 'solid' && !this.settings.outlineOnly && !isFile) {
                    effText = contrastColor;
                } else {
                    const adjust = isDark ? Math.max(brightnessAmount, 0) : (brightnessAmount === 0 ? -0.5 : brightnessAmount);
                    effText = (isDark && adjust === 0) ? color.hex : `rgb(${adjustBrightnessRgb(color.rgb, adjust)})`;
                }
            }

            const effIconColor = (customStyle && customStyle.iconColor) ? customStyle.iconColor
                : (inheritedStyle ? inheritedStyle.iconColor : color.hex);
            const autoIcon = getAutoIconData(target.name, this.settings, isFile);

            return {
                hex: anyToHex(color.hex),
                textColor: effText ? anyToHex(effText) : '',
                iconColor: anyToHex(effIconColor || color.hex),
                iconId: (customStyle && customStyle.iconId) ? customStyle.iconId
                    : (this.settings.autoIcons && autoIcon ? (this.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji) : ''),
                opacity: effOpacity,
                isBold: (customStyle && customStyle.isBold !== undefined) ? !!customStyle.isBold
                    : (inheritedStyle ? !!inheritedStyle.isBold : true),
                isItalic: (customStyle && customStyle.isItalic !== undefined) ? !!customStyle.isItalic
                    : (inheritedStyle ? !!inheritedStyle.isItalic : false),
                applyToSubfolders: customStyle ? !!customStyle.applyToSubfolders : false,
                applyToFiles: customStyle ? !!customStyle.applyToFiles : false
            };
        } catch {
            return { hex: '#ffffff', textColor: '#000000', iconColor: '#000000', iconId: '', opacity: 1, isBold: true, isItalic: false, applyToSubfolders: false, applyToFiles: false };
        }
    }


    generateStyles() {
        if (this.styleTag) {
            this.styleTag.textContent = new StyleGenerator(this).generateCss();
            activeDocument.body.classList.toggle('cf-show-hidden', this.settings.showHiddenItems);
        }
    }

    private isScrolling = false;
    private scrollTimeout: number | null = null;

    initDividerObserver() {
        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }

        const containers = Array.from(activeDocument.querySelectorAll('.nav-files-container'));
        const extraContainers = Array.from(NotebookNavigatorIntegration.getExtraContainers(activeDocument));
        const allContainers = [...containers, ...extraContainers];

        if (allContainers.length === 0) return;

        allContainers.forEach(container => {
            // Detect scrolling to suppress sync bursts
            container.addEventListener('scroll', () => {
                this.isScrolling = true;
                activeWindow.clearTimeout(this.scrollTimeout);
                this.scrollTimeout = activeWindow.setTimeout(() => {
                    this.isScrolling = false;
                    this.processDividers();
                }, 100);
            }, { passive: true });
        });

        this.dividerObserver = new MutationObserver((mutations) => {
            if (this.isSyncingDividers || this.isScrolling) return;

            let hasRelevantChange = false;
            for (const m of mutations) {
                if (m.type !== 'childList') continue;
                for (const node of Array.from(m.addedNodes)) {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        !(node as HTMLElement).classList.contains('cf-interactive-divider')) {
                        hasRelevantChange = true;
                        break;
                    }
                }
                if (hasRelevantChange) break;
                for (const node of Array.from(m.removedNodes)) {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        !(node as HTMLElement).classList.contains('cf-interactive-divider')) {
                        hasRelevantChange = true;
                        break;
                    }
                }
                if (hasRelevantChange) break;
            }

            if (hasRelevantChange) {
                this.processDividers();
            }
        });

        containers.forEach(container => {
            this.dividerObserver?.observe(container, { childList: true, subtree: true });
        });
    }

    processDividers() {
        if (this.isSyncingDividers || this.isScrolling) return;
        if (this.processDividersDebounced) this.processDividersDebounced();
    }
    


    async cleanUnusedStyles() {
        let count = 0;
        const keys = Object.keys(this.settings.customFolderColors);
        for (const path of keys) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!file) {
                delete this.settings.customFolderColors[path];
                count++;
            }
        }
        if (count > 0) {
            await this.saveSettings();
            new obsidian.Notice(`Cleaned up ${count} stale style entries.`);
        } else {
            new obsidian.Notice("No stale style entries found. Your configuration is clean!");
        }
    }

    initStyleObserver() {
        if (this.styleObserver) this.styleObserver.disconnect();
        this.styleObserver = new MutationObserver(() => {
            this.generateStylesDebounced();
        });
        this.styleObserver.observe(activeDocument.body, { attributes: true, attributeFilter: ['class'] });
    }
}
