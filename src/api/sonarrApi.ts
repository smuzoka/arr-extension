import type { ArrAppWithKey, SeriesResult, AddSeriesRequest } from './types';
import ArrApiBase from './arrApiBase';

export class SonarrApi extends ArrApiBase {
  constructor(app: ArrAppWithKey) {
    super(app);
  }

  async searchSeries(term: string): Promise<SeriesResult[]> {
    const results = await this.request(`/series/lookup?term=${encodeURIComponent(term)}`);
    return results.map((item: Omit<SeriesResult, 'kind'>) => ({ ...item, kind: 'series' }));
  }

  async getAllSeries(): Promise<SeriesResult[]> {
    const results = await this.request('/series');
    return results.map((item: Omit<SeriesResult, 'kind'>) => ({ ...item, kind: 'series' }));
  }

  async addSeries(request: AddSeriesRequest): Promise<SeriesResult> {
    const result = await this.request('/series', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return { ...result, kind: 'series' };
  }
}

export default SonarrApi;
