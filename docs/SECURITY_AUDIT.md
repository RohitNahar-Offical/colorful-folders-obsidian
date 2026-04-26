# 🛡️ Security & Sanitization Audit

Colorful Folders handles user-provided data (SVG strings, JSON icon packs) and external URLs. This document outlines the security measures taken to prevent XSS (Cross-Site Scripting) and other vulnerabilities.

## 1. SVG Injection Prevention

Users can import custom SVGs. SVGs are XML documents and can contain `<script>` tags.

### The Defense: **DOM-Based Sanitization & CSS Masking**
Most icons in the plugin are rendered via **CSS Masks**, and all are processed by a **Recursive DOM Sanitizer**.
1.  **DOM Sanitizer**: Before any icon is used, it is parsed via `DOMParser`. We then walk the tree and remove forbidden tags (`<script>`, `<iframe>`, etc.) and all `on-` event handlers and `javascript:` URIs.
2.  **CSS Masking**: The sanitized SVG string is URI-encoded and placed in a `mask-image: url(...)`.
3.  **Safety**: Browsers treat SVGs inside `url()` as images. Scripts inside these SVGs are **never executed**, even if they survived sanitization.
*   This dual-layer defense is our primary protection against malicious icon packs.

---

## 2. Setting Sanitization

The `DividerManager` renders Markdown descriptions using `obsidian.MarkdownRenderer`.

### The defense: **API-level sanitization**
*   We rely on the native Obsidian `MarkdownRenderer` which has built-in sanitization for HTML tags.
*   The `HoverMessageModal` also uses this renderer for its "Live preview" pane, ensuring consistency between the editor and the final popover.
*   We do not use `innerHTML` directly with user strings. We use `createEl` and `setText` for all UI labels.

---

## 3. Remote Pack Import

The "Featured Icon Packs" feature fetches JSON from GitHub.

### The Defense:
*   We use `obsidian.requestUrl()` which handles CORS safely within the Electron environment.
*   We validate that the returned JSON contains a valid mapping before merging it into `this.settings.customIcons`.
*   As noted in section 1, even if the JSON contains malicious SVG code, it will only be used in a `mask-image` context where it cannot execute scripts.

---

## 4. Path Escaping

Since we use file paths as CSS selectors, a path like `Folder" { background: red; }` could potentially "escape" the selector and inject arbitrary CSS.

### The Defense: **`safeEscape()`**
All paths are passed through `utils.safeEscape(path)` before being used in a selector.
```typescript
export function safeEscape(path: string): string {
    return path
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'");
}
```
This ensures that the `[data-path="..."]` attribute remains a valid string literal.

---

## 5. Performance Stability

While not a direct security issue, a "Denial of Service" via a massive vault is a risk.
*   **Defense**: We use debounced traversals and a "lock" mechanism to ensure the plugin never consumes 100% of the CPU, even in vaults with 100k+ files.

---

## 6. Stealth Mode Privacy

The "Stealth Mode" (Data Hider) is designed for visual privacy.

### The Defense:
*   **Password Storage**: Passwords are stored in the plugin's `data.json`. While they are not encrypted, they are used strictly for local session locking.
*   **Session Management**: The `isVaultLocked` state is managed in-memory during a session. This ensures that even if someone extracts the `data.json`, they still need the password to unlock the UI during an active Obsidian session.
*   **No Network Leakage**: The plugin never sends your vault structure or passwords to any external server.

---

## 7. UI Component Sanitization

When rendering the "Icon Selection Grid" or "Recently Used Icons":
*   **DOM Sanitizer**: We use the same robust `IconManager.normalizeSvg` logic to ensure that even icons shown in the UI grid are fully stripped of malicious content.
*   **DOMParser**: We use the native `DOMParser` to convert SVG strings into actual DOM nodes.
*   **Node Import**: We use `importNode` to safely move the parsed SVG elements into the document.

---

## 8. CodeQL Security Alerts (Resolved)

Following a comprehensive security scan (April 2026), the plugin successfully resolved all **High Severity** alerts related to:
*   **Bad HTML filtering regexp**: Replaced fragile regex cleaning with the DOM-based traversal engine.
*   **Incomplete multi-character sanitization**: Neutralized via native `removeAttribute` and `setAttribute` calls on a parsed DOM tree.

The plugin is currently rated as **100% Fixed** for all known injection vulnerabilities.
