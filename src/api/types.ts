export interface ArrApp {
  id: string;
  name: string;
  type: 'sonarr' | 'radarr';
  url: string;
  apiKey: string;
}

export interface SearchResult {
  id: string;
  title: string;
  year?: number;
  overview?: string;
  images: SearchResultImage[];
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  status?: string;
  isAdded?: boolean;
}

export interface SearchResultImage {
  coverType: string;
  url: string;
  remoteUrl?: string;
}

export interface QualityProfile {
  id: number;
  name: string;
}

export interface RootFolder {
  id: number;
  path: string;
  freeSpace: number;
}

export interface AddItemRequest {
  title: string;
  qualityProfileId: number;
  rootFolderPath: string;
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  monitored: boolean;
  searchForMovie?: boolean;
  searchForMissingEpisodes?: boolean;
  tags?: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  authentication: string;
} 