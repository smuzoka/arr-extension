import type { ArrApp, SearchResult, AddMovieRequest } from './types';
import ArrApiBase from './arrApiBase';

export class RadarrApi extends ArrApiBase {
  constructor(app: ArrApp) {
    super(app);
  }

  async searchMovies(term: string): Promise<SearchResult[]> {
    return this.request(`/movie/lookup?term=${encodeURIComponent(term)}`);
  }

  async getAllMovies(): Promise<SearchResult[]> {
    return this.request('/movie');
  }

  async addMovie(request: AddMovieRequest): Promise<SearchResult> {
    return this.request('/movie', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export default RadarrApi;
