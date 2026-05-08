# Setup Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move app management out of the popup into a dedicated `setup.html` tab and show permission-missing apps as disabled in the popup.

**Architecture:** Add a shared `openSetupPage()` launcher plus a persistent setup-page coordinator that owns add/edit/delete, permission grant, and connection tests. Refactor the popup back to a lightweight search surface that opens the setup tab for management and derives per-app usability from `chrome.permissions.contains()`.

**Tech Stack:** React, TypeScript, WXT, Chrome extension APIs, Vitest, Testing Library, Playwright.

---
### Task 1: Add setup-tab launcher and test chrome tab mocks
**Files:**
- Create: `src/utils/openSetupPage.ts`
- Create: `src/utils/openSetupPage.test.ts`
- Modify: `src/test/setupTests.ts`

- [ ] **Step 1: Write the failing launcher tests**
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openSetupPage } from './openSetupPage';

describe('openSetupPage', () => {
  beforeEach(() => {
    vi.mocked(chrome.runtime.getURL).mockImplementation(
      (path?: string) => `chrome-extension://test/${path ?? ''}`,
    );
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    vi.mocked(chrome.tabs.create).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
    vi.mocked(chrome.tabs.update).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
  });

  it('creates a setup tab when none exists', async () => {
    await openSetupPage('?action=add');

    expect(chrome.tabs.query).toHaveBeenCalledWith({
      url: 'chrome-extension://test/setup.html*',
    });
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/setup.html?action=add',
      active: true,
    });
  });

  it('focuses an existing setup tab instead of creating a duplicate', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([{ id: 42 }] as chrome.tabs.Tab[]);

    await openSetupPage('?appId=abc');

    expect(chrome.tabs.update).toHaveBeenCalledWith(42, {
      active: true,
      url: 'chrome-extension://test/setup.html?appId=abc',
    });
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the launcher test to verify it fails**

Run:
```bash
npm test -- src/utils/openSetupPage.test.ts
```
Expected: FAIL because `src/utils/openSetupPage.ts` does not exist and the `chrome.tabs` / `chrome.runtime.getURL` mocks are incomplete.

- [ ] **Step 3: Extend the shared test setup with runtime and tabs mocks**
```ts
if (!globalThis.chrome) {
  globalThis.chrome = {
    storage: {
      local: createStorageArea("local"),
      sync: createStorageArea("sync"),
    },
    permissions: {
      request: vi.fn(async () => true),
      contains: vi.fn(async () => true),
    },
    runtime: {
      getURL: vi.fn((path = "") => `chrome-extension://test/${path}`),
    },
    tabs: {
      query: vi.fn(async () => []),
      create: vi.fn(async (createProperties) => ({
        id: 1,
        url: createProperties.url,
        active: Boolean(createProperties.active),
      }) as chrome.tabs.Tab),
      update: vi.fn(async (tabId, updateProperties) => ({
        id: tabId,
        url: updateProperties.url,
        active: Boolean(updateProperties.active),
      }) as chrome.tabs.Tab),
    },
  } as unknown as typeof chrome;
}
```

- [ ] **Step 4: Implement the launcher helper**
```ts
const SETUP_PAGE = "setup.html";

export const openSetupPage = async (search = ""): Promise<void> => {
  const baseUrl = chrome.runtime.getURL(SETUP_PAGE);
  const targetUrl = `${baseUrl}${search}`;
  const [existingTab] = await chrome.tabs.query({ url: `${baseUrl}*` });

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, {
      active: true,
      url: targetUrl,
    });
    return;
  }

  await chrome.tabs.create({
    url: targetUrl,
    active: true,
  });
};
```

- [ ] **Step 5: Run the targeted launcher test and the full unit suite**

Run:
```bash
npm test -- src/utils/openSetupPage.test.ts
npm test
```
Expected: `openSetupPage` tests PASS and the full Vitest suite still passes.

- [ ] **Step 6: Commit**
```bash
git add src/test/setupTests.ts src/utils/openSetupPage.ts src/utils/openSetupPage.test.ts
git commit -m "feat: add setup tab launcher"
```

### Task 2: Build the setup page and move permission flow out of `AppForm`
**Files:**
- Create: `entrypoints/setup/index.html`
- Create: `entrypoints/setup/main.tsx`
- Create: `entrypoints/setup/style.css`
- Create: `src/components/SetupPage.tsx`
- Create: `src/components/SetupPage.test.tsx`
- Create: `src/utils/appPermissions.ts`
- Modify: `src/components/AppForm.tsx`
- Modify: `src/components/AppForm.test.tsx`
- Modify: `src/components/AppSettingsPanel.tsx`

- [ ] **Step 1: Write the failing setup-page tests**
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SetupPage from './SetupPage';
import { resetStorageState } from '../test/setupTests';

describe('SetupPage', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
  });

  it('keeps the app saved and marks it as permission required when permission is denied', async () => {
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.click(screen.getByRole('button', { name: /add new app/i }));
    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989');
    await user.type(screen.getByLabelText('API Key'), 'testapikey123');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    expect(await screen.findByText('App saved. Grant permission before using it in the popup.')).toBeInTheDocument();
    expect(screen.getByText('Permission required')).toBeInTheDocument();

    const syncData = await chrome.storage.sync.get(['arr_apps']);
    expect(syncData.arr_apps).toHaveLength(1);
  });

  it('requests permission and keeps the page open after a successful save', async () => {
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.click(screen.getByRole('button', { name: /add new app/i }));
    await user.type(screen.getByLabelText('App Name'), 'My Radarr');
    await user.selectOptions(screen.getByLabelText('App Type'), 'radarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:7878');
    await user.type(screen.getByLabelText('API Key'), 'radarrkey123');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ['http://localhost:7878/*'],
    });
    expect(await screen.findByText('App added and ready to use.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new app/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the setup-page test to verify it fails**

Run:
```bash
npm test -- src/components/SetupPage.test.tsx
```
Expected: FAIL because `SetupPage` and the new permission helpers do not exist yet.

- [ ] **Step 3: Add shared permission helpers**
```ts
import { getOrigin } from './validators';

