import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { IconPickerModal } from '../modals/IconPickerModal';

export class IconSettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        // 🤖 AI Auto-Icon Classifier Card
        const aiCard = this.settingTab.makeCard(containerEl, "🤖", "AI Auto-Icon Classifier");
        aiCard.createEl("p", {
            text: "Automatically classify all vault items and assign contextually meaningful icons in batch using AI."
        }).setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "15px" });

        new obsidian.Setting(aiCard)
            .setName("AI Provider")
            .setDesc("Select your local AI provider (Local Ollama or Local Custom OpenAI-Compatible Server).")
            .addDropdown(d => d
                .addOption("ollama", "🦙 Local Ollama")
                .addOption("custom", "🌐 Local Custom OpenAI-Compatible Server")
                .setValue(this.plugin.settings.aiProvider === 'custom' ? 'custom' : 'ollama')
                .onChange(async (val: 'ollama' | 'custom') => {
                    this.plugin.settings.aiProvider = val;
                    if (val === 'ollama' && (!this.plugin.settings.aiModelName || this.plugin.settings.aiModelName === 'gemini-2.5-flash')) {
                        this.plugin.settings.aiModelName = 'qwen2.5:1.5b';
                    }
                    await this.plugin.saveSettings();
                    (this.settingTab as unknown as { display: () => void }).display();
                })
            );

        if (this.plugin.settings.aiProvider === 'ollama') {
            new obsidian.Setting(aiCard)
                .setName("Ollama Server URL")
                .setDesc("Base URL for your local Ollama instance (default: http://localhost:11434).")
                .addText(t => {
                    t.setValue(this.plugin.settings.aiOllamaEndpoint || "http://localhost:11434")
                        .setPlaceholder("http://localhost:11434")
                        .onChange(async (val) => {
                            this.plugin.settings.aiOllamaEndpoint = val.trim();
                            await this.plugin.saveSettings();
                        });
                });
        }

        if (this.plugin.settings.aiProvider === 'custom') {
            new obsidian.Setting(aiCard)
                .setName("Custom Endpoint URL")
                .setDesc("Full URL endpoint for your local server (e.g. http://localhost:1234/v1/chat/completions).")
                .addText(t => {
                    t.setValue(this.plugin.settings.aiCustomEndpoint || "")
                        .setPlaceholder("http://localhost:1234/v1/chat/completions")
                        .onChange(async (val) => {
                            this.plugin.settings.aiCustomEndpoint = val.trim();
                            await this.plugin.saveSettings();
                        });
                });
        }

        new obsidian.Setting(aiCard)
            .setName("Model Name")
            .setDesc("Model name to use for local classification (e.g. qwen2.5:1.5b, llama3.2:1b).")
            .addText(t => {
                t.setValue(this.plugin.settings.aiModelName || 'qwen2.5:1.5b')
                    .setPlaceholder("qwen2.5:1.5b")
                    .onChange(async (val) => {
                        this.plugin.settings.aiModelName = val.trim();
                        await this.plugin.saveSettings();
                    });
            });

        if (this.plugin.settings.aiProvider === 'ollama') {
            const recDiv = aiCard.createDiv();
            recDiv.setCssStyles({
                padding: "10px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--background-secondary-alt)",
                border: "1px solid var(--border-color)",
                marginBottom: "15px",
                fontSize: "0.85em"
            });
            const recHeader = recDiv.createDiv({ text: "💡 Recommended Fast Local Models (Run 'ollama run <model>' in terminal first):" });
            recHeader.setCssStyles({ fontWeight: "600", marginBottom: "8px", color: "var(--text-normal)" });

            const models = [
                { name: "qwen2.5:1.5b", label: "⚡ qwen2.5:1.5b", desc: "Best Balance (~980MB)" },
                { name: "qwen2.5:0.5b", label: "🚀 qwen2.5:0.5b", desc: "Ultra Light (~390MB)" },
                { name: "llama3.2:1b", label: "🦙 llama3.2:1b", desc: "Meta Fast (~1.3GB)" },
                { name: "llama3", label: "🦙 llama3", desc: "Standard (~4.7GB)" }
            ];

            const btnGrid = recDiv.createDiv();
            btnGrid.setCssStyles({ display: "flex", flexWrap: "wrap", gap: "6px" });

            for (const m of models) {
                const isSelected = (this.plugin.settings.aiModelName || 'qwen2.5:1.5b') === m.name;
                const btn = btnGrid.createEl("button", { text: `${m.label} (${m.desc})` });
                btn.setCssStyles({
                    fontSize: "0.85em",
                    padding: "4px 8px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--interactive-accent)" : "var(--interactive-normal)",
                    color: isSelected ? "var(--text-on-accent)" : "var(--text-normal)"
                });
                btn.addEventListener("click", async () => {
                    this.plugin.settings.aiModelName = m.name;
                    await this.plugin.saveSettings();
                    (this.settingTab as unknown as { display: () => void }).display();
                    new obsidian.Notice(`Set AI Model to ${m.name}. Make sure to run 'ollama run ${m.name}' in terminal!`);
                });
            }
        }

        new obsidian.Setting(aiCard)
            .setName("Include Markdown Files")
            .setDesc("If enabled, classifies individual markdown files as well as folders (Folder-only is recommended for large vaults).")
            .addToggle(t => t
                .setValue(this.plugin.settings.aiIncludeFiles)
                .onChange(async (val) => {
                    this.plugin.settings.aiIncludeFiles = val;
                    await this.plugin.saveSettings();
                })
            );

        new obsidian.Setting(aiCard)
            .setName("Include File Content & Frontmatter Context")
            .setDesc("If enabled, AI reads file content snippets, tags, and frontmatter properties for classification. If disabled, items are classified strictly & fast based on file/folder names only.")
            .addToggle(t => t
                .setValue(this.plugin.settings.aiIncludeContentContext !== false)
                .onChange(async (val) => {
                    this.plugin.settings.aiIncludeContentContext = val;
                    await this.plugin.saveSettings();
                })
            );

        // Token Usage Info Box
        const tokenUsageDiv = aiCard.createDiv();
        tokenUsageDiv.setCssStyles({
            marginTop: '12px',
            marginBottom: '15px',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--background-secondary-alt)',
            borderLeft: '4px solid var(--interactive-accent)',
            fontSize: '0.85em',
            lineHeight: '1.4'
        });
        const tokenHeader = tokenUsageDiv.createDiv({ text: '📊 Token Usage Overview by Mode' });
        tokenHeader.setCssStyles({ fontWeight: '700', marginBottom: '6px', color: 'var(--text-normal)' });

        const tokenList = tokenUsageDiv.createEl('ul');
        tokenList.setCssStyles({ margin: '0', paddingLeft: '18px', color: 'var(--text-muted)' });

        const mode1 = tokenList.createEl('li');
        mode1.createEl('strong', { text: 'Fast / Name-Only Mode (Content Context OFF): ' });
        mode1.appendText('Lowest token usage (~15-30 tokens per item). AI classifies items strictly based on folder and file names.');

        const mode2 = tokenList.createEl('li');
        mode2.createEl('strong', { text: 'Deep Context Mode (Content Context ON): ' });
        mode2.appendText('Higher token usage (~150-500+ tokens per item). AI reads file content snippets, tags, and frontmatter properties for high contextual accuracy.');

        const scopeTip = tokenList.createEl('li');
        scopeTip.createEl('strong', { text: 'Vault Scope Tip: ' });
        scopeTip.appendText('Disabling "Include Markdown Files" (Folder-Only Mode) significantly reduces overall token consumption in large vaults.');

        const aiBtnWrap = aiCard.createDiv();
        aiBtnWrap.setCssStyles({ display: "flex", gap: "10px", marginTop: "15px", marginBottom: "10px" });

        const aiRunBtn = aiBtnWrap.createEl("button", { text: "✨ Auto-Assign Icons with AI", cls: "mod-cta" });
        aiRunBtn.onclick = () => {
            void this.plugin.aiIconClassifier.classifyVault();
        };

        const aiForceBtn = aiBtnWrap.createEl("button", { text: "🔄 Force Re-Assign All" });
        aiForceBtn.onclick = () => {
            void this.plugin.aiIconClassifier.classifyVault({ force: true });
        };

        const aiStopBtn = aiBtnWrap.createEl("button", { text: "🛑 Stop AI Classification" });
        aiStopBtn.setCssStyles({ color: "var(--text-error)" });
        aiStopBtn.onclick = () => {
            this.plugin.aiIconClassifier.stopClassification();
        };

        // ⚡ Vector Embedding Model Card (Fast & Offline)
        const vectorCard = this.settingTab.makeCard(containerEl, "⚡", "Vector embedding model (Fast & Offline)");
        const vectorDesc = vectorCard.createEl('p', {
            text: 'Auto-assign icons instantly (<5ms per note) using the zero-dependency built-in local vector engine or a custom neural embedding model (Ollama / BGE-M3).'
        });
        vectorDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "12px" });

        const customContainer = vectorCard.createDiv();

        new obsidian.Setting(vectorCard)
            .setName("Embedding model engine")
            .setDesc("Choose between the zero-setup Built-in local vector model (0MB) or a Custom neural embedding model (Ollama / Local API).")
            .addDropdown(drop => drop
                .addOption("builtin", "⚡ Built-in Local Vector Model (0MB, Default)")
                .addOption("custom", "⚙️ Custom / Local Neural Model (Ollama / BGE-M3)")
                .setValue(this.plugin.settings.embeddingEngine || "builtin")
                .onChange(async (val) => {
                    this.plugin.settings.embeddingEngine = val as 'builtin' | 'custom';
                    await this.plugin.saveSettings();
                    (this.settingTab as unknown as { display: () => void }).display();
                }));

        if (this.plugin.settings.embeddingEngine === "custom") {
            customContainer.setCssStyles({
                padding: "10px 12px",
                borderRadius: "6px",
                backgroundColor: "var(--background-secondary-alt)",
                border: "1px solid var(--border-color)",
                marginTop: "8px",
                marginBottom: "12px"
            });

            new obsidian.Setting(customContainer)
                .setName("Custom model name")
                .setDesc("The embedding model name registered in Ollama or your local server (e.g. bge-m3, nomic-embed-text).")
                .addText(text => text
                    .setPlaceholder("bge-m3")
                    .setValue(this.plugin.settings.embeddingCustomModel || "bge-m3")
                    .onChange(async (val) => {
                        this.plugin.settings.embeddingCustomModel = val.trim();
                        await this.plugin.saveSettings();
                    }));

            new obsidian.Setting(customContainer)
                .setName("Endpoint URL")
                .setDesc("The base URL for your local embedding endpoint.")
                .addText(text => text
                    .setPlaceholder("http://localhost:11434")
                    .setValue(this.plugin.settings.embeddingCustomEndpoint || "http://localhost:11434")
                    .onChange(async (val) => {
                        this.plugin.settings.embeddingCustomEndpoint = val.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        const vectorBtnWrap = vectorCard.createDiv();
        vectorBtnWrap.setCssStyles({ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" });

        const vectorRunBtn = vectorBtnWrap.createEl("button", { text: "⚡ Auto-Assign Icons with Embeddings", cls: "mod-cta" });
        vectorRunBtn.onclick = async () => {
            const files = this.plugin.app.vault.getFiles();
            const targets = files.map(f => ({ path: f.path, name: f.name }));

            const results = this.plugin.embeddingModel.classifyTargets(targets);
            let count = 0;
            for (const [path, candidates] of Object.entries(results)) {
                if (candidates.length > 0) {
                    const iconId = candidates[0];
                    const existing = this.plugin.settings.customFolderColors[path];
                    if (typeof existing === 'object' && existing) {
                        existing.iconId = iconId;
                        existing.iconSource = 'embedding';
                    } else if (typeof existing === 'string') {
                        this.plugin.settings.customFolderColors[path] = { hex: existing, iconId, iconSource: 'embedding' };
                    } else {
                        this.plugin.settings.customFolderColors[path] = { iconId, iconSource: 'embedding' };
                    }
                    count++;
                }
            }

            await this.plugin.saveSettings();
            await this.plugin.generateStyles();

            const engineName = this.plugin.settings.embeddingEngine === 'custom'
                ? `Custom Neural Model (${this.plugin.settings.embeddingCustomModel || 'bge-m3'})`
                : 'Built-in Local Vector Model (0MB)';

            new obsidian.Notice(`⚡ ${engineName}: Auto-assigned ${count} icons!`);
        };

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
            { name: "🔥 Ultimate collection", desc: "Curated community starter pack.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/main/icons/community-core.json", prefix: "cf" }
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

            const downloadBtn = btnGroup.createEl("button", { text: isInstalled ? "Re-Download" : "Download" });
            downloadBtn.setCssStyles({ minWidth: "90px" });
            downloadBtn.onclick = async () => {
                downloadBtn.setText("Downloading...");
                downloadBtn.disabled = true;
                try {
                    const count = await this.plugin.autoDownloadPack(p.url, p.prefix);
                    new obsidian.Notice(`Successfully downloaded ${count} icons for ${p.name}!`);
                } catch (err) {
                    const msg = (err as Error)?.message || String(err);
                    new obsidian.Notice(`Failed to download ${p.name}: ${msg}`, 6000);
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
                placeholder: "Filter icon name..."
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
                    const noMatch = lib.createDiv({ text: "No matching icons found." });
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
                        text: `Show More Icons (${remaining} remaining)`
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
