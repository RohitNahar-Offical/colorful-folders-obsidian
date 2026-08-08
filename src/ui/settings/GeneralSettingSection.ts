import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { DEFAULT_SETTINGS } from '../../common/constants';
import { createVisualColorPicker } from '../components/ColorPicker';
import { parseColorToHexAlpha, hexAlphaToRgba } from '../../common/utils';

export class GeneralSettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        const infoBlock = containerEl.createDiv('cf-info-block');
        const infoIcon = infoBlock.createDiv('cf-info-icon');
        infoIcon.setText('💡');
        const infoContent = infoBlock.createDiv('cf-info-content');
        infoContent.createEl('h4', { text: 'Context menu overrides' });
        const infoText = infoContent.createEl('p');
        infoText.appendText(t("settings.info.context_menu_desc_1"));
        infoText.createEl('strong', { text: '"set custom style"' });
        infoText.appendText(' to assign specific unique colors or icons, or click ');
        infoText.createEl('strong', { text: '"add divider"' });
        infoText.appendText(' to insert horizontal section separators!');

        // 🎨 Global Visual Palette Card
        const genCard = this.settingTab.makeCard(containerEl, "🎨", "Global visual palette");
        let globalBgPickerWrap: HTMLElement | null = null;
        let globalBgTextComp: obsidian.TextComponent;
        let globalBgSwatch: HTMLElement;

        new obsidian.Setting(genCard)
            .setName(t("settings.palette_light.name"))
            .setDesc('Select a curated color scheme for your vault in light mode.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', t("settings.palette.vibrant_rainbow"))
                .addOption('Muted Dark Mode', t("settings.palette.muted_dark"))
                .addOption('Pastel Dreams', t("settings.palette.pastel_dreams"))
                .addOption('Tailwind UI', t("settings.palette.tailwind_ui"))
                .addOption('Tailwind UI Dark', t("settings.palette.tailwind_ui_dark"))
                .addOption('Custom', t("settings.palette.custom_palette"))
                .setValue(this.plugin.settings.paletteLight || this.plugin.settings.palette || 'Tailwind UI')
                .onChange(async (value) => {
                    this.plugin.settings.paletteLight = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.palette_dark.name"))
            .setDesc('Select a curated color scheme for your vault in dark mode.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', t("settings.palette.vibrant_rainbow"))
                .addOption('Muted Dark Mode', t("settings.palette.muted_dark"))
                .addOption('Pastel Dreams', t("settings.palette.pastel_dreams"))
                .addOption('Tailwind UI', t("settings.palette.tailwind_ui"))
                .addOption('Tailwind UI Dark', t("settings.palette.tailwind_ui_dark"))
                .addOption('Custom', t("settings.palette.custom_palette"))
                .setValue(this.plugin.settings.paletteDark || this.plugin.settings.palette || 'Pastel Dreams')
                .onChange(async (value) => {
                    this.plugin.settings.paletteDark = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.custom_colors.name"))
            .setDesc('Your custom palette colors. Click a swatch to pick visually, or type a hex code directly. Only active when "custom palette" is selected above.');

        const paletteBuilderContainer = genCard.createDiv('cf-palette-builder');
        paletteBuilderContainer.setCssStyles({
            marginTop: '12px',
            background: 'transparent',
            padding: '0'
        });

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
        btnContainer.setCssStyles({ display: 'flex', gap: '10px' });

        const resetBtn = btnContainer.createEl('button', { text: 'Reset' });
        resetBtn.setCssStyles({ cursor: 'pointer' });

        const addColorBtn = btnContainer.createEl('button', { text: '+ add color' });
        addColorBtn.setCssStyles({
            backgroundColor: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            cursor: 'pointer',
            border: 'none'
        });

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
        pickerPlaceholder.setText(t("settings.click_to_edit"));

        let colors = (this.plugin.settings.customPalette || '')
            .split(',')
            .map(c => c.trim())
            .filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
        if (colors.length === 0) colors = ['#eb6f92'];

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
                    hexInp.value = colors[index];
                }
            };

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
                list.createDiv({ text: t("settings.no_colors_defined") }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' });
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

            colors = ['#eb6f92', '#f6c177', '#ea9a97', '#c4a7e7', '#9ccfd8', '#31748f'];
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
            .setName(t("settings.folder_exclusion.name"))
            .setDesc('Comma-separated list of folder names to ignore. Note: folder names are case-insensitive.')
            .addText(text => text
                .setPlaceholder(t("common.example_templates"))
                .setValue(this.plugin.settings.exclusionList || "")
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.color_mode.name"))
            .setDesc('Cycle assigns colors sequentially. Monochromatic uses depth-based shading. Heatmap colors folders based on the most recently modified file inside.')
            .addDropdown(drop => drop
                .addOption('cycle', t("settings.color_mode.cycle"))
                .addOption('monochromatic', t("settings.color_mode.monochromatic"))
                .addOption('heatmap', t("settings.color_mode.heatmap"))
                .addOption('hierarchy', t("settings.color_mode.hierarchy"))
                .setValue(this.plugin.settings.colorMode || 'cycle')
                .onChange(async (value) => {
                    this.plugin.settings.colorMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.file_color_mode.name"))
            .setDesc(t("settings.file_color_mode.desc"))
            .addDropdown(drop => drop
                .addOption('parent', t("settings.file_color_mode.parent"))
                .addOption('folder_scope', t("settings.file_color_mode.folder_scope"))
                .addOption('mixed', t("settings.file_color_mode.mixed"))
                .addOption('sequential', t("settings.file_color_mode.sequential"))
                .addOption('none', t("settings.file_color_mode.none"))
                .setValue(this.plugin.settings.fileColorMode || 'mixed')
                .onChange(async (value) => {
                    this.plugin.settings.fileColorMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.color_text.name"))
            .setDesc('Select which items should have colored text. Choose "none" to only color icons.')
            .addDropdown(drop => drop
                .addOption('all', t("settings.option.all"))
                .addOption('folders', t("settings.option.folders_only"))
                .addOption('files', t("settings.option.files_only"))
                .addOption('none', t("settings.option.none_icons_only"))
                .setValue((this.plugin.settings.colorText === true || this.plugin.settings.colorText === undefined) ? 'all' : (this.plugin.settings.colorText === false ? 'none' : String(this.plugin.settings.colorText)))
                .onChange(async (value) => {
                    this.plugin.settings.colorText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(genCard)
            .setName(t("settings.global_default_bg.name"))
            .setDesc('Set a universal background color for all folders/files that do not have a custom style. Leave empty for theme-default (transparent).')
            .addButton(btn => btn
                .setIcon('palette')
                .setTooltip(t("common.open_visual_color_picker"))
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
                text.setPlaceholder(t("common.hex_placeholder"))
                    .setValue(this.plugin.settings.globalBackgroundColor || '')
                    .onChange(async (value) => {
                        this.plugin.settings.globalBackgroundColor = value;
                        globalBgSwatch.setCssStyles({ backgroundColor: value || 'transparent' });
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                globalBgSwatch = text.inputEl.parentElement?.createDiv() ?? text.inputEl.insertAdjacentElement('afterend', this.settingTab.containerEl.createDiv()) as HTMLElement;
                globalBgSwatch.setCssStyles({
                    width: '24px', height: '24px', borderRadius: '6px',
                    border: '1px solid var(--background-modifier-border)',
                    backgroundColor: this.plugin.settings.globalBackgroundColor || 'transparent'
                });
            });

        if (this.plugin.settings.colorMode === 'cycle' || this.plugin.settings.colorMode === 'hierarchy') {
            let sliderComp_cycleOffset: obsidian.SliderComponent;
            new obsidian.Setting(genCard)
                .setName(t("settings.rainbow_offset.name"))
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
                .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                    this.plugin.settings.cycleOffset = DEFAULT_SETTINGS.cycleOffset;
                    sliderComp_cycleOffset.setValue(DEFAULT_SETTINGS.cycleOffset);
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));
        }

        new obsidian.Setting(genCard)
            .setName(t("settings.root_appearance.name"))
            .setDesc('Solid uses vivid backgrounds for root folders. Translucent provides a softer, glowing look.')
            .addDropdown(drop => drop
                .addOption('solid', t("settings.option.solid_vivid"))
                .addOption('translucent', t("settings.option.translucent_glow"))
                .setValue(this.plugin.settings.rootStyle)
                .onChange(async (value) => {
                    this.plugin.settings.rootStyle = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        // ✨ Active Item Card
        const activeCard = this.settingTab.makeCard(containerEl, "✨", "Active item appearance");
        new obsidian.Setting(activeCard)
            .setName(t("settings.active_glow.name"))
            .setDesc('Apply a modern glowing selection style and subtle scale effect to the active file/folder in the explorer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.activeGlow !== false)
                .onChange(async (value) => {
                    this.plugin.settings.activeGlow = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(activeCard)
            .setName(t("settings.custom_active.name"))
            .setDesc('Enable this to override the background and text color of the active (currently selected) file box.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomActiveColor)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomActiveColor = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                    (this.settingTab as unknown as { display: () => void }).display();
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
                .setName(t("settings.active_bg_color.name"))
                .setDesc('The background color for the currently selected file.')
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip(t("common.open_visual_color_picker"))
                    .onClick(() => toggleBgPicker()))
                .addText(text => {
                    bgTextComp = text;
                    text.setPlaceholder(t("common.hex_placeholder_white"))
                        .setValue(this.plugin.settings.customActiveBg || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveBg = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                            bgColorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                        });
                    bgColorBox = text.inputEl.parentElement?.createDiv() ?? text.inputEl.insertAdjacentElement('afterend', this.settingTab.containerEl.createDiv()) as HTMLElement;
                    bgColorBox.setAttribute('title', t("common.click_open_color_picker"));
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
                .setName(t("settings.active_text_color.name"))
                .setDesc('The text color for the currently selected file.')
                .addButton(btn => btn
                    .setIcon('palette')
                    .setTooltip(t("common.open_visual_color_picker"))
                    .onClick(() => toggleTextPicker()))
                .addText(text => {
                    textColorTextComp = text;
                    text.setPlaceholder(t("common.hex_placeholder_gray"))
                        .setValue(this.plugin.settings.customActiveText || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveText = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                            textColorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                        });
                    textColorBox = text.inputEl.parentElement?.createDiv() ?? text.inputEl.insertAdjacentElement('afterend', this.settingTab.containerEl.createDiv()) as HTMLElement;
                    textColorBox.setAttribute('title', t("common.click_open_color_picker"));
                    textColorBox.setCssStyles({
                        width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                        marginLeft: '12px', cursor: 'pointer', backgroundColor: this.plugin.settings.customActiveText || 'transparent'
                    });
                    textColorBox.addEventListener('click', () => toggleTextPicker());
                });
        }

        // 👁️ Appearance & Visibility Card
        const visCard = this.settingTab.makeCard(containerEl, "👁️", "Appearance and visibility");
        let sliderComp_lightModeBrightness: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName(t("settings.light_brightness.name"))
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.lightModeBrightness = DEFAULT_SETTINGS.lightModeBrightness;
                sliderComp_lightModeBrightness.setValue(DEFAULT_SETTINGS.lightModeBrightness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_darkModeBrightness: obsidian.SliderComponent;
        new obsidian.Setting(visCard)
            .setName(t("settings.dark_brightness.name"))
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.darkModeBrightness = DEFAULT_SETTINGS.darkModeBrightness;
                sliderComp_darkModeBrightness.setValue(DEFAULT_SETTINGS.darkModeBrightness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName(t("settings.outline_only.name"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(visCard)
            .setName(t("settings.auto_color_files.name"))
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
            .setName(t("settings.icon_scaling.name"))
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.iconScale = DEFAULT_SETTINGS.iconScale;
                sliderComp_iconScale.setValue(DEFAULT_SETTINGS.iconScale);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(visCard)
            .setName(t("settings.icon_debug.name"))
            .setDesc('Logs icon matching logic to the developer console. Useful if auto-icons are not appearing as expected.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.iconDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.iconDebugMode = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(visCard)
            .setName(t("settings.wrap_metadata.name"))
            .setDesc('Forces file counts, word counts, and other plugin metadata to wrap to the next line on desktop. (This is always enabled automatically on mobile devices).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.wrapMetadata || false)
                .onChange(async (value) => {
                    this.plugin.settings.wrapMetadata = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        // Aa Path Line Thickness and Structure Card
        const typeCard = this.settingTab.makeCard(containerEl, "Aa", "Path line thickness and structure");

        new obsidian.Setting(typeCard)
            .setName(t("settings.collapse_indicator.name"))
            .setDesc('Toggle the visibility of folder collapse indicators (arrows) in the file explorer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCollapseIndicator !== false)
                .onChange(async (value) => {
                    this.plugin.settings.showCollapseIndicator = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        let sliderComp_folderBorderRadius: obsidian.SliderComponent;
        new obsidian.Setting(typeCard)
            .setName(t("settings.folder_border_radius.name"))
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.folderBorderRadius = DEFAULT_SETTINGS.folderBorderRadius;
                sliderComp_folderBorderRadius.setValue(DEFAULT_SETTINGS.folderBorderRadius);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_pathLineThickness: obsidian.SliderComponent;
        new obsidian.Setting(typeCard)
            .setName(t("settings.path_line_thickness.name"))
            .setDesc('Adjust the thickness of vertical indentation lines and active borders.')
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
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.pathLineThickness = DEFAULT_SETTINGS.pathLineThickness;
                sliderComp_pathLineThickness.setValue(DEFAULT_SETTINGS.pathLineThickness);
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        new obsidian.Setting(typeCard)
            .setName(t("settings.show_item_counters.name"))
            .setDesc('Displays recursive folder and file counts next to folder names.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(typeCard)
            .setName(t("settings.spaced_text.name"))
            .setDesc('Adds slight letter and word spacing for a structured, monospaced layout feel.')
            .addDropdown(dropdown => dropdown
                .addOption('none', t("settings.option.none"))
                .addOption('both', t("settings.option.both"))
                .addOption('folders', t("settings.option.folders_only"))
                .addOption('files', t("settings.option.files_only"))
                .setValue(this.plugin.settings.spacedTextMode ?? 'folders')
                .onChange(async (value) => {
                    this.plugin.settings.spacedTextMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                }));

        new obsidian.Setting(typeCard)
            .setName(t("settings.rainbow_root_text.name"))
            .setDesc('Applies a vivid rainbow-text horizontal gradient to all top-level folders.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootText)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();
                    (this.settingTab as unknown as { display: () => void }).display();
                }));

        if (this.plugin.settings.rainbowRootText) {
            new obsidian.Setting(typeCard)
                .setName(t("settings.transparent_root_bg.name"))
                .setDesc('Keeps the root text effect but removes the solid/translucent background box.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.rainbowRootBgTransparent)
                    .onChange(async (value) => {
                        this.plugin.settings.rainbowRootBgTransparent = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            let sliderComp_gradientAngle: obsidian.SliderComponent;
            new obsidian.Setting(typeCard)
                .setName('Text Gradient Angle')
                .setDesc('Customize the angle (0° to 360°) for rainbow text gradients.')
                .addSlider(slider => {
                    sliderComp_gradientAngle = slider;
                    slider
                        .setLimits(0, 360, 15)
                        .setValue(this.plugin.settings.rainbowGradientAngle ?? 135)
                        .onChange(async (value) => {
                            this.plugin.settings.rainbowGradientAngle = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        });
                })
                .addExtraButton(btn => btn
                    .setIcon("rotate-ccw")
                    .setTooltip("Reset to default (135°)")
                    .onClick(async () => {
                        this.plugin.settings.rainbowGradientAngle = 135;
                        sliderComp_gradientAngle.setValue(135);
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));
        }

        // 🎛️ Advanced Tuning Card
        const tuneCard = this.settingTab.makeCard(containerEl, "🎛️", "Advanced tuning");

        let sliderComp_rootOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t("settings.root_opacity.name"))
            .setDesc('Transparency of top-level folders in file explorer.')
            .addSlider(slider => {
                sliderComp_rootOpacity = slider;
                slider
                    .setLimits(1, 100, 1)
                    .setValue(Math.round((this.plugin.settings.rootOpacity || 0.548) * 100))
                    .onChange(async (value) => {
                        this.plugin.settings.rootOpacity = parseFloat((value / 100).toFixed(3));
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.rootOpacity = DEFAULT_SETTINGS.rootOpacity;
                sliderComp_rootOpacity.setValue(Math.round(DEFAULT_SETTINGS.rootOpacity * 100));
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_subfolderOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t("settings.subfolder_opacity.name"))
            .setDesc('Transparency of nested subfolder background pills in file explorer.')
            .addSlider(slider => {
                sliderComp_subfolderOpacity = slider;
                slider
                    .setLimits(1, 100, 1)
                    .setValue(Math.round((this.plugin.settings.subfolderOpacity || 0.201) * 100))
                    .onChange(async (value) => {
                        this.plugin.settings.subfolderOpacity = parseFloat((value / 100).toFixed(3));
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.subfolderOpacity = DEFAULT_SETTINGS.subfolderOpacity;
                sliderComp_subfolderOpacity.setValue(Math.round(DEFAULT_SETTINGS.subfolderOpacity * 100));
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_tintOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t("settings.tint_opacity.name"))
            .setDesc('Controls how highly tinted the background content space becomes when you open a directory.')
            .addSlider(slider => {
                sliderComp_tintOpacity = slider;
                slider
                    .setLimits(0, 100, 1)
                    .setValue(Math.round((this.plugin.settings.tintOpacity || 0.028) * 100))
                    .onChange(async (value) => {
                        this.plugin.settings.tintOpacity = parseFloat((value / 100).toFixed(3));
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                return slider;
            })
            .addExtraButton(cb => cb.setIcon("reset").setTooltip(t("common.reset_to_default")).onClick(async () => {
                this.plugin.settings.tintOpacity = DEFAULT_SETTINGS.tintOpacity;
                sliderComp_tintOpacity.setValue(Math.round(DEFAULT_SETTINGS.tintOpacity * 100));
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));

        let sliderComp_fileBackgroundOpacity: obsidian.SliderComponent;
        new obsidian.Setting(tuneCard)
            .setName(t("settings.file_bg_opacity.name"))
            .setDesc('Global transparency for all auto-colored files (default 10%).')
            .addSlider(slider => {
                sliderComp_fileBackgroundOpacity = slider;
                slider
                    .setLimits(0, 100, 1)
                    .setValue(Math.round((this.plugin.settings.fileBackgroundOpacity !== undefined ? this.plugin.settings.fileBackgroundOpacity : 0.1) * 100))
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
                sliderComp_fileBackgroundOpacity.setValue(Math.round(defVal * 100));
                await this.plugin.saveSettings();
                this.plugin.generateStylesDebounced();
            }));
    }
}
