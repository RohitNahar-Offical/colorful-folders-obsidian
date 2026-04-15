# Version 4.0.6 - Precision & Maintenance Update

## Summary
This version focuses on long-standing visual alignment issues, improves icon pack import robustness, and provides new tools for plugin maintenance.

## Changes
- **Standardized Icon Alignment**: Forced `vertical-align: middle` on all file and folder icons to ensure perfect centering regardless of font size or theme.
- **Improved Iconify Importer**:
    - Added support for SVG offsets (`left`, `top`) and specific dimensions (`width`, `height`).
    - Added alias support to ensure all icons in a pack are imported.
    - Robust `viewBox` generation to prevent icon clipping.

## 🍱 New Built-in Icon Library
Added 6 curated, local JSON icon packs for instant use without requiring an internet connection. These are located in the `icons/` directory:
- `Material Icons`
- `FontAwesome Free`
- `Community Core`
- `System Essentials`
- `Vibrant Folders`
- `Sample Pack`

- **Smart Cache Management**: `iconCache` is now cleared whenever settings are saved, preventing "sticky" icon scaling when adjusting the multiplier.
- **Maintenance Section**:
    - **Reset All Styling**: Clears all folder/file overrides.
    - **Clear Icon Library**: Deletes all custom imported icons.
- **Heatmap Improvements**: Uses the current user-selected palette for the Activity Heatmap instead of hardcoded defaults.
- **Exposed Debug Mode**: "Icon Debug Mode" can now be toggled in settings to troubleshoot auto-icon matching.

## Internal
- Refactored `importUrl` to be cleaner and more maintainable.
- Standardized vertical alignment in CSS generation logic.
- Implemented `saveSettings` hooks for cache invalidation.