const getOriginPattern = (url: string): string | null => {
  const origin = getOrigin(url);
  return origin ? `${origin}/*` : null;
};

export const hasAppPermission = async (
  app: Pick<{ url: string }, 'url'>,
): Promise<boolean> => {
  const pattern = getOriginPattern(app.url);
  if (!pattern) {
    return false;
  }

  return chrome.permissions.contains({ origins: [pattern] });
};

export const requestAppPermission = async (
  app: Pick<{ url: string }, 'url'>,
): Promise<boolean> => {
  const pattern = getOriginPattern(app.url);
  if (!pattern) {
    return false;
  }

  return chrome.permissions.request({ origins: [pattern] });
};
```

- [ ] **Step 4: Refactor `AppForm` into a pure form**
```tsx
interface AppFormProps {
  app?: ArrAppWithKey | null;
  onSubmit: (app: Omit<ArrAppWithKey, 'id'>) => Promise<void> | void;
  onCancel: () => void;
  onTestConnection?: (
    app: Omit<ArrAppWithKey, 'id'>,
  ) => Promise<{ success: boolean; message: string }>;
}

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

  const result = await onTestConnection(buildAppPayload());
  setTestResult(result);
};
```

```tsx
it('submits normalized app data without requesting permissions directly', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

  await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
  await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989/');
  await user.type(screen.getByLabelText('API Key'), 'longerkey');
  await user.click(screen.getByRole('button', { name: 'Add App' }));

  expect(chrome.permissions.request).not.toHaveBeenCalled();
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'My Sonarr',
    type: 'sonarr',
    url: 'http://localhost:8989',
    apiKey: 'longerkey',
    icon: '',
  });
});
```

- [ ] **Step 5: Implement the setup-page coordinator and enrich the app list**
```tsx
import { createArrApi } from '../api/arrApi';

const SetupPage: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedAppId = searchParams.get('appId');
  const [apps, setApps] = useState<ArrAppWithKey[]>([]);
  const [editingApp, setEditingApp] = useState<ArrAppWithKey | null>(null);
  const [showForm, setShowForm] = useState(
    searchParams.get('action') === 'add' || Boolean(requestedAppId),
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  const handleSubmit = useCallback(async (appData: Omit<ArrAppWithKey, 'id'>) => {
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
  }, [editingApp, refreshApps]);

  const handleGrantPermission = useCallback(async (app: ArrAppWithKey) => {
    const granted = await requestAppPermission(app);
    await refreshApps();
    setMessage({
      type: granted ? 'success' : 'error',
      text: granted ? `${app.name} is ready to use.` : `Permission still required for ${app.name}.`,
    });
  }, [refreshApps]);

  const handleTestConnection = useCallback(async (app: Omit<ArrAppWithKey, 'id'>) => {
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
  }, []);

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

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

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
      />
    </div>
  );
};
```

```tsx
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
}

<AppForm
  app={editingApp}
  onSubmit={onSubmit}
  onCancel={onCancel}
  onTestConnection={onTestConnection}
/>

<div className="app-status">
  {permissionByAppId[app.id] ? 'Ready' : 'Permission required'}
</div>

