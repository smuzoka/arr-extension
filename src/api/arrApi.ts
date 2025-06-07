import type { 
  ArrApp, 
  SearchResult, 
  QualityProfile, 
  RootFolder, 
  AddItemRequest, 
  ApiResponse, 
  SystemStatus 
} from './types';

class ArrApiService {
  private async makeRequest<T>(
    url: string, 
    apiKey: string, 
    method: 'GET' | 'POST' = 'GET', 
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async testConnection(app: ArrApp): Promise<ApiResponse<SystemStatus>> {
    const url = `${app.url}/api/v3/system/status`;
    return this.makeRequest<SystemStatus>(url, app.apiKey);
  }

  async searchContent(app: ArrApp, searchTerm: string): Promise<ApiResponse<SearchResult[]>> {
    const endpoint = app.type === 'sonarr' ? 'series' : 'movie';
    const url = `${app.url}/api/v3/${endpoint}/lookup?term=${encodeURIComponent(searchTerm)}`;
    return this.makeRequest<SearchResult[]>(url, app.apiKey);
  }

  async getExistingContent(app: ArrApp): Promise<ApiResponse<SearchResult[]>> {
    const endpoint = app.type === 'sonarr' ? 'series' : 'movie';
    const url = `${app.url}/api/v3/${endpoint}`;
    return this.makeRequest<SearchResult[]>(url, app.apiKey);
  }

  async getQualityProfiles(app: ArrApp): Promise<ApiResponse<QualityProfile[]>> {
    const url = `${app.url}/api/v3/qualityProfile`;
    return this.makeRequest<QualityProfile[]>(url, app.apiKey);
  }

  async getRootFolders(app: ArrApp): Promise<ApiResponse<RootFolder[]>> {
    const url = `${app.url}/api/v3/rootfolder`;
    return this.makeRequest<RootFolder[]>(url, app.apiKey);
  }

  async addContent(app: ArrApp, item: AddItemRequest): Promise<ApiResponse<any>> {
    const endpoint = app.type === 'sonarr' ? 'series' : 'movie';
    const url = `${app.url}/api/v3/${endpoint}`;
    return this.makeRequest(url, app.apiKey, 'POST', item);
  }

  async checkIfAdded(app: ArrApp, searchResults: SearchResult[]): Promise<SearchResult[]> {
    const existingResponse = await this.getExistingContent(app);
    
    if (!existingResponse.success || !existingResponse.data) {
      return searchResults;
    }

    const existing = existingResponse.data;
    
    return searchResults.map(result => ({
      ...result,
      isAdded: existing.some(item => {
        if (app.type === 'sonarr') {
          return item.tvdbId === result.tvdbId;
        } else {
          return item.tmdbId === result.tmdbId;
        }
      })
    }));
  }
}

export const arrApi = new ArrApiService(); 