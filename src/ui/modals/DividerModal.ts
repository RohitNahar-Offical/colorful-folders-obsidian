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

    // eslint-disable-next-line obsidianmd/prefer-active-doc
    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, item: obsidian.TAbstractFile) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.path = item.path;
        
        this.originalStyle = this.plugin.settings.customFolderColors?.[this.path];
        let existingStyle: FolderStyle = {};
        if (typeof this.originalStyle === 'string') {
            existingStyle = { hex: this.originalStyle };
        } else if (this.originalStyle) {
            existingStyle = this.originalStyle;
        }

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
        modalEl.setCssStyles({
            maxWidth: "440px",
            borderRadius: "14px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
        });

        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({
            display: "flex", alignItems: "center", gap: "14px",
            padding: "20px 24px", borderBottom: "1px solid var(--background-modifier-border)",
            marginBottom: "0"
        });

        const iconContainer = header.createDiv();
        iconContainer.setCssStyles({
            width: "42px", height: "42px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: this.config.color, flexShrink: "0", transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        });
        this._headerIconWrap = iconContainer;
        
        this._previewIconEl = iconContainer.createDiv();
        this._refreshHeaderIcon();

        const titleWrap = header.createDiv();
        const mTitle = titleWrap.createEl("div", { text: "Section divider", cls: "cf-modal-title" });
        mTitle.setCssStyles({
            fontSize: "1.2em", fontWeight: "700", color: "var(--text-normal)", lineHeight: "1.2"
        });
        const mSub = titleWrap.createEl("div", { text: `Organizing: ${this.item.name}` });
        mSub.setCssStyles({
            fontSize: "0.8em", color: "var(--text-muted)", marginTop: "2px", opacity: "0.8"
        });

        const body = contentEl.createDiv();
        body.setCssStyles({
            padding: "20px 24px",
            maxHeight: "60vh",
            overflowY: "auto"
        });

        const addSection = (title: string) => {
            const s = body.createDiv();
            const h4 = s.createEl("h4", { text: title });
            h4.setCssStyles({
                fontSize: "0.75em", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "0 0 12px 0", opacity: "0.6"
            });
            const c = s.createDiv();
            c.setCssStyles({
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "24px"
            });
            return c;
        };

        const textSect = addSection("Label & appearance");
        
        new obsidian.Setting(textSect)
            .setName("Label text")
            .setDesc("The display name for this section.")
            .addText(text => text
                .setPlaceholder("E.g. Assets")
                .setValue(this.config.name)
                .onChange(v => {
                    this.config.name = v;
                    this._liveSync();
                }));

        new obsidian.Setting(textSect)
            .setName("Custom color")
            .setDesc("Pick a color for the label and line.")
            .addText(text => {
                text.setValue(this.config.color);
                const input = text.inputEl;
                input.type = "color";
                input.setCssStyles({
                    width: "40px",
                    height: "30px",
                    padding: "0"
                });
                input.onchange = () => {
                    this.config.color = text.getValue();
                    this._headerIconWrap.setCssStyles({ backgroundColor: this.config.color });
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

        const designSect = addSection("Design & effects");

        new obsidian.Setting(designSect)
            .setName("Divider icon")
            .setDesc("ID from lucide (e.g. Briefcase) or any emoji.")
            .addText(text => {
                text.setPlaceholder("E.g. Briefcase")
                    .setValue(this.config.icon)
                    .onChange(v => {
                        this.config.icon = v;
                        this._refreshHeaderIcon();
                        this._liveSync();
                    });
                
                const browseBtn = text.inputEl.parentElement?.createDiv({ cls: "cf-icon-browse-btn" });
                if (browseBtn) {
                    browseBtn.setCssStyles({
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", cursor: "pointer", opacity: "0.6", transition: "opacity 0.2s", marginLeft: "4px"
                    });
                    obsidian.setIcon(browseBtn, "search");
                    const bsvg = browseBtn.querySelector("svg") as unknown as HTMLElement | null;
                    if (bsvg) { bsvg.setCssStyles({ width: "18px", height: "18px" }); }
                    browseBtn.onmouseenter = () => browseBtn.setCssStyles({ opacity: "1" });
                    browseBtn.onmouseleave = () => browseBtn.setCssStyles({ opacity: "0.6" });
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
            .setName("Line style")
            .addDropdown(d => d
                .addOption("global", "Global default")
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
            .setName("Modern glassmorphism")
            .setDesc("Use a frosted-glass background for the pill.")
            .addToggle(t => t
                .setValue(this.config.useGlass)
                .onChange(v => {
                    this.config.useGlass = v;
                    this._liveSync();
                }));

        const footer = contentEl.createDiv({ cls: "cf-modal-footer" });
        footer.setCssStyles({
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderTop: "1px solid var(--background-modifier-border)",
            background: "var(--background-secondary-alt)", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px"
        });

        const leftGroup = footer.createDiv();
        const removeBtn = leftGroup.createEl("button", { text: "Remove divider" });
        removeBtn.setCssStyles({
            color: "var(--text-error)", background: "transparent", border: "1px solid var(--background-modifier-border)",
            padding: "6px 14px", borderRadius: "6px", fontSize: "0.85em", cursor: "pointer", transition: "all 0.2s ease"
        });
        removeBtn.onmouseenter = () => removeBtn.setCssStyles({ backgroundColor: "rgba(var(--text-error-rgb), 0.05)" });
        removeBtn.onmouseleave = () => removeBtn.setCssStyles({ backgroundColor: "transparent" });
        removeBtn.onclick = async () => {
            this.isSaved = true; // Mark as saved so onClose doesn't revert
            const style = this.plugin.settings.customFolderColors[this.path];
            let styleObj: FolderStyle = {};
            if (typeof style === 'string') styleObj = { hex: style };
            else if (style) styleObj = style;

            styleObj.hasDivider = false;
            delete styleObj.dividerText;
            delete styleObj.dividerColor;
            delete styleObj.dividerIcon;
            delete styleObj.dividerAlignment;
            delete styleObj.dividerLineStyle;
            delete styleObj.dividerUpper;
            delete styleObj.dividerGlass;

            this.plugin.settings.customFolderColors[this.path] = styleObj;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };

        const rightGroup = footer.createDiv();
        rightGroup.setCssStyles({ display: "flex", gap: "10px" });

        const cancelBtn = rightGroup.createEl("button", { text: "Cancel" });
        cancelBtn.setCssStyles({ padding: "6px 16px" });
        cancelBtn.onclick = () => this.close();

        const saveBtn = rightGroup.createEl("button", { text: "Add / update", cls: "mod-cta" });
        saveBtn.setCssStyles({ padding: "6px 20px" });
        saveBtn.onclick = async () => {
            this.isSaved = true;
            const style = this.plugin.settings.customFolderColors[this.path];
            let styleObj: FolderStyle = {};
            if (typeof style === 'string') styleObj = { hex: style };
            else if (style) styleObj = style;

            styleObj.dividerText = this.config.name;
            styleObj.dividerColor = this.config.color;
            styleObj.dividerAlignment = this.config.alignment;
            styleObj.dividerLineStyle = this.config.lineStyle;
            styleObj.dividerUpper = this.config.isUpper;
            styleObj.dividerGlass = this.config.useGlass;
            styleObj.dividerIcon = this.config.icon;
            styleObj.hasDivider = true;

            this.plugin.settings.customFolderColors[this.path] = styleObj;
            await this.plugin.saveSettings();
            this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };
    }

    _liveSync() {
        const style = this.plugin.getStyle(this.path) || {};
        const tempStyle: FolderStyle = {
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
        const svg = this._previewIconEl.querySelector("svg") as unknown as HTMLElement | null;
        if (svg) {
            svg.setCssStyles({ width: "20px", height: "20px", color: "white" });
        } else {
            this._previewIconEl.setText(this.config.icon);
            this._previewIconEl.setCssStyles({ fontSize: "1.2em" });
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
