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
    autoIconVariety: true, // Deprecated — expanded variety is now always enabled with autoIcons
    wideAutoIcons: true,
    animateActivePath: false,
    rainbowRootText: true,
    rainbowRootBgTransparent: false,
    autoColorFiles: false,
    activeAnimationStyle: "shimmer",
    activeAnimationDuration: 4,
    showItemCounters: true,
    rootTintOpacity: 0.06,
    lightModeBrightness: 0,
    darkModeBrightness: 0,
    customIconRules: "",
    iconDebugMode: false,
    notebookNavigatorSupport: true,
    notebookNavigatorFileBackground: true,
    customIcons: {} // Added for custom icon packs support
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL COLOR PICKER — Premium Drag-and-Drop Color Picker Engine
// ══════════════════════════════════════════════════════════════════════════════

function hsvToRgb(h, s, v) {
    h = h / 360; s = s / 100; v = v / 100;
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hexToRgbObj(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
        r: parseInt(hex.substring(0, 2), 16) || 0,
        g: parseInt(hex.substring(2, 4), 16) || 0,
        b: parseInt(hex.substring(4, 6), 16) || 0
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

function anyToHex(colorStr) {
    if (!colorStr) return "#ffffff";
    if (colorStr.startsWith('#')) return colorStr;
    if (colorStr.startsWith('rgb')) {
        const m = colorStr.match(/\d+/g);
        if (m && m.length >= 3) {
            return rgbToHex(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
        }
    }
    return "#ffffff";
}

/**
 * Creates a premium drag-and-drop visual color picker.
 * @param {HTMLElement} container   The DOM node to render into.
 * @param {string}      initialHex The starting hex color (e.g. "#eb6f92").
 * @param {Function}    onChange   Callback: (hexString, alpha01) => void
 * @param {object}      opts       { showAlpha: true }
 * @returns {{ setHex(hex: string): void, getHex(): string, getAlpha(): number }}
 */
function createVisualColorPicker(container, initialHex, onChange, opts = {}) {
    const showAlpha = opts.showAlpha !== false;
    let currentAlpha = opts.initialAlpha !== undefined ? opts.initialAlpha : 1.0;

    // Parse initial color
    const initRgb = hexToRgbObj(initialHex || '#eb6f92');
    let hsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);

    // ── Wrapper ──
    const wrap = container.createDiv({ cls: 'cf-vcp' });
    wrap.style.cssText = `
        display: flex; flex-direction: row; gap: 12px;
        padding: 8px; border-radius: 10px;
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        align-items: stretch;
    `;

    // ── 2D Saturation-Value Board (Left) ──
    const board = wrap.createDiv({ cls: 'cf-vcp-board' });
    board.style.cssText = `
        position: relative; width: 140px; height: 100px;
        border-radius: 6px; cursor: crosshair; overflow: hidden;
        background-color: hsl(${hsv.h}, 100%, 50%);
        touch-action: none; user-select: none; flex-shrink: 0;
    `;
    const gradWhite = board.createDiv();
    gradWhite.style.cssText = `
        position: absolute; inset: 0; border-radius: 10px;
        background: linear-gradient(to right, #ffffff, transparent);
    `;
    const gradBlack = board.createDiv();
    gradBlack.style.cssText = `
        position: absolute; inset: 0; border-radius: 10px;
        background: linear-gradient(to bottom, transparent, #000000);
    `;
    const thumb = board.createDiv({ cls: 'cf-vcp-thumb' });
    thumb.style.cssText = `
        position: absolute; width: 18px; height: 18px; border-radius: 50%;
        border: 3px solid #fff; box-shadow: 0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%); pointer-events: none;
        transition: box-shadow 0.15s ease;
        z-index: 2;
    `;

    // ── Right Wrapper ──
    const rightCol = wrap.createDiv();
    Object.assign(rightCol.style, { display: "flex", flexDirection: "column", gap: "6px", flex: "1", justifyContent: "center" });

    // ── Sliders Row ──
    const slidersRow = rightCol.createDiv();
    slidersRow.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    // Color preview hex row
    const previewRow = rightCol.createDiv();
    previewRow.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    const previewDot = previewRow.createDiv();
    previewDot.style.cssText = `
        width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
        border: 1px solid var(--background-modifier-border);
    `;
    const hexInput = previewRow.createEl('input', { type: 'text' });
    hexInput.style.cssText = `
        flex: 1; font-family: monospace; font-size: 0.75em;
        padding: 3px 6px; border-radius: 4px; border: 1px solid var(--background-modifier-border);
        background: var(--background-primary); color: var(--text-normal);
        outline: none; font-weight: 600;
    `;
    hexInput.maxLength = 7;

    // Hue slider builder
    const buildSlider = (label, min, max, value, gradient, onInput) => {
        const row = slidersRow.createDiv();
        row.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const lbl = row.createEl('span', { text: label });
        lbl.style.cssText = 'font-size: 0.7em; font-weight: 700; color: var(--text-muted); width: 12px; text-transform: uppercase; letter-spacing: 1px;';
        const slider = row.createEl('input', { type: 'range' });
        slider.min = min; slider.max = max; slider.value = value;
        slider.style.cssText = `
            flex: 1; -webkit-appearance: none; appearance: none;
            height: 10px; border-radius: 5px; outline: none; cursor: pointer;
            background: ${gradient};
            border: 1px solid rgba(0,0,0,0.12);
        `;
        // Custom thumb via dynamic style
        const thumbCss = `
            input[type="range"].cf-vcp-slider::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                width: 20px; height: 20px; border-radius: 50%;
                background: #fff; border: 2.5px solid rgba(0,0,0,0.2);
                box-shadow: 0 1px 6px rgba(0,0,0,0.25);
                cursor: grab; transition: transform 0.1s ease;
            }
            input[type="range"].cf-vcp-slider::-webkit-slider-thumb:active {
                transform: scale(1.2); cursor: grabbing;
            }
        `;
        if (!document.querySelector('#cf-vcp-slider-style')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'cf-vcp-slider-style';
            styleTag.textContent = thumbCss;
            document.head.appendChild(styleTag);
        }
        slider.classList.add('cf-vcp-slider');
        slider.addEventListener('input', () => onInput(parseInt(slider.value)));
        return slider;
    };

    const hueGrad = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
    const hueSlider = buildSlider('H', 0, 360, hsv.h, hueGrad, (v) => {
        hsv.h = v;
        syncFromHSV();
    });

    let alphaSlider = null;
    if (showAlpha) {
        const alphaGrad = `linear-gradient(to right, transparent, ${initialHex})`;
        alphaSlider = buildSlider('A', 0, 100, Math.round(currentAlpha * 100), alphaGrad, (v) => {
            currentAlpha = v / 100;
            syncFromHSV();
        });
    }

    // ── Syncing ──
    function syncFromHSV() {
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

        // Update board background hue
        board.style.backgroundColor = `hsl(${hsv.h}, 100%, 50%)`;

        // Update thumb position
        const bw = board.offsetWidth || 200;
        const bh = board.offsetHeight || 180;
        thumb.style.left = `${(hsv.s / 100) * bw}px`;
        thumb.style.top = `${(1 - hsv.v / 100) * bh}px`;

        // Update preview
        previewDot.style.backgroundColor = hex;
        previewDot.style.opacity = currentAlpha;
        hexInput.value = hex;

        // Update alpha slider gradient
        if (alphaSlider) {
            alphaSlider.style.background = `linear-gradient(to right, transparent, ${hex}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px`;
        }

        onChange(hex, currentAlpha);
    }

    function syncFromHex(hex) {
        const rgb = hexToRgbObj(hex);
        hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        hueSlider.value = hsv.h;
        syncFromHSV();
    }

    // ── Board Dragging ──
    function handleBoardPointer(e) {
        const rect = board.getBoundingClientRect();
        let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        hsv.s = Math.round((x / rect.width) * 100);
        hsv.v = Math.round((1 - y / rect.height) * 100);
        syncFromHSV();
    }

    board.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        board.setPointerCapture(e.pointerId);
        handleBoardPointer(e);
        thumb.style.boxShadow = '0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.2)';
    });
    board.addEventListener('pointermove', (e) => {
        if (board.hasPointerCapture(e.pointerId)) handleBoardPointer(e);
    });
    board.addEventListener('pointerup', (e) => {
        board.releasePointerCapture(e.pointerId);
        thumb.style.boxShadow = '0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.3)';
    });

    // ── Hex Input ──
    hexInput.addEventListener('input', () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            syncFromHex(val);
        }
    });
    hexInput.addEventListener('focus', () => { hexInput.style.borderColor = 'var(--interactive-accent)'; });
    hexInput.addEventListener('blur', () => { hexInput.style.borderColor = 'var(--background-modifier-border)'; });

    // Initial render
    syncFromHSV();

    return {
        setHex(hex) { syncFromHex(hex); },
        getHex() { return hexInput.value; },
        getAlpha() { return currentAlpha; }
    };
}

