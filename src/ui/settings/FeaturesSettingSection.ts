import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { DEFAULT_SETTINGS } from '../../common/constants';
import { createVisualColorPicker } from '../components/ColorPicker';

export class FeaturesSettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        // ➖ Dividers & Sections Card (Card 1)
        const divCard = this.settingTab.makeCard(containerEl, "➖", "Dividers and sections");

        const divGuide = divCard.createDiv();
        divGuide.setCssStyles({
            marginBottom: '20px',
            background: 'var(--background-secondary-alt)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '4px solid var(--interactive-accent)',
            lineHeight: '1.4'
        });
        const divGuideTitle = divGuide.createDiv({ text: t("settings.quick_guide.title") });
        divGuideTitle.setCssStyles({ fontWeight: '700', fontSize: '0.95em', marginBottom: '4px' });
        const divGuideText = divGuide.createEl('p', {
            text: 'Right-click any folder or file in the sidebar explorer and select "add divider" to insert a section separator below it. You can also run the command "add/edit divider for current file" from the command palette.'
        });
        divGuideText.setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', margin: '0' });

        // Live Divider Preview
        const previewWrap = divCard.createDiv({ cls: 'cf-divider-preview-wrap' });
        previewWrap.setCssStyles({
            padding: '40px 24px',
            background: 'var(--background-secondary-alt)',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid var(--background-modifier-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px',
            position: 'relative',
            overflow: 'hidden'
        });

        previewWrap.createEl('small', { text: 'Live preview', cls: 'cf-preview-label' }).setCssStyles({
            position: 'absolute', top: '8px', left: '12px', opacity: '0.4', fontSize: '0.7em', letterSpacing: '0.1em', fontWeight: '700'
        });

        const dividerContainer = previewWrap.createDiv();
        dividerContainer.setCssStyles({ width: '100%' });

        const updatePreview = () => {
            dividerContainer.empty();

            const settings = this.plugin.settings;
            const isPill = settings.dividerPillMode !== false;
            const pillBgColor = settings.dividerPillColor;
            const spacing = Math.min(30, Math.max(5, settings.dividerSpacing ?? 15));
            const thickness = settings.dividerThickness ?? 1.5;
            const gapLeft = settings.dividerLinePaddingLeft ?? 8;
            const gapRight = settings.dividerLinePaddingRight ?? 8;
            const lineStyle = settings.dividerLineStyle || "solid";

            const bridge = dividerContainer.createDiv({ cls: "cf-divider-preview-bridge" });
            bridge.setCssProps({
                "--preview-spacing": `${spacing}px`
            });

            const leftLine = bridge.createDiv({ cls: "cf-divider-preview-line cf-divider-preview-line-left" });
            leftLine.setCssProps({
                "--preview-line-thickness": `${thickness}px`,
                "--preview-line-style": lineStyle,
                "--preview-gap-left": `${gapLeft}px`
            });

            const chipCls = isPill
                ? "cf-divider-preview-chip cf-divider-preview-chip-pill"
                : "cf-divider-preview-chip cf-divider-preview-chip-text";
            const chip = bridge.createDiv({ cls: chipCls });
            if (isPill && pillBgColor && pillBgColor.trim()) {
                chip.setCssProps({
                    "--preview-pill-bg": pillBgColor.trim()
                });
            }
            chip.setText("Section preview");

            const rightLine = bridge.createDiv({ cls: "cf-divider-preview-line cf-divider-preview-line-right" });
            rightLine.setCssProps({
                "--preview-line-thickness": `${thickness}px`,
                "--preview-line-style": lineStyle,
                "--preview-gap-right": `${gapRight}px`
            });
        };
        updatePreview();

        new obsidian.Setting(divCard)
            .setName(t("settings.divider_modern_pill"))
            .setDesc(t("settings.divider_modern_pill.desc"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.dividerPillMode !== false)
                .onChange(async (value) => {
                    this.plugin.settings.dividerPillMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                    updatePreview();
                }));

        const pillColorRow = divCard.createDiv();
        let pickerWrap: HTMLElement | null = null;
        let colorBox: HTMLElement;
        let textComp: obsidian.TextComponent;

        new obsidian.Setting(pillColorRow)
            .setName(t("settings.divider_pill_bg.name"))
            .setDesc(t("settings.divider_pill_bg.desc"))
            .addButton(btn => {
                btn.setIcon('palette')
                    .setTooltip(t("common.open_visual_color_picker"))
                    .onClick(() => {
                        if (pickerWrap) {
                            pickerWrap.remove();
                            pickerWrap = null;
                            return;
                        }
                        pickerWrap = pillColorRow.createDiv();
                        pickerWrap.setCssStyles({
                            marginTop: '12px', padding: '16px', background: 'var(--background-secondary-alt)',
                            borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
                        });
                        createVisualColorPicker(pickerWrap, this.plugin.settings.dividerPillColor || "#5ebd8e", (color) => {
                            this.plugin.settings.dividerPillColor = color;
                            textComp.setValue(color);
                            colorBox.setCssStyles({ backgroundColor: color });
                            void this.plugin.saveSettings().then(() => {
                                this.plugin.generateStylesDebounced();
                                updatePreview();
                            });
                        });
                    });
            })
            .addText(text => {
                textComp = text;
                text.setValue(this.plugin.settings.dividerPillColor || "")
                    .setPlaceholder(t("settings.rgba_example_placeholder"))
                    .onChange(async (value) => {
                        this.plugin.settings.dividerPillColor = value;
                        colorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        updatePreview();
                    });
            })
            .addExtraButton(btn => {
                btn.setIcon('reset')
                    .setTooltip('Reset color')
                    .onClick(async () => {
                        this.plugin.settings.dividerPillColor = "";
                        textComp.setValue("");
                        colorBox.setCssStyles({ backgroundColor: 'transparent' });
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        updatePreview();
                    });
            });

        const colorBoxContainer = pillColorRow.createDiv();
        colorBoxContainer.setCssStyles({ display: 'inline-flex', alignItems: 'center', marginLeft: '10px' });
        colorBox = colorBoxContainer.createDiv();
        colorBox.setCssStyles({
            width: '20px', height: '20px', borderRadius: '4px',
            border: '1px solid var(--background-modifier-border)',
            backgroundColor: this.plugin.settings.dividerPillColor || 'transparent'
        });

        let sliderComp_dividerSpacing: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName(t("settings.divider_vertical_spacing.name"))
            .setDesc(t("settings.divider_vertical_spacing.desc"))
            .addSlider(slider => {
                sliderComp_dividerSpacing = slider;
                slider
                    .setLimits(5, 50, 1)
                    .setValue(this.plugin.settings.dividerSpacing ?? 15)
                    .onChange(async (value) => {
                        this.plugin.settings.dividerSpacing = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        this.plugin.dividerManager.syncDividers();
                        updatePreview();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.dividerSpacing = DEFAULT_SETTINGS.dividerSpacing;
                sliderComp_dividerSpacing.setValue(DEFAULT_SETTINGS.dividerSpacing);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                this.plugin.dividerManager.syncDividers();
                updatePreview();
            }));

        let sliderComp_dividerThickness: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName(t("settings.divider_line_thickness.name"))
            .setDesc(t("settings.divider_line_thickness.desc"))
            .addSlider(slider => {
                sliderComp_dividerThickness = slider;
                slider
                    .setLimits(1, 10, 0.5)
                    .setValue(this.plugin.settings.dividerThickness ?? 1.5)
                    .onChange(async (value) => {
                        this.plugin.settings.dividerThickness = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        this.plugin.dividerManager.syncDividers();
                        updatePreview();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.dividerThickness = DEFAULT_SETTINGS.dividerThickness;
                sliderComp_dividerThickness.setValue(DEFAULT_SETTINGS.dividerThickness ?? 1.5);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                this.plugin.dividerManager.syncDividers();
                updatePreview();
            }));

        let sliderComp_dividerLinePaddingLeft: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName(t("settings.divider_line_gap_left.name"))
            .setDesc(t("settings.divider_line_gap_left.desc"))
            .addSlider(slider => {
                sliderComp_dividerLinePaddingLeft = slider;
                slider
                    .setLimits(0, 40, 1)
                    .setValue(this.plugin.settings.dividerLinePaddingLeft ?? 8)
                    .onChange(async (value) => {
                        this.plugin.settings.dividerLinePaddingLeft = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        updatePreview();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.dividerLinePaddingLeft = DEFAULT_SETTINGS.dividerLinePaddingLeft;
                sliderComp_dividerLinePaddingLeft.setValue(DEFAULT_SETTINGS.dividerLinePaddingLeft);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                updatePreview();
            }));

        let sliderComp_dividerLinePaddingRight: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName(t("settings.divider_line_gap_right.name"))
            .setDesc(t("settings.divider_line_gap_right.desc"))
            .addSlider(slider => {
                sliderComp_dividerLinePaddingRight = slider;
                slider
                    .setLimits(0, 40, 1)
                    .setValue(this.plugin.settings.dividerLinePaddingRight ?? 8)
                    .onChange(async (value) => {
                        this.plugin.settings.dividerLinePaddingRight = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        updatePreview();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.dividerLinePaddingRight = DEFAULT_SETTINGS.dividerLinePaddingRight;
                sliderComp_dividerLinePaddingRight.setValue(DEFAULT_SETTINGS.dividerLinePaddingRight);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                updatePreview();
            }));

        new obsidian.Setting(divCard)
            .setName(t("settings.divider_default_line_style"))
            .addDropdown(drop => drop
                .addOption("solid", "Solid")
                .addOption("dashed", "Dashed")
                .addOption("dotted", "Dotted")
                .addOption("double", "Double")
                .addOption("groove", "Groove")
                .setValue(this.plugin.settings.dividerLineStyle || "solid")
                .onChange(async (value) => {
                    this.plugin.settings.dividerLineStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.dividerManager.syncDividers();
                    updatePreview();
                }));



        new obsidian.Setting(divCard)
            .setName("Divider icon position")
            .setDesc("Placement of icons on divider pills.")
            .addDropdown(drop => drop
                .addOption('left', 'Left of text')
                .addOption('right', 'Right of text')
                .addOption('both', 'Both sides')
                .setValue(this.plugin.settings.dividerIconPosition || 'left')
                .onChange(async (value) => {
                    this.plugin.settings.dividerIconPosition = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                    this.plugin.dividerManager.syncDividers();
                    updatePreview();
                }));

        // 🏷️ Tag Sync Card (Card 2)
        const tagCard = this.settingTab.makeCard(containerEl, "🏷️", "Tag Color Sync");
        tagCard.createEl('p', {
            text: 'Harmonize your vault\'s visual hierarchy by automatically color-coding tags to match your folder themes.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '16px' });

        new obsidian.Setting(tagCard)
            .setName(t("settings.tag_sync.name"))
            .setDesc('Apply colors directly to hashtag pills across both live preview and reading mode.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tagSyncEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.tagSyncEnabled = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                    (this.settingTab as unknown as { display: () => void }).display();
                }));

        new obsidian.Setting(tagCard)
            .setName(t("settings.tag_match_folders.name"))
            .setDesc('Automatically color tags that share the exact same name as any styled folder (e.g. Styling the folder "work" automatically styles the tag "#work").')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tagSyncMatchFolders)
                .onChange(async (value) => {
                    this.plugin.settings.tagSyncMatchFolders = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(tagCard)
            .setName(t("settings.custom_tag_rules.name"))
            .setDesc(t("settings.custom_tag_rules.desc"));

        const tagRulesUIContainer = tagCard.createDiv('cf-tag-rules-builder');
        tagRulesUIContainer.setCssStyles({
            marginTop: '15px', background: 'var(--background-secondary)', padding: '16px',
            borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
        });

        const renderTagRulesUI = () => {
            tagRulesUIContainer.empty();

            const header = tagRulesUIContainer.createDiv();
            header.setCssStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' });
            header.createEl('h4', { text: t("settings.active_rules") }).setCssStyles({ margin: '0' });

            const addBtn = header.createEl('button', { text: 'Add rule', cls: 'mod-cta' });

            let rules = (this.plugin.settings.tagSyncRules || "").split('\n').filter(r => r.trim().length > 0);

            const list = tagRulesUIContainer.createDiv('cf-tag-rules-list');
            list.setCssStyles({ display: 'flex', flexDirection: 'column', gap: '8px' });

            const saveTagRules = async () => {
                this.plugin.settings.tagSyncRules = rules.join('\n');
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            };

            rules.forEach((rule, index) => {
                const row = list.createDiv();
                row.setCssStyles({ display: 'flex', gap: '8px', alignItems: 'center' });

                let tagName = "", colorHex = "#ffffff";
                const parts = rule.split('=').map(p => p.trim());
                if (parts.length >= 2) {
                    tagName = parts[0];
                    colorHex = parts[1].startsWith('#') ? parts[1] : "#ffffff";
                } else {
                    tagName = rule;
                }

                const tagInp = row.createEl('input', { type: 'text', placeholder: 'Tag name (e.g. Urgent)' });
                tagInp.value = tagName;
                tagInp.setCssStyles({ flex: '2', fontFamily: 'var(--font-monospace)' });

                const colorInp = row.createEl('input', { type: 'color' });
                colorInp.value = colorHex;
                colorInp.setCssStyles({
                    width: '40px', height: '30px', border: 'none', borderRadius: '4px',
                    cursor: 'pointer', padding: '0', background: 'transparent'
                });

                const hexInp = row.createEl('input', { type: 'text', placeholder: '#ffffff' });
                hexInp.value = colorHex;
                hexInp.setCssStyles({ width: '90px', fontFamily: 'var(--font-monospace)' });

                const updateRule = () => {
                    const tName = tagInp.value.trim();
                    let cHex = hexInp.value.trim();
                    if (!cHex.startsWith('#')) {
                        cHex = '#' + cHex;
                    }
                    if (/^#[0-9A-F]{6}$/i.test(cHex)) {
                        colorInp.value = cHex;
                        hexInp.value = cHex;
                    } else {
                        cHex = colorInp.value;
                        hexInp.value = cHex;
                    }

                    if (tName) {
                        rules[index] = `${tName} = ${cHex}`;
                        void saveTagRules();
                    }
                };

                colorInp.onchange = () => {
                    hexInp.value = colorInp.value;
                    updateRule();
                };

                tagInp.onchange = updateRule;
                hexInp.onchange = updateRule;

                const delBtn = row.createEl('button', { text: '×' });
                delBtn.setCssStyles({ color: 'var(--text-error)', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '1.2em' });
                delBtn.onclick = () => {
                    rules.splice(index, 1);
                    void saveTagRules().then(() => renderTagRulesUI());
                };
            });

            if (rules.length === 0) {
                list.createDiv({ text: t("settings.no_custom_rules") }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' });
            }

            addBtn.onclick = () => {
                rules.push("New_Rule = #5ebd8e");
                void saveTagRules().then(() => renderTagRulesUI());
            };
        };

        renderTagRulesUI();

        // 🕸️ Graph View Color Sync Card (Card 3)
        const graphCard = this.settingTab.makeCard(containerEl, "🕸️", "Graph View Color Sync");
        graphCard.createEl('p', {
            text: '💡 Tip: Colors are applied to the graph view using node path groups. Re-open or refresh the graph view tab after changes to see updates.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-accent)' });

        graphCard.createEl('p', {
            text: 'How it works: To keep your graph configuration clean, only top-level folders and folders with explicit custom styles are synced. Automatically inherited subfolders are skipped.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '16px' });

        new obsidian.Setting(graphCard)
            .setName(t("settings.graph_sync.name"))
            .setDesc('Automatically injects color groups matching your folders into Obsidian\'s native graph view. Pre-existing user-defined graph groups are safely preserved.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.graphColorSync)
                .onChange(async (value) => {
                    this.plugin.settings.graphColorSync = value;
                    await this.plugin.saveSettings();
                    if (value) {
                        const { GraphColorSync } = await import('../../integrations/GraphColorSync');
                        await GraphColorSync.syncGraphColors(this.plugin);
                        new obsidian.Notice('Graph View colors synced! Re-open your Graph View to see the changes.');
                    } else {
                        const { GraphColorSync } = await import('../../integrations/GraphColorSync');
                        await GraphColorSync.clearGraphColors(this.plugin);
                        new obsidian.Notice('Graph View color sync disabled. CF groups removed from graph.json.');
                    }
                }));

        new obsidian.Setting(graphCard)
            .setName(t("settings.graph_sync_now"))
            .setDesc('Manually export your current folder colors and presets to the graph view settings file.')
            .addButton(btn => btn
                .setButtonText(t("settings.graph_sync_now"))
                .setCta()
                .onClick(async () => {
                    if (!this.plugin.settings.graphColorSync) {
                        new obsidian.Notice(t("notice.enable_graph_sync_first"));
                        return;
                    }
                    const { GraphColorSync } = await import('../../integrations/GraphColorSync');
                    await GraphColorSync.syncGraphColors(this.plugin);
                    new obsidian.Notice('Graph View colors synced! Re-open your Graph View to see the changes.');
                }));

        // 🔗 Notebook Navigator Card (Card 4)
        const intCard = this.settingTab.makeCard(containerEl, "🔗", "Notebook navigator");
        intCard.createEl('p', {
            text: '💡 Tip: To change icons in notebook navigator, simply use the colorful folders menu in the standard explorer. All changes are automatically synchronized.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-accent)' });

        new obsidian.Setting(intCard)
            .setName(t("settings.notebook_navigator.name"))
            .setDesc('Allows colorful folders to safely style the icons and text of notebook navigator items.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorSupport)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorSupport = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(intCard)
            .setName(t("settings.auto_color_files.name"))
            .setDesc('Injects the faint background block and left border to file cards. Disable this to keep the cards strictly native.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorFileBackground)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorFileBackground = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(intCard)
            .setName(t("settings.outline_only_navigator"))
            .setDesc('Removes solid backgrounds from notebook navigator items, showing only the left accent border.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorOutlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorOutlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_notebookNavigatorIconScale: obsidian.SliderComponent;
        new obsidian.Setting(intCard)
            .setName(t("settings.nb_navigator_icon_scale"))
            .setDesc('Multiplies the size of icons strictly within Notebook Navigator (default 0.8). Range: 0.5 to 2.5.')
            .addSlider(slider => {
                sliderComp_notebookNavigatorIconScale = slider;
                slider
                    .setLimits(0.5, 2.5, 0.1)
                    .setValue(this.plugin.settings.notebookNavigatorIconScale ?? 0.8)
                    .onChange(async (value) => {
                        this.plugin.settings.notebookNavigatorIconScale = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.notebookNavigatorIconScale = DEFAULT_SETTINGS.notebookNavigatorIconScale;
                sliderComp_notebookNavigatorIconScale.setValue(DEFAULT_SETTINGS.notebookNavigatorIconScale);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(intCard)
            .setName("Smart Connections compatibility mode")
            .setDesc("Ensure seamless styling compatibility with Smart Connections plugin panels.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.smartConnectionsCompatMode !== false)
                .onChange(async (value) => {
                    this.plugin.settings.smartConnectionsCompatMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));
    }
}
