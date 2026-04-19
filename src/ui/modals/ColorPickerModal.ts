import * as obsidian from 'obsidian';
import { FolderStyle, EffectiveStyle, IColorfulFoldersPlugin } from '../../common/types';
import { createVisualColorPicker } from '../components/ColorPicker';

export class ColorPickerModal extends obsidian.Modal {
plugin: IColorfulFoldersPlugin;
item: obsidian.TAbstractFile;
isFolder: boolean;
focusSection: string | null;
folderStyle: EffectiveStyle & FolderStyle;
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
        const existing = (this.plugin.getStyle(this.item.path) || {});
        
        // Merge: effective provides the "live" fallback, existing provides the user's explicit overrides
        this.folderStyle = { ...effective, ...existing };
        // Ensure some defaults
        if (this.folderStyle.isBold === undefined && this.isFolder) this.folderStyle.isBold = true;
        if (this.folderStyle.opacity === undefined) this.folderStyle.opacity = 1.0;
        this.activeTab = (this.focusSection === 'icon') ? 'icon' : 'appearance';
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.setCssStyles({
            maxWidth: "580px",
            width: "95vw"
        });

        // ── HEADER ──────────────────────────────────────────────────────────
        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({
            display: "flex", alignItems: "center", gap: "12px",
            padding: "18px 20px 12px", borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "0"
        });
        const iconScale = this.plugin.settings.iconScale || 1.0;
        const headerIconW = Math.round(18 * iconScale);
        const headerIconSize = Math.round(36 * (iconScale > 1.0 ? iconScale : 1.0)); // Adjust container if needed

        const iconWrap = header.createDiv();
        iconWrap.setCssStyles({
            width: `${headerIconSize}px`, height: `${headerIconSize}px`, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: this.folderStyle.hex, flexShrink: "0"
        });
        obsidian.setIcon(iconWrap, this.folderStyle.iconId || (this.isFolder ? "folder" : "file"));
        const headerSvg = iconWrap.querySelector("svg") as unknown as HTMLElement | null;
        if (headerSvg) {
            headerSvg.setCssStyles({
                color: this.folderStyle.iconColor || this.folderStyle.textColor || "#fff",
                width: `${headerIconW}px`, height: `${headerIconW}px`
            });
        }

        const titleWrap = header.createDiv();
        const mTitle = titleWrap.createEl("div", { text: this.item.name, cls: "cf-modal-title" });
        mTitle.setCssStyles({
            fontSize: "1.1em", fontWeight: "700", color: "var(--text-normal)", lineHeight: "1.2"
        });
        const mSub = titleWrap.createEl("div", { text: `Custom ${this.isFolder ? "folder" : "file"} style` });
        mSub.setCssStyles({
            fontSize: "0.78em", color: "var(--text-muted)", marginTop: "2px"
        });

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
        tabBar.setCssStyles({
            display: "flex", gap: "2px", padding: "8px 16px 0",
            borderBottom: "1px solid var(--background-modifier-border)"
        });

        const body = contentEl.createDiv({ cls: "cf-tab-body" });
        body.setCssStyles({ padding: "16px 20px 8px", overflowY: "auto", maxHeight: "60vh" });

        const tabPanels: Record<string, HTMLElement> = {};
        const tabBtns: Record<string, HTMLElement> = {};

