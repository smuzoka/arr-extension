import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { createArrApi } from '../api/arrApi';
import type { ArrApp, SearchResult } from '../api/types';
import SearchBar from './SearchBar';
import AppSwitcher from './AppSwitcher';
import ResultCard from './ResultCard';
import AddItemForm from './AddItemForm';
import AppForm from './AppForm';
import { getAppIcon, SettingsIcon, CloseIcon, MoonIcon, SunIcon } from '../utils/icons';

type ViewState = 'search' | 'add' | 'settings';

const Popup: React.FC = () => {
  const [apps, setApps] = useState<ArrApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ArrApp | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingApp, setEditingApp] = useState<ArrApp | null>(null);
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme as 'light' | 'dark';
    } else {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    loadApps();
    loadSelectedText();
  }, []);

  useEffect(() => {
    if (selectedApp && searchTerm) {
      performSearch(searchTerm, selectedApp);
    }
  }, [selectedApp]);

  const loadApps = async () => {
    try {
      const savedApps = await storage.getArrApps();
      setApps(savedApps);
      if (savedApps.length > 0) {
        setSelectedApp(savedApps[0]);
        await loadExistingItems(savedApps[0]);
      }
    } catch (err) {
      setError('Failed to load configured apps');
    }
  };

  const loadSelectedText = async () => {
    try {
      const text = await storage.getSelectedText();
      if (text) {
        setSearchTerm(text);
        // Auto-search if we have a selected app
        if (selectedApp) {
          await performSearch(text, selectedApp);
        }
      }
    } catch (err) {
      console.error('Failed to load selected text:', err);
    }
  };

    const loadExistingItems = async (app: ArrApp) => {
    try {
      let existingItems: SearchResult[] = [];

      if (app.type === 'sonarr') {
        const api = createArrApi(app);
        existingItems = await api.getAllSeries();
      } else if (app.type === 'radarr') {
        const api = createArrApi(app);
        existingItems = await api.getAllMovies();
      }
      
      // Use external identifiers instead of internal IDs
      const existingIds = new Set(existingItems.map(item => {
        if (app.type === 'sonarr') {
          return item.tvdbId;
        } else if (app.type === 'radarr') {
          return item.tmdbId;
        }
        return item.id;
      }).filter((id): id is number => id !== undefined));
      setAddedItems(existingIds);
    } catch (err) {
      console.error('Failed to load existing items:', err);
    }
  };

    const performSearch = async (term: string, app: ArrApp) => {
    if (!term.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let results: SearchResult[] = [];

      if (app.type === 'sonarr') {
        const api = createArrApi(app);
        results = await api.searchSeries(term);
      } else if (app.type === 'radarr') {
        const api = createArrApi(app);
        results = await api.searchMovies(term);
      }

      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = async (app: ArrApp) => {
    setSelectedApp(app);
    await loadExistingItems(app);
    if (searchTerm) {
      await performSearch(searchTerm, app);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (selectedApp) {
      await performSearch(term, selectedApp);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setViewState('add');
  };

  const handleAddSuccess = (result: SearchResult) => {
    // Use external identifier for tracking
    let externalId: number | undefined;
    if (selectedApp?.type === 'sonarr') {
      externalId = result.tvdbId;
    } else if (selectedApp?.type === 'radarr') {
      externalId = result.tmdbId;
    }
    
    if (externalId) {
      setAddedItems(prev => new Set([...prev, externalId]));
    }
    setViewState('search');
    setSelectedResult(null);
  };

  const handleBackToSearch = () => {
    setViewState('search');
    setSelectedResult(null);
    setEditingApp(null);
    setShowAddAppForm(false);
  };

  const handleSettingsClick = () => {
    setViewState('settings');
  };

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleAddApp = () => {
    setEditingApp(null);
    setShowAddAppForm(true);
  };

  const handleEditApp = (app: ArrApp) => {
    setEditingApp(app);
    setShowAddAppForm(true);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app?')) {
      return;
    }

    try {
      await storage.removeArrApp(appId);
      const updatedApps = apps.filter(app => app.id !== appId);
      setApps(updatedApps);
      
      // If we deleted the selected app, select the first remaining app
      if (selectedApp?.id === appId) {
        const newSelectedApp = updatedApps.length > 0 ? updatedApps[0] : null;
        setSelectedApp(newSelectedApp);
        if (newSelectedApp) {
          await loadExistingItems(newSelectedApp);
        }
      }
      
      showMessage('success', 'App deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete app');
    }
  };

  const handleTestConnection = async (app: ArrApp) => {
    try {
      const api = createArrApi(app);
      await api.testConnection();
      showMessage('success', `Connection to ${app.name} successful`);
    } catch (error) {
      showMessage('error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAppFormSubmit = async (appData: Omit<ArrApp, 'id'>) => {
    try {
      if (editingApp) {
        // Update existing app
        const updatedApp = { ...appData, id: editingApp.id };
        await storage.updateArrApp(editingApp.id, appData);
        const updatedApps = apps.map(app => app.id === editingApp.id ? updatedApp : app);
        setApps(updatedApps);
        
        // Update selected app if it was the one being edited
        if (selectedApp?.id === editingApp.id) {
          setSelectedApp(updatedApp);
          await loadExistingItems(updatedApp);
        }
        
        showMessage('success', 'App updated successfully');
      } else {
        // Add new app
        const newApp: ArrApp = {
          ...appData,
          id: Date.now().toString()
        };
        await storage.addArrApp(newApp);
        const updatedApps = [...apps, newApp];
        setApps(updatedApps);
        
        // If this is the first app, select it
        if (apps.length === 0) {
          setSelectedApp(newApp);
          await loadExistingItems(newApp);
        }
        
        showMessage('success', 'App added successfully');
      }
      
      setShowAddAppForm(false);
      setEditingApp(null);
    } catch (error) {
      showMessage('error', 'Failed to save app');
    }
  };

  const handleAppFormCancel = () => {
    setShowAddAppForm(false);
    setEditingApp(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

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
            onClick={handleThemeToggle}
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
              onAppSelect={handleAppChange}
            />
          )}

          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder={selectedApp ? `Search ${selectedApp.name}...` : 'Select an app first'}
          />

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
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => {
                // Check if item is added using external identifier
                let externalId: number | undefined;
                if (selectedApp?.type === 'sonarr') {
                  externalId = result.tvdbId;
                } else if (selectedApp?.type === 'radarr') {
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
          {!loading && searchTerm && searchResults.length === 0 && selectedApp && (
            <div className="no-results-message">
              No results found for "{searchTerm}"
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