{!permissionByAppId[app.id] && (
  <button
    className="btn btn-sm btn-primary"
    onClick={() => onGrantPermission(app)}
    title="Grant host permission"
  >
    Grant permission
  </button>
)}
```

- [ ] **Step 6: Add the setup entrypoint and page styling**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ArrExtension Setup</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import SetupPage from '../../src/components/SetupPage';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../popup/style.css';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <SetupPage />
  </React.StrictMode>,
);
```

```css
body {
  margin: 0;
  min-width: 0;
}

.setup-page-shell {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px;
}

.setup-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
```

- [ ] **Step 7: Run the setup-page tests and a production build**

Run:
```bash
npm test -- src/components/SetupPage.test.tsx src/components/AppForm.test.tsx
npm run build
```
Expected: setup-page and AppForm tests PASS, and the WXT build emits both popup and setup page assets without TypeScript errors.

- [ ] **Step 8: Commit**
```bash
git add entrypoints/setup/index.html entrypoints/setup/main.tsx entrypoints/setup/style.css src/components/AppForm.tsx src/components/AppForm.test.tsx src/components/AppSettingsPanel.tsx src/components/SetupPage.tsx src/components/SetupPage.test.tsx src/utils/appPermissions.ts
git commit -m "feat: move app setup into extension tab"
```

### Task 3: Simplify the popup and show permission-missing apps as disabled
**Files:**
- Create: `src/components/AppSwitcher.test.tsx`
- Modify: `src/components/AppSwitcher.tsx`
- Modify: `src/components/Popup.tsx`
- Modify: `src/components/SearchPanel.tsx`
- Modify: `src/hooks/useSelectedApp.ts`
- Modify: `entrypoints/popup/style.css`

- [ ] **Step 1: Write the failing popup tests**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Popup from './Popup';
import { resetStorageState } from '../test/setupTests';

