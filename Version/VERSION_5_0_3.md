# 🛠️ 5.0.3 - Architecture Modularization, Native Selector Optimization & Documentation

This release modularizes core plugin architecture (introducing dedicated service classes), optimizes CSS selector resolution using native `data-path` attributes, enhances event tracking and hidden state detection, and updates complete project documentation.

---

### 🏗️ 1. Architecture Modularization & Modular Core
* **Dedicated Service Classes**: Modularized plugin codebase by extracting `BaseCssGenerator`, `EventTrackerService`, and `LRUCache` into decoupled core modules.
* **Streamlined Plugin Entry**: Refactored `main.ts` entry point to delegate style generation and lifecycle tracking cleanly to specialized sub-services.

### ⚡ 2. Native `data-path` Selector Optimization
* **Native Selector Resolution**: Replaced custom `data-cf-path` attributes with native `data-path` selectors across `BaseCssGenerator` and `StyleGenerator`.
* **Reduced CSS Payload**: Direct `data-path` attribute targeting eliminates duplicate attribute injection and reduces overall stylesheet payload size.

### 🔍 3. Refined Event Tracking & Folder Note Detection
* **Explicit Hidden State Handling**: Updated `EventTrackerService` to track explicit hidden state toggles accurately.
* **Escaped Selector Specificity**: Improved parent path style calculations with escaped path rules for folder notes and nested structures.

### 📚 4. Reorganized Documentation & Project Index
* **Hierarchical Rules & Specs**: Reorganized technical documentation into categorized subdirectories (architecture, governance, integrations, rules, styling) with an updated master index.
