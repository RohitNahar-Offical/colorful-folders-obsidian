'use strict';

var obsidian = require('obsidian');

const PALETTES = {
    "Vibrant Rainbow": [
        { rgb: "235, 111, 146", hex: "#eb6f92" },
        { rgb: "196, 167, 231", hex: "#c4a7e7" },
        { rgb: "246, 193, 119", hex: "#f6c177" },
        { rgb: "156, 207, 216", hex: "#9ccfd8" },
        { rgb: "49, 116, 143", hex: "#31748f" }, 
        { rgb: "234, 154, 151", hex: "#ea9a97" },
        { rgb: "245, 169, 127", hex: "#f5a97f" },
        { rgb: "166, 218, 149", hex: "#a6da95" },
        { rgb: "116, 199, 236", hex: "#74c7ec" },
        { rgb: "202, 158, 230", hex: "#ca9ee6" },
        { rgb: "242, 205, 205", hex: "#f2cdcd" },
        { rgb: "180, 190, 254", hex: "#b4befe" } 
    ],
    "Muted Dark Mode": [
        { rgb: "186, 113, 132", hex: "#ba7184" }, // Dimmed Rose
        { rgb: "148, 128, 179", hex: "#9480b3" }, // Dimmed Iris
        { rgb: "194, 150, 91", hex: "#c2965b" },  // Dimmed Gold
        { rgb: "96, 148, 160", hex: "#6094a0" },  // Dimmed Cyan
        { rgb: "48, 102, 125", hex: "#30667d" },  // Dimmed Pine
        { rgb: "191, 120, 117", hex: "#bf7875" }, // Dimmed Love
        { rgb: "199, 138, 105", hex: "#c78a69" }, // Dimmed Peach
        { rgb: "128, 171, 115", hex: "#80ab73" }, // Dimmed Sage
        { rgb: "91, 159, 189", hex: "#5b9fbd" },  // Dimmed Sapphire
        { rgb: "160, 126, 181", hex: "#a07eb5" }, // Dimmed Mauve
        { rgb: "186, 156, 156", hex: "#ba9c9c" }, // Dimmed Flamingo
        { rgb: "143, 151, 199", hex: "#8f97c7" }  // Dimmed Lavender
    ]
};

const DEFAULT_SETTINGS = {
    palette: "Vibrant Rainbow",
    customPalette: "",
    colorMode: "cycle",
    exclusionList: "",
    outlineOnly: false,
    activeGlow: true,
    rootStyle: "solid",
    rootOpacity: 0.35,
    subfolderOpacity: 0.35,
    tintOpacity: 0.05
};

class ColorfulFoldersPlugin extends obsidian.Plugin {
    parseCustomPalette(hexString) {
        if (!hexString) return null;
        const hexes = hexString.split(',').map(s => s.trim().toLowerCase());
        const result = [];
        for (const hex of hexes) {
            if (/^#[0-9a-f]{6}$/.test(hex)) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                result.push({ rgb: `${r}, ${g}, ${b}`, hex: hex });
            }
        }
        return result.length > 0 ? result : null;
    }

