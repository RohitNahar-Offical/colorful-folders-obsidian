import { App, MenuItem, Menu, EventRef, Debouncer } from 'obsidian';
import { DOMObserverService } from '../services/DOMObserverService';
import type { IconManager } from '../core/IconManager';
import type { AIIconClassifier } from '../integrations/AIIconClassifier';

export interface FolderStyle {
    hex?: string;
    textColor?: string;
    iconColor?: string;
    iconId?: string;
    icon?: string;
    expandedIconId?: string;
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
    dividerLinePaddingLeft?: number;
    dividerLinePaddingRight?: number;
    dividerThickness?: number;
    hasDivider?: boolean;
    isHidden?: boolean;
    textGradient?: boolean;
    textGradientEnd?: string;
    rainbowBrightness?: number;
    borderRadius?: number;
    aiHash?: string;
    iconSource?: 'ai' | 'ai-ollama' | 'ai-custom' | 'embedding' | 'manual' | 'auto' | (string & {});
}

export interface ColorfulFoldersSettings {
    paletteLight: string;
    paletteDark: string;
    palette?: string;
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

    autoIcons: boolean;
    iconPackPriorityOrder?: string[];
    autoIconVariety: boolean;
    varietySeed: number;
    wideAutoIcons: boolean;
    rainbowRootText: boolean;
    rainbowRootBgTransparent: boolean;
    rainbowGradientAngle?: number;
    autoColorFiles: boolean;
    fileColorMode: string;
    colorText?: string | boolean;
    showItemCounters: boolean;
    rootTintOpacity: number;
    lightModeBrightness: number;
    darkModeBrightness: number;
    customIconRules: string;
    iconDebugMode: boolean;
    notebookNavigatorSupport: boolean;
    notebookNavigatorFileBackground: boolean;
    iconScale: number;
    notebookNavigatorIconScale: number;
    graphColorSync: boolean;
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
    dividerLinePaddingLeft?: number;
    dividerLinePaddingRight?: number;
    dividerPillColor: string;
    useCustomActiveColor: boolean;
    customActiveBg: string;
    customActiveText: string;
    pathLineThickness: number;
    wrapMetadata?: boolean;
    tagSyncEnabled: boolean;
    tagSyncMatchFolders: boolean;
    tagSyncRules: string;
    spacedTextMode: string;
    indentSubfolderPills: boolean;
    folderSpacing: boolean;
    defaultClosedFolderIcon: string;
    defaultOpenFolderIcon: string;
    showCollapseIndicator: boolean;
    folderBorderRadius: number;
    enableStaircaseHack: boolean;
    heatmapData?: Record<string, number>;

    aiProvider: 'ollama' | 'custom';
    aiApiKey: string;
    aiCustomEndpoint: string;
    aiOllamaEndpoint: string;
    aiModelName: string;
    aiIncludeFiles?: boolean;
    aiIncludeContentContext?: boolean;
    aiKeyConfirmed?: boolean;

    embeddingEngine?: 'builtin' | 'custom';
    embeddingCustomModel?: string;
    embeddingCustomEndpoint?: string;
}


export interface AutoIconData {
    tier?: number;
    rex: RegExp;
    emoji: string;
    lucide: string;
    priority: number;
    isCustom?: boolean;
    emojis?: string[];
    lucides?: string[];
    packSource?: string;
}

export interface EffectiveStyle {
    hex: string;
    textColor: string;
    iconColor: string;
    iconId: string;
    icon?: string;
    expandedIconId: string;
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
    folderCountCache: Map<string, { files: number, folders: number }> | null;
    iconCache: Map<string, string>;
    folderSortCache?: Map<string, number> | null;
    rootSortCache?: Map<string, number> | null;
    parsedExclusionList?: Set<string> | null;
    activePaletteCache?: { palette: { rgb: string; hex: string }[] } | null;
    iconManager: IconManager;
    aiIconClassifier: AIIconClassifier;
    embeddingModel?: import('../integrations/embedingmodel').EmbeddingModel;
    customFolderColorsMap: Map<string, FolderStyle>;
    syncCustomFolderColorsMap(): void;
    isSyncingDividers: boolean;
    isDragging: boolean;
    _dividerTimeout?: number | null;
    saveSettings(): Promise<void>;
    registerCustomIcons(): void;
    cleanUnusedStyles(): Promise<void>;
    refreshRibbon(): void;
    localFileSystemIcons?: Record<string, string | null>;
    dividerManager: {
        syncDividers(): void;
        clean(): void;
        hasAnyDividers(): boolean;
    };
    styleGenerator: { generateCss(): Promise<string> };
    domObserverService: DOMObserverService;
    getAllExplorerContainers(): HTMLElement[];
    invalidateExplorerContainersCache(): void;
    getOpenDocuments(): Document[];
    getStyle(path: string): FolderStyle | null;
    getActivePalette(isDark?: boolean): { rgb: string; hex: string }[];
    processDividers(): void;
    generateStyles(): Promise<void>;
    autoDownloadPack(url: string, prefix: string): Promise<number>;
    initStaircaseStyleStripper(): void;
    generateStylesDebounced: Debouncer<[], void>;
    refreshIconsDebounced?: Debouncer<[], void>;

    registerEvent(event: EventRef): void;
    cachedDocuments: Set<Document>;
    _abortStartupRender: boolean;
    _isUnloading?: boolean;
}

declare global {
    interface HTMLElement {
        setCssStyles(styles: Partial<CSSStyleDeclaration> | Record<string, string | number>): void;
    }
}

export interface StyleContext {
    currentPalette: { rgb: string, hex: string }[];
    isDark: boolean;
    brightnessAmount: number;
    heatmapData: Map<string, number>;
    excludeFolders: Set<string>;
    effFileIconW: string;
    folderIconW: string;
    nnIconW: string;
    now: number;
}
export interface MenuItemWithSubmenu extends MenuItem {
    setSubmenu(): Menu;
}
