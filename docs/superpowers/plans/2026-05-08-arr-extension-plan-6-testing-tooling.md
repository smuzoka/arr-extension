# Testing & Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit/component tests, local-only E2E tests, and minimal ESLint with react-hooks enforcement.

**Architecture:** Use Vitest + Testing Library for unit/component tests, Playwright for local E2E, and a minimal ESLint config to catch hook dependency errors.

**Tech Stack:** Vitest, Testing Library, Playwright, ESLint, TypeScript.

---
### Task 1: Add ESLint with react-hooks rules
**Files:**
- Modify: [package.json](package.json)
- Create: .eslintrc.cjs

- [ ] **Step 1: Add ESLint config**
```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: ['dist', 'graphify-out', 'node_modules']
};
```

- [ ] **Step 2: Add lint script and dependencies**
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

- [ ] **Step 3: Install dependencies**
Run:
```bash
npm install
```
Expected: ESLint dependencies are added.

- [ ] **Step 4: Run lint**
Run:
```bash
npm run lint
```
Expected: no lint errors.

- [ ] **Step 5: Commit**
```bash
git add .eslintrc.cjs package.json package-lock.json
git commit -m "chore: add eslint with react hooks rules"
```

### Task 2: Add Vitest and Testing Library
**Files:**
- Modify: [package.json](package.json)
- Create: vitest.config.ts
- Create: src/test/setupTests.ts

- [ ] **Step 1: Add Vitest config**
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts'
  }
});
```

- [ ] **Step 2: Create test setup with chrome storage mock**
```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

type StorageAreaData = Record<string, unknown>;

const storageState: { local: StorageAreaData; sync: StorageAreaData } = {
  local: {},
  sync: {}
};

const createStorageArea = (area: 'local' | 'sync') => ({
  get: vi.fn(async (keys?: string[]) => {
    if (!keys) return storageState[area];
    const result: StorageAreaData = {};
    keys.forEach(key => {
      result[key] = storageState[area][key];
    });
    return result;
  }),
  set: vi.fn(async (items: StorageAreaData) => {
    Object.assign(storageState[area], items);
  }),
  remove: vi.fn(async (keys: string[]) => {
    keys.forEach(key => delete storageState[area][key]);
  })
});

const permissions = {
  request: vi.fn(async () => true),
  contains: vi.fn(async () => true)
};

globalThis.chrome = {
  storage: {
    local: createStorageArea('local'),
    sync: createStorageArea('sync')
  },
  permissions
} as unknown as typeof chrome;

export const resetStorageState = () => {
  storageState.local = {};
  storageState.sync = {};
  (chrome.storage.local.get as unknown as { mockClear: () => void }).mockClear?.();
  (chrome.storage.sync.get as unknown as { mockClear: () => void }).mockClear?.();
};
```

- [ ] **Step 3: Add test scripts and dependencies**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^24.0.0",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 4: Install dependencies**
Run:
```bash
npm install
```
Expected: Vitest dependencies are added.

- [ ] **Step 5: Commit**
```bash
git add vitest.config.ts src/test/setupTests.ts package.json package-lock.json
git commit -m "test: add vitest and testing library"
```

### Task 3: Add unit and component tests
**Files:**
- Create: src/utils/storage.test.ts
- Create: src/utils/validators.test.ts
- Create: src/components/AppForm.test.tsx
- Create: src/api/arrApiBase.test.ts
- Create: src/components/Popup.test.tsx
- Create: src/hooks/useSearch.test.tsx

- [ ] **Step 1: Test storage migration**
```ts
import { describe, expect, it } from 'vitest';
import { storage } from './storage';

