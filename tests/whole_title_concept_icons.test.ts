import { IconRepository } from '../src/core/IconRepository';
import { EmbeddingModel } from '../src/integrations/embedingmodel';
import { IColorfulFoldersPlugin } from '../src/common/types';

describe('Whole-Title Semantic Concept Icon Assignment', () => {
    let mockPlugin: IColorfulFoldersPlugin;
    let iconRepository: IconRepository;
    let embeddingModel: EmbeddingModel;

    beforeEach(() => {
        mockPlugin = {
            settings: {
                autoIcons: true,
                autoIconVariety: true,
                customFolderColors: {},
                customIconRules: '',
                customIcons: {},
                iconDebugMode: false,
                aiProvider: 'ollama',
                embeddingEngine: 'builtin'
            },
            localFileSystemIcons: {
                'compass': '<svg></svg>',
                'sparkles': '<svg></svg>',
                'heart': '<svg></svg>',
                'scale': '<svg></svg>',
                'repeat': '<svg></svg>',
                'trending-up': '<svg></svg>',
                'calendar-check': '<svg></svg>',
                'sun-moon': '<svg></svg>'
            }
        } as unknown as IColorfulFoldersPlugin;

        embeddingModel = new EmbeddingModel(mockPlugin);
        mockPlugin.embeddingModel = embeddingModel;
        iconRepository = new IconRepository(mockPlugin);
        mockPlugin.iconManager = {
            getAutoIconData: (name: string, path?: string) => iconRepository.getAutoIconData(name, path)
        } as unknown as IColorfulFoldersPlugin['iconManager'];
    });

    const testCases = [
        { name: 'Trust the process', expectedKeywords: ['compass', 'trending-up', 'hourglass', 'sparkles'] },
        { name: 'Use it or Lose it is a cool concept', expectedKeywords: ['repeat', 'flame', 'activity', 'sparkles', 'zap'] },
        { name: 'Vulnerability', expectedKeywords: ['heart', 'shield-off', 'unlock', 'eye'] },
        { name: 'Words I\'ve used to describe important habits', expectedKeywords: ['repeat', 'calendar-check', 'activity', 'target'] },
        { name: 'Wu wei', expectedKeywords: ['sparkles', 'compass', 'wind', 'leaf'] },
        { name: 'Yin and Yang', expectedKeywords: ['scale', 'sun-moon', 'circle-dot'] }
    ];

    describe('IconRepository - Whole Title Category Resolution', () => {
        for (const tc of testCases) {
            it(`should assign a meaningful non-generic concept icon for "${tc.name}"`, () => {
                const autoIcon = iconRepository.getAutoIconData(tc.name, `${tc.name}.md`);
                expect(autoIcon).not.toBeNull();
                expect(autoIcon?.lucide).toBeDefined();
                expect(autoIcon?.lucide).not.toBe('file-text');
                expect(autoIcon?.lucide).not.toBe('file');
                expect(autoIcon?.lucide).not.toBe('wrench'); // Should not assign construction icon to "process"
                
                const isMatched = tc.expectedKeywords.some(kw => autoIcon?.lucide?.includes(kw));
                expect(isMatched).toBe(true);
            });
        }
    });

    describe('EmbeddingModel - Vector Search for Whole Titles', () => {
        for (const tc of testCases) {
            it(`should return meaningful vector concept candidates for "${tc.name}"`, () => {
                const results = embeddingModel.findBestIcons(tc.name, { topK: 3, isFolder: false });
                expect(results.length).toBeGreaterThan(0);
                
                const firstIcon = results[0].iconId;
                expect(firstIcon).not.toBe('file-text');
                expect(firstIcon).not.toBe('file');

                const isMatched = tc.expectedKeywords.some(kw => results.some(r => r.iconId.includes(kw)));
                expect(isMatched).toBe(true);
            });
        }
    });
});
