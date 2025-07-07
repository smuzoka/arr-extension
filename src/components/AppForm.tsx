import React, { useState, useEffect } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrApp } from '../api/types';

interface AppFormProps {
  app?: ArrApp | null;
  onSubmit: (app: Omit<ArrApp, 'id'>) => void;
  onCancel: () => void;
}

const AppForm: React.FC<AppFormProps> = ({ app, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ArrApp['type']>('sonarr');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (app) {
      setName(app.name);
      setType(app.type);
      setUrl(app.url);
      setApiKey(app.apiKey);
    }
  }, [app]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !type || !url || !apiKey) {
      return;
    }

          onSubmit({
        name,
        type,
        url: url.replace(/\/$/, ''), // Remove trailing slash
        apiKey,
        icon: ''
      });
  };

  const handleTestConnection = async () => {
    if (!url || !apiKey) {
      setTestResult({ success: false, message: 'Please fill in URL and API Key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testApp: ArrApp = {
        id: 'test',
        name: 'Test',
        type,
        url: url.replace(/\/$/, ''),
        apiKey,
        icon: ''
      };

      const api = createArrApi(testApp);
      const status = await api.testConnection();
      
      setTestResult({ 
        success: true, 
        message: `Connected successfully! Version: ${status.version}` 
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
    } finally {
      setTesting(false);
    }
  };



  return (
    <div className="form-container">
      {testResult && (
        <div className={`message ${testResult.success ? 'success' : 'error'}`}>
          {testResult.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">App Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Sonarr"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">App Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as ArrApp['type'])}
            required
          >
            <option value="sonarr">Sonarr (TV Shows)</option>
            <option value="radarr">Radarr (Movies)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="url">Server URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:8989"
            required
          />
          <small className="form-group-description">
            Include the protocol (http:// or https://) and port number if needed
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your API key"
            required
          />
          <small className="form-group-description">
            Found in Settings → General → Security in your *arr app
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={handleTestConnection}
            disabled={testing || !url || !apiKey}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button">
            {app ? 'Update App' : 'Add App'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppForm; 