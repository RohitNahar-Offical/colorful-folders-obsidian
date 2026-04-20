import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../../common/types';

export class IconPickerModal extends obsidian.Modal {
    plugin: IColorfulFoldersPlugin;
    onSelect: (iconId: string) => void | Promise<void>;
    currentIconId: string;

    // eslint-disable-next-line obsidianmd/prefer-active-doc -- Constructor is incorrectly flagged by this rule
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
            width: "90vw",
            borderRadius: "12px"
        });

        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({
            padding: "20px 24px 10px",
            borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "12px"
        });
        const h2 = header.createEl("h2", { text: "Select icon", cls: "cf-modal-title" });
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
        searchInput.placeholder = "Search icons...";
        
        const searchIcon = searchInputWrap.createDiv();
        searchIcon.setCssStyles({
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-muted)"
        });
        obsidian.setIcon(searchIcon, "search");
        const ssvg = searchIcon.querySelector("svg") as unknown as HTMLElement | null;
        if (ssvg) ssvg.setCssStyles({ width: "16px", height: "16px" });

        // Pack Filter
        const customIds = Object.keys(this.plugin.settings.customIcons);
        const prefixes = new Set(['all', 'lucide']);
        customIds.forEach(id => {
            const parts = id.split('-');
            if (parts.length > 1) prefixes.add(parts[0]);
            else prefixes.add('custom');
        });

        const filterSelect = searchRow.createEl("select");
        filterSelect.setCssStyles({
            padding: "7px 12px", borderRadius: "8px", border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-secondary)", color: "var(--text-normal)", fontSize: "0.9em"
        });
        Array.from(prefixes).sort().forEach(p => {
            const opt = filterSelect.createEl("option", { text: p === 'all' ? 'All packs' : p.toUpperCase(), value: p });
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

        const lucideIcons = (obsidian.getIconIds ? obsidian.getIconIds() : [])
            .filter(id => id.startsWith('lucide-'))
            .map(id => id.replace('lucide-', ''));
        
        const allIcons = Array.from(new Set([...customIds, ...lucideIcons]));

        const renderIcons = (search: string, packFilter: string) => {
            iconGrid.empty();
            let filtered = allIcons;
            
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

            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(id => id.toLowerCase().includes(s));
            }

            filtered.slice(0, 1000).forEach(id => {
                const isSelected = this.currentIconId === id;
                const cell = iconGrid.createDiv({ cls: "cf-icon-cell" });
                cell.setCssStyles({
                    width: "48px", height: "48px", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.1s ease",
                    backgroundColor: isSelected ? "var(--interactive-accent)" : "transparent",
                });
                
                obsidian.setIcon(cell, id);
                const cellSvg = cell.querySelector("svg") as unknown as HTMLElement | null;
                if (cellSvg) {
                    cellSvg.setCssStyles({
                        width: "24px", height: "24px",
                        color: isSelected ? "white" : "var(--text-normal)"
                    });
                }
                
                cell.title = id;
                cell.onclick = async () => {
                    await this.onSelect(id);
                    this.close();
                };
                
                cell.onmouseenter = () => { if (!isSelected) cell.setCssStyles({ backgroundColor: "var(--background-modifier-hover)" }); };
                cell.onmouseleave = () => { if (!isSelected) cell.setCssStyles({ backgroundColor: "transparent" }); };
            });

            if (filtered.length === 0) {
                const emptyMsg = iconGrid.createEl("div", { text: "No icons found", cls: "cf-no-icons" });
                emptyMsg.setCssStyles({
                    padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9em", gridColumn: "1/-1"
                });
            }
        };

        renderIcons("", "all");
        searchInput.oninput = () => renderIcons(searchInput.value, filterSelect.value);
        filterSelect.onchange = () => renderIcons(searchInput.value, filterSelect.value);
        
        // Auto-focus search
        activeWindow.setTimeout(() => searchInput.focus(), 50);
    }

    onClose() {
        this.contentEl.empty();
    }
}
