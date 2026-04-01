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
        { rgb: "186, 113, 132", hex: "#ba7184" },
        { rgb: "148, 128, 179", hex: "#9480b3" },
        { rgb: "194, 150, 91", hex: "#c2965b" },  
        { rgb: "96, 148, 160", hex: "#6094a0" },  
        { rgb: "48, 102, 125", hex: "#30667d" },  
        { rgb: "191, 120, 117", hex: "#bf7875" }, 
        { rgb: "199, 138, 105", hex: "#c78a69" }, 
        { rgb: "128, 171, 115", hex: "#80ab73" }, 
        { rgb: "91, 159, 189", hex: "#5b9fbd" },  
        { rgb: "160, 126, 181", hex: "#a07eb5" }, 
        { rgb: "186, 156, 156", hex: "#ba9c9c" }, 
        { rgb: "143, 151, 199", hex: "#8f97c7" }  
    ],
    "Pastel Dreams": [
        { rgb: "255, 179, 186", hex: "#ffb3ba" },
        { rgb: "255, 223, 186", hex: "#ffdfba" },
        { rgb: "255, 255, 186", hex: "#ffffba" },
        { rgb: "186, 255, 201", hex: "#baffc9" },
        { rgb: "186, 225, 255", hex: "#bae1ff" },
        { rgb: "219, 186, 255", hex: "#dbbaff" },
        { rgb: "255, 186, 219", hex: "#ffbadb" },
        { rgb: "250, 218, 221", hex: "#fadadd" },
        { rgb: "207, 252, 220", hex: "#cffcdc" },
        { rgb: "204, 237, 255", hex: "#ccedff" },
        { rgb: "240, 217, 255", hex: "#f0d9ff" },
        { rgb: "255, 217, 236", hex: "#ffd9ec" }
    ],
    "Neon Cyberpunk": [
        { rgb: "255, 0, 153", hex: "#ff0099" },
        { rgb: "0, 255, 255", hex: "#00ffff" },
        { rgb: "255, 255, 0", hex: "#ffff00" },
        { rgb: "0, 255, 102", hex: "#00ff66" },
        { rgb: "153, 0, 255", hex: "#9900ff" },
        { rgb: "255, 102, 0", hex: "#ff6600" },
        { rgb: "0, 153, 255", hex: "#0099ff" },
        { rgb: "255, 0, 85", hex: "#ff0055" },
        { rgb: "51, 255, 0", hex: "#33ff00" },
        { rgb: "204, 0, 255", hex: "#cc00ff" },
        { rgb: "255, 204, 0", hex: "#ffcc00" },
        { rgb: "0, 255, 204", hex: "#00ffcc" }
    ]
};

const DEFAULT_SETTINGS = {
    palette: "Vibrant Rainbow",
    customPalette: "",
    colorMode: "cycle",
    exclusionList: "",
    outlineOnly: false,
    activeGlow: true,
    rootStyle: "translucent",
    rootOpacity: 0.5,
    subfolderOpacity: 0.35,
    tintOpacity: 0.12,
    customFolderColors: {},
    presets: {}, // Added for color-folders-files feature parity
    glassmorphism: true,
    focusMode: false,
    autoIcons: true,
    animateActivePath: true,
    rainbowRootText: true,
    rainbowRootBgTransparent: false,
    autoColorFiles: true,
    activeAnimationStyle: "breathe",
    activeAnimationDuration: 3.0
};

class ColorPickerModal extends obsidian.Modal {
    constructor(app, plugin, item) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.isFolder = item instanceof obsidian.TFolder;
        
