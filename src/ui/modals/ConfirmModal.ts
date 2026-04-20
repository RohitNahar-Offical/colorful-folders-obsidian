import { App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
    private onConfirm: () => void | Promise<void>;
    private message: string;
    private title: string;

    // eslint-disable-next-line obsidianmd/prefer-active-doc -- Constructor is incorrectly flagged by this rule
    constructor(app: App, title: string, message: string, onConfirm: () => void | Promise<void>) {
        super(app);
        this.title = title;
        this.message = message;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Confirm')
                .setWarning()
                .onClick(async () => {
                    await this.onConfirm();
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
