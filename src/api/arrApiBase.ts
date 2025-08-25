import type { ArrApp, QualityProfile, RootFolder, SystemStatus } from './types';

export abstract class ArrApiBase {
  protected app: ArrApp;

  constructor(app: ArrApp) {
    this.app = app;
  }

  protected async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.app.url}/api/v3${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Api-Key': this.app.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<SystemStatus> {
    return this.request('/system/status');
  }

  async getQualityProfiles(): Promise<QualityProfile[]> {
    return this.request('/qualityProfile');
  }

  async getRootFolders(): Promise<RootFolder[]> {
    return this.request('/rootfolder');
  }
}

export default ArrApiBase;
