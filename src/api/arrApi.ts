import type {
  AddMovieRequest,
  AddSeriesRequest,
  ArrAppWithKey,
  MovieResult,
  QualityProfile,
  RootFolder,
  SeriesResult,
  SystemStatus,
} from './types';

const REQUEST_TIMEOUT = 5000;

type SharedApi = {
  testConnection: () => Promise<SystemStatus>;
  getQualityProfiles: () => Promise<QualityProfile[]>;
  getRootFolders: () => Promise<RootFolder[]>;
};

export type SonarrApi = SharedApi & {
  searchSeries: (term: string) => Promise<SeriesResult[]>;
  getAllSeries: () => Promise<SeriesResult[]>;
  addSeries: (request: AddSeriesRequest) => Promise<SeriesResult>;
};

export type RadarrApi = SharedApi & {
  searchMovies: (term: string) => Promise<MovieResult[]>;
  getAllMovies: () => Promise<MovieResult[]>;
  addMovie: (request: AddMovieRequest) => Promise<MovieResult>;
};

export type ArrApi = SonarrApi | RadarrApi;

const addKind = <T extends object, TKind extends 'series' | 'movie'>(
  item: T,
  kind: TKind,
): T & { kind: TKind } => ({ ...item, kind });

const request = async <T>(
  app: ArrAppWithKey,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${app.url}/api/v3${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'X-Api-Key': app.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error('Invalid API key.');
    }

    if (!response.ok) {
      let message = 'Unable to connect. Check your URL.';
      try {
        const body = await response.json();
        if (Array.isArray(body) && body.length > 0) {
          const first = body[0] as {
            errorCode?: unknown;
            errorMessage?: unknown;
          };
          const code = typeof first?.errorCode === 'string' ? first.errorCode : '';
          const errorMessage =
            typeof first?.errorMessage === 'string' ? first.errorMessage : '';
          if (code.includes('ExistsValidator') || /already been added/i.test(errorMessage)) {
            message = 'Already exists.';
          } else if (errorMessage) {
            message = errorMessage;
          }
        } else if (body && typeof body === 'object') {
          const fallbackMessage = (body as { message?: unknown }).message;
          if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
            message = fallbackMessage;
          }
        }
      } catch {
        // ponytail: keep the generic message when error parsing fails.
      }
      throw new Error(message);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(`${app.type} returned invalid JSON.`);
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Unable to connect. Check your URL.');
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Server timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

const createSharedApi = (app: ArrAppWithKey): SharedApi => ({
  testConnection: () => request<SystemStatus>(app, '/system/status'),
  getQualityProfiles: () => request<QualityProfile[]>(app, '/qualityProfile'),
  getRootFolders: () => request<RootFolder[]>(app, '/rootfolder'),
});

export function createArrApi(app: ArrAppWithKey & { type: 'sonarr' }): SonarrApi;
export function createArrApi(app: ArrAppWithKey & { type: 'radarr' }): RadarrApi;
export function createArrApi(app: ArrAppWithKey): ArrApi {
  const shared = createSharedApi(app);

  if (app.type === 'sonarr') {
    return {
      ...shared,
      searchSeries: async (term: string) => {
        const results = await request<Omit<SeriesResult, 'kind'>[]>(
          app,
          `/series/lookup?term=${encodeURIComponent(term)}`,
        );
        return results.map((item) => addKind(item, 'series'));
      },
      getAllSeries: async () => {
        const results = await request<Omit<SeriesResult, 'kind'>[]>(app, '/series');
        return results.map((item) => addKind(item, 'series'));
      },
      addSeries: async (series: AddSeriesRequest) =>
        addKind(await request<Omit<SeriesResult, 'kind'>>(app, '/series', {
          method: 'POST',
          body: JSON.stringify(series),
        }), 'series'),
    };
  }

  return {
    ...shared,
    searchMovies: async (term: string) => {
      const results = await request<Omit<MovieResult, 'kind'>[]>(
        app,
        `/movie/lookup?term=${encodeURIComponent(term)}`,
      );
      return results.map((item) => addKind(item, 'movie'));
    },
    getAllMovies: async () => {
      const results = await request<Omit<MovieResult, 'kind'>[]>(app, '/movie');
      return results.map((item) => addKind(item, 'movie'));
    },
    addMovie: async (movie: AddMovieRequest) =>
      addKind(await request<Omit<MovieResult, 'kind'>>(app, '/movie', {
        method: 'POST',
        body: JSON.stringify(movie),
      }), 'movie'),
  };
}
