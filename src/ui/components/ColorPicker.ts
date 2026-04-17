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

    const initRgb = hexToRgbObj(initialHex || '#eb6f92');
    let hsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);

    const wrap = container.createDiv({ cls: 'cf-vcp' });
    wrap.style.cssText = `
        display: flex; flex-direction: row; gap: 12px;
        padding: 8px; border-radius: 10px;
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        align-items: stretch;
    `;

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

    const rightCol = wrap.createDiv();
    Object.assign(rightCol.style, { display: "flex", flexDirection: "column", gap: "6px", flex: "1", justifyContent: "center" });

    const slidersRow = rightCol.createDiv();
    slidersRow.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    const previewRow = rightCol.createDiv();
    previewRow.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    const previewDot = previewRow.createDiv();
    previewDot.style.cssText = `
        width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
        border: 1px solid var(--background-modifier-border);
    `;
    const hexInput = previewRow.createEl('input', { type: 'text' }) as HTMLInputElement;
    hexInput.style.cssText = `
        flex: 1; font-family: monospace; font-size: 0.75em;
        padding: 3px 6px; border-radius: 4px; border: 1px solid var(--background-modifier-border);
        background: var(--background-primary); color: var(--text-normal);
        outline: none; font-weight: 600;
    `;
    hexInput.maxLength = 7;

    const buildSlider = (label: string, min: number, max: number, value: number, gradient: string, onInput: (v: number) => void) => {
        const row = slidersRow.createDiv();
        row.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const lbl = row.createEl('span', { text: label });
        lbl.style.cssText = 'font-size: 0.7em; font-weight: 700; color: var(--text-muted); width: 12px; text-transform: uppercase; letter-spacing: 1px;';
        const slider = row.createEl('input', { type: 'range' }) as HTMLInputElement;
        slider.min = min.toString(); slider.max = max.toString(); slider.value = value.toString();
        slider.style.cssText = `
            flex: 1; -webkit-appearance: none; appearance: none;
            height: 10px; border-radius: 5px; outline: none; cursor: pointer;
            background: ${gradient};
            border: 1px solid rgba(0,0,0,0.12);
        `;
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
        board.style.backgroundColor = `hsl(${hsv.h}, 100%, 50%)`;
        const bw = board.offsetWidth || 140;
        const bh = board.offsetHeight || 100;
        thumb.style.left = `${(hsv.s / 100) * bw}px`;
        thumb.style.top = `${(1 - hsv.v / 100) * bh}px`;
        previewDot.style.backgroundColor = hex;
        previewDot.style.opacity = currentAlpha.toString();
        hexInput.value = hex;
        if (alphaSlider) {
            alphaSlider.style.background = `linear-gradient(to right, transparent, ${hex}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px`;
        }
        onChange(hex, currentAlpha);
    }

    function syncFromHex(hex: string) {
        const rgb = hexToRgbObj(hex);
        hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        hueSlider.value = hsv.h.toString();
        syncFromHSV();
    }

    function handleBoardPointer(e: PointerEvent) {
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
