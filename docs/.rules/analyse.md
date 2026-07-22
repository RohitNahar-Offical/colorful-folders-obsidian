# Comprehensive Analysis: Icon Selection Process & Rule Hierarchy

This document provides a technical breakdown of the icon selection algorithm implemented across [IconManager.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts), [StyleResolver.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleResolver.ts), and [StyleGenerator.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleGenerator.ts).

---

## 1. High-Level Icon Selection Flowchart

```mermaid
flowchart TD
    Start["Item Evaluation: File or Folder?"] --> CheckCustomStyle{"Direct Custom Style?<br/>(customFolderColors[path])"}
    
    CheckCustomStyle -- Yes --> HasDirectIcon{"customStyle.iconId<br/>specified?"}
    HasDirectIcon -- Yes --> UseDirectIcon["Use Direct customStyle.iconId"]
    HasDirectIcon -- No --> CheckInherited
    
    CheckCustomStyle -- No --> CheckInherited{"Inherited Parent Style?<br/>(applyToFiles / applyToSubfolders)"}
    
    CheckInherited -- Yes --> HasInheritedIcon{"inheritedStyle.iconId<br/>specified?"}
    HasInheritedIcon -- Yes --> UseInheritedIcon["Use Inherited inheritedStyle.iconId"]
    HasInheritedIcon -- No --> CheckAutoIcons
    
    CheckInherited -- No --> CheckAutoIcons{"settings.autoIcons<br/>enabled?"}
    
    CheckAutoIcons -- Yes --> RunAutoIconEngine["Invoke IconManager.getAutoIconData(name, path)"]
    RunAutoIconEngine --> MatchPriority{"Priority Tier Evaluation"}
    
    MatchPriority -- Tier 1: Priority 2000 --> ExactPackMatch["Exact Local Pack / Custom Icon Match"]
    MatchPriority -- Tier 2: Priority 1500 --> CustomRegexRule["User Custom Regex Rule (settings.customIconRules)"]
    MatchPriority -- Tier 3: Priority 80-100 --> CategoryRule["Built-In Category Match (AUTO_ICON_CATEGORIES)"]
    MatchPriority -- Tier 4: Priority 50 --> FuzzyPackMatch["Fuzzy Multi-Word / Partial Pack Fallback"]
    
    ExactPackMatch --> WideVsEmoji{"settings.wideAutoIcons?"}
    CustomRegexRule --> WideVsEmoji
    CategoryRule --> WideVsEmoji
    FuzzyPackMatch --> WideVsEmoji
    
    WideVsEmoji -- True --> UseLucide["Select SVG ID (wideAutoIcons / Lucide / Pack ID)"]
    WideVsEmoji -- False --> UseEmoji["Select Emoji Candidate"]
    
    CheckAutoIcons -- No --> DefaultFallback["Default UI Fallback"]
    DefaultFallback -- Is File --> FileDefault["Default File Icon / Mask"]
    DefaultFallback -- Is Folder --> FolderDefault["Default Folder Icons<br/>(defaultClosedFolderIcon / defaultOpenFolderIcon)"]
```

---

## 2. Decision Matrix: File vs. Folder Icon Selection

The system differentiates between **File** items (`TFile`) and **Folder** items (`TFolder`) at both the style resolution phase ([StyleResolver.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleResolver.ts)) and the CSS generation phase ([StyleGenerator.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleGenerator.ts)).

| Feature / Behavior | Files (`TFile`) | Folders (`TFolder`) |
| :--- | :--- | :--- |
| **Direct Custom Style** | Uses `customStyle.iconId` | Uses `customStyle.iconId` |
| **Inherited Parent Style** | Inherits `inheritedStyle.iconId` **ONLY IF** parent style has `applyToFiles: true` | Inherits `inheritedStyle.iconId` **ONLY IF** ancestor style has `applyToSubfolders: true` |
| **Expanded / Open State** | Single static icon | Supports `expandedIconId` (or toggles between `defaultClosedFolderIcon` & `defaultOpenFolderIcon`) |
| **Auto-Icon Resolution** | Calls `getAutoIconData(child.name, child.path)` | Calls `getAutoIconData(child.name, child.path)` |
| **Default Fallback (Auto-Icon Disabled & No Custom Icon)** | Renders native file SVG mask (`CF_FILE_TEXT_ICON`) or standard file icon | Renders closed folder icon (`defaultClosedFolderIcon`, e.g. `lucide-folder`) & open folder icon (`defaultOpenFolderIcon`, e.g. `lucide-folder-open`) |
| **Wide vs Emoji Preference** | Controlled by `settings.wideAutoIcons` | Controlled by `settings.wideAutoIcons` |

