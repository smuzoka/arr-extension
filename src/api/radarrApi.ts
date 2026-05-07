import type { ArrAppWithKey, MovieResult, AddMovieRequest } from './types';
import ArrApiBase from './arrApiBase';

export class RadarrApi extends ArrApiBase {
  constructor(app: ArrAppWithKey) {
    super(app);
  }

  async searchMovies(term: string): Promise<MovieResult[]> {
    const results = await this.request(`/movie/lookup?term=${encodeURIComponent(term)}`);
    return results.map((item: Omit<MovieResult, 'kind'>) => ({ ...item, kind: 'movie' }));
  }

  async getAllMovies(): Promise<MovieResult[]> {
    const results = await this.request('/movie');
    return results.map((item: Omit<MovieResult, 'kind'>) => ({ ...item, kind: 'movie' }));
  }

  async addMovie(request: AddMovieRequest): Promise<MovieResult> {
    const result = await this.request('/movie', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return { ...result, kind: 'movie' };
  }
}

export default RadarrApi;