describe('Popup setup handoff', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
  });

  it('opens the setup tab from the empty-state button', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(await screen.findByRole('button', { name: /add app/i }));

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/setup.html?action=add',
      active: true,
    });
    expect(screen.queryByLabelText('App Name')).not.toBeInTheDocument();
  });

  it('renders apps without permission as disabled', async () => {
    await chrome.storage.sync.set({
      arr_apps: [{ id: '1', name: 'My Sonarr', type: 'sonarr', url: 'http://localhost:8989', icon: '' }],
    });
    await chrome.storage.local.set({
      arr_api_keys: { '1': 'testapikey123' },
    });
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    render(<Popup />);

    expect(await screen.findByRole('button', { name: /switch to my sonarr/i })).toBeDisabled();
    expect(screen.getByText('Finish setup in the setup tab to grant access to this app.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the popup test to verify it fails**

Run:
```bash
npm test -- src/components/Popup.test.tsx
```
Expected: FAIL because the popup still renders the inline settings view and the switcher has no disabled state.

- [ ] **Step 3: Extend app selection state with per-app permission data**
```ts
import { hasAppPermission } from '../utils/appPermissions';

const [permissionByAppId, setPermissionByAppId] = useState<Record<string, boolean>>({});

const refreshPermissionState = useCallback(async (savedApps: ArrAppWithKey[]) => {
  const entries = await Promise.all(
    savedApps.map(async (app) => [app.id, await hasAppPermission(app)] as const),
  );
  const nextPermissions = Object.fromEntries(entries);
  setPermissionByAppId(nextPermissions);
  return nextPermissions;
}, []);

useEffect(() => {
  let isMounted = true;

  const initializePopup = async () => {
    await storage.migrateApiKeys();
    const savedApps = await storage.getArrApps();
    if (!isMounted) return;

    setApps(savedApps);
    const permissions = await refreshPermissionState(savedApps);
    const persistedId = await storage.getSelectedAppId();
    const fallbackApp = savedApps.find((app) => permissions[app.id]) ?? null;
    const initialId =
      persistedId && permissions[persistedId]
        ? persistedId
        : fallbackApp?.id ?? null;

    setSelectedAppId(initialId);
    await storage.setSelectedAppId(initialId);
  };

  void initializePopup();
  return () => {
    isMounted = false;
  };
}, [refreshPermissionState]);
```

- [ ] **Step 4: Update the switcher and search panel to expose the disabled state**
```tsx
interface AppSwitcherProps {
  apps: ArrAppWithKey[];
  selectedApp: ArrAppWithKey | null;
  disabledAppIds: Set<string>;
  onAppSelect: (app: ArrAppWithKey) => void;
}

{apps.map((app) => {
  const disabled = disabledAppIds.has(app.id);

  return (
    <button
      key={app.id}
      className={`app-icon ${selectedApp?.id === app.id ? 'active' : ''}`}
      onClick={() => onAppSelect(app)}
      title={disabled ? `${app.name} requires setup` : app.name}
      aria-label={`Switch to ${app.name}`}
      disabled={disabled}
    >
      {getAppIcon(app.type)}
    </button>
  );
})}
```

```tsx
{apps.length > 0 && !selectedApp && (
  <div className="message error">
    Finish setup in the setup tab to grant access to this app.
  </div>
)}
```

```css
.app-icon:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Replace the popup settings view with setup-tab handoff**
```tsx
import { openSetupPage } from '../utils/openSetupPage';

type ViewState = 'search' | 'add';

const handleSettingsClick = useCallback(() => {
  void openSetupPage();
}, []);

<SearchPanel
  apps={apps}
  selectedApp={selectedApp}
  disabledAppIds={new Set(
    apps.filter((app) => !permissionByAppId[app.id]).map((app) => app.id),
  )}
  onSelectApp={selectApp}
  query={query}
  onQueryChange={setQuery}
  allResults={allResults}
  filteredResults={filteredResults}
  filters={filters}
  filterOptions={filterOptions}
  onFiltersChange={setFilters}
  loading={loading}
  error={error}
  addedIds={addedItems}
  onResultClick={handleResultClick}
  onAddAppClick={() => void openSetupPage('?action=add')}
/>
```

Remove the inline `AppSettingsPanel` branch, `editingApp`, `showAddAppForm`, `handleAppFormSubmit`, `handleDeleteApp`, and other popup-only settings handlers. The popup should no longer own app-management state.

- [ ] **Step 6: Run the popup tests and the full unit suite**

Run:
```bash
npm test -- src/components/AppSwitcher.test.tsx src/components/Popup.test.tsx
npm test
```
Expected: the new popup behavior tests PASS and the rest of the unit suite remains green after removing popup settings logic.

- [ ] **Step 7: Commit**
```bash
git add entrypoints/popup/style.css src/components/AppSwitcher.tsx src/components/AppSwitcher.test.tsx src/components/Popup.tsx src/components/SearchPanel.tsx src/hooks/useSelectedApp.ts
git commit -m "refactor: launch setup tab from popup"
```

### Task 4: Rewrite split-surface integration and E2E coverage
**Files:**
- Create: `src/components/SetupPage.integration.test.tsx`
- Modify: `src/components/Popup.integration.test.tsx`
- Modify: `tests/e2e/popup.spec.ts`

- [ ] **Step 1: Add integration coverage for the setup page**
```tsx
it('retries permission grant from the saved app row', async () => {
  const user = userEvent.setup();
  (chrome.permissions.request as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);

  render(<SetupPage />);

  await user.click(screen.getByRole('button', { name: /add new app/i }));
  await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
  await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989');
  await user.type(screen.getByLabelText('API Key'), 'testapikey123');
  await user.click(screen.getByRole('button', { name: /add app/i }));

  await user.click(await screen.findByRole('button', { name: /grant permission/i }));

  expect(await screen.findByText('My Sonarr is ready to use.')).toBeInTheDocument();
  expect(screen.getByText('Ready')).toBeInTheDocument();
});
```

- [ ] **Step 2: Update popup integration tests for tab handoff**
```tsx
it('opens the setup tab from the settings button', async () => {
  const user = userEvent.setup();
  render(<Popup />);

  await user.click(await screen.findByRole('button', { name: 'Open settings' }));

  expect(chrome.tabs.create).toHaveBeenCalledWith({
    url: 'chrome-extension://test/setup.html',
    active: true,
  });
});
```

- [ ] **Step 3: Update the Playwright flow to assert the popup-to-setup handoff**
```ts
test('4 — open setup tab from popup empty state', async () => {
  const [setupPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: /add app/i }).click(),
  ]);

  await setupPage.waitForLoadState('domcontentloaded');
  await expect(setupPage).toHaveURL(/setup\.html\?action=add$/);
  await expect(
    setupPage.getByRole('heading', { name: /arrextension setup/i }),
  ).toBeVisible();
});
```

Replace the old E2E steps that expected settings to remain inside the popup and that reopened the popup after permission dialogs during app creation.

- [ ] **Step 4: Run focused integration tests and the Playwright suite**

Run:
```bash
npm test -- src/components/SetupPage.integration.test.tsx src/components/Popup.integration.test.tsx
npm run test:e2e -- tests/e2e/popup.spec.ts
```
Expected: integration tests PASS, and the Playwright popup flow now validates opening `setup.html` instead of reopening the popup after add/edit.

- [ ] **Step 5: Commit**
```bash
git add src/components/Popup.integration.test.tsx src/components/SetupPage.integration.test.tsx tests/e2e/popup.spec.ts
git commit -m "test: cover setup tab handoff"
```
