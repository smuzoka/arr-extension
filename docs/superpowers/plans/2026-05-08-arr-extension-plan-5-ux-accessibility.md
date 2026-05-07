# UX & Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve accessibility, add missing controls, unify placeholders, and replace native confirm dialogs.

**Architecture:** Extend existing components with focused UX enhancements while keeping state in the popup coordinator.

**Tech Stack:** React, TypeScript, CSS.

---
### Task 1: Add monitored toggle and unify placeholder images
**Files:**
- Modify: [src/components/AddItemForm.tsx](src/components/AddItemForm.tsx)
- Modify: [src/components/ResultCard.tsx](src/components/ResultCard.tsx)

- [ ] **Step 1: Add monitored checkbox to the form**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <input
    type="checkbox"
    id="monitored"
    checked={monitored}
    onChange={(e) => setMonitored(e.target.checked)}
  />
  <label htmlFor="monitored" style={{ fontSize: '12px' }}>
    Monitored
  </label>
</div>
```

- [ ] **Step 2: Centralize the poster placeholder constant**
```tsx
const PLACEHOLDER_POSTER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCA2MCA5MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMCA0NUwyNSAzNUwzNSA0NUw0MCAzNUw0NSA0NUw0MCA1NUwzNSA0NUwyNSA1NUwyMCA0NVoiIGZpbGw9IiNkMWQ1ZGIiLz4KPC9zdmc+';

const getPosterUrl = () => {
  if (result.images && Array.isArray(result.images) && result.images.length > 0) {
    const posterImage = result.images.find(img =>
      img.coverType?.toLowerCase() === 'poster' ||
      img.coverType?.toLowerCase() === 'posters'
    );
    if (posterImage?.url) {
      return posterImage.url;
    }
  }

  if (result.remotePoster) {
    return result.remotePoster;
  }

  return PLACEHOLDER_POSTER;
};
```

- [ ] **Step 3: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/AddItemForm.tsx src/components/ResultCard.tsx
git commit -m "feat: add monitored toggle and shared poster placeholder"
```

### Task 2: Replace onKeyPress and add aria-labels
**Files:**
- Modify: [src/components/SearchBar.tsx](src/components/SearchBar.tsx)
- Modify: [src/components/AppSwitcher.tsx](src/components/AppSwitcher.tsx)
- Modify: [src/components/ResultCard.tsx](src/components/ResultCard.tsx)
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)

- [ ] **Step 1: Replace onKeyPress with onKeyDown**
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    onChange(localValue);
  }
};

<input
  type="text"
  className="search-input"
  value={localValue}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  placeholder={placeholder}
  autoFocus
/>
```

- [ ] **Step 2: Add aria-labels to icon-only buttons**
```tsx
<button
  className={`app-icon ${selectedApp?.id === app.id ? 'active' : ''}`}
  onClick={() => onAppSelect(app)}
  title={app.name}
  aria-label={`Switch to ${app.name}`}
>
  {getAppIcon(app.type)}
</button>
```

```tsx
<button
  className="add-button"
  aria-label={`Add ${result.title}`}
  onClick={(e) => {
    e.stopPropagation();
    onClick();
  }}
>
  <AddIcon />
</button>
```

```tsx
<button
  className="theme-toggle-btn"
  onClick={toggleTheme}
  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
>
  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
</button>

<button
  className="settings-btn"
  onClick={() => setViewState('settings')}
  aria-label="Open settings"
>
  <SettingsIcon />
</button>

<button
  className="back-btn"
  onClick={() => setViewState('search')}
  aria-label="Back to search"
>
  <CloseIcon />
</button>
```

- [ ] **Step 3: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/SearchBar.tsx src/components/AppSwitcher.tsx src/components/ResultCard.tsx src/components/Popup.tsx
git commit -m "a11y: replace onKeyPress and add aria labels"
```

### Task 3: Add system theme listener and custom confirm dialog
**Files:**
- Modify: src/hooks/useTheme.ts
- Create: src/components/ConfirmDialog.tsx
- Modify: [src/components/Popup.tsx](src/components/Popup.tsx)
- Modify: [entrypoints/popup/style.css](entrypoints/popup/style.css)

- [ ] **Step 1: Update useTheme to follow system preference when unset**
```ts
type ThemePreference = 'system' | 'light' | 'dark';

export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('themePreference');
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (preference === 'light' || preference === 'dark') {
      return preference;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (preference === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (event: MediaQueryListEvent) => {
        setTheme(event.matches ? 'dark' : 'light');
      };
      setTheme(media.matches ? 'dark' : 'light');
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
  }, [preference]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('themePreference', preference);
  }, [theme, preference]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setPreference(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme, setPreference };
};
```

- [ ] **Step 2: Add confirm dialog component**
```tsx
import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog-card">
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
```

- [ ] **Step 3: Wire confirm dialog into app deletion and item removal**
```tsx
import ConfirmDialog from './ConfirmDialog';

const [confirmState, setConfirmState] = useState<{
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
} | null>(null);

const openConfirm = (title: string, message: string, onConfirm: () => Promise<void> | void) => {
  setConfirmState({ title, message, onConfirm });
};

const handleConfirm = async () => {
  if (!confirmState) return;
  await confirmState.onConfirm();
  setConfirmState(null);
};

const handleCancelConfirm = () => setConfirmState(null);

const handleDeleteApp = useCallback((appId: string) => {
  openConfirm('Delete app', 'Are you sure you want to delete this app?', async () => {
    const remaining = apps.filter(app => app.id !== appId);
    await saveApps(remaining);
    showMessage('success', 'App deleted successfully');
  });
}, [apps, saveApps]);

const handleRemoveExisting = useCallback((item: SearchResult) => {
  openConfirm('Remove item', `Remove ${item.title} from your library?`, async () => {
    if (!selectedApp) return;
    const api = createArrApi(selectedApp);
    if (selectedApp.type === 'sonarr' && item.kind === 'series') {
      await api.request(`/series/${item.id}`, { method: 'DELETE' });
    }
    if (selectedApp.type === 'radarr' && item.kind === 'movie') {
      await api.request(`/movie/${item.id}`, { method: 'DELETE' });
    }
    await refresh();
  });
}, [refresh, selectedApp]);

<ConfirmDialog
  open={Boolean(confirmState)}
  title={confirmState?.title ?? ''}
  message={confirmState?.message ?? ''}
  onConfirm={handleConfirm}
  onCancel={handleCancelConfirm}
/>
```

- [ ] **Step 4: Add dialog styles**
```css
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: color-mix(in oklch, var(--background) 80%, black 20%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-card {
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  width: 320px;
  box-shadow: 0 8px 24px color-mix(in oklch, black 30%, transparent);
}

.dialog-title {
  margin: 0 0 8px;
  font-size: 16px;
}

.dialog-message {
  margin: 0 0 16px;
  font-size: 13px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

- [ ] **Step 5: Verify build**
Run:
```bash
npm run build
```
Expected: build completes without TypeScript errors.

- [ ] **Step 6: Commit**
```bash
git add src/hooks/useTheme.ts src/components/ConfirmDialog.tsx src/components/Popup.tsx entrypoints/popup/style.css
git commit -m "feat: add theme listener and confirm dialog"
```
