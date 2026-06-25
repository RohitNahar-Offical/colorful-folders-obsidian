# ⚡ 4.1.8 - Performance Optimization & Refined Active State Engine

This release introduces major performance optimizations for large vaults, decoupling active selection styling from the dynamic stylesheet generation engine, debouncing folder icon refreshes, and refactoring integrations to prevent rendering overhead and input lag.

### 🚀 1. Active Selection Engine Refactor
- **Class-Based Dynamic Highlighting**: Decoupled active path highlighting from the main stylesheet generator. Instead of rebuilding and parsing a massive CSS string on every file selection event, the plugin now dynamically applies lightweight `.cf-active-parent` classes to the DOM, eliminating file-open input lag.
- **Notebook Navigator Integration**: Refactored the integration for the *Notebook Navigator* plugin to natively support and align with the new class-based dynamic highlight engine.

### ⚡ 2. Rendering Optimization & Debouncing
- **Icon Refresh Debouncing**: Added a 100ms debouncer to the icon refresh cycle to prevent layout thrashing and stuttering when expanding folders rapidly.
- **Startup & Event Optimization**: Optimized startup routines and file mutation handlers (create, delete, rename) to run on a debounced cycle, ensuring the main thread remains fully responsive during heavy vault operations.
