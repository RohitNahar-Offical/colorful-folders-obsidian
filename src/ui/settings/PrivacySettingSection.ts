import * as obsidian from 'obsidian';
import { SettingSection } from './SettingSection';
import { t } from '../../lang/helpers';
import { DEFAULT_SETTINGS } from '../../common/constants';
import { FolderStyle, ColorfulFoldersSettings } from '../../common/types';
import { PasswordModal } from '../modals/PasswordModal';
import { ConfirmModal } from '../modals/ConfirmModal';

export class PrivacySettingSection extends SettingSection {
    render(containerEl: HTMLElement): void {
        // 🔏 Privacy & Stealth Card
        const stealthCard = this.settingTab.makeCard(containerEl, "🔏", "Privacy & stealth");
        const isLocked = !!(this.plugin.settings.vaultPassword && this.plugin.settings.isVaultLocked);

        if (this.plugin.settings.vaultPassword) {
            new obsidian.Setting(stealthCard)
                .setName(isLocked ? "Vault is locked" : "Vault is unlocked")
                .setDesc(isLocked ? "Unlock to manage hidden items and privacy settings." : "Privacy settings are currently accessible.")
                .addButton(btn => {
                    if (isLocked) {
                        btn.setButtonText(t("settings.unlock"))
                            .setCta()
                            .onClick(() => {
                                new PasswordModal(this.app, "Unlock privacy", async (pass) => {
                                    if (pass === this.plugin.settings.vaultPassword) {
                                        this.plugin.settings.isVaultLocked = false;
                                        await this.plugin.saveSettings();
                                        new obsidian.Notice(t("notice.vault_unlocked"));

                                        (this.settingTab as unknown as { display: () => void }).display();
                                        return true;
                                    } else {
                                        new obsidian.Notice(t("notice.incorrect_password"));
                                        return false;
                                    }
                                }).open();
                            });
                    } else {
                        btn.setButtonText(t("settings.lock_now"))
                            .onClick(async () => {
                                this.plugin.settings.isVaultLocked = true;
                                await this.plugin.saveSettings();
                                new obsidian.Notice(t("notice.vault_locked"));

                                (this.settingTab as unknown as { display: () => void }).display();
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
                .setName(t("settings.ghost_mode.name"))
                .setDesc('Reveal hidden items with low opacity and blur. Note: items are still clickable in this mode.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showHiddenItems)
                    .onChange(async (value) => {
                        this.plugin.settings.showHiddenItems = value;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                    }));

            new obsidian.Setting(stealthCard)
                .setName(t("settings.vault_password.name"))
                .setDesc('Set a password to lock the hidden items list and ghost mode. Leave empty to disable.')
                .addText(text => {
                    text.setPlaceholder(t("common.enter_password"))
                        .setValue(this.plugin.settings.vaultPassword || "")
                        .onChange(async (value) => {
                            this.plugin.settings.vaultPassword = value;
                            if (!value) this.plugin.settings.isVaultLocked = false;
                            await this.plugin.saveSettings();
                        });

                    text.inputEl.onblur = () => {
                        (this.settingTab as unknown as { display: () => void }).display();
                    };
                    text.inputEl.type = "password";
                });

            new obsidian.Setting(stealthCard)
                .setName(t("settings.show_ribbon.name"))
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
            hiddenListContainer.createEl("h4", { text: t("settings.hidden_items") }).setCssStyles({ marginBottom: "10px", fontSize: "0.9em", opacity: "0.8" });

            const hiddenList = hiddenListContainer.createDiv({ cls: 'cf-hidden-items-list' });
            hiddenList.setCssStyles({
                padding: '12px', background: 'var(--background-secondary)',
                borderRadius: '8px', border: '1px solid var(--background-modifier-border)',
                maxHeight: "200px", overflowY: "auto"
            });

            const hiddenEntries = Object.entries(this.plugin.settings.customFolderColors || {})
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

                            (this.settingTab as unknown as { display: () => void }).display();
                        }
                    };
                });
            }
        }

        // 🗄️ Database & Backup Management Card
        const dbCard = this.settingTab.makeCard(containerEl, "🗄️", "Database & Backup Management");
        new obsidian.Setting(dbCard)
            .setName(t("settings.clean_stale.name"))
            .setDesc('Scans your configuration and removes style entries for folders or files that no longer exist in your vault.')
            .addButton(btn => btn
                .setButtonText(t("settings.clean_stale.btn"))
                .onClick(async () => {
                    await this.plugin.cleanUnusedStyles();

                    (this.settingTab as unknown as { display: () => void }).display();
                }));

        const triggerDownload = (data: Record<string, unknown>, filename: string) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const doc = this.settingTab.containerEl.ownerDocument;
            const a = this.settingTab.containerEl.createEl("a");
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
            .setName(t("settings.backup_folders.name"))
            .setDesc('Download a backup of your colorful folder and file styles (excludes dividers).')
            .addButton(btn => btn
                .setButtonText(t("settings.backup_folders.btn"))
                .onClick(() => {
                    const folderData: Record<string, FolderStyle | string> = {};
                    for (const [key, value] of Object.entries(this.plugin.settings.customFolderColors || {})) {
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
            .setName(t("settings.backup_dividers.name"))
            .setDesc(t("settings.backup_dividers.desc"))
            .addButton(btn => btn
                .setButtonText(t("settings.backup_dividers.btn"))
                .onClick(() => {
                    const dividerData: Record<string, FolderStyle> = {};
                    for (const [key, value] of Object.entries(this.plugin.settings.customFolderColors || {})) {
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
            .setName(t("settings.restore.name"))
            .setDesc('Restore folder styles or dividers from a previous backup file. This will merge with your current settings.')
            .addButton(btn => btn
                .setButtonText(t("settings.restore.btn"))
                .onClick(() => {
                    const doc = this.settingTab.containerEl.ownerDocument;
                    const input = this.settingTab.containerEl.createEl('input');
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
                                    new obsidian.Notice(t("notice.invalid_backup_format"));
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
                                    new obsidian.Notice(t("notice.folder_backup_restored"));
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
                                    new obsidian.Notice(t("notice.dividers_backup_restored"));
                                } else {
                                    new obsidian.Notice(t("notice.invalid_backup_format"));
                                    return;
                                }
                                await this.plugin.saveSettings();
                                this.plugin.generateStylesDebounced();
                                this.plugin.dividerManager.syncDividers();

                                (this.settingTab as unknown as { display: () => void }).display();
                            } catch (err) {
                                console.error(err);
                                new obsidian.Notice(t("notice.backup_parse_failed"));
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
            .setName(t("settings.reset_styles.name"))
            .setDesc('Danger: this will permanently remove all custom colors, icons, and individual folder styles. Presets are also cleared.')
            .addButton(btn => {
                btn.setButtonText(t("settings.reset_styles.btn"));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Reset styles and presets", "Are you sure you want to delete all custom styling and presets? This cannot be undone.", async () => {
                        this.plugin.settings.customFolderColors = {};
                        this.plugin.settings.presets = {};
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        new obsidian.Notice(t("notice.styles_reset"));

                        (this.settingTab as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        new obsidian.Setting(dbCard)
            .setName(t("settings.factory_reset.name"))
            .setDesc('Critical: this will reset every setting in the plugin to its original default state, including opacities, toggles, and all custom data.')
            .addButton(btn => {
                btn.setButtonText(t("settings.factory_reset.btn"));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Factory reset", "Are you sure you want to restore all settings to default? This will wipe ALL your customization!", async () => {
                        this.plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ColorfulFoldersSettings;
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        this.plugin.dividerManager.clean();
                        this.plugin.dividerManager.syncDividers();
                        new obsidian.Notice(t("notice.factory_reset"));

                        (this.settingTab as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        // 🔧 Icon Maintenance Card
        const maintCard = this.settingTab.makeCard(containerEl, "🔧", "Icon maintenance");
        new obsidian.Setting(maintCard)
            .setName(t("settings.register_all_icons"))
            .setDesc('Ensures all icons in your library are properly loaded into Obsidian.')
            .addButton(btn => btn
                .setButtonText(t("settings.re_register_icons"))
                .onClick(() => {
                    this.plugin.registerCustomIcons();
                    new obsidian.Notice(t("notice.all_icons_re_registered"));
                }));

        new obsidian.Setting(maintCard)
            .setName(t("settings.clear_icon_lib.name"))
            .setDesc(t("settings.clear_icon_lib.desc"))
            .addButton(btn => {
                btn.setButtonText(t("settings.clear_icon_lib.name"));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(() => {
                    new ConfirmModal(this.app, "Clear icon library", "Are you sure you want to delete ALL custom icons?", async () => {
                        this.plugin.settings.customIcons = {};
                        this.plugin.registerCustomIcons();
                        await this.plugin.saveSettings();
                        this.plugin.generateStylesDebounced();
                        new obsidian.Notice(t("notice.icon_library_cleared"));

                        (this.settingTab as unknown as { display: () => void }).display();
                    }).open();
                });
            });

        // ❤️ Support Developer Card
        const sponsorCard = this.settingTab.makeCard(containerEl, "❤️", "Support the developer");
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
}