class ColorPickerModal extends obsidian.Modal {
    constructor(app, plugin, item, focusSection = null) {
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
        const existing = this.plugin.getStyle(this.item.path) || {};
        
        // Merge: effective provides the "live" fallback, existing provides the user's explicit overrides
        this.style = { ...effective, ...existing };
        // Ensure some defaults
        if (this.style.isBold === undefined && this.isFolder) this.style.isBold = true;
        if (this.style.opacity === undefined) this.style.opacity = 1.0;
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
        iconWrap.querySelector("svg") && (iconWrap.querySelector("svg").style.color = this.style.iconColor || this.style.textColor || "#fff");

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
            const effectiveIconColor = this.style.iconColor || this.style.hex || "#fff";
            // Update header icon
            this._headerIconWrap.style.backgroundColor = this.style.hex;
            this._headerIconWrap.innerHTML = "";
            obsidian.setIcon(this._headerIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            const hsvg = this._headerIconWrap.querySelector("svg");
            if (hsvg) Object.assign(hsvg.style, { color: effectiveIconColor, width: "18px", height: "18px" });
            // Update preview bar
            this._prevIconWrap.style.backgroundColor = this.style.hex;
            this._prevIconWrap.innerHTML = "";
            obsidian.setIcon(this._prevIconWrap, this.style.iconId || (this.isFolder ? "folder" : "file"));
            const prevSvg = this._prevIconWrap.querySelector("svg");
            if (prevSvg) Object.assign(prevSvg.style, { color: effectiveIconColor, width: "16px", height: "16px" });
            this._prevLabel.style.fontWeight = this.style.isBold ? "700" : "400";
            this._prevLabel.style.fontStyle = this.style.isItalic ? "italic" : "normal";
            this._prevLabel.style.color = this.style.textColor || "var(--text-normal)";
        };
        this._updatePreview = updatePreview;

        // ── SECTION: Background Color ──
        const bgSection = ap.createDiv({ cls: 'cf-picker-section' });
        Object.assign(bgSection.style, {
            padding: "10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.03)", marginBottom: "12px"
        });

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
            const existing = this.plugin.getStyle(path) || {};
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
        Object.assign(txtSection.style, {
            padding: "10px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "rgba(var(--mono-rgb-100), 0.03)", marginBottom: "12px"
        });

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
            const existing = this.plugin.getStyle(path) || {};
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
            const existing = this.plugin.getStyle(path) || {};
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
            const existing = this.plugin.getStyle(path) || {};
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

        // Merge custom icons into the list
        const customIds = Object.keys(this.plugin.settings.customIcons);
        const allIcons = (obsidian.getIconIds ? obsidian.getIconIds() : [])
            .filter(id => id.startsWith('lucide-'))
            .map(id => id.replace('lucide-', ''))
            .concat(customIds)
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
    // Bug 3 Fix: Utility to convert a single #rrggbb hex to a {rgb, hex} color object
    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        let h = hex.trim().toLowerCase();
        // Expand shorthand #abc -> #aabbcc
        if (/^#[0-9a-f]{3}$/i.test(h)) {
            h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        }
        const m = /^#([0-9a-f]{6})$/i.exec(h);
        if (!m) return null;
        const r = parseInt(m[1].slice(0, 2), 16);
        const g = parseInt(m[1].slice(2, 4), 16);
        const b = parseInt(m[1].slice(4, 6), 16);
        return { r, g, b, rgb: `${r}, ${g}, ${b}`, hex: h };
    }

    adjustBrightnessRgb(rgbStr, amount = 0) {
        const parts = rgbStr.split(',').map(p => parseInt(p.trim()));
        if (parts.length !== 3) return rgbStr;
        // amount > 0 brightens (towards white), amount < 0 darkens (towards black)
        const [r, g, b] = parts.map(c => {
            if (amount < 0) {
                return Math.max(0, Math.floor(c * (1 + amount)));
            } else {
                return Math.min(255, Math.floor(c + (255 - c) * amount));
            }
        });
        return `${r}, ${g}, ${b}`;
    }

    isDarkMode() {
        return document.body.classList.contains('theme-dark');
    }

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

