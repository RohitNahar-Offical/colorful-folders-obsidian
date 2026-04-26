import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../../common/types';

export class HoverMessageModal extends obsidian.Modal {
    plugin: IColorfulFoldersPlugin;
    path: string;
    description: string;
    onSave: (val: string) => void;
    previewEl!: HTMLElement;

    // Suggester State
    suggestEl: HTMLElement | null = null;
    suggestItems: string[] = [];
    selectedIndex = 0;
    suggestType: 'link' | 'tag' | null = null;
    suggestStart = -1;

    constructor(app: obsidian.App, plugin: IColorfulFoldersPlugin, path: string, description: string, onSave: (val: string) => void) {
        super(app);
        this.plugin = plugin;
        this.path = path;
        this.description = description;
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();

        modalEl.setCssStyles({
            maxWidth: "600px",
            width: "90vw",
            borderRadius: "14px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
        });

        // Header
        const header = contentEl.createDiv({ cls: "cf-modal-header" });
        header.setCssStyles({
            display: "flex", flexDirection: "column", gap: "4px",
            padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--background-modifier-border)"
        });
        header.createEl("h2", { text: "Edit hover message", cls: "cf-modal-title" }).setCssStyles({ margin: "0", fontSize: "1.4em" });
        header.createEl("p", { text: "Add context, links, or tags that appear when you hover over this divider." }).setCssStyles({ margin: "0", opacity: "0.6", fontSize: "0.9em" });

