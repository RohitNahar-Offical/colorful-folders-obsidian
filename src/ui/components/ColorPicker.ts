import { hexToRgbObj, rgbToHsv, hsvToRgb, rgbToHex } from '../../common/utils';
import { ColorPickerOpts } from '../../common/types';

export function createVisualColorPicker(
    container: HTMLElement, 
    initialHex: string, 
    onChange: (hex: string, alpha: number) => void, 
    opts: ColorPickerOpts = {}
) {
    const showAlpha = opts.showAlpha !== false;
    let currentAlpha = opts.initialAlpha !== undefined ? opts.initialAlpha : 1.0;

    const initRgb = hexToRgbObj(initialHex) || { r: 235, g: 111, b: 146 }; // Fallback to Rosé Pine pink
    let hsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);

    const wrap = container.createDiv({ cls: 'cf-vcp' });

    const board = wrap.createDiv({ cls: 'cf-vcp-board' });
    board.setCssStyles({
        backgroundColor: `hsl(${hsv.h}, 100%, 50%)`
    });

    board.createDiv({ cls: 'cf-vcp-board-grad-white' });
    board.createDiv({ cls: 'cf-vcp-board-grad-black' });
    
    const thumb = board.createDiv({ cls: 'cf-vcp-thumb' });

    const rightCol = wrap.createDiv();
    rightCol.setCssStyles({ display: "flex", flexDirection: "column", gap: "6px", flex: "1", justifyContent: "center" });

    const slidersRow = rightCol.createDiv();
    slidersRow.setCssStyles({ display: 'flex', flexDirection: 'column', gap: '4px' });

    const previewRow = rightCol.createDiv();
    previewRow.setCssStyles({ display: 'flex', alignItems: 'center', gap: '6px' });
    
    const previewDot = previewRow.createDiv();
    previewDot.setCssStyles({
        width: "24px", height: "24px", borderRadius: "6px", flexShrink: "0",
        border: "1px solid var(--background-modifier-border)"
    });
    
    const hexInput = previewRow.createEl('input', { type: 'text' });
    hexInput.setCssStyles({
        flex: "1", fontFamily: "monospace", fontSize: "0.75em",
        padding: "3px 6px", borderRadius: "4px", border: "1px solid var(--background-modifier-border)",
        background: "var(--background-primary)", color: "var(--text-normal)",
        outline: "none", fontWeight: "600"
    });
    hexInput.maxLength = 7;

    const buildSlider = (label: string, min: number, max: number, value: number, gradient: string, onInput: (v: number) => void) => {
        const row = slidersRow.createDiv();
        row.setCssStyles({ display: 'flex', alignItems: 'center', gap: '8px' });
        
        const lbl = row.createEl('span', { text: label });
        lbl.setCssStyles({ fontSize: '0.7em', fontWeight: '700', color: 'var(--text-muted)', width: '12px', textTransform: 'uppercase', letterSpacing: '1px' });
        
        const slider = row.createEl('input', { type: 'range', cls: 'cf-vcp-slider' });
        slider.min = min.toString(); 
        slider.max = max.toString(); 
        slider.value = value.toString();
        
        slider.setCssStyles({
            background: gradient
        });
        
        slider.addEventListener('input', () => onInput(parseInt(slider.value)));
        return slider;
    };

    const hueGrad = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
    const hueSlider = buildSlider('H', 0, 360, hsv.h, hueGrad, (v) => {
        hsv.h = v;
        syncFromHSV();
    });

    let alphaSlider: HTMLInputElement | null = null;
    if (showAlpha) {
        const alphaGrad = `linear-gradient(to right, transparent, ${initialHex})`;
        alphaSlider = buildSlider('A', 0, 100, Math.round(currentAlpha * 100), alphaGrad, (v) => {
            currentAlpha = v / 100;
            syncFromHSV();
        });
    }

    function syncFromHSV() {
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        
        board.setCssStyles({ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` });
        
        const bw = board.offsetWidth || 140;
        const bh = board.offsetHeight || 100;
        
        thumb.setCssStyles({
            left: `${(hsv.s / 100) * bw}px`,
            top: `${(1 - hsv.v / 100) * bh}px`
        });
        
        previewDot.setCssStyles({
            backgroundColor: hex,
            opacity: currentAlpha.toString()
        });
        
        hexInput.value = hex;
        
        if (alphaSlider) {
            alphaSlider.setCssStyles({
                background: `linear-gradient(to right, transparent, ${hex}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px`
            });
        }
        onChange(hex, currentAlpha);
    }

    function syncFromHex(hex: string) {
        const rgb = hexToRgbObj(hex);
        if (!rgb) return;
        hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        hueSlider.value = hsv.h.toString();
        syncFromHSV();
    }

    function handleBoardPointer(e: PointerEvent) {
        const rect = board.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        hsv.s = Math.round((x / rect.width) * 100);
        hsv.v = Math.round((1 - y / rect.height) * 100);
        syncFromHSV();
    }

    board.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        board.setPointerCapture(e.pointerId);
        handleBoardPointer(e);
        thumb.setCssStyles({
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.2)'
        });
    });
    board.addEventListener('pointermove', (e) => {
        if (board.hasPointerCapture(e.pointerId)) handleBoardPointer(e);
    });
    board.addEventListener('pointerup', (e) => {
        board.releasePointerCapture(e.pointerId);
        thumb.setCssStyles({
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.3)'
        });
    });

    hexInput.addEventListener('input', () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            syncFromHex(val);
        }
    });

    syncFromHSV();

    return {
        setHex(hex: string) { syncFromHex(hex); },
        getHex() { return hexInput.value; },
        getAlpha() { return currentAlpha; }
    };
}
