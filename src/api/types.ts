export type ArrAppType = 'sonarr' | 'radarr';

export interface ArrApp {
  id: string;
  name: string;
  type: ArrAppType;
  url: string;
  icon: string;
}

export interface ArrAppWithKey extends ArrApp {
  apiKey: string;
}

type SearchResultBase = {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  ratings?: {
    votes?: number;
    value: number;
    imdb?: {
      value: number;
    };
    tmdb?: {
      value: number;
    };
  };
  genres?: string[];
  status?: string;
  network?: string;
  language?: string;
  originalLanguage?: {
    id: number;
    name: string;
  };
  remotePoster?: string;
};

export type SeriesResult = SearchResultBase & {
  kind: 'series';
  tvdbId: number;
  seriesType?: string;
};

export type MovieResult = SearchResultBase & {
  kind: 'movie';
  tmdbId: number;
  imdbId?: string;
};

export type SearchResult = SeriesResult | MovieResult;

export type SearchFilters = {
  year?: number | null;
  genres?: string[];
  network?: string | null;
  language?: string | null;
};

export interface QualityProfile {
  id: number;
  name: string;
}

export interface RootFolder {
  id: number;
  path: string;
}

export interface AddSeriesRequest {
  title: string;
  qualityProfileId: number;
  rootFolderPath: string;
  tvdbId: number;
  monitored: boolean;
  seasonFolder: boolean;
  seriesType?: string;
  tags?: number[];
  searchForMissingEpisodes?: boolean;
  searchForCutoffUnmetEpisodes?: boolean;
}

export interface AddMovieRequest {
  title: string;
  qualityProfileId: number;
  rootFolderPath: string;
  tmdbId: number;
  monitored: boolean;
  tags?: number[];
  searchForMovie?: boolean;
}

export interface SystemStatus {
  version: string;
  branch: string;
  authentication: string;
}
