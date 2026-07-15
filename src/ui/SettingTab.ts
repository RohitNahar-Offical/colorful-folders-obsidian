import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle, ColorfulFoldersSettings } from '../common/types';
import { DEFAULT_SETTINGS } from '../common/constants';
import { PasswordModal } from './modals/PasswordModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { IconPickerModal } from './modals/IconPickerModal';
import { createVisualColorPicker } from './components/ColorPicker';
import { parseColorToHexAlpha, hexAlphaToRgba } from '../common/utils';


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

        const btnGen = tabBar.createEl("button", { text: "General", cls: 'cf-tab-btn' });
        const btnInt = tabBar.createEl("button", { text: "Features", cls: 'cf-tab-btn' });
        const btnIcon = tabBar.createEl("button", { text: "Icons", cls: 'cf-tab-btn' });
        const btnSys = tabBar.createEl("button", { text: "Privacy", cls: 'cf-tab-btn' });

        const setHeroInfo = (t: string) => {
            if (t === "gen") { heroTitle.setText("Visual design"); heroSubtitle.setText("Tailor your vault's interface with premium palettes and refined structural aesthetics."); }
            if (t === "int") { heroTitle.setText("Features"); heroSubtitle.setText("Unlock powerful custom features and connect with external extensions."); }
            if (t === "icon") { heroTitle.setText("Icon management"); heroSubtitle.setText("Command a vast library of symbols with intelligent automation rules."); }
            if (t === "sys") { heroTitle.setText("Privacy"); heroSubtitle.setText("Configure telemetry preferences and data management settings."); }
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
            const previewEl = this.plugin.dividerManager.buildDividerNode('preview-path', {
                dividerText: 'Preview section',
                dividerColor: 'var(--interactive-accent)',
                hasDivider: true
            }, activeDocument);

            previewEl.setCssStyles({
                position: 'relative', top: '0', left: '0', width: '100%', margin: '0', pointerEvents: 'none'
            });
            dividerContainer.appendChild(previewEl);
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
        infoContent.createEl('h4', { text: 'Context menu overrides' });
        const infoText = infoContent.createEl('p');
        infoText.appendText('Right-click any folder or file in the explorer and click ');
        infoText.createEl('strong', { text: '"set custom style"' });
        infoText.appendText(' to assign specific unique colors or icons, or click ');
        infoText.createEl('strong', { text: '"add divider"' });
        infoText.appendText(' to insert horizontal section separators!');

        const genCard = makeCard(generalPanel, "🎨", "Global visual palette");
        let globalBgPickerWrap: HTMLElement | null = null;
        let globalBgTextComp: obsidian.TextComponent;
        let globalBgSwatch: HTMLElement;

        new obsidian.Setting(genCard)
            .setName('Light mode palette')
            .setDesc('Select a curated color scheme for your vault in light mode.')
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
            .setName('Dark mode palette')
            .setDesc('Select a curated color scheme for your vault in dark mode.')
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
            .setName('Custom colors (hex)')
            .setDesc('Your custom palette colors. Click a swatch to pick visually, or type a hex code directly. Only active when "custom palette" is selected above.');

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
        header.createSpan({ text: 'Palette colors' }).setCssStyles({
            fontWeight: '600',
            fontSize: '1.0em',
            color: 'var(--text-normal)'
        });

        const btnContainer = header.createDiv();
        btnContainer.setCssStyles({
            display: 'flex',
            gap: '10px'
        });

        const resetBtn = btnContainer.createEl('button', { text: 'Reset' });
        resetBtn.setCssStyles({
            cursor: 'pointer'
        });

        const addColorBtn = btnContainer.createEl('button', { text: '+ add color' });
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
        pickerPlaceholder.setText('Click a color to edit');

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
            .setName('Folder exclusion list')
            .setDesc('Comma-separated list of folder names to ignore. Note: folder names are case-insensitive.')
            .addText(text => text
                .setPlaceholder('Example templates')
                .setValue(this.plugin.settings.exclusionList || "")
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName('Color generation mode')
            .setDesc('Cycle assigns colors sequentially. Monochromatic uses depth-based shading. Heatmap colors folders based on the most recently modified file inside.')
            .addDropdown(drop => drop
                .addOption('cycle', 'Rainbow cycle')
                .addOption('monochromatic', 'Monochromatic depth')
                .addOption('heatmap', 'Activity heatmap')
                .setValue(this.plugin.settings.colorMode)
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName('Global default background')
            .setDesc('Set a universal background color for all folders/files that do not have a custom style. Leave empty for theme-default (transparent).')
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

        if (this.plugin.settings.colorMode === 'cycle') {
            let sliderComp_cycleOffset: obsidian.SliderComponent;
        new obsidian.Setting(genCard)
                .setName('Rainbow cycle offset')
                .setDesc('Shift the starting color index for the rainbow cycle.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.cycleOffset = DEFAULT_SETTINGS.cycleOffset;
                sliderComp_cycleOffset.setValue(DEFAULT_SETTINGS.cycleOffset);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));
        }


        new obsidian.Setting(genCard)
            .setName('Root folder appearance')
            .setDesc('Solid uses vivid backgrounds for root folders. Translucent provides a softer, glowing look.')
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
            .setName('Glassmorphism blur')
            .setDesc('Adds an iOS-style backdrop blur to folder backgrounds. Best with semi-translucent themes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.glassmorphism)
                .onChange(async (value) => {
                    this.plugin.settings.glassmorphism = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        const activeCard = makeCard(generalPanel, "✨", "Active item appearance");
        new obsidian.Setting(activeCard)
            .setName('Luminous active glow')
            .setDesc('Apply a modern glowing selection style and subtle scale effect to the active file/folder in the explorer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow !== false)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(activeCard)
            .setName('Use custom active file box colors')
            .setDesc('Enable this to override the background and text color of the active (currently selected) file box.')
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

            new obsidian.Setting(bgRow)
                .setName('Active background color')
                .setDesc('The background color for the currently selected file.')
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip('Open visual color picker')
                    .onClick(() => {
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
                    }))
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
                    bgColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', backgroundColor: this.plugin.settings.customActiveBg || 'transparent'
                    });
                });

            const textRow = activeCard.createDiv();
            let textPickerWrap: HTMLElement | null = null;
            let textColorBox: HTMLElement;
            let textColorTextComp: obsidian.TextComponent;

            new obsidian.Setting(textRow)
                .setName('Active text color')
                .setDesc('The text color for the currently selected file.')
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip('Open visual color picker')
                    .onClick(() => {
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
                    }))
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
                    textColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', backgroundColor: this.plugin.settings.customActiveText || 'transparent'
                    });
                });
        }

        const visCard = makeCard(generalPanel, "👁️", "Appearance and visibility");
        let sliderComp_lightModeBrightness: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName('Light mode brightness (%)')
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
            .setName('Dark mode brightness (%)')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.darkModeBrightness = DEFAULT_SETTINGS.darkModeBrightness;
                sliderComp_darkModeBrightness.setValue(DEFAULT_SETTINGS.darkModeBrightness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName('Outline only mode')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(visCard)
            .setName('Auto-color files (backgrounds)')
            .setDesc('Automatically apply background tints to files to match their parent folder.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoColorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.autoColorFiles = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_iconScale: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName('Global icon scaling')
            .setDesc('Multiplies the size of all folder and file icons (default 1.0). Range: 0.5 to 2.5.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.iconScale = DEFAULT_SETTINGS.iconScale;
                sliderComp_iconScale.setValue(DEFAULT_SETTINGS.iconScale);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName('Icon debug mode')
            .setDesc('Logs icon matching logic to the developer console. Useful if auto-icons are not appearing as expected.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.iconDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.iconDebugMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(visCard)
            .setName('Wrap metadata to next line (desktop)')
            .setDesc('Forces file counts, word counts, and other plugin metadata to wrap to the next line on desktop. (This is always enabled automatically on mobile devices).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.wrapMetadata || false)
                .onChange(async (value) => {
                    this.plugin.settings.wrapMetadata = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(visCard)
            .setName('Show collapse indicator')
            .setDesc('Toggle the visibility of folder collapse indicators (arrows) in the file explorer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCollapseIndicator !== false)
                .onChange(async (value) => {
                    this.plugin.settings.showCollapseIndicator = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_folderBorderRadius: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName('Folder border radius')
            .setDesc('Adjust the corner roundness of folder backgrounds in the explorer (default 6px).')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.folderBorderRadius = DEFAULT_SETTINGS.folderBorderRadius;
                sliderComp_folderBorderRadius.setValue(DEFAULT_SETTINGS.folderBorderRadius);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        const autoCard = makeCard(iconPanel, "🤖", "Automation engine");
        new obsidian.Setting(autoCard)
            .setName('Enable automatic icons')
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
                .setName('Wide icon rendering (lucide svgs)')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(autoCard)
                .setName('Icon variety mode')
                .setDesc('Assigns different icons to items within the same category for better visual distinction.')
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
                    .setName('Shuffle icons')
                    .setDesc('Randomize the global seed used for assigning variety icons. If you dislike the current distribution, click this to re-roll them all!')
                    .addButton(button => button
                        .setButtonText('Shuffle icons')
                        .onClick(async () => {
                            this.plugin.settings.varietySeed = Math.floor(Math.random() * 1000000);
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }));
            }

            new obsidian.Setting(autoCard)
                .setName('Default closed folder icon')
                .setDesc('Customize the default icon shown for closed folders when auto-icons are enabled.')
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultClosedFolderIcon || "lucide-folder");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultClosedFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText("Choose").onClick(() => {
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
                .setName('Default open folder icon')
                .setDesc('Customize the default icon shown for open folders when auto-icons are enabled.')
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultOpenFolderIcon || "lucide-folder-open");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultOpenFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText("Choose").onClick(() => {
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
                header.createEl('h4', { text: 'Active rules' }).setCssStyles({ margin: '0' });

                const addBtn = header.createEl('button', { text: 'Add rule', cls: 'mod-cta' });

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



        const typeCard = makeCard(generalPanel, "Aa", "Path and typography");
        let sliderComp_pathLineThickness: obsidian.SliderComponent;
        new obsidian.Setting(typeCard)
            .setName('Path line thickness')
            .setDesc('Adjust the thickness of vertical indentation lines and active borders.')
            .addSlider(slider => {
                sliderComp_pathLineThickness = slider;
                slider
                .setLimits(1, 10, 0.5)
                .setValue(this.plugin.settings.pathLineThickness ?? 3)


                .onChange(async (value) => {
                    this.plugin.settings.pathLineThickness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.pathLineThickness = DEFAULT_SETTINGS.pathLineThickness;
                sliderComp_pathLineThickness.setValue(DEFAULT_SETTINGS.pathLineThickness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(typeCard)
            .setName('Show item counters')
            .setDesc('Displays recursive folder and file counts next to folder names.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(typeCard)
            .setName('Spaced text (monofont feel)')
            .setDesc('Adds slight letter and word spacing for a structured, monospaced layout feel.')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None')
                .addOption('both', 'Both folders and files')
                .addOption('folders', 'Folders only')
                .addOption('files', 'Files only')
                .setValue(this.plugin.settings.spacedTextMode ?? 'folders')
                .onChange(async (value) => {
                    this.plugin.settings.spacedTextMode = value;
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
            .setName('Root opacity (%)')
            .setDesc('Transparency of top-level folders in file explorer.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.rootOpacity = DEFAULT_SETTINGS.rootOpacity;
                sliderComp_rootOpacity.setValue(DEFAULT_SETTINGS.rootOpacity);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_subfolderOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName('Subfolder opacity (%)')
            .setDesc('Transparency of nested subfolders.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.subfolderOpacity = DEFAULT_SETTINGS.subfolderOpacity;
                sliderComp_subfolderOpacity.setValue(DEFAULT_SETTINGS.subfolderOpacity);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_tintOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName('Opened folder backing tint (%)')
            .setDesc('Controls how highly tinted the background content space becomes when you open a directory.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.tintOpacity = DEFAULT_SETTINGS.tintOpacity;
                sliderComp_tintOpacity.setValue(DEFAULT_SETTINGS.tintOpacity);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));


        let sliderComp_fileBackgroundOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName('File background opacity (%)')
            .setDesc('Global transparency for all auto-colored files (default 10%).')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings.fileBackgroundOpacity = DEFAULT_SETTINGS.fileBackgroundOpacity;
                sliderComp_fileBackgroundOpacity.setValue(DEFAULT_SETTINGS.fileBackgroundOpacity);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        const stealthCard = makeCard(sysPanel, "🔏", "Privacy and stealth");
        const isLocked = !!(this.plugin.settings.vaultPassword && this.plugin.settings.isVaultLocked);

        if (this.plugin.settings.vaultPassword) {
            new obsidian.Setting(stealthCard)
                .setName(isLocked ? "Vault is locked" : "Vault is unlocked")
                .setDesc(isLocked ? "Unlock to manage hidden items and privacy settings." : "Privacy settings are currently accessible.")
                .addButton(btn => {
                    if (isLocked) {
                        btn.setButtonText("Unlock")
                            .setCta()
                            .onClick(() => {
                                new PasswordModal(this.app, "Unlock privacy", async (pass) => {
                                    if (pass === this.plugin.settings.vaultPassword) {
                                        this.plugin.settings.isVaultLocked = false;
                                        await this.plugin.saveSettings();
                                        new obsidian.Notice("Vault unlocked.");

                                        (this as unknown as { display: () => void }).display();
                                        return true;
                                    } else {
                                        new obsidian.Notice("Incorrect password!");
                                        return false;
                                    }
                                }).open();
                            });
                    } else {
                        btn.setButtonText("Lock now")
                            .onClick(async () => {
                                this.plugin.settings.isVaultLocked = true;
                                await this.plugin.saveSettings();
                                new obsidian.Notice("Vault locked.");

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
            lockedContainer.createDiv({ text: "Settings are protected" }).setCssStyles({ fontWeight: "bold", marginBottom: "4px" });
            lockedContainer.createDiv({ text: "Enter your password above to manage hidden folders." }).setCssStyles({ opacity: "0.5", fontSize: "0.85em" });
        } else {
            new obsidian.Setting(stealthCard)
                .setName('Ghost mode')
                .setDesc('Reveal hidden items with low opacity and blur. Note: items are still clickable in this mode.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showHiddenItems)
                    .onChange(async (value) => {
                        this.plugin.settings.showHiddenItems = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(stealthCard)
                .setName('Vault password')
                .setDesc('Set a password to lock the hidden items list and ghost mode. Leave empty to disable.')
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
                .setName('Show ribbon icon')
                .setDesc('Add a quick-toggle icon to the Obsidian sidebar.')
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
            hiddenListContainer.createEl("h4", { text: "Hidden items" }).setCssStyles({ marginBottom: "10px", fontSize: "0.9em", opacity: "0.8" });

            const hiddenList = hiddenListContainer.createDiv({ cls: 'cf-hidden-items-list' });
            hiddenList.setCssStyles({
                padding: '12px', background: 'var(--background-secondary)',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)',
                maxHeight: "200px", overflowY: "auto"
            });

            const hiddenEntries = Object.entries(this.plugin.settings.customFolderColors)
                .filter(([_, style]) => typeof style === 'object' && style.isHidden);

            if (hiddenEntries.length === 0) {
                hiddenList.createDiv({ text: "No items are currently hidden.", cls: "cf-empty-state" }).setCssStyles({ opacity: "0.4", fontSize: "0.85em", textAlign: "center" });
            } else {
                hiddenEntries.forEach(([path, style]) => {
                    const row = hiddenList.createDiv({ cls: 'cf-hidden-row' });
                    row.setCssStyles({
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: "1px solid var(--background-modifier-border-soft)"
                    });
                    row.createDiv({ text: path }).setCssStyles({ fontSize: '0.85em', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px" });

                    const unhideBtn = row.createEl("button", { text: "Unhide" });
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


        const dbCard = makeCard(sysPanel, "🗄️", "Database management");
        new obsidian.Setting(dbCard)
            .setName('Clean unused styles')
            .setDesc('Scans your configuration and removes style entries for folders or files that no longer exist in your vault.')
            .addButton(btn => btn
                .setButtonText('Clean up stale data')
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
            .setName('Backup folder styles')
            .setDesc('Download a backup of your colorful folder and file styles (excludes dividers).')
            .addButton(btn => btn
                .setButtonText('Backup folders')
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
            .setName('Backup dividers')
            .setDesc('Download a backup of your section dividers only.')
            .addButton(btn => btn
                .setButtonText('Backup dividers')
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
            .setName('Restore from backup')
            .setDesc('Restore folder styles or dividers from a previous backup file. This will merge with your current settings.')
            .addButton(btn => btn
                .setButtonText('Restore')
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
            .setName('Reset styles and presets')
            .setDesc('Danger: this will permanently remove all custom colors, icons, and individual folder styles. Presets are also cleared.')
            .addButton(btn => {
                btn.setButtonText('Reset styling');
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Reset styles and presets", "Are you sure you want to delete all custom styling and presets? This cannot be undone.", async () => {
                        this.plugin.settings.customFolderColors = {};
                        this.plugin.settings.presets = {};
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        new obsidian.Notice("Styles and presets have been reset.");

                        (this as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        new obsidian.Setting(dbCard)
            .setName('Factory reset')
            .setDesc('Critical: this will reset every setting in the plugin to its original default state, including opacities, toggles, and all custom data.')
            .addButton(btn => {
                btn.setButtonText('Hard reset everything');
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Factory reset", "Are you sure you want to restore all settings to default? This will wipe ALL your customization!", async () => {
                        this.plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ColorfulFoldersSettings;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        this.plugin.dividerManager.clean();
                        this.plugin.dividerManager.syncDividers();
                        new obsidian.Notice("All settings have been restored to defaults.");

                        (this as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        const sponsorCard = makeCard(sysPanel, "❤️", "Support the developer");
        sponsorCard.createEl('p', {
            text: 'If you enjoy using colorful folders and want to support its continued development, please consider becoming a sponsor!'
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


