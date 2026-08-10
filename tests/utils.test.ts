import { safeEscape, normalizeVaultPath, hexToRgbObj } from '../src/common/utils';

describe('utils', () => {
    describe('normalizeVaultPath', () => {
        it('should convert backslashes to forward slashes and strip leading/trailing slashes', () => {
            expect(normalizeVaultPath('\\Folder\\Subfolder\\')).toBe('Folder/Subfolder');
            expect(normalizeVaultPath('/Folder/File.md')).toBe('Folder/File.md');
        });
    });

    describe('safeEscape', () => {
        it('should escape backslashes, double quotes, and single quotes', () => {
            expect(safeEscape("John's Notes")).toBe("John\\'s Notes");
            expect(safeEscape('Folder "A"')).toBe('Folder \\"A\\"');
        });
    });

    describe('hexToRgbObj', () => {
        it('should correctly convert hex strings to RGB objects', () => {
            expect(hexToRgbObj('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRgbObj('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
            expect(hexToRgbObj('invalid')).toBeNull();
        });
    });
});
