import type { ArrApp, SearchResult, AddSeriesRequest } from './types';
import ArrApiBase from './arrApiBase';

export class SonarrApi extends ArrApiBase {
  constructor(app: ArrApp) {
    super(app);
  }

  async searchSeries(term: string): Promise<SearchResult[]> {
    return this.request(`/series/lookup?term=${encodeURIComponent(term)}`);
  }

  async getAllSeries(): Promise<SearchResult[]> {
    return this.request('/series');
  }

  async addSeries(request: AddSeriesRequest): Promise<SearchResult> {
    return this.request('/series', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export default SonarrApi;
