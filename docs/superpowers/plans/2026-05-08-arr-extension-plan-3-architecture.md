# Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose popup into focused hooks and panels, clean up types, and remove unused Readarr/Lidarr APIs.

**Architecture:** Convert search results into discriminated unions, and build a coordinator-style popup that wires hooks to panels: settings, search, and existing items.

**Tech Stack:** React, TypeScript, WXT.

---
### Task 1: Update types and remove unused APIs
**Files:**
- Modify: [src/api/types.ts](src/api/types.ts)
- Modify: [src/api/arrApiBase.ts](src/api/arrApiBase.ts)
- Modify: [src/api/arrApi.ts](src/api/arrApi.ts)
- Modify: [src/api/sonarrApi.ts](src/api/sonarrApi.ts)
- Modify: [src/api/radarrApi.ts](src/api/radarrApi.ts)
- Delete: src/api/readarrApi.ts
- Delete: src/api/lidarrApi.ts

- [ ] **Step 1: Convert search results to discriminated unions**
```ts
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
    imdb?: { value: number };
    tmdb?: { value: number };
  };
  genres?: string[];
  status?: string;
  network?: string;
  language?: string;
  originalLanguage?: { id: number; name: string };
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
```

- [ ] **Step 2: Update API base and adapters to use new types**
```ts
import type { ArrAppWithKey, QualityProfile, RootFolder, SystemStatus } from './types';

export abstract class ArrApiBase {
  protected app: ArrAppWithKey;
  private readonly REQUEST_TIMEOUT = 5000;

  constructor(app: ArrAppWithKey) {
    this.app = app;
  }
  // request method stays the same for now
}
```

```ts
import type { ArrAppWithKey } from './types';
import ArrApiBase from './arrApiBase';
import { SonarrApi } from './sonarrApi';
import { RadarrApi } from './radarrApi';

export function createArrApi(app: ArrAppWithKey & { type: 'sonarr' }): SonarrApi;
export function createArrApi(app: ArrAppWithKey & { type: 'radarr' }): RadarrApi;
export function createArrApi(app: ArrAppWithKey): ArrApiBase {
  switch (app.type) {
    case 'sonarr':
      return new SonarrApi(app);
    case 'radarr':
      return new RadarrApi(app);
  }
}
```

```ts
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
```

```ts
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
```

- [ ] **Step 3: Remove unused Readarr/Lidarr files**
Run:
```bash
git rm src/api/readarrApi.ts src/api/lidarrApi.ts
```
Expected: files are staged for deletion.

- [ ] **Step 4: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 5: Commit**
```bash
git add src/api/types.ts src/api/arrApiBase.ts src/api/arrApi.ts src/api/sonarrApi.ts src/api/radarrApi.ts
git commit -m "refactor: add discriminated search results and drop readarr lidarr"
```

### Task 2: Add core hooks and selected app persistence
**Files:**
- Modify: [src/utils/storage.ts](src/utils/storage.ts)
- Create: src/hooks/useSelectedApp.ts
- Create: src/hooks/useSearch.ts
- Create: src/hooks/useExistingItems.ts
- Create: src/hooks/useTheme.ts

- [ ] **Step 1: Persist selected app id in storage**
```ts
const STORAGE_KEYS = {
  ARR_APPS: 'arr_apps',
  ARR_API_KEYS: 'arr_api_keys',
  SELECTED_TEXT: 'selected_text',
  SELECTED_APP_ID: 'selected_app_id',
  LAST_USED_OPTIONS: 'last_used_options',
  ARR_METADATA: 'arr_metadata',
} as const;

async getSelectedAppId(): Promise<string | null> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.SELECTED_APP_ID]);
  return result[STORAGE_KEYS.SELECTED_APP_ID] || null;
},

async setSelectedAppId(appId: string | null): Promise<void> {
  if (appId) {
    await chrome.storage.local.set({ [STORAGE_KEYS.SELECTED_APP_ID]: appId });
  } else {
    await chrome.storage.local.remove([STORAGE_KEYS.SELECTED_APP_ID]);
  }
},
```