        // Initialize style
        const existing = this.plugin.getStyle(this.item.path);
        if (existing) {
            this.style = { ...existing };
            // Legacy migration: ensure folders default to bold if not specified
            if (this.style.isBold === undefined && this.isFolder) this.style.isBold = true;
            if (this.style.opacity === undefined) this.style.opacity = 1.0;
        } else {
            this.style = { 
                hex: "#eb6f92", 
                textColor: "", 
                isBold: this.isFolder, 
                isItalic: false, 
                opacity: 1.0,
                applyToSubfolders: false,
                applyToFiles: false
            };
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl("h2", { text: `${this.isFolder ? 'Folder' : 'File'} Style: ${this.item.name}` });

        // Preview Area
        const previewCont = contentEl.createDiv({ cls: "cf-preview-container" });
        previewCont.style.padding = "15px";
        previewCont.style.marginBottom = "20px";
        previewCont.style.borderRadius = "8px";
        previewCont.style.textAlign = "center";
        previewCont.style.border = "1px solid var(--background-modifier-border)";
        
        const previewItem = previewCont.createDiv();
        previewItem.setText(this.item.name);
        previewItem.style.padding = "10px 20px";
        previewItem.style.borderRadius = "6px";
        previewItem.style.display = "inline-block";
        
        const updatePreview = () => {
            previewItem.style.backgroundColor = this.style.hex;
            // Default to white text for custom styles if none specified
            previewItem.style.color = this.style.textColor || "#ffffff";
            previewItem.style.fontWeight = this.style.isBold ? "bold" : "normal";
            previewItem.style.fontStyle = this.style.isItalic ? "italic" : "normal";
            previewItem.style.opacity = this.style.opacity;
            previewItem.style.filter = "brightness(1.1)";
        };
        updatePreview();

        // 🎨 BACKGROUND COLOR
        new obsidian.Setting(contentEl)
            .setName("Background Color")
            .setDesc("The primary color forthis item.")
            .addColorPicker(picker => picker
                .setValue(this.style.hex)
                .onChange(value => {
                    this.style.hex = value;
                    updatePreview();
                })
            );

        // ✍️ TEXT COLOR
        new obsidian.Setting(contentEl)
            .setName("Text Color")
            .setDesc("Optional override for the text color.")
            .addColorPicker(picker => picker
                .setValue(this.style.textColor || "#ffffff")
                .onChange(value => {
                    this.style.textColor = value;
                    updatePreview();
                })
            )
            .addButton(btn => btn
                .setButtonText("Reset Text")
                .onClick(() => {
                    this.style.textColor = "";
                    updatePreview();
                })
            );

        // 🅱️ TYPOGRAPHY
        new obsidian.Setting(contentEl)
            .setName("Typography")
            .setDesc("Make the title stand out.")
            .addToggle(toggle => toggle
                .setTooltip("Bold")
                .setValue(this.style.isBold)
                .onChange(value => {
                    this.style.isBold = value;
                    updatePreview();
                })
            )
            .addToggle(toggle => toggle
                .setTooltip("Italic")
                .setValue(this.style.isItalic || false)
                .onChange(value => {
                    this.style.isItalic = value;
                    updatePreview();
                })
            );

        // 🌫️ OPACITY
        new obsidian.Setting(contentEl)
            .setName("Opacity (%)")
            .setDesc("Transparency level for this item (0-100).")
            .addSlider(slider => slider
                .setLimits(0.1, 100, 0.1)
                .setValue((this.style.opacity !== undefined ? this.style.opacity : 1.0) * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    this.style.opacity = parseFloat((value / 100).toFixed(3));
                    updatePreview();
                })
            );

        // 🌳 INHERITANCE (Folders Only)
        if (this.isFolder) {
            new obsidian.Setting(contentEl)
                .setHeading()
                .setName("Inheritance");

            new obsidian.Setting(contentEl)
                .setName("Apply to Subfolders")
                .setDesc("Force all nested folders to use this style.")
                .addToggle(toggle => toggle
                    .setValue(this.style.applyToSubfolders || false)
                    .onChange(value => this.style.applyToSubfolders = value)
                );

            new obsidian.Setting(contentEl)
                .setName("Apply to Files")
                .setDesc("Force all files inside this folder to use this style.")
                .addToggle(toggle => toggle
                    .setValue(this.style.applyToFiles || false)
                    .onChange(value => this.style.applyToFiles = value)
                );
        }

        // 📋 PRESETS
        new obsidian.Setting(contentEl)
            .setHeading()
            .setName("Presets");

