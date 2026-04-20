import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';
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

        menu.addSeparator();

        // ── Step 2: Styling (Flattened - No Submenu for NN compatibility) ──
        menu.addItem((sub: obsidian.MenuItem) => {
            sub.setTitle('Change icon / color')
                .setIcon('palette')
                .onClick(() => {
                    new ColorPickerModal(plugin.app, plugin, file, 'icon').open();
                });
        });

        menu.addItem((sub: obsidian.MenuItem) => {
            sub.setTitle('Change color')
                .setIcon('pipette')
                .onClick(() => {
                    new ColorPickerModal(plugin.app, plugin, file, 'color').open();
                });
        });

        menu.addItem((sub: obsidian.MenuItem) => {
            sub.setTitle('Change background')
                .setIcon('paint-bucket')
                .onClick(() => {
                    new ColorPickerModal(plugin.app, plugin, file, 'background').open();
                });
        });

        const existing = plugin.settings.customFolderColors[file.path];
        if (existing) {
            menu.addItem((sub: obsidian.MenuItem) => {
                sub.setTitle('Clear style')
                    .setIcon('eraser')
                    .onClick(async () => {
                        delete plugin.settings.customFolderColors[file.path];
                        await plugin.saveSettings();
                        new obsidian.Notice(`Cleared style for ${file.name}`);
                    });
            });
        }
    }
}
