# Storage & Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split API keys into local storage, migrate legacy data safely, and reduce permissions to least privilege with version sync.

**Architecture:** Storage module becomes the split-brain: sync for app metadata, local for API keys and cached state. WXT manifest uses optional host permissions and reads version from package.json.

**Tech Stack:** TypeScript, Chrome storage API, WXT manifest config.

---
### Task 1: Split API keys and add migration
**Files:**
- Modify: [src/utils/storage.ts](src/utils/storage.ts)
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)

- [ ] **Step 1: Update storage keys and add API key helpers**
```ts
const STORAGE_KEYS = {
  ARR_APPS: 'arr_apps',
  ARR_API_KEYS: 'arr_api_keys',
  SELECTED_TEXT: 'selected_text',
  LAST_USED_OPTIONS: 'last_used_options',
  ARR_METADATA: 'arr_metadata',
} as const;

type StoredArrApp = Omit<ArrApp, 'apiKey'>;

const readApiKeys = async (): Promise<Record<string, string>> => {
  const result = await chrome.storage.local.get([STORAGE_KEYS.ARR_API_KEYS]);
  return result[STORAGE_KEYS.ARR_API_KEYS] || {};
};

const writeApiKeys = async (keys: Record<string, string>): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEYS.ARR_API_KEYS]: keys });
};
```

- [ ] **Step 2: Split read/write paths for apps**
```ts
async getArrApps(): Promise<ArrApp[]> {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.ARR_APPS]);
  const storedApps: StoredArrApp[] = result[STORAGE_KEYS.ARR_APPS] || [];
  const apiKeys = await readApiKeys();

  return storedApps.map(app => ({
    ...app,
    apiKey: apiKeys[app.id] || ''
  }));
},

async saveArrApps(apps: ArrApp[]): Promise<void> {
  const apiKeys = await readApiKeys();
  const nextKeys = { ...apiKeys };

  apps.forEach(app => {
    if (app.apiKey) {
      nextKeys[app.id] = app.apiKey;
    }
  });

  const storedApps: StoredArrApp[] = apps.map(({ apiKey, ...rest }) => rest);
  await writeApiKeys(nextKeys);
  await chrome.storage.sync.set({ [STORAGE_KEYS.ARR_APPS]: storedApps });
},

async removeArrApp(appId: string): Promise<void> {
  const apps = await this.getArrApps();
  const filteredApps = apps.filter(app => app.id !== appId);
  await this.saveArrApps(filteredApps);

  const apiKeys = await readApiKeys();
  if (apiKeys[appId]) {
    delete apiKeys[appId];
    await writeApiKeys(apiKeys);
  }
},
```

- [ ] **Step 3: Add migration for legacy synced API keys**
```ts
async migrateApiKeys(): Promise<void> {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.ARR_APPS]);
  const legacyApps = (result[STORAGE_KEYS.ARR_APPS] || []) as ArrApp[];

  const hasLegacyKeys = legacyApps.some(app => 'apiKey' in app && app.apiKey);
  if (!hasLegacyKeys) {
    return;
  }

  const nextKeys = await readApiKeys();
  const sanitizedApps: StoredArrApp[] = legacyApps.map(app => {
    if (app.apiKey) {
      nextKeys[app.id] = app.apiKey;
    }
    const { apiKey, ...rest } = app;
    return rest;
  });

  await writeApiKeys(nextKeys);
  await chrome.storage.sync.set({ [STORAGE_KEYS.ARR_APPS]: sanitizedApps });
},
```

- [ ] **Step 4: Run migration during popup init**
```tsx
const initializePopup = async () => {
  try {
    await storage.migrateApiKeys();
    const savedApps = await storage.getArrApps();
    // remaining init logic stays the same
```

- [ ] **Step 5: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 6: Commit**
```bash
git add src/utils/storage.ts src/components/Popup.tsx
git commit -m "feat: split api keys to local storage with migration"
```

### Task 2: Reduce permissions and sync manifest version
**Files:**
- Modify: [wxt.config.ts](wxt.config.ts)
- Modify: [package.json](package.json)

- [ ] **Step 1: Read version from package.json and tighten permissions**
```ts
import { defineConfig } from 'wxt';
import pkg from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ArrExtension',
    description: 'Search and add media to your *arr applications.',
    version: pkg.version,
    permissions: [
      'storage',
      'contextMenus'
    ],
    optional_host_permissions: [
      '*://*/*'
    ],
    action: {
      default_popup: 'popup.html',
      default_title: 'ArrExtension'
    },
    icons: {
      16: 'arr16x16.png',
      32: 'arr32x32.png',
      48: 'arr48x48.png',
      128: 'arr128x128.png'
    }
  }
});
```

- [ ] **Step 2: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add wxt.config.ts
git commit -m "chore: use optional host permissions and sync version"
```