        const presetNames = Object.keys(this.plugin.settings.presets || {});
        if (presetNames.length > 0) {
            new obsidian.Setting(contentEl)
                .setName("Apply Preset")
                .addDropdown(drop => drop
                    .addOption("", "Select a preset...")
                    .addOptions(Object.fromEntries(presetNames.map(n => [n, n])))
                    .onChange(value => {
                        if (!value) return;
                        const preset = this.plugin.settings.presets[value];
                        if (preset) {
                            this.style = { ...preset };
                            updatePreview();
                            this.onOpen(); // Re-render to update all controls
                        }
                    })
                );
        }

        let newPresetName = "";
        new obsidian.Setting(contentEl)
            .setName("Save as Preset")
            .addText(text => text
                .setPlaceholder("e.g. Neon Pink")
                .onChange(value => newPresetName = value)
            )
            .addButton(btn => btn
                .setButtonText("Save")
                .onClick(async () => {
                    if (!newPresetName) return;
                    if (!this.plugin.settings.presets) this.plugin.settings.presets = {};
                    this.plugin.settings.presets[newPresetName] = { ...this.style };
                    await this.plugin.saveSettings();
                    new obsidian.Notice(`Saved preset: ${newPresetName}`);
                    this.onOpen(); // Re-render to show dropdown
                })
            );

        // 💾 SAVE/CANCEL
        const buttonCont = contentEl.createDiv({ cls: "cf-button-container" });
        buttonCont.style.marginTop = "30px";
        buttonCont.style.display = "flex";
        buttonCont.style.justifyContent = "flex-end";
        buttonCont.style.gap = "10px";

        new obsidian.Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("Save Style")
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.customFolderColors[this.item.path] = this.style;
                    await this.plugin.saveSettings();
                    new obsidian.Notice(`Updated styling for ${this.item.name}`);
                    this.close();
                })
            )
            .addButton(btn => btn
                .setButtonText("Clear Settings")
                .onClick(async () => {
                    delete this.plugin.settings.customFolderColors[this.item.path];
                    await this.plugin.saveSettings();
                    new obsidian.Notice(`Cleared styling for ${this.item.name}`);
                    this.close();
                })
            );
    }

    onClose() {
        this.contentEl.empty();
    }
}

class ColorfulFoldersPlugin extends obsidian.Plugin {
    parseCustomPalette(hexString) {
        if (!hexString) return null;
        const hexes = hexString.split(',').map(s => s.trim().toLowerCase());
        const result = [];
        for (let hex of hexes) {
            if (/^#[0-9a-f]{3}$/i.test(hex)) {
                hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            if (/^#[0-9a-f]{6}$/i.test(hex)) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                result.push({ rgb: `${r}, ${g}, ${b}`, hex: hex });
            }
        }
        return result.length > 0 ? result : null;
    }

    async onload() {
        console.log("Loading Colorful Folders Plugin v3");
        await this.loadSettings();

        // Migrate older settings models gracefully
        if (!this.settings.customFolderColors) this.settings.customFolderColors = {};

        this.getStyle = (path) => {
            const style = this.settings.customFolderColors?.[path];
            if (!style) return null;
            if (typeof style === 'string') return { hex: style }; // Legacy hex support
            return style;
        };

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'colorful-folders-style';
        document.head.appendChild(this.styleEl);

        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.generateStyles();
        });

