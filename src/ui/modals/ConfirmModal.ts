import * as obsidian from 'obsidian';

export class ConfirmModal extends obsidian.Modal {
    private onConfirm: () => void | Promise<void>;
    private message: string;
    private title: string;

    constructor(app: obsidian.App, title: string, message: string, onConfirm: () => void | Promise<void>) {
        super(app);
        this.title = title;
        this.message = message;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        new obsidian.Setting(contentEl)
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
