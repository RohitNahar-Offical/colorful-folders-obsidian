import * as obsidian from 'obsidian';
import { t } from '../../lang/helpers';

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
        const { contentEl, modalEl } = this;
        modalEl.setCssStyles({
            maxWidth: "420px",
            width: "min(420px, 92vw)",
            maxHeight: "88vh",
            overflowY: "auto"
        });
        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        new obsidian.Setting(contentEl)
            .addButton(btn => {
                btn.setButtonText(t("common.confirm"));
                (btn as unknown as { setWarning: () => typeof btn }).setWarning();
                btn.onClick(async () => {
                    await this.onConfirm();
                    this.close();
                });
            })
            .addButton(btn => btn
                .setButtonText(t("common.cancel"))
                .onClick(() => {
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
