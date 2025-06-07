import React, { useState, useEffect } from 'react';
import type { ArrApp, SearchResult, QualityProfile, RootFolder } from '../../src/api/types';
import { arrApi } from '../../src/api/arrApi';
import { storage } from '../../src/utils/storage';
import Settings from './Settings';

const App: React.FC = () => {
  const [apps, setApps] = useState<ArrApp[]>([]);
  const [activeApp, setActiveApp] = useState<ArrApp | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([]);
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addForm, setAddForm] = useState({
    qualityProfileId: '',
    rootFolderPath: '',
    monitored: true,
    searchForMovie: true,
    searchForMissingEpisodes: true
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [storedApps, storedSearchTerm] = await Promise.all([
        storage.getApps(),
        storage.getSearchTerm()
      ]);
      
      setApps(storedApps);
      if (storedApps.length > 0) {
        setActiveApp(storedApps[0]);
      }
      
      if (storedSearchTerm) {
        setSearchTerm(storedSearchTerm);
        if (storedApps.length > 0) {
          handleSearch(storedSearchTerm, storedApps[0]);
        }
      }
    } catch (error) {
      setError('Failed to load initial data');
    }
  };

  const handleSearch = async (term: string, app: ArrApp) => {
    if (!term.trim() || !app) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await arrApi.searchContent(app, term);
      if (response.success && response.data) {
        const resultsWithAddedStatus = await arrApi.checkIfAdded(app, response.data);
        setSearchResults(resultsWithAddedStatus);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppSwitch = (app: ArrApp) => {
    setActiveApp(app);
    setSelectedResult(null);
    setError(null);
    setSuccess(null);
    if (searchTerm) {
      handleSearch(searchTerm, app);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    if (!activeApp || result.isAdded) return;
    
    setSelectedResult(result);
    setLoading(true);
    
    try {
      const [profilesResponse, foldersResponse] = await Promise.all([
        arrApi.getQualityProfiles(activeApp),
        arrApi.getRootFolders(activeApp)
      ]);
      
      if (profilesResponse.success && profilesResponse.data) {
        setQualityProfiles(profilesResponse.data);
        if (profilesResponse.data.length > 0) {
          setAddForm(prev => ({
            ...prev,
            qualityProfileId: profilesResponse.data[0].id.toString()
          }));
        }
      }
      
      if (foldersResponse.success && foldersResponse.data) {
        setRootFolders(foldersResponse.data);
        if (foldersResponse.data.length > 0) {
          setAddForm(prev => ({
            ...prev,
            rootFolderPath: foldersResponse.data[0].path
          }));
        }
      }
    } catch (error) {
      setError('Failed to load add form data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!activeApp || !selectedResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const addRequest = {
        title: selectedResult.title,
        qualityProfileId: parseInt(addForm.qualityProfileId),
        rootFolderPath: addForm.rootFolderPath,
        monitored: addForm.monitored,
        ...(activeApp.type === 'sonarr' 
          ? { 
              tvdbId: selectedResult.tvdbId,
              searchForMissingEpisodes: addForm.searchForMissingEpisodes
            }
          : { 
              tmdbId: selectedResult.tmdbId,
              searchForMovie: addForm.searchForMovie
            }
        )
      };
      
      const response = await arrApi.addContent(activeApp, addRequest);
      if (response.success) {
        setSuccess(`Successfully added "${selectedResult.title}" to ${activeApp.name}`);
        setSelectedResult(null);
        // Refresh search results to show the item as added
        if (searchTerm) {
          handleSearch(searchTerm, activeApp);
        }
      } else {
        setError(response.error || 'Failed to add item');
      }
    } catch (error) {
      setError('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'sonarr': return '📺';
      case 'radarr': return '🎬';
      default: return '📱';
    }
  };

  const getImageUrl = (result: SearchResult) => {
    const posterImage = result.images?.find(img => img.coverType === 'poster');
    return posterImage?.remoteUrl || posterImage?.url || '';
  };

  // Show settings view
  if (showSettings) {
    return (
      <div className="app">
        <Settings 
          onClose={() => setShowSettings(false)}
          onAppsChange={(updatedApps) => {
            setApps(updatedApps);
            if (updatedApps.length > 0 && !activeApp) {
              setActiveApp(updatedApps[0]);
            }
          }}
        />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="app">
        <div className="app-header">
          <h1 className="header-title">*arr Search Tool</h1>
          <button 
            className="settings-gear"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <div className="no-apps">
          <h3>No *arr Apps Configured</h3>
          <p>Click the settings gear above to configure your *arr applications.</p>
        </div>
      </div>
    );
  }

  if (selectedResult) {
    return (
      <div className="app">
        <div className="add-form">
          <h3>Add "{selectedResult.title}"</h3>
          
          {error && <div className="error">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Quality Profile</label>
            <select 
              className="form-select"
              value={addForm.qualityProfileId}
              onChange={(e) => setAddForm(prev => ({ ...prev, qualityProfileId: e.target.value }))}
            >
              {qualityProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Root Folder</label>
            <select 
              className="form-select"
              value={addForm.rootFolderPath}
              onChange={(e) => setAddForm(prev => ({ ...prev, rootFolderPath: e.target.value }))}
            >
              {rootFolders.map(folder => (
                <option key={folder.id} value={folder.path}>
                  {folder.path}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>
              <input 
                type="checkbox"
                checked={addForm.monitored}
                onChange={(e) => setAddForm(prev => ({ ...prev, monitored: e.target.checked }))}
              />
              {' '}Monitor
            </label>
          </div>
          
          {activeApp?.type === 'radarr' && (
            <div className="form-group">
              <label>
                <input 
                  type="checkbox"
                  checked={addForm.searchForMovie}
                  onChange={(e) => setAddForm(prev => ({ ...prev, searchForMovie: e.target.checked }))}
                />
                {' '}Search for Movie
              </label>
            </div>
          )}
          
          {activeApp?.type === 'sonarr' && (
            <div className="form-group">
              <label>
                <input 
                  type="checkbox"
                  checked={addForm.searchForMissingEpisodes}
                  onChange={(e) => setAddForm(prev => ({ ...prev, searchForMissingEpisodes: e.target.checked }))}
                />
                {' '}Search for Missing Episodes
              </label>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedResult(null)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="header-title">*arr Search Tool</h1>
        <button 
          className="settings-gear"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="app-switcher">
        {apps.map(app => (
          <div 
            key={app.id}
            className={`app-icon ${activeApp?.id === app.id ? 'active' : ''}`}
            onClick={() => handleAppSwitch(app)}
            title={app.name}
          >
            {getAppIcon(app.type)}
          </div>
        ))}
      </div>
      
      <div className="search-section">
        <input 
          type="text"
          className="search-bar"
          placeholder="Search for movies or TV shows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && activeApp) {
              handleSearch(searchTerm, activeApp);
            }
          }}
        />
      </div>
      
      <div className="results-container">
        {loading && <div className="loading">Searching...</div>}
        
        {searchResults.map(result => (
          <div 
            key={result.id}
            className="result-card"
            onClick={() => handleResultClick(result)}
          >
            {result.isAdded && (
              <div className="added-checkmark">✓</div>
            )}
            
            <img 
              src={getImageUrl(result)}
              alt={result.title}
              className="result-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            
            <div className="result-info">
              <div className="result-title">{result.title}</div>
              {result.year && (
                <div className="result-year">{result.year}</div>
              )}
              {result.overview && (
                <div className="result-overview">{result.overview}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App; 