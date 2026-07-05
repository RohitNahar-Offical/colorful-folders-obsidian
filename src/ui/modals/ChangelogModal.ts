import * as obsidian from 'obsidian';

export class ChangelogModal extends obsidian.Modal {
    content: string;
    private renderComponent: obsidian.Component;

    constructor(app: obsidian.App, content: string) {
        super(app);
        this.content = content;
        this.renderComponent = new obsidian.Component();
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.addClass("cf-changelog-modal");
        
        modalEl.setCssStyles({
            width: "800px",
            maxWidth: "90vw"
        });

        // Premium styling
        contentEl.setCssStyles({
            padding: "30px",
            maxWidth: "100%"
        });

        const header = contentEl.createDiv({ cls: "cf-changelog-header" });
        header.setCssStyles({
            marginBottom: "20px",
            borderBottom: "1px solid var(--background-modifier-border)",
            paddingBottom: "10px"
        });
        header.createEl("h2", { text: "What's new in colorful folders" });

        const body = contentEl.createDiv({ cls: "cf-changelog-body" });
        body.setCssStyles({
            paddingRight: "10px"
        });
        this.renderComponent.load();
        obsidian.MarkdownRenderer.render(this.app, this.content, body, "", this.renderComponent).catch(err => {
            console.error("Failed to render changelog markdown", err);
        });

        const footer = contentEl.createDiv({ cls: "cf-changelog-footer" });
        footer.setCssStyles({
            marginTop: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        });

        const sponsorBtn = footer.createEl("button", { text: "❤️ support the developer" });
        sponsorBtn.setCssStyles({
            cursor: "pointer"
        });
        sponsorBtn.onclick = () => {
            window.open("https://github.com/sponsors/RohitNahar-Offical", "_blank");
        };

        const closeBtn = footer.createEl("button", { text: "Got it!", cls: "mod-cta" });
        closeBtn.onclick = () => this.close();
    }

    onClose() {
        this.renderComponent.unload();
        const { contentEl } = this;
        contentEl.empty();
    }
}
