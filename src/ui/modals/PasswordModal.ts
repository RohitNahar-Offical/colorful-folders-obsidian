import * as obsidian from 'obsidian';

export class PasswordModal extends obsidian.Modal {
    private passwordValue: string = "";
    private onConfirm: (password: string) => boolean | Promise<boolean>;
    private title: string;

    constructor(app: obsidian.App, title: string, onConfirm: (password: string) => boolean | Promise<boolean>) {
        super(app);
        this.title = title;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();

        modalEl.setCssStyles({
            maxWidth: "400px",
            borderRadius: "12px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            border: "1px solid var(--background-modifier-border)"
        });

        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({ textAlign: "center", marginBottom: "20px" });
        header.createEl("h2", { text: this.title }).setCssStyles({ margin: "0", fontSize: "1.5em" });
        header.createEl("p", { text: "Please enter your vault password to continue." }).setCssStyles({ opacity: "0.6", fontSize: "0.9em", marginTop: "8px" });

        const body = contentEl.createDiv({ cls: "cf-modal-body" });
        body.setCssStyles({ display: "flex", flexDirection: "column", gap: "15px" });

        const inputEl = body.createEl("input", { type: "password" });
        inputEl.placeholder = "Password...";
        inputEl.setCssStyles({
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid var(--background-modifier-border)",
            backgroundColor: "var(--background-primary)",
            fontSize: "1.1em",
            textAlign: "center"
        });
        inputEl.focus();

        inputEl.onkeydown = async (e) => {
            if (e.key === "Enter") {
                const success = await this.onConfirm(inputEl.value);
                if (success) {
                    this.close();
                } else {
                    inputEl.value = "";
                    inputEl.addClass("is-invalid");
                    activeWindow.setTimeout(() => inputEl.removeClass("is-invalid"), 500);
                }
            }
        };

        const footer = contentEl.createDiv();
        footer.setCssStyles({ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" });

        const cancelBtn = footer.createEl("button", { text: "Cancel" });
        cancelBtn.onclick = () => this.close();

        const confirmBtn = footer.createEl("button", { text: "Unlock", cls: "mod-cta" });
        confirmBtn.setCssStyles({ padding: "8px 24px" });
        confirmBtn.onclick = async () => {
            const success = await this.onConfirm(inputEl.value);
            if (success) {
                this.close();
            } else {
                inputEl.value = "";
                inputEl.addClass("is-invalid");
                activeWindow.setTimeout(() => inputEl.removeClass("is-invalid"), 500);
            }
        };

        const forgotLink = contentEl.createDiv({ cls: "cf-forgot-pass" });
        forgotLink.setCssStyles({ 
            textAlign: "center", 
            marginTop: "20px", 
            fontSize: "0.8em", 
            opacity: "0.5", 
            cursor: "pointer",
            textDecoration: "underline"
        });
        forgotLink.setText("Forgot password?");
        forgotLink.onclick = () => {
            new obsidian.Notice("To reset your password, perform a 'Factory reset' in the plugin settings or manually clear the password in your data.json file.", 8000);
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