---

## 3. Tiered Priority Hierarchy in `getAutoIconData()`

When `settings.autoIcons` is enabled and no explicit custom icon overrides exist, [IconManager.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts#L25-L152) resolves the target icon using the following strictly ordered 4-tier pipeline:

### 🥇 Tier 1: Exact Local Pack / Custom Icon Name Match (Priority: 2000)
- **Target**: Compares the sanitized, hyphenated item title (`sanitized.replace(/[\s_]+/g, '-')`) directly against installed local SVG icon packs (in `.obsidian/icons`) and user custom icons (`settings.customIcons`).
- **Behavior**: If a file/folder named `github` matches `github.svg` (or `si-github`, `fa-github`), it immediately returns this icon with **Priority 2000**.

### 🥈 Tier 2: Custom User Regex Rules (Priority: 1500)
- **Target**: Evaluates user-defined rules configured in `settings.customIconRules` (e.g. `project.* = 🚀@1500` or `work = lucide-briefcase`).
- **Behavior**: Built dynamically into regular expressions (`new RegExp(pattern, 'i')`) and sorted ahead of built-in categories.

### 🥉 Tier 3: Built-In Category Rules (Priority: 80–100)
- **Target**: Evaluates [AUTO_ICON_CATEGORIES](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts#L3) (e.g., `journal|daily|log`, `tech|code|dev`, `finance|money`).
- **Behavior**: Matches the item name against standard categories. If `settings.autoIconVariety` is enabled, a deterministic hash of the item name (`hashString(name)`) selects a varied emoji/Lucide icon from the category pool.

### 🏅 Tier 4: Fuzzy Multi-Word & Partial Pack Fallback (Priority: 50)
- **Target**: For multi-word file/folder names (e.g. `"Nintendo Switch 2 thoughts"`), filters out stop-words (`and`, `the`, `notes`, `thoughts`, `draft`, etc.) and tests:
  1. Two-word combinations (e.g. `"nintendo-switch"`).
  2. Individual brand/tool words (e.g. `"nintendo"`).
- **Behavior**: Acts as a final fallback with **Priority 50**, ensuring generic single-word pack matches do not hijack higher-priority user rules or category rules.

---

## 4. Rendering Modes: SVG Masking vs. Emoji Injection

Once `iconId` is resolved, the plugin renders the icon using one of three mechanisms:

1. **Emoji Mode** (`isEmojiIcon(iconId) === true`):
   - Injected via CSS `::before` pseudo-element with `content: "${iconId} "`.
2. **Lucide / Custom SVG Mask Mode**:
   - Encoded SVG retrieved via [getIconSvg(iconId)](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts#L205).
   - Styled via CSS pseudo-element `::before` using `-webkit-mask-image: url("data:image/svg+xml,...")` with `-webkit-mask-size: contain`.
3. **DOM Injection (RAF-Batched Batching)**:
   - Evaluated by `_doInjectIcon()` for real-time dynamic elements, creating a `.cf-icon-wrapper` `<span>` stamped with `data-cf-icon-id` and `data-cf-icon-color` for O(1) re-render performance.

---

## 5. Summary of Key Files

- [IconManager.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/IconManager.ts): Implements `getAutoIconData()`, `findIconInPacks()`, `isEmojiIcon()`, `getIconSvg()`, and RAF-batched DOM injection.
- [StyleResolver.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleResolver.ts): Resolves effective style objects (`EffectiveStyle`) for individual files and folders.
- [StyleGenerator.ts](file:///r:/Obsidian/Testsub1/.obsidian/plugins/colorful-folders/src/core/StyleGenerator.ts): Generates high-performance CSS stylesheet rules for Obsidian's File Explorer and third-party integrations (e.g., Notebook Navigator).