    // --- CALCULATE EFFECTIVE STYLE (Logic Mirroring generateStyles) ---
    getEffectiveStyle(target) {
        const root = this.app.vault.getRoot();
        let result = null;

        const PALETTES_LOCAL = PALETTES;
        let palette = PALETTES_LOCAL[this.settings.palette] || PALETTES_LOCAL["Muted Dark Mode"];
        if (this.settings.palette === "Custom") {
            const custom = this.parseCustomPalette(this.settings.customPalette);
            if (custom) palette = custom;
        }

        const excludeFolders = this.settings.exclusionList.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
        const isDark = this.isDarkMode();
        const brightnessAmount = (isDark ? this.settings.darkModeBrightness : this.settings.lightModeBrightness) / 100;

        const traverse = (folder, depth, rootIdx = 0, passedColor = null, inheritedStyle = null) => {
            if (result) return;

            const copyFolders = folder.children
                .filter(c => c instanceof obsidian.TFolder)
                .sort((a, b) => a.name.localeCompare(b.name));

            const copyFiles = folder.children
                .filter(c => c instanceof obsidian.TFile)
                .sort((a, b) => a.name.localeCompare(b.name));

            let validIdx = 0;

            // Handle Files
            for (let i = 0; i < copyFiles.length; i++) {
                const child = copyFiles[i];
                if (child === target) {
                    const fileStyle = this.getStyle(child.path);
                    const isCustomColor = !!(fileStyle && fileStyle.hex);
                    const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);

                    let color = passedColor || { rgb: "255, 255, 255", hex: "#ffffff" };
                    if (this.settings.autoColorFiles) {
                        color = palette[(validIdx + i) % palette.length];
                    }

                    let effText = (fileStyle && fileStyle.textColor) ? fileStyle.textColor : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.textColor : null);
                    if (!effText && (isCustomColor || (inheritedStyle && inheritedStyle.applyToFiles) || this.settings.autoColorFiles)) {
                        const fileBright = isDark ? Math.max(brightnessAmount, 0.15) : brightnessAmount;
                        effText = `rgb(${this.adjustBrightnessRgb(color.rgb, fileBright)})`;
                    }

                    const effIconColor = (activeStyle && activeStyle.iconColor) ? activeStyle.iconColor : color.hex;
                    
                    const autoIcon = this.getAutoIconData(child.name);
                    result = {
                        hex: anyToHex((fileStyle && fileStyle.hex) ? fileStyle.hex : color.hex),
                        textColor: effText ? anyToHex(effText) : "",
                        iconColor: anyToHex(effIconColor),
                        iconId: (fileStyle && fileStyle.iconId) ? fileStyle.iconId : (this.settings.autoIcons && autoIcon ? (this.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji) : ""),
                        opacity: (fileStyle && fileStyle.opacity !== undefined) ? fileStyle.opacity : 1.0,
                        isBold: (fileStyle && fileStyle.isBold !== undefined) ? fileStyle.isBold : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.isBold : false),
                        isItalic: (fileStyle && fileStyle.isItalic !== undefined) ? fileStyle.isItalic : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.isItalic : false),
                        applyToSubfolders: false, applyToFiles: false
                    };
                    return;
                }
            }

            // Handle Folders
            for (let i = 0; i < copyFolders.length; i++) {
                const child = copyFolders[i];
                if (excludeFolders.includes(child.name.toLowerCase())) {
                    traverse(child, depth + 1, rootIdx, passedColor, inheritedStyle);
                    continue;
                }

                let customStyle = this.getStyle(child.path);
                let activeStyle = customStyle || inheritedStyle;

                let color;
                if (customStyle && customStyle.hex) {
                    const cp = this.parseCustomPalette(customStyle.hex);
                    color = cp ? cp[0] : (this.hexToRgb(customStyle.hex) || palette[(validIdx + depth + rootIdx) % palette.length]);
                } else if (inheritedStyle && passedColor) {
                    color = passedColor;
                } else {
                    color = palette[(validIdx + depth + rootIdx) % palette.length];
                }

                if (child === target) {
                    let effText = (customStyle && customStyle.textColor) ? customStyle.textColor : (inheritedStyle ? inheritedStyle.textColor : null);
                    if (!effText) {
                        const contrastColor = isDark ? "#191724" : "#ffffff";
                        const rootAdjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                        if (depth === 0) {
                            if (!(this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent && !isCustomColor)) {
                                if (this.settings.rootStyle === "solid" && !this.settings.outlineOnly) {
                                    effText = contrastColor;
                                } else {
                                    effText = (isDark && rootAdjust === 0) ? color.hex : `rgb(${this.adjustBrightnessRgb(color.rgb, rootAdjust)})`;
                                }
                            } else {
                                effText = color.hex;
                            }
                        } else {
                            const subAdjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                            effText = (isDark && subAdjust === 0) ? color.hex : `rgb(${this.adjustBrightnessRgb(color.rgb, subAdjust)})`;
                        }
                    }

                    const effIconColor = (customStyle && customStyle.iconColor) ? customStyle.iconColor : (inheritedStyle ? inheritedStyle.iconColor : color.hex);

                    const autoIcon = this.getAutoIconData(child.name);
                    result = {
                        hex: anyToHex(color.hex),
                        textColor: effText ? anyToHex(effText) : "",
                        iconColor: anyToHex(effIconColor),
                        iconId: (customStyle && customStyle.iconId) ? customStyle.iconId : (this.settings.autoIcons && autoIcon ? (this.settings.wideAutoIcons ? autoIcon.lucide : autoIcon.emoji) : ""),
                        opacity: (customStyle && customStyle.opacity !== undefined) ? customStyle.opacity : (depth === 0 ? this.settings.rootOpacity : this.settings.subfolderOpacity),
                        isBold: (customStyle && customStyle.isBold !== undefined) ? customStyle.isBold : (inheritedStyle && inheritedStyle.isBold !== undefined ? inheritedStyle.isBold : true),
                        isItalic: (customStyle && customStyle.isItalic !== undefined) ? customStyle.isItalic : (inheritedStyle ? inheritedStyle.isItalic : false),
                        applyToSubfolders: customStyle ? !!customStyle.applyToSubfolders : false,
                        applyToFiles: customStyle ? !!customStyle.applyToFiles : false
                    };
                    return;
                }

                const nextInherited = (activeStyle && activeStyle.applyToSubfolders) ? activeStyle : inheritedStyle;
                traverse(child, depth + 1, depth === 0 ? validIdx : rootIdx, color, nextInherited);
                validIdx++;
            }
        };

        traverse(root, 0);
        return result;
    }

    registerCustomIcons() {
        Object.entries(this.settings.customIcons || {}).forEach(([id, svg]) => {
            if (id && svg) {
                try {
                    obsidian.addIcon(id, svg);
                } catch (e) {
                    console.error("Failed to register custom icon:", id, e);
                }
            }
        });
    }

    async onload() {
        console.log("Loading Colorful Folders Plugin v4");
        await this.loadSettings();
        if (!this.settings.customFolderColors) this.settings.customFolderColors = {};
        if (!this.settings.customIcons) this.settings.customIcons = {};
        this.registerCustomIcons();

        this.getStyle = (path) => {
            const style = this.settings.customFolderColors?.[path];
            if (!style) return null;
            if (typeof style === 'string') return { hex: style }; 
            return style;
        };

        this.uiStyleEl = document.createElement('style');
        this.uiStyleEl.id = 'colorful-folders-ui-style';
        this.uiStyleEl.textContent = `
            /* Fix invisible sliders in settings */
            .colorful-folders-config .setting-item-control input[type="range"] {
                width: 160px !important;
                height: 6px !important;
                background: var(--background-modifier-border) !important;
                cursor: pointer !important;
                appearance: none !important;
                border-radius: 10px !important;
                transition: background 0.2s !important;
            }
            .colorful-folders-config .setting-item-control input[type="range"]:hover {
                background: var(--background-modifier-border-focus) !important;
            }
            .colorful-folders-config .setting-item-control input[type="range"]::-webkit-slider-thumb {
                appearance: none !important;
                width: 16px !important;
                height: 16px !important;
                background: var(--interactive-accent) !important;
                border-radius: 50% !important;
                border: 2px solid var(--background-primary) !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            }
        `;
        document.head.appendChild(this.uiStyleEl);

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'colorful-folders-style';
        document.head.appendChild(this.styleEl);

        this.iconCache = new Map();
        this.heatmapCache = null;
        this._debounceTimer = null;

        this.safeEscape = (path) => {
            if (!path) return "";
            return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        };

        this.addSettingTab(new ColorfulFoldersSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.generateStyles();
        });

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
        this.registerEvent(this.app.vault.on('create', (file) => {
            this.heatmapCache = null;
            debounced();
        }));
        this.registerEvent(this.app.vault.on('delete', (file) => {
            this.heatmapCache = null;
            debounced();
        }));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            this.heatmapCache = null;
            // Update custom styles mapping if the path changed
            if (this.settings.customFolderColors[oldPath]) {
                this.settings.customFolderColors[file.path] = this.settings.customFolderColors[oldPath];
                delete this.settings.customFolderColors[oldPath];
                this.saveSettings(); // This will also trigger generateStyles
            } else {
                this.generateStylesDebounced();
            }
        }));
        this.registerEvent(this.app.workspace.on('css-change', () => {
            this.generateStyles();
        }));
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

    getAutoIconData(name, isFile = false) {
        if (!this.settings.autoIcons) return null;
        const lName = name.toLowerCase();

        // 20+ Premium Categories for Auto-Icons
        const defaultCategories = [
            // --- Core categories (already present) ---
            { rex: /journal|daily|log|diary/i, emoji: "📅", lucide: "calendar", priority: 100 },
            { rex: /image|photo|pic|asset|gallery|album/i, emoji: "🖼️", lucide: "image", priority: 100 },
            { rex: /project|task|todo|work|goal|action/i, emoji: "🚀", lucide: "rocket", priority: 100 },
            { rex: /setting|config|pref|options|setup|tool/i, emoji: "⚙️", lucide: "settings", priority: 100 },
            { rex: /read|book|paper|article|literature|lib/i, emoji: "📚", lucide: "book-open", priority: 100 },
            { rex: /archive|old|past|backup|history|dump/i, emoji: "📦", lucide: "archive", priority: 100 },
            { rex: /idea|brain|thought|note|learn|insight|study/i, emoji: "💡", lucide: "lightbulb", priority: 100 },
            { rex: /personal|me|self|profile|account|bio/i, emoji: "👤", lucide: "user", priority: 100 },
            { rex: /finance|money|bank|pay|cost|bill|price|tax|wallet/i, emoji: "💸", lucide: "banknote", priority: 100 },
            { rex: /health|fit|exercise|diet|gym|doctor|med|sport/i, emoji: "🥗", lucide: "activity", priority: 100 },
            { rex: /travel|trip|vacation|flight|plane|map|explore/i, emoji: "✈️", lucide: "plane", priority: 100 },
            { rex: /tech|code|dev|script|bot|program|web|git|coding/i, emoji: "💻", lucide: "code", priority: 100 },
            { rex: /music|audio|song|playlist|sound|record/i, emoji: "🎵", lucide: "music", priority: 100 },
            { rex: /video|movie|film|clip|youtube|stream/i, emoji: "🎬", lucide: "video", priority: 100 },
            { rex: /school|study|class|course|exam|edu|lecture|uni/i, emoji: "🎓", lucide: "graduation-cap", priority: 100 },
            { rex: /people|contact|friend|family|team|group|social/i, emoji: "👥", lucide: "users", priority: 100 },
            { rex: /inbox|new|capture|draft|start/i, emoji: "📥", lucide: "inbox", priority: 100 },
            { rex: /chat|talk|discuss|social|comm|slack|discord/i, emoji: "💬", lucide: "message-square", priority: 100 },
            { rex: /star|fav|important|prior|hot|best/i, emoji: "⭐", lucide: "star", priority: 100 },
            { rex: /lock|secret|private|secure|vault|pass/i, emoji: "🔒", lucide: "lock", priority: 100 },
            { rex: /home|house|ref|base|living/i, emoji: "🏠", lucide: "home", priority: 100 },
            { rex: /search|find|query|explore/i, emoji: "🔍", lucide: "search", priority: 100 },
            { rex: /mail|letter|message|email/i, emoji: "📧", lucide: "mail", priority: 100 },
            { rex: /write|pen|edit|create|author/i, emoji: "🖋️", lucide: "pen-tool", priority: 100 },

            // --- Expanded categories ---
            { rex: /design|ui|ux|figma|sketch|mockup/i, emoji: "✨", lucide: "layout", priority: 90 },
            { rex: /data|csv|excel|sheet|table|stats|analytics/i, emoji: "📊", lucide: "bar-chart-2", priority: 90 },
            { rex: /presentation|slides|ppt|deck/i, emoji: "📽️", lucide: "presentation", priority: 90 },
            { rex: /document|doc|word|report|text/i, emoji: "📄", lucide: "file-text", priority: 90 },
            { rex: /pdf|ebook/i, emoji: "📕", lucide: "file", priority: 90 },
            { rex: /zip|rar|compressed|archive/i, emoji: "🗜️", lucide: "package", priority: 90 },
            { rex: /cloud|sync|drive|storage/i, emoji: "☁️", lucide: "cloud", priority: 90 },
            { rex: /shopping|cart|store|shop|buy|order/i, emoji: "🛒", lucide: "shopping-cart", priority: 90 },
            { rex: /food|recipe|meal|drink|cook|restaurant/i, emoji: "🍔", lucide: "utensils", priority: 90 },
            { rex: /nature|tree|plant|eco|environment/i, emoji: "🌱", lucide: "leaf", priority: 90 },
            { rex: /game|play|fun|console|steam/i, emoji: "🎮", lucide: "gamepad-2", priority: 90 },
            { rex: /news|update|press|media|headline/i, emoji: "📰", lucide: "newspaper", priority: 90 },
            { rex: /calendar|event|schedule|date|time/i, emoji: "📆", lucide: "calendar-days", priority: 90 },
            { rex: /map|location|gps|place|address/i, emoji: "📍", lucide: "map-pin", priority: 90 },
            { rex: /alert|warn|error|bug|issue/i, emoji: "⚠️", lucide: "alert-triangle", priority: 90 },
            { rex: /science|lab|experiment|chemistry|biology/i, emoji: "🔬", lucide: "flask-conical", priority: 90 },
            { rex: /career|job|resume|cv|work/i, emoji: "💼", lucide: "briefcase", priority: 90 },
            { rex: /server|database|infra|network/i, emoji: "🖧", lucide: "server", priority: 90 },
            { rex: /ai|ml|neural|model/i, emoji: "🤖", lucide: "cpu", priority: 90 },

            // --- More diverse icons ---
            { rex: /photo-edit|design|art|draw|paint/i, emoji: "🎨", lucide: "brush", priority: 80 },
            { rex: /travel-doc|passport|visa/i, emoji: "🪪", lucide: "id-card", priority: 80 },
            { rex: /security|auth|key|password/i, emoji: "🔑", lucide: "key", priority: 80 },
            { rex: /download|install|setup/i, emoji: "⬇️", lucide: "download", priority: 80 },
            { rex: /upload|share|publish/i, emoji: "⬆️", lucide: "upload", priority: 80 },
            { rex: /trash|delete|remove|bin/i, emoji: "🗑️", lucide: "trash", priority: 80 },
            { rex: /energy|power|electric|battery/i, emoji: "🔋", lucide: "battery-charging", priority: 80 },
            { rex: /weather|climate|forecast|rain|sun/i, emoji: "⛅", lucide: "cloud-sun", priority: 80 },
            { rex: /holiday|celebration|party|festival/i, emoji: "🎉", lucide: "gift", priority: 80 },
            { rex: /transport|car|bike|bus|train/i, emoji: "🚗", lucide: "car", priority: 80 },
            { rex: /construction|tools|fix|repair/i, emoji: "🛠️", lucide: "wrench", priority: 80 },
            { rex: /photo-camera|shoot|capture/i, emoji: "📷", lucide: "camera", priority: 80 },
            { rex: /clipboard|notes|tasks|checklist/i, emoji: "📋", lucide: "clipboard-list", priority: 80 },
            { rex: /downloaded|software|apps|exe|pkg/i, emoji: "📦", lucide: "box", priority: 80 },
            { rex: /currency|crypto|bitcoin|ethereum/i, emoji: "🪙", lucide: "coins", priority: 80 },

            // --- Fallback ---
            { rex: /.*/, emoji: isFile ? "📄" : "📁", lucide: isFile ? "file" : "folder", priority: 0 }
        ];

        let categories = [...defaultCategories];

        // Parse Custom Rules
        if (this.settings.customIconRules) {
            const rules = this.settings.customIconRules.split('\n');
            for (const rule of rules) {
                if (!rule.trim() || rule.startsWith('//')) continue;
                // Simplified Format: Pattern = Icon @Priority
                if (rule.includes('=')) {
                    try {
                        const [pattern, rightPart] = rule.split('=').map(s => s.trim());
                        const [iconName, priorityStr] = rightPart.split('@').map(s => s.trim());
                        const priority = parseInt(priorityStr) || 150;
                        categories.push({
                            rex: new RegExp(pattern, 'i'),
                            emoji: iconName,
                            lucide: iconName,
                            priority: priority,
                            isCustom: true
                        });
                    } catch (e) {
                         console.warn("Colorful Folders: Failed to parse simplified rule:", rule, e);
                    }
                    continue;
                }

                // Legacy Format: regexPattern, emoji, lucideIconId, priority
                const parts = rule.split(',').map(p => p.trim());
                if (parts.length >= 4) {
                    try {
                        categories.push({
                            rex: new RegExp(parts[0], 'i'),
                            emoji: parts[1],
                            lucide: parts[2],
                            priority: parseInt(parts[3]) || 0,
                            isCustom: true
                        });
                    } catch (e) {
                        if (this.settings.iconDebugMode) console.warn("Colorful Folders: Failed to parse custom rule:", rule, e);
                    }
                }
            }
        }

        const matches = categories.filter(cat => cat.rex.test(lName));
        matches.sort((a, b) => b.priority - a.priority);

        if (this.settings.iconDebugMode) {
            console.log(`Colorful Folders: Evaluating "${name}"`);
            console.log(" -> Matches found:", matches);
            if (matches.length > 0) {
                console.log(` -> Selected winner: `, matches[0]);
            } else {
                console.log(" -> No match found. Returning null.");
            }
        }

        return matches.length > 0 ? matches[0] : null;
    }

    generateStyles() {
        let css = "";
        // Manage Icon Cache size to prevent memory leaks
        if (this.iconCache.size > 500) {
            this.iconCache.clear();
        }

        const root = this.app.vault.getRoot();
        if (!root) return;

        const isDark = this.isDarkMode();
        // Positive brightens, negative darkens
        const lightBrightness = (this.settings.lightModeBrightness || 0) / 100;
        const darkBrightness = (this.settings.darkModeBrightness || 0) / 100;
        const brightnessAmount = isDark ? darkBrightness : lightBrightness;

        // Pre-cached common SVG markers
        const CF_FOLDER_ICON = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
        const CF_FILE_ICON = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>');
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

        const nnText = this.settings.notebookNavigatorSupport ? "body .notebook-navigator" : ".cf-disabled-nn";
        const nnFileBg = (this.settings.notebookNavigatorSupport && this.settings.notebookNavigatorFileBackground) ? "body .notebook-navigator" : ".cf-disabled-nn";

        let heatmapData = null;
        if (this.settings.colorMode === "heatmap") {
            if (this.heatmapCache) {
                heatmapData = this.heatmapCache;
            } else {
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
                this.heatmapCache = heatmapData;
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
            // Focus Mode strategy: dim EVERYTHING, then selectively undim:
            //   1. The active file (.nav-file-title.is-active)
            //   2. Ancestor folders of the active file (.nav-folder:has(.is-active))
            //   3. Anything being hovered
            // Gate: body:has(.nav-file-title.is-active) ensures we only dim when a file IS open.
            css += `
                body:has(.nav-file-title.is-active) .nav-file-title,
                body:has(.nav-file-title.is-active) .nav-folder-title,
                body:has(.nav-file-title.is-active) .nav-folder-content::before {
                    opacity: 0.3 !important;
                    transition: opacity 0.3s ease !important;
                }
                body:has(.nav-file-title.is-active) .nav-file-title.is-active {
                    opacity: 1 !important;
                }
                body:has(.nav-file-title.is-active) .nav-folder:has(.is-active) > .nav-folder-title,
                body:has(.nav-file-title.is-active) .nav-folder:has(.is-active) > .nav-folder-content::before {
                    opacity: 1 !important;
                }
                body:not(.is-mobile):has(.nav-file-title.is-active) .nav-file-title:hover,
                body:not(.is-mobile):has(.nav-file-title.is-active) .nav-folder-title:hover {
                    opacity: 1 !important;
                    transition: opacity 0.15s ease !important;
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

            const glassCss = this.settings.glassmorphism ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';
            const animStyle = this.settings.activeAnimationStyle || "breathe";
            const animDur = this.settings.activeAnimationDuration || 3.0;

            let validIndex = 0;

            // 1. Handle File Inheritance / Auto-color Files
            if (passedColor || this.settings.autoColorFiles || this.settings.autoIcons) {
                let fileIndex = 0;
                for (const child of copyFiles) {
                    const safePath = this.safeEscape(child.path);
                    let color;
                    let fileStyle = this.getStyle(child.path);

                    // Determine icon color for this specific file
                    const fileObj = fileStyle || {};
                    const iconColor = fileObj.iconColor || (inheritedStyle && inheritedStyle.applyToFiles && inheritedStyle.iconColor) || null;


                    if (fileStyle && fileStyle.hex) {
                        // Use exact custom hex color for files
                        const s = fileStyle;
                        const customParsed = this.parseCustomPalette(s.hex);
                        color = customParsed ? customParsed[0] : (this.hexToRgb(s.hex) || currentPalette[(fileIndex + depth + rootIndex) % currentPalette.length]);
                    } else if (inheritedStyle && inheritedStyle.applyToFiles && passedColor) {
                        // Inherit color from parent, even if fileStyle (icon-only) exists
                        color = passedColor;
                    } else if (this.settings.colorMode === "heatmap") {
                        const mtime = child.stat.mtime;
                        color = getHeatmapColor(mtime);
                    } else if (this.settings.autoColorFiles) {
                        // Inheritance fix: if parent specifies a color, use it as baseline
                        color = (inheritedStyle && inheritedStyle.hex) ? (this.hexToRgb(inheritedStyle.hex) || currentPalette[(validIndex + fileIndex) % currentPalette.length]) : currentPalette[(validIndex + fileIndex) % currentPalette.length];
                    } else {
                        // Default to inherited color (icon-only fallback) or theme default
                        color = passedColor || { rgb: "var(--text-normal-rgb)", hex: "var(--text-normal)" };
                    }

                    const isCustomColor = !!(fileStyle && fileStyle.hex);
                    const shouldColorFile = isCustomColor || (inheritedStyle && inheritedStyle.applyToFiles) || this.settings.autoColorFiles;

                    // Logic fix: Merge styles to allow icon from fileStyle and color/font from inheritedStyle
                    const activeStyle = fileStyle || (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle : null);
                    const textColor = (fileStyle && fileStyle.textColor) ? fileStyle.textColor : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.textColor : null);
                    const op = (fileStyle && fileStyle.opacity !== undefined) ? fileStyle.opacity : (isCustomColor && activeStyle.opacity !== undefined ? activeStyle.opacity : 1.0);
                    let text;
                    if (textColor) {
                        text = textColor;
                    } else if (shouldColorFile) {
                        // Use folder's color for file text to match the visual hierarchy
                        if (isDark) {
                            // In dark mode, use the color itself (brightened slightly for readability)
                            const fileBright = Math.max(brightnessAmount, 0.15);
                            text = `rgb(${this.adjustBrightnessRgb(color.rgb, fileBright)})`;
                        } else {
                            text = `rgb(${this.adjustBrightnessRgb(color.rgb, brightnessAmount)})`;
                        }
                    } else {
                        text = "var(--text-normal)";
                    }

                    const isBold = (fileStyle && fileStyle.isBold !== undefined) ? fileStyle.isBold : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.isBold : false);
                    const isItalic = (fileStyle && fileStyle.isItalic !== undefined) ? fileStyle.isItalic : (inheritedStyle && inheritedStyle.applyToFiles ? inheritedStyle.isItalic : false);

                    css += `
                        body .nav-file-title[data-path="${safePath}"],
                        body .tree-item-self[data-path="${safePath}"],
                        ${nnFileBg} [data-path="${safePath}"] {
                            ${shouldColorFile ? `
                                background-color: rgba(${color.rgb}, ${isDark ? '0.1' : '0.15'}) !important;
                                border-left: 2px solid rgba(${color.rgb}, 0.4) !important;
                            ` : ''}
                            opacity: ${isCustomColor ? op : 1.0} !important;
                            color: ${text} !important;
                            font-weight: ${isBold ? 'bold' : 'normal'} !important;
                            font-style: ${isItalic ? 'italic' : 'normal'} !important;
                            border-radius: 4px !important;
                        }
                    `;

                    // Bug 7 Fix: Only compute auto-icon data when autoIcons is enabled
                    // Skip CSS generation entirely if there's no matching category
                    const autoIcon = this.settings.autoIcons ? this.getAutoIconData(child.name, true) : null;
                    let isEmoji = false;
                    let autoIconContent = "";
                    let autoLucideId = null;

                    if (activeStyle && activeStyle.iconId) {
                        const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${activeStyle.iconId}`) && 
                                             !obsidian.getIconIds?.().includes(activeStyle.iconId);
                        
                        if (isCustomEmoji) {
                            css += `
                                body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                                body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                                ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                    content: "${activeStyle.iconId} " !important;
                                }
                                ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                    display: none !important;
                                }
                            `;
                        } else {
                            let svgStr = this.iconCache.get(activeStyle.iconId);
                            if (!svgStr) {
                                const tempEl = document.createElement('div');
                                const iconId = activeStyle.iconId;
                                obsidian.setIcon(tempEl, iconId);
                                if (!tempEl.querySelector('svg') && !iconId.startsWith('lucide-')) {
                                    obsidian.setIcon(tempEl, `lucide-${iconId}`);
                                }
                                const svgEl = tempEl.querySelector('svg');
                                if (svgEl) {
                                    svgEl.removeAttribute('width'); svgEl.removeAttribute('height');
                                    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                    svgStr = encodeURIComponent(svgEl.outerHTML);
                                    this.iconCache.set(activeStyle.iconId, svgStr);
                                }
                            }
                            if (svgStr) {
                                css += `
                                    body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                                    ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                        content: '' !important;
                                        display: inline-block !important;
                                        width: 17px !important;
                                        height: 17px !important;
                                        background-color: ${iconColor ? iconColor : color.hex} !important;
                                        -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${svgStr}') !important;
                                        -webkit-mask-repeat: no-repeat !important;
                                        -webkit-mask-position: center !important;
                                        -webkit-mask-size: contain !important;
                                        margin-right: 6px !important;
                                        vertical-align: text-bottom !important;
                                        opacity: 0.85 !important;
                                    }
                                    ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                        display: none !important;
                                    }
                                `;
                            }
                        }
                    } else {
                        // 2. Parse Auto-icons if no custom icon is set
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
                            // Fallback if built-in name fails to produce SVG
                            if (!tempEl.querySelector('svg') && !autoLucideId.startsWith('lucide-')) {
                                obsidian.setIcon(tempEl, `lucide-${autoLucideId}`);
                            }
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
                                ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                    content: '' !important;
                                    display: inline-block !important;
                                    width: 17px !important;
                                    height: 17px !important;
                                    background-color: ${iconColor ? iconColor : color.hex} !important;
                                    -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${svgStr}') !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                    vertical-align: text-bottom !important;
                                    opacity: 0.85 !important;
                                }
                                ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                    display: none !important;
                                }
                            `;
                        }
                    } else if (isEmoji) {
                        css += `
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                content: ${autoIconContent} !important;
                            }
                            ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    } else if (this.settings.autoIcons) {
                        css += `
                            body .nav-file-title[data-path="${safePath}"] .nav-file-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 17px !important;
                                height: 17px !important;
                                background-color: ${iconColor ? iconColor : color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(CF_FILE_TEXT_ICON)}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.85 !important;
                            }
                            ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }
                }

                fileIndex++;
            }

        }

            // 2. Style current folder's children container (Tint + Line)
            if (depth > 0 && passedColor) {
                const safePath = this.safeEscape(folder.path);
                const minOp = depth === 1 ? 0.12 : 0.05;
                const finalTintOp = Math.max(this.settings.tintOpacity, minOp);
                const bgTint = outlineOnly ? "transparent" : `rgba(${passedColor.rgb}, ${finalTintOp})`;

                let titleAnim = '';
                if (this.settings.animateActivePath) {
                    if (animStyle === "breathe") titleAnim = `animation: cf-breathe-glow ${animDur}s infinite ease-in-out;`;
                    else if (animStyle === "neon") titleAnim = `animation: cf-neon-flicker ${animDur}s infinite alternate;`;
                    else if (animStyle === "shimmer") titleAnim = `animation: cf-shimmer-glow ${animDur}s infinite linear;`;
                }

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
                    traverse(child, depth + 1, rootIndex, passedColor, inheritedStyle);
                    continue;
                }

                let color;
                let customStyle = this.getStyle(child.path);
                let activeStyle = customStyle || inheritedStyle;

                if (customStyle && customStyle.hex) {
                    // Use exact custom hex color for this folder
                    const customParsed = this.parseCustomPalette(customStyle.hex);
                    color = customParsed ? customParsed[0] : (this.hexToRgb(customStyle.hex) || currentPalette[(validIndex + depth + rootIndex) % currentPalette.length]);
                } else if (inheritedStyle && passedColor) {
                    // Use inherited color if customized at parent level, even if icon-only customStyle exists here
                    color = passedColor;
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
                const isCustomColor = !!(activeStyle && activeStyle.hex);
                const op = isCustomColor && activeStyle.opacity !== undefined ? activeStyle.opacity : (depth === 0 ? rootOp : subOp);

                const contrastColor = isDark ? "#191724" : "#ffffff"; // Color for solid backgrounds (inverse of theme)

                // Logic check: depth logic follows below
                if (depth === 0) {
                    if (this.settings.rainbowRootText && this.settings.rainbowRootBgTransparent && !isCustomColor) {
                        bg = "transparent";
                        text = color.hex;
                    } else if (rootBgStyle === "solid") {
                        bg = outlineOnly ? "transparent" : color.hex;
                        text = outlineOnly ? color.hex : contrastColor;
                    } else {
                        // Translucent mode for root folders
                        let finalOp = rootOp;
                        if (isCustom && activeStyle.opacity !== undefined && activeStyle.opacity < 1.0) {
                            finalOp = activeStyle.opacity;
                        }
                        bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${finalOp})`;
                        // Use adjusted color for contrast — in dark mode, clamp negative brightness to avoid invisible text
                        const rootAdjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                        text = (isDark && rootAdjust === 0) ? color.hex : `rgb(${this.adjustBrightnessRgb(color.rgb, rootAdjust)})`;
                    }
                } else {
                    bg = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${op})`;
                    // In dark mode, don't darken — colors are already designed for dark backgrounds
                    const subAdjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                    text = (isDark && subAdjust === 0) ? color.hex : `rgb(${this.adjustBrightnessRgb(color.rgb, subAdjust)})`;
                }

                // Manual Text Override - respect custom, then inherited, then auto-calculated
                const effectiveTextColor = (customStyle && customStyle.textColor) ? customStyle.textColor : (inheritedStyle ? inheritedStyle.textColor : null);
                if (effectiveTextColor) {
                    text = effectiveTextColor;
                } else if (isCustomColor || (inheritedStyle && inheritedStyle.hex)) {
                    // Only apply high-contrast solid colors if a CUSTOM COLOR is actually set for the background
                    const customAdjust = isDark ? Math.max(brightnessAmount, 0) : brightnessAmount;
                    text = (rootBgStyle === "solid" && depth === 0 && !outlineOnly) ? contrastColor : ((isDark && customAdjust === 0) ? color.hex : `rgb(${this.adjustBrightnessRgb(color.rgb, customAdjust)})`);
                }

                const bgTint = outlineOnly ? "transparent" : `rgba(${color.rgb}, ${tintOp})`;

                // Advanced Typography Inheritance
                const isBold = (customStyle && customStyle.isBold !== undefined) ? customStyle.isBold : (inheritedStyle && inheritedStyle.isBold !== undefined ? inheritedStyle.isBold : true);
                const isItalic = (customStyle && customStyle.isItalic !== undefined) ? customStyle.isItalic : (inheritedStyle ? inheritedStyle.isItalic : false);

                let textCss = `
                    color: ${text} !important;
                    font-weight: ${isBold ? 'bold' : 'normal'} !important;
                    font-style: ${isItalic ? 'italic' : 'normal'} !important;
                `;

                if (this.settings.rainbowRootText && depth === 0 && (!customStyle || !customStyle.textColor)) {
                    const nextColor = currentPalette[(validIndex + 1) % currentPalette.length];
                    const shadowOp = isDark ? 0.7 : 0.3; // Softer shadow in light mode
                    textCss = `
                        background-image: linear-gradient(90deg, ${color.hex}, ${nextColor.hex}) !important;
                        background-clip: text !important;
                        -webkit-background-clip: text !important;
                        color: transparent !important;
                        font-weight: 800 !important;
                        filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, ${shadowOp}));
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
                    const isCustomEmoji = !obsidian.getIconIds?.().includes(`lucide-${activeStyle.iconId}`) && 
                                         !obsidian.getIconIds?.().includes(activeStyle.iconId);
                    
                    if (isCustomEmoji) {
                        css += `
                            body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                            body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                            ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                content: "${activeStyle.iconId} " !important;
                            }
                            ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    } else {
                        let svgStr = this.iconCache.get(activeStyle.iconId);
                        if (!svgStr) {
                            const tempEl = document.createElement('div');
                            const iconId = activeStyle.iconId;
                            obsidian.setIcon(tempEl, iconId);
                            // Fallback if built-in name fails (common lucide vs lucide- prefix)
                            if (!tempEl.querySelector('svg') && !iconId.startsWith('lucide-')) {
                                obsidian.setIcon(tempEl, `lucide-${iconId}`);
                            }
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
                                ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                    content: '' !important;
                                    display: inline-block !important;
                                    width: 18px !important;
                                    height: 18px !important;
                                    background-color: ${(activeStyle && activeStyle.iconColor) ? activeStyle.iconColor : color.hex} !important;
                                    -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${svgStr}') !important;
                                    -webkit-mask-repeat: no-repeat !important;
                                    -webkit-mask-position: center !important;
                                    -webkit-mask-size: contain !important;
                                    margin-right: 6px !important;
                                    vertical-align: text-bottom !important;
                                    opacity: 0.85 !important;
                                }
                                ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                    display: none !important;
                                }
                            `;
                        }
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
                            ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                                content: '' !important;
                                display: inline-block !important;
                                width: 18px !important;
                                height: 18px !important;
                                background-color: ${(activeStyle && activeStyle.iconColor) ? activeStyle.iconColor : color.hex} !important;
                                -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${svgStr}') !important;
                                -webkit-mask-repeat: no-repeat !important;
                                -webkit-mask-position: center !important;
                                -webkit-mask-size: contain !important;
                                margin-right: 6px !important;
                                vertical-align: text-bottom !important;
                                opacity: 0.8 !important;
                            }
                            ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                                display: none !important;
                            }
                        `;
                    }
                } else if (isEmoji) {
                    css += `
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before,
                        ${nnText} [data-path="${safePath}"] .nn-navitem-name::before {
                            content: ${autoIconContent} !important;
                        }
                        ${nnText} [data-path="${safePath}"] .nn-navitem-icon {
                            display: none !important;
                        }
                    `;
                } else if (this.settings.autoIcons) {
                    // Default folder SVG icon for standard Obsidian trees. Excluded from notebook-navigator to prevent duplication!
                    css += `
                        body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                            content: '' !important;
                            display: inline-block !important;
                            width: 15px !important;
                            height: 15px !important;
                            background-color: ${text} !important;
                            -webkit-mask-repeat: no-repeat !important;
                            -webkit-mask-position: center !important;
                            margin-right: 6px !important;
                            vertical-align: text-bottom !important;
                            opacity: 0.8 !important;
                        }
                        
                        /* Closed Folder State */
                        body .nav-folder.is-collapsed > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item.is-collapsed > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${CF_FOLDER_CLOSED}') !important;
                        }

                        /* Open Folder State */
                        body .nav-folder:not(.is-collapsed) > .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content::before,
                        body .tree-item:not(.is-collapsed) > .tree-item-self[data-path="${safePath}"] .tree-item-inner::before {
                             -webkit-mask-image: url('data:image/svg+xml;charset=utf-8,${CF_FOLDER_OPEN}') !important;
                        }

                    `;
                }

                const glassCss = this.settings.glassmorphism ? `backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);` : '';

                css += `
                    body .nav-folder-title[data-path="${safePath}"],
                    body .tree-item-self[data-path="${safePath}"] {
                        background-color: ${bg} !important;
                        opacity: ${isCustomColor ? op : (depth === 0 && rootBgStyle === "solid" ? rootOp : 1.0)} !important;
                        border-radius: 6px !important;
                        margin-bottom: 2px !important; margin-top: 2px !important;
                        ${glassCss}
                        transition: background-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease !important;
                    }
                    ${nnText} [data-path="${safePath}"] {
                        background-color: ${bg} !important;
                        border-radius: 4px !important;
                        ${glassCss}
                        transition: background-color 0.2s ease, filter 0.2s ease !important;
                    }
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-title-content,
                    body .tree-item-self[data-path="${safePath}"] .tree-item-inner,
                    ${nnText} [data-path="${safePath}"] .nn-navitem-name {
                        ${textCss}
                    }
                    body .nav-folder-title[data-path="${safePath}"] svg,
                    body .tree-item-self[data-path="${safePath}"] svg,
                    body .nav-folder-title[data-path="${safePath}"] .nav-folder-collapse-indicator svg {
                        color: ${(activeStyle && activeStyle.iconColor) ? activeStyle.iconColor : color.hex} !important;
                        opacity: 1 !important;
                    }
                    ${nnText} [data-path="${safePath}"] .nn-navitem-icon svg,
                    ${nnText} [data-path="${safePath}"] .nn-parent-folder-icon svg {
                        color: ${(activeStyle && activeStyle.iconColor) ? activeStyle.iconColor : color.hex} !important;
                        opacity: 1 !important;
                    }
                    body:not(.is-mobile) .nav-folder-title[data-path="${safePath}"]:hover,
                    body:not(.is-mobile) .tree-item-self[data-path="${safePath}"]:hover,
                    body:not(.is-mobile) .notebook-navigator [data-path="${safePath}"]:hover {
                        filter: brightness(1.2);
                        ${this.settings.glassmorphism ? 'backdrop-filter: blur(12px) saturate(150%);' : ''}
                    }
                `;

                if (this.settings.showItemCounters) {
                    const counts = countItems(child);
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

                    const combinedIconUrl = `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(combinedSvg)}')`;

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
                        if (animStyle === "breathe") titleAnim = `animation: cf-breathe-glow ${animDur}s infinite ease-in-out;`;
                        else if (animStyle === "neon") titleAnim = `animation: cf-neon-flicker ${animDur}s infinite alternate;`;
                        else if (animStyle === "shimmer") titleAnim = `animation: cf-shimmer-glow ${animDur}s infinite linear;`;
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
                        ${nnText} .nn-navitem[data-path="${safePath}"].nn-selected {
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
        this.styleEl.textContent = css;
    }
}

class ColorfulFoldersSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.activeTab = "gen";
    }

    display() {
        const rootEl = this.containerEl;
        rootEl.empty();
        rootEl.addClass('colorful-folders-config');

        rootEl.createEl('h2', { text: 'Colorful Folders Configuration' });

        const tabBar = rootEl.createDiv();
        Object.assign(tabBar.style, { display: 'flex', borderBottom: '1px solid var(--background-modifier-border)', marginBottom: '20px', gap: '4px' });

        const generalPanel = rootEl.createDiv();
        const intPanel = rootEl.createDiv();
        intPanel.style.display = "none";
        const iconPanel = rootEl.createDiv();
        iconPanel.style.display = "none";

        const btnGen = tabBar.createEl("button", { text: "⚙️ General Options" });
        const btnInt = tabBar.createEl("button", { text: "🔗 Integrations" });
        const btnIcon = tabBar.createEl("button", { text: "📦 Icon Packs" });

        const styleBtn = (btn, active) => {
            Object.assign(btn.style, {
                background: "none", border: "none", padding: "8px 16px", cursor: "pointer",
                fontSize: "0.95em", fontWeight: "600",
                color: active ? "var(--interactive-accent)" : "var(--text-muted)",
                borderBottom: active ? "3px solid var(--interactive-accent)" : "3px solid transparent",
                transition: "all 0.15s ease"
            });
        };

        const setTab = (t) => {
            this.activeTab = t;
            generalPanel.style.display = (t === "gen" ? "block" : "none");
            intPanel.style.display = (t === "int" ? "block" : "none");
            iconPanel.style.display = (t === "icon" ? "block" : "none");
            styleBtn(btnGen, t === "gen");
            styleBtn(btnInt, t === "int");
            styleBtn(btnIcon, t === "icon");
        };

        btnGen.onclick = () => setTab("gen");
        btnInt.onclick = () => setTab("int");
        btnIcon.onclick = () => setTab("icon");
        setTab(this.activeTab);

        // ── INTEGRATIONS PANEL ────────────────────────────────────────────────
        intPanel.createEl('h3', { text: 'Notebook Navigator' });
        new obsidian.Setting(intPanel)
            .setName('Enable Notebook Navigator Support')
            .setDesc('Allows Colorful Folders to safely style the icons and text of Notebook Navigator items.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorSupport)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorSupport = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(intPanel)
            .setName('Apply Background Colors to Files')
            .setDesc('Injects the faint background block and left border to file cards. Disable this to keep the cards strictly native.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorFileBackground)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorFileBackground = value;
                    await this.plugin.saveSettings();
                }));

        // ── ICON PACKS PANEL ──────────────────────────────────────────────────
        iconPanel.createEl("h3", { text: "Manage Custom Icons" });
        
        const iconDesc = iconPanel.createEl("p", { text: "Add individual SVG icons or import bulk packs from the internet. All custom icons added here will appear in the icon selection grid when styling a folder or file." });
        Object.assign(iconDesc.style, { fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" });

        iconPanel.createEl("div", { text: "Pro Tip: Custom IDs should be unique. Avoid starting them with 'lucide-' unless you intend to override a built-in Obsidian icon." }).style.cssText = "font-size:0.8em; color:var(--text-accent); margin-bottom:15px; font-style:italic;";

        const manualWrap = iconPanel.createDiv();
        Object.assign(manualWrap.style, {
            padding: "16px", background: "var(--background-secondary)", borderRadius: "10px",
            border: "1px solid var(--background-modifier-border)", marginBottom: "20px"
        });
        
        manualWrap.createEl("div", { text: "Add Single Icon" }).style.cssText = "font-weight:700;margin-bottom:10px;font-size:0.9em";
        const manualRow = manualWrap.createDiv();
        Object.assign(manualRow.style, { display: "flex", gap: "8px", flexWrap: "wrap" });
        const idInp = manualRow.createEl("input", { placeholder: "Icon ID (e.g. cloud-logo)" });
        const svgInp = manualRow.createEl("input", { placeholder: "SVG Code (<svg...)" });
        idInp.style.flex = "1"; svgInp.style.flex = "3";
        
        const addBtn = manualRow.createEl("button", { text: "Add Icon" });
        addBtn.onclick = async () => {
            const id = idInp.value.trim();
            const svg = svgInp.value.trim();
            if (!id || !svg.startsWith("<svg")) {
                new obsidian.Notice("Please provide a valid ID and SVG code.");
                return;
            }
            this.plugin.settings.customIcons[id] = svg;
            this.plugin.registerCustomIcons();
            await this.plugin.saveSettings();
            this.display();
            new obsidian.Notice(`Icon '${id}' registered!`);
        };

        new obsidian.Setting(iconPanel)
            .setName("Bulk Import from URL")
            .setDesc("Enter a URL to a JSON icon pack { 'id': '<svg...>' }")
            .addText(text => {
                text.setPlaceholder("https://example.com/icons.json");
                const impBtn = iconPanel.createEl("button", { text: "Import" });
                Object.assign(impBtn.style, { marginLeft: "8px" });
                impBtn.onclick = async () => {
                    const url = text.getValue().trim();
                    if (!url) return;
                    this.importUrl(url);
                };
            });

        iconPanel.createEl("h4", { text: "Featured Icon Packs" }).style.marginTop = "20px";
        const gallery = iconPanel.createDiv();
        Object.assign(gallery.style, { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" });

        const packs = [
            { name: "✨ CF Starter Pack", desc: "A reliable set of 3 basic icons.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/master/icons/sample-pack.json" },
            { name: "🌈 Vibrant Folders", desc: "Colorful folder variants.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/master/icons/vibrant-folders.json" },
            { name: "📁 System Essentials", desc: "OS-style icon set.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/master/icons/system-essentials.json" }
        ];

        packs.forEach(p => {
            const card = gallery.createDiv();
            Object.assign(card.style, {
                padding: "12px", background: "var(--background-secondary)", borderRadius: "8px", 
                border: "1px solid var(--background-modifier-border)",
                display: "flex", flexDirection: "column", gap: "6px"
            });
            card.createEl("div", { text: p.name }).style.fontWeight = "600";
            card.createEl("div", { text: p.desc }).style.fontSize = "0.75em";
            const btn = card.createEl("button", { text: "One-Click Import" });
            Object.assign(btn.style, { width: "100%", marginTop: "5px", fontSize: "0.8em" });
            btn.onclick = () => this.importUrl(p.url);
        });

        iconPanel.createEl("h4", { text: "Custom Icon Library" }).style.marginTop = "20px";
        const lib = iconPanel.createDiv();
        Object.assign(lib.style, {
            maxHeight: "350px", overflowY: "auto", padding: "8px",
            border: "1px solid var(--background-modifier-border)", borderRadius: "8px"
        });
        const customIconList = Object.entries(this.plugin.settings.customIcons);
        if (customIconList.length === 0) {
            lib.createEl("div", { text: "No custom icons found." }).style.cssText = "color:var(--text-muted);font-style:italic;padding:10px";
        } else {
            customIconList.forEach(([id, svg]) => {
                const item = lib.createDiv();
                Object.assign(item.style, { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderBottom: "1px solid var(--background-modifier-border-focus)" });
                const left = item.createDiv();
                Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });
                const box = left.createDiv(); box.innerHTML = svg;
                const sv = box.querySelector("svg"); if (sv) Object.assign(sv.style, { width: "18px", height: "18px" });
                left.createEl("span", { text: id }).style.fontSize = "0.9em";
                
                const del = item.createEl("button", { text: "Remove" });
                Object.assign(del.style, { color: "var(--text-error)", padding: "2px 8px", fontSize: "0.8em" });
                del.onclick = async () => {
                    delete this.plugin.settings.customIcons[id];
                    await this.plugin.saveSettings();
                    this.display();
                };
            });
        }

        // ── GENERAL PANEL (CONTAINS EXISTING CONFIG) ──────────────────────────
        const containerEl = generalPanel;

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
                        Right-click any folder or file and click <strong>"Set Custom Style"</strong> to assign specific overrides!
                    </div>
                </div>
            </div>
        `;

        new obsidian.Setting(containerEl)
            .setName('Color Palette Theme')
            .setDesc('Select a curated color scheme for your vault. Choose "Custom" to enter your own hex codes below.')
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
            .setDesc('Comma-separated list of hex colors.')
            .addText(text => text
                .setPlaceholder('#ff0000, #00ff00')
                .setValue(this.plugin.settings.customPalette)
                .onChange(async (value) => {
                    this.plugin.settings.customPalette = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Color Generation Mode')
            .setDesc('Cycle assigns colors sequentially. Monochromatic uses depth-based shading. Heatmap colors folders based on the most recently modified file inside.')
            .addDropdown(drop => drop
                .addOption('cycle', 'Rainbow Cycle')
                .addOption('monochromatic', 'Monochromatic Depth')
                .addOption('heatmap', 'Activity Heatmap')
                .setValue(this.plugin.settings.colorMode)
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Root Folder Appearance')
            .setDesc('Solid uses vivid backgrounds for root folders. Translucent provides a softer, glowing look.')
            .addDropdown(drop => drop
                .addOption('solid', 'Solid Vivid Color')
                .addOption('translucent', 'Translucent Glow')
                .setValue(this.plugin.settings.rootStyle)
                .onChange(async (value) => {
                    this.plugin.settings.rootStyle = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Focus Mode')
            .setDesc('Dims inactive root folders when you are working deep inside a project path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.focusMode)
                .onChange(async (value) => {
                    this.plugin.settings.focusMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Glassmorphism Blur')
            .setDesc('Adds an iOS-style backdrop blur to folder backgrounds. Best with semi-translucent themes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.glassmorphism)
                .onChange(async (value) => {
                    this.plugin.settings.glassmorphism = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h4', { text: 'Adaptive Theme Visibility' });
        new obsidian.Setting(containerEl)
            .setName('Light Mode Brightness (%)')
            .addSlider(slider => slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.lightModeBrightness || 0)
                .onChange(async (value) => {
                    this.plugin.settings.lightModeBrightness = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Dark Mode Brightness (%)')
            .addSlider(slider => slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.darkModeBrightness || 0)
                .onChange(async (value) => {
                    this.plugin.settings.darkModeBrightness = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Outline Only Mode')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Auto-Generated Icons' });
        new obsidian.Setting(containerEl)
            .setName('Enable Automatic Icons')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(containerEl)
                .setName('Wide Icon Rendering (Lucide SVGs)')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                    }));

            const rulesDesc = containerEl.createEl("div");
            Object.assign(rulesDesc.style, {
                fontSize: "0.8em", color: "var(--text-muted)", marginBottom: "12px",
                padding: "10px", background: "var(--background-secondary-alt)", borderRadius: "6px",
                borderLeft: "3px solid var(--interactive-accent)", lineHeight: "1.4"
            });
            rulesDesc.innerHTML = `
                <strong>How to use Priority Rules:</strong><br>
                Define rules to automatically assign icons based on folder/file names.<br><br>
                <strong>Simplified Format:</strong> <code>Pattern = IconID @Priority</code><br>
                <strong>Example:</strong> <code>Projects = rocket @200</code><br>
                <strong>Example:</strong> <code>Journal = 📅 @150</code>
            `;

            new obsidian.Setting(containerEl)
                .setName('Priority Rules')
                .setDesc('Customize matching logic with simple patterns.')
                .addTextArea(text => {
                    text.setPlaceholder("Work = briefcase @200\nDaily = 📅 @150")
                        .setValue(this.plugin.settings.customIconRules || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customIconRules = value;
                            await this.plugin.saveSettings();
                        });
                    Object.assign(text.inputEl.style, {
                        width: "100%", height: "120px", background: "var(--background-secondary)",
                        border: "1px solid var(--background-modifier-border-focus)",
                        color: "var(--text-normal)", fontFamily: "var(--font-monospace)",
                        fontSize: "0.85em", padding: "12px", borderRadius: "6px"
                    });
                });
        }

        containerEl.createEl('h3', { text: 'Path & Typography' });
        new obsidian.Setting(containerEl)
            .setName('Show Item Counters')
            .setDesc('Displays recursive folder and file counts next to folder names.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Active File Glow')
            .setDesc('Highlights the path to the currently active document with a connecting line.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Animate Active Path')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.animateActivePath)
                .onChange(async (value) => {
                    this.plugin.settings.animateActivePath = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.animateActivePath) {
            new obsidian.Setting(containerEl)
                .setName('Animation Style')
                .addDropdown(drop => drop
                    .addOption('breathe', 'Smooth Breathe')
                    .addOption('neon', 'Neon Flicker')
                    .addOption('shimmer', 'Color Shimmer')
                    .setValue(this.plugin.settings.activeAnimationStyle || "shimmer")
                    .onChange(async (value) => {
                        this.plugin.settings.activeAnimationStyle = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new obsidian.Setting(containerEl)
            .setName('Rainbow Root Text')
            .setDesc('Applies a vivid rainbow-text horizontal gradient to all top-level folders.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootText)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Auto-color Files')
            .setDesc('Automatically gives a subtle rainbow tint and color to all files in your vault.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoColorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.autoColorFiles = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        containerEl.createEl('h3', { text: 'Advanced Tuning' });
        new obsidian.Setting(containerEl)
            .setName('Root Opacity (%)')
            .addSlider(slider => slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.rootOpacity * 100)
                .onChange(async (value) => {
                    this.plugin.settings.rootOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Subfolder Opacity (%)')
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

    async importUrl(url) {
        if (!url) return;
        try {
            const res = await fetch(url);
            const data = await res.json();
            let count = 0;
            for (const [id, svg] of Object.entries(data)) {
                if (typeof svg === 'string' && svg.startsWith('<svg')) {
                    this.plugin.settings.customIcons[id] = svg;
                    count++;
                }
            }
            this.plugin.registerCustomIcons();
            await this.plugin.saveSettings();
            new obsidian.Notice(`Successfully imported ${count} icons!`);
            this.display();
        } catch (e) {
             new obsidian.Notice("Import failed. See console.");
             console.error(e);
        }
    }
}


module.exports = ColorfulFoldersPlugin;
