export class CssGrouper {
    private groups = new Map<string, { body: string, selectors: string[] }>();
    private rawBlocks: string[] = [];

    /**
     * Add selectors to a specific CSS body block, grouped by a fast signature key.
     * @param cssBody The CSS rules without the enclosing braces.
     * @param selectors An array of CSS selectors.
     * @param signatureKey A fast, short string to use as the Map key (bypasses heavy string hashing).
     */
    add(cssBody: string, selectors: string[], signatureKey?: string) {
        const key = signatureKey ?? cssBody;
        if (!key) return;
        
        let existing = this.groups.get(key);
        if (!existing) {
            existing = { body: cssBody, selectors: [] };
            this.groups.set(key, existing);
        }
        existing.selectors.push(...selectors);
    }

    /**
     * Add a raw, pre-formatted CSS block that cannot be grouped (e.g. completely unique rules).
     */
    addRaw(cssBlock: string) {
        this.rawBlocks.push(cssBlock);
    }

    /**
     * Build the final compacted CSS string.
     */
    build(): string {
        const chunks: string[] = [...this.rawBlocks];
        for (const group of this.groups.values()) {
            // Chunk selectors into groups of 500 to avoid any browser selector limit edge cases
            const chunkSize = 500;
            for (let i = 0; i < group.selectors.length; i += chunkSize) {
                const chunk = group.selectors.slice(i, i + chunkSize);
                chunks.push(`${chunk.join(',\n')} {\n${group.body}\n}`);
            }
        }
        return chunks.join('\n\n');
    }
}