        tabs.forEach(t => {
            const btn = tabBar.createEl("button", { cls: "cf-tab-btn" });
            btn.setCssStyles({
                background: "none", border: "none", padding: "7px 13px",
                borderRadius: "6px 6px 0 0", cursor: "pointer", fontSize: "0.82em",
                fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
                color: "var(--text-muted)", borderBottom: "2px solid transparent",
                transition: "all 0.15s ease"
            });
            const btnIcon = btn.createSpan();
            obsidian.setIcon(btnIcon, t.icon);
            const biSvg = btnIcon.querySelector("svg") as unknown as HTMLElement | null;
            if (biSvg) biSvg.setCssStyles({ width: "13px", height: "13px" });
            btn.createSpan({ text: t.label });

            const panel = body.createDiv({ cls: "cf-tab-panel" });
            panel.setCssStyles({ display: "none" });
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
        prev.setCssStyles({
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
            backgroundColor: "var(--background-secondary)", border: "1px solid var(--background-modifier-border)"
        });
        const prevIconWrap = prev.createDiv();
        prevIconWrap.setCssStyles({
            width: "28px", height: "28px", borderRadius: "6px", flexShrink: "0",
            backgroundColor: this.folderStyle.hex, display: "flex", alignItems: "center", justifyContent: "center"
        });
        obsidian.setIcon(prevIconWrap, this.folderStyle.iconId || (this.isFolder ? "folder" : "file"));
        const prevLabel = prev.createDiv({ text: this.item.name });
        prevLabel.setCssStyles({
            fontWeight: this.folderStyle.isBold ? "700" : "400",
            fontStyle: this.folderStyle.isItalic ? "italic" : "normal",
            color: this.folderStyle.textColor || "var(--text-normal)", fontSize: "0.9em"
        });
        this._prevIconWrap = prevIconWrap;
        this._prevLabel = prevLabel;

        const updatePreview = () => {
            const iconScale = this.plugin.settings.iconScale || 1.0;
            const previewIconW = Math.round(16 * iconScale);
            const headerIconW = Math.round(18 * iconScale);

            const effectiveIconColor = this.folderStyle.iconColor || this.folderStyle.hex || "#fff";
            // Update header icon
            this._headerIconWrap.setCssStyles({ backgroundColor: this.folderStyle.hex });
            this._headerIconWrap.empty();
            obsidian.setIcon(this._headerIconWrap, this.folderStyle.iconId || (this.isFolder ? "folder" : "file"));
            const hsvg = this._headerIconWrap.querySelector("svg") as unknown as HTMLElement | null;
            if (hsvg) hsvg.setCssStyles({ color: effectiveIconColor, width: `${headerIconW}px`, height: `${headerIconW}px` });
            // Update preview bar
            this._prevIconWrap.setCssStyles({ backgroundColor: this.folderStyle.hex });
            this._prevIconWrap.empty();
            obsidian.setIcon(this._prevIconWrap, this.folderStyle.iconId || (this.isFolder ? "folder" : "file"));
            const prevSvg = this._prevIconWrap.querySelector("svg") as unknown as HTMLElement | null;
            if (prevSvg) prevSvg.setCssStyles({ color: effectiveIconColor, width: `${previewIconW}px`, height: `${previewIconW}px` });
            this._prevLabel.setCssStyles({
                fontWeight: this.folderStyle.isBold ? "700" : "400",
                fontStyle: this.folderStyle.isItalic ? "italic" : "normal",
                color: this.folderStyle.textColor || "var(--text-normal)"
            });
        };
        this._updatePreview = updatePreview;

        // ── SECTION: Background Color ──
        const bgSection = ap.createDiv({ cls: 'cf-picker-section' });
        const isBgFocus = this.focusSection === 'background';
        bgSection.setCssStyles({
            padding: "10px", borderRadius: "8px", 
            border: isBgFocus ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)",
            backgroundColor: isBgFocus ? "rgba(var(--interactive-accent-rgb), 0.05)" : "rgba(var(--mono-rgb-100), 0.03)", 
            marginBottom: "12px",
            transition: "all 0.5s ease"
        });
        if (isBgFocus) bgSection.setCssStyles({ boxShadow: "0 0 15px rgba(var(--interactive-accent-rgb), 0.15)" });

        const bgHeader = bgSection.createDiv();
        bgHeader.setCssStyles({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const bgLabel = bgHeader.createDiv();
        bgLabel.setCssStyles({ fontSize: "0.85em", fontWeight: "700", color: "var(--text-normal)", opacity: "0.9" });
        bgLabel.textContent = 'Background styling';

        const applyBgBtn = bgHeader.createEl("button", { text: "Apply" });
        applyBgBtn.setCssStyles({
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyBgBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {});
            existing.hex = this.folderStyle.hex;
            existing.opacity = this.folderStyle.opacity;
            if (this.folderStyle.applyToSubfolders !== undefined) existing.applyToSubfolders = this.folderStyle.applyToSubfolders;
            if (this.folderStyle.applyToFiles !== undefined) existing.applyToFiles = this.folderStyle.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            this.close();
        };

        const bgPickerContainer = bgSection.createDiv();
        createVisualColorPicker(bgPickerContainer, this.folderStyle.hex, (hex, alpha) => {
            this.folderStyle.hex = hex;
            this.folderStyle.opacity = alpha;
            updatePreview();
        }, { showAlpha: true, initialAlpha: this.folderStyle.opacity || 1.0 });

        // ── SECTION: Text Color ──
        const txtSection = ap.createDiv({ cls: 'cf-picker-section' });
        const isColorFocus = this.focusSection === 'color';
        txtSection.setCssStyles({
            padding: "10px", borderRadius: "8px", 
            border: isColorFocus ? "1px solid var(--interactive-accent)" : "1px solid var(--background-modifier-border)",
            backgroundColor: isColorFocus ? "rgba(var(--interactive-accent-rgb), 0.05)" : "rgba(var(--mono-rgb-100), 0.03)", 
            marginBottom: "12px",
            transition: "all 0.5s ease"
        });
        if (isColorFocus) txtSection.setCssStyles({ boxShadow: "0 0 15px rgba(var(--interactive-accent-rgb), 0.15)" });

        const txtHeader = txtSection.createDiv();
        txtHeader.setCssStyles({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const txtLabel = txtHeader.createDiv();
        txtLabel.setCssStyles({ fontSize: "0.85em", fontWeight: "700", color: "var(--text-normal)", opacity: "0.9" });
        txtLabel.textContent = 'Text styling';

        const txtActionsRow = txtHeader.createDiv();
        txtActionsRow.setCssStyles({ display: "flex", gap: "6px" });

        const resetTxtBtn = txtActionsRow.createEl("button", { text: "Reset" });
        resetTxtBtn.setCssStyles({ padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", border: "1px solid var(--background-modifier-border)", background: "none", color: "var(--text-muted)", cursor: "pointer" });
        
        const applyTxtBtn = txtActionsRow.createEl("button", { text: "Apply" });
        applyTxtBtn.setCssStyles({
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyTxtBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {});
            existing.textColor = this.folderStyle.textColor;
            existing.isBold = this.folderStyle.isBold;
            existing.isItalic = this.folderStyle.isItalic;
            if (this.folderStyle.applyToSubfolders !== undefined) existing.applyToSubfolders = this.folderStyle.applyToSubfolders;
            if (this.folderStyle.applyToFiles !== undefined) existing.applyToFiles = this.folderStyle.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            this.close();
        };

        const textPickerContainer = txtSection.createDiv();
        const textPicker = createVisualColorPicker(textPickerContainer, this.folderStyle.textColor || '#ffffff', (hex) => {
            this.folderStyle.textColor = hex;
            updatePreview();
        }, { showAlpha: false });
        resetTxtBtn.onclick = () => { this.folderStyle.textColor = ''; textPicker.setHex('#ffffff'); updatePreview(); };

        // Inline Typography
        const typoRow = txtSection.createDiv();
        typoRow.setCssStyles({ display: "flex", gap: "10px", marginTop: "8px" });
        const buildToggle = (lbl: string, key: 'isBold' | 'isItalic') => {
            const wrap = typoRow.createDiv();
            wrap.setCssStyles({ display: "flex", alignItems: "center", gap: "4px" });
            const chk = wrap.createEl("input", { type: "checkbox" });
            chk.checked = !!this.folderStyle[key];
            const span = wrap.createEl("span", { text: lbl });
            span.setCssStyles({ fontSize: "0.75em" });
            chk.onchange = () => { (this.folderStyle as unknown)[key] = chk.checked; updatePreview(); };
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
        icColorSection.setCssStyles({
            padding: "10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.03)", marginBottom: "12px"
        });

        const icColorHeader = icColorSection.createDiv();
        icColorHeader.setCssStyles({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" });
        const icColorLabel = icColorHeader.createDiv();
        icColorLabel.setCssStyles({ fontSize: "0.85em", fontWeight: "700", color: "var(--text-normal)", opacity: "0.9" });
        icColorLabel.textContent = 'Icon styling';

        const icColorActions = icColorHeader.createDiv();
        icColorActions.setCssStyles({ display: "flex", gap: "6px" });
        const resetIcBtn = icColorActions.createEl("button", { text: "Reset" });
        resetIcBtn.setCssStyles({ padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", border: "1px solid var(--background-modifier-border)", background: "none", color: "var(--text-muted)", cursor: "pointer" });
        
        const applyIcBtn = icColorActions.createEl("button", { text: "Apply" });
        applyIcBtn.setCssStyles({
            padding: "2px 8px", borderRadius: "4px", fontSize: "0.7em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyIcBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {});
            existing.iconId = this.folderStyle.iconId;
            existing.iconColor = this.folderStyle.iconColor;
            if (this.folderStyle.applyToSubfolders !== undefined) existing.applyToSubfolders = this.folderStyle.applyToSubfolders;
            if (this.folderStyle.applyToFiles !== undefined) existing.applyToFiles = this.folderStyle.applyToFiles;
            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            this.close();
        };

        const icColorPickerContainer = icColorSection.createDiv();
        const icColorPicker = createVisualColorPicker(icColorPickerContainer, this.folderStyle.iconColor || this.folderStyle.hex || '#eb6f92', (hex) => {
            this.folderStyle.iconColor = hex;
            updatePreview();
        }, { showAlpha: false });
        resetIcBtn.onclick = () => { this.folderStyle.iconColor = ''; icColorPicker.setHex(this.folderStyle.hex || '#eb6f92'); updatePreview(); };

        // ── SECTION: Current Icon Box ──
        const curIconRow = ic.createDiv();
        curIconRow.setCssStyles({
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px",
            padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", marginBottom: "12px"
        });
        const curIconBox = curIconRow.createDiv();
        curIconBox.setCssStyles({
            width: "36px", height: "36px", borderRadius: "8px", background: "var(--interactive-accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0"
        });
        this._refreshIconSelection(this.folderStyle.iconId, curIconBox);

        const curIconHeader = curIconRow.createDiv();
        curIconHeader.setCssStyles({ display: "flex", alignItems: "center", justifyContent: "space-between", flex: "1", minWidth: "150px" });
        
        const curIconInfo = curIconHeader.createDiv();
        const ciLabel = curIconInfo.createEl("div", { text: "Current icon" });
        ciLabel.setCssStyles({ fontSize: "0.75em", color: "var(--text-muted)", marginBottom: "0px" });
        this._curIconNameEl = curIconInfo.createEl("div", { text: this.folderStyle.iconId || (this.isFolder ? "folder" : "file") });
        this._curIconNameEl.setCssStyles({ fontSize: "0.85em", fontWeight: "600", color: "var(--text-normal)" });
        this._curIconBox = curIconBox;

        const applyIconBtn = curIconHeader.createEl("button", { text: "Apply icon only" });
        applyIconBtn.setCssStyles({
            padding: "3px 10px", borderRadius: "5px", fontSize: "0.75em", fontWeight: "600",
            cursor: "pointer", border: "1px solid var(--interactive-accent)",
            background: "var(--interactive-accent)", color: "var(--text-on-accent)"
        });
        applyIconBtn.onclick = async () => {
            const path = this.item.path;
            const existing = (this.plugin.getStyle(path) || {});
            existing.iconId = this.folderStyle.iconId;
            existing.iconColor = this.folderStyle.iconColor;
            // Respect inheritance toggles if they were changed
            if (this.folderStyle.applyToSubfolders !== undefined) existing.applyToSubfolders = this.folderStyle.applyToSubfolders;
            if (this.folderStyle.applyToFiles !== undefined) existing.applyToFiles = this.folderStyle.applyToFiles;

            this.plugin.settings.customFolderColors[path] = existing;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            new obsidian.Notice(`Icon updated for ${this.item.name}`);
            this.close();
        };

        // Search & Filter Row
        const searchRow = ic.createDiv();
        searchRow.setCssStyles({ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" });
        
        const searchInputWrap = searchRow.createDiv();
        searchInputWrap.setCssStyles({ position: "relative", flex: "1" });
        
        const searchInput = searchInputWrap.createEl("input", { type: "text" });
        searchInput.setCssStyles({
            width: "100%", padding: "7px 12px 7px 34px", borderRadius: "7px",
            border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)",
            fontSize: "0.85em", boxSizing: "border-box"
        });
        searchInput.placeholder = "Search icons…";
        
        const searchIcon = searchInputWrap.createDiv();
        searchIcon.setCssStyles({
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-muted)"
        });
        obsidian.setIcon(searchIcon, "search");
        const ssvg = searchIcon.querySelector("svg") as unknown as HTMLElement | null;
        if (ssvg) ssvg.setCssStyles({ width: "14px", height: "14px" });

        // Pack Filter Dropdown
        const customIds = Object.keys(this.plugin.settings.customIcons);
        const prefixes = new Set(['all', 'lucide']);
        customIds.forEach(id => {
            const parts = id.split('-');
            if (parts.length > 1) prefixes.add(parts[0]);
            else prefixes.add('custom');
        });

        const filterSelect = searchRow.createEl("select");
        filterSelect.setCssStyles({
            padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)", fontSize: "0.85em"
        });
        Array.from(prefixes).sort().forEach(p => {
            const opt = filterSelect.createEl("option", { text: p === 'all' ? 'All Packs' : p.toUpperCase(), value: p });
            if (p === 'all') opt.selected = true;
        });


        // Icon grid
        const iconGrid = ic.createDiv({ cls: "cf-icon-grid" });
        iconGrid.setCssStyles({
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

        const renderIcons = (search: string, packFilter: string = "all") => {
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
                cell.setCssStyles({
                    width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: "7px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.12s ease",
                    backgroundColor: this.folderStyle.iconId === id ? "var(--interactive-accent)" : "transparent",
                    border: "2px solid " + (this.folderStyle.iconId === id ? "var(--interactive-accent)" : "transparent")
                });
                obsidian.setIcon(cell, id);
                const cellSvg = cell.querySelector("svg") as unknown as HTMLElement | null;
                if (cellSvg) {
                    cellSvg.removeAttribute('width');
                    cellSvg.removeAttribute('height');
                    cellSvg.setCssStyles({
                        width: `${gridIconW}px`, height: `${gridIconW}px`,
                        color: this.folderStyle.iconId === id ? "#fff" : "var(--text-normal)"
                    });
                }
                cell.title = id;
                cell.onmouseenter = () => {
                    if (this.folderStyle.iconId !== id) cell.setCssStyles({ backgroundColor: "var(--background-modifier-hover)" });
                };
                cell.onmouseleave = () => {
                    if (this.folderStyle.iconId !== id) cell.setCssStyles({ backgroundColor: "transparent" });
                };
                cell.onclick = () => {
                    this.folderStyle.iconId = id;
                    this._refreshIconSelection(id, curIconBox);
                    if (this._updatePreview) this._updatePreview();
                    renderIcons(searchInput.value, filterSelect.value);
                };
            });
            if (filtered.length === 0) {
                const emptyMsg = iconGrid.createEl("div", { text: "No icons found" });
                emptyMsg.setCssStyles({
                    padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85em", gridColumn: "1/-1"
                });
            }
        };
        renderIcons("", "all");
        searchInput.oninput = () => renderIcons(searchInput.value, filterSelect.value);
        filterSelect.onchange = () => renderIcons(searchInput.value, filterSelect.value);

        // ── INHERITANCE TAB ─────────────────────────────────────────────────
        if (this.isFolder && tabPanels["inherit"]) {
            const inh = tabPanels["inherit"];
            new obsidian.Setting(inh).setHeading().setName("Inheritance options");
            new obsidian.Setting(inh).setName("Apply to subfolders")
                .setDesc("Force nested folders to inherit this style.")
                .addToggle(t => t.setValue(this.folderStyle.applyToSubfolders || false).onChange(v => this.folderStyle.applyToSubfolders = v));
            new obsidian.Setting(inh).setName("Apply to files")
                .setDesc("Force files inside this folder to inherit this style.")
                .addToggle(t => t.setValue(this.folderStyle.applyToFiles || false).onChange(v => this.folderStyle.applyToFiles = v));
        }

        const pr = tabPanels["presets"];
        const prTitle = pr.createEl("h4", { text: "Saved presets", cls: "cf-section-title" });
        prTitle.setCssStyles({ fontSize: "0.85em", marginBottom: "10px", opacity: "0.8" });

        const presetList = pr.createDiv({ cls: "cf-preset-list" });
        presetList.setCssStyles({
            display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px",
            maxHeight: "200px", overflowY: "auto", padding: "4px"
        });

        const presets = this.plugin.settings.presets || {};
        const presetNames = Object.keys(presets);

        if (presetNames.length === 0) {
            const emptyPresets = presetList.createEl("div", { text: "No presets saved yet.", cls: "cf-empty-state" });
            emptyPresets.setCssStyles({ fontSize: "0.8em", color: "var(--text-muted)", textAlign: "center", padding: "20px" });
        } else {
            presetNames.forEach(name => {
                const pData = presets[name];
                const item = presetList.createDiv({ cls: "cf-preset-item" });
                item.setCssStyles({
                    display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
                    borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
                    backgroundColor: "var(--background-secondary-alt)", transition: "all 0.1s ease"
                });

                const colorPrev = item.createDiv();
                colorPrev.setCssStyles({
                    width: "20px", height: "20px", borderRadius: "4px", backgroundColor: pData.hex || "#eb6f92", flexShrink: "0"
                });

                const nameLabel = item.createDiv({ text: name });
                nameLabel.setCssStyles({ flex: "1", fontSize: "0.85em", fontWeight: "600", color: "var(--text-normal)" });

                const applyBtn = item.createEl("button", { text: "Apply" });
                applyBtn.setCssStyles({ padding: "2px 8px", fontSize: "0.75em", borderRadius: "4px", cursor: "pointer" });
                applyBtn.onclick = () => {
                    this.folderStyle = { ...pData } as EffectiveStyle & FolderStyle;
                    this.onOpen();
                };

                const delBtn = item.createEl("button", { cls: "clickable-icon" });
                delBtn.setCssStyles({ padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" });
                obsidian.setIcon(delBtn, "trash-2");
                const delSvg = delBtn.querySelector("svg") as unknown as HTMLElement | null;
                if (delSvg) delSvg.setCssStyles({ width: "14px", height: "14px", color: "var(--text-error)" });
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
        saveSection.setCssStyles({
            marginTop: "12px", padding: "12px", borderRadius: "8px",
            border: "1px dashed var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.02)"
        });
        const saveTitle = saveSection.createEl("div", { text: "Save current style" });
        saveTitle.setCssStyles({ fontSize: "0.75em", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" });
        
        const saveRow = saveSection.createDiv();
        saveRow.setCssStyles({ display: "flex", gap: "8px" });
        
        const newPresetInput = saveRow.createEl("input", { type: "text" });
        newPresetInput.placeholder = "Preset name...";
        newPresetInput.setCssStyles({ flex: "1", fontSize: "0.85em", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--background-modifier-border)", background: "var(--background-primary)" });
        
        const savePresetBtn = saveRow.createEl("button", { text: "Save style" });
        savePresetBtn.setCssStyles({ padding: "6px 12px", fontSize: "0.8em", fontWeight: "600", color: "var(--text-on-accent)", background: "var(--interactive-accent)", borderRadius: "6px", border: "none", cursor: "pointer" });
        
        savePresetBtn.onclick = async () => {
            const name = newPresetInput.value.trim();
            if (!name) return;
            if (!this.plugin.settings.presets) this.plugin.settings.presets = {};
            this.plugin.settings.presets[name] = { ...this.folderStyle };
            await this.plugin.saveSettings();
            new obsidian.Notice(`Saved preset: ${name}`);
            this.onOpen();
        };

        // ── FOOTER ─────────────────────────────────────────────────────────
        const footer = contentEl.createDiv({ cls: "cf-modal-footer" });
        footer.setCssStyles({
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 20px 16px", borderTop: "1px solid var(--background-modifier-border)",
            marginTop: "4px", gap: "8px"
        });
        const clearBtn = footer.createEl("button");
        clearBtn.setText("Clear style");
        clearBtn.setCssStyles({
            padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85em",
            border: "1px solid var(--background-modifier-border)",
            background: "var(--background-primary)", color: "var(--text-muted)"
        });
        clearBtn.onclick = async () => {
            delete this.plugin.settings.customFolderColors[this.item.path];
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            new obsidian.Notice(`Cleared styling for ${this.item.name}`);
            this.close();
        };
        const saveBtn = footer.createEl("button");
        saveBtn.setText("Save style");
        saveBtn.setCssStyles({
            padding: "7px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85em",
            fontWeight: "600", background: "var(--interactive-accent)",
            color: "var(--text-on-accent)", border: "none"
        });
        saveBtn.onclick = async () => {
            this.plugin.settings.customFolderColors[this.item.path] = this.folderStyle;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
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
        Object.entries(btns).forEach(([k, btn]) => {
            const active = k === id;
            btn.setCssStyles({
                color: active ? "var(--interactive-accent)" : "var(--text-muted)",
                borderBottom: active ? "2px solid var(--interactive-accent)" : "2px solid transparent",
                backgroundColor: active ? "var(--background-modifier-hover)" : "transparent"
            });
        });
        Object.entries(panels).forEach(([k, p]) => { p.setCssStyles({ display: k === id ? "block" : "none" }); });
    }

    _refreshIconSelection(id: string, curIconBox: HTMLElement) {
        curIconBox.empty();
        obsidian.setIcon(curIconBox, id || (this.isFolder ? "folder" : "file"));
        const s = curIconBox.querySelector("svg") as unknown as HTMLElement | null;
        if (s) s.setCssStyles({ width: "22px", height: "22px", color: "#fff" });
        if (this._curIconNameEl) this._curIconNameEl.setText(id || (this.isFolder ? "folder" : "file"));
    }

    onClose() {
        this.contentEl.empty();
    }
}
