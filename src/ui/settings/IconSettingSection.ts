import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { IconPickerModal } from '../modals/IconPickerModal';
import { DEFAULT_ICON_PACK_ORDER } from '../../common/constants';
import { IconRuleSet } from '../../core/IconRuleSet';

export class IconSettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        // 🤖 Automation Engine Card
        const autoCard = this.settingTab.makeCard(containerEl, "🤖", "Automation engine");
        new obsidian.Setting(autoCard)
            .setName(t("settings.auto_icons.name"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStylesDebounced();

                    (this.settingTab as unknown as { display: () => void }).display();
                }));

        // 🏆 Icon Pack Priority Ranking Card
        const priorityCard = this.settingTab.makeCard(containerEl, "🏆", "Icon pack priority hierarchy");
        const priorityDesc = priorityCard.createEl('p', {
            text: "Re-order the priority of all icon packs relative to each other. When resolving icons for auto-matching or AI classification, higher-ranked packs take precedence over lower-ranked packs."
        });
        priorityDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "12px" });

        const packLabels: Record<string, string> = {
            'custom': 'Custom User Icons & Brand Overrides',
            'lucide': 'Lucide Icons (Default Modern UI)',
            'emoji': 'Native Emojis (System Unicode)',
            'bootstrap': 'Bootstrap Icons (bi-)',
            'simple-icons': 'Simple Icons (Brand & Tech Logos)',
            'tabler': 'Tabler Icons (tb-)',
            'remix': 'Remix Icons (ri-)',
            'font-awesome': 'FontAwesome Icons (fa-)',
            'material': 'Material Icons (mdi-)',
            'feather': 'Feather Icons'
        };

        const listContainer = priorityCard.createDiv();
        listContainer.setCssStyles({
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "12px",
            backgroundColor: "var(--background-secondary-alt)",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)"
        });

        const renderPackPriorityList = () => {
            listContainer.empty();
            let order = [...(this.plugin.settings.iconPackPriorityOrder || DEFAULT_ICON_PACK_ORDER)];
            for (const defaultPack of DEFAULT_ICON_PACK_ORDER) {
                if (!order.includes(defaultPack)) order.push(defaultPack);
            }

            order.forEach((packKey, index) => {
                const row = listContainer.createDiv();
                row.setCssStyles({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "var(--background-primary)",
                    borderRadius: "6px",
                    border: "1px solid var(--background-modifier-border)"
                });

                const leftInfo = row.createDiv();
                leftInfo.setCssStyles({ display: "flex", alignItems: "center", gap: "10px" });

                const badge = leftInfo.createSpan({ text: `#${index + 1}` });
                badge.setCssStyles({
                    fontWeight: "bold",
                    fontSize: "0.85em",
                    color: index === 0 ? "var(--interactive-accent)" : "var(--text-muted)",
                    minWidth: "24px"
                });

                const label = leftInfo.createSpan({ text: packLabels[packKey] || packKey });
                label.setCssStyles({ fontSize: "0.9em", fontWeight: index === 0 ? "600" : "normal" });

                const btnGroup = row.createDiv();
                btnGroup.setCssStyles({ display: "flex", gap: "4px" });

                const upBtn = btnGroup.createEl("button", { text: "▲" });
                upBtn.setCssStyles({ padding: "2px 8px", fontSize: "0.8em" });
                upBtn.disabled = index === 0;
                upBtn.onclick = () => {
                    if (index > 0) {
                        const temp = order[index];
                        order[index] = order[index - 1];
                        order[index - 1] = temp;
                        this.plugin.settings.iconPackPriorityOrder = [...order];
                        renderPackPriorityList();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                        void this.plugin.saveSettings();
                    }
                };

                const downBtn = btnGroup.createEl("button", { text: "▼" });
                downBtn.setCssStyles({ padding: "2px 8px", fontSize: "0.8em" });
                downBtn.disabled = index === order.length - 1;
                downBtn.onclick = () => {
                    if (index < order.length - 1) {
                        const temp = order[index];
                        order[index] = order[index + 1];
                        order[index + 1] = temp;
                        this.plugin.settings.iconPackPriorityOrder = [...order];
                        renderPackPriorityList();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                        void this.plugin.saveSettings();
                    }
                };
            });
        };

        renderPackPriorityList();

        new obsidian.Setting(priorityCard)
            .setName("Reset pack priority order")
            .setDesc("Restore all icon pack priorities to their default factory ranking.")
            .addButton(btn => btn
                .setButtonText("Reset priority order")
                .onClick(async () => {
                    this.plugin.settings.iconPackPriorityOrder = [...DEFAULT_ICON_PACK_ORDER];
                    renderPackPriorityList();
                    this.plugin.iconManager?.invalidateCategoryCache();
                    this.plugin.generateStylesDebounced();
                    await this.plugin.saveSettings();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(autoCard)
                .setName(t("settings.wide_icons.name"))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(autoCard)
                .setName(t("settings.icon_variety.name"))
                .setDesc('Assigns different icons to items within the same category for better visual distinction.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.autoIconVariety)
                    .onChange(async (value) => {
                        this.plugin.settings.autoIconVariety = value;
                        await this.plugin.saveSettings();
                        (this.settingTab as unknown as { display: () => void }).display();
                        this.plugin.generateStylesDebounced();
                    }));

            if (this.plugin.settings.autoIconVariety) {
                new obsidian.Setting(autoCard)
                    .setName(t("settings.shuffle_icons.name"))
                    .setDesc('Randomize the global seed used for assigning variety icons. If you dislike the current distribution, click this to re-roll them all!')
                    .addButton(button => button
                        .setButtonText(t("settings.shuffle_icons.name"))
                        .onClick(async () => {
                            this.plugin.settings.varietySeed = Math.floor(Math.random() * 1000000);
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }));
            }

            new obsidian.Setting(autoCard)
                .setName(t("settings.default_closed_icon.name"))
                .setDesc('Customize the default icon shown for closed folders when auto-icons are enabled.')
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultClosedFolderIcon || "lucide-folder");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultClosedFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText(t("common.choose")).onClick(() => {
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
                .setName(t("settings.default_open_icon.name"))
                .setDesc('Customize the default icon shown for open folders when auto-icons are enabled.')
                .addText(text => {
                    text.setValue(this.plugin.settings.defaultOpenFolderIcon || "lucide-folder-open");
                    text.onChange(async (val) => {
                        this.plugin.settings.defaultOpenFolderIcon = val;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    });
                    const btn = new obsidian.ButtonComponent(text.inputEl.parentElement);
                    btn.setButtonText(t("common.choose")).onClick(() => {
                        new IconPickerModal(this.app, this.plugin, text.getValue(), async (iconId) => {
                            text.setValue(iconId);
                            this.plugin.settings.defaultOpenFolderIcon = iconId;
                            await this.plugin.saveSettings();
                            this.plugin.generateStylesDebounced();
                        }).open();
                    });
                    btn.buttonEl.setCssStyles({ marginLeft: "8px" });
                });

            // 🎯 Advanced Icon Rules & Targeting Card (Dedicated card for rule autonomy)
            const rulesCard = this.settingTab.makeCard(containerEl, "🎯", t("settings.icon_rules_card.title"));

            const rulesDesc = rulesCard.createDiv();
            rulesDesc.setCssStyles({
                fontSize: "0.82em", color: "var(--text-muted)", marginBottom: "14px",
                padding: "12px 14px", background: "var(--background-secondary-alt)", borderRadius: "8px",
                borderLeft: "4px solid var(--interactive-accent)", lineHeight: "1.5"
            });
            rulesDesc.createEl('strong', { text: t('settings.advanced_regex_rules') });
            rulesDesc.createEl('br');
            rulesDesc.appendText(t('settings.regex_rules_hint'));

            const scopeHelp = rulesDesc.createDiv();
            scopeHelp.setCssStyles({ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--background-modifier-border)" });
            scopeHelp.createDiv({ text: t('settings.icon_rule.scope_help_title') }).setCssStyles({ fontWeight: '600', marginBottom: '4px', color: 'var(--text-normal)' });

            const ul = scopeHelp.createEl('ul');
            ul.setCssStyles({ margin: '4px 0 0 16px', padding: '0', display: 'flex', flexDirection: 'column', gap: '3px' });
            ul.createEl('li', { text: t('settings.icon_rule.scope_help_folders') });
            ul.createEl('li', { text: t('settings.icon_rule.scope_help_files') });
            ul.createEl('li', { text: t('settings.icon_rule.scope_help_all') });
            ul.createEl('li', { text: t('settings.icon_rule.mode_help_contains') });
            ul.createEl('li', { text: t('settings.icon_rule.mode_help_exact') });
            ul.createEl('li', { text: t('settings.icon_rule.mode_help_starts') });
            ul.createEl('li', { text: t('settings.icon_rule.mode_help_ends') });
            ul.createEl('li', { text: t('settings.icon_rule.mode_help_regex') });

            const note = scopeHelp.createDiv({ text: t('settings.icon_rule.scope_help_note') });
            note.setCssStyles({ marginTop: '6px', fontStyle: 'italic', fontSize: '0.9em', color: 'var(--text-accent)' });

            // Advanced Icon Rule Builder
            const rulesUIContainer = rulesCard.createDiv('cf-rules-builder');
            rulesUIContainer.setCssStyles({
                marginTop: '15px', background: 'var(--background-secondary)', padding: '16px',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
            });

            const renderRulesUI = () => {
                rulesUIContainer.empty();

                const header = rulesUIContainer.createDiv();
                header.setCssStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' });
                header.createEl('h4', { text: t("settings.active_rules") }).setCssStyles({ margin: '0' });

                const addBtn = header.createEl('button', { text: t('settings.add_rule'), cls: 'mod-cta' });

                let rules = (this.plugin.settings.customIconRules || "").split('\n').filter(r => r.trim().length > 0);

                const list = rulesUIContainer.createDiv('cf-rules-list');
                list.setCssStyles({ display: 'flex', flexDirection: 'column', gap: '8px' });

                const saveRules = async () => {
                    this.plugin.settings.customIconRules = rules.join('\n');
                    await this.plugin.saveSettings();
                    this.plugin.iconManager?.invalidateCategoryCache();
                    this.plugin.generateStylesDebounced();
                };

                rules.forEach((rule, index) => {
                    const row = list.createDiv();
                    row.setCssStyles({ display: 'flex', gap: '8px', alignItems: 'center' });

                    const parsed = IconRuleSet.parseRule(rule);
                    const pattern = parsed.pattern;
                    let icon = parsed.icon;
                    let target = parsed.target;
                    let mode = parsed.mode;

                    // Scope selector button using native Lucide icons
                    const scopeBtn = row.createEl('button', { cls: 'cf-scope-btn' });
                    scopeBtn.title = t("settings.icon_rule.scope_tooltip");
                    scopeBtn.setCssStyles({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        fontSize: '0.85em',
                        borderRadius: '6px',
                        background: 'var(--background-secondary-alt)',
                        color: 'var(--text-normal)',
                        border: '1px solid var(--background-modifier-border)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    });

                    const updateScopeVisuals = () => {
                        scopeBtn.empty();
                        const iconSpan = scopeBtn.createSpan();
                        iconSpan.setCssStyles({ display: 'inline-flex', alignItems: 'center' });
                        const lucideName = target === 'folders' ? 'folder' : (target === 'files' ? 'file-text' : 'layers');
                        obsidian.setIcon(iconSpan, lucideName);
                        const svgEl = iconSpan.querySelector('svg');
                        if (svgEl) {
                            (svgEl as unknown as HTMLElement).setCssStyles({ width: '14px', height: '14px', color: 'var(--text-accent)' });
                        }

                        const labelText = target === 'folders'
                            ? t("settings.icon_rule.target.folders")
                            : (target === 'files' ? t("settings.icon_rule.target.files") : t("settings.icon_rule.target.all"));
                        scopeBtn.createSpan({ text: labelText });

                        const chev = scopeBtn.createSpan();
                        chev.setCssStyles({ display: 'inline-flex', alignItems: 'center', opacity: '0.6' });
                        obsidian.setIcon(chev, 'chevron-down');
                        const chevSvg = chev.querySelector('svg');
                        if (chevSvg) {
                            (chevSvg as unknown as HTMLElement).setCssStyles({ width: '12px', height: '12px' });
                        }
                    };
                    updateScopeVisuals();

                    scopeBtn.onclick = (e: MouseEvent) => {
                        e.preventDefault();
                        const menu = new obsidian.Menu();
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.target.all"))
                                .setIcon("layers")
                                .setChecked(target === 'all')
                                .onClick(() => {
                                    target = 'all';
                                    updateScopeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.target.folders"))
                                .setIcon("folder")
                                .setChecked(target === 'folders')
                                .onClick(() => {
                                    target = 'folders';
                                    updateScopeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.target.files"))
                                .setIcon("file-text")
                                .setChecked(target === 'files')
                                .onClick(() => {
                                    target = 'files';
                                    updateScopeVisuals();
                                    updateRule();
                                });
                        });
                        menu.showAtMouseEvent(e);
                    };

                    // Matching Mode selector button using native Lucide icons
                    const modeBtn = row.createEl('button', { cls: 'cf-mode-btn' });
                    modeBtn.title = t("settings.icon_rule.mode_tooltip");
                    modeBtn.setCssStyles({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        fontSize: '0.85em',
                        borderRadius: '6px',
                        background: 'var(--background-secondary-alt)',
                        color: 'var(--text-normal)',
                        border: '1px solid var(--background-modifier-border)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    });

                    const updateModeVisuals = () => {
                        modeBtn.empty();
                        const iconSpan = modeBtn.createSpan();
                        iconSpan.setCssStyles({ display: 'inline-flex', alignItems: 'center' });
                        let lucideName = 'search';
                        let labelText = t("settings.icon_rule.mode.contains");

                        if (mode === 'exact') {
                            lucideName = 'equal';
                            labelText = t("settings.icon_rule.mode.exact");
                        } else if (mode === 'starts_with') {
                            lucideName = 'align-left';
                            labelText = t("settings.icon_rule.mode.starts_with");
                        } else if (mode === 'ends_with') {
                            lucideName = 'align-right';
                            labelText = t("settings.icon_rule.mode.ends_with");
                        } else if (mode === 'regex') {
                            lucideName = 'code';
                            labelText = t("settings.icon_rule.mode.regex");
                        }

                        obsidian.setIcon(iconSpan, lucideName);
                        const svgEl = iconSpan.querySelector('svg');
                        if (svgEl) {
                            (svgEl as unknown as HTMLElement).setCssStyles({ width: '14px', height: '14px', color: 'var(--text-accent)' });
                        }

                        modeBtn.createSpan({ text: labelText });

                        const chev = modeBtn.createSpan();
                        chev.setCssStyles({ display: 'inline-flex', alignItems: 'center', opacity: '0.6' });
                        obsidian.setIcon(chev, 'chevron-down');
                        const chevSvg = chev.querySelector('svg');
                        if (chevSvg) {
                            (chevSvg as unknown as HTMLElement).setCssStyles({ width: '12px', height: '12px' });
                        }
                    };
                    updateModeVisuals();

                    modeBtn.onclick = (e: MouseEvent) => {
                        e.preventDefault();
                        const menu = new obsidian.Menu();
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.mode.contains"))
                                .setIcon("search")
                                .setChecked(mode === 'contains')
                                .onClick(() => {
                                    mode = 'contains';
                                    updateModeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.mode.exact"))
                                .setIcon("equal")
                                .setChecked(mode === 'exact')
                                .onClick(() => {
                                    mode = 'exact';
                                    updateModeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.mode.starts_with"))
                                .setIcon("align-left")
                                .setChecked(mode === 'starts_with')
                                .onClick(() => {
                                    mode = 'starts_with';
                                    updateModeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.mode.ends_with"))
                                .setIcon("align-right")
                                .setChecked(mode === 'ends_with')
                                .onClick(() => {
                                    mode = 'ends_with';
                                    updateModeVisuals();
                                    updateRule();
                                });
                        });
                        menu.addItem(item => {
                            item.setTitle(t("settings.icon_rule.mode.regex"))
                                .setIcon("code")
                                .setChecked(mode === 'regex')
                                .onClick(() => {
                                    mode = 'regex';
                                    updateModeVisuals();
                                    updateRule();
                                });
                        });
                        menu.showAtMouseEvent(e);
                    };

                    const patInp = row.createEl('input', { type: 'text', placeholder: t("common.regex_name_placeholder") });
                    patInp.value = pattern;
                    patInp.setCssStyles({ flex: '2', fontFamily: 'var(--font-monospace)' });

                    const iconBtn = row.createEl('button');
                    iconBtn.setCssStyles({ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' });

                    const setIconBtnVisuals = (currentIcon: string) => {
                        iconBtn.empty();
                        if (this.plugin.iconManager.isEmojiIcon(currentIcon)) {
                            iconBtn.setText(currentIcon || "Choose icon");
                        } else if (currentIcon) {
                            const cleanId = currentIcon.replace(/^lucide-/, '');
                            const svg = this.plugin.iconManager.getIconSvg(currentIcon, false) ||
                                        this.plugin.iconManager.getIconSvg(cleanId, false) ||
                                        this.plugin.iconManager.getIconSvg(`lucide-${cleanId}`, false);
                            if (svg) {
                                // eslint-disable-next-line no-unsanitized/method -- Contextual fragment is safe here as svg content comes from curated internal asset maps or local files
                                const frag = activeDocument.createRange().createContextualFragment(svg);
                                const svgEl = frag.querySelector('svg');
                                if (svgEl) {
                                    (svgEl as unknown as HTMLElement).setCssStyles({ width: '16px', height: '16px', color: 'currentColor' });
                                    iconBtn.appendChild(svgEl);
                                    return;
                                }
                            }
                            const iconSpan = iconBtn.createSpan();
                            obsidian.setIcon(iconSpan, cleanId);
                            if (iconSpan.childElementCount > 0) {
                                const svgEl = iconSpan.querySelector('svg');
                                if (svgEl) {
                                    (svgEl as unknown as HTMLElement).setCssStyles({ width: '16px', height: '16px', color: 'currentColor' });
                                }
                                return;
                            }
                            iconBtn.setText(currentIcon);
                        } else {
                            iconBtn.setText("Choose icon");
                        }
                    };
                    setIconBtnVisuals(icon);

                    const prioInp = row.createEl('input', { type: 'number', placeholder: '1-100' });
                    prioInp.min = "1";
                    prioInp.max = "100";
                    prioInp.title = t("common.priority_placeholder");
                    prioInp.value = parsed.priority;
                    prioInp.setCssStyles({ width: '70px' });

                    const updateRule = () => {
                        const formatted = IconRuleSet.formatRule(patInp.value, icon, prioInp.value, target, mode);
                        if (formatted) {
                            rules[index] = formatted;
                            void saveRules();
                        }
                    };

                    patInp.onchange = updateRule;
                    prioInp.onchange = updateRule;

                    iconBtn.onclick = () => {
                        new IconPickerModal(this.app, this.plugin, icon, (selectedIcon) => {
                            icon = selectedIcon;
                            setIconBtnVisuals(icon);
                            updateRule();
                        }).open();
                    };

                    const delBtn = row.createEl('button', { text: '×' });
                    delBtn.setCssStyles({ color: 'var(--text-error)', cursor: 'pointer', border: 'none', background: 'transparent' });
                    delBtn.onclick = () => {
                        rules.splice(index, 1);
                        void saveRules().then(() => renderRulesUI());
                    };
                });

                if (rules.length === 0) {
                    list.createDiv({ text: t("settings.no_custom_rules") }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' });
                }

                addBtn.onclick = () => {
                    rules.push("New_Rule = lucide-sparkles @100 ::all ::contains");
                    void saveRules().then(() => renderRulesUI());
                };
            };

            renderRulesUI();
        }

        // 📦 Custom Icon Management Card
        const customIconCard = this.settingTab.makeCard(containerEl, "📦", "Custom icon management");

        const iconDesc = customIconCard.createEl("p", { text: t("settings.icon_management.desc") });
        iconDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" });

        const tip = customIconCard.createDiv({ text: t("settings.pro_tip_custom_ids") });
        tip.setCssStyles({ fontSize: "0.8em", color: "var(--text-accent)", marginBottom: "15px", fontStyle: "italic" });

        const manualWrap = customIconCard.createDiv();
        manualWrap.setCssStyles({
            padding: "16px", background: "var(--background-secondary-alt)", borderRadius: "10px",
            border: "1px solid var(--background-modifier-border)", marginBottom: "20px"
        });

        const manualTitle = manualWrap.createDiv({ text: t("settings.add_single_icon") });
        manualTitle.setCssStyles({ fontWeight: "700", marginBottom: "10px", fontSize: "0.9em" });
        const manualRow = manualWrap.createDiv();
        manualRow.setCssStyles({ display: "flex", gap: "8px", flexWrap: "wrap" });
        const idInp = manualRow.createEl("input", { placeholder: "Icon ID (e.g. cloud-logo)" });
        const svgInp = manualRow.createEl("input", { placeholder: "SVG code (<svg...)" });
        idInp.setCssStyles({ flex: "1" }); svgInp.setCssStyles({ flex: "3" });

        const addBtn = manualRow.createEl("button", { text: t("settings.add_icon"), cls: "mod-cta" });
        addBtn.onclick = async () => {
            const id = idInp.value.trim();
            const svg = svgInp.value.trim();
            if (!id || !svg.startsWith("<svg")) {
                new obsidian.Notice(t("notice.valid_id_svg_required"));
                return;
            }
            if (!this.plugin.localCustomIcons) this.plugin.localCustomIcons = {};
            this.plugin.localCustomIcons[id] = svg;
            await this.plugin.saveLocalCustomIcons();
            this.plugin.registerCustomIcons();
            await this.plugin.saveSettings();

            (this.settingTab as unknown as { display: () => void }).display();
            new obsidian.Notice(t("notice.icon_registered", { id }));
        };

        new obsidian.Setting(customIconCard)
            .setName(t("settings.bulk_import_url"))
            .setDesc("Enter a URL to a JSON icon pack { 'id': '<svg...>' }")
            .addText(text => {
                text.setPlaceholder(t("settings.import_url_placeholder"));
                const impBtn = customIconCard.createEl("button", { text: t("settings.import_btn") });
                impBtn.setCssStyles({ marginLeft: "8px" });
                impBtn.onclick = async () => {
                    const url = text.getValue().trim();
                    if (!url) return;
                    await this.settingTab.importUrl(url);
                };
            });

        new obsidian.Setting(customIconCard)
            .setName("Auto-detect existing icon packs")
            .setDesc("Scan local vault storage and JSON assets to self-check and detect installed icon packs, repairing any missing icon registrations.")
            .addButton(btn => btn
                .setButtonText("Self-check & detect packs")
                .setCta()
                .onClick(async () => {
                    btn.setButtonText("Scanning...");
                    btn.disabled = true;
                    try {
                        await this.plugin.loadLocalCustomIcons();
                        await this.plugin.loadLocalIcons();
                        this.plugin.registerCustomIcons();
                        await this.plugin.saveSettings();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();

                        const customMap = this.plugin.getCustomIconsMap();
                        const localFsMap = this.plugin.localFileSystemIcons || {};
                        const totalCount = new Set([...Object.keys(customMap), ...Object.keys(localFsMap)]).size;

                        new obsidian.Notice(`Auto-detection complete: Found ${totalCount} custom icons across local vault packs.`);
                    } catch (err) {
                        new obsidian.Notice(`Auto-detection error: ${(err as Error)?.message || String(err)}`);
                    } finally {
                        btn.disabled = false;
                        btn.setButtonText("Self-check & detect packs");
                        (this.settingTab as unknown as { display: () => void }).display();
                    }
                }));

        // ⭐ Featured Icon Packs Card
        const featCard = this.settingTab.makeCard(containerEl, "⭐", "Featured icon packs");
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
            { name: "🅱️ Bootstrap icons", desc: "Official Bootstrap icon library.", url: "https://raw.githubusercontent.com/iconify/icon-sets/master/json/bi.json", prefix: "bi" }
        ];

        const matchPack = (id: string, pPrefix: string): boolean => {
            const lower = id.toLowerCase();
            if (pPrefix === 'ri' || pPrefix === 'remix') return lower.startsWith('ri-') || lower.startsWith('remix-');
            if (pPrefix === 'feather') return lower.startsWith('feather-');
            if (pPrefix === 'tabler' || pPrefix === 'tb') return lower.startsWith('tb-') || lower.startsWith('tabler-');
            if (pPrefix === 'bx') return lower.startsWith('bx-') || lower.startsWith('bxs-') || lower.startsWith('bxi-');
            if (pPrefix.startsWith('fa')) return lower.startsWith('fa-') || lower.startsWith('fas-') || lower.startsWith('fab-') || lower.startsWith('far-');
            if (pPrefix === 'octicon') return lower.startsWith('octicon-');
            if (pPrefix === 'ra') return lower.startsWith('ra-');
            if (pPrefix === 'simple-icons' || pPrefix === 'si') return lower.startsWith('simple-') || lower.startsWith('si-');
            if (pPrefix === 'bi' || pPrefix === 'bootstrap') return lower.startsWith('bi-') || lower.startsWith('bootstrap-') || lower.startsWith('bi:');
            return lower.startsWith(pPrefix + '-');
        };

        const allAvailableIcons = new Set([
            ...Object.keys(this.plugin.getCustomIconsMap()),
            ...Object.keys(this.plugin.localFileSystemIcons || {}),
            ...Object.keys(this.plugin.localCustomIcons || {})
        ]);
        const packCountsMap = new Map<string, number>();
        allAvailableIcons.forEach(id => {
            for (let i = 0; i < packs.length; i++) {
                const p = packs[i];
                if (matchPack(id, p.prefix)) {
                    packCountsMap.set(p.prefix, (packCountsMap.get(p.prefix) || 0) + 1);
                }
            }
        });

        packs.forEach(p => {
            const installedCount = packCountsMap.get(p.prefix) || 0;
            const isInstalled = installedCount > 0;

            const row = featCard.createDiv("setting-item");
            Object.assign(row.style, {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", gap: "20px"
            });

            const content = row.createDiv();
            content.setCssStyles({ flex: "1" });

            const titleRow = content.createDiv();
            titleRow.setCssStyles({ display: "flex", alignItems: "center", gap: "10px" });

            const pName = titleRow.createDiv({ text: p.name });
            pName.setCssStyles({ fontWeight: "600" });

            const badge = titleRow.createDiv({
                text: isInstalled ? `✓ Installed (${installedCount} icons)` : "Not installed"
            });
            badge.setCssStyles({
                fontSize: "0.75em",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: isInstalled ? "rgba(16, 185, 129, 0.15)" : "var(--background-secondary-alt)",
                color: isInstalled ? "#10b981" : "var(--text-muted)",
                border: isInstalled ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--background-modifier-border)"
            });

            const pDesc = content.createDiv({ text: p.desc });
            pDesc.setCssStyles({ fontSize: "0.8em", marginTop: "4px" });

            const link = content.createEl("a", { text: t("settings.view_source"), href: p.url });
            link.setCssStyles({
                fontSize: "0.7em", color: "var(--text-accent)", marginTop: "4px", display: "inline-block"
            });

            const btnGroup = row.createDiv();
            btnGroup.setCssStyles({ display: "flex", gap: "8px" });

            const downloadBtn = btnGroup.createEl("button", { text: isInstalled ? t("settings.redownload_pack") : t("settings.download_pack") });
            downloadBtn.setCssStyles({ minWidth: "90px" });
            downloadBtn.onclick = async () => {
                downloadBtn.setText(t("settings.downloading_pack"));
                downloadBtn.disabled = true;
                try {
                    const count = await this.plugin.autoDownloadPack(p.url, p.prefix);
                    new obsidian.Notice(t("settings.download_success", { count, name: p.name }));
                } catch (err) {
                    const msg = (err as Error)?.message || String(err);
                    new obsidian.Notice(t("settings.download_failed", { name: p.name, msg }), 6000);
                } finally {
                    downloadBtn.disabled = false;
                    (this.settingTab as unknown as { display: () => void }).display();
                }
            };

            if (isInstalled) {
                const removeBtn = btnGroup.createEl("button", { text: t("settings.remove_pack") });
                removeBtn.setCssStyles({ minWidth: "80px", color: "var(--text-error)" });
                removeBtn.onclick = async () => {
                    const count = await this.plugin.removePackIcons(p.prefix);
                    new obsidian.Notice(`Removed ${count} icons from ${p.name}.`);

                    (this.settingTab as unknown as { display: () => void }).display();
                };
            }
        });

        // 📚 Custom Icon Library Card
        const libCard = this.settingTab.makeCard(containerEl, "📚", "Custom icon library");
        const customIconList = Object.entries(this.plugin.getCustomIconsMap());

        if (customIconList.length === 0) {
            const emptyMsg = libCard.createDiv({ text: t("settings.no_custom_icons") });
            emptyMsg.setCssStyles({ color: "var(--text-muted)", fontStyle: "italic", padding: "10px" });
        } else {
            const packMap = new Map<string, Array<[string, string]>>();
            packMap.set("all", customIconList);

            for (const [id, svg] of customIconList) {
                const prefixMatch = id.match(/^([a-z0-9-_]+?)-/i);
                const packKey = prefixMatch ? prefixMatch[1].toLowerCase() : "custom";
                if (!packMap.has(packKey)) {
                    packMap.set(packKey, []);
                }
                const list = packMap.get(packKey);
                if (list) list.push([id, svg]);
            }

            const ctrlBar = libCard.createDiv();
            ctrlBar.setCssStyles({
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap"
            });

            const packSelect = ctrlBar.createEl("select");
            packSelect.setCssStyles({
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--background-modifier-form-field)",
                color: "var(--text-normal)",
                border: "1px solid var(--background-modifier-border)",
                cursor: "pointer"
            });

            const packLabels: Record<string, string> = {
                "all": "All Icon Packs",
                "simple-icons": "Simple Icons",
                "feather": "Feather Icons",
                "tabler": "Tabler Icons",
                "fa-solid": "Font Awesome Solid",
                "fa-regular": "Font Awesome Regular",
                "bx": "Boxicons",
                "octicon": "Octicons",
                "ra": "RPG Awesome",
                "cf": "Community Pack",
                "custom": "Custom Icons"
            };

            for (const [pKey, items] of packMap.entries()) {
                const name = packLabels[pKey] || pKey.toUpperCase();
                const opt = packSelect.createEl("option", { value: pKey, text: `${name} (${items.length})` });
                if (pKey === "all") opt.text = `All Icon Packs (${items.length})`;
            }

            const searchInput = ctrlBar.createEl("input", {
                type: "text",
                placeholder: t("settings.filter_icon_name")
            });
            searchInput.setCssStyles({
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--background-modifier-form-field)",
                color: "var(--text-normal)",
                border: "1px solid var(--background-modifier-border)",
                flex: "1",
                minWidth: "160px"
            });

            const lib = libCard.createDiv("cf-icon-grid");
            const loadMoreContainer = libCard.createDiv();
            loadMoreContainer.setCssStyles({
                display: "flex",
                justifyContent: "center",
                padding: "10px 0"
            });

            let currentPackKey = "all";
            let currentSearch = "";
            let visibleCount = 60;

            const renderGrid = () => {
                lib.empty();
                loadMoreContainer.empty();

                const packItems = packMap.get(currentPackKey) || customIconList;
                const filtered = currentSearch
                    ? packItems.filter(([id]) => id.toLowerCase().includes(currentSearch))
                    : packItems;

                if (filtered.length === 0) {
                    const noMatch = lib.createDiv({ text: t("settings.no_matching_icons") });
                    noMatch.setCssStyles({ color: "var(--text-muted)", fontStyle: "italic", padding: "10px" });
                    return;
                }

                const batch = filtered.slice(0, visibleCount);
                batch.forEach(([id, svg]) => {
                    const item = lib.createDiv("cf-icon-item");
                    item.setAttribute("aria-label", id);

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(svg, 'image/svg+xml');
                    const svgEl = doc.querySelector('svg');
                    if (svgEl) {
                        svgEl.setCssStyles({ width: "24px", height: "24px" });
                        item.appendChild(this.settingTab.containerEl.ownerDocument.importNode(svgEl, true));
                    }

                    const del = item.createEl("button", { text: "×", cls: "cf-btn-remove" });
                    del.onclick = async (e) => {
                        e.stopPropagation();
                        if (this.plugin.settings?.customIcons) delete this.plugin.settings.customIcons[id];
                        if (this.plugin.localCustomIcons) delete this.plugin.localCustomIcons[id];
                        await this.plugin.saveLocalCustomIcons();
                        await this.plugin.saveSettings();
                        (this.settingTab as unknown as { display: () => void }).display();
                    };
                });

                if (filtered.length > visibleCount) {
                    const remaining = filtered.length - visibleCount;
                    const showMoreBtn = loadMoreContainer.createEl("button", {
                        text: t("settings.show_more_icons", { remaining })
                    });
                    showMoreBtn.setCssStyles({
                        padding: "6px 16px",
                        borderRadius: "6px",
                        backgroundColor: "var(--interactive-accent)",
                        color: "var(--text-on-accent)",
                        cursor: "pointer",
                        fontWeight: "500"
                    });
                    showMoreBtn.onclick = () => {
                        visibleCount += 120;
                        renderGrid();
                    };
                }
            };

            packSelect.onchange = () => {
                currentPackKey = packSelect.value;
                visibleCount = 60;
                renderGrid();
            };

            searchInput.oninput = () => {
                currentSearch = searchInput.value.toLowerCase().trim();
                visibleCount = 60;
                renderGrid();
            };

            renderGrid();
        }

        // 📥 Manual Icon Pack Import Card
        const manImportCard = this.settingTab.makeCard(containerEl, "📥", "Manual icon pack import");
        const packDesc = manImportCard.createEl('p', { text: t('settings.manual_import_desc') });
        packDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)" });

        let manualJson = "";
        new obsidian.Setting(manImportCard)
            .setName(t("settings.icon_pack_json"))
            .addTextArea(text => {
                text.setPlaceholder(t("settings.icon_pack_json_placeholder"))
                    .onChange(value => { manualJson = value; });
                text.inputEl.setCssStyles({
                    width: "100%", height: "150px", fontFamily: "var(--font-monospace)",
                    background: "var(--background-secondary)"
                });
            });

        new obsidian.Setting(manImportCard)
            .addButton(btn => btn
                .setButtonText(t("settings.import_manual_json_btn"))
                .setCta()
                .onClick(async () => {
                    if (!manualJson.trim()) return;
                    try {
                        const data = JSON.parse(manualJson) as Record<string, unknown>;
                        await this.settingTab.processIconData(data);
                        new obsidian.Notice(t("notice.manual_import_success"));

                        (this.settingTab as unknown as { display: () => void }).display();
                    } catch (e) {
                        new obsidian.Notice(t("notice.invalid_json_format"));
                        console.error("Colorful Folders: Manual Import failed", (e as Error)?.message || String(e));
                    }
                }));
    }
}
