import { TAbstractFile, App, Debouncer, MenuItem, Menu, EventRef } from 'obsidian';

export interface FolderStyle {
    hex?: string;
    textColor?: string;
    iconColor?: string;
    iconId?: string;
    opacity?: number;
    isBold?: boolean;
    isItalic?: boolean;
    applyToSubfolders?: boolean;
    applyToFiles?: boolean;
    dividerText?: string;
    dividerColor?: string;
    dividerAlignment?: string;
    dividerLineStyle?: string;
    dividerIcon?: string;
    dividerIconColor?: string;
    dividerUpper?: boolean;
    dividerGlass?: boolean;
    dividerIconPosition?: 'left' | 'right' | 'both';
    dividerPillMode?: 'global' | 'on' | 'off';
    dividerDescription?: string;
    dividerPillColor?: string;
    hasDivider?: boolean;
    isHidden?: boolean;
}

export interface ColorfulFoldersSettings {
    palette: string;
    customPalette: string;
    colorMode: string;
    exclusionList: string;
    outlineOnly: boolean;
    activeGlow: boolean;
    rootStyle: string;
    rootOpacity: number;
    subfolderOpacity: number;
    tintOpacity: number;
    customFolderColors: Record<string, FolderStyle | string>;
    presets: Record<string, FolderStyle>;
    recentlyUsedIcons?: string[];
    glassmorphism: boolean;
    focusMode: boolean;
    autoIcons: boolean;
    autoIconVariety: boolean;
    wideAutoIcons: boolean;
    animateActivePath: boolean;
    rainbowRootText: boolean;
    rainbowRootBgTransparent: boolean;
    autoColorFiles: boolean;
    activeAnimationStyle: string;
    activeAnimationDuration: number;
    showItemCounters: boolean;
    rootTintOpacity: number;
    lightModeBrightness: number;
    darkModeBrightness: number;
    customIconRules: string;
    iconDebugMode: boolean;
    notebookNavigatorSupport: boolean;
    notebookNavigatorFileBackground: boolean;
    iconScale: number;
    customIcons: Record<string, string>;
    showFileDivider: boolean;
    fileDividerText: string;
    dividerThickness: number;
    dividerSpacing: number;
    dividerLineStyle: string;
    separatorColor: string;
    dividerPillMode: boolean;
    dividerIconPosition: string;
    cycleOffset: number;
    fileBackgroundOpacity: number;
    notebookNavigatorOutlineOnly: boolean;
    vaultPassword?: string;
    isVaultLocked?: boolean;
    showHiddenItems: boolean;
    showRibbonIcon: boolean;
    lastVersion: string;
    globalBackgroundColor: string;
    dividerLinePadding: number;
    dividerPillColor: string;
}


export interface AutoIconData {
    rex: RegExp;
    emoji: string;
    lucide: string;
    priority: number;
    isCustom?: boolean;
    emojis?: string[];
    lucides?: string[];
}

export interface EffectiveStyle {
    hex: string;
    textColor: string;
    iconColor: string;
    iconId: string;
    opacity: number;
    isBold: boolean;
    isItalic: boolean;
    applyToSubfolders: boolean;
    applyToFiles: boolean;
}

export interface ColorPickerOpts {
    showAlpha?: boolean;
    initialAlpha?: number;
}

export interface IColorfulFoldersPlugin {
    app: App;
    settings: ColorfulFoldersSettings;
    heatmapCache: Map<string, number> | null;
    iconCache: Map<string, string>;
    iconManager: { 
        refreshIcons(): void,
        getIconSvg(iconId: string, shouldEncode?: boolean): string,
        getAutoIconData(name: string): AutoIconData | null,
        normalizeSvg(svgStr: string, shouldEncode?: boolean): string
    };
    styleTag: HTMLStyleElement;
    uiStyleTag: HTMLStyleElement;
    isSyncingDividers: boolean;
    processDividersDebounced: Debouncer<[], void>;
    saveSettings(): Promise<void>;
    registerCustomIcons(): void;
    cleanUnusedStyles(): Promise<void>;
    refreshRibbon(): void;
    dividerManager: {
        syncDividers(): void;
        clean(): void;
        buildDividerNode(path: string, conf: FolderStyle, doc: Document): HTMLElement;
    };
    getStyle(path: string): FolderStyle | null;
    getEffectiveStyle(target: TAbstractFile): EffectiveStyle;
    generateStyles(): void;
    refreshIcons(): void;
    initDividerObserver(): void;
    processDividers(): void;
    registerEvent(event: EventRef): void;
}

declare global {
    interface HTMLElement {
        setCssStyles(styles: Partial<CSSStyleDeclaration> | Record<string, string | number>): void;
    }
}

export interface MenuItemWithSubmenu extends MenuItem {
    setSubmenu(): Menu;
}
