import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';
import { GeneralSettingSection } from './settings/GeneralSettingSection';
import { FeaturesSettingSection } from './settings/FeaturesSettingSection';
import { IconSettingSection } from './settings/IconSettingSection';
import { AISettingSection } from './settings/AISettingSection';
import { PrivacySettingSection } from './settings/PrivacySettingSection';

export class ColorfulFoldersSettingTab extends obsidian.PluginSettingTab {
    plugin: IColorfulFoldersPlugin;
    activeTab: string;

    private generalSection: GeneralSettingSection;
    private featuresSection: FeaturesSettingSection;
    private iconSection: IconSettingSection;
    private aiSection: AISettingSection;
    private privacySection: PrivacySettingSection;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin) {
        super(app, plugin as unknown as obsidian.Plugin);
        this.plugin = plugin;
        this.activeTab = "gen";

        this.generalSection = new GeneralSettingSection(this.app, this.plugin, this);
        this.featuresSection = new FeaturesSettingSection(this.app, this.plugin, this);
        this.iconSection = new IconSettingSection(this.app, this.plugin, this);
        this.aiSection = new AISettingSection(this.app, this.plugin, this);
        this.privacySection = new PrivacySettingSection(this.app, this.plugin, this);
    }

    public makeCard(parent: HTMLElement, icon: string, title: string): HTMLElement {
        const card = parent.createDiv('cf-settings-card');
        const h = card.createDiv('cf-card-header');
        h.createSpan({ text: icon, cls: 'icon' });
        h.appendText(' ' + title);
        return card;
    }

    display() {
        const rootEl = this.containerEl;
        const savedScrollTop = rootEl.scrollTop;
        rootEl.empty();
        rootEl.addClass('colorful-folders-config');
        rootEl.setCssStyles({
            overflowX: 'hidden',
            boxSizing: 'border-box',
            maxWidth: '100%'
        });

        // Tab Bar (at the very top)
        const tabBar = rootEl.createDiv('cf-tab-bar');
        tabBar.setCssStyles({ marginTop: '12px', marginBottom: '24px' });

        const generalPanel = rootEl.createDiv();
        const intPanel = rootEl.createDiv();
        const iconPanel = rootEl.createDiv();
        const aiPanel = rootEl.createDiv();
        const sysPanel = rootEl.createDiv();

        generalPanel.setCssStyles({ display: 'block' });
        intPanel.setCssStyles({ display: 'none' });
        iconPanel.setCssStyles({ display: 'none' });
        aiPanel.setCssStyles({ display: 'none' });
        sysPanel.setCssStyles({ display: 'none' });

        const createTabBtn = (tabKey: string, iconId: string, label: string): HTMLElement => {
            const btn = tabBar.createEl("button", { cls: 'cf-tab-btn' });
            const iconSpan = btn.createSpan({ cls: 'cf-tab-icon' });
            obsidian.setIcon(iconSpan, iconId);
            btn.createSpan({ text: label });
            btn.onclick = () => setTab(tabKey);
            return btn;
        };

        const btnGen = createTabBtn("gen", "palette", "General");
        const btnInt = createTabBtn("int", "sparkles", "Features");
        const btnIcon = createTabBtn("icon", "smile", "Icons");
        const btnAI = createTabBtn("ai", "bot", "AI");
        const btnSys = createTabBtn("sys", "shield-check", "Privacy");

        const setTab = (tabKey: string) => {
            this.activeTab = tabKey;
            generalPanel.setCssStyles({ display: (tabKey === "gen" ? "block" : "none") });
            intPanel.setCssStyles({ display: (tabKey === "int" ? "block" : "none") });
            iconPanel.setCssStyles({ display: (tabKey === "icon" ? "block" : "none") });
            aiPanel.setCssStyles({ display: (tabKey === "ai" ? "block" : "none") });
            sysPanel.setCssStyles({ display: (tabKey === "sys" ? "block" : "none") });

            btnGen.toggleClass('is-active', tabKey === "gen");
            btnInt.toggleClass('is-active', tabKey === "int");
            btnIcon.toggleClass('is-active', tabKey === "icon");
            btnAI.toggleClass('is-active', tabKey === "ai");
            btnSys.toggleClass('is-active', tabKey === "sys");
        };

        setTab(this.activeTab || "gen");

        // Delegate Section Rendering (SRP / OOP)
        try { this.generalSection.render(generalPanel); } catch (e) { console.error("Colorful Folders: Error rendering General section", e); }
        try { this.featuresSection.render(intPanel); } catch (e) { console.error("Colorful Folders: Error rendering Features section", e); }
        try { this.iconSection.render(iconPanel); } catch (e) { console.error("Colorful Folders: Error rendering Icon section", e); }
        try { this.aiSection.render(aiPanel); } catch (e) { console.error("Colorful Folders: Error rendering AI section", e); }
        try { this.privacySection.render(sysPanel); } catch (e) { console.error("Colorful Folders: Error rendering Privacy section", e); }

        if (savedScrollTop > 0) {
            window.requestAnimationFrame(() => {
                rootEl.scrollTop = savedScrollTop;
            });
        }
    }

    async processIconData(data: Record<string, unknown>): Promise<number> {
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
                const tVal = iconData.top || 0;
                let body = iconData.body || "";
                if (!body) return;

                if (!body.includes('fill=') && !body.includes('stroke=')) {
                    body = `<g fill="currentColor">${body}</g>`;
                }

                const viewBox = `${l} ${tVal} ${w} ${h}`;
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="24" height="24">${body}</svg>`;

                this.plugin.settings.customIcons[id] = svg;
                count++;
            };

            for (const [name, iconData] of Object.entries(icons)) {
                processIcon(name, iconData);
            }
        } else if (typeof data === "object" && data !== null) {
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === "string" && value.trim().startsWith("<svg")) {
                    this.plugin.settings.customIcons[key] = value.trim();
                    count++;
                }
            }
        }

        if (count > 0) {
            this.plugin.registerCustomIcons();
            await this.plugin.saveSettings();
        }
        return count;
    }

    async importUrl(url: string): Promise<void> {
        try {
            new obsidian.Notice(`Fetching icon pack from ${url}...`);
            const res = await obsidian.requestUrl({ url });
            const data = res.json as Record<string, unknown>;
            const count = await this.processIconData(data);
            if (count > 0) {
                new obsidian.Notice(`Successfully imported ${count} icons!`);
                this.display();
            } else {
                new obsidian.Notice("No valid SVG icons found in the provided JSON.");
            }
        } catch (e) {
            const msg = (e as Error)?.message || String(e);
            new obsidian.Notice(`Failed to import icon pack: ${msg}`, 6000);
            console.error("Colorful Folders: URL Import failed", e);
        }
    }
}
