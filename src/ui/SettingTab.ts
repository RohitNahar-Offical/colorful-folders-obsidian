import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle, ColorfulFoldersSettings } from '../common/types';
import { DEFAULT_SETTINGS } from '../common/constants';
import { PasswordModal } from './modals/PasswordModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { IconPickerModal } from './modals/IconPickerModal';
import { createVisualColorPicker } from './components/ColorPicker';
import { parseColorToHexAlpha, hexAlphaToRgba } from '../common/utils';
import { t } from '../lang/helpers';


export class ColorfulFoldersSettingTab extends obsidian.PluginSettingTab {
    plugin: IColorfulFoldersPlugin;
    activeTab: string;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin) {
        super(app, plugin as unknown as obsidian.Plugin);
        this.plugin = plugin;
        this.activeTab = "gen";
    }

    display() {
        const rootEl = this.containerEl;
        rootEl.empty();
        rootEl.addClass('colorful-folders-config');

        // Hero Section
        const hero = rootEl.createDiv('cf-hero');
        const heroTitle = hero.createEl("h1", { text: "Colorful folders" });
        const heroSubtitle = hero.createEl('p', { text: 'Configuration' });

        // Tab Bar
        const tabBar = rootEl.createDiv('cf-tab-bar');

        const generalPanel = rootEl.createDiv();
        const intPanel = rootEl.createDiv();
        const iconPanel = rootEl.createDiv();
        const sysPanel = rootEl.createDiv();

        generalPanel.setCssStyles({ display: 'block' });
        intPanel.setCssStyles({ display: 'none' });
        iconPanel.setCssStyles({ display: 'none' });
        sysPanel.setCssStyles({ display: 'none' });

        const btnGen = tabBar.createEl("button", { text: t("settings.card.appearance"), cls: 'cf-tab-btn' });
        const btnInt = tabBar.createEl("button", { text: t("settings.card.integrations"), cls: 'cf-tab-btn' });
        const btnIcon = tabBar.createEl("button", { text: t("settings.card.auto_icons"), cls: 'cf-tab-btn' });
        const btnSys = tabBar.createEl("button", { text: t("settings.card.privacy"), cls: 'cf-tab-btn' });

        const setHeroInfo = (tStr: string) => {
            if (tStr === "gen") { heroTitle.setText(t("settings.card.appearance")); heroSubtitle.setText(t("settings.subtitle")); }
            if (tStr === "int") { heroTitle.setText(t("settings.card.integrations")); heroSubtitle.setText(t("settings.subtitle")); }
            if (tStr === "icon") { heroTitle.setText(t("settings.card.auto_icons")); heroSubtitle.setText(t("settings.subtitle")); }
            if (tStr === "sys") { heroTitle.setText(t("settings.card.privacy")); heroSubtitle.setText(t("settings.subtitle")); }
        };

        const setTab = (t: string) => {
            this.activeTab = t;
            generalPanel.setCssStyles({ display: (t === "gen" ? "block" : "none") });
            intPanel.setCssStyles({ display: (t === "int" ? "block" : "none") });
            iconPanel.setCssStyles({ display: (t === "icon" ? "block" : "none") });
            sysPanel.setCssStyles({ display: (t === "sys" ? "block" : "none") });

            btnGen.toggleClass('is-active', t === "gen");
            btnInt.toggleClass('is-active', t === "int");
            btnIcon.toggleClass('is-active', t === "icon");
            btnSys.toggleClass('is-active', t === "sys");

            setHeroInfo(t);
        };

        btnGen.onclick = () => setTab("gen");
        btnInt.onclick = () => setTab("int");
        btnIcon.onclick = () => setTab("icon");
        btnSys.onclick = () => setTab("sys");

        setTab(this.activeTab || "gen");

        const makeCard = (parent: HTMLElement, icon: string, title: string) => {
            const card = parent.createDiv('cf-settings-card');
            const h = card.createDiv('cf-card-header');
            h.createSpan({ text: icon, cls: 'icon' });
            h.appendText(' ' + title);
            return card;
        };

        // ──────────────────────────────────────────────────────────────────────
        // ── INTEGRATIONS PANEL ────────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────
        const divCard = makeCard(intPanel, "➖", "Dividers and sections");

        const divGuide = divCard.createDiv();
        divGuide.setCssStyles({
            marginBottom: '20px',
            background: 'var(--background-secondary-alt)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '4px solid var(--interactive-accent)',
            lineHeight: '1.4'
        });
        const divGuideTitle = divGuide.createDiv({ text: '💡 Quick guide: How to add dividers' });
        divGuideTitle.setCssStyles({ fontWeight: '700', fontSize: '0.95em', marginBottom: '4px' });
        const divGuideText = divGuide.createEl('p', {
            text: 'Right-click any folder or file in the sidebar explorer and select "add divider" to insert a section separator below it. You can also run the command "add/edit divider for current file" from the command palette.'
        });
        divGuideText.setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', margin: '0' });

        // --- Divider Live Preview ---
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

            // Left line
            const leftLine = bridge.createDiv({ cls: "cf-divider-preview-line cf-divider-preview-line-left" });
            leftLine.setCssProps({
                "--preview-line-thickness": `${thickness}px`,
                "--preview-line-style": lineStyle,
                "--preview-gap-left": `${gapLeft}px`
            });

            // Central Chip / Pill label
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

            // Right line
            const rightLine = bridge.createDiv({ cls: "cf-divider-preview-line cf-divider-preview-line-right" });
            rightLine.setCssProps({
                "--preview-line-thickness": `${thickness}px`,
                "--preview-line-style": lineStyle,
                "--preview-gap-right": `${gapRight}px`
            });
        };
        updatePreview();
        // --- End Preview ---

        // Divider overrides merged into divCard
        new obsidian.Setting(divCard)
            .setName('Modern pill design')
            .setDesc('When enabled, dividers use the rounded "pill" background and border. When disabled, only text and lines are shown.')
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
            .setName('Global pill background color')
            .setDesc('Optional. Set a universal background color for all pills (rgba supported). Leave empty to inherit folder colors automatically.')
            .addButton(btn => {
                btn.setIcon('palette')
                    .setTooltip('Open visual color picker')
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
                    .setPlaceholder('Example: #5ebd8e or rgba(...)')
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
            .setName('Vertical spacing')
            .setDesc('Adjust the empty space above and below dividers.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.dividerSpacing = DEFAULT_SETTINGS.dividerSpacing;
                sliderComp_dividerSpacing.setValue(DEFAULT_SETTINGS.dividerSpacing);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                this.plugin.dividerManager.syncDividers();
                updatePreview();
            }));

        let sliderComp_dividerThickness: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName('Line thickness')
            .setDesc('Adjust the vertical line weight of the dividers.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.dividerThickness = DEFAULT_SETTINGS.dividerThickness;
                sliderComp_dividerThickness.setValue(DEFAULT_SETTINGS.dividerThickness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
                this.plugin.dividerManager.syncDividers();
                updatePreview();
            }));

        let sliderComp_dividerLinePaddingLeft: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName('Line gap (left)')
            .setDesc('Adjust horizontal space between the left divider line and the central label.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.dividerLinePaddingLeft = DEFAULT_SETTINGS.dividerLinePaddingLeft;
                sliderComp_dividerLinePaddingLeft.setValue(DEFAULT_SETTINGS.dividerLinePaddingLeft);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_dividerLinePaddingRight: obsidian.SliderComponent;
        new obsidian.Setting(divCard)
            .setName('Line gap (right)')
            .setDesc('Adjust horizontal space between the right divider line and the central label.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.dividerLinePaddingRight = DEFAULT_SETTINGS.dividerLinePaddingRight;
                sliderComp_dividerLinePaddingRight.setValue(DEFAULT_SETTINGS.dividerLinePaddingRight);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(divCard)
            .setName('Default line style')
            .addDropdown(drop => drop
                .addOption("solid", "Solid")
                .addOption("dashed", "Dashed")
                .addOption("dotted", "Dotted")
                .setValue(this.plugin.settings.dividerLineStyle || "solid")
                .onChange(async (value) => {
                    this.plugin.settings.dividerLineStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.dividerManager.syncDividers();
                    updatePreview();
                }));



        // ──────────────────────────────────────────────────────────────────────
        // ── TAG SYNC CARD ─────────────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────
        const tagCard = makeCard(intPanel, "🏷️", "Tag Color Sync");
        tagCard.createEl('p', {
            text: 'Harmonize your vault\'s visual hierarchy by automatically color-coding tags to match your folder themes.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '16px' });

        new obsidian.Setting(tagCard)
            .setName('Enable tag color sync')
            .setDesc('Apply colors directly to hashtag pills across both live preview and reading mode.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tagSyncEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.tagSyncEnabled = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(tagCard)
            .setName('Match folder colors')
            .setDesc('Automatically color tags that share the exact same name as any styled folder (e.g. Styling the folder "work" automatically styles the tag "#work").')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tagSyncMatchFolders)
                .onChange(async (value) => {
                    this.plugin.settings.tagSyncMatchFolders = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(tagCard)
            .setName('Custom tag rules')
            .setDesc('Define custom color overrides for specific tags.');

        const tagRulesUIContainer = tagCard.createDiv('cf-tag-rules-builder');
        tagRulesUIContainer.setCssStyles({
            marginTop: '15px', background: 'var(--background-secondary)', padding: '16px',
            borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
        });

        const renderTagRulesUI = () => {
            tagRulesUIContainer.empty();

            const header = tagRulesUIContainer.createDiv();
            header.setCssStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' });
            header.createEl('h4', { text: 'Active rules' }).setCssStyles({ margin: '0' });

            const addBtn = header.createEl('button', { text: 'Add rule', cls: 'mod-cta' });

            // Parse existing tag rules
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

                // Tag Name Input
                const tagInp = row.createEl('input', { type: 'text', placeholder: 'Tag name (e.g. Urgent)' });
                tagInp.value = tagName;
                tagInp.setCssStyles({ flex: '2', fontFamily: 'var(--font-monospace)' });

                // Color Input (Picker)
                const colorInp = row.createEl('input', { type: 'color' });
                colorInp.value = colorHex;
                colorInp.setCssStyles({
                    width: '40px', height: '30px', border: 'none', borderRadius: '4px',
                    cursor: 'pointer', padding: '0', background: 'transparent'
                });

                // Hex Text Input
                const hexInp = row.createEl('input', { type: 'text', placeholder: '#ffffff' });
                hexInp.value = colorHex;
                hexInp.setCssStyles({ width: '90px', fontFamily: 'var(--font-monospace)' });

                const updateRule = () => {
                    const tName = tagInp.value.trim();
                    let cHex = hexInp.value.trim();
                    if (!cHex.startsWith('#')) {
                        cHex = '#' + cHex;
                    }
                    // Validate hex
                    if (/^#[0-9A-F]{6}$/i.test(cHex)) {
                        colorInp.value = cHex;
                        hexInp.value = cHex;
                    } else {
                        cHex = colorInp.value; // revert to color picker value
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
                list.createDiv({ text: 'No custom tag rules defined.' }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' });
            }

            addBtn.onclick = () => {
                rules.push("New_Rule = #5ebd8e");
                void saveTagRules().then(() => renderTagRulesUI());
            };
        };

        renderTagRulesUI();

        // ──────────────────────────────────────────────────────────────────────
        // ── GRAPH VIEW SYNC CARD ──────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────
        const graphCard = makeCard(intPanel, "🕸️", "Graph View Color Sync");
        graphCard.createEl('p', {
            text: '💡 Tip: Colors are applied to the graph view using node path groups. Re-open or refresh the graph view tab after changes to see updates.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-accent)' });

        graphCard.createEl('p', {
            text: 'How it works: To keep your graph configuration clean, only top-level folders and folders with explicit custom styles are synced. Automatically inherited subfolders are skipped.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '16px' });

        new obsidian.Setting(graphCard)
            .setName('Sync colors to graph view')
            .setDesc('Automatically injects color groups matching your folders into Obsidian\'s native graph view. Pre-existing user-defined graph groups are safely preserved.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.graphColorSync)
                .onChange(async (value) => {
                    this.plugin.settings.graphColorSync = value;
                    await this.plugin.saveSettings();
                    if (value) {
                        // Import lazily at use-time to keep startup cost zero
                        const { GraphColorSync } = await import('../integrations/GraphColorSync');
                        await GraphColorSync.syncGraphColors(this.plugin);
                        new obsidian.Notice('Graph View colors synced! Re-open your Graph View to see the changes.');
                    } else {
                        const { GraphColorSync } = await import('../integrations/GraphColorSync');
                        await GraphColorSync.clearGraphColors(this.plugin);
                        new obsidian.Notice('Graph View color sync disabled. CF groups removed from graph.json.');
                    }
                }));

        new obsidian.Setting(graphCard)
            .setName('Sync now')
            .setDesc('Manually export your current folder colors and presets to the graph view settings file.')
            .addButton(btn => btn
                .setButtonText('Sync now')
                .setCta()
                .onClick(async () => {
                    if (!this.plugin.settings.graphColorSync) {
                        new obsidian.Notice('Enable "Sync colors to Graph View" first.');
                        return;
                    }
                    const { GraphColorSync } = await import('../integrations/GraphColorSync');
                    await GraphColorSync.syncGraphColors(this.plugin);
                    new obsidian.Notice('Graph View colors synced! Re-open your Graph View to see the changes.');
                }));

        const intCard = makeCard(intPanel, "🔗", "Notebook navigator");
        intCard.createEl('p', {
            text: '💡 Tip: To change icons in notebook navigator, simply use the colorful folders menu in the standard explorer. All changes are automatically synchronized.',
            cls: 'setting-item-description'
        }).setCssStyles({ fontSize: '0.85em', fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-accent)' });

        new obsidian.Setting(intCard)
            .setName('Enable notebook navigator support')
            .setDesc('Allows colorful folders to safely style the icons and text of notebook navigator items.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorSupport)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorSupport = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(intCard)
            .setName('Apply background colors to files')
            .setDesc('Injects the faint background block and left border to file cards. Disable this to keep the cards strictly native.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorFileBackground)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorFileBackground = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(intCard)
            .setName('Outline only mode (navigator)')
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
            .setName('Navigator icon scaling')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.notebookNavigatorIconScale = DEFAULT_SETTINGS.notebookNavigatorIconScale;
                sliderComp_notebookNavigatorIconScale.setValue(DEFAULT_SETTINGS.notebookNavigatorIconScale);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        // ──────────────────────────────────────────────────────────────────────
        // ── ICON PACKS PANEL ──────────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────

        const customIconCard = makeCard(iconPanel, "📦", "Custom icon management");

        const iconDesc = customIconCard.createEl("p", { text: "Add individual SVG icons or import bulk packs from the internet. All custom icons added here will appear in the icon selection grid when styling a folder or file." });
        iconDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" });

        const tip = customIconCard.createDiv({ text: "Pro tip: custom ids should be unique. Avoid starting them with 'lucide-' unless you intend to override a built-in Obsidian icon." });
        tip.setCssStyles({ fontSize: "0.8em", color: "var(--text-accent)", marginBottom: "15px", fontStyle: "italic" });

        const manualWrap = customIconCard.createDiv();
        manualWrap.setCssStyles({
            padding: "16px", background: "var(--background-secondary-alt)", borderRadius: "10px",
            border: "1px solid var(--background-modifier-border)", marginBottom: "20px"
        });

        const manualTitle = manualWrap.createDiv({ text: "Add single icon" });
        manualTitle.setCssStyles({ fontWeight: "700", marginBottom: "10px", fontSize: "0.9em" });
        const manualRow = manualWrap.createDiv();
        manualRow.setCssStyles({ display: "flex", gap: "8px", flexWrap: "wrap" });
        const idInp = manualRow.createEl("input", { placeholder: "Icon ID (e.g. cloud-logo)" });
        const svgInp = manualRow.createEl("input", { placeholder: "SVG code (<svg...)" });
        idInp.setCssStyles({ flex: "1" }); svgInp.setCssStyles({ flex: "3" });

        const addBtn = manualRow.createEl("button", { text: "Add icon", cls: "mod-cta" });
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

            (this as unknown as { display: () => void }).display();
            new obsidian.Notice(`Icon '${id}' registered!`);
        };

        new obsidian.Setting(customIconCard)
            .setName("Bulk import from URL")
            .setDesc("Enter a URL to a JSON icon pack { 'id': '<svg...>' }")
            .addText(text => {
                text.setPlaceholder("https://example.com/icons.json");
                const impBtn = customIconCard.createEl("button", { text: "Import" });
                impBtn.setCssStyles({ marginLeft: "8px" });
                impBtn.onclick = async () => {
                    const url = text.getValue().trim();
                    if (!url) return;
                    await this.importUrl(url);
                };
            });

        const featCard = makeCard(iconPanel, "⭐", "Featured icon packs");
        featCard.createDiv("cf-grid");

        const packs = [
            { name: "✨ Remix icons", desc: "Clean and neutral design system.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/ri.json", prefix: "ri" },
            { name: "🪶 Feather icons", desc: "Simply beautiful open source icons.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/feather.json", prefix: "feather" },
            { name: "📐 Tabler icons", desc: "Over 4000+ well-crafted icons.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/tabler.json", prefix: "tabler" },
            { name: "📦 Boxicons", desc: "High quality web friendly icons.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/bx.json", prefix: "bx" },
            { name: "🚩 Font Awesome solid", desc: "Official professional solid set.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/fa-solid.json", prefix: "fa-solid" },
            { name: "🏳️ Font Awesome regular", desc: "Official line icons from FA.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/fa-regular.json", prefix: "fa-regular" },
            { name: "🐙 Octicons", desc: "GitHub's native icon library.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/octicon.json", prefix: "octicon" },
            { name: "🎮 RPG awesome", desc: "Fantasy icons for RPG notes.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/ra.json", prefix: "ra" },
            { name: "⚡ Simple icons", desc: "Brand icons for popular services.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/simple-icons.json", prefix: "simple-icons" },
            { name: "🔥 Ultimate collection", desc: "Curated community starter pack.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/main/icons/community-core.json", prefix: "cf" }
        ];

        packs.forEach(p => {
            const row = featCard.createDiv("setting-item");
            Object.assign(row.style, {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", gap: "20px"
            });

            const content = row.createDiv();
            content.setCssStyles({ flex: "1" });

            const pName = content.createDiv({ text: p.name });
            pName.setCssStyles({ fontWeight: "600" });
            const pDesc = content.createDiv({ text: p.desc });
            pDesc.setCssStyles({ fontSize: "0.8em" });

            const link = content.createEl("a", { text: "View source", href: p.url });
            link.setCssStyles({
                fontSize: "0.7em", color: "var(--text-accent)", marginTop: "4px", display: "inline-block"
            });

            const btnGroup = row.createDiv();
            btnGroup.setCssStyles({ display: "flex", gap: "8px" });

            const downloadBtn = btnGroup.createEl("button", { text: "Download" });
            downloadBtn.setCssStyles({ minWidth: "80px" });
            downloadBtn.onclick = () => this.importUrl(p.url);

            const removeBtn = btnGroup.createEl("button", { text: "Remove" });
            removeBtn.setCssStyles({ minWidth: "80px", color: "var(--text-error)" });
            removeBtn.onclick = async () => {
                const prefix = p.prefix + "-";
                let count = 0;
                for (const id in this.plugin.settings.customIcons) {
                    if (id.startsWith(prefix)) {
                        delete this.plugin.settings.customIcons[id];
                        count++;
                    }
                }
                this.plugin.registerCustomIcons();
                await this.plugin.saveSettings();
                new obsidian.Notice(`Removed ${count} icons from ${p.name}.`);

                (this as unknown as { display: () => void }).display();
            };
        });

        const libCard = makeCard(iconPanel, "📚", "Custom icon library");
        const lib = libCard.createDiv("cf-icon-grid");
        const customIconList = Object.entries(this.plugin.settings.customIcons);
        if (customIconList.length === 0) {
            const emptyMsg = libCard.createDiv({ text: "No custom icons found." });
            emptyMsg.setCssStyles({ color: "var(--text-muted)", fontStyle: "italic", padding: "10px" });
        } else {
            customIconList.forEach(([id, svg]) => {
                const item = lib.createDiv("cf-icon-item");
                item.setAttribute("aria-label", id);

                // Safe SVG injection
                const parser = new DOMParser();
                const doc = parser.parseFromString(svg, 'image/svg+xml');
                const svgEl = doc.querySelector('svg');
                if (svgEl) {
                    svgEl.setCssStyles({ width: "24px", height: "24px" });
                    item.appendChild(this.containerEl.ownerDocument.importNode(svgEl, true));
                }

                const del = item.createEl("button", { text: "×", cls: "cf-btn-remove" });
                del.onclick = async (e) => {
                    e.stopPropagation();
                    delete this.plugin.settings.customIcons[id];
                    await this.plugin.saveSettings();

                    (this as unknown as { display: () => void }).display();
                };
            });
        }

        const maintCard = makeCard(sysPanel, "🔧", "Icon maintenance");
        new obsidian.Setting(maintCard)
            .setName('Register all icons')
            .setDesc('Ensures all icons in your library are properly loaded into Obsidian.')
            .addButton(btn => btn
                .setButtonText('Re-register icons')
                .onClick(() => {
                    this.plugin.registerCustomIcons();
                    new obsidian.Notice("All custom icons re-registered.");
                }));

        new obsidian.Setting(maintCard)
            .setName('Clear icon library')
            .setDesc('Permanently deletes all imported icon packs.')
            .addButton(btn => {
                btn.setButtonText('Clear icon library');
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Clear icon library", "Are you sure you want to delete ALL custom icons?", async () => {
                        this.plugin.settings.customIcons = {};
                        this.plugin.registerCustomIcons();
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        new obsidian.Notice("Icon library cleared.");

                        (this as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        const manImportCard = makeCard(iconPanel, "📥", "Manual icon pack import");
        const packDesc = manImportCard.createEl('p', { text: 'You can manually paste the JSON content of an icon pack below to import it.' });
        packDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)" });

        let manualJson = "";
        new obsidian.Setting(manImportCard)
            .setName('Icon pack JSON')
            .addTextArea(text => {
                text.setPlaceholder('{"prefix": "my-icons", "icons": {...}}')
                    .onChange(value => { manualJson = value; });
                text.inputEl.setCssStyles({
                    width: "100%", height: "150px", fontFamily: "var(--font-monospace)",
                    background: "var(--background-secondary)"
                });
            });

        new obsidian.Setting(manImportCard)
            .addButton(btn => btn
                .setButtonText('Import manual JSON')
                .setCta()
                .onClick(async () => {
                    if (!manualJson.trim()) return;
                    try {
                        const data = JSON.parse(manualJson) as Record<string, unknown>;
                        await this.processIconData(data);
                        new obsidian.Notice("Manual icon pack imported!");

                        (this as unknown as { display: () => void }).display();
                    } catch (e) {
                        new obsidian.Notice("Invalid JSON format.");
                        console.error("Colorful Folders: Manual Import failed", e);
                    }
                }));


        // ──────────────────────────────────────────────────────────────────────
        // ── GENERAL OPTIONS PANEL ─────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────

        const infoBlock = generalPanel.createDiv('cf-info-block');
        const infoIcon = infoBlock.createDiv('cf-info-icon');
        infoIcon.setText('💡');
        const infoContent = infoBlock.createDiv('cf-info-content');
        infoContent.createEl('h4', { text: t('settings.info.context_menu_title') });
        const infoText = infoContent.createEl('p');
        infoText.appendText(t('settings.info.context_menu_desc_1'));
        infoText.createEl('strong', { text: t('settings.info.set_custom_style') });
        infoText.appendText(t('settings.info.context_menu_desc_2'));
        infoText.createEl('strong', { text: t('settings.info.add_divider') });
        infoText.appendText(t('settings.info.context_menu_desc_3'));

        const genCard = makeCard(generalPanel, "🎨", t("settings.card.appearance"));
        let globalBgPickerWrap: HTMLElement | null = null;
        let globalBgTextComp: obsidian.TextComponent;
        let globalBgSwatch: HTMLElement;

        new obsidian.Setting(genCard)
            .setName(t('settings.palette_light.name'))
            .setDesc(t('settings.palette_light.desc'))
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant rainbow')
                .addOption('Muted Dark Mode', 'Muted dark mode')
                .addOption('Pastel Dreams', 'Pastel dreams')
                .addOption('Tailwind UI', 'Tailwind UI')
                .addOption('Tailwind UI Dark', 'Tailwind UI dark')
                .addOption('Custom', 'Custom palette')
                .setValue(this.plugin.settings.paletteLight || this.plugin.settings.palette || 'Tailwind UI')
                .onChange(async (value) => {
                    this.plugin.settings.paletteLight = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t('settings.palette_dark.name'))
            .setDesc(t('settings.palette_dark.desc'))
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant rainbow')
                .addOption('Muted Dark Mode', 'Muted dark mode')
                .addOption('Pastel Dreams', 'Pastel dreams')
                .addOption('Tailwind UI', 'Tailwind UI')
                .addOption('Tailwind UI Dark', 'Tailwind UI dark')
                .addOption('Custom', 'Custom palette')
                .setValue(this.plugin.settings.paletteDark || this.plugin.settings.palette || 'Pastel Dreams')
                .onChange(async (value) => {
                    this.plugin.settings.paletteDark = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t('settings.custom_colors.name'))
            .setDesc(t('settings.custom_colors.desc'));

        const paletteBuilderContainer = genCard.createDiv('cf-palette-builder');
        paletteBuilderContainer.setCssStyles({
            marginTop: '12px',
            background: 'transparent',
            padding: '0'
        });

        // 1. Create header with title on the left, reset and add buttons on the right
        const header = paletteBuilderContainer.createDiv();
        header.setCssStyles({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
        });
        header.createSpan({ text: t('settings.palette_colors') }).setCssStyles({
            fontWeight: '600',
            fontSize: '1.0em',
            color: 'var(--text-normal)'
        });

        const btnContainer = header.createDiv();
        btnContainer.setCssStyles({
            display: 'flex',
            gap: '10px'
        });

        const resetBtn = btnContainer.createEl('button', { text: t('common.reset') });
        resetBtn.setCssStyles({
            cursor: 'pointer'
        });

        const addColorBtn = btnContainer.createEl('button', { text: t('settings.add_color') });
        addColorBtn.setCssStyles({
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            cursor: 'pointer',
            border: 'none'
        });

        // 2. Create two-column layout: Left column for rows, Right column for editor panel
        const mainSplit = paletteBuilderContainer.createDiv();
        mainSplit.setCssStyles({
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
        });

        const list = mainSplit.createDiv();
        list.setCssStyles({
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: '1'
        });

        const pickerSide = mainSplit.createDiv();
        pickerSide.setCssStyles({
            flex: '1',
            background: 'var(--background-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--background-modifier-border)',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        });

        const pickerPlaceholder = pickerSide.createDiv();
        pickerPlaceholder.setCssStyles({
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontStyle: 'italic'
        });
        pickerPlaceholder.setText(t('settings.click_to_edit'));

        // 3. Setup colors and functions
        let colors = (this.plugin.settings.customPalette || '')
            .split(',')
            .map(c => c.trim())
            .filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
        if (colors.length === 0) colors = ['#eb6f92'];

        // Debounce saving/generating to prevent lag during color picking drag events
        const savePaletteDebounced = () => {
            this.plugin.settings.customPalette = colors.join(', ');
            void this.plugin.saveSettings().then(() => this.plugin.generateStylesDebounced());
        };

        const renderRow = (hex: string, index: number) => {
            const row = list.createDiv();
            row.setCssStyles({
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            });

            // Color swatch: clean square 28x28px, border-radius: 6px
            const swatch = row.createDiv();
            swatch.setCssStyles({
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                flexShrink: '0',
                border: '1px solid var(--background-modifier-border)',
                backgroundColor: hex,
                cursor: 'pointer'
            });

            swatch.addEventListener('click', () => {
                pickerSide.empty();
                pickerSide.setCssStyles({
                    display: 'block',
                    padding: '16px'
                });

                const pickerWrap = pickerSide.createDiv();
                createVisualColorPicker(pickerWrap, colors[index], (newHex) => {
                    colors[index] = newHex;
                    swatch.setCssStyles({ backgroundColor: newHex });
                    hexInp.value = newHex;
                    savePaletteDebounced();
                }, { showAlpha: false });
            });

            // Hex text input: pill-style, native form field background, monospace
            const hexInp = row.createEl('input', { type: 'text' });
            hexInp.value = hex;
            hexInp.setCssStyles({
                width: '90px',
                fontFamily: 'var(--font-monospace)',
                fontSize: '0.85em',
                background: 'var(--background-modifier-form-field)',
                border: 'none',
                outline: 'none',
                borderRadius: '999px',
                padding: '4px 12px',
                color: 'var(--text-normal)'
            });
            hexInp.onchange = () => {
                let val = hexInp.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    colors[index] = val;
                    swatch.setCssStyles({ backgroundColor: val });
                    savePaletteDebounced();
                } else {
                    hexInp.value = colors[index]; // revert on invalid
                }
            };

            // Remove button: clean 'x' icon (color: var(--text-muted)) transitioning to var(--text-error) (red) on hover
            const delBtn = row.createEl('button', { text: '×' });
            delBtn.setCssStyles({
                color: 'var(--text-muted)',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                fontSize: '1.2em',
                padding: '0 4px',
                transition: 'color 0.15s ease'
            });
            delBtn.addEventListener('pointerenter', () => {
                delBtn.setCssStyles({ color: 'var(--text-error)' });
            });
            delBtn.addEventListener('pointerleave', () => {
                delBtn.setCssStyles({ color: 'var(--text-muted)' });
            });
            delBtn.onclick = () => {
                pickerSide.empty();
                pickerSide.setCssStyles({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                });
                pickerSide.appendChild(pickerPlaceholder);
                colors.splice(index, 1);
                rebuildRows();
                savePaletteDebounced();
            };
        };

        const rebuildRows = () => {
            list.empty();
            colors.forEach((c, i) => renderRow(c, i));
            if (colors.length === 0) {
                list.createDiv({ text: 'No colors defined.' }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' });
            }
        };

        resetBtn.onclick = () => {
            pickerSide.empty();
            pickerSide.setCssStyles({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            });
            pickerSide.appendChild(pickerPlaceholder);

            colors = ['#eb6f92', '#f6c177', '#ea9a97', '#c4a7e7', '#9ccfd8', '#31748f']; // Default Pastel Dreams palette
            rebuildRows();
            savePaletteDebounced();
        };

        addColorBtn.onclick = () => {
            colors.push('#5ebd8e');
            rebuildRows();
            savePaletteDebounced();
        };

        rebuildRows();

        new obsidian.Setting(genCard)
            .setName(t('settings.folder_exclusion.name'))
            .setDesc(t('settings.folder_exclusion.desc'))
            .addText(text => text
                .setPlaceholder('Example templates')
                .setValue(this.plugin.settings.exclusionList || "")
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t('settings.color_mode.name'))
            .setDesc(t('settings.color_mode.desc'))
            .addDropdown(drop => drop
                .addOption('cycle', t('settings.color_mode.cycle'))
                .addOption('monochromatic', t('settings.color_mode.monochromatic'))
                .addOption('heatmap', t('settings.color_mode.heatmap'))
                .addOption('hierarchy', 'Hierarchy level')
                .setValue(this.plugin.settings.colorMode)
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t('settings.color_text.name'))
            .setDesc(t('settings.color_text.desc'))
            .addDropdown(drop => drop
                .addOption('all', 'Folders and files')
                .addOption('folders', 'Folders only')
                .addOption('files', 'Files only')
                .addOption('none', 'None (icons only)')
                .setValue((this.plugin.settings.colorText === true || this.plugin.settings.colorText === undefined) ? 'all' : (this.plugin.settings.colorText === false ? 'none' : this.plugin.settings.colorText))
                .onChange(async (value) => {
                    this.plugin.settings.colorText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t('settings.global_default_bg.name'))
            .setDesc(t('settings.global_default_bg.desc'))
            .addButton(btn => btn
                .setIcon('palette')
                .setTooltip('Open visual color picker')
                .onClick(() => {
                    if (globalBgPickerWrap) { globalBgPickerWrap.remove(); globalBgPickerWrap = null; return; }
                    globalBgPickerWrap = genCard.createDiv();
                    globalBgPickerWrap.setCssStyles({
                        marginTop: '12px', padding: '16px', background: 'var(--background-secondary-alt)',
                        borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
                    });
                    const current = parseColorToHexAlpha(this.plugin.settings.globalBackgroundColor);
                    createVisualColorPicker(globalBgPickerWrap, current.hex, (hex) => {
                        this.plugin.settings.globalBackgroundColor = hex;
                        globalBgTextComp.setValue(hex);
                        globalBgSwatch.setCssStyles({ backgroundColor: hex });
                        void this.plugin.saveSettings().then(() => this.plugin.generateStylesDebounced());
                    }, { showAlpha: false });
                }))
            .addText(text => {
                globalBgTextComp = text;
                text.setPlaceholder('Hex: #2a2a2a')
                    .setValue(this.plugin.settings.globalBackgroundColor || '')
                    .onChange(async (value) => {
                        this.plugin.settings.globalBackgroundColor = value;
                        globalBgSwatch.setCssStyles({ backgroundColor: value || 'transparent' });
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                globalBgSwatch = text.inputEl.parentElement?.createDiv() ?? text.inputEl.insertAdjacentElement('afterend', this.containerEl.createDiv()) as HTMLElement;
                globalBgSwatch.setCssStyles({
                    width: '24px', height: '24px', borderRadius: '6px',
                    border: '1px solid var(--background-modifier-border)',
                    backgroundColor: this.plugin.settings.globalBackgroundColor || 'transparent'
                });
            });

        if (this.plugin.settings.colorMode === 'cycle' || this.plugin.settings.colorMode === 'hierarchy') {
            let sliderComp_cycleOffset: obsidian.SliderComponent;
        new obsidian.Setting(genCard)
                .setName(t('settings.rainbow_offset.name'))
                .setDesc(t('settings.rainbow_offset.desc'))
                .addSlider(slider => {
                sliderComp_cycleOffset = slider;
                slider
                    .setLimits(0, 20, 1)
                    .setValue(this.plugin.settings.cycleOffset || 0)

    
                .onChange(async (value) => {
                        this.plugin.settings.cycleOffset = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.cycleOffset = DEFAULT_SETTINGS.cycleOffset;
                sliderComp_cycleOffset.setValue(DEFAULT_SETTINGS.cycleOffset);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));
        }


        new obsidian.Setting(genCard)
            .setName(t('settings.root_appearance.name'))
            .setDesc(t('settings.root_appearance.desc'))
            .addDropdown(drop => drop
                .addOption('solid', 'Solid vivid color')
                .addOption('translucent', 'Translucent glow')
                .setValue(this.plugin.settings.rootStyle)
                .onChange(async (value) => {
                    this.plugin.settings.rootStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));


        new obsidian.Setting(genCard)
            .setName(t('settings.glassmorphism.name'))
            .setDesc(t('settings.glassmorphism.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.glassmorphism)
                .onChange(async (value) => {
                    this.plugin.settings.glassmorphism = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        const activeCard = makeCard(generalPanel, "✨", t("settings.card.active_item"));
        new obsidian.Setting(activeCard)
            .setName(t('settings.active_glow.name'))
            .setDesc(t('settings.active_glow.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow !== false)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(activeCard)
            .setName(t('settings.custom_active.name'))
            .setDesc(t('settings.custom_active.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomActiveColor)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomActiveColor = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();

                    (this as unknown as { display: () => void }).display(); // Refresh to show/hide sub-settings
                }));

        if (this.plugin.settings.useCustomActiveColor) {
            const bgRow = activeCard.createDiv();
            let bgPickerWrap: HTMLElement | null = null;
            let bgColorBox: HTMLElement;
            let bgTextComp: obsidian.TextComponent;

            const toggleBgPicker = () => {
                if (bgPickerWrap) { bgPickerWrap.remove(); bgPickerWrap = null; return; }
                bgPickerWrap = bgRow.createDiv();
                bgPickerWrap.setCssStyles({
                    marginTop: '12px', padding: '16px', background: 'var(--background-secondary-alt)',
                    borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
                });
                const current = parseColorToHexAlpha(this.plugin.settings.customActiveBg);
                createVisualColorPicker(bgPickerWrap, current.hex, (hex, alpha) => {
                    const rgba = hexAlphaToRgba(hex, alpha);
                    this.plugin.settings.customActiveBg = rgba;
                    bgTextComp.setValue(rgba);
                    bgColorBox.setCssStyles({ backgroundColor: rgba });
                    void this.plugin.saveSettings().then(() => this.plugin.generateStylesDebounced());
                }, { showAlpha: true, initialAlpha: current.alpha });
            };

            new obsidian.Setting(bgRow)
                .setName(t('settings.active_bg_color.name'))
                .setDesc(t('settings.active_bg_color.desc'))
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip('Open visual color picker')
                    .onClick(() => toggleBgPicker()))
                .addText(text => {
                    bgTextComp = text;
                    text.setPlaceholder('Hex: #ffffff')
                        .setValue(this.plugin.settings.customActiveBg || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveBg = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                            bgColorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                        });
                    bgColorBox = text.inputEl.parentElement.createDiv();
                    bgColorBox.setAttribute('title', 'Click to open visual color picker');
                    bgColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', cursor: 'pointer', backgroundColor: this.plugin.settings.customActiveBg || 'transparent'
                    });
                    bgColorBox.addEventListener('click', () => toggleBgPicker());
                });

            const textRow = activeCard.createDiv();
            let textPickerWrap: HTMLElement | null = null;
            let textColorBox: HTMLElement;
            let textColorTextComp: obsidian.TextComponent;

            const toggleTextPicker = () => {
                if (textPickerWrap) { textPickerWrap.remove(); textPickerWrap = null; return; }
                textPickerWrap = textRow.createDiv();
                textPickerWrap.setCssStyles({
                    marginTop: '12px', padding: '16px', background: 'var(--background-secondary-alt)',
                    borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
                });
                const current = parseColorToHexAlpha(this.plugin.settings.customActiveText);
                createVisualColorPicker(textPickerWrap, current.hex, (hex, alpha) => {
                    const rgba = hexAlphaToRgba(hex, alpha);
                    this.plugin.settings.customActiveText = rgba;
                    textColorTextComp.setValue(rgba);
                    textColorBox.setCssStyles({ backgroundColor: rgba });
                    void this.plugin.saveSettings().then(() => this.plugin.generateStylesDebounced());
                }, { showAlpha: true, initialAlpha: current.alpha });
            };

            new obsidian.Setting(textRow)
                .setName(t('settings.active_text_color.name'))
                .setDesc(t('settings.active_text_color.desc'))
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip('Open visual color picker')
                    .onClick(() => toggleTextPicker()))
                .addText(text => {
                    textColorTextComp = text;
                    text.setPlaceholder('Hex: #c0c0c0')
                        .setValue(this.plugin.settings.customActiveText || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveText = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                            textColorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                        });
                    textColorBox = text.inputEl.parentElement.createDiv();
                    textColorBox.setAttribute('title', 'Click to open visual color picker');
                    textColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', cursor: 'pointer', backgroundColor: this.plugin.settings.customActiveText || 'transparent'
                    });
                    textColorBox.addEventListener('click', () => toggleTextPicker());
                });
        }

        const visCard = makeCard(generalPanel, "👁️", t("settings.card.appearance_visibility"));
        let sliderComp_lightModeBrightness: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName(t('settings.light_brightness.name'))
            .addSlider(slider => {
                sliderComp_lightModeBrightness = slider;
                slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.lightModeBrightness || 0)

                .onChange(async (value) => {
                    this.plugin.settings.lightModeBrightness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.lightModeBrightness = DEFAULT_SETTINGS.lightModeBrightness;
                sliderComp_lightModeBrightness.setValue(DEFAULT_SETTINGS.lightModeBrightness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_darkModeBrightness: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName(t('settings.dark_brightness.name'))
            .addSlider(slider => {
                sliderComp_darkModeBrightness = slider;
                slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.darkModeBrightness || 0)

                .onChange(async (value) => {
                    this.plugin.settings.darkModeBrightness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.darkModeBrightness = DEFAULT_SETTINGS.darkModeBrightness;
                sliderComp_darkModeBrightness.setValue(DEFAULT_SETTINGS.darkModeBrightness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName(t('settings.outline_only.name'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(visCard)
            .setName(t('settings.auto_color_files.name'))
            .setDesc(t('settings.auto_color_files.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoColorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.autoColorFiles = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_iconScale: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName(t('settings.icon_scaling.name'))
            .setDesc(t('settings.icon_scaling.desc'))
            .addSlider(slider => {
                sliderComp_iconScale = slider;
                slider
                .setLimits(0.5, 2.5, 0.1)
                .setValue(this.plugin.settings.iconScale || 1.0)


                .onChange(async (value) => {
                    this.plugin.settings.iconScale = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.iconScale = DEFAULT_SETTINGS.iconScale;
                sliderComp_iconScale.setValue(DEFAULT_SETTINGS.iconScale);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName(t('settings.icon_debug.name'))
            .setDesc(t('settings.icon_debug.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.iconDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.iconDebugMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(visCard)
            .setName(t('settings.wrap_metadata.name'))
            .setDesc(t('settings.wrap_metadata.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.wrapMetadata || false)
                .onChange(async (value) => {
                    this.plugin.settings.wrapMetadata = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));


        const autoCard = makeCard(iconPanel, "🤖", t("settings.card.automation_engine"));
        new obsidian.Setting(autoCard)
            .setName(t('settings.auto_icons.name'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();

                    (this as unknown as { display: () => void }).display();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(autoCard)
                .setName(t('settings.wide_icons.name'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(autoCard)
                .setName(t('settings.icon_variety.name'))
                .setDesc(t('settings.icon_variety.desc'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.autoIconVariety)
                    .onChange(async (value) => {
                        this.plugin.settings.autoIconVariety = value;
                        await this.plugin.saveSettings();
                        (this as unknown as { display: () => void }).display();
                        this.plugin.generateStylesDebounced();
                    }));

            if (this.plugin.settings.autoIconVariety) {
                new obsidian.Setting(autoCard)
                    .setName(t('settings.shuffle_icons.name'))
                    .setDesc(t('settings.shuffle_icons.desc'))
                    .addButton(button => button
                        .setButtonText(t('settings.shuffle_icons.name'))
                        .onClick(async () => {
                            this.plugin.settings.varietySeed = Math.floor(Math.random() * 1000000);
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }));
            }

            new obsidian.Setting(autoCard)
                .setName(t('settings.default_closed_icon.name'))
                .setDesc(t('settings.default_closed_icon.desc'))
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultClosedFolderIcon || "lucide-folder");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultClosedFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText(t('common.choose')).onClick(() => {
                        new IconPickerModal(this.app, this.plugin, text.getValue(), async (iconId) => {
                            text.setValue(iconId);
                            this.plugin.settings.defaultClosedFolderIcon = iconId;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }).open();
                    });
                    btn.buttonEl.setCssStyles({ marginLeft: "8px" });
                });

            new obsidian.Setting(autoCard)
                .setName(t('settings.default_open_icon.name'))
                .setDesc(t('settings.default_open_icon.desc'))
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultOpenFolderIcon || "lucide-folder-open");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultOpenFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText(t('common.choose')).onClick(() => {
                        new IconPickerModal(this.app, this.plugin, text.getValue(), async (iconId) => {
                            text.setValue(iconId);
                            this.plugin.settings.defaultOpenFolderIcon = iconId;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }).open();
                    });
                    btn.buttonEl.setCssStyles({ marginLeft: "8px" });
                });

            const rulesDesc = autoCard.createDiv();
            rulesDesc.setCssStyles({
                fontSize: "0.8em", color: "var(--text-muted)", marginBottom: "12px",
                padding: "10px", background: "var(--background-secondary-alt)", borderRadius: "6px",
                borderLeft: "3px solid var(--interactive-accent)", lineHeight: "1.4"
            });
            rulesDesc.createEl('strong', { text: 'Advanced regex rule builder' });
            rulesDesc.createEl('br');
            rulesDesc.appendText('Define rules to automatically assign icons based on folder/file names using regex patterns. Rules are evaluated top to bottom, highest priority first.');

            // --- Advanced Icon Rule Builder ---
            const rulesUIContainer = autoCard.createDiv('cf-rules-builder');
            rulesUIContainer.setCssStyles({
                marginTop: '15px', background: 'var(--background-secondary)', padding: '16px',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
            });

            const renderRulesUI = () => {
                rulesUIContainer.empty();

                const header = rulesUIContainer.createDiv();
                header.setCssStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' });
                header.createEl('h4', { text: t('settings.active_rules') }).setCssStyles({ margin: '0' });

                const addBtn = header.createEl('button', { text: t('settings.add_rule'), cls: 'mod-cta' });

                // Parse existing rules
                let rules = (this.plugin.settings.customIconRules || "").split('\n').filter(r => r.trim().length > 0);

                const list = rulesUIContainer.createDiv('cf-rules-list');
                list.setCssStyles({ display: 'flex', flexDirection: 'column', gap: '8px' });

                const saveRules = async () => {
                    this.plugin.settings.customIconRules = rules.join('\n');
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                };

                rules.forEach((rule, index) => {
                    const row = list.createDiv();
                    row.setCssStyles({ display: 'flex', gap: '8px', alignItems: 'center' });

                    let pattern = "", icon = "", priority = "";
                    const match = rule.match(/^(.*?)\s*=\s*(.*?)\s*(?:@(\d+))?$/);
                    if (match) {
                        pattern = match[1].trim();
                        icon = match[2].trim();
                        priority = match[3] ? match[3].trim() : "";
                    } else {
                        pattern = rule; // fallback
                    }

                    const patInp = row.createEl('input', { type: 'text', placeholder: 'Regex / Name (e.g. Work)' });
                    patInp.value = pattern;
                    patInp.setCssStyles({ flex: '2', fontFamily: 'var(--font-monospace)' });

                    const iconBtn = row.createEl('button');
                    iconBtn.setCssStyles({ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' });

                    const setIconBtnVisuals = (currentIcon: string) => {
                        iconBtn.empty();
                        if (this.plugin.iconManager.isEmojiIcon(currentIcon)) {
                            iconBtn.setText(currentIcon || "Choose icon");
                        } else if (currentIcon) {
                            const svg = this.plugin.iconManager.getIconSvg(currentIcon, false);
                            if (svg) {
                                // eslint-disable-next-line no-unsanitized/method -- Contextual fragment is safe here as svg content comes from curated internal asset maps or local files
                                const frag = activeDocument.createRange().createContextualFragment(svg);
                                const svgEl = frag.querySelector('svg');
                                if (svgEl) {
                                    (svgEl as unknown as HTMLElement).setCssStyles({ width: '16px', height: '16px', color: 'currentColor' });
                                    iconBtn.appendChild(svgEl);
                                }
                            } else {
                                iconBtn.setText(currentIcon);
                            }
                        } else {
                            iconBtn.setText("Choose icon");
                        }
                    };
                    setIconBtnVisuals(icon);

                    const prioInp = row.createEl('input', { type: 'number', placeholder: '1-100' });
                    prioInp.min = "1";
                    prioInp.max = "100";
                    prioInp.title = "Priority (1-100). Minimum 1, maximum 100.";
                    prioInp.value = priority;
                    prioInp.setCssStyles({ width: '70px' });

                    const updateRule = () => {
                        const p = patInp.value.trim();
                        let pr = prioInp.value.trim();

                        let prNum = parseInt(pr);
                        if (!isNaN(prNum)) {
                            if (prNum < 1) prNum = 1;
                            if (prNum > 100) prNum = 100;
                            pr = prNum.toString();
                            prioInp.value = pr;
                        }

                        if (p && icon) {
                            rules[index] = `${p} = ${icon}${pr ? ' @' + pr : ''}`;
                            void saveRules();
                        }
                    };

                    iconBtn.onclick = () => {
                        new IconPickerModal(this.app, this.plugin, icon, (selectedIcon) => {
                            icon = selectedIcon;
                            setIconBtnVisuals(icon);
                            updateRule();
                        }).open();
                    };

                    patInp.onchange = updateRule;
                    prioInp.onchange = updateRule;

                    const delBtn = row.createEl('button', { text: '×' });
                    delBtn.setCssStyles({ color: 'var(--text-error)', cursor: 'pointer', border: 'none', background: 'transparent' });
                    delBtn.onclick = () => {
                        rules.splice(index, 1);
                        void saveRules().then(() => renderRulesUI());
                    };
                });

                if (rules.length === 0) {
                    list.createDiv({ text: 'No custom rules defined.' }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' });
                }

                addBtn.onclick = () => {
                    rules.push("New_Rule = 🌟 @100");
                    void saveRules().then(() => renderRulesUI());
                };
            };

            renderRulesUI();
        }



        const typeCard = makeCard(generalPanel, "Aa", t("settings.card.path_typography"));

        new obsidian.Setting(typeCard)
            .setName(t('settings.collapse_indicator.name'))
            .setDesc(t('settings.collapse_indicator.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCollapseIndicator !== false)
                .onChange(async (value) => {
                    this.plugin.settings.showCollapseIndicator = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_folderBorderRadius: obsidian.SliderComponent;
        new obsidian.Setting(typeCard)
            .setName(t('settings.folder_border_radius.name'))
            .setDesc(t('settings.folder_border_radius.desc'))
            .addSlider(slider => {
                sliderComp_folderBorderRadius = slider;
                slider
                .setLimits(0, 40, 1)
                .setValue(this.plugin.settings.folderBorderRadius ?? 6)
                .onChange(async (value) => {
                    this.plugin.settings.folderBorderRadius = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.folderBorderRadius = DEFAULT_SETTINGS.folderBorderRadius;
                sliderComp_folderBorderRadius.setValue(DEFAULT_SETTINGS.folderBorderRadius);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_pathLineThickness: obsidian.SliderComponent;
        new obsidian.Setting(typeCard)
            .setName(t('settings.path_line_thickness.name'))
            .setDesc(t('settings.path_line_thickness.desc'))
            .addSlider(slider => {
                sliderComp_pathLineThickness = slider;
                slider
                .setLimits(0, 50, 0.5)
                .setValue(this.plugin.settings.pathLineThickness ?? 3)


                .onChange(async (value) => {
                    this.plugin.settings.pathLineThickness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.pathLineThickness = DEFAULT_SETTINGS.pathLineThickness;
                sliderComp_pathLineThickness.setValue(DEFAULT_SETTINGS.pathLineThickness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(typeCard)
            .setName(t('settings.show_item_counters.name'))
            .setDesc(t('settings.show_item_counters.desc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(typeCard)
            .setName(t('settings.spaced_text.name'))
            .setDesc(t('settings.spaced_text.desc'))
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None')
                .addOption('both', 'Both folders and files')
                .addOption('folders', 'Folders only')
                .addOption('files', 'Files only')
                .setValue(this.plugin.settings.spacedTextMode || 'none')
                .onChange(async (value) => {
                    this.plugin.settings.spacedTextMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(typeCard)
            .setName(t('settings.rainbow_root_text.name'))
            .setDesc(t('settings.rainbow_root_text.desc'))
            .addToggle(toggle => toggle
                .setValue(Boolean(this.plugin.settings.rainbowRootText))
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));






        new obsidian.Setting(typeCard)
            .setName('Rainbow root text')
            .setDesc('Applies a vivid rainbow-text horizontal gradient to all top-level folders.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootText)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();

                    (this as unknown as { display: () => void }).display();
                }));

        if (this.plugin.settings.rainbowRootText) {


            new obsidian.Setting(typeCard)
                .setName('Transparent root background')
                .setDesc('Keeps the root text effect but removes the solid/translucent background box.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.rainbowRootBgTransparent)
                    .onChange(async (value) => {
                        this.plugin.settings.rainbowRootBgTransparent = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));
        }

        const tuneCard = makeCard(generalPanel, "🎛️", "Advanced tuning");

        let sliderComp_rootOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t('settings.root_opacity.name'))
            .setDesc(t('settings.root_opacity.desc'))
            .addSlider(slider => {
                sliderComp_rootOpacity = slider;
                slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.rootOpacity * 100)


                .onChange(async (value) => {
                    this.plugin.settings.rootOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.rootOpacity = DEFAULT_SETTINGS.rootOpacity;
                sliderComp_rootOpacity.setValue(DEFAULT_SETTINGS.rootOpacity * 100);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_subfolderOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t('settings.subfolder_opacity.name'))
            .setDesc(t('settings.subfolder_opacity.desc'))
            .addSlider(slider => {
                sliderComp_subfolderOpacity = slider;
                slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.subfolderOpacity * 100)

                .onChange(async (value) => {
                    this.plugin.settings.subfolderOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t('common.reset_to_default')).onClick(async () => {
                this.plugin.settings.subfolderOpacity = DEFAULT_SETTINGS.subfolderOpacity;
                sliderComp_subfolderOpacity.setValue(DEFAULT_SETTINGS.subfolderOpacity * 100);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_tintOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t('settings.tint_opacity.name'))
            .setDesc(t('settings.tint_opacity.desc'))
            .addSlider(slider => {
                sliderComp_tintOpacity = slider;
                slider
                .setLimits(0, 100, 1)
                .setValue(this.plugin.settings.tintOpacity * 100)

                .onChange(async (value) => {
                    this.plugin.settings.tintOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.tintOpacity = DEFAULT_SETTINGS.tintOpacity;
                sliderComp_tintOpacity.setValue(DEFAULT_SETTINGS.tintOpacity * 100);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));


        let sliderComp_fileBackgroundOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t('settings.file_bg_opacity.name'))
            .setDesc(t('settings.file_bg_opacity.desc'))
            .addSlider(slider => {
                sliderComp_fileBackgroundOpacity = slider;
                slider
                .setLimits(0, 100, 1)
                .setValue((this.plugin.settings.fileBackgroundOpacity !== undefined ? this.plugin.settings.fileBackgroundOpacity : 0.1) * 100)

                .onChange(async (value) => {
                    this.plugin.settings.fileBackgroundOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                const defVal = DEFAULT_SETTINGS.fileBackgroundOpacity !== undefined ? DEFAULT_SETTINGS.fileBackgroundOpacity : 0.1;
                this.plugin.settings.fileBackgroundOpacity = defVal;
                sliderComp_fileBackgroundOpacity.setValue(defVal * 100);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        const stealthCard = makeCard(sysPanel, "🔏", t("settings.card.privacy"));
        const isLocked = !!(this.plugin.settings.vaultPassword && this.plugin.settings.isVaultLocked);

        if (this.plugin.settings.vaultPassword) {
            new obsidian.Setting(stealthCard)
                .setName(isLocked ? t("settings.vault_locked") : t("settings.vault_unlocked"))
                .setDesc(isLocked ? t("settings.vault_locked_desc") : t("settings.vault_unlocked_desc"))
                .addButton(btn => {
                    if (isLocked) {
                        btn.setButtonText(t("settings.unlock"))
                            .setCta()
                            .onClick(() => {
                                new PasswordModal(this.app, t("settings.unlock"), async (pass) => {
                                    if (pass === this.plugin.settings.vaultPassword) {
                                        this.plugin.settings.isVaultLocked = false;
                                        await this.plugin.saveSettings();
                                        new obsidian.Notice(t("settings.vault_unlocked"));

                                        (this as unknown as { display: () => void }).display();
                                        return true;
                                    } else {
                                        new obsidian.Notice("Incorrect password!");
                                        return false;
                                    }
                                }).open();
                            });
                    } else {
                        btn.setButtonText(t("settings.lock_now"))
                            .onClick(async () => {
                                this.plugin.settings.isVaultLocked = true;
                                await this.plugin.saveSettings();
                                new obsidian.Notice(t("settings.vault_locked"));

                                (this as unknown as { display: () => void }).display();
                            });
                    }
                });
        }

        if (isLocked) {
            const lockedContainer = stealthCard.createDiv({ cls: 'cf-locked-container' });
            lockedContainer.setCssStyles({
                padding: "30px", textAlign: "center", background: "var(--background-secondary-alt)",
                borderRadius: "8px", border: "1px dashed var(--background-modifier-border)",
                marginTop: "15px"
            });
            lockedContainer.createDiv({ text: "🔒", cls: "cf-lock-icon" }).setCssStyles({ fontSize: "2em", marginBottom: "10px" });
            lockedContainer.createDiv({ text: t("settings.settings_protected") }).setCssStyles({ fontWeight: "bold", marginBottom: "4px" });
            lockedContainer.createDiv({ text: t("settings.enter_password_desc") }).setCssStyles({ opacity: "0.5", fontSize: "0.85em" });
        } else {
            new obsidian.Setting(stealthCard)
                .setName(t('settings.ghost_mode.name'))
                .setDesc(t('settings.ghost_mode.desc'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showHiddenItems)
                    .onChange(async (value) => {
                        this.plugin.settings.showHiddenItems = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(stealthCard)
                .setName(t('settings.vault_password.name'))
                .setDesc(t('settings.vault_password.desc'))
                .addText(text => {
                    text.setPlaceholder('Enter password...')
                        .setValue(this.plugin.settings.vaultPassword || "")
                        .onChange(async (value) => {
                            this.plugin.settings.vaultPassword = value;
                            if (!value) this.plugin.settings.isVaultLocked = false;
                            await this.plugin.saveSettings();
                        });

                    // Immediately refresh UI when leaving the input so 'Lock' button appears
                    text.inputEl.onblur = () => {

                        (this as unknown as { display: () => void }).display();
                    };
                    text.inputEl.type = "password";
                });

            new obsidian.Setting(stealthCard)
                .setName(t('settings.show_ribbon.name'))
                .setDesc(t('settings.show_ribbon.desc'))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshRibbon();
                    }));

            const stealthTip = stealthCard.createDiv({ cls: 'cf-settings-tip' });
            stealthTip.setCssStyles({
                marginTop: '15px', padding: '10px', background: 'var(--background-secondary-alt)',
                borderRadius: '6px', borderLeft: '3px solid var(--interactive-accent)', fontSize: '0.85em', opacity: '0.8'
            });
            stealthTip.setText("💡 Tip: You can also use the 'Toggle stealth mode' command (e.g., Ctrl+Shift+Q). This can be customized in Obsidian's hotkey settings.");

            const hiddenListContainer = stealthCard.createDiv({ cls: 'cf-hidden-list-container' });
            hiddenListContainer.setCssStyles({ marginTop: "20px" });
            hiddenListContainer.createEl("h4", { text: t("settings.hidden_items") }).setCssStyles({ marginBottom: "10px", fontSize: "0.9em", opacity: "0.8" });

            const hiddenList = hiddenListContainer.createDiv({ cls: 'cf-hidden-items-list' });
            hiddenList.setCssStyles({
                padding: '12px', background: 'var(--background-secondary)',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)',
                maxHeight: "200px", overflowY: "auto"
            });

            const hiddenEntries = Object.entries(this.plugin.settings.customFolderColors)
                .filter(([_, style]) => typeof style === 'object' && style.isHidden);

            if (hiddenEntries.length === 0) {
                hiddenList.createDiv({ text: t("settings.no_hidden_items"), cls: "cf-empty-state" }).setCssStyles({ opacity: "0.4", fontSize: "0.85em", textAlign: "center" });
            } else {
                hiddenEntries.forEach(([path, style]) => {
                    const row = hiddenList.createDiv({ cls: 'cf-hidden-row' });
                    row.setCssStyles({
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: "1px solid var(--background-modifier-border-soft)"
                    });
                    row.createDiv({ text: path }).setCssStyles({ fontSize: '0.85em', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px" });

                    const unhideBtn = row.createEl("button", { text: t("settings.unhide") });
                    unhideBtn.setCssStyles({ padding: "2px 8px", fontSize: "0.8em" });
                    unhideBtn.onclick = async () => {
                        if (typeof style === 'object') {
                            style.isHidden = false;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();

                            (this as unknown as { display: () => void }).display();
                        }
                    };
                });
            }
        }

        const dbCard = makeCard(sysPanel, "🗄️", t("settings.card.database_management"));
        new obsidian.Setting(dbCard)
            .setName(t('settings.clean_stale.name'))
            .setDesc(t('settings.clean_stale.desc'))
            .addButton(btn => btn
                .setButtonText(t('settings.clean_stale.btn'))
                .onClick(async () => {
                    await this.plugin.cleanUnusedStyles();

                    (this as unknown as { display: () => void }).display();
                }));

        const triggerDownload = (data: Record<string, unknown>, filename: string) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const doc = this.containerEl.ownerDocument;
            const a = this.containerEl.createEl("a");
            a.setCssStyles({ display: 'none' });
            a.href = url;
            a.download = filename;
            doc.body.appendChild(a);
            a.click();
            window.setTimeout(() => {
                if (doc.body.contains(a)) doc.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
        };

        new obsidian.Setting(dbCard)
            .setName(t('settings.backup_folders.name'))
            .setDesc(t('settings.backup_folders.desc'))
            .addButton(btn => btn
                .setButtonText(t('settings.backup_folders.btn'))
                .onClick(() => {
                    const folderData: Record<string, FolderStyle | string> = {};
                    for (const [key, value] of Object.entries(this.plugin.settings.customFolderColors)) {
                        if (typeof value === 'string') {
                            folderData[key] = value;
                        } else if (value && typeof value === 'object') {
                            const folderProps = { ...value };
                            delete folderProps.hasDivider;
                            delete folderProps.dividerText;
                            delete folderProps.dividerColor;
                            delete folderProps.dividerAlignment;
                            delete folderProps.dividerLineStyle;
                            delete folderProps.dividerIcon;
                            delete folderProps.dividerIconColor;
                            delete folderProps.dividerUpper;
                            delete folderProps.dividerGlass;
                            delete folderProps.dividerIconPosition;
                            delete folderProps.dividerPillMode;
                            delete folderProps.dividerDescription;
                            delete folderProps.dividerPillColor;
                            delete folderProps.dividerLinePaddingLeft;
                            delete folderProps.dividerLinePaddingRight;
                            if (Object.keys(folderProps).length > 0) folderData[key] = folderProps;
                        }
                    }
                    triggerDownload({ type: "cf-folder-backup", version: "1.0", data: folderData, presets: this.plugin.settings.presets }, "colorful-folders-backup.json");
                }));

        new obsidian.Setting(dbCard)
            .setName(t('settings.backup_dividers.name'))
            .setDesc(t('settings.backup_dividers.desc'))
            .addButton(btn => btn
                .setButtonText(t('settings.backup_dividers.btn'))
                .onClick(() => {
                    const dividerData: Record<string, FolderStyle> = {};
                    for (const [key, value] of Object.entries(this.plugin.settings.customFolderColors)) {
                        if (value && typeof value === 'object' && value.hasDivider) {
                            const v = value;
                            dividerData[key] = {
                                hasDivider: v.hasDivider,
                                dividerText: v.dividerText,
                                dividerColor: v.dividerColor,
                                dividerAlignment: v.dividerAlignment,
                                dividerLineStyle: v.dividerLineStyle,
                                dividerIcon: v.dividerIcon,
                                dividerIconColor: v.dividerIconColor,
                                dividerUpper: v.dividerUpper,
                                dividerGlass: v.dividerGlass,
                                dividerIconPosition: v.dividerIconPosition,
                                dividerPillMode: v.dividerPillMode,
                                dividerDescription: v.dividerDescription,
                                dividerPillColor: v.dividerPillColor,
                                dividerLinePaddingLeft: v.dividerLinePaddingLeft,
                                dividerLinePaddingRight: v.dividerLinePaddingRight
                            };
                        }
                    }
                    triggerDownload({ type: "cf-divider-backup", version: "1.0", data: dividerData }, "colorful-dividers-backup.json");
                }));

        new obsidian.Setting(dbCard)
            .setName(t('settings.restore.name'))
            .setDesc(t('settings.restore.desc'))
            .addButton(btn => btn
                .setButtonText(t('settings.restore.btn'))
                .onClick(() => {
                    const doc = this.containerEl.ownerDocument;
                    const input = this.containerEl.createEl('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.setCssStyles({ display: 'none' });
                    doc.body.appendChild(input);

                    input.onchange = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        if (!target.files || target.files.length === 0) {
                            if (doc.body.contains(input)) doc.body.removeChild(input);
                            return;
                        }
                        const file = target.files[0];
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                interface BackupData {
                                    type?: string;
                                    version?: string;
                                    data?: Record<string, FolderStyle | string>;
                                    presets?: Record<string, FolderStyle>;
                                }
                                const result = e.target?.result as string;
                                if (!result) throw new Error("File is empty");

                                const parsed = JSON.parse(result) as BackupData;
                                if (!parsed || typeof parsed !== 'object') {
                                    new obsidian.Notice("Invalid backup file format.");
                                    return;
                                }

                                if (parsed.type === "cf-folder-backup") {
                                    if (parsed.data && typeof parsed.data === 'object') {
                                        for (const [key, val] of Object.entries(parsed.data)) {
                                            if (typeof val === 'string') {
                                                this.plugin.settings.customFolderColors[key] = val;
                                            } else if (val && typeof val === 'object') {
                                                const existing = this.plugin.settings.customFolderColors[key];
                                                if (existing && typeof existing === 'object') {
                                                    this.plugin.settings.customFolderColors[key] = { ...existing, ...val };
                                                } else {
                                                    this.plugin.settings.customFolderColors[key] = val;
                                                }
                                            }
                                        }
                                    }
                                    if (parsed.presets && typeof parsed.presets === 'object') {
                                        this.plugin.settings.presets = { ...this.plugin.settings.presets, ...parsed.presets };
                                    }
                                    new obsidian.Notice("Folder styles backup restored successfully!");
                                } else if (parsed.type === "cf-divider-backup") {
                                    if (parsed.data && typeof parsed.data === 'object') {
                                        for (const [key, val] of Object.entries(parsed.data)) {
                                            if (val && typeof val === 'object') {
                                                const existing = this.plugin.settings.customFolderColors[key];
                                                if (existing && typeof existing === 'object') {
                                                    this.plugin.settings.customFolderColors[key] = { ...existing, ...val };
                                                } else if (typeof existing === 'string') {
                                                    this.plugin.settings.customFolderColors[key] = { hex: existing, ...val };
                                                } else {
                                                    this.plugin.settings.customFolderColors[key] = val;
                                                }
                                            }
                                        }
                                    }
                                    new obsidian.Notice("Dividers backup restored successfully!");
                                } else {
                                    new obsidian.Notice("Invalid backup file format.");
                                    return;
                                }
                                await this.plugin.saveSettings();
                                this.plugin.generateStylesDebounced();
                                this.plugin.dividerManager.syncDividers();

                                (this as unknown as { display: () => void }).display();
                            } catch (err) {
                                console.error(err);
                                new obsidian.Notice("Failed to parse backup file.");
                            } finally {
                                if (doc.body.contains(input)) {
                                    doc.body.removeChild(input);
                                }
                            }
                        };
                        reader.readAsText(file);
                    };
                    input.click();
                }));

        new obsidian.Setting(dbCard)
            .setName(t('settings.reset_styles.name'))
            .setDesc(t('settings.reset_styles.desc'))
            .addButton(btn => {
                btn.setButtonText(t('settings.reset_styles.btn'));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, t('settings.reset_styles.name'), "Are you sure you want to delete all custom styling and presets? This cannot be undone.", async () => {
                        this.plugin.settings.customFolderColors = {};
                        this.plugin.settings.presets = {};
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        new obsidian.Notice(t('notice.styles_reset'));

                        (this as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        new obsidian.Setting(dbCard)
            .setName(t('settings.factory_reset.name'))
            .setDesc(t('settings.factory_reset.desc'))
            .addButton(btn => {
                btn.setButtonText(t('settings.factory_reset.btn'));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, t('settings.factory_reset.name'), "Are you sure you want to restore all settings to default? This will wipe ALL your customization!", async () => {
                        this.plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ColorfulFoldersSettings;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        this.plugin.dividerManager.clean();
                        this.plugin.dividerManager.syncDividers();
                        new obsidian.Notice(t('notice.factory_reset'));

                        (this as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        const sponsorCard = makeCard(sysPanel, "❤️", t("settings.card.support_dev"));
        sponsorCard.createEl('p', {
            text: t('settings.support_dev_desc')
        }).setCssStyles({ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: '12px' });

        const iframeWrap = sponsorCard.createDiv();
        iframeWrap.setCssStyles({ display: 'flex', justifyContent: 'center', padding: '8px 0' });

        const iframe = iframeWrap.createEl('iframe');
        iframe.src = 'https://github.com/sponsors/RohitNahar-Offical/button';
        iframe.title = 'Sponsor rohitnahar-offical';
        iframe.height = '32';
        iframe.width = '114';
        iframe.setCssStyles({ border: '0', borderRadius: '6px' });
        iframeWrap.appendChild(iframe);

    }

    async processIconData(data: Record<string, unknown>) {
        let count = 0;
        const icons = data.icons as Record<string, { width?: number; height?: number; left?: number; top?: number; body?: string }> | undefined;
        if (icons && (data.prefix || data.info)) {
            const prefix = (data.prefix as string) || "cf";
            const commonW = (data.width as number) || 24;
            const commonH = (data.height as number) || 24;

            const processIcon = (name: string, iconData: { width?: number; height?: number; left?: number; top?: number; body?: string }) => {
                const id = `${prefix}-${name}`;
                const w = iconData.width || commonW;
                const h = iconData.height || commonH;
                const l = iconData.left || 0;
                const t = iconData.top || 0;
                const body = iconData.body;
                if (!body) return false;

                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l} ${t} ${w} ${h}">${body}</svg>`;
                this.plugin.settings.customIcons[id] = svg;
                return true;
            };

            for (const [name, iconData] of Object.entries(icons)) {
                if (processIcon(name, iconData)) count++;
            }

            const aliases = data.aliases as Record<string, { parent: string; width?: number; height?: number; left?: number; top?: number; body?: string }> | undefined;
            if (aliases) {
                for (const [aliasName, aliasData] of Object.entries(aliases)) {
                    const targetName = aliasData.parent;
                    const targetData = icons[targetName];
                    if (targetData) {
                        const merged = { ...targetData, ...aliasData };
                        if (processIcon(aliasName, merged)) count++;
                    }
                }
            }
        } else {
            for (const [id, svg] of Object.entries(data)) {
                if (typeof svg === 'string' && svg.startsWith('<svg')) {
                    this.plugin.settings.customIcons[id] = svg;
                    count++;
                }
            }
        }
        this.plugin.registerCustomIcons();
        await this.plugin.saveSettings();
        return count;
    }


    async importUrl(url: string) {
        if (!url) return;
        try {
            const res = await obsidian.requestUrl({ url });
            const data = res.json as Record<string, unknown>;
            const count = await this.processIconData(data);
            new obsidian.Notice(`Successfully imported ${count} icons!`);

            (this as unknown as { display: () => void }).display();
        } catch (e) {
            new obsidian.Notice("Import failed. See console for details.");
            console.error("Colorful Folders: Import error", e);
        }
    }
}


