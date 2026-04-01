# Colorful Folders v3.5.8 - The "Polish & Purity" Update ✨

Version 3.5.8 heavily focuses on refining the visual engine of Colorful Folders, correcting deep-nested rendering bugs, and making sure your vault looks pristine, vibrant, and flawless no matter your folder structure.

## 🚀 What's New in v3.5.8?

### 🎨 Two Stunning New Color Palettes
We have expanded the default vibe collection with two highly-requested aesthetic palettes:
- **Pastel Dreams**: A soft, airy palette featuring incredibly relaxing, low-saturation pastel colors (cotton candy pinks, mint greens, pale yellows, and soft lavenders). Perfect for a clean, minimalist vault.
- **Neon Cyberpunk**: A high-contrast, ultra-saturated aggressive palette featuring glowing hot pinks, electric cyans, neon greens, and bright golds. Extremely striking and vibrant, especially when paired with a dark theme.

### ✨ Subtle & Animated Path Glow
We have completely redesigned the Active File Glow to be more professional and atmospheric:
- **Redesigned Animations**: "Breathe," "Neon Flicker," and "Color Shimmer" have been tuned to be whisper-quiet and non-distracting.
- **Animation Style Selector**: A new dropdown in settings lets you choose the vibe that fits your vault.
- **Duration Slider**: Total control over animation speed (0.5s to 10s) via a precise new slider.

### 🌈 Persistent Rainbow Text
The Rainbow Root Text feature is now significantly smarter. If you manually override the background color of a root folder to customize its backing, the **text will safely maintain its gorgeous rainbow gradient** (as long as you haven't explicitly set a custom text color).

---

## 🛠️ Critical Bug Fixes & Refinements

- **Glassmorphism Multiplying Bug Fixed**: Previously, if you nested folders 4 or 5 levels deep, the "Glassmorphism Blur Effect" would stack on top of itself, multiplying the `saturate` and `blur` filters until the colors became a burnt-out, unreadable mess. Glassmorphism is now cleanly restricted to folder titles, keeping your deeply nested spaces pristine.
- **Indented Background Blocks Rewritten**: Completely overhauled the CSS logic generating children backing blocks. By swapping a fragile `:has` selector for a robust sibling combinator (`~`), root folders will no longer mysteriously lose their background tint when they contain subfolders.
- **Standalone File Opacity Bug**: Fixed a bug where setting a custom color on a single file would make its text transparent. Opacity now applies only to the background block.
- **Fatal Character Escaping Patch**: Added robust escaping for file paths containing backslashes (`\`) or quotes, preventing CSS injection crashes on Windows.
- **Hex Parser & Fallback Fixes**: Optimized the color engine to support 3-character hex codes (#fff) and improved the auto-contrast fallback logic for manual overrides.
- **"Faded Subfolder" Tint Fix**: Unified the opacity math for all folder depth levels. Deeply nested second-tier folders will no longer render with an invisible, faded 3.3% tint when you change the opacity slider. All folders now maintain a minimum visible baseline opacity so their L-shaped colored guides always stand out against dark themes.

Thank you for continuing to make your Obsidian workspace beautiful!