        // Register custom color context menu
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof obsidian.TFolder || file instanceof obsidian.TFile) {
                    menu.addItem((item) => {
                        item
                            .setTitle(`Set Custom ${file instanceof obsidian.TFolder ? 'Folder' : 'File'} Style`)
                            .setIcon('palette')
                            .onClick(() => {
                                new ColorPickerModal(this.app, this, file).open();
                            });
                    });
                }
            })
        );

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
        this.generateStyles(); 
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

        let heatmapData = null;
        if (this.settings.colorMode === "heatmap") {
            // Build heatmap by scanning all files and assigning the latest mtime to parent folders
            heatmapData = new Map();
            const files = this.app.vault.getFiles();
            for (const f of files) {
                let p = f.parent;
                while (p != null) {
                    const currentMax = heatmapData.get(p.path) || 0;
                    if (f.stat.mtime > currentMax) {
                        heatmapData.set(p.path, f.stat.mtime);
                    }
                    p = p.parent;
                }
            }
        }

        const now = Date.now();
        const getHeatmapColor = (mtime) => {
            if (!mtime) return PALETTES["Vibrant Rainbow"][11]; // Ice cold default
            const diffDays = (now - mtime) / (1000 * 60 * 60 * 24);
            const palettes = PALETTES["Vibrant Rainbow"]; // Heatmap explicitly uses vibrant scale
            if (diffDays <= 1) return palettes[0]; // Red/Pink
            if (diffDays <= 3) return palettes[2]; // Orange/Yellow
            if (diffDays <= 7) return palettes[7]; // Green
            if (diffDays <= 15) return palettes[4]; // Blue
            if (diffDays <= 30) return palettes[10]; // Pale pink
            return palettes[11]; // Cool lavender
        };

        if (this.settings.animateActivePath) {
            css += `
                @keyframes cf-breathe-glow {
                    0% { border-color: rgba(var(--cf-rgb), 0.6) !important; box-shadow: -1px 1px 4px rgba(var(--cf-rgb), 0.05) !important; filter: brightness(1.0); }
                    50% { border-color: rgba(var(--cf-rgb), 0.9) !important; box-shadow: -1px 1px 8px rgba(var(--cf-rgb), 0.15) !important; filter: brightness(1.05); }
                    100% { border-color: rgba(var(--cf-rgb), 0.6) !important; box-shadow: -1px 1px 4px rgba(var(--cf-rgb), 0.05) !important; filter: brightness(1.0); }
                }
                @keyframes cf-neon-flicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { border-color: rgba(var(--cf-rgb), 0.8) !important; box-shadow: -1px 1px 5px rgba(var(--cf-rgb), 0.15) !important; }
                    20%, 24%, 55% { border-color: rgba(var(--cf-rgb), 0.5) !important; box-shadow: none !important; }
                }
                @keyframes cf-shimmer-glow {
                    0% { filter: brightness(1.0) saturate(100%); }
                    50% { filter: brightness(1.08) saturate(110%); }
                    100% { filter: brightness(1.0) saturate(100%); }
                }
            `;
        }

        if (this.settings.focusMode) {
            css += `
                body .workspace-leaf-content[data-type="file-explorer"]:has(.is-active) .nav-folder:not(:has(.is-active)):not(:hover) {
                    opacity: 0.35;
                    transition: opacity 0.4s ease;
                }
            `;
        }

        const traverse = (folder, depth, rootIndex = 0, passedColor = null, inheritedStyle = null) => {
            const copyFolders = folder.children
                .filter(c => c.children !== undefined)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            const copyFiles = folder.children
                .filter(c => c.children === undefined)
                .sort((a, b) => a.name.localeCompare(b.name));

            let validIndex = 0;

            // 1. Handle File Inheritance / Auto-color Files
            if (passedColor || this.settings.autoColorFiles) {
                let fileIndex = 0;
                for (const child of copyFiles) {
                    const safePath = child.path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    let color;
                    let fileStyle = this.getStyle(child.path);

                    if (fileStyle) {
                        const customParsed = this.parseCustomPalette(fileStyle.hex);
                        color = customParsed ? customParsed[0] : { rgb: "255, 255, 255", hex: fileStyle.hex };
                    } else if (inheritedStyle && inheritedStyle.applyToFiles && passedColor) {
                        color = passedColor;
                    } else if (this.settings.autoColorFiles) {
                        color = currentPalette[(validIndex + fileIndex) % currentPalette.length]; 
                    } else {
                        continue; // Skip if no styling logic applies
                    }

                    const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);
                    // Standard files shouldn't be dimmed if they have a tint
                    const op = activeStyle && activeStyle.opacity !== undefined ? activeStyle.opacity : 1.0;
                    const text = activeStyle && activeStyle.textColor ? activeStyle.textColor : "#ffffff";
                    const isBold = activeStyle && activeStyle.isBold;
                    const isItalic = activeStyle && activeStyle.isItalic;

                    css += `
                        body .nav-file-title[data-path="${safePath}"],
                        body .tree-item-self[data-path="${safePath}"] {
                            background-color: rgba(${color.rgb}, 0.1) !important;
                            border-left: 2px solid rgba(${color.rgb}, 0.4) !important;
                            opacity: ${op} !important;
                            color: ${text} !important;
                            font-weight: ${isBold ? 'bold' : 'normal'} !important;
                            font-style: ${isItalic ? 'italic' : 'normal'} !important;
                            border-radius: 4px !important;
                        }
                    `;
                    fileIndex++;
                }
            }

            // 2. Style current folder's children container (Tint + Line)
            if (depth > 0 && passedColor) {
                const safePath = folder.path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                // Ensure consistent tint opacity across all depths
                const minOp = depth === 1 ? 0.12 : 0.05;
                const finalTintOp = Math.max(this.settings.tintOpacity, minOp);
                const bgTint = outlineOnly ? "transparent" : `rgba(${passedColor.rgb}, ${finalTintOp})`;
                const glassCss = this.settings.glassmorphism ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';

                css += `
                    body .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                    body .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                        background-color: ${bgTint} !important;
                        border-left: 2px solid rgba(${passedColor.rgb}, 0.8) !important;
                        border-bottom: 2px solid rgba(${passedColor.rgb}, 0.8) !important;
                        border-radius: 4px !important;
                        border-bottom-left-radius: 8px !important;
                        margin-left: 0 !important;
                        padding-left: 24px !important;
                        padding-bottom: 12px !important;
                    }
                `;
                
                if (this.settings.activeGlow) {
                    let animationProp = '';
                    if (this.settings.animateActivePath) {
                        const style = this.settings.activeAnimationStyle || "breathe";
                        const dur = this.settings.activeAnimationDuration || 3.0;
                        if (style === "breathe") animationProp = `animation: cf-breathe-glow ${dur}s infinite ease-in-out;`;
                        else if (style === "neon") animationProp = `animation: cf-neon-flicker ${dur}s infinite alternate;`;
                        else if (style === "shimmer") animationProp = `animation: cf-shimmer-glow ${dur}s infinite linear;`;
                    }
                    
                    css += `
                        body .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"] ~ .nav-folder-children,
                        body .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"] ~ .tree-item-children {
                            border-left: 2px solid rgba(${passedColor.rgb}, 1.0) !important;
                            border-bottom: 2px solid rgba(${passedColor.rgb}, 1.0) !important;
                            --cf-rgb: ${passedColor.rgb};
                            ${animationProp}
                        }
                    `;
                }
            }

            for (let i = 0; i < copyFolders.length; i++) {
                const child = copyFolders[i];
                if (excludeFolders.includes(child.name.toLowerCase())) {
                    traverse(child, depth, rootIndex, passedColor, inheritedStyle);
                    continue;
                }
                
                let color;
                let customStyle = this.getStyle(child.path);
                let activeStyle = customStyle || inheritedStyle;

                if (activeStyle) {
                    const customParsed = this.parseCustomPalette(activeStyle.hex);
                    color = customParsed ? customParsed[0] : currentPalette[(validIndex + depth + rootIndex) % currentPalette.length];
                } else if (this.settings.colorMode === "heatmap") {
                    const mtime = heatmapData.get(child.path) || 0;
                    color = getHeatmapColor(mtime);
                } else if (this.settings.colorMode === "monochromatic") {
                    color = depth === 0 ? currentPalette[validIndex % currentPalette.length] : passedColor;
                } else {
                    color = currentPalette[(validIndex + depth + rootIndex) % currentPalette.length];
                }
                
                const safePath = child.path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                
                let bg, text;
                const isCustom = !!activeStyle;
                const op = isCustom && activeStyle.opacity !== undefined ? activeStyle.opacity : (depth === 0 ? rootOp : subOp);

                if (depth === 0) {
                    if (this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent && !activeStyle) {
                        bg = "transparent";
                        text = color.hex;
                    } else if (rootBgStyle === "solid") {
                        bg = outlineOnly ? "transparent" : color.hex;
                        text = outlineOnly ? color.hex : "#191724"; 
                    } else {
                        // Translucent mode for root folders
                        // Ignore default opacity=1.0 from custom assignments so they actually become translucent
                        let finalOp = rootOp; 
                        if (isCustom && activeStyle.opacity !== undefined && activeStyle.opacity < 1.0) {
                            finalOp = activeStyle.opacity;
                        }
                        bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${finalOp})`;
                        text = color.hex; 
                    }
                } else {
                    bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${op})`;
                    text = color.hex;
                }

                // Manual Text Override
                if (isCustom) {
                    text = activeStyle.textColor || (rootBgStyle === "solid" && depth === 0 ? "#191724" : color.hex); 
                } else if (activeStyle && activeStyle.textColor) {
                    text = activeStyle.textColor;
                }

                const bgTint = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${tintOp})`;
                
                // Advanced Typography
                const isBold = (activeStyle && activeStyle.isBold !== undefined) ? activeStyle.isBold : true;
                const isItalic = activeStyle && activeStyle.isItalic;

                let textCss = `
                    color: ${text} !important;
                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;

                if (this.settings.rainbowRootText && depth === 0 && (!activeStyle || !activeStyle.textColor)) {
                    const nextColor = currentPalette[(validIndex + 1) % currentPalette.length];
                    textCss = `
                        background-image: linear-gradient(90deg, ${color.hex}, ${nextColor.hex}) !important;
                        background-clip: text !important;
                        -webkit-background-clip: text !important;
                        color: transparent !important;
                        font-weight: 800 !important;
                        filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.7));
                        -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.4);
                    `;
                }

                let autoIconContent = "";
                if (this.settings.autoIcons) {
                    const lName = child.name.toLowerCase();
                    if (/journal|daily|log/.test(lName)) autoIconContent = `"📅 "`;
                    else if (/project|work/.test(lName)) autoIconContent = `"🚀 "`;
                    else if (/asset|attachment|image|media|file/.test(lName)) autoIconContent = `"🖼️ "`;
                    else if (/archive|old/.test(lName)) autoIconContent = `"📦 "`;
                    else if (/template/.test(lName)) autoIconContent = `"📄 "`;
                    else if (/resource|reference|book/.test(lName)) autoIconContent = `"📚 "`;
                    else if (/finance|money|budget/.test(lName)) autoIconContent = `"💰 "`;
                    else if (/person|people|contact|meeting/.test(lName)) autoIconContent = `"👥 "`;
                    else if (/idea|brain|thought|note|learn/.test(lName)) autoIconContent = `"💡 "`;
                }

                if (autoIconContent) {
                    css += `
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: ${autoIconContent};
                        }
                    `;
                }

                const glassCss = this.settings.glassmorphism ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';

                css += `
                    body .nav-folder-title[data-path="${safePath}"],
                    body .tree-item-self[data-path="${safePath}"] {
                        background-color: ${bg} !important;
                        opacity: ${isCustom ? op : 1.0} !important;
                        border-radius: 6px !important;
                        margin-bottom: 2px !important; margin-top: 2px !important;
                        ${glassCss}
                        transition: background-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner {
                        ${textCss}
                    }
                    body .nav-folder-title[data-path="${safePath}"] svg,
                    body .tree-item-self[data-path="${safePath}"] svg,
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-collapse-indicator svg {
                        color: ${(depth === 0 && rootBgStyle === 'solid' && !outlineOnly) ? text : color.hex} !important;
                        opacity: 1 !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"]:hover,
                    body .tree-item-self[data-path="${safePath}"]:hover {
                        filter: brightness(1.2);
                        ${this.settings.glassmorphism ? 'backdrop-filter: blur(12px) saturate(150%);' : ''}
                    }
                `;
                
                if (this.settings.activeGlow) {
                    let titleAnim = '';
                    if (this.settings.animateActivePath) {
                        const style = this.settings.activeAnimationStyle || "breathe";
                        const dur = this.settings.activeAnimationDuration || 3.0;
                        if (style === "breathe") titleAnim = `animation: cf-breathe-glow ${dur}s infinite ease-in-out;`;
                        else if (style === "neon") titleAnim = `animation: cf-neon-flicker ${dur}s infinite alternate;`;
                        else if (style === "shimmer") titleAnim = `animation: cf-shimmer-glow ${dur}s infinite linear;`;
                    }

                    css += `
                        body .nav-folder:has(.is-active) > .nav-folder-title[data-path="${safePath}"],
                        body .tree-item:has(.is-active) > .tree-item-self[data-path="${safePath}"] {
                            filter: brightness(1.05);
                            box-shadow: 0 0 8px rgba(${color.rgb}, 0.1) !important;
                            z-index: 1;
                            --cf-rgb: ${passedColor ? passedColor.rgb : color.rgb};
                            ${titleAnim}
                        }
                    `;
                }

                const nextInherited = (customStyle && customStyle.applyToSubfolders) ? customStyle : inheritedStyle;
                traverse(child, depth + 1, depth === 0 ? validIndex : rootIndex, color, nextInherited);
                validIndex++;
            }
        };

        traverse(root, 0);

        // Standalone File Styling (Manual Overrides for files not handled by folder inheritance)
        for (const [path, style] of Object.entries(this.settings.customFolderColors)) {
            const tfile = this.app.vault.getAbstractFileByPath(path);
            if (tfile instanceof obsidian.TFile) {
                const s = typeof style === 'string' ? { hex: style } : style;
                const customParsed = this.parseCustomPalette(s.hex);
                const color = customParsed ? customParsed[0] : { rgb: "255, 255, 255", hex: s.hex };
                const safePath = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const op = s.opacity !== undefined ? s.opacity : 1.0;
                
                css += `
                    body .nav-file-title[data-path="${safePath}"],
                    body .tree-item-self[data-path="${safePath}"] {
                        background-color: rgba(${color.rgb}, ${op}) !important;
                        opacity: 1.0 !important;
                        color: ${s.textColor || color.hex} !important;
                        font-weight: ${s.isBold ? 'bold' : 'normal'} !important;
                        font-style: ${s.isItalic ? 'italic' : 'normal'} !important;
                        border-radius: 4px !important;
                    }
                `;
            }
        }

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

        const tipEl = containerEl.createEl('div');
        tipEl.style.backgroundColor = "var(--background-secondary-alt)";
        tipEl.style.borderLeft = "4px solid var(--interactive-accent)";
        tipEl.style.padding = "14px 18px";
        tipEl.style.margin = "15px 0 25px 0";
        tipEl.style.borderRadius = "4px";
        tipEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";

        tipEl.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 1.6em; line-height: 1;">💡</span>
                <div>
                    <div style="margin: 0 0 4px 0; color: var(--text-normal); font-weight: 700; font-size: 1.05em;">Context Menu Colors</div>
                    <div style="color: var(--text-muted); font-size: 0.95em; line-height: 1.4;">
                        Right-click any folder in your vault and click <strong>"Set Custom Folder Color"</strong> to assign it a specific overriding hex color!
                    </div>
                </div>
            </div>
        `;

        // SECTION 1: CORE CONFIGURATION
        containerEl.createEl('h3', {text: 'Core Configuration'});

        new obsidian.Setting(containerEl)
            .setName('Color Palette Theme')
            .setDesc('Choose the vibe. Select Custom to use your own colors below.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant Rainbow')
                .addOption('Muted Dark Mode', 'Muted Dark Mode')
                .addOption('Pastel Dreams', 'Pastel Dreams')
                .addOption('Neon Cyberpunk', 'Neon Cyberpunk')
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
            .setName('Color Generation Mode')
            .setDesc('How colors are assigned to folders across your vault.')
            .addDropdown(drop => drop
                .addOption('cycle', 'Rainbow Cycle')
                .addOption('monochromatic', 'Monochromatic Depth')
                .addOption('heatmap', 'Activity Heatmap (Hot = Modified recently)')
                .setValue(this.plugin.settings.colorMode)
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                }));

        // SECTION 2: VISUAL STYLES
        containerEl.createEl('h3', {text: 'Visual Styles'});

        new obsidian.Setting(containerEl)
            .setName('Root Folder Fill Appearance')
            .setDesc('Should top-level background blocks stand out vividly (Solid) or blend in gracefully (Translucent).')
            .addDropdown(drop => drop
                .addOption('solid', 'Solid Vivid Color')
                .addOption('translucent', 'Translucent Glow')
                .setValue(this.plugin.settings.rootStyle)
                .onChange(async (value) => {
                    this.plugin.settings.rootStyle = value;
                    await this.plugin.saveSettings();
                }));


        new obsidian.Setting(containerEl)
            .setName('Focus Mode (Dim Inactive Roots)')
            .setDesc('Dims other top-level folders softly when you dive into a specific active document path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.focusMode)
                .onChange(async (value) => {
                    this.plugin.settings.focusMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Glassmorphism Blur Effect')
            .setDesc('Adds a premium iOS-style backdrop blur to folder backgrounds. Best with translucent Obsidian themes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.glassmorphism)
                .onChange(async (value) => {
                    this.plugin.settings.glassmorphism = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Outline Only Mode')
            .setDesc('Removes background tinting globally and only keeps the bright connecting folder lines and text colors.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Auto-Generate Emoji Icons')
            .setDesc('Natively injects emoji icons for common folder names like (Journal -> 📅, Images -> 🖼️).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                }));

        // SECTION 3: ACTIVE PATH & TYPOGRAPHY
        containerEl.createEl('h3', {text: 'Active Path & Typography'});

        new obsidian.Setting(containerEl)
            .setName('Active File Glow')
            .setDesc('Brightens the glowing folder path connecting lines leading down to your currently open active document.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Animate Active Path Glow')
            .setDesc('Turns on animation for the glowing folder path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.animateActivePath)
                .onChange(async (value) => {
                    this.plugin.settings.animateActivePath = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide the style dropdown
                }));

        if (this.plugin.settings.animateActivePath) {
            new obsidian.Setting(containerEl)
                .setName('Animation Style')
                .setDesc('Choose the visual style for the active path animation.')
                .addDropdown(drop => drop
                    .addOption('breathe', 'Smooth Breathe')
                    .addOption('neon', 'Neon Flicker')
                    .addOption('shimmer', 'Color Shimmer')
                    .setValue(this.plugin.settings.activeAnimationStyle || "breathe")
                    .onChange(async (value) => {
                        this.plugin.settings.activeAnimationStyle = value;
                        await this.plugin.saveSettings();
                    }));

            new obsidian.Setting(containerEl)
                .setName('Animation Duration (s)')
                .setDesc('Controls how fast the animation plays (e.g. 3.0 seconds). Lower is faster.')
                .addSlider(slider => slider
                    .setLimits(0.5, 10.0, 0.5)
                    .setValue(this.plugin.settings.activeAnimationDuration !== undefined ? this.plugin.settings.activeAnimationDuration : 3.0)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.activeAnimationDuration = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new obsidian.Setting(containerEl)
            .setName('Rainbow Root Text')
            .setDesc('Applies a vivid rainbow-text horizontal gradient to all top level folders.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootText)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Rainbow Root Background Transparent')
            .setDesc('If Rainbow Root Text is on, completely strips the background block so the Rainbow text floats freely against your vault base.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootBgTransparent)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootBgTransparent = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Auto-color Files')
            .setDesc('Automatically gives a subtle rainbow tint and color to all files. (No manual setup required!)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoColorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.autoColorFiles = value;
                    await this.plugin.saveSettings();
                }));

        // SECTION 4: ADVANCED TUNING
        containerEl.createEl('h3', {text: 'Advanced Tuning'});

        new obsidian.Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Comma-separated list of folder names to strictly ignore (e.g. attachments, .obsidian)')
            .addTextArea(text => text
                .setPlaceholder('attachments, templates')
                .setValue(this.plugin.settings.exclusionList)
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Root Folder Opacity (%)')
            .setDesc('Controls brightness if Root Folder Fill Appearance is set to Translucent (e.g. 50%).')
            .addSlider(slider => slider
                .setLimits(1, 100, 0.1)
                .setValue(this.plugin.settings.rootOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.rootOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Subfolder Opacity (%)')
            .setDesc('Opacity for nested subfolders to properly distinguish depth hierarchy (e.g. 35%).')
            .addSlider(slider => slider
                .setLimits(1, 100, 0.1)
                .setValue(this.plugin.settings.subfolderOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.subfolderOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Opened Folder Backing Tint (%)')
            .setDesc('Controls how highly tinted the background content space becomes when you open a directory (e.g. 5.1%).')
            .addSlider(slider => slider
                .setLimits(0, 50, 0.1)
                .setValue(this.plugin.settings.tintOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.tintOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = ColorfulFoldersPlugin;