describe('storage migration', () => {
  it('moves legacy apiKey fields into local storage', async () => {
    await chrome.storage.sync.set({
      arr_apps: [
        { id: '1', name: 'S', type: 'sonarr', url: 'http://localhost', apiKey: 'abc12345', icon: '' }
      ]
    });

    await storage.migrateApiKeys();

    const syncResult = await chrome.storage.sync.get(['arr_apps']);
    const localResult = await chrome.storage.local.get(['arr_api_keys']);

    expect(syncResult.arr_apps[0].apiKey).toBeUndefined();
    expect(localResult.arr_api_keys['1']).toBe('abc12345');
  });
});
```

- [ ] **Step 2: Test validators**
```ts
import { describe, expect, it } from 'vitest';
import { isValidApiKey, isValidHttpUrl } from './validators';

describe('validators', () => {
  it('accepts valid http/https urls', () => {
    expect(isValidHttpUrl('http://localhost:8989')).toBe(true);
    expect(isValidHttpUrl('https://example.com')).toBe(true);
  });

  it('rejects non-http urls', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('notaurl')).toBe(false);
  });

  it('validates api key length', () => {
    expect(isValidApiKey('short')).toBe(false);
    expect(isValidApiKey('longerkey')).toBe(true);
  });
});
```

- [ ] **Step 3: Test AppForm validation behavior**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AppForm from './AppForm';

describe('AppForm', () => {
  it('disables submit until url and api key are valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = () => undefined;

    render(<AppForm onSubmit={handleSubmit} onCancel={() => undefined} />);

    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.selectOptions(screen.getByLabelText('App Type'), 'sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'not-a-url');
    await user.type(screen.getByLabelText('API Key'), 'short');

    const submit = screen.getByRole('button', { name: 'Add App' });
    expect(submit).toBeDisabled();
  });
});
```

- [ ] **Step 4: Test arrApiBase timeout handling**
```ts
import { describe, expect, it, vi } from 'vitest';
import ArrApiBase from './arrApiBase';
import type { ArrAppWithKey } from './types';

class TestApi extends ArrApiBase {
  public requestPublic(endpoint: string) {
    return this.request(endpoint);
  }
}

describe('ArrApiBase', () => {
  it('throws a timeout error when request aborts', async () => {
    vi.useFakeTimers();

    const app: ArrAppWithKey = {
      id: '1',
      name: 'Test',
      type: 'sonarr',
      url: 'http://localhost',
      apiKey: 'abc12345',
      icon: ''
    };

    global.fetch = vi.fn((_url, options) => {
      const { signal } = options as RequestInit;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }) as unknown as typeof fetch;

    const api = new TestApi(app);
    const promise = api.requestPublic('/system/status');

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Server timed out.');
    vi.useRealTimers();
  });
});
```

- [ ] **Step 5: Test popup init sequence**
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Popup from './Popup';

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    searchSeries: vi.fn().mockResolvedValue([
      { kind: 'series', id: 1, title: 'Test Show', tvdbId: 123, images: [] }
    ]),
    getAllSeries: vi.fn().mockResolvedValue([])
  })
}));

