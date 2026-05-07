import React, { useState, useMemo, useCallback } from 'react';
import { storage } from '../utils/storage';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey, SearchResult } from '../api/types';
import { useSelectedApp, useSearch, useExistingItems, useTheme } from '../hooks';
import SearchBar from './SearchBar';
import AppSwitcher from './AppSwitcher';
import ResultCard from './ResultCard';
import AddItemForm from './AddItemForm';
import AppForm from './AppForm';
import SearchFiltersComponent, { type SearchFilterOptions } from './SearchFilters';
import { getAppIcon, SettingsIcon, CloseIcon, MoonIcon, SunIcon } from '../utils/icons';

type ViewState = 'search' | 'add' | 'settings';

const Popup: React.FC = () => {
  const { apps, selectedApp, selectApp, saveApps } = useSelectedApp();
  const { query, setQuery, results: filteredResults, allResults, filters, setFilters, loading, error, resetFilters } = useSearch(selectedApp);
  const { addedItems } = useExistingItems(selectedApp);
  const { theme, toggleTheme } = useTheme();

  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingApp, setEditingApp] = useState<ArrAppWithKey | null>(null);
  const [showAddAppForm, setShowAddAppForm] = useState(false);

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

  const handleAddSuccess = useCallback((result: SearchResult) => {
    setViewState('search');
    setSelectedResult(null);
  }, []);

  const handleBackToSearch = useCallback(() => {
    setViewState('search');
    setSelectedResult(null);
    setEditingApp(null);
    setShowAddAppForm(false);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setViewState('settings');
  }, []);

  const handleAddApp = useCallback(() => {
    setEditingApp(null);
    setShowAddAppForm(true);
  }, []);

  const handleEditApp = useCallback((app: ArrAppWithKey) => {
    setEditingApp(app);
    setShowAddAppForm(true);
  }, []);

  const handleDeleteApp = useCallback(async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app?')) {
      return;
    }

    try {
      await storage.removeArrApp(appId);
      const updatedApps = apps.filter(app => app.id !== appId);
      await saveApps(updatedApps);
      
      // If we deleted the selected app, select the first remaining app
      if (selectedApp?.id === appId && updatedApps.length > 0) {
        await selectApp(updatedApps[0]);
      }
      
      showMessage('success', 'App deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete app');
    }
  }, [apps, selectedApp, saveApps, selectApp]);

  const handleTestConnection = useCallback(async (app: ArrAppWithKey) => {
    try {
      const api = createArrApi(app);
      await api.testConnection();
      showMessage('success', `Connection to ${app.name} successful`);
    } catch (error) {
      showMessage('error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleAppFormSubmit = useCallback(async (appData: Omit<ArrAppWithKey, 'id'>) => {
    try {
      if (editingApp) {
        // Update existing app
        const updatedApp = { ...appData, id: editingApp.id };
        await storage.updateArrApp(editingApp.id, appData);
        const updatedApps = apps.map(app => app.id === editingApp.id ? updatedApp : app);
        await saveApps(updatedApps);
        
        // Update selected app if it was the one being edited
        if (selectedApp?.id === editingApp.id) {
          await selectApp(updatedApp);
        }
        
        showMessage('success', 'App updated successfully');
      } else {
        // Add new app
        const newApp: ArrAppWithKey = {
          ...appData,
          id: Date.now().toString()
        };
        await storage.addArrApp(newApp);
        const updatedApps = [...apps, newApp];
        await saveApps(updatedApps);
        
        // If this is the first app, select it
        if (apps.length === 0) {
          await selectApp(newApp);
        }
        
        showMessage('success', 'App added successfully');
      }
      
      setShowAddAppForm(false);
      setEditingApp(null);
    } catch (error) {
      showMessage('error', 'Failed to save app');
    }
  }, [editingApp, apps, selectedApp, saveApps, selectApp]);

  const handleAppFormCancel = useCallback(() => {
    setShowAddAppForm(false);
    setEditingApp(null);
  }, []);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <h1 className="popup-title">ArrExtension</h1>
        <div className="header-actions">
          {(viewState === 'settings' || viewState === 'add') && (
            <button 
              className="back-btn"
              onClick={handleBackToSearch}
              title={viewState === 'add' ? 'Back to search results' : 'Back to search'}
            >
              <CloseIcon />
            </button>
          )}
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          {viewState === 'search' && (
            <button 
              className="settings-btn"
              onClick={handleSettingsClick}
              title="Settings"
            >
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      {viewState === 'search' && (
        <>
          {/* App Switcher */}
          {apps.length > 0 && (
            <AppSwitcher
              apps={apps}
              selectedApp={selectedApp}
              onAppSelect={selectApp}
            />
          )}

          {/* Search Bar */}
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={selectedApp ? `Search ${selectedApp.name}...` : 'Select an app first'}
          />

          {allResults.length > 0 && (
            <SearchFiltersComponent
              filters={filters}
              options={filterOptions}
              onChange={setFilters}
              totalCount={allResults.length}
              filteredCount={filteredResults.length}
            />
          )}

          {/* No Apps Message */}
          {apps.length === 0 && (
            <div className="no-apps-message">
              <p>No *arr apps configured.</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setViewState('settings');
                  setShowAddAppForm(true);
                  setEditingApp(null);
                }}
              >
                Add App
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-message">
              <i className="fas fa-spinner fa-spin"></i> Searching...
            </div>
          )}

          {/* Search Results */}
          {allResults.length > 0 && (
            <div className="search-results">
              {filteredResults.map((result) => {
                // Check if item is added using external identifier
                let externalId: number | undefined;
                if (selectedApp?.type === 'sonarr' && result.kind === 'series') {
                  externalId = result.tvdbId;
                } else if (selectedApp?.type === 'radarr' && result.kind === 'movie') {
                  externalId = result.tmdbId;
                }
                const isAdded = externalId ? addedItems.has(externalId) : false;
                
                return (
                  <ResultCard
                    key={result.id}
                    result={result}
                    isAdded={isAdded}
                    onClick={() => handleResultClick(result)}
                  />
                );
              })}
            </div>
          )}

          {/* No Results Message */}
          {!loading && query && allResults.length === 0 && selectedApp && (
            <div className="no-results-message">
              No results found for "{query}"
            </div>
          )}
        </>
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

      {/* Settings */}
      {viewState === 'settings' && (
        <div className="settings-view">
          {/* Add App Form */}
          {showAddAppForm && (
            <AppForm
              app={editingApp}
              onSubmit={handleAppFormSubmit}
              onCancel={handleAppFormCancel}
            />
          )}

          {/* App List */}
          {!showAddAppForm && (
            <>
              {/* Add App Button */}
              <div className="add-app-section">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddApp}
                >
                  <i className="fas fa-plus"></i> Add New App
                </button>
              </div>

              {/* Apps List */}
              {apps.length === 0 ? (
                <div className="no-apps-message">
                  <p>No *arr apps configured.</p>
                  <p>Add your first app to get started.</p>
                </div>
              ) : (
                <div className="app-list">
                  {apps.map((app) => (
                    <div key={app.id} className="app-item">
                      <div className="app-info">
                        <div className="app-icon">
                          {getAppIcon(app.type)}
                        </div>
                        <div className="app-details">
                          <div className="app-name">{app.name}</div>
                          <div className="app-url">{app.url}</div>
                          <div className="app-type">{app.type}</div>
                        </div>
                      </div>
                      <div className="app-actions">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleTestConnection(app)}
                          title="Test connection"
                        >
                          Test
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditApp(app)}
                          title="Edit app"
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteApp(app.id)}
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
      )}
    </div>
  );
};

export default Popup; 