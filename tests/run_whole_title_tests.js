const assert = require('assert');
const { IconRepository } = require('../src/core/IconRepository');
const { EmbeddingModel } = require('../src/integrations/embedingmodel');

// Register ts-node / typescript on the fly if needed
try {
    require('ts-node').register({ transpileOnly: true });
} catch {
    // ignore
}

console.log("==================================================");
console.log("🧪 RUNNING WHOLE-TITLE CONCEPT ICON TESTS");
console.log("==================================================\n");

const mockPlugin = {
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
        'sun-moon': '<svg></svg>',
        'lightbulb': '<svg></svg>',
        'brain': '<svg></svg>',
        'hourglass': '<svg></svg>',
        'clock': '<svg></svg>',
        'layers': '<svg></svg>',
        'map': '<svg></svg>'
    }
};

const embeddingModel = new EmbeddingModel(mockPlugin);
mockPlugin.embeddingModel = embeddingModel;
const iconRepository = new IconRepository(mockPlugin);
mockPlugin.iconManager = {
    getAutoIconData: (name, path) => iconRepository.getAutoIconData(name, path)
};

const testCases = [
    { name: 'Trust the process', expectedKeywords: ['compass', 'trending-up', 'hourglass', 'sparkles'] },
    { name: 'Use it or Lose it is a cool concept', expectedKeywords: ['repeat', 'flame', 'activity', 'sparkles', 'zap'] },
    { name: 'Vulnerability', expectedKeywords: ['heart', 'shield-off', 'unlock', 'eye'] },
    { name: 'Words I\'ve used to describe important habits', expectedKeywords: ['repeat', 'calendar-check', 'activity', 'target'] },
    { name: 'Wu wei', expectedKeywords: ['sparkles', 'compass', 'wind', 'leaf'] },
    { name: 'Yin and Yang', expectedKeywords: ['scale', 'sun-moon', 'circle-dot'] },
    { name: 'Use STIR To Remember More', expectedKeywords: ['brain', 'brain-circuit', 'lightbulb'] },
    { name: 'Using the thesaurus to generate ideas', expectedKeywords: ['lightbulb', 'brain', 'sparkles'] },
    { name: 'We chronically underestimate how long something takes', expectedKeywords: ['hourglass', 'clock', 'calendar-clock', 'timer'] },
    { name: 'What are higher-order notes', expectedKeywords: ['layers', 'git-branch', 'network', 'list-tree'] },
    { name: 'What can we learn from nerdy discussions on MOCs', expectedKeywords: ['map', 'list-tree', 'network'] }
];

let passedCount = 0;
let totalCount = 0;

console.log("--- 1. IconRepository Rule Engine ---");
for (const tc of testCases) {
    totalCount++;
    const autoIcon = iconRepository.getAutoIconData(tc.name, `${tc.name}.md`);
    
    assert(autoIcon !== null, `Expected non-null icon for "${tc.name}"`);
    assert(autoIcon.lucide !== 'file-text', `Expected non-generic icon for "${tc.name}", got "file-text"`);
    assert(autoIcon.lucide !== 'file', `Expected non-generic icon for "${tc.name}", got "file"`);
    assert(autoIcon.lucide !== 'wrench', `Expected non-construction icon for "${tc.name}", got "wrench"`);

    const isMatched = tc.expectedKeywords.some(kw => autoIcon.lucide && autoIcon.lucide.includes(kw));
    assert(isMatched, `Expected icon for "${tc.name}" to match one of [${tc.expectedKeywords.join(', ')}], got "${autoIcon.lucide}"`);
    
    console.log(`✅ "${tc.name}" => Assigned Icon: "${autoIcon.lucide}" (Tier ${autoIcon.tier})`);
    passedCount++;
}

console.log("\n--- 2. EmbeddingModel Vector Search ---");
for (const tc of testCases) {
    totalCount++;
    const results = embeddingModel.findBestIcons(tc.name, { topK: 3, isFolder: false });
    assert(results.length > 0, `Expected vector candidates for "${tc.name}"`);

    const firstIcon = results[0].iconId;
    assert(firstIcon !== 'file-text', `Expected non-generic vector icon for "${tc.name}", got "file-text"`);
    assert(firstIcon !== 'file', `Expected non-generic vector icon for "${tc.name}", got "file"`);

    const isMatched = tc.expectedKeywords.some(kw => results.some(r => r.iconId.includes(kw)));
    assert(isMatched, `Expected vector results for "${tc.name}" to include one of [${tc.expectedKeywords.join(', ')}], got [${results.map(r => r.iconId).join(', ')}]`);

    console.log(`✅ "${tc.name}" => Vector Candidate 1: "${firstIcon}" (${results[0].confidence} confidence)`);
    passedCount++;
}

console.log("\n==================================================");
console.log(`🎉 ALL ${passedCount}/${totalCount} TESTS PASSED SUCCESSFULLY!`);
console.log("==================================================");
