import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from '../../common/types';
import { ColorfulFoldersSettingTab } from '../SettingTab';

export abstract class SettingSection {
    constructor(
        protected app: obsidian.App,
        protected plugin: IColorfulFoldersPlugin,
        protected settingTab: ColorfulFoldersSettingTab
    ) {}

    abstract render(containerEl: HTMLElement): void;
}
