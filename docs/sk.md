Here is the comprehensive extraction of every user-facing string found in the TypeScript/TSX source files under R:\Obsidian\Testsub1\.obsidian\plugins\colorful-folders\src\.

src\ui\SettingTab.ts
Line	String	Context
35	General	Tab button label
75	Features	Tab button label
77	Icons	Tab button label
78	AI	Tab button label
79	Privacy	Tab button label
161	Fetching icon pack from ${url}...	Notice message (URL import)
166	Successfully imported ${count} icons!	Notice message (URL import success)
169	No valid SVG icons found in the provided JSON.	Notice message (URL import failure)
173	Failed to import icon pack: ${msg}	Notice message (URL import error, 6000ms)
174	Colorful Folders: URL Import failed	Console error message
src\ui\settings\GeneralSettingSection.ts
Line	String	Context
12	💡	Info icon emoji
14	Context menu overrides	Section header
17	"set custom style"	Strong text in info block
19	"add divider"	Strong text in info block
23	🎨	Card icon
23	Global visual palette	Card title
30	Light mode palette	Setting label (localized)
31	Select a curated color scheme for your vault in light mode.	Setting description
33-37	Vibrant Rainbow, Muted Dark Mode, Pastel Dreams, Tailwind UI, Tailwind UI Dark, Custom	Dropdown options (localized)
46	Dark mode palette	Setting label (localized)
47	Select a curated color scheme for your vault in dark mode.	Setting description
63	Custom colors (hex)	Setting label (localized)
64	Your custom palette colors. Click a swatch to pick visually, or type a hex code directly. Only active when "custom palette" is selected above.	Setting description
80	Palette colors	Sub-header
89	Reset	Button text
92	+ add color	Button text
134	Click a color to edit	Placeholder text (localized)
207	×	Delete button text
242	No colors defined.	Empty state text (localized)
270	Folder exclusion list	Setting label (localized)
271	Comma-separated list of folder names to ignore. Note: folder names are case-insensitive.	Setting description
273	Example templates	Placeholder (localized)
282	Color generation mode	Setting label (localized)
283	Cycle assigns colors sequentially. Monochromatic uses depth-based shading. Heatmap colors folders based on the most recently modified file inside.	Setting description
285-288	cycle, monochromatic, heatmap, hierarchy	Dropdown options (localized)
297	File color mode	Setting label (localized)
298	Choose how file colors are generated in relation to folder depth levels.	Setting description (localized)
300-304	parent, folder_scope, mixed, sequential, none	Dropdown options (localized)
313	Color text	Setting label (localized)
314	Select which items should have colored text. Choose "none" to only color icons.	Setting description
316-319	all, folders, files, none	Dropdown options (localized)
328	Global default background	Setting label (localized)
329	Set a universal background color for all folders/files that do not have a custom style. Leave empty for theme-default (transparent).	Setting description
332	Open visual color picker	Tooltip (localized)
350	Hex: #2a2a2a	Placeholder (localized)
369	Rainbow cycle offset	Setting label (localized)
370	Shift the starting color index for the rainbow cycle.	Setting description
383	Reset to default	Extra button tooltip (localized)
392	Root folder appearance	Setting label (localized)
393	Solid uses vivid backgrounds for root folders. Translucent provides a softer, glowing look.	Setting description
395-396	solid, translucent	Dropdown options (localized)
405	✨	Card icon
405	Active item appearance	Card title
407	Luminous active glow	Setting label (localized)
408	Apply a modern glowing selection style and subtle scale effect to the active file/folder in the explorer.	Setting description
418	Use custom active file box colors	Setting label (localized)
419	Enable this to override the background and text color of the active (currently selected) file box.	Setting description
453	Active background color	Setting label (localized)
454	The background color for the currently selected file.	Setting description
457	Open visual color picker	Tooltip (localized)
461	Hex: #ffffff	Placeholder (localized)
470	Click to open visual color picker	Tooltip (localized)
501	Active text color	Setting label (localized)
502	The text color for the currently selected file.	Setting description
505	Open visual color picker	Tooltip (localized)
509	Hex: #c0c0c0	Placeholder (localized)
518	Click to open visual color picker	Tooltip (localized)
528	👁️	Card icon
528	Appearance and visibility	Card title
531	Light mode brightness (%)	Setting label (localized)
544	Reset to default	Extra button tooltip (localized)
553	Dark mode brightness (%)	Setting label (localized)
566	Reset to default	Extra button tooltip (localized)
574	Outline only mode	Setting label (localized)
584	Auto-color files (backgrounds)	Setting label (localized)
585	Automatically apply background tints to files to match their parent folder.	Setting description
596	Global icon scaling	Setting label (localized)
597	Multiplies the size of all folder and file icons (default 1.0). Range: 0.5 to 2.5.	Setting description
610	Reset to default	Extra button tooltip (localized)
618	Icon debug mode	Setting label (localized)
619	Logs icon matching logic to the developer console. Useful if auto-icons are not appearing as expected.	Setting description
628	Wrap metadata to next line (desktop)	Setting label (localized)
629	Forces file counts, word counts, and other plugin metadata to wrap to the next line on desktop. (This is always enabled automatically on mobile devices).	Setting description
639	Aa	Card icon
639	Path line thickness and structure	Card title
642	Show collapse indicator	Setting label (localized)
643	Toggle the visibility of folder collapse indicators (arrows) in the file explorer.	Setting description
654	Folder border radius	Setting label (localized)
655	Adjust the corner roundness of folder backgrounds in the explorer (default 6px).	Setting description
668	Reset to default	Extra button tooltip (localized)
677	Path line thickness	Setting label (localized)
678	Adjust the thickness of vertical indentation lines and active borders.	Setting description
691	Reset to default	Extra button tooltip (localized)
699	Show item counters	Setting label (localized)
700	Displays recursive folder and file counts next to folder names.	Setting description
710	Spaced text (monofont feel)	Setting label (localized)
711	Adds slight letter and word spacing for a structured, monospaced layout feel.	Setting description
713-716	none, both, folders, files	Dropdown options (localized)
725	Rainbow root text	Setting label (localized)
726	Applies a vivid rainbow-text horizontal gradient to all top-level folders.	Setting description
738	Transparent root background	Setting label (localized)
739	Keeps the root text effect but removes the solid/translucent background box.	Setting description
750	Text gradient angle	Setting label (hardcoded)
751	Customize the angle (0° to 360°) for rainbow text gradients.	Setting description
765	Reset to default (135°)	Extra button tooltip (hardcoded)
775	🎛️	Card icon
775	Advanced tuning	Card title
779	Root opacity (%)	Setting label (localized)
780	Transparency of top-level folders in file explorer.	Setting description
793	Reset to default	Extra button tooltip (localized)
802	Subfolder opacity (%)	Setting label (localized)
803	Transparency of nested subfolder background pills in file explorer.	Setting description
816	Reset to default	Extra button tooltip (localized)
825	Tint opacity (%)	Setting label (localized)
826	Controls how highly tinted the background content space becomes when you open a directory.	Setting description
839	Reset to default	Extra button tooltip (localized)
848	File background opacity (%)	Setting label (localized)
849	Global transparency for all auto-colored files (default 10%).	Setting description
862	Reset to default	Extra button tooltip (localized)
src\ui\settings\IconSettingSection.ts
Line	String	Context
9	🤖	Card icon
9	Automation engine	Card title
11	Enable automatic icons	Setting label (localized)
24	Wide icon rendering (lucide svgs)	Setting label (localized)
34	Icon variety mode	Setting label (localized)
35	Assigns different icons to items within the same category for better visual distinction.	Setting description
47	Shuffle icons	Setting label (localized)
48	Randomize the global seed used for assigning variety icons. If you dislike the current distribution, click this to re-roll them all!	Setting description
50	Shuffle icons	Button text (localized)
59	Default closed folder icon	Setting label (localized)
60	Customize the default icon shown for closed folders when auto-icons are enabled.	Setting description
69	Choose	Button text (localized)
81	Default open folder icon	Setting label (localized)
82	Customize the default icon shown for open folders when auto-icons are enabled.	Setting description
91	Choose	Button text (localized)
108	Advanced regex rule builder	Strong text header
110	Define rules to automatically assign icons based on folder/file names using regex patterns. Rules are evaluated top to bottom, highest priority first.	Description text
124	Active rules	Sub-header (localized)
126	Add rule	Button text
153	Regex / Name (e.g. Work)	Input placeholder (localized)
163	Choose icon	Button text (fallback)
178	Choose icon	Button text (fallback)
183	1-100	Input placeholder
186	Priority (1-100). Minimum 1, maximum 100.	Input title/tooltip (localized)
219	×	Delete button text
228	No custom rules defined.	Empty state (localized)
232	New_Rule = 🌟 @100	Default new rule text
241	📦	Card icon
241	Custom icon management	Card title
243	Add individual SVG icons or import bulk packs from the internet. All custom icons added here will appear in the icon selection grid when styling a folder or file.	Description (localized)
246	Pro tip: custom ids should be unique. Avoid starting them with 'lucide-' unless you intend to override a built-in Obsidian icon.	Tip text (localized)
255	Add single icon	Sub-header (localized)
259	Icon ID (e.g. cloud-logo)	Input placeholder (localized)
260	SVG code (<svg...)	Input placeholder (localized)
263	Add icon	Button text
268	Please provide a valid ID and SVG code.	Notice message (localized)
277	Icon '${id}' registered!	Notice message (localized)
281	Bulk import from URL	Setting label (localized)
282	Enter a URL to a JSON icon pack { 'id': '<svg...>' }	Setting description
284	https://example.com/icons.json	Placeholder (localized)
285	Import	Button text
295	⭐	Card icon
295	Featured icon packs	Card title
299-308	Pack names like ✨ Remix icons, 🪶 Feather icons, 📐 Tabler icons, etc.	Pack title text
333	✓ Installed (${installedCount} icons) / Not installed	Badge text
348	View source	Link text
356	Re-Download / Download	Button text
359	Downloading...	Button text (downloading state)
363	Successfully downloaded ${count} icons for ${p.name}!	Notice message
366	Failed to download ${p.name}: ${msg}	Notice message (6000ms)
374	Remove	Button text
387	Removed ${count} icons from ${p.name}.	Notice message
394	📚	Card icon
394	Custom icon library	Card title
399	No custom icons found.	Empty state (localized)
434-445	Pack labels like All Icon Packs, Simple Icons, Feather Icons, Tabler Icons, Font Awesome Solid, etc.	Dropdown option labels
450	${name} (${items.length})	Dropdown option text
456	Filter icon name...	Search input placeholder
490	No matching icons found.	Empty state text
508	×	Delete button text
520	Show More Icons (${remaining} remaining)	Button text
553	📥	Card icon
553	Manual icon pack import	Card title
554	You can manually paste the JSON content of an icon pack below to import it.	Description text
559	Icon pack JSON	Setting label (localized)
561	{"prefix": "my-icons", "icons": {...}}	Textarea placeholder (localized)
571	Import manual JSON	Button text (localized)
578	Manual icon pack imported!	Notice message (localized)
582	Invalid JSON format.	Notice message (localized)
583	Colorful Folders: Manual Import failed	Console error message
src\ui\settings\FeaturesSettingSection.ts
Line	String	Context
10	➖	Card icon
10	Dividers and sections	Card title
21	💡 Quick guide: How to add dividers	Quick guide title (localized)
24	Right-click any folder or file in the explorer and click "add divider" to insert a section separator below it. You can also run the command "add/edit divider for current file" from the command palette.	Quick guide text (localized)
45	Live preview	Preview label
85	Section preview	Preview chip text
97	Modern pill design	Setting label (localized)
98	When enabled, dividers use the rounded "pill" background and border. When disabled, only text and lines are shown.	Setting description (localized)
114	Global pill background color	Setting label (localized)
115	Optional. Set a universal background color for all pills (rgba supported). Leave empty to inherit folder colors automatically.	Setting description (localized)
118	Open visual color picker	Tooltip (localized)
144	Example: #5ebd8e or rgba(94, 189, 142, 0.5)	Placeholder (localized)
155	Reset color	Extra button tooltip
177	Vertical spacing	Setting label (localized)
178	Adjust the empty space above and below dividers.	Setting description (localized)
193	Reset to default	Extra button tooltip (localized)
204	Line thickness	Setting label (localized)
205	Adjust the vertical line weight of the dividers.	Setting description (localized)
220	Reset to default	Extra button tooltip (localized)
231	Line gap (left)	Setting label (localized)
232	Adjust horizontal space between the left divider line and the central label.	Setting description (localized)
246	Reset to default	Extra button tooltip (localized)
256	Line gap (right)	Setting label (localized)
257	Adjust horizontal space between the right divider line and the central label.	Setting description (localized)
271	Reset to default	Extra button tooltip (localized)
280	Default line style	Setting label (localized)
282-286	Solid, Dashed, Dotted, Double, Groove	Dropdown options
298	Divider icon position	Setting label (hardcoded)
299	Placement of icons on divider pills.	Setting description (hardcoded)
301-303	Left of text, Right of text, Both sides	Dropdown options
314	🏷️	Card icon
314	Tag Color Sync	Card title
316	Harmonize your vault's visual hierarchy by automatically color-coding tags to match your folder themes.	Card description
321	Tag Color Sync	Setting label (localized)
322	Apply colors directly to hashtag pills across both live preview and reading mode.	Setting description
333	Match folder colors	Setting label (localized)
334	Automatically color tags that share the exact same name as any styled folder (e.g. Styling the folder "work" automatically styles the tag "#work").	Setting description
344	Custom tag rules	Setting label (localized)
345	Define custom color overrides for specific tags.	Setting description (localized)
358	Active rules	Sub-header (localized)
360	Add rule	Button text
386	Tag name (e.g. Urgent)	Input placeholder
397	#ffffff	Input placeholder
429	×	Delete button text
438	No custom rules defined.	Empty state (localized)
442	New_Rule = #5ebd8e	Default new rule text
450	🕸️	Card icon
450	Graph View Color Sync	Card title
452	💡 Tip: Colors are applied to the graph view using node path groups. Re-open or refresh the graph view tab after changes to see updates.	Tip text
456-457	How it works: To keep your graph configuration clean, only top-level folders and folders with explicit custom styles are synced. Automatically inherited subfolders are skipped.	Description text
462	Sync colors to graph view	Setting label (localized)
463	Automatically injects color groups matching your folders into Obsidian's native graph view. Pre-existing user-defined graph groups are safely preserved.	Setting description
472	Graph View colors synced! Re-open your Graph View to see the changes.	Notice message
476	Graph View color sync disabled. CF groups removed from graph.json.	Notice message
481	Sync now	Setting label / button text (localized)
482	Manually export your current folder colors and presets to the graph view settings file.	Setting description
484	Sync now	Button text (localized)
488	Enable "Sync colors to Graph View" first.	Notice message (localized)
493	Graph View colors synced! Re-open your Graph View to see the changes.	Notice message
497	🔗	Card icon
497	Notebook navigator	Card title
498	💡 Tip: To change icons in notebook navigator, simply use the colorful folders menu in the standard explorer. All changes are automatically synchronized.	Tip text
504	Notebook navigator support	Setting label (localized)
505	Allows colorful folders to safely style the icons and text of notebook navigator items.	Setting description
515	Auto-color files (backgrounds)	Setting label (localized)
516	Injects the faint background block and left border to file cards. Disable this to keep the cards strictly native.	Setting description
526	Removes solid backgrounds from notebook navigator items, showing only the left accent border.	Setting label/description (localized)
538	Navigator icon scaling	Setting label (localized)
539	Multiplies the size of icons strictly within Notebook Navigator (default 0.8). Range: 0.5 to 2.5.	Setting description
552	Reset to default	Extra button tooltip (localized)
560	Smart connections compatibility mode	Setting label (hardcoded)
561	Ensure seamless styling compatibility with smart connections plugin panels.	Setting description (hardcoded)
src\ui\settings\AISettingSection.ts
Line	String	Context
16	🧪 Experimental feature	Banner header
24	AI auto-icon classification is an experimental feature. Before running batch classification, please make a backup of your plugin settings and styles from the privacy tab.	Banner text
32	🤖	Card icon
32	AI Auto-Icon Classifier	Card title
34	Automatically classify all vault items and assign contextually meaningful icons in batch using AI.	Card description
38	AI provider	Setting label (hardcoded)
39	Select your local AI provider (local ollama or local custom OpenAI-Compatible server).	Setting description
41	🦙 Local ollama	Dropdown option
42	🌐 Local custom OpenAI-Compatible server	Dropdown option
56	Ollama server URL	Setting label (hardcoded)
57	Base URL for your local ollama instance (default: http://localhost:11434).	Setting description
60	HTTP://localhost:11434	Placeholder
70	Custom endpoint URL	Setting label (hardcoded)
71	Full URL endpoint for your local server (e.g. HTTP://localhost:1234/v1/chat/completions).	Setting description
74	HTTP://localhost:1234/v1/chat/completions	Placeholder
83	Model name	Setting label (hardcoded)
84	Model name to use for local classification (e.g. Qwen2.5:1.5b, llama3.2:1b).	Setting description
87	qwen2.5:1.5b	Placeholder
104	💡 Recommended Fast Local Models (Run 'ollama run <model>' in terminal first):	Recommendation header
108-111	Model labels like ⚡ qwen2.5:1.5b, 🚀 qwen2.5:0.5b, 🦙 llama3.2:1b, 🦙 llama3	Button texts
132	Set AI Model to ${m.name}. Make sure to run 'ollama run ${m.name}' in terminal!	Notice message
139	Include Markdown files	Setting label (hardcoded)
140	If enabled, classifies individual Markdown files as well as folders (folder-only is recommended for large vaults).	Setting description
150	Include file content & frontmatter context	Setting label (hardcoded)
151	If enabled, AI reads file content snippets, tags, and frontmatter properties for classification. If disabled, items are classified strictly & fast based on file/folder names only.	Setting description
172	📊 Token Usage Overview by Mode	Info header
179	Fast / name-only mode (content context off):	Strong text
180	Lowest token usage (~15-30 tokens per item). AI classifies items strictly based on folder and file names.	List item text
183	Deep context mode (content context on):	Strong text
184	Higher token usage (~150-500+ tokens per item). AI reads file content snippets, tags, and frontmatter properties for high contextual accuracy.	List item text
187	Vault scope tip:	Strong text
188	Disabling "Include Markdown Files" (Folder-Only Mode) significantly reduces overall token consumption in large vaults.	List item text
193	✨ Auto-assign icons with AI	Button text
198	🔄 Force re-assign all	Button text
203	🛑 Stop AI classification	Button text
210	⚡	Card icon
210	Vector embedding model (Fast & Offline)	Card title
212	Auto-assign icons instantly (<5ms per note) using the zero-dependency built-in local vector engine or a custom neural embedding model (ollama / bge-m3).	Card description
219	Embedding model engine	Setting label (hardcoded)
220	Choose between the zero-setup built-in local vector model (0mb) or a custom neural embedding model (ollama / local API).	Setting description
222	⚡ Built-in local vector model (0mb, default)	Dropdown option
223	⚙️ custom / local neural model (ollama / bge-m3)	Dropdown option
242	Custom model name	Setting label (hardcoded)
243	The embedding model name registered in ollama or your local server (e.g. Bge-m3, nomic-embed-text).	Setting description
245	Bge-m3	Placeholder
253	Endpoint URL	Setting label (hardcoded)
254	The base URL for your local embedding endpoint.	Setting description
256	HTTP://localhost:11434	Placeholder
267	⚡ Auto-assign icons with embeddings	Button text
270	⏳ Running vector embedding classification...	Button text (loading state)
276	⏳ ${engineName} is scanning vault files...	Notice message (persistent)
287	⏳ ${engineName}: ${pct}% (${completed}/${total} items processed)...	Notice message (progress update)
288	⏳ Classifying ${pct}% (${completed}/${total})...	Button text (progress update)
311	⚡ ${engineName}: Auto-assigned ${count} icons!	Notice message (success)
315	❌ Vector Embedding error: ${msg}	Notice message (error)
318	⚡ Auto-assign icons with embeddings	Button text (reset after completion)
src\ui\settings\PrivacySettingSection.ts
Line	String	Context
12	🔏	Card icon
12	Privacy & stealth	Card title
17	Vault is locked / Vault is unlocked	Setting label (conditional)
18	Unlock to manage hidden items and privacy settings. / Privacy settings are currently accessible.	Setting description (conditional)
21	Unlock	Button text (localized)
24	Unlock privacy	Modal title (localized)
28	Vault unlocked.	Notice message (localized)
33	Incorrect password!	Notice message (localized)
39	Lock now	Button text (localized)
43	Vault locked.	Notice message (localized)
58	🔒	Lock icon emoji
59	Settings are protected	Locked state text (localized)
60	Enter your password above to manage hidden folders.	Locked state description (localized)
63	Ghost mode	Setting label (localized)
64	Reveal hidden items with low opacity and blur. Note: items are still clickable in this mode.	Setting description
74	Vault password	Setting label (localized)
75	Set a password to lock the hidden items list and ghost mode. Leave empty to disable.	Setting description
77	Enter password...	Input placeholder (localized)
92	Show ribbon icon	Setting label (localized)
93	Add a quick-toggle icon to the Obsidian sidebar.	Setting description
107	💡 Tip: You can also use the 'Toggle stealth mode' command (e.g., Ctrl+Shift+Q). This can be customized in Obsidian's hotkey settings.	Tip text
111	Hidden items	Sub-header (localized)
124	No items are currently hidden.	Empty state (localized)
134	Unhide	Button text (localized)
150	🗄️	Card icon
150	Database & Backup Management	Card title
152	Clean unused styles	Setting label (localized)
153	Scans your configuration and removes style entries for folders or files that no longer exist in your vault.	Setting description
155	Clean up stale data	Button text (localized)
180	Backup configuration	Setting label (localized)
181	Export and download a backup JSON file of your styles, section dividers, or both.	Setting description (localized)
183-185	Both (Folders, Files & Dividers), Folder & file styles only, Dividers only	Dropdown options (localized)
190	Backup	Button text (localized)
250	Restore from backup	Setting label (localized)
251	Restore folder styles or dividers from a previous backup file. This will merge with your current settings.	Setting description
253	Restore	Button text (localized)
283	Invalid backup file format.	Notice message (localized)
305	Folder styles backup restored successfully!	Notice message (localized)
321	Dividers backup restored successfully!	Notice message (localized)
323	Invalid backup file format.	Notice message (localized)
333	Failed to parse backup file.	Notice message (localized)
346	Reset styles and presets	Setting label (localized)
347	Danger: this will permanently remove all custom colors, icons, and individual folder styles. Presets are also cleared.	Setting description
349	Reset styling	Button text (localized)
352	Reset styles and presets	Confirm modal title (localized)
352	Are you sure you want to delete all custom styling and presets? This cannot be undone.	Confirm modal message (localized)
357	Styles and presets have been reset.	Notice message (localized)
365	Factory reset	Setting label (localized)
366	Critical: this will reset every setting in the plugin to its original default state, including opacities, toggles, and all custom data.	Setting description
368	Hard reset everything	Button text (localized)
371	Factory reset	Confirm modal title (localized)
371	Are you sure you want to restore all settings to default? This will wipe ALL your customization!	Confirm modal message (localized)
377	All settings have been restored to defaults.	Notice message (localized)
385	🔧	Card icon
385	Icon maintenance	Card title
387	Register all icons	Setting label (localized)
388	Ensures all icons in your library are properly loaded into Obsidian.	Setting description
390	Re-register icons	Button text (localized)
393	All custom icons re-registered.	Notice message (localized)
397	Clear icon library	Setting label (localized)
398	Permanently deletes all imported icon packs.	Setting description (localized)
400	Clear icon library	Button text (localized)
403	Clear icon library	Confirm modal title (localized)
403	Are you sure you want to delete ALL custom icons?	Confirm modal message (localized)
408	Icon library cleared.	Notice message (localized)
416	❤️	Card icon
416	Support the developer	Card title
418	If you enjoy using colorful folders and want to support its continued development, please consider becoming a sponsor!	Card description
426	Sponsor rohitnahar-offical	Iframe title attribute
src\ui\modals\PasswordModal.ts
Line	String	Context
30	this.title (passed as "Unlock privacy")	Modal title
31	Please enter your vault password to continue.	Modal description
37	Password...	Input placeholder
65	Cancel	Button text
68	Unlock	Confirm button text
90	Forgot password?	Link text
92	To reset your password, perform a 'Factory reset' in the plugin settings or manually clear the password in your data.json file.	Notice message (8000ms)
src\ui\modals\IconPickerModal.ts
Line	String	Context
34	Select icon	Modal title (localized)
54	Search icons by name...	Search input placeholder (localized)
82	All packs	Filter dropdown option (localized)
83	✨ Obsidian Official (Lucide)	Filter dropdown option
178	No icons found	Empty state (localized)
src\ui\modals\ConfirmModal.ts
Line	String	Context
24	this.title (varies: "Reset styles and presets", "Factory reset", "Clear icon library")	Modal title
25	this.message (varies by context)	Modal body text
29	Confirm	Confirm button text (localized)
37	Cancel	Cancel button text (localized)
src\ui\modals\HoverMessageModal.ts
Line	String	Context
45	Edit hover message	Modal title
46	Add context, links, or tags that appear when you hover over this divider.	Modal description
53	Markdown editor	Label text
64	Write something beautiful... Use [[links]] to jump to notes, #tags to categorize, and **bold** or *italic* formatting.	Textarea placeholder
108	Bold (Ctrl+B)	Toolbar button tooltip
109	Italic (Ctrl+I)	Toolbar button tooltip
110	Strikethrough	Toolbar button tooltip
111	Highlight	Toolbar button tooltip
112	Inline code	Toolbar button tooltip
113	Code block	Toolbar button tooltip
114	Link (Ctrl+K)	Toolbar button tooltip
125	Live preview	Label text
137	No message set. Hover popover will be hidden.	Empty preview text
306	Cancel	Button text
315	Save message	Button text
src\ui\modals\DividerModal.ts
Line	String	Context
102	Section divider	Modal subtitle
106	Organizing: ${this.item.name}	Modal sub-subtitle
134	Label and appearance	Section header
137	Label text	Setting label
138	The display name for this section.	Setting description
140	E.g. Assets	Text input placeholder
147	Divider color	Section header
158	Alignment	Setting label
160-162		
The model hit its output limit, so this response may be incomplete.