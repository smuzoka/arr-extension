import React, { useState, useEffect } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrApp, SearchResult, QualityProfile, RootFolder } from '../api/types';
import { storage, type SavedFormOptions } from '../utils/storage';
import ResultCard from './ResultCard';

interface AddItemFormProps {
  app: ArrApp;
  result: SearchResult;
  onSuccess: (result: SearchResult) => void;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ app, result, onSuccess, onCancel: _onCancel }) => {
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([]);
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedQualityProfile, setSelectedQualityProfile] = useState<number | null>(null);
  const [selectedRootFolder, setSelectedRootFolder] = useState<string | null>(null);
  const [monitored, setMonitored] = useState(true);
  const [seasonFolder, setSeasonFolder] = useState(true);
  const [seriesType, setSeriesType] = useState('standard');
  const [tags, setTags] = useState('');
  const [searchForMissing, setSearchForMissing] = useState(true);
  const [searchForCutoff, setSearchForCutoff] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const api = createArrApi(app);
      const [profiles, folders, savedOptions] = await Promise.all([
        api.getQualityProfiles(),
        api.getRootFolders(),
        storage.getLastUsedOptions(app.type)
      ]);
      
      setQualityProfiles(profiles);
      setRootFolders(folders);
      
      // Apply saved options if available, otherwise use defaults
      if (savedOptions) {
        // Set quality profile - use saved if available and exists in current profiles
        if (savedOptions.qualityProfileId && profiles.find(p => p.id === savedOptions.qualityProfileId)) {
          setSelectedQualityProfile(savedOptions.qualityProfileId);
        } else if (profiles.length > 0) {
          setSelectedQualityProfile(profiles[0].id);
        }
        
        // Set root folder - use saved if available and exists in current folders
        if (savedOptions.rootFolderPath && folders.find(f => f.path === savedOptions.rootFolderPath)) {
          setSelectedRootFolder(savedOptions.rootFolderPath);
        } else if (folders.length > 0) {
          setSelectedRootFolder(folders[0].path);
        }
        
        // Apply other saved options
        if (savedOptions.monitored !== undefined) setMonitored(savedOptions.monitored);
        if (savedOptions.seasonFolder !== undefined) setSeasonFolder(savedOptions.seasonFolder);
        if (savedOptions.seriesType) setSeriesType(savedOptions.seriesType);
        if (savedOptions.searchForMissing !== undefined) setSearchForMissing(savedOptions.searchForMissing);
        if (savedOptions.searchForCutoff !== undefined) setSearchForCutoff(savedOptions.searchForCutoff);
      } else {
        // Set defaults when no saved options
        if (profiles.length > 0) {
          setSelectedQualityProfile(profiles[0].id);
        }
        if (folders.length > 0) {
          setSelectedRootFolder(folders[0].path);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentOptions = async () => {
    const options: SavedFormOptions = {
      qualityProfileId: selectedQualityProfile || undefined,
      rootFolderPath: selectedRootFolder || undefined,
      monitored,
      seasonFolder,
      seriesType,
      searchForMissing,
      searchForCutoff
    };
    
    try {
      await storage.saveLastUsedOptions(app.type, options);
    } catch (err) {
      console.error('Failed to save last used options:', err);
      // Don't throw - this shouldn't prevent the main operation
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQualityProfile || !selectedRootFolder) {
      setError('Please select quality profile and root folder');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const api = createArrApi(app);
      
      if (app.type === 'sonarr') {
        if (!result.tvdbId) {
          throw new Error('Missing TVDB ID for series');
        }
        
        await api.addSeries({
          title: result.title,
          qualityProfileId: selectedQualityProfile,
          rootFolderPath: selectedRootFolder,
          tvdbId: result.tvdbId,
          monitored,
          seasonFolder,
          seriesType,
          tags: tags ? tags.split(',').map(tag => parseInt(tag.trim())).filter(Boolean) : undefined,
          searchForMissingEpisodes: searchForMissing,
          searchForCutoffUnmetEpisodes: searchForCutoff
        });
      } else if (app.type === 'radarr') {
        if (!result.tmdbId) {
          throw new Error('Missing TMDB ID for movie');
        }
        
        await api.addMovie({
          title: result.title,
          qualityProfileId: selectedQualityProfile,
          rootFolderPath: selectedRootFolder,
          tmdbId: result.tmdbId,
          monitored,
          tags: tags ? tags.split(',').map(tag => parseInt(tag.trim())).filter(Boolean) : undefined,
          searchForMovie: searchForMissing
        });
      }
      
      // Save options on successful submission
      await saveCurrentOptions();
      
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
      {error && (
        <div className="error">{error}</div>
      )}

      <ResultCard result={result} isAdded={false} onClick={() => {}} showControls={false} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Root Folder</label>
          <select
            value={selectedRootFolder || ''}
            onChange={(e) => setSelectedRootFolder(e.target.value)}
            required
          >
            <option value="">Select root folder</option>
            {rootFolders.map(folder => (
              <option key={folder.id} value={folder.path}>
                {folder.path}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quality Profile</label>
          <select
            value={selectedQualityProfile || ''}
            onChange={(e) => setSelectedQualityProfile(Number(e.target.value))}
            required
          >
            <option value="">Select quality profile</option>
            {qualityProfiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {app.type === 'sonarr' && (
          <>
            <div className="form-group">
              <label>Series Type</label>
              <select
                value={seriesType}
                onChange={(e) => setSeriesType(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="daily">Daily</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="seasonFolder"
                checked={seasonFolder}
                onChange={(e) => setSeasonFolder(e.target.checked)}
              />
              <label htmlFor="seasonFolder" style={{ fontSize: '12px' }}>
                Season Folder
              </label>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Tags (comma-separated IDs)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="1, 2, 3"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="searchForMissing"
            checked={searchForMissing}
            onChange={(e) => setSearchForMissing(e.target.checked)}
          />
          <label htmlFor="searchForMissing" style={{ fontSize: '12px' }}>
            {app.type === 'sonarr' ? 'Start search for missing episodes' : 'Start search for movie'}
          </label>
        </div>

        {app.type === 'sonarr' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="searchForCutoff"
              checked={searchForCutoff}
              onChange={(e) => setSearchForCutoff(e.target.checked)}
            />
            <label htmlFor="searchForCutoff" style={{ fontSize: '12px' }}>
              Start search for cutoff unmet episodes
            </label>
          </div>
        )}

        <button 
          type="submit" 
          className="button" 
          disabled={submitting}
          style={{ marginTop: '8px' }}
        >
          {submitting ? 'Adding...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
};

export default AddItemForm; 