        const body = contentEl.createDiv();
        body.setCssStyles({ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" });

        // Editor Section
        const editorWrapper = body.createDiv();
        editorWrapper.createEl("label", { text: "Markdown editor" }).setCssStyles({ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85em", textTransform: "uppercase", letterSpacing: "0.05em", opacity: "0.8" });

        const toolbar = editorWrapper.createDiv({ cls: 'cf-editor-toolbar' });
        toolbar.setCssStyles({
            display: 'flex', gap: '4px', marginBottom: '8px',
            padding: '4px 6px', backgroundColor: 'var(--background-secondary)',
            borderRadius: '6px', border: '1px solid var(--background-modifier-border)'
        });

        const textArea = editorWrapper.createEl("textarea");
        textArea.value = this.description;
        textArea.placeholder = "Write something beautiful... Use [[links]] to jump to notes, #tags to categorize, and **bold** or *italic* formatting.";
        textArea.setCssStyles({
            width: "100%", height: "180px", borderRadius: "8px", padding: "12px",
            backgroundColor: "var(--background-primary)", border: "1px solid var(--background-modifier-border)",
            fontSize: "1em", lineHeight: "1.5", resize: "vertical", fontFamily: "var(--font-monospace)"
        });

        const wrapText = (prefix: string, suffix: string, cursorOffset = 0) => {
            const start = textArea.selectionStart;
            const end = textArea.selectionEnd;
            const selectedText = textArea.value.substring(start, end);
            const before = textArea.value.substring(0, start);
            const after = textArea.value.substring(end);

            textArea.value = before + prefix + selectedText + suffix + after;

            if (cursorOffset > 0) {
                const newPos = start + cursorOffset;
                textArea.setSelectionRange(newPos, newPos);
            } else {
                textArea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
            }

            this.description = textArea.value;
            void updatePreview(this.description);
            textArea.focus();
        };

        const addBtn = (icon: string, tooltip: string, onClick: () => void) => {
            const btn = new obsidian.ButtonComponent(toolbar);
            btn.setIcon(icon)
                .setTooltip(tooltip)
                .onClick(() => onClick());

            btn.buttonEl.setCssStyles({
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px', borderRadius: '4px', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'none'
            });
            btn.buttonEl.onmouseenter = () => btn.buttonEl.setCssStyles({ backgroundColor: 'var(--background-modifier-hover)' });
            btn.buttonEl.onmouseleave = () => btn.buttonEl.setCssStyles({ backgroundColor: 'transparent' });
        };

        addBtn('bold', 'Bold (Ctrl+B)', () => wrapText('**', '**'));
        addBtn('italic', 'Italic (Ctrl+I)', () => wrapText('*', '*'));
        addBtn('strikethrough', 'Strikethrough', () => wrapText('~~', '~~'));
        addBtn('highlighter', 'Highlight', () => wrapText('==', '=='));
        addBtn('code', 'Inline code', () => wrapText('`', '`'));
        addBtn('file-code-2', 'Code block', () => wrapText('\n```\n', '\n```\n'));
        addBtn('link', 'Link (Ctrl+K)', () => wrapText('[', ']()', 1 + (textArea.selectionEnd - textArea.selectionStart) + 2));

        // Fix Native Clipboard (Unblock Obsidian's strict handlers)
        const stopNative = (e: Event) => e.stopPropagation();
        textArea.addEventListener('copy', stopNative);
        textArea.addEventListener('cut', stopNative);
        textArea.addEventListener('paste', stopNative);


        // Preview Section
        const previewWrapper = body.createDiv();
        previewWrapper.createEl("label", { text: "Live preview" }).setCssStyles({ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85em", textTransform: "uppercase", letterSpacing: "0.05em", opacity: "0.8" });

        this.previewEl = previewWrapper.createDiv({ cls: "cf-premium-popover" });
        this.previewEl.setCssStyles({
            position: "relative", transform: "none", width: "100%", maxWidth: "none",
            animation: "none", display: "block", marginBottom: "10px"
        });
        const previewContent = this.previewEl.createDiv({ cls: "cf-popover-content" });

        const updatePreview = async (val: string) => {
            previewContent.empty();
            if (!val.trim()) {
                previewContent.createEl("i", { text: "No message set. Hover popover will be hidden." }).setCssStyles({ opacity: "0.5" });
                return;
            }
            await obsidian.MarkdownRenderer.render(this.app, val, previewContent, this.path, this.plugin as unknown as obsidian.Component);
        };

        // --- Suggester Logic ---
        const closeSuggest = () => {
            if (this.suggestEl) {
                this.suggestEl.remove();
                this.suggestEl = null;
            }
            this.suggestType = null;
            this.suggestStart = -1;
        };

        const renderSuggest = () => {
            if (!this.suggestEl) {
                this.suggestEl = activeDocument.body.createDiv({ cls: "cf-suggestion-container" });
                const suggestSub = this.suggestEl.createDiv({ cls: "cf-suggestion" });
                this.suggestItems.forEach((item, index) => {
                    const el = suggestSub.createDiv({ cls: "cf-suggestion-item" + (index === this.selectedIndex ? " is-selected" : "") });
                    el.createDiv({ cls: "cf-suggestion-content", text: item });
                    el.onclick = () => selectItem(index);
                });

                // Position near cursor (simplified)
                const rect = textArea.getBoundingClientRect();
                this.suggestEl.setCssStyles({
                    position: "fixed",
                    left: `${rect.left + 20}px`,
                    top: `${rect.top + 40}px`,
                    zIndex: "20000"
                });
            } else {
                const suggestSub = this.suggestEl.querySelector(".cf-suggestion");
                if (suggestSub) {
                    suggestSub.empty();
                    this.suggestItems.forEach((item, index) => {
                        const el = suggestSub.createDiv({ cls: "cf-suggestion-item" + (index === this.selectedIndex ? " is-selected" : "") });
                        el.createDiv({ cls: "cf-suggestion-content", text: item });
                        el.onclick = () => selectItem(index);
                    });
                }
            }
        };

        const selectItem = (index: number) => {
            const item = this.suggestItems[index];
            const before = textArea.value.substring(0, this.suggestStart);
            const after = textArea.value.substring(textArea.selectionStart);

            let inserted = item;
            if (this.suggestType === 'link') inserted = item + "]]";

            textArea.value = before + inserted + after;
            textArea.focus();
            const newPos = before.length + inserted.length;
            textArea.setSelectionRange(newPos, newPos);

            this.description = textArea.value;
            void updatePreview(this.description);
            closeSuggest();
        };

        textArea.onkeydown = (e) => {
            // Prevent Obsidian's global hotkey manager from swallowing native shortcuts (Ctrl+C/V/X/A)
            e.stopPropagation();

            if (this.suggestType) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    this.selectedIndex = (this.selectedIndex + 1) % this.suggestItems.length;
                    renderSuggest();
                    return;
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    this.selectedIndex = (this.selectedIndex - 1 + this.suggestItems.length) % this.suggestItems.length;
                    renderSuggest();
                    return;
                } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    selectItem(this.selectedIndex);
                    return;
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeSuggest();
                    return;
                }
            }

            // Markdown Formatting Shortcuts
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (['b', 'i', 'k'].includes(key)) {
                    e.preventDefault();
                    if (key === 'b') wrapText('**', '**');
                    else if (key === 'i') wrapText('*', '*');
                    else if (key === 'k') wrapText('[', ']()', 1 + (textArea.selectionEnd - textArea.selectionStart) + 2);
                }
            }
        };

        textArea.oninput = () => {
            const val = textArea.value;
            const pos = textArea.selectionStart;
            this.description = val;
            void updatePreview(val);

            // 1. If currently suggesting, verify trigger is still intact
            if (this.suggestType) {
                const triggerIntact = this.suggestType === 'link'
                    ? (this.suggestStart >= 2 && val.substring(this.suggestStart - 2, this.suggestStart) === "[[")
                    : (this.suggestStart >= 1 && val.substring(this.suggestStart - 1, this.suggestStart) === "#");

                if (pos < this.suggestStart || !triggerIntact) {
                    closeSuggest();
                }
            }

            // 2. Check for NEW triggers
            const lastTwo = val.substring(pos - 2, pos);
            const lastOne = val.substring(pos - 1, pos);

            if (lastTwo === "[[") {
                this.suggestType = 'link';
                this.suggestStart = pos;
                this.selectedIndex = 0;
            } else if (lastOne === "#" && !this.suggestType) {
                this.suggestType = 'tag';
                this.suggestStart = pos;
                this.selectedIndex = 0;
            }

            // 3. Update/Filter suggestions if active
            if (this.suggestType) {
                const query = val.substring(this.suggestStart, pos).toLowerCase();
                if (query.includes(" ") || query.includes("\n")) {
                    closeSuggest();
                } else {
                    let all: string[] = [];
                    if (this.suggestType === 'link') {
                        all = this.app.vault.getMarkdownFiles().map(f => f.basename);
                    } else {
                        const tags = (this.app.metadataCache as unknown as { getTags(): Record<string, number> }).getTags();
                        all = Object.keys(tags).map(t => t.startsWith('#') ? t.substring(1) : t);
                    }

                    this.suggestItems = all.filter(item => item.toLowerCase().includes(query)).slice(0, 10);
                    if (this.suggestItems.length === 0) closeSuggest();
                    else renderSuggest();
                }
            }
        };

        textArea.onblur = () => {
            // Delay closing to allow clicks on suggestion items
            activeWindow.setTimeout(() => closeSuggest(), 200);
        };

        // Footer
        const footer = contentEl.createDiv();
        footer.setCssStyles({
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px",
            padding: "16px 24px", borderTop: "1px solid var(--background-modifier-border)",
            background: "var(--background-secondary-alt)", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px"
        });

        const cancelBtn = footer.createEl("button", { text: "Cancel" });
        cancelBtn.setCssStyles({
            background: "transparent", border: "none", padding: "8px 16px", cursor: "pointer", opacity: "0.7"
        });
        cancelBtn.onclick = () => {
            closeSuggest();
            this.close();
        };

        const saveBtn = footer.createEl("button", { text: "Save message" });
        saveBtn.setCssStyles({
            backgroundColor: "var(--interactive-accent)", color: "var(--text-on-accent)",
            padding: "8px 24px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer"
        });
        saveBtn.onclick = () => {
            this.onSave(this.description);
            closeSuggest();
            this.close();
        };

        // Initial preview
        void updatePreview(this.description);
    }

    onClose() {
        if (this.suggestEl) {
            this.suggestEl.remove();
        }
    }
}
