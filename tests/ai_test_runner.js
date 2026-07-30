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
const sampleVaultItems = [
    { item_path: "Development/Python Projects/FastAPI Backend.md", type: "File", snippet: "import fastapi\napp = FastAPI()\n@app.get('/')" },
    { item_path: "Work/Client Meetings 2026/exprement.md", type: "File", tags: "meeting, planning, Q3" },
    { item_path: "Finance/Tax Declarations/2026 data.md", type: "File", snippet: "Total Tax Refund calculated for Q2..." },
    { item_path: "Personal/Reading List/SciFi Books.md", type: "File", tags: "books, reading" },
    { item_path: "Projects/Website Redesign", type: "Folder", sample_contents: "index.html, styles.css, components" }
];

// --- System Prompt Construction ---
const systemPrompt = `You are an expert AI taxonomist for an Obsidian note-taking app. Your objective is to select 3 CANDIDATE ICON NAMES for each requested vault item.

### 3-CANDIDATE SELECTION RULE:
Output a JSON object mapping each 'item_path' to an array of EXACTLY 3 candidate icon names:
- Candidate 1: Specific Brand or Specific Pack Icon (e.g. "simple-icons-python", "flask-conical", "simple-icons-react", "book-open")
- Candidate 2: Single-Word Core Visual Metaphor (e.g. "code", "calendar", "book", "receipt")
- Candidate 3: General Fallback Icon (e.g. "file-text", "folder", "archive")

### FOLDER VS FILE DIFFERENTIATION RULE:
- For FOLDERS: Candidates 2 & 3 MUST be structural container icons ("folder", "layers", "archive"). NEVER use calendar or tech icons for folder fallback!
- For FILES / NOTES: Candidates 2 & 3 MUST match the note topic. NEVER assign "terminal" or "code" to non-technical topics like Books, Reading, or Art!

### Output Format (Strict JSON ONLY):
{
  "Development/Python Projects/FastAPI Backend.md": ["simple-icons-python", "code", "terminal"],
  "Work/Client Meetings 2026/Q3 Planning.md": ["calendar", "clock", "file-text"],
  "Personal/Reading List/SciFi Books.md": ["book-open", "book", "file-text"],
  "Projects/Website Redesign": ["simple-icons-react", "folder", "layers"]
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
