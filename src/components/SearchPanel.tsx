import React from 'react';
import type { ArrAppWithKey, SearchFilters, SearchResult } from '../api/types';
import SearchBar from './SearchBar';
import AppSwitcher from './AppSwitcher';
import ResultCard from './ResultCard';
import SearchFiltersComponent, { type SearchFilterOptions } from './SearchFilters';
import { SpinnerIcon, SyncIcon } from '../utils/icons';

interface SearchPanelProps {
  apps: ArrAppWithKey[];
  selectedApp: ArrAppWithKey | null;
  disabledAppIds: Set<string>;
  onSelectApp: (app: ArrAppWithKey) => void;
  query: string;
  onQueryChange: (value: string) => void;
  allResults: SearchResult[];
  filteredResults: SearchResult[];
  filters: SearchFilters;
  filterOptions: SearchFilterOptions;
  onFiltersChange: (filters: SearchFilters) => void;
  loading: boolean;
  error: string | null;
  existingItemsError: string | null;
  isSyncing: boolean;
  addedIds: Set<number>;
  onResultClick: (result: SearchResult) => void;
  onAddAppClick: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  apps,
  selectedApp,
  disabledAppIds,
  onSelectApp,
  query,
  onQueryChange,
  allResults,
  filteredResults,
  filters,
  filterOptions,
  onFiltersChange,
  loading,
  error,
  existingItemsError,
  isSyncing,
  addedIds,
  onResultClick,
  onAddAppClick,
}) => (
  <>
    {apps.length > 0 && (
      <AppSwitcher
        apps={apps}
        selectedApp={selectedApp}
        disabledAppIds={disabledAppIds}
        onAppSelect={onSelectApp}
      />
    )}

    {apps.length > 0 && !selectedApp && (
      <div className="message error">
        Finish setup in the setup tab to grant access to this app.
      </div>
    )}

    {isSyncing && (
      <div className="message info">
        <SyncIcon className="spin" />
        <span>Syncing library...</span>
      </div>
    )}

    {(error || existingItemsError) && (
      <div className="error">{error ?? existingItemsError}</div>
    )}

    <SearchBar
      value={query}
      onChange={onQueryChange}
      placeholder={selectedApp ? `Search ${selectedApp.name}...` : 'Select an app first'}
    />

    {allResults.length > 0 && (
      <SearchFiltersComponent
        filters={filters}
        options={filterOptions}
        onChange={onFiltersChange}
        totalCount={allResults.length}
        filteredCount={filteredResults.length}
      />
    )}

    {apps.length === 0 && (
      <div className="no-apps-message">
        <p>No *arr apps configured.</p>
        <button className="btn btn-primary" onClick={onAddAppClick}>
          Add App
        </button>
      </div>
    )}

    {loading && (
      <div className="loading-message">
        <SpinnerIcon className="spin" /> Searching...
      </div>
    )}

    {allResults.length > 0 && (
      <div className="search-results">
        {filteredResults.map((result) => {
          const normalizeExternalId = (value: unknown): number | undefined => {
            if (typeof value === 'number' && Number.isFinite(value)) {
              return value;
            }
            if (typeof value === 'string' && value.trim()) {
              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : undefined;
            }
            return undefined;
          };

          let externalId: number | undefined;
          if (selectedApp?.type === 'sonarr' && result.kind === 'series') {
            externalId = normalizeExternalId(result.tvdbId);
          } else if (selectedApp?.type === 'radarr' && result.kind === 'movie') {
            externalId = normalizeExternalId(result.tmdbId);
          }
          const isAdded = externalId ? addedIds.has(externalId) : false;

          return (
            <ResultCard
              key={result.id}
              result={result}
              isAdded={isAdded}
              onClick={() => onResultClick(result)}
            />
          );
        })}
      </div>
    )}

    {!loading && query && allResults.length === 0 && selectedApp && (
      <div className="no-results-message">
        No results found for &quot;{query}&quot;
      </div>
    )}
  </>
);

export default SearchPanel;
