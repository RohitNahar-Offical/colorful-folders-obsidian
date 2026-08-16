import { StyleResolver } from '../../core/StyleResolver';
import * as obsidian from 'obsidian';
import { t } from '../../lang/helpers';
import { DividerManager } from '../../core/DividerManager';
import { FolderStyle, IColorfulFoldersPlugin } from '../../common/types';
import { IconPickerModal } from './IconPickerModal';
import { HoverMessageModal } from './HoverMessageModal';
import { createVisualColorPicker } from '../components/ColorPicker';
import { parseColorToHexAlpha, hexAlphaToRgba, normalizeVaultPath } from '../../common/utils';

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
        iconPosition: 'left' | 'right' | 'both';
        pillMode: 'on' | 'off';
        pillColor: string;
        description: string;
        paddingLeft: number;
        paddingRight: number;
    };
    originalStyle: FolderStyle | string | undefined;
    isSaved = false;
    _headerIconWrap!: HTMLElement;
    _previewIconEl!: HTMLElement;
    private _liveSyncTimeout: number | null = null;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, item: obsidian.TAbstractFile) {
        super(app);
        this.plugin = plugin;
        this.item = item;
        this.path = normalizeVaultPath(item.path);
        
        this.originalStyle = this.plugin.settings.customFolderColors?.[this.path];
        let existingStyle: FolderStyle = {};
        if (typeof this.originalStyle === 'string') {
            existingStyle = { hex: this.originalStyle };
        } else if (this.originalStyle) {
            existingStyle = this.originalStyle;
        }

        const eff = StyleResolver.getEffectiveStyle(item, this.plugin);
        const defaultColor = eff.hex;
        const defaultIcon = existingStyle.icon || eff.icon || eff.iconId || "";
        
        this.config = {
            name: existingStyle.dividerText || item.name,
            color: existingStyle.dividerColor || defaultColor,
            alignment: existingStyle.dividerAlignment || "center",
            lineStyle: existingStyle.dividerLineStyle || "global",
            icon: existingStyle.dividerIcon !== undefined ? existingStyle.dividerIcon : defaultIcon,
            isUpper: existingStyle.dividerUpper !== undefined ? existingStyle.dividerUpper : true,
            useGlass: existingStyle.dividerGlass !== undefined ? existingStyle.dividerGlass : true,
            iconPosition: existingStyle.dividerIconPosition || "left",
            pillMode: existingStyle.dividerPillMode === 'off' ? 'off' : 'on',
            pillColor: existingStyle.dividerPillColor || "",
            description: existingStyle.dividerDescription || "",
            paddingLeft: existingStyle.dividerLinePaddingLeft ?? this.plugin.settings.dividerLinePaddingLeft ?? 8,
            paddingRight: existingStyle.dividerLinePaddingRight ?? this.plugin.settings.dividerLinePaddingRight ?? 8
        };
    }

    onOpen() {
        DividerManager.closeActivePopover();
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.setCssStyles({
            maxWidth: "440px",
            width: "min(440px, 92vw)",
            maxHeight: "88vh",
            overflowY: "auto",
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
        const mTitle = titleWrap.createDiv({ text: t("modal.divider.subtitle"), cls: "cf-modal-title" });
        mTitle.setCssStyles({
            fontSize: "1.2em", fontWeight: "700", color: "var(--text-normal)", lineHeight: "1.2"
        });
        const mSub = titleWrap.createDiv({ text: t("modal.divider.organizing", { name: this.item.name }) });
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

        const textSect = addSection(t("section.label_and_appearance"));
        
        new obsidian.Setting(textSect)
            .setName(t("modal.divider.text_label"))
            .setDesc(t("modal.divider.text_label.desc"))
            .addText(text => text
                .setPlaceholder(t("modal.divider.text_placeholder"))
                .setValue(this.config.name)
                .onChange(v => {
                    this.config.name = v;
                    this._liveSync();
                }));

        const colorSect = addSection(t("section.divider_color"));
        const cpCont = colorSect.createDiv();
        cpCont.setCssStyles({ marginTop: "8px" });
        createVisualColorPicker(cpCont, this.config.color, (hex) => {
            this.config.color = hex;
            this._headerIconWrap.setCssStyles({ backgroundColor: hex });
            this._refreshHeaderIcon();
            this._liveSync();
        }, { showAlpha: false, skipInitialChange: true });

        new obsidian.Setting(textSect)
            .setName(t("modal.divider.alignment"))
            .addDropdown(d => d
                .addOption("left", t("settings.option.left"))
                .addOption("center", t("settings.option.center"))
                .addOption("right", t("settings.option.right"))
                .setValue(this.config.alignment)
                .onChange(v => {
                    this.config.alignment = v;
                    this._liveSync();
                }));

        new obsidian.Setting(textSect)
            .setName(t("modal.divider.uppercase"))
            .addToggle(tComp => tComp
                .setValue(this.config.isUpper)
                .onChange(v => {
                    this.config.isUpper = v;
                    this._liveSync();
                }));

        const iconSect = addSection(t("section.icon_settings"));

        new obsidian.Setting(iconSect)
            .setName(t("modal.divider.divider_icon"))
            .setDesc(t("modal.divider.divider_icon.desc"))
            .addButton(btn => {
                const updateBtnVisuals = (selectedId: string) => {
                    btn.buttonEl.empty();
                    if (!selectedId) {
                        obsidian.setIcon(btn.buttonEl, "image-plus");
                        return;
                    }
                    if (this.plugin.iconManager.isEmojiIcon(selectedId)) {
                        btn.buttonEl.setText(selectedId);
                        btn.buttonEl.setCssStyles({ fontSize: "1.2em" });
                        return;
                    }
                    const customSvg = this.plugin.iconManager.getIconSvg(selectedId, false);
                    if (customSvg) {
                        try {
                            // eslint-disable-next-line no-unsanitized/method -- Contextual fragment is safe here as svg content comes from curated internal asset maps or local files
                            const frag = activeDocument.createRange().createContextualFragment(customSvg);
                            const svgEl = frag.querySelector("svg");
                            if (svgEl) {
                                (svgEl as unknown as HTMLElement).setCssStyles({ width: "16px", height: "16px" });
                                btn.buttonEl.appendChild(svgEl);
                                return;
                            }
                        } catch {
                            // fallback
                        }
                    }
                    try {
                        obsidian.setIcon(btn.buttonEl, selectedId);
                    } catch {
                        obsidian.setIcon(btn.buttonEl, "image-plus");
                    }
                };

                updateBtnVisuals(this.config.icon);
                btn.setTooltip(t("modal.divider.pick_icon"))
                    .onClick(() => {
                        new IconPickerModal(this.app, this.plugin, this.config.icon, (selectedId: string) => {
                            this.config.icon = selectedId;
                            updateBtnVisuals(selectedId);
                            this._refreshHeaderIcon();
                            this._liveSync();
                        }).open();
                    });
            })
            .addExtraButton(btn => {
                btn.setIcon("x")
                    .setTooltip(t("modal.divider.clear_icon"))
                    .onClick(() => {
                        this.config.icon = "";
                        this._refreshHeaderIcon();
                        this._liveSync();
                        this.onOpen();
                    });
            });

        new obsidian.Setting(iconSect)
            .setName(t("modal.divider.icon_position"))
            .addDropdown(d => d
                .addOption("left", t("settings.option.left"))
                .addOption("right", t("settings.option.right"))
                .addOption("both", t("settings.option.both_sides"))
                .setValue(this.config.iconPosition)
                .onChange(v => {
                    this.config.iconPosition = v as 'left' | 'right' | 'both';
                    this._liveSync();
                }));

        const styleSect = addSection(t("section.style_and_shape"));

        new obsidian.Setting(styleSect)
            .setName(t("modal.divider.pill_mode"))
            .setDesc(t("modal.divider.pill_mode.desc"))
            .addDropdown(d => d
                .addOption("on", t("common.on"))
                .addOption("off", t("common.off"))
                .setValue(this.config.pillMode)
                .onChange(v => {
                    this.config.pillMode = v as 'on' | 'off';
                    this.onOpen();
                    this._liveSync();
                }));

        if (this.config.pillMode === 'on') {
            const pRow = styleSect.createDiv();
            let pPickerWrap: HTMLElement | null = null;
            let pColorBox: HTMLElement;
            let pTextComp: obsidian.TextComponent;

            new obsidian.Setting(pRow)
                .setName(t("modal.divider.pill_bg_color"))
                .setDesc(t("modal.divider.pill_bg_color.desc"))
                .addButton(btn => {
                    btn.setIcon('palette')
                        .setTooltip(t("common.open_visual_color_picker"))
                        .onClick(() => {
                            if (pPickerWrap) {
                                pPickerWrap.remove();
                                pPickerWrap = null;
                                return;
                            }
                            pPickerWrap = pRow.createDiv();
                            pPickerWrap.setCssStyles({ 
                                marginTop: '12px', padding: '16px', background: 'var(--background-secondary)', 
                                borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
                            });
                            
                            const current = parseColorToHexAlpha(this.config.pillColor);
                            createVisualColorPicker(pPickerWrap, current.hex, (hex, alpha) => {
                                const rgba = hexAlphaToRgba(hex, alpha);
                                this.config.pillColor = rgba;
                                pTextComp.setValue(rgba);
                                pColorBox.setCssStyles({ backgroundColor: rgba });
                                this._liveSync();
                            }, { showAlpha: true, initialAlpha: current.alpha, skipInitialChange: true });
                        });
                })
                .addText(text => {
                    pTextComp = text;
                    text.setPlaceholder(t("modal.divider.inherit_folder_color"))
                        .setValue(this.config.pillColor || "")
                        .onChange(v => {
                            this.config.pillColor = v;
                            this._liveSync();
                            pColorBox.setCssStyles({ backgroundColor: v || 'transparent' });
                        });
                    
                    pColorBox = text.inputEl.parentElement.createDiv();
                    pColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', backgroundColor: this.config.pillColor || 'transparent',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    });
                });
        }

        new obsidian.Setting(styleSect)
            .setName(t("modal.divider.line_style"))
            .addDropdown(d => d
                .addOption("global", t("modal.divider.line_style_global"))
                .addOption("solid", t("settings.option.solid"))
                .addOption("dashed", t("settings.option.dashed"))
                .addOption("dotted", t("settings.option.dotted"))
                .addOption("double", "Double")
                .addOption("groove", "Groove")
                .addOption("none", t("settings.option.none"))
                .setValue(this.config.lineStyle)
                .onChange(v => {
                    this.config.lineStyle = v;
                    this._liveSync();
                }));

        new obsidian.Setting(styleSect)
            .setName(t("modal.divider.glassmorphism"))
            .setDesc(t("modal.divider.glassmorphism.desc"))
            .addToggle(tComp => tComp
                .setValue(this.config.useGlass)
                .onChange(v => {
                    this.config.useGlass = v;
                    this._liveSync();
                }));

        new obsidian.Setting(styleSect)
            .setName(t("modal.divider.line_gap_left"))
            .addSlider(s => s
                .setLimits(-10, 40, 1)
                .setValue(this.config.paddingLeft)
                
                .onChange(v => {
                    this.config.paddingLeft = v;
                    this._liveSync();
                }));

        new obsidian.Setting(styleSect)
            .setName(t("modal.divider.line_gap_right"))
            .addSlider(s => s
                .setLimits(-10, 40, 1)
                .setValue(this.config.paddingRight)
                
                .onChange(v => {
                    this.config.paddingRight = v;
                    this._liveSync();
                }));

        const interactiveSect = addSection(t("section.interactive_features"));

        new obsidian.Setting(interactiveSect)
            .setName(t("modal.divider.hover_message"))
            .setDesc(t("modal.divider.hover_message.desc"))
            .addButton(btn => btn
                .setButtonText(this.config.description ? t("modal.divider.edit_message") : t("modal.divider.add_message"))
                .setCta()
                .onClick(() => {
                    new HoverMessageModal(this.app, this.plugin, this.path, this.config.description, (newVal) => {
                        this.config.description = newVal;
                        btn.setButtonText(newVal ? t("modal.divider.edit_message") : t("modal.divider.add_message"));
                        this._liveSync();
                    }).open();
                }));

        const footer = contentEl.createDiv({ cls: "cf-modal-footer" });
        footer.setCssStyles({
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderTop: "1px solid var(--background-modifier-border)",
            background: "var(--background-secondary-alt)", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px"
        });

        const leftGroup = footer.createDiv();
        const removeBtn = leftGroup.createEl("button", { text: t("modal.divider.remove_divider") });
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
            delete styleObj.dividerIconColor;
            delete styleObj.dividerAlignment;
            delete styleObj.dividerLineStyle;
            delete styleObj.dividerUpper;
            delete styleObj.dividerGlass;
            delete styleObj.dividerIconPosition;
            delete styleObj.dividerPillMode;
            delete styleObj.dividerDescription;

            this.plugin.settings.customFolderColors[this.path] = styleObj;
            await this.plugin.saveSettings();
            void this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };

        const rightGroup = footer.createDiv();
        rightGroup.setCssStyles({ display: "flex", gap: "10px" });

        const cancelBtn = rightGroup.createEl("button", { text: t("common.cancel") });
        cancelBtn.setCssStyles({ padding: "6px 16px" });
        cancelBtn.onclick = () => this.close();

        const saveBtn = rightGroup.createEl("button", { text: t("modal.divider.save"), cls: "mod-cta" });
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
            delete styleObj.dividerIconColor;
            styleObj.dividerIconPosition = this.config.iconPosition;
            styleObj.dividerPillMode = this.config.pillMode;
            styleObj.dividerPillColor = this.config.pillColor;
            styleObj.dividerDescription = this.config.description;
            styleObj.dividerLinePaddingLeft = this.config.paddingLeft;
            styleObj.dividerLinePaddingRight = this.config.paddingRight;
            styleObj.hasDivider = true;

            this.plugin.settings.customFolderColors[this.path] = styleObj;
            await this.plugin.saveSettings();
            void this.plugin.generateStyles();
            this.plugin.dividerManager.syncDividers();
            this.close();
        };
    }

    _liveSync() {
        if (this._liveSyncTimeout) window.clearTimeout(this._liveSyncTimeout);
        this._liveSyncTimeout = window.setTimeout(() => {
            const style = StyleResolver.getStyle(this.plugin, this.path) || {};
            const tempStyle: FolderStyle = {
                ...style,
                dividerText: this.config.name,
                dividerColor: this.config.color,
                dividerAlignment: this.config.alignment,
                dividerLineStyle: this.config.lineStyle,
                dividerUpper: this.config.isUpper,
                dividerGlass: this.config.useGlass,
                dividerIcon: this.config.icon,
                dividerIconPosition: this.config.iconPosition,
                dividerPillMode: this.config.pillMode,
                dividerPillColor: this.config.pillColor,
                dividerDescription: this.config.description,
                dividerLinePaddingLeft: this.config.paddingLeft,
                dividerLinePaddingRight: this.config.paddingRight,
                hasDivider: true
            };
            delete tempStyle.dividerIconColor;
            this.plugin.settings.customFolderColors[this.path] = tempStyle;
            this.plugin.dividerManager.syncDividers();
        }, 50);
    }

    _refreshHeaderIcon() {
        if (!this._previewIconEl) return;
        this._previewIconEl.empty();
        const iconId = this.config.icon || "separator-horizontal";
        if (this.plugin.iconManager.isEmojiIcon(iconId)) {
            this._previewIconEl.setText(iconId);
            this._previewIconEl.setCssStyles({ fontSize: "1.2em" });
            return;
        }
        const customSvg = this.plugin.iconManager.getIconSvg(iconId, false);
        if (customSvg) {
            try {
                // eslint-disable-next-line no-unsanitized/method -- Contextual fragment is safe here as svg content comes from curated internal asset maps or local files
                const frag = activeDocument.createRange().createContextualFragment(customSvg);
                const svgEl = frag.querySelector("svg");
                if (svgEl) {
                    svgEl.removeAttribute("width");
                    svgEl.removeAttribute("height");
                    (svgEl as unknown as HTMLElement).setCssStyles({ width: "20px", height: "20px", color: this.config.color });
                    this._previewIconEl.appendChild(svgEl);
                    return;
                }
            } catch {
                // fallback
            }
        }
        try {
            obsidian.setIcon(this._previewIconEl, iconId);
            const svg = this._previewIconEl.querySelector("svg") as unknown as HTMLElement | null;
            if (svg) {
                svg.setCssStyles({ width: "20px", height: "20px", color: this.config.color });
            } else {
                this._previewIconEl.setText(iconId.slice(0, 3));
                this._previewIconEl.setCssStyles({ fontSize: "1.2em" });
            }
        } catch {
            obsidian.setIcon(this._previewIconEl, "separator-horizontal");
        }
    }

    onClose() {
        if (this._liveSyncTimeout) {
            window.clearTimeout(this._liveSyncTimeout);
            this._liveSyncTimeout = null;
        }
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
