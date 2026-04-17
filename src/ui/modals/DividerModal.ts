import * as obsidian from 'obsidian';
import { FolderStyle, IColorfulFoldersPlugin } from '../../common/types';
import { IconPickerModal } from './IconPickerModal';

export class DividerModal extends obsidian.Modal {
    plugin: IColorfulFoldersPlugin;
    item: obsidian.TAbstractFile;
    path: string;
    config: {
        name: string;
        color: string;
        alignment: string;
        lineStyle: string;
        icon: string;
        isUpper: boolean;
        useGlass: boolean;
    };
    originalStyle: FolderStyle | string | undefined;
    isSaved = false;
    _headerIconWrap!: HTMLElement;
    _previewIconEl!: HTMLElement;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, item: obsidian.TAbstractFile) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.path = item.path;
        
        this.originalStyle = this.plugin.settings.customFolderColors?.[this.path];
        const existingStyle = (this.originalStyle as FolderStyle) || {};
        const folderStyle = this.plugin.getStyle(this.path);
        const defaultColor = folderStyle?.hex || "var(--interactive-accent)";
        
        this.config = {
            name: existingStyle.dividerText || item.name,
            color: existingStyle.dividerColor || defaultColor,
            alignment: existingStyle.dividerAlignment || "center",
            lineStyle: existingStyle.dividerLineStyle || "global",
            icon: existingStyle.dividerIcon || "",
            isUpper: existingStyle.dividerUpper !== undefined ? existingStyle.dividerUpper : true,
            useGlass: existingStyle.dividerGlass !== undefined ? existingStyle.dividerGlass : true
        };
    }

    onOpen() {
        // ... (rest of onOpen header remains the same until settings start)
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.style.maxWidth = "440px";
        modalEl.style.borderRadius = "14px";
        modalEl.style.boxShadow = "0 10px 40px rgba(0,0,0,0.3)";

        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        Object.assign(header.style, {
            display: "flex", alignItems: "center", gap: "14px",
            padding: "20px 24px", borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "0"
        });

        const iconContainer = header.createDiv();
        Object.assign(iconContainer.style, {
            width: "42px", height: "42px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: this.config.color, flexShrink: "0", transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        });
        this._headerIconWrap = iconContainer;
        
        this._previewIconEl = iconContainer.createDiv();
        this._refreshHeaderIcon();

        const titleWrap = header.createDiv();
        titleWrap.createEl("div", { text: "Section Divider", cls: "cf-modal-title" }).style.cssText =
            "font-size:1.2em;font-weight:700;color:var(--text-normal);line-height:1.2";
        titleWrap.createEl("div", { text: `Organizing: ${this.item.name}` }).style.cssText =
            "font-size:0.8em;color:var(--text-muted);margin-top:2px;opacity:0.8";

        const body = contentEl.createDiv();
        body.style.padding = "20px 24px";
        body.style.maxHeight = "60vh";
        body.style.overflowY = "auto";

        const addSection = (title: string) => {
            const s = body.createDiv();
            s.createEl("h4", { text: title }).style.cssText = "font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin: 0 0 12px 0; opacity: 0.6;";
            const c = s.createDiv();
            c.style.display = "flex";
            c.style.flexDirection = "column";
            c.style.gap = "8px";
            c.style.marginBottom = "24px";
            return c;
        };

        const textSect = addSection("Label & Appearance");
        
        new obsidian.Setting(textSect)
            .setName("Label Text")
            .setDesc("The display name for this section.")
            .addText(text => text
                .setPlaceholder("e.g. ASSETS")
                .setValue(this.config.name)
                .onChange(v => {
                    this.config.name = v;
                    this._liveSync();
                }));

        new obsidian.Setting(textSect)
            .setName("Custom Color")
            .setDesc("Pick a color for the label and line.")
            .addText(text => {
                text.setValue(this.config.color);
                const input = text.inputEl;
                input.type = "color";
                input.style.width = "40px";
                input.style.height = "30px";
                input.style.padding = "0";
                input.onchange = () => {
                    this.config.color = text.getValue();
                    this._headerIconWrap.style.backgroundColor = this.config.color;
                    this._refreshHeaderIcon();
                    this._liveSync();
                };
            });

        new obsidian.Setting(textSect)
            .setName("Alignment")
            .addDropdown(d => d
                .addOption("left", "Left")
                .addOption("center", "Center")
                .addOption("right", "Right")
                .setValue(this.config.alignment)
                .onChange(v => {
                    this.config.alignment = v;
                    this._liveSync();
                }));

        new obsidian.Setting(textSect)
            .setName("Uppercase")
            .addToggle(t => t
                .setValue(this.config.isUpper)
                .onChange(v => {
                    this.config.isUpper = v;
                    this._liveSync();
                }));

        const designSect = addSection("Design & Effects");

        new obsidian.Setting(designSect)
            .setName("Divider Icon")
            .setDesc("ID from Lucide (e.g. briefcase) or any emoji.")
            .addText(text => {
                text.setPlaceholder("e.g. briefcase")
                    .setValue(this.config.icon)
                    .onChange(v => {
                        this.config.icon = v;
                        this._refreshHeaderIcon();
                        this._liveSync();
                    });
                
                const browseBtn = text.inputEl.parentElement?.createDiv({ cls: "cf-icon-browse-btn" });
                if (browseBtn) {
                    browseBtn.style.cssText = "display:flex;align-items:center;justify-content:center;padding:6px;cursor:pointer;opacity:0.6;transition:opacity 0.2s;margin-left:4px";
                    obsidian.setIcon(browseBtn, "search");
                    const bsvg = browseBtn.querySelector("svg");
                    if (bsvg) { bsvg.style.width = "18px"; bsvg.style.height = "18px"; }
                    browseBtn.onmouseenter = () => browseBtn.style.opacity = "1";
                    browseBtn.onmouseleave = () => browseBtn.style.opacity = "0.6";
                    browseBtn.onclick = () => {
                        new IconPickerModal(this.app, this.plugin, this.config.icon, (selectedId: string) => {
                            this.config.icon = selectedId;
                            text.setValue(selectedId);
                            this._refreshHeaderIcon();
                            this._liveSync();
                        }).open();
                    };
                }
            });

        new obsidian.Setting(designSect)
            .setName("Line Style")
            .addDropdown(d => d
                .addOption("global", "Global Default")
                .addOption("solid", "Solid")
                .addOption("dashed", "Dashed")
                .addOption("dotted", "Dotted")
                .addOption("none", "None")
                .setValue(this.config.lineStyle)
                .onChange(v => {
                    this.config.lineStyle = v;
                    this._liveSync();
                }));

        new obsidian.Setting(designSect)
            .setName("Modern Glassmorphism")
            .setDesc("Use a frosted-glass background for the pill.")
            .addToggle(t => t
                .setValue(this.config.useGlass)
                .onChange(v => {
                    this.config.useGlass = v;
                    this._liveSync();
                }));

        const footer = contentEl.createDiv({ cls: "cf-modal-footer" });
        Object.assign(footer.style, {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderTop: "1px solid var(--background-modifier-border)",
            background: "var(--background-secondary-alt)", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px"
        });

        const leftGroup = footer.createDiv();
        const removeBtn = leftGroup.createEl("button", { text: "Remove Divider" });
        Object.assign(removeBtn.style, {
            color: "var(--text-error)", background: "transparent", border: "1px solid var(--background-modifier-border)",
            padding: "6px 14px", borderRadius: "6px", fontSize: "0.85em", cursor: "pointer", transition: "all 0.2s ease"
        });
        removeBtn.onmouseenter = () => removeBtn.style.backgroundColor = "rgba(var(--text-error-rgb), 0.05)";
        removeBtn.onmouseleave = () => removeBtn.style.backgroundColor = "transparent";
        removeBtn.onclick = async () => {
            this.isSaved = true; // Mark as saved so onClose doesn't revert
            const style = (this.plugin.settings.customFolderColors[this.path] as FolderStyle) || {};
            (style as any).hasDivider = false;
            delete (style as any).dividerText;
            delete (style as any).dividerColor;
            delete (style as any).dividerIcon;
            delete (style as any).dividerAlignment;
            delete (style as any).dividerLineStyle;
            delete (style as any).dividerUpper;
            delete (style as any).dividerGlass;

            await this.plugin.saveSettings();
            await this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };

        const rightGroup = footer.createDiv();
        rightGroup.style.display = "flex";
        rightGroup.style.gap = "10px";

        const cancelBtn = rightGroup.createEl("button", { text: "Cancel" });
        cancelBtn.style.padding = "6px 16px";
        cancelBtn.onclick = () => this.close();

        const saveBtn = rightGroup.createEl("button", { text: "Add / Update", cls: "mod-cta" });
        saveBtn.style.padding = "6px 20px";
        saveBtn.onclick = async () => {
            this.isSaved = true;
            const style = (this.plugin.settings.customFolderColors[this.path] as FolderStyle) || {};
            style.dividerText = this.config.name;
            style.dividerColor = this.config.color;
            style.dividerAlignment = this.config.alignment;
            style.dividerLineStyle = this.config.lineStyle;
            style.dividerUpper = this.config.isUpper;
            style.dividerGlass = this.config.useGlass;
            style.dividerIcon = this.config.icon;
            (style as any).hasDivider = true;

            this.plugin.settings.customFolderColors[this.path] = style;
            await this.plugin.saveSettings();
            await this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };
    }

    _liveSync() {
        const style = (this.plugin.getStyle(this.path) || {}) as FolderStyle;
        const tempStyle = {
            ...style,
            dividerText: this.config.name,
            dividerColor: this.config.color,
            dividerAlignment: this.config.alignment,
            dividerLineStyle: this.config.lineStyle,
            dividerUpper: this.config.isUpper,
            dividerGlass: this.config.useGlass,
            dividerIcon: this.config.icon,
            hasDivider: true
        };
        this.plugin.settings.customFolderColors[this.path] = tempStyle;
        this.plugin.dividerManager.syncDividers();
    }

    _refreshHeaderIcon() {
        if (!this._previewIconEl) return;
        this._previewIconEl.empty();
        const iconId = this.config.icon || "separator-horizontal";
        obsidian.setIcon(this._previewIconEl, iconId);
        const svg = this._previewIconEl.querySelector("svg");
        if (svg) {
            Object.assign(svg.style, { width: "20px", height: "20px", color: "white" });
        } else {
            this._previewIconEl.setText(this.config.icon);
            this._previewIconEl.style.fontSize = "1.2em";
        }
    }

    onClose() {
        if (!this.isSaved) {
            // Revert to original state if closed without saving
            if (this.originalStyle) {
                this.plugin.settings.customFolderColors[this.path] = this.originalStyle;
            } else {
                delete this.plugin.settings.customFolderColors[this.path];
            }
            this.plugin.dividerManager.syncDividers();
        }
        this.contentEl.empty();
    }
}
