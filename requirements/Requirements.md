# Chrome Extension Requirements: *arr Search & Add Tool

## Overview

A Chrome extension that enables users to highlight text (e.g., a movie or series title) in their browser, right-click, and search for it in their configured *arr applications (e.g., Sonarr, Radarr, Lidarr, etc.). Search results are shown in a visually rich card format. Users can click a result, set add options (settings vary per app), and add the item via the relevant *arr API.  
The extension also provides a settings page to manage *arr app connections (URL + API Key).

---

## Features & User Stories

### 1. Context Menu & Search

- **Highlight-to-Search**  
  - User highlights text on a web page.
  - User right-clicks and selects the extension from the context menu.
  - Extension opens a popup with the search page.
  - The highlighted text appears in the search bar.
  - A search API call is made to the default *arr app (first in the list).

- **Switching *arr App**
  - The popup displays an icon bar (Sonarr, Radarr, etc.) at the top.
  - Only icons for configured apps are visible.
  - User can switch between apps by clicking icons.
  - When switching, a search is triggered for that *arr app using the current search term.
  - Search results display as cards with relevant info and poster/image.

- **Results Cards**
  - Each card shows the item title, year, image, and metadata.
  - When an item is already added, its card shows a green checkmark.
  - Clicking a card transitions to the add settings page.

---

### 2. Add Settings Page

- **Dynamic Fields**
  - Fields/settings depend on the selected *arr app (e.g., quality profile, root folder, tags for Sonarr; quality and path for Radarr).
  - Form is populated based on metadata from the selected result and user-configurable options.
- **Add Action**
  - User fills/selects required fields.
  - Clicking **Add** sends the appropriate API call to add the item.
  - On success, show a success message (toast or inline) and return to the previous search page.
  - The added item’s card should now display a green checkmark.

---

### 3. Manage *arr Apps (Settings Page)

- **List & Add Apps**
  - Displays current configured *arr apps (with name/icon).
  - Allows user to add new apps by providing:
    - App type (Sonarr, Radarr, etc.)
    - URL
    - API Key
  - “Test” button checks API connectivity and authentication before allowing “Add.”
  - “Add” saves app config to extension storage.
- **App Visibility**
  - Only configured apps appear as icons on the search page.
- **Edit/Remove**
  - User can edit or remove apps from settings.

---

## UX/UI Requirements

- Main popup matches the attached layout:
  - Icon bar for app switching.
  - Search bar auto-filled from context menu text.
  - Results as image-rich cards, clickable.
- Add page uses the layout in the second image (settings with relevant options and “Add” button).
- Green checkmark overlay for added items.
- Only show icons for apps set up by the user.
- Error, loading, and empty states are handled cleanly.
- Success notifications for add actions.

---

## API Calls

Below are the specific Sonarr and Radarr API endpoints the extension will use.  
All endpoints require the `X-Api-Key` header with the user's API key.

### Sonarr

- **Search Series**
  - **Endpoint:** `GET /api/v3/series/lookup?term={searchTerm}`
  - **Purpose:** Search for series by title.
  - **Docs:** [Series Lookup](https://sonarr.tv/docs/api-v3/series/#get-apiv3serieslookup)

- **Get All Series (for check if already added)**
  - **Endpoint:** `GET /api/v3/series`
  - **Purpose:** Fetch all series already in Sonarr.

- **Add Series**
  - **Endpoint:** `POST /api/v3/series`
  - **Purpose:** Add a series to Sonarr.
  - **Body:** JSON object with required fields, including `qualityProfileId`, `rootFolderPath`, `tvdbId`, etc.
  - **Docs:** [Add Series](https://sonarr.tv/docs/api-v3/series/#post-apiv3series)

- **Get Profiles and Folders (for add form options)**
  - **Quality Profiles:** `GET /api/v3/qualityProfile`
  - **Root Folders:** `GET /api/v3/rootfolder`

- **Test Connectivity**
  - **Endpoint:** `GET /api/v3/system/status`
  - **Purpose:** Simple ping to check connectivity.

### Radarr

- **Search Movies**
  - **Endpoint:** `GET /api/v3/movie/lookup?term={searchTerm}`
  - **Purpose:** Search for movies by title.
  - **Docs:** [Movie Lookup](https://radarr.video/docs/api/#/Movie/get_api_v3_movie_lookup)

- **Get All Movies (for check if already added)**
  - **Endpoint:** `GET /api/v3/movie`
  - **Purpose:** Fetch all movies already in Radarr.

- **Add Movie**
  - **Endpoint:** `POST /api/v3/movie`
  - **Purpose:** Add a movie to Radarr.
  - **Body:** JSON object with required fields, including `qualityProfileId`, `rootFolderPath`, `tmdbId`, etc.
  - **Docs:** [Add Movie](https://radarr.video/docs/api/#/Movie/post_api_v3_movie)

- **Get Profiles and Folders (for add form options)**
  - **Quality Profiles:** `GET /api/v3/qualityProfile`
  - **Root Folders:** `GET /api/v3/rootfolder`

- **Test Connectivity**
  - **Endpoint:** `GET /api/v3/system/status`
  - **Purpose:** Simple ping to check connectivity.

---

## Technical Stack

- **wxt.dev** for extension build tooling and manifest management.
- **React** for UI (popup, options/settings pages).
- **TypeScript** strongly preferred.
- Use Chrome extension storage for persisting app configs.
- Use fetch for *arr API calls.
- Extension pages:  
  - Popup (main UI: search, results, add item)
  - Options (settings, add/remove *arr apps)

---

## Extension Folder Structure

```plaintext
/extension-root
│
├── src/
│   ├── popup/
│   │   ├── Popup.tsx
│   │   ├── SearchBar.tsx
│   │   ├── AppSwitcher.tsx
│   │   ├── ResultCard.tsx
│   │   ├── AddItemForm.tsx
│   │   └── SuccessMessage.tsx
│   │
│   ├── options/
│   │   ├── Options.tsx
│   │   ├── AppList.tsx
│   │   ├── AppForm.tsx
│   │   └── TestApiButton.tsx
│   │
│   ├── background/
│   │   └── background.ts (for context menu & messaging)
│   │
│   ├── api/
│   │   ├── arrApi.ts (API methods for all *arr apps)
│   │   └── types.ts (shared types/interfaces)
│   │
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   └── utils/
│       └── helpers.ts
│
├── manifest.json (generated/managed by wxt.dev)
├── package.json
├── tsconfig.json
└── README.md