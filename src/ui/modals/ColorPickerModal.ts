import * as obsidian from 'obsidian';
import { FolderStyle, EffectiveStyle, IColorfulFoldersPlugin } from '../../common/types';
import { createVisualColorPicker } from '../components/ColorPicker';

export class ColorPickerModal extends obsidian.Modal {
plugin: IColorfulFoldersPlugin;
item: obsidian.TAbstractFile;
isFolder: boolean;
focusSection: string | null;
style: EffectiveStyle & FolderStyle;
activeTab: string;
_headerIconWrap: HTMLElement;
_tabBtns: Record<string, HTMLElement>;
_tabPanels: Record<string, HTMLElement>;
_prevIconWrap: HTMLElement;
_prevLabel: HTMLElement;
_updatePreview: () => void;
_curIconNameEl: HTMLElement;
_curIconBox: HTMLElement;
_headerIconSize: number;
_prevIconSize: number;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, item: obsidian.TAbstractFile, focusSection: string | null = null) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.isFolder = item instanceof obsidian.TFolder;
        this.focusSection = focusSection; // 'icon' | 'color' | 'background' | null

        // Initialize style - pre-fill from current appearance if no custom style exists
        const effective = this.plugin.getEffectiveStyle(this.item) || {
            hex: "#eb6f92", textColor: "", iconColor: "", isBold: this.isFolder, isItalic: false,
            opacity: 1.0, applyToSubfolders: false, applyToFiles: false, iconId: ""
        };
        const existing = (this.plugin.getStyle(this.item.path) || {}) as FolderStyle;
        
        // Merge: effective provides the "live" fallback, existing provides the user's explicit overrides
        this.style = { ...effective, ...existing } as EffectiveStyle & FolderStyle;
        // Ensure some defaults
        if (this.style.isBold === undefined && this.isFolder) this.style.isBold = true;
        if (this.style.opacity === undefined) this.style.opacity = 1.0;
        this.activeTab = (this.focusSection === 'icon' || (this as any).activeTab === 'icon') ? 'icon' : 'appearance';
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
        const iconScale = this.plugin.settings.iconScale || 1.0;
        const headerIconW = Math.round(18 * iconScale);
        const headerIconSize = Math.round(36 * (iconScale > 1.0 ? iconScale : 1.0)); // Adjust container if needed

        const iconWrap = header.createDiv();
        Object.assign(iconWrap.style, {
            width: `${headerIconSize}px`, height: `${headerIconSize}px`, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: this.style.hex, flexShrink: "0"
        });
        obsidian.setIcon(iconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
        iconWrap.querySelector("svg") && (iconWrap.querySelector("svg").style.color = this.style.iconColor || this.style.textColor || "#fff");
        if (iconWrap.querySelector("svg")) {
            Object.assign(iconWrap.querySelector("svg").style, { width: `${headerIconW}px`, height: `${headerIconW}px` });
        }

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
            const iconScale = this.plugin.settings.iconScale || 1.0;
            const previewIconW = Math.round(16 * iconScale);
            const headerIconW = Math.round(18 * iconScale);

            const effectiveIconColor = this.style.iconColor || this.style.hex || "#fff";
            // Update header icon
            this._headerIconWrap.style.backgroundColor = this.style.hex;
            this._headerIconWrap.innerHTML = "";
            obsidian.setIcon(this._headerIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            const hsvg = this._headerIconWrap.querySelector("svg");
            if (hsvg) Object.assign(hsvg.style, { color: effectiveIconColor, width: `${headerIconW}px`, height: `${headerIconW}px` });
            // Update preview bar
            this._prevIconWrap.style.backgroundColor = this.style.hex;
            this._prevIconWrap.innerHTML = "";
            obsidian.setIcon(this._prevIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            const prevSvg = this._prevIconWrap.querySelector("svg");
            if (prevSvg) Object.assign(prevSvg.style, { color: effectiveIconColor, width: `${previewIconW}px`, height: `${previewIconW}px` });
            this._prevLabel.style.fontWeight = this.style.isBold ? "700" : "400";
            this._prevLabel.style.fontStyle = this.style.isItalic ? "italic" : "normal";
            this._prevLabel.style.color = this.style.textColor || "var(--text-normal)";
        };
        this._updatePreview = updatePreview;

        // ── SECTION: Background Color ──
        const bgSection = ap.createDiv({ cls: 'cf-picker-section' });
        const isBgFocus = this.focusSection === 'background';
        Object.assign(bgSection.style, {
            padding: "10px", borderRadius: "8px", 
            border: isBgFocus ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)",
            backgroundColor: isBgFocus ? "rgba(var(--interactive-accent-rgb), 0.05)" : "rgba(var(--mono-rgb-100), 0.03)", 
            marginBottom: "12px",
            transition: "all 0.5s ease"
        });
        if (isBgFocus) bgSection.style.boxShadow = "0 0 15px rgba(var(--interactive-accent-rgb), 0.15)";

        const bgHeader = bgSection.createDiv();
        Object.assign(bgHeader.style, { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const bgLabel = bgHeader.createDiv();
        bgLabel.style.cssText = 'font-size: 0.85em; font-weight: 700; color: var(--text-normal); opacity: 0.9;';
        bgLabel.textContent = 'Background styling';

        const applyBgBtn = bgHeader.createEl("button", { text: "Apply" });
        Object.assign(applyBgBtn.style, {
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyBgBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {}) as FolderStyle;
            existing.hex = this.style.hex;
            existing.opacity = this.style.opacity;
            if (this.style.applyToSubfolders !== undefined) existing.applyToSubfolders = this.style.applyToSubfolders;
            if (this.style.applyToFiles !== undefined) existing.applyToFiles = this.style.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.close();
        };

        const bgPickerContainer = bgSection.createDiv();
        createVisualColorPicker(bgPickerContainer, this.style.hex, (hex, alpha) => {
            this.style.hex = hex;
            this.style.opacity = alpha;
            updatePreview();
        }, { showAlpha: true, initialAlpha: this.style.opacity || 1.0 });

        // ── SECTION: Text Color ──
        const txtSection = ap.createDiv({ cls: 'cf-picker-section' });
        const isColorFocus = this.focusSection === 'color';
        Object.assign(txtSection.style, {
            padding: "10px", borderRadius: "8px", 
            border: isColorFocus ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)",
            backgroundColor: isColorFocus ? "rgba(var(--interactive-accent-rgb), 0.05)" : "rgba(var(--mono-rgb-100), 0.03)", 
            marginBottom: "12px",
            transition: "all 0.5s ease"
        });
        if (isColorFocus) txtSection.style.boxShadow = "0 0 15px rgba(var(--interactive-accent-rgb), 0.15)";

        const txtHeader = txtSection.createDiv();
        Object.assign(txtHeader.style, { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const txtLabel = txtHeader.createDiv();
        txtLabel.style.cssText = 'font-size: 0.85em; font-weight: 700; color: var(--text-normal); opacity: 0.9;';
        txtLabel.textContent = 'Text styling';

        const txtActionsRow = txtHeader.createDiv();
        Object.assign(txtActionsRow.style, { display: "flex", gap: "6px" });

        const resetTxtBtn = txtActionsRow.createEl("button", { text: "Reset" });
        Object.assign(resetTxtBtn.style, { padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", border: "1px solid var(--background-modifier-border)", background: "none", color: "var(--text-muted)", cursor: "pointer" });
        
        const applyTxtBtn = txtActionsRow.createEl("button", { text: "Apply" });
        Object.assign(applyTxtBtn.style, {
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyTxtBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {}) as FolderStyle;
            existing.textColor = this.style.textColor;
            existing.isBold = this.style.isBold;
            existing.isItalic = this.style.isItalic;
            if (this.style.applyToSubfolders !== undefined) existing.applyToSubfolders = this.style.applyToSubfolders;
            if (this.style.applyToFiles !== undefined) existing.applyToFiles = this.style.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.close();
        };

        const textPickerContainer = txtSection.createDiv();
        const textPicker = createVisualColorPicker(textPickerContainer, this.style.textColor || '#ffffff', (hex) => {
            this.style.textColor = hex;
            updatePreview();
        }, { showAlpha: false });
        resetTxtBtn.onclick = () => { this.style.textColor = ''; textPicker.setHex('#ffffff'); updatePreview(); };

        // Inline Typography
        const typoRow = txtSection.createDiv();
        Object.assign(typoRow.style, { display: "flex", gap: "10px", marginTop: "8px" });
        const buildToggle = (lbl, key) => {
            const wrap = typoRow.createDiv();
            Object.assign(wrap.style, { display: "flex", alignItems: "center", gap: "4px" });
            const chk = wrap.createEl("input", { type: "checkbox" });
            chk.checked = !!this.style[key];
            const span = wrap.createEl("span", { text: lbl });
            span.style.fontSize = "0.75em";
            chk.onchange = () => { this.style[key] = chk.checked; updatePreview(); };
        };
        buildToggle("Bold", "isBold");
        buildToggle("Italic", "isItalic");

        // Quick Apply Buttons for Appearance
        // Icon selection tab info...


        // ── ICON TAB ────────────────────────────────────────────────────────
        const ic = tabPanels["icon"];

        // Current icon display
        // ── SECTION: Icon Color ──
        const icColorSection = ic.createDiv();
        Object.assign(icColorSection.style, {
            padding: "10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.03)", marginBottom: "12px"
        });

        const icColorHeader = icColorSection.createDiv();
        Object.assign(icColorHeader.style, { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const icColorLabel = icColorHeader.createDiv();
        icColorLabel.style.cssText = 'font-size: 0.85em; font-weight: 700; color: var(--text-normal); opacity: 0.9;';
        icColorLabel.textContent = 'Icon styling';

        const icColorActions = icColorHeader.createDiv();
        Object.assign(icColorActions.style, { display: "flex", gap: "6px" });
        const resetIcBtn = icColorActions.createEl("button", { text: "Reset" });
        Object.assign(resetIcBtn.style, { padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", border: "1px solid var(--background-modifier-border)", background: "none", color: "var(--text-muted)", cursor: "pointer" });
        
        const applyIcBtn = icColorActions.createEl("button", { text: "Apply" });
        Object.assign(applyIcBtn.style, {
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyIcBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {}) as FolderStyle;
            existing.iconId = this.style.iconId;
            existing.iconColor = this.style.iconColor;
            if (this.style.applyToSubfolders !== undefined) existing.applyToSubfolders = this.style.applyToSubfolders;
            if (this.style.applyToFiles !== undefined) existing.applyToFiles = this.style.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.close();
        };

        const icColorPickerContainer = icColorSection.createDiv();
        const icColorPicker = createVisualColorPicker(icColorPickerContainer, this.style.iconColor || this.style.hex || '#eb6f92', (hex) => {
            this.style.iconColor = hex;
            updatePreview();
        }, { showAlpha: false });
        resetIcBtn.onclick = () => { this.style.iconColor = ''; icColorPicker.setHex(this.style.hex || '#eb6f92'); updatePreview(); };

        // ── SECTION: Current Icon Box ──
        const curIconRow = ic.createDiv();
        Object.assign(curIconRow.style, {
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px",
            padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", marginBottom: "12px"
        });
        const curIconBox = curIconRow.createDiv();
        Object.assign(curIconBox.style, {
            width: "36px", height: "36px", borderRadius: "8px", background: "var(--interactive-accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0"
        });
        this._refreshIconSelection(this.style.iconId, curIconBox);

        const curIconHeader = curIconRow.createDiv();
        Object.assign(curIconHeader.style, { display: "flex", alignItems: "center", justifyContent: "space-between", flex: "1", minWidth: "150px" });
        
        const curIconInfo = curIconHeader.createDiv();
        curIconInfo.createEl("div", { text: "Current Icon" }).style.cssText = "font-size:0.75em;color:var(--text-muted);margin-bottom:0px";
        this._curIconNameEl = curIconInfo.createEl("div", { text: this.style.iconId || (this.isFolder ? "folder" : "file") });
        this._curIconNameEl.style.cssText = "font-size:0.85em;font-weight:600;color:var(--text-normal)";
        this._curIconBox = curIconBox;

        const applyIconBtn = curIconHeader.createEl("button", { text: "Apply Icon Only" });
        Object.assign(applyIconBtn.style, {
            padding: "3px 10px", borderRadius: "5px", fontSize: "0.75em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyIconBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {}) as FolderStyle;
            existing.iconId = this.style.iconId;
            existing.iconColor = this.style.iconColor;
            // Respect inheritance toggles if they were changed
            if (this.style.applyToSubfolders !== undefined) existing.applyToSubfolders = this.style.applyToSubfolders;
            if (this.style.applyToFiles !== undefined) existing.applyToFiles = this.style.applyToFiles;

            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            new obsidian.Notice(`Icon updated for ${this.item.name}`);
            this.close();
        };

        // Search & Filter Row
        const searchRow = ic.createDiv();
        Object.assign(searchRow.style, { display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" });
        
        const searchInputWrap = searchRow.createDiv();
        Object.assign(searchInputWrap.style, { position: "relative", flex: "1" });
        
        const searchInput = searchInputWrap.createEl("input", { type: "text" });
        Object.assign(searchInput.style, {
            width: "100%", padding: "7px 12px 7px 34px", borderRadius: "7px",
            border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)",
            fontSize: "0.85em", boxSizing: "border-box"
        });
        searchInput.placeholder = "Search icons…";
        
        const searchIcon = searchInputWrap.createDiv();
        Object.assign(searchIcon.style, {
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-muted)"
        });
        obsidian.setIcon(searchIcon, "search");
        const ssvg = searchIcon.querySelector("svg");
        if (ssvg) Object.assign(ssvg.style, { width: "14px", height: "14px" });

        // Pack Filter Dropdown
        const customIds = Object.keys(this.plugin.settings.customIcons);
        const prefixes = new Set(['all', 'lucide']);
        customIds.forEach(id => {
            const parts = id.split('-');
            if (parts.length > 1) prefixes.add(parts[0]);
            else prefixes.add('custom');
        });

        const filterSelect = searchRow.createEl("select");
        Object.assign(filterSelect.style, {
            padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)", fontSize: "0.85em"
        });
        Array.from(prefixes).sort().forEach(p => {
            const opt = filterSelect.createEl("option", { text: p === 'all' ? 'All Packs' : p.toUpperCase(), value: p });
            if (p === 'all') opt.selected = true;
        });


        // Icon grid
        const iconGrid = ic.createDiv({ cls: "cf-icon-grid" });
        Object.assign(iconGrid.style, {
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
            gap: "4px", maxHeight: "280px", overflowY: "auto",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "8px", padding: "8px"
        });

        // Merge custom icons into the list
        const lucideIcons = (obsidian.getIconIds ? obsidian.getIconIds() : [])
            .filter(id => id.startsWith('lucide-'))
            .map(id => id.replace('lucide-', ''));
        
        // Prioritize custom icons at the top
        const allIconsSet = new Set([...customIds, ...lucideIcons]);
        const allIcons = Array.from(allIconsSet);

        const renderIcons = (search, packFilter = "all") => {
            iconGrid.empty();
            let filtered = allIcons;
            
            // 1. Apply Pack Filter
            if (packFilter !== "all") {
                if (packFilter === "lucide") {
                    filtered = lucideIcons;
                } else {
                    filtered = customIds.filter(id => {
                        if (packFilter === "custom") return !id.includes("-");
                        return id.startsWith(packFilter + "-");
                    });
                }
            }

            // 2. Apply Search Filter
            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(id => id.toLowerCase().includes(s));
            }

            // 3. Final display (Prioritized and capped)
            filtered.slice(0, 1000).forEach(id => {
                const iconScale = this.plugin.settings.iconScale || 1.0;
                const gridIconW = Math.round(24 * iconScale);
                const cellSize = Math.round(44 * (iconScale > 1.0 ? iconScale : 1.0));

                const cell = iconGrid.createDiv({ cls: "cf-icon-cell" });
                Object.assign(cell.style, {
                    width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: "7px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.12s ease",
                    backgroundColor: this.style.iconId === id ? "var(--interactive-accent)" : "transparent",
                    border: "2px solid " + (this.style.iconId === id ? "var(--interactive-accent)" : "transparent")
                });
                obsidian.setIcon(cell, id);
                const cellSvg = cell.querySelector("svg");
                if (cellSvg) {
                    cellSvg.removeAttribute('width');
                    cellSvg.removeAttribute('height');
                    Object.assign(cellSvg.style, {
                        width: `${gridIconW}px`, height: `${gridIconW}px`,
                        color: this.style.iconId === id ? "#fff" : "var(--text-normal)"
                    });
                }
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
                    renderIcons(searchInput.value, filterSelect.value);
                };
            });
            if (filtered.length === 0) {
                iconGrid.createEl("div", { text: "No icons found" }).style.cssText =
                    "padding:20px;text-align:center;color:var(--text-muted);font-size:0.85em;grid-column:1/-1";
            }
        };
        renderIcons("", "all");
        searchInput.oninput = () => renderIcons(searchInput.value, filterSelect.value);
        filterSelect.onchange = () => renderIcons(searchInput.value, filterSelect.value);

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

        const pr = tabPanels["presets"];
        pr.createEl("h4", { text: "Saved Presets", cls: "cf-section-title" }).style.cssText = "font-size:0.85em;margin-bottom:10px;opacity:0.8";

        const presetList = pr.createDiv({ cls: "cf-preset-list" });
        Object.assign(presetList.style, {
            display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px",
            maxHeight: "200px", overflowY: "auto", padding: "4px"
        });

        const presets = this.plugin.settings.presets || {};
        const presetNames = Object.keys(presets);

        if (presetNames.length === 0) {
            presetList.createEl("div", { text: "No presets saved yet.", cls: "cf-empty-state" })
                .style.cssText = "font-size:0.8em;color:var(--text-muted);text-align:center;padding:20px";
        } else {
            presetNames.forEach(name => {
                const pData = presets[name];
                const item = presetList.createDiv({ cls: "cf-preset-item" });
                Object.assign(item.style, {
                    display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
                    borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
                    backgroundColor: "var(--background-secondary-alt)", transition: "all 0.1s ease"
                });

                const colorPrev = item.createDiv();
                Object.assign(colorPrev.style, {
                    width: "20px", height: "20px", borderRadius: "4px", backgroundColor: pData.hex || "#eb6f92", flexShrink: "0"
                });

                const nameLabel = item.createDiv({ text: name });
                Object.assign(nameLabel.style, { flex: "1", fontSize: "0.85em", fontWeight: "600", color: "var(--text-normal)" });

                const applyBtn = item.createEl("button", { text: "Apply" });
                Object.assign(applyBtn.style, { padding: "2px 8px", fontSize: "0.75em", borderRadius: "4px", cursor: "pointer" });
                applyBtn.onclick = () => {
                    this.style = { ...pData } as EffectiveStyle & FolderStyle;
                    this.onOpen();
                };

                const delBtn = item.createEl("button", { cls: "clickable-icon" });
                Object.assign(delBtn.style, { padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" });
                obsidian.setIcon(delBtn, "trash-2");
                const delSvg = delBtn.querySelector("svg");
                if (delSvg) Object.assign(delSvg.style, { width: "14px", height: "14px", color: "var(--text-error)" });
                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    delete this.plugin.settings.presets[name];
                    await this.plugin.saveSettings();
                    new obsidian.Notice(`Deleted preset: ${name}`);
                    this.onOpen();
                };
            });
        }

        const saveSection = pr.createDiv();
        Object.assign(saveSection.style, {
            marginTop: "12px", padding: "12px", borderRadius: "8px",
            border: "1px dashed var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.02)"
        });
        saveSection.createEl("div", { text: "Save Current Style" }).style.cssText = "font-size:0.75em;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase";
        
        const saveRow = saveSection.createDiv();
        Object.assign(saveRow.style, { display: "flex", gap: "8px" });
        
        const newPresetInput = saveRow.createEl("input", { type: "text" });
        newPresetInput.placeholder = "Preset name...";
        Object.assign(newPresetInput.style, { flex: "1", fontSize: "0.85em", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--background-modifier-border)", background: "var(--background-primary)" });
        
        const savePresetBtn = saveRow.createEl("button", { text: "Save Style" });
        Object.assign(savePresetBtn.style, { padding: "6px 12px", fontSize: "0.8em", fontWeight: "600", color: "var(--text-on-accent)", background: "var(--interactive-accent)", borderRadius: "6px", border: "none", cursor: "pointer" });
        
        savePresetBtn.onclick = async () => {
            const name = newPresetInput.value.trim();
            if (!name) return;
            if (!this.plugin.settings.presets) this.plugin.settings.presets = {};
            this.plugin.settings.presets[name] = { ...this.style };
            await this.plugin.saveSettings();
            new obsidian.Notice(`Saved preset: ${name}`);
            this.onOpen();
        };

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

    _switchTab(id: string, tabBtns?: Record<string, HTMLElement>, tabPanels?: Record<string, HTMLElement>) {
        this.activeTab = id;
        const btns = tabBtns || this._tabBtns;
        const panels = tabPanels || this._tabPanels;
        if (!btns || !panels) return;
        (Object.entries(btns) as [string, HTMLElement][]).forEach(([k, btn]) => {
            const active = k === id;
            btn.style.color = active ? "var(--interactive-accent)" : "var(--text-muted)";
            btn.style.borderBottom = active ? "2px solid var(--interactive-accent)" : "2px solid transparent";
            btn.style.backgroundColor = active ? "var(--background-modifier-hover)" : "transparent";
        });
        (Object.entries(panels) as [string, HTMLElement][]).forEach(([k, p]) => { p.style.display = k === id ? "block" : "none"; });
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