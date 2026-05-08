import React, { useEffect, useState } from 'react';
import type { ArrAppWithKey } from '../api/types';
import {
  isValidApiKey,
  isValidHttpUrl,
  normalizeUrl,
  MIN_API_KEY_LENGTH
} from '../utils/validators';

interface AppFormProps {
  app?: ArrAppWithKey | null;
  onSubmit: (app: Omit<ArrAppWithKey, 'id'>) => Promise<void> | void;
  onCancel: () => void;
  onTestConnection?: (
    app: Omit<ArrAppWithKey, 'id'>,
  ) => Promise<{ success: boolean; message: string }>;
}

const AppForm: React.FC<AppFormProps> = ({ app, onSubmit, onCancel, onTestConnection }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ArrApp['type']>('sonarr');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const urlError = url && !isValidHttpUrl(url)
    ? 'Enter a valid http or https URL.'
    : null;
  const apiKeyError = apiKey && !isValidApiKey(apiKey)
    ? `API key must be at least ${MIN_API_KEY_LENGTH} characters.`
    : null;
  const isFormValid = Boolean(name.trim()) && Boolean(type) && !urlError && !apiKeyError;

  useEffect(() => {
    if (app) {
      setName(app.name);
      setType(app.type);
      setUrl(app.url);
      setApiKey(app.apiKey);
    }
  }, [app]);

  const buildAppPayload = (): Omit<ArrAppWithKey, 'id'> => ({
    name: name.trim(),
    type,
    url: normalizeUrl(url),
    apiKey,
    icon: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isFormValid) {
      setFormError('Fix validation errors before saving.');
      return;
    }

    await onSubmit(buildAppPayload());
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) {
      return;
    }

    if (!url || !apiKey || urlError || apiKeyError) {
      setTestResult({
        success: false,
        message: 'Please fill in URL and API Key first',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await onTestConnection(buildAppPayload());
      setTestResult(result);
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
      {formError && (
        <div className="message error">
          {formError}
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
            placeholder={`My ${type.charAt(0).toUpperCase() + type.slice(1)}`}
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
            aria-invalid={Boolean(urlError)}
            required
          />
          {urlError && (
            <small className="form-group-description error">{urlError}</small>
          )}
          <small className="form-group-description">
            Include the protocol (http:// or https://) and port number if needed
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <div className="input-with-toggle">
            <input
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key"
              aria-invalid={Boolean(apiKeyError)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowApiKey((prev) => !prev)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          {apiKeyError && (
            <small className="form-group-description error">{apiKeyError}</small>
          )}
          <small className="form-group-description">
            Found in Settings → General → Security in your *arr app
          </small>
        </div>

        <div className="form-actions">
          {onTestConnection && (
            <button
              type="button"
              className="button secondary"
              onClick={handleTestConnection}
              disabled={testing || !url || !apiKey || Boolean(urlError) || Boolean(apiKeyError)}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          )}
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button" disabled={!isFormValid}>
            {app ? 'Update App' : 'Add App'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppForm; 