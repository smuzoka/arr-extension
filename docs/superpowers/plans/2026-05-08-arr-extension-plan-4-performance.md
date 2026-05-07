# Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix request timeout cleanup, add caching for search and existing items, reduce rerenders, and lazily load images.

**Architecture:** Improve the API base request flow with a finally cleanup, cache existing items in local storage, and memoize callbacks and search results where possible.

**Tech Stack:** React, TypeScript.

---
### Task 1: Fix request timeout cleanup and error mapping
**Files:**
- Modify: [src/api/arrApiBase.ts](src/api/arrApiBase.ts)

- [ ] **Step 1: Wrap timeouts in a try/finally and map errors**
```ts
protected async request(endpoint: string, options: RequestInit = {}) {
  const url = `${this.app.url}/api/v3${endpoint}`;
  const appContext = `${this.app.type}:${this.app.name}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    this.REQUEST_TIMEOUT,
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'X-Api-Key': this.app.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error('Invalid API key.');
    }

    if (!response.ok) {
      throw new Error('Unable to connect. Check your URL.');
    }

    try {
      return await response.json();
    } catch {
      throw new Error(`${appContext} returned invalid JSON.`);
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Unable to connect. Check your URL.');
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Server timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

- [ ] **Step 2: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add src/api/arrApiBase.ts
git commit -m "fix: cleanup request timeouts and map errors"
```

### Task 2: Cache existing items per app (local storage)
**Files:**
- Modify: [src/utils/storage.ts](src/utils/storage.ts)
- Modify: src/hooks/useExistingItems.ts

- [ ] **Step 1: Add existing items cache helpers**
```ts
export interface CachedExistingItems {
  items: SearchResult[];
  timestamp: number;
}

const STORAGE_KEYS = {
  ARR_APPS: 'arr_apps',
  ARR_API_KEYS: 'arr_api_keys',
  SELECTED_TEXT: 'selected_text',
  SELECTED_APP_ID: 'selected_app_id',
  LAST_USED_OPTIONS: 'last_used_options',
  ARR_METADATA: 'arr_metadata',
  ARR_EXISTING_ITEMS: 'arr_existing_items',
} as const;

async getExistingItems(appId: string): Promise<CachedExistingItems | null> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.ARR_EXISTING_ITEMS]);
  const allItems = result[STORAGE_KEYS.ARR_EXISTING_ITEMS] || {};
  return allItems[appId] || null;
},

async saveExistingItems(appId: string, items: SearchResult[]): Promise<void> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.ARR_EXISTING_ITEMS]);
  const allItems = result[STORAGE_KEYS.ARR_EXISTING_ITEMS] || {};
  allItems[appId] = {
    items,
    timestamp: Date.now()
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.ARR_EXISTING_ITEMS]: allItems });
},
```

- [ ] **Step 2: Use cached existing items with background refresh**
```ts
import { storage } from '../utils/storage';

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!app) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const api = createArrApi(app);
      const nextItems = app.type === 'sonarr'
        ? await api.getAllSeries()
        : await api.getAllMovies();

      setItems(nextItems);
      await storage.saveExistingItems(app.id, nextItems);
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!app) {
        setItems([]);
        return;
      }

      const cached = await storage.getExistingItems(app.id);
      if (cached && isMounted) {
        setItems(cached.items);
      }

      await refresh();
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [app, refresh]);

  // existingIds calculation unchanged
```

- [ ] **Step 3: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/utils/storage.ts src/hooks/useExistingItems.ts
git commit -m "perf: cache existing items per app"
```

### Task 3: Cache search results and stabilize callbacks
**Files:**
- Modify: src/hooks/useSearch.ts
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)

- [ ] **Step 1: Add in-memory search cache**
```ts
const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

useEffect(() => {
  if (!app || !query.trim()) {
    setResults([]);
    setLoading(false);
    return;
  }

  const cacheKey = `${app.id}:${query.trim().toLowerCase()}`;
  const cached = cacheRef.current.get(cacheKey);

  if (cached) {
    setResults(cached);
  }

  window.clearTimeout(debounceRef.current);
  debounceRef.current = window.setTimeout(async () => {
    const currentSearchId = ++searchIdRef.current;
    setLoading(true);
    setError(null);
    setFilters(DEFAULT_FILTERS);

    try {
      const api = createArrApi(app);
      const nextResults = app.type === 'sonarr'
        ? await api.searchSeries(query)
        : await api.searchMovies(query);

      if (currentSearchId === searchIdRef.current) {
        cacheRef.current.set(cacheKey, nextResults);
        setResults(nextResults);
      }
    } catch (err) {
      if (currentSearchId === searchIdRef.current) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setLoading(false);
      }
    }
  }, 300);

  return () => window.clearTimeout(debounceRef.current);
}, [app, query]);
```

- [ ] **Step 2: Use useCallback for handlers passed to panels**
```tsx
const handleResultClick = useCallback((result: SearchResult) => {
  setSelectedResult(result);
  setViewState('add');
}, []);

const handleAddSuccess = useCallback(async () => {
  await refresh();
  setViewState('search');
  setSelectedResult(null);
}, [refresh]);

const handleDeleteApp = useCallback(async (appId: string) => {
  const remaining = apps.filter(app => app.id !== appId);
  await saveApps(remaining);
  showMessage('success', 'App deleted successfully');
}, [apps, saveApps]);
```

- [ ] **Step 3: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/hooks/useSearch.ts src/components/Popup.tsx
git commit -m "perf: cache search results and memoize callbacks"
```

### Task 4: Lazy-load poster images
**Files:**
- Modify: [src/components/ResultCard.tsx](src/components/ResultCard.tsx)

> **Note:** This task defines an inline placeholder fallback. Plan 5 Task 1 will later extract it into a shared `PLACEHOLDER_POSTER` constant.

- [ ] **Step 1: Add lazy loading to poster**
```tsx
const FALLBACK_POSTER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCA2MCA5MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMCA0NUwyNSAzNUwzNSA0NUw0MCAzNUw0NSA0NUw0MCA1NUwzNSA0NUwyNSA1NUwyMCA0NVoiIGZpbGw9IiNkMWQ1ZGIiLz4KPC9zdmc+';

<img
  src={posterUrl}
  alt={result.title}
  className="result-image"
  loading="lazy"
  onError={(e) => {
    const img = e.currentTarget;
    if (img.src !== result.remotePoster && result.remotePoster) {
      img.src = result.remotePoster;
    } else {
      img.src = FALLBACK_POSTER;
    }
  }}
/>
```

- [ ] **Step 2: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/ResultCard.tsx
git commit -m "perf: lazy load result posters"
```
