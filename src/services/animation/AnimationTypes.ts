export interface RegisteredAnimatedTarget {
    iconId?: string;
    closedIconId?: string;
    openIconId?: string;
}

export type AnimationPlaybackState = 'closed' | 'open' | 'both';

export const ANIMATED_PACK_PREFIXES = [
    'line-md-', 'linemd-', 'line-md:', 'line-md_',
    'meteocons-', 'meteocons:', 'meteocons_',
    'generative-', 'generative:', 'generative_',
    'useanimations-', 'useanimations:', 'useanimations_', 'ua-'
] as const;

export const ANIMATION_SELECTORS = {
    NAV_ROW: '.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file',
    TARGET_ROW_IS: ':is(.nav-folder-title, .nav-file-title, .tree-item-self, .nn-navitem, .nn-file)',
    NAV_TEXT: '.nav-folder-title-content, .nav-file-title-content, .tree-item-inner, .nn-navitem-name, .nn-file-name',
    NN_ICON_SLOT: '.nn-navitem-icon, .nn-file-icon-slot, .nn-file-icon',
    LIVE_ICON: '.cf-live-animated-icon',
    ANIMATED_ICON: '.cf-animated-icon',
    ANY_ANIMATED_ICON: '.cf-live-animated-icon, .cf-animated-icon',
    CLOSED_LIVE_ICON: '.cf-live-animated-icon.cf-animated-closed, .cf-live-animated-icon:not(.cf-animated-open)',
    OPEN_LIVE_ICON: '.cf-live-animated-icon.cf-animated-open, .cf-live-animated-icon:not(.cf-animated-closed)',
} as const;
