import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';

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
            text: "🧪 Experimental Feature"
        }).setCssStyles({
            margin: "0 0 6px 0",
            fontSize: "1em",
            fontWeight: "600",
            color: "var(--text-warning, #f59e0b)"
        });
        experimentalNotice.createEl("p", {
            text: "AI auto-icon classification is an experimental feature. Before running batch classification, please make a backup of your plugin settings and styles from the Privacy tab."
        }).setCssStyles({
            margin: "0",
            fontSize: "0.85em",
            color: "var(--text-normal)"
        });

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
            vectorRunBtn.disabled = true;
            vectorRunBtn.setText("⏳ Running Vector Embedding Classification...");

            const engineName = this.plugin.settings.embeddingEngine === 'custom'
                ? `Custom Neural Model (${this.plugin.settings.embeddingCustomModel || 'bge-m3'})`
                : 'Built-in Local Vector Model (0MB)';

            const loadingNotice = new obsidian.Notice(`⏳ ${engineName} is scanning vault files...`, 0);

            try {
                const allItems = this.plugin.app.vault.getAllLoadedFiles().filter(f => f.path !== '/');
                const targets = allItems.map(f => ({
                    path: f.path,
                    name: f.name,
                    isFolder: f instanceof obsidian.TFolder
                }));

                const results = await this.plugin.embeddingModel.classifyTargetsAsync(targets, (completed, total, pct) => {
                    loadingNotice.setMessage(`⏳ ${engineName}: ${pct}% (${completed}/${total} items processed)...`);
                    vectorRunBtn.setText(`⏳ Classifying ${pct}% (${completed}/${total})...`);
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
                new obsidian.Notice(`⚡ ${engineName}: Auto-assigned ${count} icons!`);
            } catch (err) {
                loadingNotice.hide();
                const msg = (err as Error)?.message || String(err);
                new obsidian.Notice(`❌ Vector Embedding error: ${msg}`);
            } finally {
                vectorRunBtn.disabled = false;
                vectorRunBtn.setText("⚡ Auto-Assign Icons with Embeddings");
            }
        };
    }
}
