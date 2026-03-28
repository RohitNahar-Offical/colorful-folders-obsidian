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
    palette: "Muted Dark Mode",
    rootStyle: "translucent",
    rootOpacity: 0.2,
    subfolderOpacity: 0.15,
    tintOpacity: 0.05
};

class ColorfulFoldersPlugin extends obsidian.Plugin {
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

        const currentPalette = PALETTES[this.settings.palette] || PALETTES["Muted Dark Mode"];
        const rootBgStyle = this.settings.rootStyle;
        const rootOp = this.settings.rootOpacity;
        const subOp = this.settings.subfolderOpacity;
        const tintOp = this.settings.tintOpacity;

        const traverse = (folder, depth) => {
            const folders = folder.children
                .filter(c => c.children !== undefined)
                .sort((a, b) => a.name.localeCompare(b.name));

            for (let i = 0; i < folders.length; i++) {
                const child = folders[i];
                const color = currentPalette[(i + depth) % currentPalette.length];
                const safePath = child.path.replace(/'/g, "\\'").replace(/"/g, '\\"');
                
                let bg, text;
                
                if (depth === 0) {
                    if (rootBgStyle === "solid") {
                        bg = color.hex;
                        text = "#191724"; // Always dark text on bright solid background
                    } else {
                        bg = `rgba(${color.rgb}, ${rootOp})`;
                        text = color.hex; // Match text natively to the folder color
                    }
                } else {
                    bg = `rgba(${color.rgb}, ${subOp})`;
                    text = color.hex;
                }
                
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
                        background-color: rgba(${color.rgb}, ${tintOp}) !important;
                        border-left: 1px solid rgba(${color.rgb}, 0.4) !important;
                        border-radius: 4px !important;
                        margin-left: 4px !important;
                        padding-left: 4px !important;
                    }
                `;
                
                traverse(child, depth + 1);
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
            .setDesc('Choose the vibe. The Muted Dark Mode is excellent for deeper dark workspaces.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant Rainbow (Legacy)')
                .addOption('Muted Dark Mode', 'Muted Dark Mode (New)')
                .setValue(this.plugin.settings.palette)
                .onChange(async (value) => {
                    this.plugin.settings.palette = value;
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
