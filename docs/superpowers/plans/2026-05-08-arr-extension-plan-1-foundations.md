# Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix popup init race, add URL/API key validation, and enforce host permission requests when saving apps.

**Architecture:** Add a shared validators utility for URL and API key checks, then use it in the app settings form before saving. Centralize popup initialization so apps and selected text load deterministically before triggering search.

**Tech Stack:** React, TypeScript, WXT, Chrome permissions API.

---
### Task 1: Add shared validators
**Files:**
- Create: src/utils/validators.ts

- [ ] **Step 1: Create validators module**
```ts
export const MIN_API_KEY_LENGTH = 8;

export const normalizeUrl = (value: string): string =>
  value.trim().replace(/\/$/, '');

export const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidApiKey = (value: string): boolean =>
  value.trim().length >= MIN_API_KEY_LENGTH;

export const getOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
```

- [ ] **Step 2: Verify TypeScript builds**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add src/utils/validators.ts
git commit -m "feat: add shared url and api key validators"
```

### Task 2: Validate app settings and request permissions
**Files:**
- Modify: [src/components/AppForm.tsx](src/components/AppForm.tsx)

- [ ] **Step 1: Add validation helpers and derived state**
```tsx
import {
  getOrigin,
  isValidApiKey,
  isValidHttpUrl,
  normalizeUrl,
  MIN_API_KEY_LENGTH
} from '../utils/validators';

const [formError, setFormError] = useState<string | null>(null);

const urlError = url && !isValidHttpUrl(url)
  ? 'Enter a valid http or https URL.'
  : null;

const apiKeyError = apiKey && !isValidApiKey(apiKey)
  ? `API key must be at least ${MIN_API_KEY_LENGTH} characters.`
  : null;

const isFormValid =
  Boolean(name.trim()) &&
  Boolean(type) &&
  !urlError &&
  !apiKeyError;
```

- [ ] **Step 2: Gate save on permission request and show inline errors**
```tsx
const requestOriginPermission = async (rawUrl: string): Promise<boolean> => {
  const origin = getOrigin(rawUrl);
  if (!origin) {
    return false;
  }
  return chrome.permissions.request({ origins: [`${origin}/*`] });
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError(null);

  if (!isFormValid) {
    setFormError('Fix validation errors before saving.');
    return;
  }

  const normalizedUrl = normalizeUrl(url);
  const granted = await requestOriginPermission(normalizedUrl);

  if (!granted) {
    setFormError('Permission denied for this server origin.');
    return;
  }

  onSubmit({
    name: name.trim(),
    type,
    url: normalizedUrl,
    apiKey,
    icon: ''
  });
};
```

```tsx
{formError && <div className="error">{formError}</div>}

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
</div>

<button type="submit" className="button" disabled={!isFormValid}>
  {app ? 'Update App' : 'Add App'}
</button>
```

- [ ] **Step 3: Manual verification**
Run:
```bash
npm run dev
```
Expected: dev server starts; in the popup, invalid URLs show inline errors and the save button remains disabled.

- [ ] **Step 4: Commit**
```bash
git add src/components/AppForm.tsx
git commit -m "feat: validate app form and request host permission"
```

### Task 3: Fix popup init race
**Files:**
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)

- [ ] **Step 1: Replace split initialization with a single async initializer**
```tsx
useEffect(() => {
  let isMounted = true;

  const initializePopup = async () => {
    try {
      const savedApps = await storage.getArrApps();
      if (!isMounted) return;

      setApps(savedApps);
      const initialApp = savedApps[0] ?? null;
      setSelectedApp(initialApp);

      if (initialApp) {
        await loadExistingItems(initialApp);
      }

      const text = await storage.getSelectedText();
      if (!isMounted) return;

      if (text) {
        setSearchTerm(text);
      }
    } catch {
      setError('Failed to load configured apps');
    }
  };

  initializePopup();
  return () => {
    isMounted = false;
  };
}, []);

useEffect(() => {
  if (selectedApp && searchTerm) {
    performSearch(searchTerm, selectedApp);
  }
}, [selectedApp, searchTerm]);

const handleSearch = (term: string) => {
  setSearchTerm(term);
};
```

- [ ] **Step 2: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/Popup.tsx
git commit -m "fix: stabilize popup init sequence"
```
