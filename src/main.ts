import * as obsidian from 'obsidian';
import { 
    ColorfulFoldersSettings, 
    FolderStyle, 
    EffectiveStyle, 
    IColorfulFoldersPlugin,
    MenuItemWithSubmenu
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
import { StyleGenerator } from './core/StyleGenerator';
import { DividerManager } from './core/DividerManager';

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

    async onload() {
        await this.loadSettings();
        this.dividerManager = new DividerManager(this);
        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.generateStylesDebounced = obsidian.debounce(() => {
            this.generateStyles();
            this.initDividerObserver();
        }, 300, true);

        this.processDividersDebounced = obsidian.debounce(() => {
            if (this.isSyncingDividers) return;
            this.dividerManager.syncDividers();
        }, 50, true);

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
        `;
        activeDocument.head.appendChild(this.uiStyleTag);

        this.initializeStyles();

        this.registerCustomIcons();
        this.registerEvents();
        this.registerCommands();
        this.initStyleObserver();

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
                if (!(file instanceof obsidian.TAbstractFile)) return;
                const isFolder = file instanceof obsidian.TFolder;
                const label = isFolder ? 'folder' : 'file';

                menu.addItem((item) => {
                    item.setTitle(`Set custom ${label} style`)
                        .setIcon('palette');

                    const submenu = (item as MenuItemWithSubmenu).setSubmenu ? (item as MenuItemWithSubmenu).setSubmenu() : (item as unknown as obsidian.Menu);

                    submenu.addItem((sub: obsidian.MenuItem) => {
                        sub.setTitle('Open full settings')
                            .setIcon('settings')
                            .onClick(() => {
                                new ColorPickerModal(this.app, this, file).open();
                            });
                    });

                    submenu.addItem((sub: obsidian.MenuItem) => {
                        sub.setTitle('Change icon')
                            .setIcon('smile')
                            .onClick(() => {
                                new ColorPickerModal(this.app, this, file, 'icon').open();
                            });
                    });

                    submenu.addItem((sub: obsidian.MenuItem) => {
                        sub.setTitle('Change color')
                            .setIcon('pipette')
                            .onClick(() => {
                                new ColorPickerModal(this.app, this, file, 'color').open();
                            });
                    });

                    submenu.addItem((sub: obsidian.MenuItem) => {
                        sub.setTitle('Change background')
                            .setIcon('paint-bucket')
                            .onClick(() => {
                                new ColorPickerModal(this.app, this, file, 'background').open();
                            });
                    });

                    const existing = this.settings.customFolderColors[file.path];
                    if (existing) {
                        submenu.addItem((sub: obsidian.MenuItem) => {
                            sub.setTitle('Clear style')
                                .setIcon('eraser')
                                .onClick(async () => {
                                    delete this.settings.customFolderColors[file.path];
                                    await this.saveSettings();
                                    new obsidian.Notice(`Cleared style for ${file.name}`);
                                });
                        });
                    }
                });
                
                menu.addSeparator();
                const style = this.settings.customFolderColors[file.path];
                
                if (style && typeof style === 'object' && style.hasDivider) {
                    menu.addItem((item) => {
                        item.setTitle("Edit divider")
                            .setIcon('settings-2')
                            .onClick(() => {
                                new DividerModal(this.app, this, file).open();
                            });
                    });
                    
                    menu.addItem((remove) => {
                        remove.setTitle("Remove divider")
                            .setIcon('trash-2')
                            .setWarning(true)
                            .onClick(async () => {
                                const styleObj = this.settings.customFolderColors[file.path];
                                if (styleObj && typeof styleObj === 'object') {
                                    styleObj.hasDivider = false;
                                    delete styleObj.dividerText;
                                    delete styleObj.dividerColor;
                                    delete styleObj.dividerIcon;
                                    delete styleObj.dividerAlignment;
                                    delete styleObj.dividerLineStyle;
                                    delete styleObj.dividerUpper;
                                    delete styleObj.dividerGlass;
                                }
                                
                                await this.saveSettings();
                                this.generateStyles();
                                this.dividerManager.syncDividers();
                                new obsidian.Notice(`Removed divider for: ${file.name}`);
                            });
                    });
                } else {
                    menu.addItem((item) => {
                        item.setTitle("Add custom divider")
                            .setIcon('separator-horizontal')
                            .onClick(() => {
                                new DividerModal(this.app, this, file).open();
                            });
                    });
                }
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
            const palette = PALETTES[this.settings.palette] || PALETTES["Muted Dark Mode"];
            
            let path = target.path;
            let segments = path.split('/').filter(s => s.length > 0);
            let depth = target instanceof obsidian.TFolder ? segments.length - 1 : segments.length - 1;

            // Start with physical direct style
            let customStyle = this.getStyle(path);
            let inheritedStyle: FolderStyle | null = null;
            
            // Climb parents to find inheritance
            let parent = target.parent;
            while (parent && !parent.isRoot()) {
                const pStyle = this.getStyle(parent.path);
                if (pStyle && (pStyle.applyToSubfolders || (target instanceof obsidian.TFile && pStyle.applyToFiles))) {
                    inheritedStyle = pStyle;
                    break; 
                }
                parent = parent.parent;
            }

            const activeStyle = customStyle || inheritedStyle;
            const colorOrigin = (activeStyle && activeStyle.hex) ? activeStyle.hex : null;
            

            let color: {rgb: string, hex: string};
            if (colorOrigin) {
                const cp = parseCustomPalette(colorOrigin);
                const rgb = hexToRgbObj(colorOrigin);
                color = cp ? cp[0] : { rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, hex: colorOrigin };
            } else {
                const h = hashString(path);
                color = palette[h % palette.length];
            }

            let effText = (customStyle && customStyle.textColor) ? customStyle.textColor : (inheritedStyle ? inheritedStyle.textColor : null);
            if (!effText) {
                const adjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                effText = (isDark && adjust === 0) ? color.hex : `rgb(${adjustBrightnessRgb(color.rgb, adjust)})`;
            }

            const effIconColor = (customStyle && customStyle.iconColor) ? customStyle.iconColor : (inheritedStyle ? inheritedStyle.iconColor : color.hex);
            const autoIcon = getAutoIconData(target.name, this.settings, target instanceof obsidian.TFile);
            
            return {
                hex: anyToHex(color.hex),
                textColor: effText ? anyToHex(effText) : "",
                iconColor: anyToHex(effIconColor),
                iconId: (customStyle && customStyle.iconId) ? customStyle.iconId : (this.settings.autoIcons && autoIcon ? (this.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji) : ""),
                opacity: (customStyle && customStyle.opacity !== undefined) ? customStyle.opacity : (depth === 0 ? this.settings.rootOpacity : this.settings.subfolderOpacity),
                isBold: (customStyle && customStyle.isBold !== undefined) ? !!customStyle.isBold : (inheritedStyle ? !!inheritedStyle.isBold : true),
                isItalic: (customStyle && customStyle.isItalic !== undefined) ? !!customStyle.isItalic : (inheritedStyle ? !!customStyle.isItalic : false),
                applyToSubfolders: customStyle ? !!customStyle.applyToSubfolders : false,
                applyToFiles: customStyle ? !!customStyle.applyToFiles : false
            };
        } catch {
            return { hex: "#ffffff", textColor: "#000000", iconColor: "#000000", iconId: "", opacity: 1, isBold: true, isItalic: false, applyToSubfolders: false, applyToFiles: false };
        }
    }


    generateStyles() {
        const generator = new StyleGenerator(this);
        this.styleTag.textContent = generator.generateCss();
    }

    private isScrolling = false;
    private scrollTimeout: number | null = null;

    initDividerObserver() {
        if (this.dividerObserver) {
            this.dividerObserver.disconnect();
        }

        const container = activeDocument.querySelector('.nav-files-container');
        if (!container) return;

        // Detect scrolling to suppress sync bursts
        container.addEventListener('scroll', () => {
            this.isScrolling = true;
            activeWindow.clearTimeout(this.scrollTimeout);
            this.scrollTimeout = activeWindow.setTimeout(() => {
                this.isScrolling = false;
                this.processDividers();
            }, 100);
        }, { passive: true });

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

        this.dividerObserver.observe(container, { childList: true, subtree: true });
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
