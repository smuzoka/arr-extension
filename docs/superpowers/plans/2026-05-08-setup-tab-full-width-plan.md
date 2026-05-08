# Setup Tab Full-Width Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the setup page fill a full browser tab and adopt a two-column list and form layout while keeping the existing visual system intact.

**Architecture:** Reuse the existing popup design tokens and components, but override setup-specific layout sizing in `entrypoints/setup/style.css`. Update `AppSettingsPanel` to render the list and form side-by-side and move the status message into the form column.

**Tech Stack:** React 19, TypeScript, WXT, Vitest, CSS

---

## File Structure

- Create: `src/components/AppSettingsPanel.test.tsx`
- Modify: `src/components/AppSettingsPanel.tsx`
- Modify: `src/components/SetupPage.tsx`
- Modify: `entrypoints/setup/style.css`

---

### Task 1: Add layout test coverage for AppSettingsPanel

**Files:**
- Create: `src/components/AppSettingsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArrAppWithKey } from '../api/types';
import AppSettingsPanel from './AppSettingsPanel';

const baseApp: ArrAppWithKey = {
  id: '1',
  name: 'My Sonarr',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'apikey123',
  icon: '',
};

const buildProps = (overrides: Partial<React.ComponentProps<typeof AppSettingsPanel>> = {}) => ({
  apps: [baseApp],
  editingApp: baseApp,
  showForm: true,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  onTestConnection: vi.fn().mockResolvedValue({ success: true, message: 'ok' }),
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onGrantPermission: vi.fn(),
  permissionByAppId: { [baseApp.id]: false },
  ...overrides,
});

describe('AppSettingsPanel', () => {
  it('shows the list and form when the form is open', () => {
    render(<AppSettingsPanel {...buildProps()} />);

    expect(screen.getByRole('button', { name: /add new app/i })).toBeInTheDocument();
    expect(screen.getByText('My Sonarr')).toBeInTheDocument();
    expect(screen.getByLabelText('App Name')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AppSettingsPanel.test.tsx`

Expected: FAIL with missing "Add New App" button because the list is hidden when `showForm` is true.

---

### Task 2: Render list and form side-by-side and move the message into the form column

**Files:**
- Modify: `src/components/AppSettingsPanel.tsx`
- Modify: `src/components/SetupPage.tsx`

- [ ] **Step 1: Update AppSettingsPanel to render list + form together**

```tsx
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
          <div className="form-placeholder">
            Select an app to edit or add a new one.
          </div>
        )}
      </div>
    </div>
  </div>
);

export default AppSettingsPanel;
```

- [ ] **Step 2: Pass the status message into AppSettingsPanel**

```tsx
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
    [],
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
        }}
        onGrantPermission={handleGrantPermission}
        permissionByAppId={permissionByAppId}
        message={message}
      />
    </div>
  );
};

export default SetupPage;
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm run test -- AppSettingsPanel.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/AppSettingsPanel.tsx src/components/SetupPage.tsx src/components/AppSettingsPanel.test.tsx
git commit -m "feat: keep setup list visible with form"
```

---

### Task 3: Make the setup tab full-width with setup-specific layout styles

**Files:**
- Modify: `entrypoints/setup/style.css`

- [ ] **Step 1: Update setup layout styles**

```css
body {
  margin: 0;
  min-width: 0;
  width: 100%;
  height: auto;
  min-height: 100vh;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.setup-page-shell {
  max-width: 1200px;
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 32px 40px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
}

.setup-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-form .message {
  margin: 0;
}

.form-placeholder {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--muted-foreground);
  font-size: 14px;
}

.add-app-section {
  justify-content: flex-start;
  margin-bottom: 0;
}

.app-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .setup-page-shell {
    padding: 24px;
  }

  .settings-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Run tests to ensure no regressions**

Run: `npm run test -- SetupPage.test.tsx`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add entrypoints/setup/style.css
git commit -m "style: expand setup tab layout"
```

---

## Plan Self-Review

- Spec coverage: layout change, message placement, and full-width sizing are covered in Tasks 2 and 3.
- Placeholder scan: no TBD/TODOs, all steps have concrete code and commands.
- Type consistency: AppSettingsPanel `message` prop is optional and passed from SetupPage.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-setup-tab-full-width-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
