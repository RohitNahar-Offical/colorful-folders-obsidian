# 🤝 Contributing to Colorful Folders

Thank you for your interest in contributing to **Colorful Folders**! We welcome bug reports, feature suggestions, documentation enhancements, translations, and code contributions.

> [!NOTE]
> For our complete technical implementation guide, architectural rules, and theme integration standards, see the **[Feature Implementation Guide](docs/governance/CONTRIBUTING.md)**.

---

## 🎨 Theme Compatibility & CSS Variable Hook Standards

Colorful Folders prioritizes seamless cooperation with community Obsidian themes rather than overriding them with brute force `!important` rules. Any contribution that affects styling or colors must adhere to our theme-facing contract:

### 1. Published Theme State (on `<body>`)
In all open workspace windows (including popouts), the plugin publishes the active contrast state directly to `document.body`:
* **`.cf-folder-auto`**: Present whenever the **Auto contrast** engine is active.
* **`.cf-folder-auto-snap`**: Present when **Snap to black or white** is enabled.
* **`--cf-auto-steps`**: Lightness shift step multiplier (default: `3`).
* **`--cf-auto-tolerance`**: Snap boundary percentage (default: `0`).
* **`--cf-subfolder-opacity`**: Subfolder opacity setting so themes can compute perceived background luminosity.

### 2. Published Per-Row CSS Variables
Every styled item row exposes granular CSS variables consumed by themes and custom snippets:
* **`--cf-color`**: Raw hex color (e.g., `#6366f1`).
* **`--cf-color-rgb`**: RGB triplet (e.g., `99, 102, 241`).
* **`--cf-colored`**: Flag (`1`) indicating the item has an active Colorful Folders style. Enables CSS `@container style(--cf-colored: 1)` queries.
* **`--cf-bg-alpha`**: Effective alpha opacity of the painted row background after depth progression.
* **`--cf-folder-bg` / `--cf-file-bg`**: Dynamic background variable hook (overridable without `!important`).
* **`--cf-folder-color` / `--cf-file-color`**: Dynamic text variable hook.

### 3. Palette Text & Icon Pairing
* Text and icon pairs are pre-indexed into an $O(1)$ normalized map during style preparation.
* Folder-specific styles (`textColor`, `iconColor`) take precedence over palette pairs.
* If a pair has `auto: true`, the plugin stands down and allows theme auto-contrast rules to determine text/icon contrast.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [npm](https://www.npmjs.com/)

### Development Setup
1. **Fork and clone** the repository into your Obsidian plugins folder:
   ```bash
   cd <your-vault>/.obsidian/plugins/
   git clone https://github.com/RohitNahar-Offical/colorful-folders-obsidian.git colorful-folders
   cd colorful-folders
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the build watcher** (re-compiles on save):
   ```bash
   npm run dev
   ```
4. **Reload the plugin** in Obsidian:
   * Open Obsidian Settings → **Community plugins** → Toggle **Colorful Folders** off and back on (or use the Obsidian command *Reload app without saving* via `Ctrl+R` / `Cmd+R`).

---

## 🛡️ Mandatory Development Rules

All pull requests must adhere to our core architectural directives:

1. **Obsidian Plugin Compilation**: Whenever modifying TypeScript source files (`src/*.ts`), **ALWAYS run `npm run build`** immediately. Obsidian loads the compiled `main.js`, so your changes will not take effect in the app until built.
2. **DOM Styling Compliance**: **NEVER** write inline property assignments or set static style properties directly using `el.style.setProperty()` or `el.style.cssText`. Always use `el.setCssProps({ '--cf-variable': 'value' })` to assign CSS custom properties and consume them in stylesheets.
3. **DOM Injection Performance**: Never call `require()` or parse SVG strings repeatedly inside high-frequency DOM iteration loops. Construct DOM elements as single templates outside loops and use `.cloneNode(true)`.
4. **Visual Styling Decoupling**: Never bundle text/icon color logic together with background block/border logic into a single boolean gate in `StyleGenerator.ts`. Text/icon auto-colors must evaluate independently.
5. **Zero-DOM Isolation**: Keep Section Dividers strictly isolated to native File Explorer containers (`.nav-files-container`). Never inject physical divider wrapper nodes into virtualized lists (such as Notebook Navigator).
6. **Zero Warning Policy**: Always run `npm run lint` (`eslint src --max-warnings 0`) before committing. Ensure 0 warnings and 0 errors.

---

## 🌐 Adding or Updating Translations (i18n)

Colorful Folders features a compile-time typed localization system:
1. `src/lang/locale/en.ts` is the **source of truth** (all keys must exist in `en.ts`).
2. Add your translated equivalents in the corresponding locale file (`de.ts`, `es.ts`, `fr.ts`, `ja.ts`, `sk.ts`, `zh-cn.ts`, `zh-tw.ts`).
3. For new languages, see the **[Localization Guide](docs/integrations/LOCALIZATION.md)**.

---

## 📬 Submitting a Pull Request

1. Create a branch from `main` (`git checkout -b feature/my-feature`).
2. Ensure `npm run lint` and `npm run build` pass without warnings.
3. Commit with concise, descriptive commit messages.
4. Open a Pull Request on GitHub against the `main` branch.
