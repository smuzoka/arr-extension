import React, { useState, useEffect } from 'react';
import type { ArrApp } from '../../src/api/types';
import { arrApi } from '../../src/api/arrApi';
import { storage } from '../../src/utils/storage';

interface SettingsProps {
  onClose: () => void;
  onAppsChange: (apps: ArrApp[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onAppsChange }) => {
  const [apps, setApps] = useState<ArrApp[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<ArrApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'sonarr' as 'sonarr' | 'radarr',
    url: '',
    apiKey: ''
  });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const storedApps = await storage.getApps();
      setApps(storedApps);
      onAppsChange(storedApps);
    } catch (error) {
      setError('Failed to load apps');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      type: 'sonarr',
      url: '',
      apiKey: ''
    });
    setShowAddForm(false);
    setEditingApp(null);
    setError(null);
    setSuccess(null);
  };

  const handleTest = async (app: ArrApp) => {
    setTestingId(app.id);
    setError(null);
    
    try {
      const response = await arrApi.testConnection(app);
      if (response.success) {
        setSuccess(`Successfully connected to ${app.name}`);
      } else {
        setError(`Connection failed: ${response.error}`);
      }
    } catch (error) {
      setError('Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.url || !form.apiKey) {
      setError('Please fill in all fields');
      return;
    }

    const cleanUrl = form.url.replace(/\/+$/, '');
    
    const appData: ArrApp = {
      id: editingApp?.id || Date.now().toString(),
      name: form.name,
      type: form.type,
      url: cleanUrl,
      apiKey: form.apiKey
    };

    setLoading(true);
    setError(null);

    try {
      const testResponse = await arrApi.testConnection(appData);
      if (!testResponse.success) {
        setError(`Connection test failed: ${testResponse.error}`);
        setLoading(false);
        return;
      }

      if (editingApp) {
        await storage.updateApp(editingApp.id, appData);
        setSuccess(`Successfully updated ${appData.name}`);
      } else {
        await storage.addApp(appData);
        setSuccess(`Successfully added ${appData.name}`);
      }

      await loadApps();
      resetForm();
    } catch (error) {
      setError('Failed to save app');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: ArrApp) => {
    setForm({
      name: app.name,
      type: app.type,
      url: app.url,
      apiKey: app.apiKey
    });
    setEditingApp(app);
    setShowAddForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (app: ArrApp) => {
    if (!confirm(`Are you sure you want to delete ${app.name}?`)) {
      return;
    }

    try {
      await storage.removeApp(app.id);
      await loadApps();
      setSuccess(`Successfully deleted ${app.name}`);
    } catch (error) {
      setError('Failed to delete app');
    }
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'sonarr': return '📺';
      case 'radarr': return '🎬';
      default: return '📱';
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <div className="settings-content">
        <h3>*arr Applications</h3>
        
        <div className="app-list-compact">
          {apps.length === 0 ? (
            <div className="empty-state-compact">
              <p>No applications configured</p>
            </div>
          ) : (
            apps.map(app => (
              <div key={app.id} className="app-card-compact">
                <div className="app-icon-small">
                  {getAppIcon(app.type)}
                </div>
                <div className="app-info-compact">
                  <div className="app-name-small">{app.name}</div>
                  <div className="app-url-small">{app.url}</div>
                </div>
                <div className="app-actions-compact">
                  <button
                    className="btn-icon"
                    onClick={() => handleTest(app)}
                    disabled={testingId === app.id}
                    title="Test connection"
                  >
                    {testingId === app.id ? '⏳' : '🔌'}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(app)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(app)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!showAddForm && (
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowAddForm(true)}
          >
            + Add Application
          </button>
        )}

        {showAddForm && (
          <div className="add-form-compact">
            <h4>{editingApp ? 'Edit Application' : 'Add Application'}</h4>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Name (e.g., My Sonarr)"
                  required
                />
              </div>
              
              <div className="form-group">
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'sonarr' | 'radarr' }))}
                >
                  <option value="sonarr">Sonarr (TV Shows)</option>
                  <option value="radarr">Radarr (Movies)</option>
                </select>
              </div>
              
              <div className="form-group">
                <input
                  type="url"
                  className="form-input"
                  value={form.url}
                  onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL (e.g., http://localhost:8989)"
                  required
                />
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  className="form-input"
                  value={form.apiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API Key"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-small"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingApp ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 