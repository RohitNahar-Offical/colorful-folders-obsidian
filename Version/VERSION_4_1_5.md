# ⚡ 4.1.5 - The "Strict Spotlight" Update

This release introduces a ground-up modular redesign of the Focus Mode engine, prioritizing absolute visual clarity and zero-latency interaction.

### 🎯 1. Modular Focus Engine
- **Architectural Extraction**: Focus Mode has been moved into a dedicated peer module (`FocusModeEngine`). This decouples focus logic from the core rendering loop, significantly reducing complexity and increasing stability.
- **Strict Spotlight Pattern**: Replaced the legacy "Tunnel Vision" blur with a hardened contrast system. Background items are instantaneously dimmed, while the active file and its immediate parent folder remain in a crystal-clear "Spotlight."

### 🚀 2. The "Instant UI" Performance Model
- **Zero-Animation Mandate**: Purged all remaining CSS transitions and micro-animations from the File Explorer. The UI now updates with **absolute zero latency**, providing a sharp, responsive experience that never feels "mushy."
- **Logic Hardening**: Unified the interaction model across all modes (Normal, Focus, Stealth) to ensure a perfectly consistent feel.

### 📐 3. Path Border Stabilization
- **Thickness Standardization**: Standardized all Radiant Path lines (side and bottom) to a robust **2.5px** thickness.
- **Eliminated "Thinning"**: Fixed the sub-pixel rendering glitch where lines would appear thin (1px) when folders were selected or dimmed. All lines now maintain a consistent, solid weight across every state.
- **Bottom Shelf Restoration**: Fixed a visual bug where the horizontal bottom borders were missing on the active path and focused groups.

### 🎨 4. Active File Customization
- **Personalized Highlights**: Introduced a dedicated section in the settings tab for "Active Files."
- **Full Control**: Users can now enable a custom color override to precisely set the background and text color of the active selection, ensuring perfect readability regardless of the active theme or palette.
