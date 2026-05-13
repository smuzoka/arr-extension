import React, { useState, useMemo, useCallback } from 'react';
import type { SearchResult } from '../api/types';
import { useSelectedApp, useSearch, useExistingItems, useTheme } from '../hooks';
import AddItemForm from './AddItemForm';
import SearchPanel from './SearchPanel';
import { type SearchFilterOptions } from './SearchFilters';
import { SettingsIcon, CloseIcon, MoonIcon, SunIcon } from '../utils/icons';
import { openSetupPage } from '../utils/openSetupPage';

type ViewState = 'search' | 'add';

const Popup: React.FC = () => {
  const { apps, selectedApp, permissionByAppId, selectApp, initialSearchTerm } = useSelectedApp();
  const { query, setQuery, results: filteredResults, allResults, filters, setFilters, loading, error } = useSearch(selectedApp);
  const { addedIds } = useExistingItems(selectedApp);
  const { theme, toggleTheme } = useTheme();

  // Load selected text from context menu into search
  React.useEffect(() => {
    if (initialSearchTerm && selectedApp) {
      setQuery(initialSearchTerm);
    }
  }, [initialSearchTerm, selectedApp, setQuery]);

  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const filterOptions = useMemo<SearchFilterOptions>(() => {
    const years = new Set<number>();
    const genres = new Set<string>();
    const networks = new Set<string>();
    const languages = new Set<string>();

    filteredResults.forEach(result => {
      if (result.year && result.year > 0) {
        years.add(result.year);
      }

      result.genres?.forEach(genre => {
        const normalized = genre?.trim();
        if (normalized) {
          genres.add(normalized);
        }
      });

      const network = result.network?.trim();
      if (network) {
        networks.add(network);
      }

      const language = (result.language ?? result.originalLanguage?.name)?.trim();
      if (language) {
        languages.add(language);
      }
    });

    return {
      years: Array.from(years).sort((a, b) => b - a),
      genres: Array.from(genres).sort((a, b) => a.localeCompare(b)),
      networks: Array.from(networks).sort((a, b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b))
    };
  }, [filteredResults]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    setViewState('add');
  }, []);

  const handleAddSuccess = useCallback(() => {
    setViewState('search');
    setSelectedResult(null);
  }, []);

  const handleBackToSearch = useCallback(() => {
    setViewState('search');
    setSelectedResult(null);
  }, []);

  const handleSettingsClick = useCallback(() => {
    void openSetupPage();
  }, []);

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <h1 className="popup-title">ArrExtension</h1>
        <div className="header-actions">
          {viewState === 'add' && (
            <button 
              className="back-btn"
              onClick={handleBackToSearch}
              title="Back to search results"
              aria-label="Back to search results"
            >
              <CloseIcon />
            </button>
          )}
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          {viewState === 'search' && (
            <button 
              className="settings-btn"
              onClick={handleSettingsClick}
              title="Settings"
              aria-label="Open settings"
            >
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewState === 'search' && (
        <SearchPanel
          apps={apps}
          selectedApp={selectedApp}
          disabledAppIds={new Set(
            apps.filter((app) => !permissionByAppId[app.id]).map((app) => app.id),
          )}
          onSelectApp={selectApp}
          query={query}
          onQueryChange={setQuery}
          allResults={allResults}
          filteredResults={filteredResults}
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
          loading={loading}
          error={error}
          addedIds={addedIds}
          onResultClick={handleResultClick}
          onAddAppClick={() => void openSetupPage('?action=add')}
        />
      )}

      {/* Add Item Form */}
      {viewState === 'add' && selectedResult && selectedApp && (
        <AddItemForm
          app={selectedApp}
          result={selectedResult}
          onSuccess={handleAddSuccess}
          onCancel={handleBackToSearch}
        />
      )}

    </div>
  );
};

export default Popup; 