import React from 'react';
import type { ArrAppWithKey } from '../api/types';
import AppForm from './AppForm';
import { getAppIcon } from '../utils/icons';

interface AppSettingsPanelProps {
  apps: ArrAppWithKey[];
  editingApp: ArrAppWithKey | null;
  showForm: boolean;
  onSubmit: (appData: Omit<ArrAppWithKey, 'id'>) => Promise<void> | void;
  onCancel: () => void;
  onTestConnection: (
    app: Omit<ArrAppWithKey, 'id'>,
  ) => Promise<{ success: boolean; message: string }>;
  onAdd: () => void;
  onEdit: (app: ArrAppWithKey) => void;
  onDelete: (appId: string) => void;
  onGrantPermission: (app: ArrAppWithKey) => void;
  permissionByAppId: Record<string, boolean>;
  message?: {
    type: 'success' | 'error';
    text: string;
  } | null;
}

const AppSettingsPanel: React.FC<AppSettingsPanelProps> = ({
  apps,
  editingApp,
  showForm,
  onSubmit,
  onCancel,
  onTestConnection,
  onAdd,
  onEdit,
  onDelete,
  onGrantPermission,
  permissionByAppId,
  message,
}) => (
  <div className="settings-view">
    <div className="settings-layout">
      <div className="settings-list">
        <div className="add-app-section">
          <button className="btn btn-primary" onClick={onAdd}>
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
            {apps.map((app) => (
              <div key={app.id} className="app-item">
                <div className="app-info">
                  <div className="app-icon">{getAppIcon(app.type)}</div>
                  <div className="app-details">
                    <div className="app-name">{app.name}</div>
                    <div className="app-url">{app.url}</div>
                    <div className="app-type">{app.type}</div>
                    <div className="app-status">
                      {permissionByAppId[app.id] ? 'Ready' : 'Permission required'}
                    </div>
                  </div>
                </div>
                <div className="app-actions">
                  {!permissionByAppId[app.id] && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onGrantPermission(app)}
                      title="Grant host permission"
                    >
                      Grant permission
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onTestConnection(app)}
                    title="Test connection"
                  >
                    Test
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onEdit(app)}
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
      </div>

      <div className="settings-form">
        {message && <div className={`message ${message.type}`}>{message.text}</div>}

        {showForm ? (
          <AppForm
            app={editingApp}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onTestConnection={onTestConnection}
          />
        ) : (
          <div className="form-placeholder">Select an app to edit or add a new one.</div>
        )}
      </div>
    </div>
  </div>
);

export default AppSettingsPanel;
