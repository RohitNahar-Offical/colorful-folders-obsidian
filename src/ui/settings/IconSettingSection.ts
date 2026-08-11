import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { IconPickerModal } from '../modals/IconPickerModal';
import { DEFAULT_ICON_PACK_ORDER } from '../../common/constants';

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

        new obsidian.Setting(autoCard)
            .setName(t("settings.preferred_icon_pack.name"))
            .setDesc(t("settings.preferred_icon_pack.desc"))
            .addDropdown(drop => drop
                .addOption("auto", t("settings.icon_pack.auto"))
                .addOption("lucide", "Lucide Icons (Default)")
                .addOption("emoji", "Native Emojis")
                .addOption("bootstrap", "Bootstrap Icons (bi)")
                .addOption("simple-icons", "Simple Icons (Logos)")
                .addOption("font-awesome", "FontAwesome (fa)")
                .addOption("tabler", "Tabler Icons (tb)")
                .addOption("remix", "Remix Icons (ri)")
                .setValue(this.plugin.settings.preferredIconPack || "auto")
                .onChange(async (val) => {
                    this.plugin.settings.preferredIconPack = val as any;
                    await this.plugin.saveSettings();
                    this.plugin.iconManager?.invalidateCategoryCache();
                    this.plugin.generateStylesDebounced();
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
                upBtn.onclick = async () => {
                    if (index > 0) {
                        const temp = order[index];
                        order[index] = order[index - 1];
                        order[index - 1] = temp;
                        this.plugin.settings.iconPackPriorityOrder = order;
                        await this.plugin.saveSettings();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                        renderPackPriorityList();
                    }
                };

                const downBtn = btnGroup.createEl("button", { text: "▼" });
                downBtn.setCssStyles({ padding: "2px 8px", fontSize: "0.8em" });
                downBtn.disabled = index === order.length - 1;
                downBtn.onclick = async () => {
                    if (index < order.length - 1) {
                        const temp = order[index];
                        order[index] = order[index + 1];
                        order[index + 1] = temp;
                        this.plugin.settings.iconPackPriorityOrder = order;
                        await this.plugin.saveSettings();
                        this.plugin.iconManager?.invalidateCategoryCache();
                        this.plugin.generateStylesDebounced();
                        renderPackPriorityList();
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
                    await this.plugin.saveSettings();
                    this.plugin.iconManager?.invalidateCategoryCache();
                    this.plugin.generateStylesDebounced();
                    renderPackPriorityList();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(autoCard)
                .setName(t("settings.wide_icons.name"))
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
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

            const rulesDesc = autoCard.createDiv();
            rulesDesc.setCssStyles({
                fontSize: "0.8em", color: "var(--text-muted)", marginBottom: "12px",
                padding: "10px", background: "var(--background-secondary-alt)", borderRadius: "6px",
                borderLeft: "3px solid var(--interactive-accent)", lineHeight: "1.4"
            });
            rulesDesc.createEl('strong', { text: 'Advanced regex rule builder' });
            rulesDesc.createEl('br');
            rulesDesc.appendText('Define rules to automatically assign icons based on folder/file names using regex patterns. Rules are evaluated top to bottom, highest priority first.');

            // Advanced Icon Rule Builder
            const rulesUIContainer = autoCard.createDiv('cf-rules-builder');
            rulesUIContainer.setCssStyles({
                marginTop: '15px', background: 'var(--background-secondary)', padding: '16px',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)'
            });

            const renderRulesUI = () => {
                rulesUIContainer.empty();

                const header = rulesUIContainer.createDiv();
                header.setCssStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' });
                header.createEl('h4', { text: t("settings.active_rules") }).setCssStyles({ margin: '0' });

                const addBtn = header.createEl('button', { text: 'Add rule', cls: 'mod-cta' });

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
                        pattern = rule;
                    }

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
                    prioInp.title = t("common.priority_placeholder");
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
                    list.createDiv({ text: t("settings.no_custom_rules") }).setCssStyles({ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' });
                }

                addBtn.onclick = () => {
                    rules.push("New_Rule = 🌟 @100");
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

        const addBtn = manualRow.createEl("button", { text: "Add icon", cls: "mod-cta" });
        addBtn.onclick = async () => {
            const id = idInp.value.trim();
            const svg = svgInp.value.trim();
            if (!id || !svg.startsWith("<svg")) {
                new obsidian.Notice(t("notice.valid_id_svg_required"));
                return;
            }
            if (!this.plugin.settings.customIcons) this.plugin.settings.customIcons = {};
            this.plugin.settings.customIcons[id] = svg;
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
                const impBtn = customIconCard.createEl("button", { text: "Import" });
                impBtn.setCssStyles({ marginLeft: "8px" });
                impBtn.onclick = async () => {
                    const url = text.getValue().trim();
                    if (!url) return;
                    await this.settingTab.importUrl(url);
                };
            });

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

        packs.forEach(p => {
            const prefix = p.prefix + "-";
            const customIconsObj = this.plugin.settings.customIcons || {};
            const installedCount = Object.keys(customIconsObj).filter(id => id.startsWith(prefix)).length;
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

            const link = content.createEl("a", { text: "View source", href: p.url });
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
                const removeBtn = btnGroup.createEl("button", { text: "Remove" });
                removeBtn.setCssStyles({ minWidth: "80px", color: "var(--text-error)" });
                removeBtn.onclick = async () => {
                    let count = 0;
                    const iconsMap = this.plugin.settings.customIcons || {};
                    for (const id in iconsMap) {
                        if (id.startsWith(prefix)) {
                            delete this.plugin.settings.customIcons[id];
                            count++;
                        }
                    }
                    this.plugin.registerCustomIcons();
                    await this.plugin.saveSettings();
                    new obsidian.Notice(`Removed ${count} icons from ${p.name}.`);

                    (this.settingTab as unknown as { display: () => void }).display();
                };
            }
        });

        // 📚 Custom Icon Library Card
        const libCard = this.settingTab.makeCard(containerEl, "📚", "Custom icon library");
        const customIconList = Object.entries(this.plugin.settings.customIcons || {});

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
                        delete this.plugin.settings.customIcons[id];
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
        const packDesc = manImportCard.createEl('p', { text: 'You can manually paste the JSON content of an icon pack below to import it.' });
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
