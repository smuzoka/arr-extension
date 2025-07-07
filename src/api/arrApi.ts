import type { 
  ArrApp, 
  SearchResult, 
  QualityProfile, 
  RootFolder, 
  AddSeriesRequest, 
  AddMovieRequest,
  SystemStatus 
} from './types';

export class ArrApi {
  private app: ArrApp;

  constructor(app: ArrApp) {
    this.app = app;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
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

  async searchSeries(term: string): Promise<SearchResult[]> {
    if (this.app.type !== 'sonarr') {
      throw new Error('This method is only available for Sonarr');
    }
    return this.request(`/series/lookup?term=${encodeURIComponent(term)}`);
  }

  async searchMovies(term: string): Promise<SearchResult[]> {
    if (this.app.type !== 'radarr') {
      throw new Error('This method is only available for Radarr');
    }
    return this.request(`/movie/lookup?term=${encodeURIComponent(term)}`);
  }

  async getAllSeries(): Promise<SearchResult[]> {
    if (this.app.type !== 'sonarr') {
      throw new Error('This method is only available for Sonarr');
    }
    return this.request('/series');
  }

  async getAllMovies(): Promise<SearchResult[]> {
    if (this.app.type !== 'radarr') {
      throw new Error('This method is only available for Radarr');
    }
    return this.request('/movie');
  }

  async getQualityProfiles(): Promise<QualityProfile[]> {
    return this.request('/qualityProfile');
  }

  async getRootFolders(): Promise<RootFolder[]> {
    return this.request('/rootfolder');
  }

  async addSeries(request: AddSeriesRequest): Promise<SearchResult> {
    if (this.app.type !== 'sonarr') {
      throw new Error('This method is only available for Sonarr');
    }
    return this.request('/series', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async addMovie(request: AddMovieRequest): Promise<SearchResult> {
    if (this.app.type !== 'radarr') {
      throw new Error('This method is only available for Radarr');
    }
    return this.request('/movie', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const createArrApi = (app: ArrApp) => new ArrApi(app); 