    async onload() {
        console.log("Loading Colorful Folders Plugin");
        await this.loadSettings();

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'colorful-folders-style';
        document.head.appendChild(this.styleEl);

        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.generateStyles();
        });

        // Regenerate on vault tree changes
        this.registerEvent(this.app.vault.on('create', () => this.generateStyles()));
        this.registerEvent(this.app.vault.on('delete', () => this.generateStyles()));
        this.registerEvent(this.app.vault.on('rename', () => this.generateStyles()));
    }

    onunload() {
        console.log("Unloading Colorful Folders Plugin");
        if (this.styleEl) {
            this.styleEl.remove();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.generateStyles(); // Re-render instantly when saved
    }

    generateStyles() {
        let css = "";
        
        const root = this.app.vault.getRoot();
        if (!root) return;

        let currentPalette = PALETTES[this.settings.palette] || PALETTES["Muted Dark Mode"];
        if (this.settings.palette === "Custom") {
            const custom = this.parseCustomPalette(this.settings.customPalette);
            if (custom) currentPalette = custom;
        }

        const excludeFolders = this.settings.exclusionList
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0);

        const rootBgStyle = this.settings.rootStyle;
        const rootOp = this.settings.rootOpacity;
        const subOp = this.settings.subfolderOpacity;
        const tintOp = this.settings.tintOpacity;
        const outlineOnly = this.settings.outlineOnly;

        const traverse = (folder, depth, rootIndex = 0, passedColor = null) => {
            const copyFolders = folder.children
                .filter(c => c.children !== undefined)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            let validIndex = 0;

            for (let i = 0; i < copyFolders.length; i++) {
                const child = copyFolders[i];
                if (excludeFolders.includes(child.name.toLowerCase())) {
                    traverse(child, depth, rootIndex, passedColor);
                    continue;
                }
                
                let color;
                if (this.settings.colorMode === "monochromatic") {
                    color = depth === 0 ? currentPalette[validIndex % currentPalette.length] : passedColor;
                } else {
                    color = currentPalette[(validIndex + depth + rootIndex) % currentPalette.length];
                }
                
                const safePath = child.path.replace(/'/g, "\\'" ).replace(/"/g, '\\"');
                
                let bg, text;
                
                if (depth === 0) {
                    if (rootBgStyle === "solid") {
                        bg = outlineOnly ? "transparent" : color.hex;
                        text = outlineOnly ? color.hex : "#191724"; 
                    } else {
                        bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${rootOp})`;
                        text = color.hex; 
                    }
                } else {
                    bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${subOp})`;
                    text = color.hex;
                }

                const bgTint = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${tintOp})`;
                
                css += `
                    body .nav-folder-title[data-path="${safePath}"],
                    body .tree-item-self[data-path="${safePath}"] {
                        background-color: ${bg} !important;
                        border-radius: 6px !important;
                        margin-bottom: 2px !important; margin-top: 2px !important;
                        transition: background-color 0.2s ease, opacity 0.2s ease, color 0.2s ease !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner {
                        color: ${text} !important;
                        font-weight: bold !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"] svg,
                    body .tree-item-self[data-path="${safePath}"] svg {
                        color: ${text} !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"]:hover,
                    body .tree-item-self[data-path="${safePath}"]:hover {
                        filter: brightness(1.2);
                    }
                    /* Tint the opened folder's content area (children) */
                    body .nav-folder:has(> .nav-folder-title[data-path="${safePath}"]) > .nav-folder-children,
                    body .tree-item:has(> .tree-item-self[data-path="${safePath}"]) > .tree-item-children {
                        background-color: ${bgTint} !important;
                        border-left: 2px solid rgba(${color.rgb}, 0.8) !important;
                        border-bottom: 2px solid rgba(${color.rgb}, 0.8) !important;
                        border-radius: 4px !important;
                        border-bottom-left-radius: 8px !important;
                        margin-left: 16px !important;
                        padding-left: 8px !important;
                        padding-bottom: 12px !important;
                    }
                `;
                
                if (this.settings.activeGlow) {
                    css += `
                        /* Active Folder Trail Glow */
                        body .nav-folder:has(.is-active):has(> .nav-folder-title[data-path="${safePath}"]) > .nav-folder-children,
                        body .tree-item:has(.is-active):has(> .tree-item-self[data-path="${safePath}"]) > .tree-item-children {
                            border-left: 2px solid rgba(${color.rgb}, 1.0) !important;
                            border-bottom: 2px solid rgba(${color.rgb}, 1.0) !important;
                            box-shadow: -2px 0px 10px rgba(${color.rgb}, 0.3);
                        }
                        body .nav-folder:has(.is-active):has(> .nav-folder-title[data-path="${safePath}"]) > .nav-folder-title,
                        body .tree-item:has(.is-active):has(> .tree-item-self[data-path="${safePath}"]) > .tree-item-self {
                            filter: brightness(1.3) drop-shadow(0px 0px 4px rgba(${color.rgb}, 0.4));
                        }
                    `;
                }

                traverse(child, depth + 1, depth === 0 ? validIndex : rootIndex, color);
                validIndex++;
            }
        };

        traverse(root, 0);
        this.styleEl.textContent = css;
    }
}

class ColorfulFoldersSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Colorful Folders Configuration'});

        new obsidian.Setting(containerEl)
            .setName('Color Palette Theme')
            .setDesc('Choose the vibe. Select Custom to use your own colors below.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant Rainbow')
                .addOption('Muted Dark Mode', 'Muted Dark Mode')
                .addOption('Custom', 'Custom Palette')
                .setValue(this.plugin.settings.palette)
                .onChange(async (value) => {
                    this.plugin.settings.palette = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Custom Colors (Hex)')
            .setDesc('If Custom is selected above, enter a comma-separated list of hex colors (e.g. #eb6f92, #9ccfd8)')
            .addText(text => text
                .setPlaceholder('#ff0000, #00ff00')
                .setValue(this.plugin.settings.customPalette)
                .onChange(async (value) => {
                    this.plugin.settings.customPalette = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Color Blending Mode')
            .setDesc('Cycle through colors at each depth, or keep folders to one Monochromatic shade.')
            .addDropdown(drop => drop
                .addOption('cycle', 'Rainbow Cycle')
                .addOption('monochromatic', 'Monochromatic Depth')
                .setValue(this.plugin.settings.colorMode)
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Outline Only Mode')
            .setDesc('Removes background tinting and only keeps the bright connecting lines and text.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Active File Glow')
            .setDesc('Brightens the folder path lines leading down to your currently open active document.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Comma-separated list of folder names to ignore (e.g. attachments, .obsidian)')
            .addTextArea(text => text
                .setPlaceholder('attachments, templates')
                .setValue(this.plugin.settings.exclusionList)
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Root Folder Appearance')
            .setDesc('Should top-level folders stand out vividly (Solid) or blend in gracefully (Translucent).')
            .addDropdown(drop => drop
                .addOption('solid', 'Solid Vivid Color')
                .addOption('translucent', 'Translucent Glow')
                .setValue(this.plugin.settings.rootStyle)
                .onChange(async (value) => {
                    this.plugin.settings.rootStyle = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Root Folder Opacity')
            .setDesc('Controls brightness if Root Folder is set to Translucent')
            .addSlider(slider => slider
                .setLimits(0.05, 0.5, 0.05)
                .setValue(this.plugin.settings.rootOpacity)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.rootOpacity = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Subfolder Opacity')
            .setDesc('Opacity for nested subfolders to distinguish hierarchy.')
            .addSlider(slider => slider
                .setLimits(0.05, 0.5, 0.05)
                .setValue(this.plugin.settings.subfolderOpacity)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.subfolderOpacity = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Opened Folder Backing Tint')
            .setDesc('Controls how highly tinted the nested files space becomes when you open a directory.')
            .addSlider(slider => slider
                .setLimits(0.0, 0.2, 0.01)
                .setValue(this.plugin.settings.tintOpacity)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.tintOpacity = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = ColorfulFoldersPlugin;
