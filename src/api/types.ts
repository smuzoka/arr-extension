export interface ArrApp {
  id: string;
  name: string;
  type: 'sonarr' | 'radarr';
  url: string;
  apiKey: string;
  icon: string;
}

export interface SearchResult {
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
  // Sonarr specific
  tvdbId?: number;
  seriesType?: string;
  // Radarr specific
  tmdbId?: number;
  imdbId?: string;
  // Common
  remotePoster?: string;
}

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