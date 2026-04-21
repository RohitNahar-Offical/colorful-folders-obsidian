import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, MenuItemWithSubmenu } from '../common/types';
import { ColorPickerModal } from './modals/ColorPickerModal';
import { DividerModal } from './modals/DividerModal';

export class MenuHelper {
    static addContextMenuItems(menu: obsidian.Menu, file: obsidian.TAbstractFile, plugin: IColorfulFoldersPlugin) {
        // ── Step 1: Divider Management ────
        const style = plugin.settings.customFolderColors[file.path];

        if (style && typeof style === 'object' && style.hasDivider) {
            menu.addItem((item) => {
                item.setTitle("Edit divider")
                    .setIcon('settings-2')
                    .onClick(() => {
                        new DividerModal(plugin.app, plugin, file).open();
                    });
            });

            menu.addItem((remove) => {
                remove.setTitle("Remove divider")
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
                        plugin.generateStyles();
                        plugin.dividerManager.syncDividers();
                        new obsidian.Notice(`Removed divider for: ${file.name}`);
                    });
            });
        } else {
            menu.addItem((item) => {
                item.setTitle("Add divider")
                    .setIcon('separator-horizontal')
                    .onClick(() => {
                        new DividerModal(plugin.app, plugin, file).open();
                    });
            });
        }
        
        menu.addItem((item) => {
            const isHidden = style && typeof style === 'object' && style.isHidden;
            item.setTitle(isHidden ? "Unhide item" : "Hide item")
                .setIcon(isHidden ? 'eye' : 'eye-off')
                .onClick(async () => {
                    let s = plugin.settings.customFolderColors[file.path];
                    if (!s || typeof s === 'string') {
                        s = { hex: typeof s === 'string' ? s : '' };
                        plugin.settings.customFolderColors[file.path] = s;
                    }
                    s.isHidden = !s.isHidden;
                    await plugin.saveSettings();
                    plugin.generateStyles();
                    new obsidian.Notice(`${s.isHidden ? 'Hidden' : 'Revealed'}: ${file.name}`);
                });
        });

        menu.addSeparator();

        // ── Step 2: Styling (Grouped in Submenu) ──
        menu.addItem((item: obsidian.MenuItem) => {
            item.setTitle('Set custom style')
                .setIcon('palette');
            
            const subMenu = (item as MenuItemWithSubmenu).setSubmenu();

            subMenu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle('Change icon / color')
                    .setIcon('palette')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'icon').open();
                    });
            });

            subMenu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle('Change color')
                    .setIcon('pipette')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'color').open();
                    });
            });

            subMenu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle('Change background')
                    .setIcon('paint-bucket')
                    .onClick(() => {
                        new ColorPickerModal(plugin.app, plugin, file, 'background').open();
                    });
            });

            const existing = plugin.settings.customFolderColors[file.path];
            if (existing) {
                subMenu.addSeparator();
                subMenu.addItem((sub: obsidian.MenuItem) => {
                    sub.setTitle('Clear style')
                        .setIcon('eraser')
                        .onClick(async () => {
                            delete plugin.settings.customFolderColors[file.path];
                            await plugin.saveSettings();
                            new obsidian.Notice(`Cleared style for ${file.name}`);
                        });
                });
            }
        });
    }
}