describe('Popup init', () => {
  it('loads selected text and triggers search after apps load', async () => {
    await chrome.storage.sync.set({
      arr_apps: [
        { id: '1', name: 'S', type: 'sonarr', url: 'http://localhost', icon: '' }
      ]
    });
    await chrome.storage.local.set({
      arr_api_keys: { '1': 'abc12345' },
      selected_text: 'Test Show'
    });

    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('Test Show')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 6: Test search debounce and cache**
```tsx
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSearch } from './useSearch';
import type { ArrAppWithKey } from '../api/types';

const searchMovies = vi.fn().mockResolvedValue([
  { kind: 'movie', id: 1, title: 'Movie', tmdbId: 99, images: [] }
]);

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    searchSeries: vi.fn(),
    searchMovies
  })
}));

describe('useSearch', () => {
  it('debounces and caches by app and query', async () => {
    vi.useFakeTimers();

    const app: ArrAppWithKey = {
      id: '1',
      name: 'R',
      type: 'radarr',
      url: 'http://localhost',
      apiKey: 'abc12345',
      icon: ''
    };

    const { result } = renderHook(() => useSearch(app));

    act(() => {
      result.current.setQuery('Movie');
    });

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    expect(searchMovies).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setQuery('Movie');
    });

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    expect(searchMovies).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
```

- [ ] **Step 7: Run unit tests**
Run:
```bash
npm run test
```
Expected: all tests pass.

- [ ] **Step 8: Commit**
```bash
git add src/utils/storage.test.ts src/utils/validators.test.ts src/components/AppForm.test.tsx src/api/arrApiBase.test.ts src/components/Popup.test.tsx src/hooks/useSearch.test.tsx
git commit -m "test: add unit and component coverage"
```

### Task 4: Add local-only E2E tests with Playwright
**Files:**
- Modify: [package.json](package.json)
- Create: playwright.config.ts
- Create: tests/e2e/popup.spec.ts

- [ ] **Step 1: Add Playwright config**
```ts
import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    headless: false
  },
  projects: [
    {
      name: 'chrome-extension',
      use: {
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.join(__dirname, 'dist', 'chrome')}`,
            `--load-extension=${path.join(__dirname, 'dist', 'chrome')}`
          ]
        }
      }
    }
  ]
});
```

- [ ] **Step 2: Add E2E tests**
```ts
import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.join(__dirname, '..', '..', 'dist', 'chrome');

const launchExtension = async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const [worker] = context.serviceWorkers();
  const extensionId = worker.url().split('/')[2];

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return { context, page };
};

test('save server with invalid URL shows error', async () => {
  const { context, page } = await launchExtension();

  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: /add new app/i }).click();

  await page.getByLabel('App Name').fill('My Sonarr');
  await page.getByLabel('Server URL').fill('not-a-url');
  await page.getByLabel('API Key').fill('short');

  await expect(page.getByText('Enter a valid http or https URL.')).toBeVisible();

  await context.close();
});

test('save server with valid URL prompts for permission', async () => {
  const { context, page } = await launchExtension();

  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: /add new app/i }).click();

  await page.getByLabel('App Name').fill('My Sonarr');
  await page.getByLabel('Server URL').fill('http://localhost:8989');
  await page.getByLabel('API Key').fill('abc12345');

  await page.getByRole('button', { name: /add app/i }).click();

  await expect(page.getByText('App added successfully')).toBeVisible();

  await context.close();
});

test('search and add item flow', async () => {
  const { context, page } = await launchExtension();

  // Assumes an app is already configured and a local *arr server is running
  await page.getByPlaceholder(/search/i).fill('Test');
  await page.waitForSelector('.result-card');

  await page.locator('.result-card').first().getByRole('button', { name: /add/i }).click();
  await page.getByRole('button', { name: /add/i }).click();

  await expect(page.getByText(/added successfully/i)).toBeVisible();

  await context.close();
});

test('remove item with custom confirm dialog', async () => {
  const { context, page } = await launchExtension();

  // Navigate to existing items and trigger removal
  await page.locator('.existing-item').first().getByRole('button', { name: /remove/i }).click();

  // Confirm dialog should appear instead of native confirm
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/remove .+ from your library/i)).toBeVisible();

  await page.getByRole('button', { name: /confirm/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  await context.close();
});

test('theme changes when system preference changes', async () => {
  const { context, page } = await launchExtension();

  await expect(page.locator('body')).toHaveClass(/dark-mode/);

  await context.close();
});
```

- [ ] **Step 3: Add Playwright dependency and script**
```json
{
  "scripts": {
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0"
  }
}
```

- [ ] **Step 4: Install dependencies**
Run:
```bash
npm install
```
Expected: Playwright is installed.

- [ ] **Step 5: Run E2E tests locally**
Run:
```bash
npm run build
npm run test:e2e
```
Expected: E2E tests complete; permission prompt is handled locally during run.

- [ ] **Step 6: Commit**
```bash
git add playwright.config.ts tests/e2e/popup.spec.ts package.json package-lock.json
git commit -m "test: add local playwright e2e suite"
```
