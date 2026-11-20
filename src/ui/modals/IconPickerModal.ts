import * as obsidian from 'obsidian';
import { t } from '../../lang/helpers';
import { IColorfulFoldersPlugin } from '../../common/types';
import { IconPackIndex } from '../../core/IconPackIndex';

export class IconPickerModal extends obsidian.Modal {
    plugin: IColorfulFoldersPlugin;
    onSelect: (iconId: string) => void | Promise<void>;
    currentIconId: string;
    private searchTimeout: number | null = null;
    private currentRenderBatch = 0;
    private currentFilteredList: string[] = [];

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, currentIconId: string, onSelect: (iconId: string) => void | Promise<void>) {
        super(app);
        this.plugin = plugin;
        this.currentIconId = currentIconId;
        this.onSelect = onSelect;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.setCssStyles({
            maxWidth: "520px",
            width: "min(520px, 92vw)",
            maxHeight: "88vh",
            overflowY: "auto",
            borderRadius: "12px"
        });

        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({
            padding: "20px 24px 10px",
            borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "12px"
        });
        const h2 = header.createEl("h2", { text: t("modal.icon_picker.title"), cls: "cf-modal-title" });
        h2.setCssStyles({ margin: "0" });

        const body = contentEl.createDiv();
        body.setCssStyles({ padding: "0 24px 20px" });

        // Search & Filter Row
        const searchRow = body.createDiv();
        searchRow.setCssStyles({ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" });
        
        const searchInputWrap = searchRow.createDiv();
        searchInputWrap.setCssStyles({ position: "relative", flex: "1" });
        
        const searchInput = searchInputWrap.createEl("input", { type: "text" });
        searchInput.setCssStyles({
            width: "100%", padding: "8px 12px 8px 36px", borderRadius: "8px",
            border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)",
            fontSize: "0.9em", boxSizing: "border-box"
        });
        searchInput.placeholder = t("modal.icon_picker.search_placeholder");
        
        const searchIcon = searchInputWrap.createDiv();
        searchIcon.setCssStyles({
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-muted)"
        });
        obsidian.setIcon(searchIcon, "search");
        const ssvg = searchIcon.querySelector("svg") as unknown as HTMLElement | null;
        if (ssvg) ssvg.setCssStyles({ width: "16px", height: "16px" });

        const customMap = this.plugin.getCustomIconsMap();
        const customIds = Object.keys(customMap);
        const localIds = this.plugin.localFileSystemIcons ? Object.keys(this.plugin.localFileSystemIcons) : [];
        const combinedCustomIds = Array.from(new Set([...customIds, ...localIds]));
        const prefixes = new Set(['all', 'lucide']);

        const hasAnimated = combinedCustomIds.some(id => this.plugin.animatedIconService?.isAnimatedIcon(id));
        if (hasAnimated) {
            prefixes.add('animated');
        }

        combinedCustomIds.forEach(id => {
            prefixes.add(IconPackIndex.getPackPrefix(id));
        });

        const filterSelect = searchRow.createEl("select");
        filterSelect.setCssStyles({
            padding: "7px 12px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)", fontSize: "0.9em"
        });

        const packDisplayNames: Record<string, string> = {
            'all': t("settings.option.all_packs"),
            'animated': '✨ ANIMATED ICONS',
            'lucide': "✨ Obsidian Official (Lucide)",
            'line-md': 'LINE-MD (ANIMATED)',
            'meteocons': 'METEOCONS (ANIMATED)',
            'simple-icons': 'SIMPLE ICONS',
            'tabler': 'TABLER',
            'bi': 'BOOTSTRAP',
            'feather': 'FEATHER',
            'remix': 'REMIX',
            'bx': 'BOXICONS',
            'octicon': 'OCTICONS',
            'ra': 'RPG AWESOME',
            'fa-solid': 'FONT AWESOME SOLID',
            'fa-regular': 'FONT AWESOME REGULAR',
            'custom': 'CUSTOM'
        };

        Array.from(prefixes).sort().forEach(p => {
            const label = packDisplayNames[p] || p.toUpperCase();
            const opt = filterSelect.createEl("option", { text: label, value: p });
            if (p === 'all') opt.selected = true;
        });

        // Icon grid
        const iconGrid = body.createDiv({ cls: "cf-icon-grid" });
        iconGrid.setCssStyles({
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
            gap: "6px", maxHeight: "350px", overflowY: "auto",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "10px", padding: "10px",
            backgroundColor: "rgba(0,0,0,0.05)"
        });

        const lucideRaw = obsidian.getIconIds ? obsidian.getIconIds() : [];
        const lucideIcons = Array.from(new Set(
            lucideRaw.map(id => id.replace(/^lucide-/, ''))
        )).filter(id => id.length > 0 && !id.includes(':'));
        
        const allIcons = Array.from(new Set([...combinedCustomIds, ...lucideIcons]));

        const BATCH_SIZE = 60;
        const svgTemplateCache = new Map<string, Element>();

        const getSvgTemplate = (id: string, rawSvg: string): Element | null => {
            let cached = svgTemplateCache.get(id);
            if (cached) return cached;
            try {
                const cleanSvg = rawSvg.includes('\\"') ? rawSvg.replace(/\\"/g, '"') : rawSvg;
                // eslint-disable-next-line no-unsanitized/method -- Contextual fragment is safe here as svg content comes from curated internal asset maps or local files
                const frag = activeDocument.createRange().createContextualFragment(cleanSvg);
                const svgEl = frag.querySelector("svg");
                if (svgEl) {
                    svgEl.removeAttribute("width");
                    svgEl.removeAttribute("height");
                    svgTemplateCache.set(id, svgEl);
                    return svgEl;
                }
            } catch {
                return null;
            }
            return null;
        };

        const renderBatch = (targetContainer: HTMLElement, start: number, end: number) => {
            const batchList = this.currentFilteredList.slice(start, end);
            batchList.forEach(id => {
                const isSelected = this.currentIconId === id;
                const cell = targetContainer.createDiv({ cls: "cf-icon-cell" });
                cell.setCssStyles({
                    width: "48px", height: "48px", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.1s ease",
                    backgroundColor: isSelected ? "var(--interactive-accent)" : "transparent",
                });
                
                if (this.plugin.iconManager.isEmojiIcon(id)) {
                    cell.setText(id);
                    cell.setCssStyles({ fontSize: "20px" });
                } else {
                    const rawSvg = this.plugin.iconManager.getRawIconSvg(id);
                    if (rawSvg) {
                        const templateSvg = getSvgTemplate(id, rawSvg);
                        if (templateSvg) {
                            const svgEl = templateSvg.cloneNode(true) as HTMLElement;
                            svgEl.setCssStyles({
                                width: "24px", height: "24px",
                                color: isSelected ? "white" : "var(--text-normal)"
                            });
                            cell.appendChild(svgEl);
                        } else {
                            cell.setText(id.slice(0, 3));
                        }
                    } else {
                        try {
                            obsidian.setIcon(cell, id);
                            const cellSvg = cell.querySelector("svg") as unknown as HTMLElement | null;
                            if (cellSvg) {
                                cellSvg.removeAttribute('width');
                                cellSvg.removeAttribute('height');
                                cellSvg.setCssStyles({
                                    width: "24px", height: "24px",
                                    color: isSelected ? "white" : "var(--text-normal)"
                                });
                            } else {
                                cell.setText(id.slice(0, 3));
                            }
                        } catch {
                            cell.setText(id.slice(0, 3));
                        }
                    }
                }
                
                cell.title = id;
                cell.onclick = async () => {
                    await this.onSelect(id);
                    this.close();
                };
                
                cell.onmouseenter = () => { if (!isSelected) cell.setCssStyles({ backgroundColor: "var(--background-modifier-hover)" }); };
                cell.onmouseleave = () => { if (!isSelected) cell.setCssStyles({ backgroundColor: "transparent" }); };
            });
        };

        const renderIcons = (search: string, packFilter: string) => {
            iconGrid.empty();
            let filtered = allIcons;
            
            if (packFilter !== "all") {
                if (packFilter === "lucide") {
                    filtered = lucideIcons;
                } else if (packFilter === "animated") {
                    filtered = combinedCustomIds.filter(id => this.plugin.animatedIconService?.isAnimatedIcon(id));
                } else {
                    filtered = combinedCustomIds.filter(id => {
                        return IconPackIndex.getPackPrefix(id) === packFilter;
                    });
                }
            }

            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(id => id.toLowerCase().includes(s));
            }

            this.currentFilteredList = filtered;
            this.currentRenderBatch = BATCH_SIZE;

            if (filtered.length === 0) {
                const emptyMsg = iconGrid.createDiv({ text: t("modal.icon_picker.no_icons_found"), cls: "cf-no-icons" });
                emptyMsg.setCssStyles({
                    padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9em", gridColumn: "1/-1"
                });
                return;
            }

            renderBatch(iconGrid, 0, BATCH_SIZE);
        };

        // Scroll listener for lazy loading remaining icon batches
        iconGrid.addEventListener('scroll', () => {
            if (this.currentRenderBatch >= this.currentFilteredList.length) return;
            const scrollBottom = iconGrid.scrollTop + iconGrid.clientHeight;
            if (scrollBottom >= iconGrid.scrollHeight - 100) {
                const nextEnd = Math.min(this.currentRenderBatch + BATCH_SIZE, this.currentFilteredList.length);
                renderBatch(iconGrid, this.currentRenderBatch, nextEnd);
                this.currentRenderBatch = nextEnd;
            }
        }, { passive: true });

        renderIcons("", "all");

        const triggerSearch = () => {
            if (this.searchTimeout !== null) {
                window.clearTimeout(this.searchTimeout);
            }
            this.searchTimeout = window.setTimeout(() => {
                renderIcons(searchInput.value, filterSelect.value);
            }, 150);
        };

        searchInput.oninput = triggerSearch;
        filterSelect.onchange = () => renderIcons(searchInput.value, filterSelect.value);
        
        // Auto-focus search
        window.setTimeout(() => searchInput.focus(), 50);
    }

    onClose() {
        if (this.searchTimeout !== null) {
            window.clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
        this.contentEl.empty();
    }
}
