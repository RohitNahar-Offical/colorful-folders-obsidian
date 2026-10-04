import * as obsidian from 'obsidian';
import type { IColorfulFoldersPlugin } from '../../common/types';

/** Fine-tuning for auto contrast: how far colors shift and when they snap to black or white. */
export class AutoContrastModal extends obsidian.Modal {
    constructor(app: obsidian.App, private plugin: IColorfulFoldersPlugin, private onSave: () => Promise<void>) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        const s = this.plugin.settings;
        this.setTitle('Auto contrast');

        new obsidian.Setting(contentEl)
            .setName('Auto contrast shift')
            .setDesc('How far auto contrast moves each color, in palette steps (0.1 lightness each). Default 3.')
            .addSlider(el => el
                .setLimits(1, 6, 0.5)
                .setValue(s.cfAutoSteps ?? 3)
                .onChange(async (v) => {
                    s.cfAutoSteps = v;
                    await this.onSave();
                }));

        new obsidian.Setting(contentEl)
            .setName('Snap to black or white')
            .setDesc('On: a shift that runs past the end becomes pure white or pure black. Off: it stops just short and keeps a tint.')
            .addToggle(el => el
                .setValue(s.cfAutoSnap ?? true)
                .onChange(async (v) => {
                    s.cfAutoSnap = v;
                    await this.onSave();
                }));

        new obsidian.Setting(contentEl)
            .setName('Snap tolerance')
            .setDesc('With snap on, a shifted color within this many percent of white or black goes all the way. 0 = only when it runs past the end.')
            .addSlider(el => el
                .setLimits(0, 30, 1)
                .setValue(s.cfAutoTolerance ?? 0)
                .onChange(async (v) => {
                    s.cfAutoTolerance = v;
                    await this.onSave();
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}
