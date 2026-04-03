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
    palette: "Pastel Dreams",
    customPalette: "",
    colorMode: "cycle",
    exclusionList: "",
    outlineOnly: false,
    activeGlow: true,
    rootStyle: "translucent",
    rootOpacity: 0.548,
    subfolderOpacity: 0.201,
    tintOpacity: 0.028,
    customFolderColors: {},
    presets: {}, // Added for color-folders-files feature parity
    glassmorphism: false,
    focusMode: false,
    autoIcons: true,
    autoIconVariety: true,
    wideAutoIcons: true,
    animateActivePath: false,
    rainbowRootText: true,
    rainbowRootBgTransparent: false,
    autoColorFiles: false,
    activeAnimationStyle: "shimmer",
    activeAnimationDuration: 4,
    showItemCounters: true,
    rootTintOpacity: 0.06
};

class ColorPickerModal extends obsidian.Modal {
    constructor(app, plugin, item, focusSection = null) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.isFolder = item instanceof obsidian.TFolder;
        this.focusSection = focusSection; // 'icon' | 'color' | 'background' | null

        // Initialize style
        const existing = this.plugin.getStyle(this.item.path);
        if (existing) {
            this.style = { ...existing };
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
                applyToFiles: false,
                iconId: ""
            };
        }
        this.activeTab = this.focusSection === 'icon' ? 'icon' :
            (this.focusSection === 'color' || this.focusSection === 'background') ? 'appearance' : 'appearance';
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.style.maxWidth = "580px";
        modalEl.style.width = "95vw";

        // ── HEADER ──────────────────────────────────────────────────────────
        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        Object.assign(header.style, {
            display: "flex", alignItems: "center", gap: "12px",
            padding: "18px 20px 12px", borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "0"
        });
        const iconWrap = header.createDiv();
        Object.assign(iconWrap.style, {
            width: "36px", height: "36px", borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: this.style.hex, flexShrink: "0"
        });
        obsidian.setIcon(iconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
        iconWrap.querySelector("svg") && (iconWrap.querySelector("svg").style.color = this.style.textColor || "#fff");

        const titleWrap = header.createDiv();
        titleWrap.createEl("div", { text: this.item.name, cls: "cf-modal-title" }).style.cssText =
            "font-size:1.1em;font-weight:700;color:var(--text-normal);line-height:1.2";
        titleWrap.createEl("div", { text: `Custom ${this.isFolder ? "Folder" : "File"} Style` }).style.cssText =
            "font-size:0.78em;color:var(--text-muted);margin-top:2px";

        // store refs for live preview
        this._headerIconWrap = iconWrap;

        // ── TABS ────────────────────────────────────────────────────────────
        const tabs = [
            { id: "appearance", label: "Appearance", icon: "palette" },
            { id: "icon", label: "Icon", icon: "smile" },
            ...(this.isFolder ? [{ id: "inherit", label: "Inheritance", icon: "git-branch" }] : []),
            { id: "presets", label: "Presets", icon: "layers" }
        ];

        const tabBar = contentEl.createDiv({ cls: "cf-tab-bar" });
        Object.assign(tabBar.style, {
            display: "flex", gap: "2px", padding: "8px 16px 0",
            borderBottom: "1px solid var(--background-modifier-border)"
        });

        const body = contentEl.createDiv({ cls: "cf-tab-body" });
        Object.assign(body.style, { padding: "16px 20px 8px", overflowY: "auto", maxHeight: "60vh" });

        const tabPanels = {};
        const tabBtns = {};

        tabs.forEach(t => {
            const btn = tabBar.createEl("button", { cls: "cf-tab-btn" });
            Object.assign(btn.style, {
                background: "none", border: "none", padding: "7px 13px",
                borderRadius: "6px 6px 0 0", cursor: "pointer", fontSize: "0.82em",
                fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
                color: "var(--text-muted)", borderBottom: "2px solid transparent",
                transition: "all 0.15s ease"
            });
            const btnIcon = btn.createSpan();
            obsidian.setIcon(btnIcon, t.icon);
            btnIcon.querySelector("svg") && Object.assign(btnIcon.querySelector("svg").style, { width: "13px", height: "13px" });
            btn.createSpan({ text: t.label });

            const panel = body.createDiv({ cls: "cf-tab-panel" });
            panel.style.display = "none";
            tabPanels[t.id] = panel;
            tabBtns[t.id] = btn;

            btn.onclick = () => this._switchTab(t.id, tabBtns, tabPanels);
        });

        this._tabBtns = tabBtns;
        this._tabPanels = tabPanels;

        // ── APPEARANCE TAB ──────────────────────────────────────────────────
        const ap = tabPanels["appearance"];

        // Live mini-preview bar
        const prev = ap.createDiv({ cls: "cf-preview-bar" });
        Object.assign(prev.style, {
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
            backgroundColor: "var(--background-secondary)", border: "1px solid var(--background-modifier-border)"
        });
        const prevIconWrap = prev.createDiv();
        Object.assign(prevIconWrap.style, {
            width: "28px", height: "28px", borderRadius: "6px", flexShrink: "0",
            backgroundColor: this.style.hex, display: "flex", alignItems: "center", justifyContent: "center"
        });
        obsidian.setIcon(prevIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
        const prevLabel = prev.createDiv({ text: this.item.name });
        Object.assign(prevLabel.style, {
            fontWeight: this.style.isBold ? "700" : "400",
            fontStyle: this.style.isItalic ? "italic" : "normal",
            color: this.style.textColor || "var(--text-normal)", fontSize: "0.9em"
        });
        this._prevIconWrap = prevIconWrap;
        this._prevLabel = prevLabel;

        const updatePreview = () => {
            // Update header icon
            this._headerIconWrap.style.backgroundColor = this.style.hex;
            this._headerIconWrap.innerHTML = "";
            obsidian.setIcon(this._headerIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            const hsvg = this._headerIconWrap.querySelector("svg");
            if (hsvg) Object.assign(hsvg.style, { color: this.style.textColor || "#fff", width: "18px", height: "18px" });
            // Update preview bar
            this._prevIconWrap.style.backgroundColor = this.style.hex;
            this._prevIconWrap.innerHTML = "";
            obsidian.setIcon(this._prevIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            this._prevLabel.style.fontWeight = this.style.isBold ? "700" : "400";
            this._prevLabel.style.fontStyle = this.style.isItalic ? "italic" : "normal";
            this._prevLabel.style.color = this.style.textColor || "var(--text-normal)";
        };
        this._updatePreview = updatePreview;

        // Background color
        const bgSetting = new obsidian.Setting(ap)
            .setName("Background Color")
            .setDesc("Primary tint color for this item.")
            .addColorPicker(p => p.setValue(this.style.hex).onChange(v => { this.style.hex = v; updatePreview(); }));
        bgSetting.settingEl.dataset.cfSection = "background";

        // Text color
        const textSetting = new obsidian.Setting(ap)
            .setName("Text Color")
            .setDesc("Override the label text color.")
            .addColorPicker(p => p.setValue(this.style.textColor || "#ffffff").onChange(v => { this.style.textColor = v; updatePreview(); }))
            .addButton(b => b.setButtonText("Reset").onClick(() => { this.style.textColor = ""; updatePreview(); }));
        textSetting.settingEl.dataset.cfSection = "color";

        // Typography
        new obsidian.Setting(ap)
            .setName("Typography")
            .setDesc("Bold and Italic toggles.")
            .addToggle(t => t.setTooltip("Bold").setValue(this.style.isBold || false).onChange(v => { this.style.isBold = v; updatePreview(); }))
            .addToggle(t => t.setTooltip("Italic").setValue(this.style.isItalic || false).onChange(v => { this.style.isItalic = v; updatePreview(); }));

        // Opacity
        new obsidian.Setting(ap)
            .setName("Opacity (%)")
            .setDesc("Background transparency (0–100).")
            .addSlider(s => s.setLimits(5, 100, 1).setValue(Math.round((this.style.opacity || 1) * 100))
                .setDynamicTooltip().onChange(v => { this.style.opacity = v / 100; }));

        // ── ICON TAB ────────────────────────────────────────────────────────
        const ic = tabPanels["icon"];

        // Current icon display
        const curIconRow = ic.createDiv();
        Object.assign(curIconRow.style, {
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 14px", borderRadius: "8px", marginBottom: "14px",
            backgroundColor: "var(--background-secondary)", border: "1px solid var(--background-modifier-border)"
        });
        const curIconBox = curIconRow.createDiv();
        Object.assign(curIconBox.style, {
            width: "40px", height: "40px", borderRadius: "8px", flexShrink: "0",
            backgroundColor: this.style.hex, display: "flex", alignItems: "center", justifyContent: "center"
        });
        obsidian.setIcon(curIconBox, this.style.iconId || (this.isFolder ? "folder" : "file"));
        const svg0 = curIconBox.querySelector("svg");
        if (svg0) Object.assign(svg0.style, { width: "22px", height: "22px", color: "#fff" });
        const curIconInfo = curIconRow.createDiv();
        curIconInfo.createEl("div", { text: "Current Icon" }).style.cssText = "font-size:0.75em;color:var(--text-muted);margin-bottom:2px";
        this._curIconNameEl = curIconInfo.createEl("div", { text: this.style.iconId || (this.isFolder ? "folder" : "file") });
        this._curIconNameEl.style.cssText = "font-size:0.9em;font-weight:600;color:var(--text-normal)";
        this._curIconBox = curIconBox;

        const clearIconBtn = curIconRow.createEl("button");
        clearIconBtn.setText("Clear");
        Object.assign(clearIconBtn.style, {
            marginLeft: "auto", padding: "4px 10px", borderRadius: "5px",
            border: "1px solid var(--background-modifier-border)",
            background: "var(--background-primary)", cursor: "pointer", fontSize: "0.8em",
            color: "var(--text-muted)"
        });
        clearIconBtn.onclick = () => {
            this.style.iconId = "";
            this._refreshIconSelection("", curIconBox);
            updatePreview();
        };

        // Search box
        const searchRow = ic.createDiv();
        Object.assign(searchRow.style, { marginBottom: "10px", position: "relative" });
        const searchInput = searchRow.createEl("input", { type: "text" });
        Object.assign(searchInput.style, {
            width: "100%", padding: "7px 12px 7px 34px", borderRadius: "7px",
            border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)",
            fontSize: "0.85em", boxSizing: "border-box"
        });
        searchInput.placeholder = "Search icons…";
        const searchIcon = searchRow.createDiv();
        Object.assign(searchIcon.style, {
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-muted)"
        });
        obsidian.setIcon(searchIcon, "search");
        const ssvg = searchIcon.querySelector("svg");
        if (ssvg) Object.assign(ssvg.style, { width: "14px", height: "14px" });

        // Icon grid
        const iconGrid = ic.createDiv({ cls: "cf-icon-grid" });
        Object.assign(iconGrid.style, {
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
            gap: "4px", maxHeight: "280px", overflowY: "auto",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "8px", padding: "8px"
        });

        // Only show proper lucide icons — filter out internal Obsidian-only IDs
        const allIcons = (obsidian.getIconIds ? obsidian.getIconIds() : [])
            .filter(id => id.startsWith('lucide-'))
            .map(id => id.replace('lucide-', ''))
            .sort();

        const renderIcons = (filter) => {
            iconGrid.empty();
            const filtered = filter ? allIcons.filter(id => id.includes(filter.toLowerCase())) : allIcons;
            filtered.slice(0, 400).forEach(id => {
                const cell = iconGrid.createDiv({ cls: "cf-icon-cell" });
                Object.assign(cell.style, {
                    width: "44px", height: "44px", borderRadius: "7px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.12s ease",
                    backgroundColor: this.style.iconId === id ? "var(--interactive-accent)" : "transparent",
                    border: "2px solid " + (this.style.iconId === id ? "var(--interactive-accent)" : "transparent")
                });
                obsidian.setIcon(cell, id);
                const cellSvg = cell.querySelector("svg");
                if (cellSvg) Object.assign(cellSvg.style, {
                    width: "18px", height: "18px",
                    color: this.style.iconId === id ? "#fff" : "var(--text-normal)"
                });
                cell.title = id;
                cell.onmouseenter = () => {
                    if (this.style.iconId !== id) cell.style.backgroundColor = "var(--background-modifier-hover)";
                };
                cell.onmouseleave = () => {
                    if (this.style.iconId !== id) cell.style.backgroundColor = "transparent";
                };
                cell.onclick = () => {
                    this.style.iconId = id;
                    this._refreshIconSelection(id, curIconBox);
                    if (this._updatePreview) this._updatePreview();
                    renderIcons(searchInput.value);
                };
            });
            if (filtered.length === 0) {
                iconGrid.createEl("div", { text: "No icons found" }).style.cssText =
                    "padding:20px;text-align:center;color:var(--text-muted);font-size:0.85em;grid-column:1/-1";
            }
        };
        renderIcons("");
        searchInput.oninput = () => renderIcons(searchInput.value);

        // ── INHERITANCE TAB ─────────────────────────────────────────────────
        if (this.isFolder && tabPanels["inherit"]) {
            const inh = tabPanels["inherit"];
            new obsidian.Setting(inh).setHeading().setName("Inheritance Options");
            new obsidian.Setting(inh).setName("Apply to Subfolders")
                .setDesc("Force nested folders to inherit this style.")
                .addToggle(t => t.setValue(this.style.applyToSubfolders || false).onChange(v => this.style.applyToSubfolders = v));
            new obsidian.Setting(inh).setName("Apply to Files")
                .setDesc("Force files inside this folder to inherit this style.")
                .addToggle(t => t.setValue(this.style.applyToFiles || false).onChange(v => this.style.applyToFiles = v));
        }

        // ── PRESETS TAB ─────────────────────────────────────────────────────
        const pr = tabPanels["presets"];
        const presetNames = Object.keys(this.plugin.settings.presets || {});
        if (presetNames.length > 0) {
            new obsidian.Setting(pr).setName("Apply Preset")
                .addDropdown(d => d.addOption("", "Select a preset...")
                    .addOptions(Object.fromEntries(presetNames.map(n => [n, n])))
                    .onChange(v => {
                        if (!v) return;
                        const p = this.plugin.settings.presets[v];
                        if (p) { this.style = { ...p }; this.onOpen(); }
                    }));
        }
        let newPresetName = "";
        new obsidian.Setting(pr).setName("Save as Preset")
            .addText(t => t.setPlaceholder("e.g. Neon Pink").onChange(v => newPresetName = v))
            .addButton(b => b.setButtonText("Save").setCta().onClick(async () => {
                if (!newPresetName) return;
                if (!this.plugin.settings.presets) this.plugin.settings.presets = {};
                this.plugin.settings.presets[newPresetName] = { ...this.style };
                await this.plugin.saveSettings();
                new obsidian.Notice(`Saved preset: ${newPresetName}`);
                this.onOpen();
            }));

        // ── FOOTER ─────────────────────────────────────────────────────────
        const footer = contentEl.createDiv({ cls: "cf-modal-footer" });
        Object.assign(footer.style, {
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 20px 16px", borderTop: "1px solid var(--background-modifier-border)",
            marginTop: "4px", gap: "8px"
        });
        const clearBtn = footer.createEl("button");
        clearBtn.setText("Clear Style");
        Object.assign(clearBtn.style, {
            padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85em",
            border: "1px solid var(--background-modifier-border)",
            background: "var(--background-primary)", color: "var(--text-muted)"
        });
        clearBtn.onclick = async () => {
            delete this.plugin.settings.customFolderColors[this.item.path];
            await this.plugin.saveSettings();
            new obsidian.Notice(`Cleared styling for ${this.item.name}`);
            this.close();
        };
        const saveBtn = footer.createEl("button");
        saveBtn.setText("Save Style");
        Object.assign(saveBtn.style, {
            padding: "7px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85em",
            fontWeight: "600", background: "var(--interactive-accent)",
            color: "var(--text-on-accent)", border: "none"
        });
        saveBtn.onclick = async () => {
            this.plugin.settings.customFolderColors[this.item.path] = this.style;
            await this.plugin.saveSettings();
            new obsidian.Notice(`Updated styling for ${this.item.name}`);
            this.close();
        };

        // Activate correct tab
        this._switchTab(this.activeTab, tabBtns, tabPanels);
    }

    _switchTab(id, tabBtns, tabPanels) {
        this.activeTab = id;
        const btns = tabBtns || this._tabBtns;
        const panels = tabPanels || this._tabPanels;
        if (!btns || !panels) return;
        Object.entries(btns).forEach(([k, btn]) => {
            const active = k === id;
            btn.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
            btn.style.borderBottom = active ? "2px solid var(--interactive-accent)" : "2px solid transparent";
            btn.style.backgroundColor = active ? "var(--background-modifier-hover)" : "transparent";
        });
        Object.entries(panels).forEach(([k, p]) => { p.style.display = k === id ? "block" : "none"; });
    }

    _refreshIconSelection(id, curIconBox) {
        curIconBox.innerHTML = "";
        obsidian.setIcon(curIconBox, id || (this.isFolder ? "folder" : "file"));
        const s = curIconBox.querySelector("svg");
        if (s) Object.assign(s.style, { width: "22px", height: "22px", color: "#fff" });
        if (this._curIconNameEl) this._curIconNameEl.setText(id || (this.isFolder ? "folder" : "file"));
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
        console.log("Loading Colorful Folders Plugin v4");
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

        this.iconCache = new Map();
        this._debounceTimer = null;
        this.safeEscape = (path) => path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.generateStyles();
        });

        // Register custom color context menu
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof obsidian.TFolder || file instanceof obsidian.TFile) {
                    const isFolder = file instanceof obsidian.TFolder;
                    const label = isFolder ? 'Folder' : 'File';

                    menu.addItem((item) => {
                        item
                            .setTitle(`Set Custom ${label} Style`)
                            .setIcon('palette');

                        const submenu = item.setSubmenu();

                        submenu.addItem((sub) => {
                            sub.setTitle('Open full settings')
                                .setIcon('settings')
                                .onClick(() => {
                                    new ColorPickerModal(this.app, this, file).open();
                                });
                        });

                        submenu.addItem((sub) => {
                            sub.setTitle('Change icon')
                                .setIcon('smile')
                                .onClick(() => {
                                    new ColorPickerModal(this.app, this, file, 'icon').open();
                                });
                        });

                        submenu.addItem((sub) => {
                            sub.setTitle('Change color')
                                .setIcon('pipette')
                                .onClick(() => {
                                    new ColorPickerModal(this.app, this, file, 'color').open();
                                });
                        });

                        submenu.addItem((sub) => {
                            sub.setTitle('Change background')
                                .setIcon('paintbrush')
                                .onClick(() => {
                                    new ColorPickerModal(this.app, this, file, 'background').open();
                                });
                        });

                        const existing = this.getStyle(file.path);
                        if (existing) {
                            submenu.addItem((sub) => {
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
                }
            })
        );



        // Regenerate on vault tree changes
        const debounced = () => this.generateStylesDebounced();
        this.registerEvent(this.app.vault.on('create', debounced));
        this.registerEvent(this.app.vault.on('delete', debounced));
        this.registerEvent(this.app.vault.on('rename', debounced));
    }

    generateStylesDebounced() {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = window.setTimeout(() => {
            this.generateStyles();
            this._debounceTimer = null;
        }, 250);
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
        this.generateStylesDebounced();
    }

    getAutoIconData(name) {
        if (!this.settings.autoIcons) return null;
        const lName = name.toLowerCase();

        // 20+ Premium Categories for Auto-Icons
        const categories = [
            { rex: /journal|daily|log|diary/, emoji: "📅", lucide: "calendar" },
            { rex: /image|photo|pic|asset|gallery|album/, emoji: "🖼️", lucide: "image" },
            { rex: /project|task|todo|work|goal|action/, emoji: "🚀", lucide: "rocket" },
            { rex: /setting|config|pref|options|setup|tool|pref/, emoji: "⚙️", lucide: "settings" },
            { rex: /read|book|paper|article|literature|lib/, emoji: "📚", lucide: "book-open" },
            { rex: /archive|old|past|backup|history|dump/, emoji: "📦", lucide: "archive" },
            { rex: /idea|brain|thought|note|learn|insight|study/, emoji: "💡", lucide: "lightbulb" },
            { rex: /personal|me|self|profile|account|bio/, emoji: "👤", lucide: "user" },
            { rex: /finance|money|bank|pay|cost|bill|price|tax|wallet/, emoji: "💸", lucide: "banknote" },
            { rex: /health|fit|exercise|diet|gym|doctor|med|sport/, emoji: "🥗", lucide: "activity" },
            { rex: /travel|trip|vacation|flight|plane|map|explore/, emoji: "✈️", lucide: "plane" },
            { rex: /tech|code|dev|script|bot|program|web|git|coding/, emoji: "💻", lucide: "code" },
            { rex: /music|audio|song|playlist|sound|record/, emoji: "🎵", lucide: "music" },
            { rex: /video|movie|film|clip|youtube|stream/, emoji: "🎬", lucide: "video" },
            { rex: /school|study|class|course|exam|edu|lecture|uni/, emoji: "🎓", lucide: "graduation-cap" },
            { rex: /people|contact|friend|family|team|group|social/, emoji: "👥", lucide: "users" },
            { rex: /inbox|new|capture|draft|start/, emoji: "📥", lucide: "inbox" },
            { rex: /chat|talk|discuss|social|comm|slack|discord/, emoji: "💬", lucide: "message-square" },
            { rex: /star|fav|important|prior|hot|best/, emoji: "⭐", lucide: "star" },
            { rex: /lock|secret|private|secure|vault|pass/, emoji: "🔒", lucide: "lock" },
            { rex: /home|house|ref|base|living/, emoji: "🏠", lucide: "home" },
            { rex: /search|find|query|explore/, emoji: "🔍", lucide: "search" },
            { rex: /mail|letter|message|email/, emoji: "📧", lucide: "mail" },
            { rex: /write|pen|edit|create|author/, emoji: "🖋️", lucide: "pen-tool" }
        ];

        for (const cat of categories) {
            if (cat.rex.test(lName)) return cat;
        }
        return null;
    }

    generateStyles() {
        let css = "";
        const root = this.app.vault.getRoot();
        if (!root) return;

        // Pre-cached common SVG markers
        const CF_FOLDER_ICON = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
        const CF_FILE_ICON = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>');
        const CF_FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; opacity: 0.85; vertical-align: middle;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        const CF_FOLDER_CLOSED = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
        const CF_FOLDER_OPEN = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>');

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
            heatmapData = new Map();
            const files = this.app.vault.getFiles();
            for (let i = 0, len = files.length; i < len; i++) {
                const f = files[i];
                let p = f.parent;
                const mtime = f.stat.mtime;
                while (p) {
                    if ((heatmapData.get(p.path) || 0) < mtime) {
                        heatmapData.set(p.path, mtime);
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

        const countCache = new Map();
        const countItems = (folderItem) => {
            if (countCache.has(folderItem.path)) return countCache.get(folderItem.path);
            let files = 0;
            let folders = 0;
            if (folderItem.children) {
                for (const c of folderItem.children) {
                    if (c.children === undefined) {
                        files++;
                    } else {
                        folders++;
                        const sub = countItems(c);
                        files += sub.files;
                        folders += sub.folders;
                    }
                }
            }
            const res = { files, folders };
            countCache.set(folderItem.path, res);
            return res;
        };

        const traverse = (folder, depth, rootIndex = 0, passedColor = null, inheritedStyle = null) => {
            const copyFolders = folder.children
                .filter(c => c.children !== undefined)
                .sort((a, b) => a.name.localeCompare(b.name));

            const copyFiles = folder.children
                .filter(c => c.children === undefined)
                .sort((a, b) => a.name.localeCompare(b.name));

            let validIndex = 0;

            // 1. Handle File Inheritance / Auto-color Files
            if (passedColor || this.settings.autoColorFiles || this.settings.autoIcons) {
                let fileIndex = 0;
                for (const child of copyFiles) {
                    const safePath = this.safeEscape(child.path);
                    let color;
                    let fileStyle = this.getStyle(child.path);


                    if (fileStyle) {
                        const s = fileStyle;
                        const customParsed = this.parseCustomPalette(s.hex);
                        color = customParsed ? customParsed[0] : currentPalette[(fileIndex + depth + rootIndex) % currentPalette.length];
                    } else if (inheritedStyle && inheritedStyle.applyToFiles && passedColor) {
                        color = passedColor;
                    } else if (this.settings.autoColorFiles) {
                        color = currentPalette[(validIndex + fileIndex) % currentPalette.length];
                    } else {
                        // Inherit parent folder color for the icon even if shouldColorFile is false!
                        color = passedColor || { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" };
                    }

                    const shouldColorFile = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles) || this.settings.autoColorFiles;
                    const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);

                    // Standard files shouldn't be dimmed if they have a tint
                    const op = activeStyle && activeStyle.opacity !== undefined ? activeStyle.opacity : 1.0;
                    const text = activeStyle && activeStyle.textColor ? activeStyle.textColor : (shouldColorFile ? "#ffffff" : "var(--text-normal)");
                    const isBold = activeStyle && activeStyle.isBold;
                    const isItalic = activeStyle && activeStyle.isItalic;

                    css += `
                        body .nav-file-title[data-path="${safePath}"],
                        body .tree-item-self[data-path="${safePath}"],
                        body .notebook-navigator [data-path="${safePath}"] {
                            ${shouldColorFile ? `
                                background-color: rgba(${color.rgb}, 0.1) !important;
                                border-left: 2px solid rgba(${color.rgb}, 0.4) !important;
                            ` : ''}
                            opacity: ${op} !important;
                            color: ${text} !important;
                            font-weight: ${isBold ? 'bold' : 'normal'} !important;
                            font-style: ${isItalic ? 'italic' : 'normal'} !important;
                            border-radius: 4px !important;
                        }
                    `;

                    // Auto-Icon logic for files (Moved here to ensure 'color' is defined!)
                    const autoIcon = this.getAutoIconData(child.name);
                    let isEmoji = false;
                    let autoIconContent = "";
                    let autoLucideId = null;

                    if (autoIcon) {
                        if (this.settings.wideAutoIcons) {
                            autoLucideId = autoIcon.lucide;
                        } else {
                            autoIconContent = `"${autoIcon.emoji} "`;
                            isEmoji = true;
                        }
                    }

                    if (autoLucideId) {
                        let svgStr = this.iconCache.get(autoLucideId);
                        if (!svgStr) {
                            const tempEl = document.createElement('div');
                            obsidian.setIcon(tempEl, autoLucideId);
                            const svgEl = tempEl.querySelector('svg');
                            if (svgEl) {
                                svgEl.style.width = "17px";
                                svgEl.style.height = "17px";
                                svgEl.style.marginRight = "6px";
                                svgEl.style.opacity = "0.85";
                                svgEl.style.verticalAlign = "middle";
                                svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                svgStr = encodeURIComponent(svgEl.outerHTML);
                                this.iconCache.set(autoLucideId, svgStr);
                            }
                        }
                        if (svgStr) {
                            css += `
                                body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                                body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                                body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                    content: '' !important;
                                    display: inline-block !important;
                                    width: 17px !important;
                                    height: 17px !important;
                                    background-color: ${color.hex} !important;
                                    -webkit-mask-image: url('data:image/svg+xml;utf8,${svgStr}') !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                    vertical-align: text-bottom !important;
                                    opacity: 0.85 !important;
                                }
                                body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                    display: none !important;
                                }
                            `;
                        }
                    } else if (isEmoji) {
                        css += `
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                content: ${autoIconContent} !important;
                            }
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    } else if (this.settings.autoIcons) {
                        css += `
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 17px !important;
                                height: 17px !important;
                                background-color: ${color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(CF_FILE_TEXT_ICON)}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.85 !important;
                            }
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }

                    fileIndex++;
                }

            }

            // 2. Style current folder's children container (Tint + Line)
            if (depth > 0 && passedColor) {
                const safePath = this.safeEscape(folder.path);
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

                const safePath = this.safeEscape(child.path);

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

                const autoIcon = this.getAutoIconData(child.name);
                let isEmoji = false;
                let autoIconContent = "";
                let autoLucideId = null;

                if (autoIcon) {
                    if (this.settings.wideAutoIcons) {
                        autoLucideId = autoIcon.lucide;
                    } else {
                        autoIconContent = `"${autoIcon.emoji} "`;
                        isEmoji = true;
                    }
                }

                if (activeStyle && activeStyle.iconId) {
                    let svgStr = this.iconCache.get(activeStyle.iconId);
                    if (!svgStr) {
                        const tempEl = document.createElement('div');
                        obsidian.setIcon(tempEl, activeStyle.iconId);
                        const svgEl = tempEl.querySelector('svg');
                        if (svgEl) {
                            svgEl.removeAttribute('width');
                            svgEl.removeAttribute('height');
                            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                            svgStr = encodeURIComponent(svgEl.outerHTML);
                            this.iconCache.set(activeStyle.iconId, svgStr);
                        }
                    }

                    if (svgStr) {
                        css += `
                            body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 14px !important;
                                height: 14px !important;
                                background-color: ${color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;utf8,${svgStr}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 5px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.85 !important;
                            }
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }
                } else if (autoLucideId) {
                    let svgStr = this.iconCache.get(autoLucideId);
                    if (!svgStr) {
                        const tempEl = document.createElement('div');
                        obsidian.setIcon(tempEl, autoLucideId);
                        const svgEl = tempEl.querySelector('svg');
                        if (svgEl) {
                            svgEl.removeAttribute('width'); svgEl.removeAttribute('height');
                            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                            svgStr = encodeURIComponent(svgEl.outerHTML);
                            this.iconCache.set(autoLucideId, svgStr);
                        }
                    }
                    if (svgStr) {
                        css += `
                            body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 18px !important;
                                height: 18px !important;
                                background-color: ${color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;utf8,${svgStr}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.8 !important;
                            }
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }
                } else if (isEmoji) {
                    css += `
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                        body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                            content: ${autoIconContent};
                        }
                        body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                            display: none !important;
                        }
                    `;
                } else if (this.settings.autoIcons) {
                    // Default folder SVG icon for standard Obsidian trees. Excluded from notebook-navigator to prevent duplication!
                    css += `
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: '';
                            display: inline-block;
                            width: 15px;
                            height: 15px;
                            background-color: currentColor;
                            -webkit-mask-repeat: no-repeat;
                            -webkit-mask-position: center;
                            margin-right: 6px;
                            vertical-align: text-bottom;
                            opacity: 0.8;
                        }
                        
                        /* Closed Folder State */
                        body .nav-folder.is-collapsed > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item.is-collapsed > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url('data:image/svg+xml;utf8,${CF_FOLDER_CLOSED}');
                        }

                        /* Open Folder State */
                        body .nav-folder:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url('data:image/svg+xml;utf8,${CF_FOLDER_OPEN}');
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
                    body .notebook-navigator [data-path="${safePath}"] {
                        background-color: ${bg} !important;
                        opacity: ${isCustom ? op : 1.0} !important;
                        border-radius: 4px !important;
                        ${glassCss}
                        transition: background-color 0.2s ease, filter 0.2s ease !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner,
                    body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name {
                        ${textCss}
                    }
                    body .nav-folder-title[data-path="${safePath}"] svg,
                    body .tree-item-self[data-path="${safePath}"] svg,
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-collapse-indicator svg {
                        color: ${(depth === 0 && rootBgStyle === 'solid' && !outlineOnly) ? text : color.hex} !important;
                        opacity: 1 !important;
                    }
                    body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon svg,
                    body .notebook-navigator [data-path="${safePath}"] .nn-parent-folder-icon svg {
                        color: ${(depth === 0 && rootBgStyle === 'solid' && !outlineOnly) ? text : color.hex} !important;
                        opacity: 1 !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"]:hover,
                    body .tree-item-self[data-path="${safePath}"]:hover,
                    body .notebook-navigator [data-path="${safePath}"]:hover {
                        filter: brightness(1.2);
                        ${this.settings.glassmorphism ? 'backdrop-filter: blur(12px) saturate(150%);' : ''}
                    }
                `;

                if (this.settings.showItemCounters) {
                    const counts = countItems(child);
                    // Open Folder Lucide icon for maximum clarity at small scales
                    const totalWidth = 80;
                    const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
                        <g stroke="${color.hex}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 3) scale(0.65)">
                            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
                        </g>
                        <text x="21" y="15" fill="${color.hex}" font-family="var(--font-interface), sans-serif" font-size="11" font-weight="500">${counts.folders}</text>
                        <g stroke="${color.hex}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(42, 3) scale(0.65)">
                            <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"/>
                            <path d="M15 2v5h5"/>
                            <path d="M2 17.6V7.1c0-.4.2-.8.5-1.1.3-.3.7-.5 1.1-.5h3.3"/>
                            <path d="M13 22H3.6c-.4 0-.8-.2-1.1-.5-.3-.3-.5-.7-.5-1.1V10"/>
                        </g>
                        <text x="60" y="15" fill="${color.hex}" font-family="var(--font-interface), sans-serif" font-size="11" font-weight="500">${counts.files}</text>
                    </svg>`;

                    const combinedIconUrl = `url('data:image/svg+xml;base64,${btoa(combinedSvg)}')`;

                    css += `
                        body .nav-folder-title[data-path="${safePath}"]::after,
                        body .tree-item-self[data-path="${safePath}"]::after {
                            content: ${combinedIconUrl} !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            width: ${totalWidth}px !important;
                            height: 20px !important;
                            margin-left: auto !important;
                            padding-right: 2px !important;
                            pointer-events: none !important;
                            opacity: 0.75 !important;
                        }
                    `;
                }

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
                        body .notebook-navigator .nn-navitem[data-path="${safePath}"].nn-selected {
                            filter: brightness(1.05);
                            box-shadow: 0 0 8px rgba(${color.rgb}, 0.1) !important;
                            z-index: 1;
                            --cf-rgb: ${passedColor ? passedColor.rgb : color.rgb};
                            ${titleAnim}
                        }
                    `;
                }

                const nextInherited = (activeStyle && activeStyle.applyToSubfolders) ? activeStyle : inheritedStyle;
                traverse(child, depth + 1, depth === 0 ? validIndex : rootIndex, color, nextInherited);
                validIndex++;
            }
        };

        traverse(root, 0);

        // Standalone File Styling
        for (const [path, style] of Object.entries(this.settings.customFolderColors)) {
            const tfile = this.app.vault.getAbstractFileByPath(path);
            if (tfile instanceof obsidian.TFile) {
                const s = typeof style === 'string' ? { hex: style } : style;
                const customParsed = this.parseCustomPalette(s.hex);
                const color = customParsed ? customParsed[0] : { rgb: "255, 255, 255", hex: s.hex };
                const safePath = this.safeEscape(path);
                const op = s.opacity !== undefined ? s.opacity : 1.0;

                css += `
                    body .nav-file-title[data-path="${safePath}"],
                    body .tree-item-self[data-path="${safePath}"],
                    body .notebook-navigator [data-path="${safePath}"] {
                        background-color: rgba(${color.rgb}, ${op}) !important;
                        opacity: 1.0 !important;
                        color: ${s.textColor || color.hex} !important;
                        font-weight: ${s.isBold ? 'bold' : 'normal'} !important;
                        font-style: ${s.isItalic ? 'italic' : 'normal'} !important;
                        border-radius: 4px !important;
                    }
                `;

                // Inject custom icon if one is selected
                if (s.iconId) {
                    let svgStr = this.iconCache.get(s.iconId);
                    if (!svgStr) {
                        const tempEl = document.createElement('div');
                        obsidian.setIcon(tempEl, s.iconId);
                        const svgEl = tempEl.querySelector('svg');
                        if (svgEl) {
                            svgEl.removeAttribute('width');
                            svgEl.removeAttribute('height');
                            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                            svgStr = encodeURIComponent(svgEl.outerHTML);
                            this.iconCache.set(s.iconId, svgStr);
                        }
                    }

                    if (svgStr) {
                        css += `
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 17px !important;
                                height: 17px !important;
                                background-color: ${s.textColor || color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;utf8,${svgStr}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.85 !important;
                            }
                            body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }
                } else if (this.settings.autoIcons) {
                    // Manual/Standalone file checking
                    const shouldColor = this.settings.autoColorFiles || s;
                    const iconOpacity = shouldColor ? 0.9 : 0.5;
                    const iconColor = shouldColor ? (s.textColor || color.hex) : 'var(--text-muted)';

                    css += `
                        body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                        body .notebook-navigator [data-path="${safePath}"] .nn-navitem-name::before {
                            content: '' !important;
                            display: inline-block !important;
                            width: 17px !important;
                            height: 17px !important;
                            background-color: ${iconColor} !important;
                            -webkit-mask-image: url('data:image/svg+xml;utf8,${encodeURIComponent(CF_FILE_TEXT_ICON)}') !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            -webkit-mask-size: contain !important;
                            margin-right: 6px !important;
                            vertical-align: middle !important;
                            opacity: ${iconOpacity} !important;
                        }
                        body .notebook-navigator [data-path="${safePath}"] .nn-navitem-icon {
                            display: none !important;
                        }
                    `;
                }
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
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Colorful Folders Configuration' });

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
        containerEl.createEl('h3', { text: 'Core Configuration' });

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
        containerEl.createEl('h3', { text: 'Visual Styles' });

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

        // SECTION 3: AUTO-GENERATED ICONS
        containerEl.createEl('h3', { text: 'Auto-Generated Icons' });

        new obsidian.Setting(containerEl)
            .setName('Enable Automatic Icons')
            .setDesc('Natively injects icons for common folder and file names (e.g., Journal -> 📅). Features 20+ smart categories.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(containerEl)
                .setName('Expanded Icon Variety')
                .setDesc('Enable 20+ pattern-matching categories including Finance, Tech, Health, and more.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.autoIconVariety)
                    .onChange(async (value) => {
                        this.plugin.settings.autoIconVariety = value;
                        await this.plugin.saveSettings();
                    }));

            new obsidian.Setting(containerEl)
                .setName('Wide Icon Rendering (Lucide SVGs)')
                .setDesc('Replaces emojis with high-clarity Lucide icons. Adds a modern, wider look for improved visibility.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // SECTION 4: ACTIVE PATH & TYPOGRAPHY
        containerEl.createEl('h3', { text: 'Active Path & Typography' });

        new obsidian.Setting(containerEl)
            .setName('Show Item Counters')
            .setDesc('Displays recursive folder and file counts next to folders in the standard file explorer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                }));

        // SECTION 3: ACTIVE PATH & TYPOGRAPHY
        containerEl.createEl('h3', { text: 'Active Path & Typography' });

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
                    .setValue(this.plugin.settings.activeAnimationStyle || "shimmer")
                    .onChange(async (value) => {
                        this.plugin.settings.activeAnimationStyle = value;
                        await this.plugin.saveSettings();
                    }));

            new obsidian.Setting(containerEl)
                .setName('Animation Duration (s)')
                .setDesc('Controls how fast the animation plays (e.g. 3.0 seconds). Lower is faster.')
                .addSlider(slider => slider
                    .setLimits(0.5, 10.0, 0.5)
                    .setValue(this.plugin.settings.activeAnimationDuration !== undefined ? this.plugin.settings.activeAnimationDuration : 4)
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
                    this.plugin.generateStylesDebounced();
                }));

        // SECTION 4: ADVANCED TUNING
        containerEl.createEl('h3', { text: 'Advanced Tuning' });

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
