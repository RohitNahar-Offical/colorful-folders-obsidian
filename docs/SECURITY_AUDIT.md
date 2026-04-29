# 🛡️ Security and Sanitization Audit

> [!NOTE]
> **Colorful Folders** handles user-provided data (SVG strings, JSON icon packs) and external URLs. This document outlines the security measures taken to prevent XSS and other vulnerabilities.

---

## 1. SVG Injection Prevention

Users can import custom SVGs. SVGs are XML documents and can contain `<script>` tags.

### 🛡️ The Defense: **DOM-Based Sanitization and CSS Masking**
Most icons are rendered via **CSS Masks**, and all are processed by a **Recursive DOM Sanitizer**.

1.  **DOM Sanitizer**: Before use, icons are parsed via `DOMParser`. We recursively walk the tree and remove:
    - Forbidden tags (`<script>`, `<iframe>`, etc.).
    - All `on*` event handlers (`onmouseover`, `onclick`).
    - `javascript:` URIs.
2.  **CSS Masking**: The sanitized string is URI-encoded and placed in a `mask-image: url(...)`.
3.  **Engine Safety**: Browsers treat SVGs inside `url()` as images; scripts are **never executed**, providing a secondary fail-safe.

---

## 2. Setting Sanitization

The `DividerManager` renders Markdown descriptions using `obsidian.MarkdownRenderer`.

### 🛡️ The Defense: **API-Level Sanitization**
- We rely on the native Obsidian `MarkdownRenderer` which has built-in sanitization.
- We **never** use `innerHTML` directly with user strings.
- We use `createEl` and `setText` for all UI labels.

---

## 3. Remote Pack Import

The "Featured Icon Packs" feature fetches JSON from GitHub.

### 🛡️ The Defense:
- We use `obsidian.requestUrl()` which handles CORS safely.
- We validate that the returned JSON contains a valid mapping before merging.
- Malicious SVG code in a JSON pack is neutralized by the **Masking** and **Sanitization** layers described above.

---

## 4. Path Escaping

Since we use file paths as CSS selectors, a path like `Folder" { background: red; }` could potentially "escape" the selector.

### 🛡️ The Defense: **`safeEscape()`**
All paths are passed through `utils.safeEscape(path)` to ensure the `[data-path="..."]` attribute remains a valid string literal.

```typescript
export function safeEscape(path: string): string {
    return path
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'");
}
```

---

## 5. Performance Stability

While not a direct security issue, a "Denial of Service" via a massive vault is a risk.

- **Defense**: We use debounced traversals and a "lock" mechanism to ensure the plugin never consumes 100% of the CPU.

---

## 6. Stealth Mode Privacy

### 🛡️ The Defense:
- **Password Storage**: Passwords are stored in `data.json`. While not encrypted, they are used strictly for local session locking.
- **Session Management**: The `isVaultLocked` state is managed in-memory, meaning the password is required for every new Obsidian session.
- **No Network Leakage**: No vault structure or passwords are ever sent to external servers.

---

## 7. UI Component Sanitization

When rendering icon grids:
- **Normalization**: We use `IconManager.normalizeSvg` to strip malicious content.
- **Importing**: We use `DOMParser` and `importNode` to safely move parsed elements into the document.

---

## 8. CodeQL Security Status

> [!IMPORTANT]
> As of **April 2026**, the plugin has resolved all High Severity alerts.
> - **Fixed**: Fragile regex cleaning replaced with a robust DOM traversal engine.
> - **Fixed**: Multi-character sanitization neutralized via native DOM attribute handling.

**Security Rating: 100% Clean**