- [ ] **Step 2: Create useSelectedApp hook**
```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import type { ArrAppWithKey } from '../api/types';
import { getOrigin } from '../utils/validators';

type PermissionState = {
  hasPermission: boolean;
  error: string | null;
};

export const useSelectedApp = () => {
  const [apps, setApps] = useState<ArrAppWithKey[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    hasPermission: true,
    error: null
  });

  useEffect(() => {
    const load = async () => {
      const savedApps = await storage.getArrApps();
      setApps(savedApps);

      const persistedId = await storage.getSelectedAppId();
      const initialId = persistedId && savedApps.some(app => app.id === persistedId)
        ? persistedId
        : savedApps[0]?.id ?? null;

      setSelectedAppId(initialId);
      await storage.setSelectedAppId(initialId);
    };

    load();
  }, []);

  const selectedApp = useMemo(
    () => apps.find(app => app.id === selectedAppId) || null,
    [apps, selectedAppId]
  );

  const ensurePermission = useCallback(async (app: ArrAppWithKey | null) => {
    if (!app) return true;
    const origin = getOrigin(app.url);
    if (!origin) return false;

    const hasPermission = await chrome.permissions.contains({
      origins: [`${origin}/*`]
    });

    if (!hasPermission) {
      setPermissionState({
        hasPermission: false,
        error: 'Host permission not granted for this server.'
      });
      return false;
    }

    setPermissionState({ hasPermission: true, error: null });
    return true;
  }, []);

  const selectApp = useCallback(async (app: ArrAppWithKey) => {
    const allowed = await ensurePermission(app);
    if (!allowed) return;
    setSelectedAppId(app.id);
    await storage.setSelectedAppId(app.id);
  }, [ensurePermission]);

  const saveApps = useCallback(async (nextApps: ArrAppWithKey[]) => {
    setApps(nextApps);
    await storage.saveArrApps(nextApps);
  }, []);

  return {
    apps,
    selectedApp,
    permissionState,
    selectApp,
    saveApps,
    setApps
  };
};
```

- [ ] **Step 3: Create useSearch hook (debounce only for now)**
```ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey, SearchFilters, SearchResult } from '../api/types';
import type { SearchFilterOptions } from '../components/SearchFilters';

const DEFAULT_FILTERS: SearchFilters = {
  year: null,
  genres: [],
  network: null,
  language: null
};

export const useSearch = (app: ArrAppWithKey | null) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchIdRef = useRef(0);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!app || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const currentSearchId = ++searchIdRef.current;
      setLoading(true);
      setError(null);
      setFilters(DEFAULT_FILTERS);

      try {
        const api = createArrApi(app);
        const nextResults = app.type === 'sonarr'
          ? await api.searchSeries(query)
          : await api.searchMovies(query);

        if (currentSearchId === searchIdRef.current) {
          setResults(nextResults);
        }
      } catch (err) {
        if (currentSearchId === searchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Search failed');
        }
      } finally {
        if (currentSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [app, query]);

  const filteredResults = useMemo(() => {
    if (results.length === 0) return [];
    const hasFilters = Boolean(
      filters.year ||
      filters.network ||
      filters.language ||
      (filters.genres && filters.genres.length > 0)
    );
    if (!hasFilters) return results;

    const yearFilter = filters.year ?? null;
    const networkFilter = filters.network?.trim().toLowerCase();
    const languageFilter = filters.language?.trim().toLowerCase();
    const selectedGenres = (filters.genres ?? [])
      .map(genre => genre.trim().toLowerCase())
      .filter(Boolean);

    return results.filter(result => {
      if (yearFilter && result.year !== yearFilter) return false;
      if (networkFilter) {
        const network = result.network?.trim().toLowerCase();
        if (!network || network !== networkFilter) return false;
      }
      if (languageFilter) {
        const language = (result.language ?? result.originalLanguage?.name)
          ?.trim()
          .toLowerCase();
        if (!language || language !== languageFilter) return false;
      }
      if (selectedGenres.length > 0) {
        const resultGenres = (result.genres ?? [])
          .map(genre => genre.trim().toLowerCase())
          .filter(Boolean);
        const matchesGenre = selectedGenres.some(genre => resultGenres.includes(genre));
        if (!matchesGenre) return false;
      }
      return true;
    });
  }, [filters, results]);

  const filterOptions = useMemo<SearchFilterOptions>(() => {
    const years = new Set<number>();
    const genres = new Set<string>();
    const networks = new Set<string>();
    const languages = new Set<string>();

    filteredResults.forEach(result => {
      if (result.year && result.year > 0) years.add(result.year);
      result.genres?.forEach(genre => {
        const normalized = genre?.trim();
        if (normalized) genres.add(normalized);
      });
      const network = result.network?.trim();
      if (network) networks.add(network);
      const language = (result.language ?? result.originalLanguage?.name)?.trim();
      if (language) languages.add(language);
    });

    return {
      years: Array.from(years).sort((a, b) => b - a),
      genres: Array.from(genres).sort((a, b) => a.localeCompare(b)),
      networks: Array.from(networks).sort((a, b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b))
    };
  }, [filteredResults]);

  return {
    query,
    setQuery,
    results,
    filters,
    setFilters,
    filteredResults,
    filterOptions,
    loading,
    error
  };
};
```

- [ ] **Step 4: Create useExistingItems hook**
```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey, SearchResult } from '../api/types';

const getExternalId = (appType: ArrAppWithKey['type'], item: SearchResult): number | null => {
  if (appType === 'sonarr') {
    return item.kind === 'series' ? item.tvdbId : null;
  }
  return item.kind === 'movie' ? item.tmdbId : null;
};

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!app) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const api = createArrApi(app);
      const nextItems = app.type === 'sonarr'
        ? await api.getAllSeries()
        : await api.getAllMovies();

      setItems(nextItems);
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const existingIds = useMemo(() => {
    if (!app) return new Set<number>();
    const ids = new Set<number>();
    items.forEach(item => {
      const externalId = getExternalId(app.type, item);
      if (externalId) ids.add(externalId);
    });
    return ids;
  }, [app, items]);

  return {
    items,
    existingIds,
    loading,
    refresh
  };
};
```

- [ ] **Step 5: Create useTheme hook**
```ts
import { useCallback, useEffect, useState } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme, setTheme };
};
```

- [ ] **Step 6: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 7: Commit**
```bash
git add src/utils/storage.ts src/hooks/useSelectedApp.ts src/hooks/useSearch.ts src/hooks/useExistingItems.ts src/hooks/useTheme.ts
git commit -m "refactor: add popup hooks and selected app persistence"
```

### Task 3: Add panels and wire the popup coordinator
**Files:**
- Create: src/components/AppSettingsPanel.tsx
- Create: src/components/SearchPanel.tsx
- Create: src/components/ExistingItemsPanel.tsx
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)

- [ ] **Step 1: Create AppSettingsPanel**
```tsx
import React, { useState } from 'react';
import type { ArrAppWithKey } from '../api/types';
import AppForm from './AppForm';
import { getAppIcon } from '../utils/icons';

interface AppSettingsPanelProps {
  apps: ArrAppWithKey[];
  onSubmit: (app: Omit<ArrAppWithKey, 'id'>, existingId?: string) => void;
  onDelete: (appId: string) => void;
  onTestConnection: (app: ArrAppWithKey) => void;
}

const AppSettingsPanel: React.FC<AppSettingsPanelProps> = ({
  apps,
  onSubmit,
  onDelete,
  onTestConnection
}) => {
  const [editingApp, setEditingApp] = useState<ArrAppWithKey | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    setEditingApp(null);
    setShowForm(true);
  };

  const handleEdit = (app: ArrAppWithKey) => {
    setEditingApp(app);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingApp(null);
    setShowForm(false);
  };

  const handleSubmit = (app: Omit<ArrAppWithKey, 'id'>) => {
    onSubmit(app, editingApp?.id);
    setEditingApp(null);
    setShowForm(false);
  };

  return (
    <div className="settings-view">
      {showForm ? (
        <AppForm app={editingApp} onSubmit={handleSubmit} onCancel={handleCancel} />
      ) : (
        <>
          <div className="add-app-section">
            <button className="btn btn-primary" onClick={handleAdd}>
              <i className="fas fa-plus"></i> Add New App
            </button>
          </div>

          {apps.length === 0 ? (
            <div className="no-apps-message">
              <p>No *arr apps configured.</p>
              <p>Add your first app to get started.</p>
            </div>
          ) : (
            <div className="app-list">
              {apps.map(app => (
                <div key={app.id} className="app-item">
                  <div className="app-info">
                    <div className="app-icon">{getAppIcon(app.type)}</div>
                    <div className="app-details">
                      <div className="app-name">{app.name}</div>
                      <div className="app-url">{app.url}</div>
                      <div className="app-type">{app.type}</div>
                    </div>
                  </div>
                  <div className="app-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onTestConnection(app)}
                      title="Test connection"
                    >
                      Test
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(app)}
                      title="Edit app"
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(app.id)}
                      title="Delete app"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppSettingsPanel;
```

- [ ] **Step 2: Create ExistingItemsPanel**
```tsx
import React from 'react';
import type { SearchResult } from '../api/types';

interface ExistingItemsPanelProps {
  items: SearchResult[];
  loading: boolean;
  onRemove: (item: SearchResult) => void;
}

const ExistingItemsPanel: React.FC<ExistingItemsPanelProps> = ({
  items,
  loading,
  onRemove
}) => {
  if (loading) {
    return <div className="loading-message">Loading library items...</div>;
  }

  if (items.length === 0) {
    return <div className="no-results-message">No existing items found.</div>;
  }

  return (
    <div className="existing-items">
      {items.map(item => (
        <div key={`${item.kind}-${item.id}`} className="existing-item">
          <div className="existing-item-title">{item.title}</div>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onRemove(item)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

export default ExistingItemsPanel;
```

- [ ] **Step 3: Create SearchPanel**
```tsx
import React from 'react';
import type { ArrAppWithKey, SearchFilters, SearchResult } from '../api/types';
import SearchBar from './SearchBar';
import AppSwitcher from './AppSwitcher';
import ResultCard from './ResultCard';
import SearchFiltersComponent, { type SearchFilterOptions } from './SearchFilters';

interface SearchPanelProps {
  apps: ArrAppWithKey[];
  selectedApp: ArrAppWithKey | null;
  onSelectApp: (app: ArrAppWithKey) => void;
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  filteredResults: SearchResult[];
  filters: SearchFilters;
  filterOptions: SearchFilterOptions;
  onFiltersChange: (filters: SearchFilters) => void;
  loading: boolean;
  error: string | null;
  addedIds: Set<number>;
  onResultClick: (result: SearchResult) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  apps,
  selectedApp,
  onSelectApp,
  query,
  onQueryChange,
  results,
  filteredResults,
  filters,
  filterOptions,
  onFiltersChange,
  loading,
  error,
  addedIds,
  onResultClick
}) => (
  <>
    {apps.length > 0 && (
      <AppSwitcher apps={apps} selectedApp={selectedApp} onAppSelect={onSelectApp} />
    )}

    <SearchBar
      value={query}
      onChange={onQueryChange}
      placeholder={selectedApp ? `Search ${selectedApp.name}...` : 'Select an app first'}
    />

    {results.length > 0 && (
      <SearchFiltersComponent
        filters={filters}
        options={filterOptions}
        onChange={onFiltersChange}
        totalCount={results.length}
        filteredCount={filteredResults.length}
      />
    )}

    {apps.length === 0 && (
      <div className="no-apps-message">
        <p>No *arr apps configured.</p>
      </div>
    )}

    {error && <div className="error">{error}</div>}

    {loading && (
      <div className="loading-message">
        <i className="fas fa-spinner fa-spin"></i> Searching...
      </div>
    )}

    {results.length > 0 && (
      <div className="search-results">
        {filteredResults.map(result => {
          const externalId = result.kind === 'series' ? result.tvdbId : result.tmdbId;
          const isAdded = externalId ? addedIds.has(externalId) : false;

          return (
            <ResultCard
              key={`${result.kind}-${result.id}`}
              result={result}
              isAdded={isAdded}
              onClick={() => onResultClick(result)}
            />
          );
        })}
      </div>
    )}

    {!loading && query && results.length === 0 && selectedApp && (
      <div className="no-results-message">No results found for "{query}"</div>
    )}
  </>
);

export default SearchPanel;
```

- [ ] **Step 4: Rewrite Popup as coordinator**
```tsx
import React, { useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey, SearchResult } from '../api/types';
import AddItemForm from './AddItemForm';
import AppSettingsPanel from './AppSettingsPanel';
import ExistingItemsPanel from './ExistingItemsPanel';
import SearchPanel from './SearchPanel';
import { useExistingItems } from '../hooks/useExistingItems';
import { useSearch } from '../hooks/useSearch';
import { useSelectedApp } from '../hooks/useSelectedApp';
import { useTheme } from '../hooks/useTheme';
import { CloseIcon, MoonIcon, SettingsIcon, SunIcon } from '../utils/icons';

type ViewState = 'search' | 'add' | 'settings';

const Popup: React.FC = () => {
  const { apps, selectedApp, permissionState, selectApp, saveApps } = useSelectedApp();
  const { theme, toggleTheme } = useTheme();
  const { query, setQuery, results, filteredResults, filters, setFilters, filterOptions, loading, error } =
    useSearch(selectedApp);
  const { items: existingItems, existingIds, loading: existingLoading, refresh } = useExistingItems(selectedApp);

  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setViewState('add');
  };

  const handleAddSuccess = async () => {
    await refresh();
    setViewState('search');
    setSelectedResult(null);
  };

  const handleDeleteApp = async (appId: string) => {
    const remaining = apps.filter(app => app.id !== appId);
    await saveApps(remaining);
    showMessage('success', 'App deleted successfully');
  };

  const handleSubmitApp = async (appData: Omit<ArrAppWithKey, 'id'>, existingId?: string) => {
    if (existingId) {
      const nextApps = apps.map(app =>
        app.id === existingId ? { ...appData, id: existingId } : app
      );
      await saveApps(nextApps);
      showMessage('success', 'App updated successfully');
      return;
    }

    const newApp: ArrAppWithKey = { ...appData, id: Date.now().toString() };
    await saveApps([...apps, newApp]);
    showMessage('success', 'App added successfully');
  };

  const handleTestConnection = async (app: ArrAppWithKey) => {
    try {
      const api = createArrApi(app);
      await api.testConnection();
      showMessage('success', `Connection to ${app.name} successful`);
    } catch (err) {
      showMessage('error', `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveExisting = async (item: SearchResult) => {
    if (!selectedApp) return;
    const api = createArrApi(selectedApp);
    if (selectedApp.type === 'sonarr' && item.kind === 'series') {
      await api.request(`/series/${item.id}`, { method: 'DELETE' });
    }
    if (selectedApp.type === 'radarr' && item.kind === 'movie') {
      await api.request(`/movie/${item.id}`, { method: 'DELETE' });
    }
    await refresh();
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">ArrExtension</h1>
        <div className="header-actions">
          {(viewState === 'settings' || viewState === 'add') && (
            <button className="back-btn" onClick={() => setViewState('search')}>
              <CloseIcon />
            </button>
          )}
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          {viewState === 'search' && (
            <button className="settings-btn" onClick={() => setViewState('settings')}>
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}
      {!permissionState.hasPermission && permissionState.error && (
        <div className="error">{permissionState.error}</div>
      )}

      {viewState === 'search' && (
        <>
          <SearchPanel
            apps={apps}
            selectedApp={selectedApp}
            onSelectApp={selectApp}
            query={query}
            onQueryChange={setQuery}
            results={results}
            filteredResults={filteredResults}
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={setFilters}
            loading={loading}
            error={error}
            addedIds={existingIds}
            onResultClick={handleResultClick}
          />

          {selectedApp && (
            <ExistingItemsPanel
              items={existingItems}
              loading={existingLoading}
              onRemove={handleRemoveExisting}
            />
          )}
        </>
      )}

      {viewState === 'add' && selectedResult && selectedApp && (
        <AddItemForm
          app={selectedApp}
          result={selectedResult}
          onSuccess={handleAddSuccess}
          onCancel={() => setViewState('search')}
        />
      )}

      {viewState === 'settings' && (
        <AppSettingsPanel
          apps={apps}
          onSubmit={handleSubmitApp}
          onDelete={handleDeleteApp}
          onTestConnection={handleTestConnection}
        />
      )}
    </div>
  );
};

export default Popup;
```

- [ ] **Step 5: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 6: Commit**
```bash
git add src/components/Popup.tsx src/components/AppSettingsPanel.tsx src/components/SearchPanel.tsx src/components/ExistingItemsPanel.tsx
git commit -m "refactor: split popup into panels with hooks"
```
