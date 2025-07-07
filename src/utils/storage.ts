import type { ArrApp } from '../api/types';

// Interface for saved form options
export interface SavedFormOptions {
  qualityProfileId?: number;
  rootFolderPath?: string;
  monitored?: boolean;
  seasonFolder?: boolean;
  seriesType?: string;
  searchForMissing?: boolean;
  searchForCutoff?: boolean;
}

const STORAGE_KEYS = {
  ARR_APPS: 'arr_apps',
  SELECTED_TEXT: 'selected_text',
  LAST_USED_OPTIONS: 'last_used_options',
} as const;

export const storage = {
  async getArrApps(): Promise<ArrApp[]> {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.ARR_APPS]);
    return result[STORAGE_KEYS.ARR_APPS] || [];
  },

  async saveArrApps(apps: ArrApp[]): Promise<void> {
    await chrome.storage.sync.set({ [STORAGE_KEYS.ARR_APPS]: apps });
  },

  async addArrApp(app: ArrApp): Promise<void> {
    const apps = await this.getArrApps();
    apps.push(app);
    await this.saveArrApps(apps);
  },

  async removeArrApp(appId: string): Promise<void> {
    const apps = await this.getArrApps();
    const filteredApps = apps.filter(app => app.id !== appId);
    await this.saveArrApps(filteredApps);
  },

  async updateArrApp(appId: string, updatedApp: Partial<ArrApp>): Promise<void> {
    const apps = await this.getArrApps();
    const index = apps.findIndex(app => app.id === appId);
    if (index !== -1) {
      apps[index] = { ...apps[index], ...updatedApp };
      await this.saveArrApps(apps);
    }
  },

  async setSelectedText(text: string): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SELECTED_TEXT]: text });
  },

  async getSelectedText(): Promise<string | null> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SELECTED_TEXT]);
    return result[STORAGE_KEYS.SELECTED_TEXT] || null;
  },

  async clearSelectedText(): Promise<void> {
    await chrome.storage.local.remove([STORAGE_KEYS.SELECTED_TEXT]);
  },

  async saveLastUsedOptions(appType: string, options: SavedFormOptions): Promise<void> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.LAST_USED_OPTIONS]);
    const allOptions = result[STORAGE_KEYS.LAST_USED_OPTIONS] || {};
    allOptions[appType] = options;
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_USED_OPTIONS]: allOptions });
  },

  async getLastUsedOptions(appType: string): Promise<SavedFormOptions | null> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.LAST_USED_OPTIONS]);
    const allOptions = result[STORAGE_KEYS.LAST_USED_OPTIONS] || {};
    return allOptions[appType] || null;
  }
}; 