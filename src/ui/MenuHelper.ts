import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, MenuItemWithSubmenu } from '../common/types';
import { ColorPickerModal } from './modals/ColorPickerModal';
import { t } from '../lang/helpers';
import { DividerModal } from './modals/DividerModal';

export class MenuHelper {
    static addContextMenuItems(menu: obsidian.Menu, file: obsidian.TAbstractFile, plugin: IColorfulFoldersPlugin) {
        // ── Step 1: Divider Management ────
        const style = plugin.settings.customFolderColors[file.path];

        if (style && typeof style === 'object' && style.hasDivider) {
            menu.addItem((item) => {
                item.setTitle(t("menu.edit_divider"))
                    .setIcon('settings-2')
                    .onClick(() => {
                        new DividerModal(plugin.app, plugin, file).open();
                    });
            });

            menu.addItem((remove) => {
                remove.setTitle(t("menu.remove_divider"))
                    .setIcon('trash-2')
                    .setWarning(true)
                    .onClick(async () => {
                        const styleObj = plugin.settings.customFolderColors[file.path];
                        if (styleObj && typeof styleObj === 'object') {
                            styleObj.hasDivider = false;
                            // Clean up divider specific fields
                            delete styleObj.dividerText;
                            delete styleObj.dividerColor;
                            delete styleObj.dividerIcon;
                            delete styleObj.dividerAlignment;
                            delete styleObj.dividerLineStyle;
                            delete styleObj.dividerUpper;
                            delete styleObj.dividerGlass;
                        }
                        
                        await plugin.saveSettings();
                        void plugin.generateStyles();
                        plugin.dividerManager.syncDividers();
                        new obsidian.Notice(t("notice.removed_divider_for"));
                    });
            });
        } else {
            menu.addItem((item) => {
                item.setTitle(t("menu.add_divider"))
                    .setIcon('separator-horizontal')
                    .onClick(() => {
                        new DividerModal(plugin.app, plugin, file).open();
                    });
            });
        }
        
        menu.addItem((item) => {
            const isHidden = style && typeof style === 'object' && style.isHidden;
            item.setTitle(isHidden ? t("menu.unhide_item") : t("menu.hide_item"))
                .setIcon(isHidden ? 'eye' : 'eye-off')
                .onClick(async () => {
                    let s = plugin.settings.customFolderColors[file.path];
                    if (!s || typeof s === 'string') {
                        s = { hex: typeof s === 'string' ? s : '' };
                        plugin.settings.customFolderColors[file.path] = s;
                    }
                    s.isHidden = !s.isHidden;
                    await plugin.saveSettings();
                    void plugin.generateStyles();
                    new obsidian.Notice(t(s.isHidden ? "notice.hidden_for" : "notice.revealed_for"));
                });
        });

        menu.addSeparator();

        // ── Step 2: Styling ──
        if (obsidian.Platform.isMobile) {
            // Flatten on mobile since native sheets don't support nested submenus
            menu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle(t("menu.change_icon_color"))
                    .setIcon('palette')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'icon').open();
                    });
            });

            menu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle(t("menu.change_color_only"))
                    .setIcon('pipette')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'color').open();
                    });
            });

            menu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle(t("menu.change_background"))
                    .setIcon('paint-bucket')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'background').open();
                    });
            });

            const existing = plugin.settings.customFolderColors[file.path];
            if (existing) {
                menu.addItem((sub: obsidian.MenuItem) => {
                    sub.setTitle(t("menu.clear_style"))
                        .setIcon('eraser')
                        .onClick(async () => {
                            delete plugin.settings.customFolderColors[file.path];
                            await plugin.saveSettings();
                            void plugin.generateStyles();
                            new obsidian.Notice(t("notice.cleared_style"));
                        });
                });
            }
        } else {
            // Grouped in submenu on desktop for a cleaner UI layout
            menu.addItem((item: obsidian.MenuItem) => {
                item.setTitle(t("menu.set_custom_style"))
                    .setIcon('palette');
                
                const subMenu = (item as MenuItemWithSubmenu).setSubmenu();

                subMenu.addItem((sub: obsidian.MenuItem) => {
                    sub.setTitle(t("menu.change_icon_color"))
                        .setIcon('palette')
                        .onClick(() => {
                            new ColorPickerModal(plugin.app, plugin, file, 'icon').open();
                        });
                });

                subMenu.addItem((sub: obsidian.MenuItem) => {
                    sub.setTitle(t("menu.change_color_only"))
                        .setIcon('pipette')
                        .onClick(() => {
                            new ColorPickerModal(plugin.app, plugin, file, 'color').open();
                        });
                });

                subMenu.addItem((sub: obsidian.MenuItem) => {
                    sub.setTitle(t("menu.change_background"))
                        .setIcon('paint-bucket')
                        .onClick(() => {
                            new ColorPickerModal(plugin.app, plugin, file, 'background').open();
                        });
                });

                const existing = plugin.settings.customFolderColors[file.path];
                if (existing) {
                    subMenu.addSeparator();
                    subMenu.addItem((sub: obsidian.MenuItem) => {
                        sub.setTitle(t("menu.clear_style"))
                            .setIcon('eraser')
                            .onClick(async () => {
                                delete plugin.settings.customFolderColors[file.path];
                                await plugin.saveSettings();
                                void plugin.generateStyles();
                                new obsidian.Notice(t("notice.cleared_style"));
                            });
                    });
                }
            });
        }
    }
}
