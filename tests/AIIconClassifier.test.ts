import { normalizePathKey, extractCoreIconKeyword } from '../src/common/utils';

describe('AIIconClassifier & Smart Resolution Utilities', () => {
    describe('normalizePathKey', () => {
        it('should normalize paths consistently regardless of slashes or casing', () => {
            expect(normalizePathKey('Folder/Subfolder/File.md')).toBe('folder/subfolder/file.md');
            expect(normalizePathKey('\\Folder\\Subfolder\\File.md')).toBe('folder/subfolder/file.md');
        });
    });

    describe('extractCoreIconKeyword', () => {
        it('should strip common icon pack prefixes (lucide, tabler, simple-icons, ri, fa)', () => {
            expect(extractCoreIconKeyword('lucide-calendar')).toEqual({
                noPrefix: 'calendar',
                core: 'calendar'
            });
            expect(extractCoreIconKeyword('simple-icons-python')).toEqual({
                noPrefix: 'python',
                core: 'python'
            });
            expect(extractCoreIconKeyword('ri-server-line')).toEqual({
                noPrefix: 'server-line',
                core: 'server'
            });
        });

        it('should handle icon style suffixes (line, fill, outline, bold)', () => {
            expect(extractCoreIconKeyword('tb-folder-fill')).toEqual({
                noPrefix: 'folder-fill',
                core: 'folder'
            });
        });
    });

    describe('JSON Repair & Candidate Extractions', () => {
        const repairAndParseJSON = (rawText: string): Record<string, unknown> => {
            if (!rawText) return {};
            let cleanText = rawText.trim();
            cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

            try {
                return JSON.parse(cleanText);
            } catch {
                // Fallthrough to repair
            }

            const repairedStr = cleanText
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/(['"])?([a-zA-Z0-9_\-/\.\s]+)\1\s*:\s*/g, '"$2":')
                .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ':"$1"');

            try {
                return JSON.parse(repairedStr);
            } catch {
                return {};
            }
        };

        it('should correctly parse clean JSON markdown codeblocks', () => {
            const input = '```json\n{\n  "Work/Meeting.md": ["calendar", "clock", "file-text"]\n}\n```';
            const result = repairAndParseJSON(input);
            expect(result).toEqual({
                "Work/Meeting.md": ["calendar", "clock", "file-text"]
            });
        });

        it('should repair trailing commas in LLM JSON output', () => {
            const input = '{\n  "Work/Meeting.md": ["calendar", "clock", "file-text"],\n}';
            const result = repairAndParseJSON(input);
            expect(result).toEqual({
                "Work/Meeting.md": ["calendar", "clock", "file-text"]
            });
        });
    });
});
