import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';

export class AISettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        // 🧪 Experimental Feature Banner
        const experimentalNotice = containerEl.createDiv({ cls: "cf-experimental-banner" });
        experimentalNotice.setCssStyles({
            backgroundColor: "rgba(235, 150, 20, 0.12)",
            borderLeft: "4px solid var(--text-warning, #f59e0b)",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "16px"
        });
        experimentalNotice.createEl("h4", {
            text: t("settings.ai.banner_header")
        }).setCssStyles({
            margin: "0 0 6px 0",
            fontSize: "1em",
            fontWeight: "600",
            color: "var(--text-warning, #f59e0b)"
        });
        experimentalNotice.createEl("p", {
            text: t("settings.ai.banner_desc")
        }).setCssStyles({
            margin: "0",
            fontSize: "0.85em",
            color: "var(--text-normal)"
        });

        // 🤖 AI Auto-Icon Classifier Card
        const aiCard = this.settingTab.makeCard(containerEl, "🤖", t("settings.ai.title"));
        aiCard.createEl("p", {
            text: t("settings.ai.desc")
        }).setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "15px" });

        new obsidian.Setting(aiCard)
            .setName(t("settings.ai.provider.name"))
            .setDesc(t("settings.ai.provider.desc"))
            .addDropdown(d => d
                .addOption("ollama", t("settings.ai.provider.ollama"))
                .addOption("custom", t("settings.ai.provider.openai"))
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
                .setName(t("settings.ai.ollama_url.name"))
                .setDesc(t("settings.ai.ollama_url.desc"))
                .addText(tComp => {
                    tComp.setValue(this.plugin.settings.aiOllamaEndpoint || "http://localhost:11434")
                        .setPlaceholder("HTTP://localhost:11434")
                        .onChange(async (val) => {
                            this.plugin.settings.aiOllamaEndpoint = val.trim();
                            await this.plugin.saveSettings();
                        });
                });
        }

        if (this.plugin.settings.aiProvider === 'custom') {
            new obsidian.Setting(aiCard)
                .setName(t("settings.ai.custom_endpoint.name"))
                .setDesc(t("settings.ai.custom_endpoint.desc"))
                .addText(tComp => {
                    tComp.setValue(this.plugin.settings.aiCustomEndpoint || "")
                        .setPlaceholder("HTTP://localhost:1234/v1/chat/completions")
                        .onChange(async (val) => {
                            this.plugin.settings.aiCustomEndpoint = val.trim();
                            await this.plugin.saveSettings();
                        });
                });
        }

        new obsidian.Setting(aiCard)
            .setName(t("settings.ai.model_name.name"))
            .setDesc(t("settings.ai.model_name.desc"))
            .addText(tComp => {
                tComp.setValue(this.plugin.settings.aiModelName || 'qwen2.5:1.5b')
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
            const recHeader = recDiv.createDiv({ text: t("settings.ai.recommended_models") });
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
                btn.addEventListener("click", () => {
                    void (async () => {
                        this.plugin.settings.aiModelName = m.name;
                        await this.plugin.saveSettings();
                        (this.settingTab as unknown as { display: () => void }).display();
                        new obsidian.Notice(t("notice.set_ai_model", { name: m.name }));
                    })();
                });
            }
        }

        new obsidian.Setting(aiCard)
            .setName(t("settings.ai.include_md.name"))
            .setDesc(t("settings.ai.include_md.desc"))
            .addToggle(tComp => tComp
                .setValue(this.plugin.settings.aiIncludeFiles)
                .onChange(async (val) => {
                    this.plugin.settings.aiIncludeFiles = val;
                    await this.plugin.saveSettings();
                })
            );

        new obsidian.Setting(aiCard)
            .setName(t("settings.ai.include_content.name"))
            .setDesc(t("settings.ai.include_content.desc"))
            .addToggle(tComp => tComp
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
        const tokenHeader = tokenUsageDiv.createDiv({ text: t("settings.ai.token_overview") });
        tokenHeader.setCssStyles({ fontWeight: '700', marginBottom: '6px', color: 'var(--text-normal)' });

        const tokenList = tokenUsageDiv.createEl('ul');
        tokenList.setCssStyles({ margin: '0', paddingLeft: '18px', color: 'var(--text-muted)' });

        const mode1 = tokenList.createEl('li');
        mode1.createEl('strong', { text: t("settings.ai.fast_mode_label") + ' ' });
        mode1.appendText(t("settings.ai.fast_mode_desc"));

        const mode2 = tokenList.createEl('li');
        mode2.createEl('strong', { text: t("settings.ai.deep_mode_label") + ' ' });
        mode2.appendText(t("settings.ai.deep_mode_desc"));

        const scopeTip = tokenList.createEl('li');
        scopeTip.createEl('strong', { text: t("settings.ai.scope_tip_label") + ' ' });
        scopeTip.appendText(t("settings.ai.scope_tip_desc"));

        const aiBtnWrap = aiCard.createDiv();
        aiBtnWrap.setCssStyles({ display: "flex", gap: "10px", marginTop: "15px", marginBottom: "10px" });

        const aiRunBtn = aiBtnWrap.createEl("button", { text: t("settings.ai.btn_auto_assign"), cls: "mod-cta" });
        aiRunBtn.onclick = () => {
            void this.plugin.aiIconClassifier.classifyVault();
        };

        const aiForceBtn = aiBtnWrap.createEl("button", { text: t("settings.ai.btn_force_reassign") });
        aiForceBtn.onclick = () => {
            void this.plugin.aiIconClassifier.classifyVault({ force: true });
        };

        const aiStopBtn = aiBtnWrap.createEl("button", { text: t("settings.ai.btn_stop") });
        aiStopBtn.setCssStyles({ color: "var(--text-error)" });
        aiStopBtn.onclick = () => {
            this.plugin.aiIconClassifier.stopClassification();
        };

        // ⚡ Vector Embedding Model Card (Fast & Offline)
        const vectorCard = this.settingTab.makeCard(containerEl, "⚡", t("settings.ai.vector_title"));
        const vectorDesc = vectorCard.createEl('p', {
            text: t("settings.ai.vector_desc")
        });
        vectorDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "12px" });

        const customContainer = vectorCard.createDiv();

        new obsidian.Setting(vectorCard)
            .setName(t("settings.ai.embedding_engine.name"))
            .setDesc(t("settings.ai.embedding_engine.desc"))
            .addDropdown(drop => drop
                .addOption("builtin", t("settings.ai.embedding_engine.builtin"))
                .addOption("custom", t("settings.ai.embedding_engine.custom"))
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
                .setName(t("settings.ai.custom_model.name"))
                .setDesc(t("settings.ai.custom_model.desc"))
                .addText(textComp => textComp
                    .setPlaceholder("Bge-m3")
                    .setValue(this.plugin.settings.embeddingCustomModel || "bge-m3")
                    .onChange(async (val) => {
                        this.plugin.settings.embeddingCustomModel = val.trim();
                        await this.plugin.saveSettings();
                    }));

            new obsidian.Setting(customContainer)
                .setName(t("settings.ai.endpoint.name"))
                .setDesc(t("settings.ai.endpoint.desc"))
                .addText(textComp => textComp
                    .setPlaceholder("HTTP://localhost:11434")
                    .setValue(this.plugin.settings.embeddingCustomEndpoint || "http://localhost:11434")
                    .onChange(async (val) => {
                        this.plugin.settings.embeddingCustomEndpoint = val.trim();
                        await this.plugin.saveSettings();
                    }));
        }

        const vectorBtnWrap = vectorCard.createDiv();
        vectorBtnWrap.setCssStyles({ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" });

        const vectorRunBtn = vectorBtnWrap.createEl("button", { text: t("settings.ai.btn_vector_auto_assign"), cls: "mod-cta" });
        vectorRunBtn.onclick = async () => {
            vectorRunBtn.disabled = true;
            vectorRunBtn.setText(t("settings.ai.btn_vector_running"));

            const engineName = this.plugin.settings.embeddingEngine === 'custom'
                ? `Custom Neural Model (${this.plugin.settings.embeddingCustomModel || 'bge-m3'})`
                : 'Built-in Local Vector Model (0MB)';

            const loadingNotice = new obsidian.Notice(t("notice.vector_scanning", { engineName }), 0);

            try {
                const allItems = this.plugin.app.vault.getAllLoadedFiles().filter(f => f.path !== '/');
                const targets = allItems.map(f => ({
                    path: f.path,
                    name: f.name,
                    isFolder: f instanceof obsidian.TFolder
                }));

                const results = await this.plugin.embeddingModel.classifyTargetsAsync(targets, (completed, total, pct) => {
                    loadingNotice.setMessage(t("notice.vector_progress", { engineName, pct, completed, total }));
                    vectorRunBtn.setText(t("settings.ai.btn_vector_progress", { pct, completed, total }));
                });
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

                loadingNotice.hide();
                new obsidian.Notice(t("notice.vector_success", { engineName, count }));
            } catch (err) {
                loadingNotice.hide();
                const msg = (err as Error)?.message || String(err);
                new obsidian.Notice(t("notice.vector_error", { msg }));
            } finally {
                vectorRunBtn.disabled = false;
                vectorRunBtn.setText(t("settings.ai.btn_vector_auto_assign"));
            }
        };
    }
}
