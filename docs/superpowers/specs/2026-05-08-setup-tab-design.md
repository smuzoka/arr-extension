# ArrExtension Setup Tab Spec

**Date:** 2026-05-08

## Context
ArrExtension currently lets users add and edit Sonarr/Radarr servers inside the toolbar popup. When the extension requests optional host permissions with `chrome.permissions.request()`, Chrome may close the popup and destroy the JavaScript context. The current code works around this by saving app data before the permission request, but that produces an awkward setup experience and leaves the popup responsible for a flow it is not well-suited to host.

This spec moves app management into a dedicated extension tab so setup can survive permission prompts, support richer feedback, and scale to multiple apps without popup lifecycle issues.

## Goals
- Move add/edit app flows out of the toolbar popup into a persistent extension tab.
- Make permission requests happen from a stable page that is not torn down by the browser.
- Preserve the current storage split: sync for app metadata, local for API keys.
- Keep the popup lightweight and focused on search and quick actions.
- Show apps missing permission in the popup as disabled, not hidden.
- Support adding multiple apps in one session from the setup page.

## Non-Goals
- Redesigning the search or add-item flows in the popup.
- Changing the app storage model beyond what is required for setup-page behavior.
- Introducing account sync, encryption changes, or new server types.
- Automatically closing setup tabs after save.

## Architecture and Boundaries
**Popup**
- Popup becomes a launcher and operational surface.
- Popup no longer hosts add/edit app forms.
- Popup opens the setup tab for `Add app` and `Settings`.
- Popup renders configured apps, but disables apps that still lack host permission.

**Setup Tab**
- Add a dedicated extension page at `setup.html`.
- The page owns app management: list, add, edit, delete, permission grant, and connection test.
- The page remains open after save so users can add multiple apps in one session.

**Shared Components / Logic**
- Reuse the existing app form and settings list where practical, but remove assumptions that they only run inside the popup.
- Add a shared helper to open or focus the setup tab.
- Keep permission-check and storage logic in shared utilities/hooks rather than duplicating it between popup and setup page.

## User Flow
1. User clicks `Add app` or `Settings` in the popup.
2. Extension opens `setup.html` in a normal browser tab.
3. Popup closes naturally; no app-management work continues there.
4. Setup page shows current configured apps and the add/edit form.
5. User saves an app from the setup page.
6. Setup page requests host permission for the app origin.
7. If permission is granted, the app is ready to use.
8. If permission is denied, the app remains saved but is clearly marked `Permission required`.
9. Setup page stays open and shows inline success/recovery actions such as `Add another app`, `Grant permission`, and `Done`.
10. When the popup is reopened, apps missing permission appear disabled with guidance to finish setup in the tab.

## Setup Page Structure
**Header**
- Extension title and short setup description.
- `Done` action that leaves the user free to return to the popup manually.

**Workspace**
- Configured app list and add/edit form on the same page.
- Two-column layout on desktop-sized widths, stacked layout on narrow widths.
- `Add app` starts a blank form.
- `Edit` loads the selected app into the form.

**Status and Recovery**
- Inline success and error banners.
- Explicit state for apps missing permission.
- Recovery actions per app: `Grant permission`, `Edit`, `Test connection`, `Delete`.

## Popup Behavior
- `Open settings` opens the setup tab instead of navigating to an in-popup settings view.
- Empty-state `Add app` also opens the setup tab directly.
- Popup app-switcher continues to show configured apps even if permission is missing.
- Apps without permission are rendered disabled with a short explanation such as `Finish setup in tab to grant access`.
- Popup does not attempt to request host permission during app management anymore.
- Popup may still perform permission checks to determine whether an app is usable.

## Data and State Model
**Persistent storage**
- Keep app metadata in `chrome.storage.sync`.
- Keep API keys in `chrome.storage.local`.
- Do not add a persisted `permission_required` flag by default; derive capability from URL validity plus `chrome.permissions.contains()`.

**Setup page state**
- Selected app for editing.
- Form draft values.
- Save/test/permission request status.
- Success and error banners.

**Popup state**
- Search query, results, and selected app.
- Derived usability state for each configured app.

## Permission Handling
- Permission requests for app setup happen from the setup tab.
- On save or update, request permission for the normalized app origin.
- If granted, show success and keep the app usable immediately.
- If denied, keep the app saved but present it as needing permission.
- `Grant permission` can be retried later from the setup page without re-entering all app details.
- The popup should not silently fail when a disabled app is selected; the disabled state must prevent selection and explain why.

## Routing and Navigation
- Add a shared `openSetupPage()` helper that opens or focuses `setup.html`.
- Support lightweight query parameters for intent, for example:
  - `setup.html?action=add`
  - `setup.html?appId=<id>`
- Query params are advisory UI hints, not the source of truth for app data.

## Testing Strategy
**Unit / integration**
- Setup-page add flow requests permission from the tab context.
- Denied permission leaves the app saved and marked as requiring follow-up.
- Popup renders permission-missing apps as disabled.
- `openSetupPage()` opens or focuses the setup tab correctly.

**E2E**
- Popup `Add app` opens the setup tab.
- Saving an app from the setup page survives the permission dialog cleanly.
- Denied permission results in a visible recovery state.
- Returning to the popup shows the app as disabled until permission is granted.
- Granting permission from the setup page enables the app in the popup.

## Risks and Mitigations
- **Component reuse friction**: popup-specific assumptions may leak into the setup page.
  Mitigation: extract shared app-management components and keep popup navigation concerns separate.
- **User confusion across popup and tab**: users may not understand why setup happens elsewhere.
  Mitigation: make popup copy explicit and keep the tab title/header clear.
- **Multiple setup tabs**: repeated clicks could create duplicate tabs.
  Mitigation: `openSetupPage()` should focus an existing setup tab when possible.

## Success Criteria
- App add/edit no longer depends on the popup surviving permission requests.
- Users can add multiple apps in one setup session.
- Popup no longer contains the app-management form flow.
- Apps missing permission remain visible in the popup but cannot be used.
- Permission recovery is clear and repeatable from the setup page.
