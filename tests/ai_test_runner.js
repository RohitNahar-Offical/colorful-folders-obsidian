/**
 * Interactive Live AI Test Suite for Colorful Folders Plugin
 * 
 * Usage:
 *   node tests/ai_test_runner.js --provider=ollama --model=qwen2.5:1.5b
 *   node tests/ai_test_runner.js --provider=gemini --apikey=YOUR_API_KEY
 *   node tests/ai_test_runner.js --provider=openai --apikey=YOUR_API_KEY
 */

const http = require('http');
const https = require('https');

// --- Parse CLI Arguments ---
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    acc[k] = v || true;
    return acc;
}, {});

const provider = args.provider || 'ollama'; // 'ollama' | 'custom'
const model = args.model || 'qwen2.5:1.5b';
const apiKey = args.apikey || process.env.AI_API_KEY || '';
const endpoint = args.endpoint || (provider === 'custom' ? 'http://localhost:1234/v1/chat/completions' : 'http://localhost:11434/v1/chat/completions');

// --- Sample Vault Items to Classify ---
const customItemName = args.file || args.item;
const sampleVaultItems = customItemName ? [
    { item_path: customItemName.includes('.') ? customItemName : `${customItemName}.md`, type: customItemName.includes('.') ? "File" : "File", snippet: `Notes, maps, and information regarding ${customItemName}` }
] : [
    { item_path: "Development/Python Projects/ listning", type: "File" },
    { item_path: "Work/Client Meetings 2026/exprement.md", type: "File", tags: "meeting, planning, Q3" },
    { item_path: "Finance/Tax Declarations/2026 data.md", type: "File", snippet: "Total Tax Refund calculated for Q2..." },
    { item_path: "Personal/Reading List/SciFi Books.md", type: "File", tags: "books, reading" },
    { item_path: "Projects/Website Redesign", type: "Folder", sample_contents: "index.html, styles.css, components" }
];

const systemPrompt = `You are an expert AI taxonomist and icon matcher for an Obsidian note-taking app. Your objective is to select 3 CANDIDATE ICON NAMES for each requested vault item ordered from specific to general.

### ITEM NAME PRIORITY RULE (STRICT):
1. **FOCUS STRICTLY ON THE ITEM NAME FIRST:** Base icon selection 100% on the actual file name or folder name (e.g. for "BAKE/Amazon.md", focus strictly on "Amazon").
2. **DO NOT USE PARENT CONTEXT OR TAGS UNLESS STRUGGLING:** Do NOT look at parent folders, tags, frontmatter, or content snippets UNLESS the file/folder name alone is completely generic, vague, or ambiguous (e.g. "Untitled.md", "Notes.md", "123.md", "exprement.md"). Only fallback to parent context when the filename alone provides no meaningful icon clues.

### 3-CANDIDATE SELECTION RULE (CRITICAL):
For EVERY requested item, output a JSON array of EXACTLY 3 candidate icon names:
- **Candidate 1 (Specific Brand / Precise Icon):** Specific brand, tool, or precise topic icon (e.g. "amazon", "simple-icons-amazon", "python", "react", "youtube", "book-open").
- **Candidate 2 (Core Category Metaphor):** Primary category icon or visual domain metaphor (e.g. "shopping-cart", "shopping-bag", "code", "calendar", "book", "video", "receipt").
- **Candidate 3 (Alternative Domain Icon):** A secondary topic icon or alternative domain metaphor (e.g. "package", "store", "terminal", "clock", "notebook", "layers"). Do NOT output generic "file-text" or "file" fallbacks for Candidate 3, as the plugin handles default file fallbacks automatically!

### PACK FLEXIBILITY & AGNOSTICISM (IMPORTANT):
You are NOT restricted or limited to 'simple-icons-' prefix! You may output standard clean icon names (e.g. 'amazon', 'python', 'react', 'shopping-cart', 'code') OR pack-prefixed IDs (e.g. 'simple-icons-amazon', 'fa-amazon', 'ri-amazon', 'lucide-shopping-cart') depending on what best matches the item.

### BRAND & E-COMMERCE DISAMBIGUATION RULE:
- E-Commerce & Retail Brands ("Amazon", "eBay", "Shopify", "Walmart"): Candidate 1 = "amazon" or "simple-icons-amazon", Candidate 2 = "shopping-cart" or "shopping-bag", Candidate 3 = "package" or "store". NEVER assign video or music icons!
- Video/Media Brands ("YouTube", "Netflix"): Candidate 1 = "youtube" or "simple-icons-youtube", Candidate 2 = "video" or "film", Candidate 3 = "play" or "camera".
- Development & Tech Brands ("Python", "React", "Docker", "GitHub"): Candidate 1 = "python" or "simple-icons-python", Candidate 2 = "code", Candidate 3 = "terminal" or "cpu".

### FOLDER VS FILE DIFFERENTIATION RULE:
- For FOLDERS: Candidates 2 & 3 MUST be structural container icons (e.g. "folder", "layers", "archive", "box").
- For FILES / NOTES: Candidates 1, 2, and 3 MUST match the note topic. Do NOT output generic document fallbacks ("file-text", "file", "document").

### OUTPUT FORMAT
Output **STRICT JSON ONLY**:
{
  "BAKE/Amazon.md": ["amazon", "shopping-cart", "package"],
  "Development/Python Projects/FastAPI Backend.md": ["python", "code", "terminal"],
  "Work/Client Meetings 2026/Q3 Planning.md": ["calendar", "clock", "target"],
  "Personal/Reading List/SciFi Books.md": ["book-open", "book", "notebook"],
  "Projects/Website Redesign": ["react", "folder", "layers"]
}`;
console.log("==================================================");
console.log(`🤖 LIVE AI MODEL TEST RUNNER (${provider.toUpperCase()})`);
console.log(`📌 Model: ${model}`);
if (provider === 'ollama') console.log(`🔗 Endpoint: ${endpoint}`);
console.log("==================================================\n");

async function makeHttpRequest(urlStr, options, postData) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const transport = url.protocol === 'https:' ? https : http;

        const req = transport.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function runLiveTest() {
    console.log(`🚀 Sending ${sampleVaultItems.length} sample items to ${provider} (${model})...`);

    let apiUrl = '';
    let payload = {};
    let headers = { 'Content-Type': 'application/json' };

    apiUrl = endpoint;
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    payload = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(sampleVaultItems, null, 2) }
        ],
        temperature: 0.1
    };

    const startTime = Date.now();
    try {
        const responseText = await makeHttpRequest(apiUrl, { method: 'POST', headers }, JSON.stringify(payload));
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Response received in ${duration}s!\n`);
        console.log("--------------------------------------------------");
        console.log("RAW LLM RESPONSE:");
        console.log("--------------------------------------------------");
        console.log(responseText);
        console.log("--------------------------------------------------\n");

    } catch (err) {
        console.error(`\n❌ Live AI Request Failed:`, err.message);
        if (provider === 'ollama') {
            console.log("\n💡 Tip: For Ollama, make sure Ollama is running (`ollama serve`) and the model is downloaded (`ollama run ${model}`).");
        }
    }
}

runLiveTest();
