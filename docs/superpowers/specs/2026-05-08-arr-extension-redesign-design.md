# ArrExtension Redesign Spec (Balanced)

**Date:** 2026-05-08

## Context
ArrExtension is a WXT-based Chrome extension that lets users search and add items to Sonarr/Radarr servers. The current code has security gaps, a startup race condition, large monolithic UI logic, and multiple UX/accessibility issues. This spec defines a balanced redesign that fixes all 17 issues while keeping scope controlled and testable.

## Goals
- Fix security issues (permissions, storage of API keys).
- Eliminate the startup race condition and stabilize init flow.
- Improve maintainability with clear component boundaries and better types.
- Improve performance in large libraries and reduce re-renders.
- Add essential UX and accessibility improvements.
- Add unit and local-only E2E tests with minimal tooling.

## Non-Goals
- Adding new *arr products beyond Sonarr/Radarr.
- Cloud sync for API keys or advanced encryption.
- CI automation for E2E tests (local only for now).
- Full UI redesign or visual overhaul.

## Architecture and Boundaries
**Popup (Coordinator)**
- Popup becomes a coordinator that wires state and renders panels.

**Hooks**
- `useSelectedApp()` loads and saves selected app; handles permission gating.
- `useSearch()` handles query, debounce, results, and result caching.
- `useExistingItems()` loads cached existing items per app and refreshes in background.
- `useTheme()` listens for system theme changes.

**Panels / Components**
- `AppSettingsPanel` (server settings form and validation).
- `SearchPanel` (search input + results list).
- `ExistingItemsPanel` (current library items + remove flows).

**Utilities**
- `storage.ts` handles sync/local split and migration.
- `validators.ts` provides URL and API key validation.
- `arrApiBase.ts` centralizes fetch/timeout and error mapping.

## Data Flow
1. Popup mounts and calls `useSelectedApp()`.
2. App metadata loads from sync and API key from local.
3. If origin permission missing, request permission for that origin.
4. Load cached metadata (quality profiles/root folders) and existing items.
5. Search uses debounce and caches by `${appId}:${query}`.
6. Add/remove item updates UI and refreshes existing items in background.

## Permissions
- Remove `host_permissions` and `activeTab` from the manifest.
- Use `optional_host_permissions: ["*://*/*"]`.
- On save/update of app URL, call `chrome.permissions.request()` for that origin.
- If permission denied, show inline error and do not save the app.

## Storage Model
- **Sync (`chrome.storage.sync`)**: app metadata (id, name, type, base URL).
- **Local (`chrome.storage.local`)**: API keys by app id, selected text, cached metadata, last-used options.

### Migration
- On startup, detect legacy `arr_apps` entries with `apiKey`.
- Move `apiKey` values into local storage keyed by app id.
- Rewrite sync metadata without keys.

## Validation and Error Handling
**Validation**
- URL validated with `new URL()`; only `http:` and `https:` allowed.
- API key validated as non-empty and minimum length.
- Save disabled until both are valid; inline error messages shown.

**Error handling**
- `fetchWithTimeout` uses `try/finally` to always clear timeout.
- Map errors to user-friendly messages:
  - Network: "Unable to connect. Check your URL."
  - 401: "Invalid API key."
  - Timeout: "Server timed out."

## UX and Accessibility
- Add monitored checkbox to AddItemForm.
- Replace deprecated `onKeyPress` with `onKeyDown`.
- Add `aria-label` to icon buttons.
- Add `loading="lazy"` for poster images.
- Add system theme listener (prefers-color-scheme) and apply to popup.
- Replace native confirm with in-popup confirmation dialog.
- Use a single placeholder image constant across ResultCard.

## Type System Improvements
- Convert `SearchResult` to discriminated union (`SeriesResult | MovieResult`).
- Extend `createArrApi` overloads for Sonarr/Radarr only.
- Remove Readarr/Lidarr types and APIs.

## Performance Improvements
- Cache existing items per app; refresh in background.
- Use `useCallback` for handlers passed to child components.
- Add image lazy-loading.

## Testing and Tooling
**Tooling (minimal)**
- Vitest + Testing Library for unit/component tests.
- Playwright for local-only E2E tests.
- Minimal ESLint with `@typescript-eslint` and `eslint-plugin-react-hooks` to enforce exhaustive deps and reduce closure bugs during refactor.
- Prettier optional for formatting consistency.

**Unit tests**
- Storage migration and API key split.
- URL validation and AppForm behavior.
- `arrApiBase` timeout cleanup.
- Popup init sequence (race condition).
- Search debounce and cache.

**E2E tests (local only)**
- Save server with invalid URL (error shown).
- Save server with valid URL (permission prompt).
- Search and add item flow.
- Remove item with custom confirm dialog.
- Theme changes with system preference.

## Plan Sequencing (Single Phase, Multiple Plans)
1. **Plan 1 - Foundations:** race condition fix, URL validation, permission flow.
2. **Plan 2 - Storage & Security:** split storage, migration, remove broad permissions, sync `wxt.config.ts` version from `package.json`.
3. **Plan 3 - Architecture:** decompose Popup, remove Readarr/Lidarr, types cleanup.
4. **Plan 4 - Performance:** timeout leak, caching, useCallback, lazy images.
5. **Plan 5 - UX/Accessibility:** monitored toggle, placeholder const, onKeyDown, aria-labels, theme listener, confirm dialog.
6. **Plan 6 - Testing & Tooling:** unit tests, local-only E2E tests, minimal ESLint with react-hooks enforcement.

## Risks and Mitigations
- **Permission denial**: show clear inline error and block save.
- **Migration edge cases**: keep non-destructive migration and log errors.
- **Refactor regressions**: cover with unit + E2E tests before polish.

## Success Criteria
- All 17 issues resolved with tests for critical paths.
- Permissions follow least privilege with dynamic origin requests.
- API keys only stored locally.
- Popup logic is decomposed and testable.
- E2E tests run locally for main user flows.
