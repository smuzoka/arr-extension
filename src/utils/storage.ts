import type { ArrApp } from '../api/types';

export const storage = {
  async getApps(): Promise<ArrApp[]> {
    const result = await chrome.storage.sync.get(['apps']);
    return result.apps || [];
  },

  async saveApps(apps: ArrApp[]): Promise<void> {
    await chrome.storage.sync.set({ apps });
  },

  async addApp(app: ArrApp): Promise<void> {
    const apps = await this.getApps();
    apps.push(app);
    await this.saveApps(apps);
  },

  async updateApp(appId: string, updatedApp: ArrApp): Promise<void> {
    const apps = await this.getApps();
    const index = apps.findIndex(app => app.id === appId);
    if (index !== -1) {
      apps[index] = updatedApp;
      await this.saveApps(apps);
    }
  },

  async removeApp(appId: string): Promise<void> {
    const apps = await this.getApps();
    const filteredApps = apps.filter(app => app.id !== appId);
    await this.saveApps(filteredApps);
  },

  async getSearchTerm(): Promise<string> {
    const result = await chrome.storage.local.get(['searchTerm']);
    return result.searchTerm || '';
  },

  async setSearchTerm(searchTerm: string): Promise<void> {
    await chrome.storage.local.set({ searchTerm });
  }
}; 