import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';
import { DEFAULT_SETTINGS } from '../common/constants';
import { PasswordModal } from './modals/PasswordModal';
import { ConfirmModal } from './modals/ConfirmModal';
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
        const heroTitle = hero.createEl('h1', { text: 'Colorful folders' });
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
        const btnInt = tabBar.createEl("button", { text: "Integrations", cls: 'cf-tab-btn' });
        const btnIcon = tabBar.createEl("button", { text: "Icon packs", cls: 'cf-tab-btn' });
        const btnSys = tabBar.createEl("button", { text: "System", cls: 'cf-tab-btn' });

        const setHeroInfo = (t: string) => {
            if (t === "gen") { heroTitle.setText("Visual design"); heroSubtitle.setText("Tailor your vault's interface with premium palettes and refined structural aesthetics."); }
            if (t === "int") { heroTitle.setText("Integrations"); heroSubtitle.setText("Seamlessly connect with external extensions and optimize your workflow."); }
            if (t === "icon") { heroTitle.setText("Icon logic"); heroSubtitle.setText("Command a vast library of symbols with intelligent automation rules."); }
            if (t === "sys") { heroTitle.setText("System"); heroSubtitle.setText("Maintain peak performance and manage your styling engine's core."); }
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
        const intCard = makeCard(intPanel, "🔗", "Notebook navigator");
        new obsidian.Setting(intCard)
            .setName('Enable notebook navigator support')
            .setDesc('Allows colorful folders to safely style the icons and text of notebook navigator items.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorSupport)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorSupport = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(intCard)
            .setName('Apply background colors to files')
            .setDesc('Injects the faint background block and left border to file cards. Disable this to keep the cards strictly native.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorFileBackground)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorFileBackground = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(intCard)
            .setName('Outline only mode (navigator)')
            .setDesc('Removes solid backgrounds from notebook navigator items, showing only the left accent border.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notebookNavigatorOutlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.notebookNavigatorOutlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        // ──────────────────────────────────────────────────────────────────────
        // ── ICON PACKS PANEL ──────────────────────────────────────────────────
        // ──────────────────────────────────────────────────────────────────────
        const customIconCard = makeCard(iconPanel, "📦", "Custom icon management");

        const iconDesc = customIconCard.createEl("p", { text: "Add individual SVG icons or import bulk packs from the internet. All custom icons added here will appear in the icon selection grid when styling a folder or file." });
        iconDesc.setCssStyles({ fontSize: "0.85em", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" });

        const tip = customIconCard.createEl("div", { text: "Pro tip: custom ids should be unique. Avoid starting them with 'lucide-' unless you intend to override a built-in Obsidian icon." });
        tip.setCssStyles({ fontSize: "0.8em", color: "var(--text-accent)", marginBottom: "15px", fontStyle: "italic" });

        const manualWrap = customIconCard.createDiv();
        manualWrap.setCssStyles({
            padding: "16px", background: "var(--background-secondary-alt)", borderRadius: "10px",
            border: "1px solid var(--background-modifier-border)", marginBottom: "20px"
        });

        const manualTitle = manualWrap.createEl("div", { text: "Add single icon" });
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
            this.display();
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
            { name: "🔥 Ultimate collection", desc: "Curated community starter pack.", url: "https://raw.githubusercontent.com/RohitNahar-Offical/colorful-folders-obsidian/master/icons/community-core.json", prefix: "cf" }
        ];

        packs.forEach(p => {
            const row = featCard.createDiv("setting-item");
            Object.assign(row.style, {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", gap: "20px"
            });

            const content = row.createDiv();
            content.setCssStyles({ flex: "1" });

            const pName = content.createEl("div", { text: p.name });
            pName.setCssStyles({ fontWeight: "600" });
            const pDesc = content.createEl("div", { text: p.desc });
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
                this.display();
            };
        });

        const libCard = makeCard(iconPanel, "📚", "Custom icon library");
        const lib = libCard.createDiv("cf-icon-grid");
        const customIconList = Object.entries(this.plugin.settings.customIcons);
        if (customIconList.length === 0) {
            const emptyMsg = libCard.createEl("div", { text: "No custom icons found." });
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
                    this.display();
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
            .addButton(btn => btn
                .setButtonText('Clear icon library')
                .setWarning()
                .onClick(() => {
                    new ConfirmModal(this.app, "Clear icon library", "Are you sure you want to delete ALL custom icons?", async () => {
                        this.plugin.settings.customIcons = {};
                        this.plugin.registerCustomIcons();
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        new obsidian.Notice("Icon library cleared.");
                        this.display();
                    }).open();
                }));

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
                        this.display();
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
        infoText.appendText(' to assign specific unique colors or icons!');

        const genCard = makeCard(generalPanel, "🎨", "Global visual palette");

        new obsidian.Setting(genCard)
            .setName('Color palette theme')
            .setDesc('Select a curated color scheme for your vault. Choose "custom" to enter your own hex codes below.')
            .addDropdown(drop => drop
                .addOption('Vibrant Rainbow', 'Vibrant rainbow')
                .addOption('Muted Dark Mode', 'Muted dark mode')
                .addOption('Pastel Dreams', 'Pastel dreams')
                .addOption('Neon Cyberpunk', 'Neon cyberpunk')
                .addOption('Custom', 'Custom palette')
                .setValue(this.plugin.settings.palette)
                .onChange(async (value) => {
                    this.plugin.settings.palette = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(genCard)
            .setName('Custom colors (hex)')
            .setDesc('Comma-separated list of hex colors.')
            .addText(text => text
                .setPlaceholder('Hex codes: #ff0000, #00ff00')
                .setValue(this.plugin.settings.customPalette)
                .onChange(async (value) => {
                    this.plugin.settings.customPalette = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(genCard)
            .setName('Folder exclusion list')
            .setDesc('Comma-separated list of folder names to ignore. Note: folder names are case-insensitive.')
            .addText(text => text
                .setPlaceholder('Templates, attachments, .git')
                .setValue(this.plugin.settings.exclusionList || "")
                .onChange(async (value) => {
                    this.plugin.settings.exclusionList = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
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
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(genCard)
            .setName('Global default background')
            .setDesc('Set a universal background color for all folders/files that do not have a custom style. Leave empty for theme-default (transparent).')
            .addText(text => text
                .setPlaceholder('Hex: #2a2a2a')
                .setValue(this.plugin.settings.globalBackgroundColor || "")
                .onChange(async (value) => {
                    this.plugin.settings.globalBackgroundColor = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        if (this.plugin.settings.colorMode === 'cycle') {
            new obsidian.Setting(genCard)
                .setName('Rainbow cycle offset')
                .setDesc('Shift the starting color index for the rainbow cycle.')
                .addSlider(slider => slider
                    .setLimits(0, 20, 1)
                    .setValue(this.plugin.settings.cycleOffset || 0)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.cycleOffset = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
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
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(genCard)
            .setName('Focus mode')
            .setDesc('Dims inactive root folders when you are working deep inside a project path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.focusMode)
                .onChange(async (value) => {
                    this.plugin.settings.focusMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(genCard)
            .setName('Glassmorphism blur')
            .setDesc('Adds an iOS-style backdrop blur to folder backgrounds. Best with semi-translucent themes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.glassmorphism)
                .onChange(async (value) => {
                    this.plugin.settings.glassmorphism = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        const activeCard = makeCard(generalPanel, "✨", "Active item appearance");
        new obsidian.Setting(activeCard)
            .setName('Use custom active file colors')
            .setDesc('Enable this to override the default "Luminous Selection" colors with your own.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomActiveColor)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomActiveColor = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                    this.display(); // Refresh to show/hide sub-settings
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
                            this.plugin.saveSettings().then(() => this.plugin.generateStyles());
                        }, { showAlpha: true, initialAlpha: current.alpha });
                    }))
                .addText(text => {
                    bgTextComp = text;
                    text.setPlaceholder('#ffffff')
                        .setValue(this.plugin.settings.customActiveBg || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveBg = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStyles();
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
                            this.plugin.saveSettings().then(() => this.plugin.generateStyles());
                        }, { showAlpha: true, initialAlpha: current.alpha });
                    }))
                .addText(text => {
                    textColorTextComp = text;
                    text.setPlaceholder('#c0c0c0')
                        .setValue(this.plugin.settings.customActiveText || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customActiveText = value;
                            await this.plugin.saveSettings();
                            this.plugin.generateStyles();
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
        new obsidian.Setting(visCard)
            .setName('Light mode brightness (%)')
            .addSlider(slider => slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.lightModeBrightness || 0)
                .onChange(async (value) => {
                    this.plugin.settings.lightModeBrightness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(visCard)
            .setName('Dark mode brightness (%)')
            .addSlider(slider => slider
                .setLimits(-100, 100, 1)
                .setValue(this.plugin.settings.darkModeBrightness || 0)
                .onChange(async (value) => {
                    this.plugin.settings.darkModeBrightness = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(visCard)
            .setName('Outline only mode')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.outlineOnly)
                .onChange(async (value) => {
                    this.plugin.settings.outlineOnly = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(visCard)
            .setName('Auto-color files (backgrounds)')
            .setDesc('Automatically apply background tints to files to match their parent folder.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoColorFiles)
                .onChange(async (value) => {
                    this.plugin.settings.autoColorFiles = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(visCard)
            .setName('Global icon scaling')
            .setDesc('Multiplies the size of all folder and file icons (default 1.0). Range: 0.5 to 2.5.')
            .addSlider(slider => slider
                .setLimits(0.5, 2.5, 0.1)
                .setValue(this.plugin.settings.iconScale || 1.0)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.iconScale = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
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




        const autoCard = makeCard(iconPanel, "🤖", "Automation engine");
        new obsidian.Setting(autoCard)
            .setName('Enable automatic icons')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIcons)
                .onChange(async (value) => {
                    this.plugin.settings.autoIcons = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                    this.display();
                }));

        if (this.plugin.settings.autoIcons) {
            new obsidian.Setting(autoCard)
                .setName('Wide icon rendering (lucide svgs)')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.wideAutoIcons)
                    .onChange(async (value) => {
                        this.plugin.settings.wideAutoIcons = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                    }));

            new obsidian.Setting(autoCard)
                .setName('Icon variety mode')
                .setDesc('Assigns different icons to items within the same category for better visual distinction.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.autoIconVariety)
                    .onChange(async (value) => {
                        this.plugin.settings.autoIconVariety = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                    }));


            const rulesDesc = autoCard.createDiv();
            rulesDesc.setCssStyles({
                fontSize: "0.8em", color: "var(--text-muted)", marginBottom: "12px",
                padding: "10px", background: "var(--background-secondary-alt)", borderRadius: "6px",
                borderLeft: "3px solid var(--interactive-accent)", lineHeight: "1.4"
            });
            rulesDesc.createEl('strong', { text: 'How to use priority rules:' });
            rulesDesc.createEl('br');
            rulesDesc.appendText('Define rules to automatically assign icons based on folder/file names.');
            rulesDesc.createEl('br');
            rulesDesc.createEl('br');
            rulesDesc.createEl('strong', { text: 'Simplified format: ' });
            rulesDesc.createEl('code', { text: 'Pattern = iconid @priority' });
            rulesDesc.createEl('br');
            rulesDesc.createEl('strong', { text: 'Example: ' });
            rulesDesc.createEl('code', { text: 'Projects = rocket @200' });
            rulesDesc.createEl('br');
            rulesDesc.createEl('strong', { text: 'Example: ' });
            rulesDesc.createEl('code', { text: 'Journal = 📅 @150' });

            new obsidian.Setting(autoCard)
                .setName('Priority rules')
                .setDesc('Customize matching logic with simple patterns.')
                .addTextArea(text => {
                    text.setPlaceholder("Work = briefcase @200\ndaily = 📅 @150")
                        .setValue(this.plugin.settings.customIconRules || "")
                        .onChange(async (value) => {
                            this.plugin.settings.customIconRules = value;
                            await this.plugin.saveSettings();
                        });
                    text.inputEl.setCssStyles({
                        width: "100%", height: "120px", background: "var(--background-secondary)",
                        border: "1px solid var(--background-modifier-border-focus)",
                        color: "var(--text-normal)", fontFamily: "var(--font-monospace)",
                        fontSize: "0.85em", padding: "12px", borderRadius: "6px"
                    });
                });
        }

        const divCard = makeCard(generalPanel, "➖", "Dividers and sections");

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
                    this.plugin.generateStyles();
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

                        const current = parseColorToHexAlpha(this.plugin.settings.dividerPillColor);
                        createVisualColorPicker(pickerWrap, current.hex, (hex, alpha) => {
                            const rgba = hexAlphaToRgba(hex, alpha);
                            this.plugin.settings.dividerPillColor = rgba;
                            textComp.setValue(rgba);
                            colorBox.setCssStyles({ backgroundColor: rgba });
                            this.plugin.saveSettings().then(() => {
                                this.plugin.generateStyles();
                                updatePreview();
                            }).catch(err => console.error("Failed to save settings from color picker:", err));
                        }, { showAlpha: true, initialAlpha: current.alpha });
                    });
            })
            .addText(text => {
                textComp = text;
                text.setPlaceholder('E.g., rgba(255, 255, 255, 0.1)')
                    .setValue(this.plugin.settings.dividerPillColor || "")
                    .onChange(async (value) => {
                        this.plugin.settings.dividerPillColor = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        updatePreview();
                        colorBox.setCssStyles({ backgroundColor: value || 'transparent' });
                    });

                colorBox = text.inputEl.parentElement.createDiv();
                colorBox.setCssStyles({
                    width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--background-modifier-border)',
                    marginLeft: '12px', backgroundColor: this.plugin.settings.dividerPillColor || 'transparent',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                });
            });

        new obsidian.Setting(divCard)
            .setName('Vertical spacing')
            .setDesc('Adjust the empty space above and below dividers.')
            .addSlider(slider => slider
                .setLimits(4, 40, 2)
                .setValue(this.plugin.settings.dividerSpacing || 16)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dividerSpacing = value;
                    await this.plugin.saveSettings();
                    this.plugin.dividerManager.syncDividers();
                    updatePreview();
                }));
        new obsidian.Setting(divCard)
            .setName('Line thickness')
            .addSlider(slider => slider
                .setLimits(1, 10, 0.5)
                .setValue(this.plugin.settings.dividerThickness || 1.5)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dividerThickness = value;
                    await this.plugin.saveSettings();
                    this.plugin.dividerManager.syncDividers();
                    updatePreview();
                }));

        new obsidian.Setting(divCard)
            .setName('Line gap (left)')
            .setDesc('Adjust horizontal space between the left divider line and the central label.')
            .addSlider(slider => slider
                .setLimits(-10, 40, 1)
                .setValue(this.plugin.settings.dividerLinePaddingLeft ?? 8)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dividerLinePaddingLeft = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                    updatePreview();
                }));

        new obsidian.Setting(divCard)
            .setName('Line gap (right)')
            .setDesc('Adjust horizontal space between the right divider line and the central label.')
            .addSlider(slider => slider
                .setLimits(-10, 40, 1)
                .setValue(this.plugin.settings.dividerLinePaddingRight ?? 8)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dividerLinePaddingRight = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                    updatePreview();
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

        const typeCard = makeCard(generalPanel, "Aa", "Path and typography");
        new obsidian.Setting(typeCard)
            .setName('Show item counters')
            .setDesc('Displays recursive folder and file counts next to folder names.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showItemCounters)
                .onChange(async (value) => {
                    this.plugin.settings.showItemCounters = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(typeCard)
            .setName('Rainbow root text')
            .setDesc('Applies a vivid rainbow-text horizontal gradient to all top-level folders.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rainbowRootText)
                .onChange(async (value) => {
                    this.plugin.settings.rainbowRootText = value;
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                    this.display();
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
                        this.plugin.generateStyles();
                    }));
        }

        const tuneCard = makeCard(generalPanel, "🎛️", "Advanced tuning");

        new obsidian.Setting(tuneCard)
            .setName('Root opacity (%)')
            .setDesc('Transparency of top-level folders in file explorer.')
            .addSlider(slider => slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.rootOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.rootOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(tuneCard)
            .setName('Subfolder opacity (%)')
            .setDesc('Transparency of nested subfolders.')
            .addSlider(slider => slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.subfolderOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.subfolderOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));

        new obsidian.Setting(tuneCard)
            .setName('Opened folder backing tint (%)')
            .setDesc('Controls how highly tinted the background content space becomes when you open a directory.')
            .addSlider(slider => slider
                .setLimits(0, 100, 1)
                .setValue(this.plugin.settings.tintOpacity * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.tintOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
                }));


        new obsidian.Setting(tuneCard)
            .setName('File background opacity (%)')
            .setDesc('Global transparency for all auto-colored files (default 10%).')
            .addSlider(slider => slider
                .setLimits(0, 100, 1)
                .setValue((this.plugin.settings.fileBackgroundOpacity !== undefined ? this.plugin.settings.fileBackgroundOpacity : 0.1) * 100)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.fileBackgroundOpacity = parseFloat((value / 100).toFixed(3));
                    await this.plugin.saveSettings();
                    this.plugin.generateStyles();
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
                                        this.display();
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
                                this.display();
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
            lockedContainer.createEl("div", { text: "🔒", cls: "cf-lock-icon" }).setCssStyles({ fontSize: "2em", marginBottom: "10px" });
            lockedContainer.createEl("div", { text: "Settings are protected" }).setCssStyles({ fontWeight: "bold", marginBottom: "4px" });
            lockedContainer.createEl("div", { text: "Enter your password above to manage hidden folders." }).setCssStyles({ opacity: "0.5", fontSize: "0.85em" });
        } else {
            new obsidian.Setting(stealthCard)
                .setName('Ghost mode')
                .setDesc('Reveal hidden items with low opacity and blur. Note: items are still clickable in this mode.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showHiddenItems)
                    .onChange(async (value) => {
                        this.plugin.settings.showHiddenItems = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
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
                        this.display();
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
                            this.plugin.generateStyles();
                            this.display();
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
                    this.display();
                }));

        new obsidian.Setting(dbCard)
            .setName('Reset styles and presets')
            .setDesc('Danger: this will permanently remove all custom colors, icons, and individual folder styles. Presets are also cleared.')
            .addButton(btn => btn
                .setButtonText('Reset styling')
                .setWarning()
                .onClick(() => {
                    new ConfirmModal(this.app, "Reset styles and presets", "Are you sure you want to delete all custom styling and presets? This cannot be undone.", async () => {
                        this.plugin.settings.customFolderColors = {};
                        this.plugin.settings.presets = {};
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        new obsidian.Notice("Styles and presets have been reset.");
                        this.display();
                    }).open();
                }));

        new obsidian.Setting(dbCard)
            .setName('Factory reset')
            .setDesc('Critical: this will reset every setting in the plugin to its original default state, including opacities, toggles, and all custom data.')
            .addButton(btn => btn
                .setButtonText('Hard reset everything')
                .setWarning()
                .onClick(() => {
                    new ConfirmModal(this.app, "Factory reset", "Are you sure you want to restore all settings to default? This will wipe ALL your customization!", async () => {
                        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        this.plugin.dividerManager.syncDividers();
                        new obsidian.Notice("All settings have been restored to defaults.");
                        this.display();
                    }).open();
                }));


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
            this.display();
        } catch (e) {
            new obsidian.Notice("Import failed. See console for details.");
            console.error("Colorful Folders: Import error", e);
        }
    }
}


