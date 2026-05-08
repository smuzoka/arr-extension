import React, { useCallback, useEffect, useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey } from '../api/types';
import { storage } from '../utils/storage';
import { hasAppPermission, requestAppPermission } from '../utils/appPermissions';
import AppSettingsPanel from './AppSettingsPanel';

const SetupPage: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedAppId = searchParams.get('appId');
  const [apps, setApps] = useState<ArrAppWithKey[]>([]);
  const [editingApp, setEditingApp] = useState<ArrAppWithKey | null>(null);
  const [showForm, setShowForm] = useState(
    searchParams.get('action') === 'add' || Boolean(requestedAppId),
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [permissionByAppId, setPermissionByAppId] = useState<Record<string, boolean>>({});

  const refreshApps = useCallback(async () => {
    const savedApps = await storage.getArrApps();
    setApps(savedApps);

    if (requestedAppId) {
      setEditingApp(savedApps.find((app) => app.id === requestedAppId) ?? null);
    }

    const permissionEntries = await Promise.all(
      savedApps.map(async (app) => [app.id, await hasAppPermission(app)] as const),
    );
    setPermissionByAppId(Object.fromEntries(permissionEntries));
  }, [requestedAppId]);

  useEffect(() => {
    void refreshApps();
  }, [refreshApps]);

  const handleSubmit = useCallback(
    async (appData: Omit<ArrAppWithKey, 'id'>) => {
      const savedApp = editingApp
        ? { ...editingApp, ...appData }
        : { ...appData, id: Date.now().toString() };

      if (editingApp) {
        await storage.updateArrApp(editingApp.id, appData);
      } else {
        await storage.addArrApp(savedApp);
      }

      const granted = await requestAppPermission(savedApp);
      await refreshApps();
      setEditingApp(null);
      setShowForm(false);
      setMessage({
        type: granted ? 'success' : 'error',
        text: granted
          ? (editingApp ? 'App updated and ready to use.' : 'App added and ready to use.')
          : 'App saved. Grant permission before using it in the popup.',
      });
    },
    [editingApp, refreshApps],
  );

  const handleGrantPermission = useCallback(
    async (app: ArrAppWithKey) => {
      const granted = await requestAppPermission(app);
      await refreshApps();
      setMessage({
        type: granted ? 'success' : 'error',
        text: granted
          ? `${app.name} is ready to use.`
          : `Permission still required for ${app.name}.`,
      });
    },
    [refreshApps],
  );

  const handleTestConnection = useCallback(
    async (app: Omit<ArrAppWithKey, 'id'>) => {
      const granted = await requestAppPermission(app);
      if (!granted) {
        return {
          success: false,
          message: 'Permission denied for this server origin.',
        };
      }

      await refreshApps();

      try {
        const api = createArrApi({ ...app, id: 'test' });
        const status = await api.testConnection();
        return {
          success: true,
          message: `Connected successfully! Version: ${status.version}`,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Connection failed',
        };
      }
    },
    [refreshApps],
  );

  return (
    <div className="setup-page-shell">
      <header className="setup-page-header">
        <div>
          <h1>ArrExtension setup</h1>
          <p>Add, test, and grant access for your Sonarr and Radarr apps.</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => window.close()}
        >
          Done
        </button>
      </header>

      <AppSettingsPanel
        apps={apps}
        editingApp={editingApp}
        showForm={showForm}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingApp(null);
        }}
        onTestConnection={handleTestConnection}
        onAdd={() => {
          setEditingApp(null);
          setShowForm(true);
        }}
        onEdit={(app) => {
          setEditingApp(app);
          setShowForm(true);
        }}
        onDelete={async (appId) => {
          await storage.removeArrApp(appId);
          await refreshApps();
          if (editingApp?.id === appId) {
            setEditingApp(null);
            setShowForm(false);
          }
        }}
        onGrantPermission={handleGrantPermission}
        permissionByAppId={permissionByAppId}
        message={message}
      />
    </div>
  );
};

export default SetupPage;
