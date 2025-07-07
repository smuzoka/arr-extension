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


{
  "designSystem": {
    "pages": {
      "mainSearchPage": {
        "layout": {
          "header": {
            "elements": [
              {"type": "searchInput", "alignment": "left", "style": "rounded", "icon": "search"},
              {"type": "settingsIcon", "alignment": "right"}
            ]
          },
          "navigation": {
            "type": "horizontalScroll", 
            "elements": "icons"
          },
          "content": {
            "type": "verticalScroll",
            "itemCard": {
              "structure": [
                {"type": "image", "position": "left"},
                {"type": "details", "position": "right", "elements": [
                  {"type": "ratings", "style": "badge"},
                  {"type": "attributes", "style": "badgeGroup", "alignment": "horizontal"},
                  {"type": "description", "style": "text", "alignment": "justified"},
                  {"type": "actionButton", "label": "+", "style": "icon", "action": "openAddItemPage"}
                ]}
              ]
            }
          }
        }
      },
      "addItemPage": {
        "layout": {
          "form": {
            "elements": [
              {"type": "input", "label": "Root Folder", "style": "dropdown"},
              {"type": "input", "label": "Monitor", "style": "dropdown"},
              {"type": "input", "label": "Quality Profile", "style": "dropdown"},
              {"type": "input", "label": "Series Type", "style": "dropdown"},
              {"type": "checkbox", "label": "Season Folder"},
              {"type": "input", "label": "Tags", "style": "text"},
              {"type": "checkboxGroup", "elements": [
                "Start search for missing episodes",
                "Start search for cutoff unmet episodes"
              ]},
              {"type": "actionButton", "label": "Add Item", "style": "primary"}
            ]
          }
        }
      },
      "settingsPage": {
        "layout": {
          "header": {
            "elements": [
              {"type": "title", "label": "Settings"},
              {"type": "closeIcon", "alignment": "right"}
            ]
          },
          "content": {
            "elements": [
              {"type": "input", "label": "API Key", "style": "text"},
              {"type": "input", "label": "Server URL", "style": "text"},
              {"type": "checkbox", "label": "Enable Notifications"},
              {"type": "actionButton", "label": "Test Connection", "style": "secondary"},
              {"type": "actionButton", "label": "Save Settings", "style": "primary"}
            ]
          }
        }
      }
    }
  }
}

:root {
  --background: oklch(0.9885 0.0057 84.5659);
  --foreground: oklch(0.3660 0.0251 49.6085);
  --card: oklch(0.9686 0.0091 78.2818);
  --card-foreground: oklch(0.3660 0.0251 49.6085);
  --popover: oklch(0.9686 0.0091 78.2818);
  --popover-foreground: oklch(0.3660 0.0251 49.6085);
  --primary: oklch(0.5553 0.1455 48.9975);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.8276 0.0752 74.4400);
  --secondary-foreground: oklch(0.4444 0.0096 73.6390);
  --muted: oklch(0.9363 0.0218 83.2637);
  --muted-foreground: oklch(0.5534 0.0116 58.0708);
  --accent: oklch(0.9000 0.0500 74.9889);
  --accent-foreground: oklch(0.4444 0.0096 73.6390);
  --destructive: oklch(0.4437 0.1613 26.8994);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8866 0.0404 89.6994);
  --input: oklch(0.8866 0.0404 89.6994);
  --ring: oklch(0.5553 0.1455 48.9975);
  --chart-1: oklch(0.5553 0.1455 48.9975);
  --chart-2: oklch(0.5534 0.0116 58.0708);
  --chart-3: oklch(0.5538 0.1207 66.4416);
  --chart-4: oklch(0.5534 0.0116 58.0708);
  --chart-5: oklch(0.6806 0.1423 75.8340);
  --sidebar: oklch(0.9363 0.0218 83.2637);
  --sidebar-foreground: oklch(0.3660 0.0251 49.6085);
  --sidebar-primary: oklch(0.5553 0.1455 48.9975);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5538 0.1207 66.4416);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0.8866 0.0404 89.6994);
  --sidebar-ring: oklch(0.5553 0.1455 48.9975);
  --font-sans: Oxanium, sans-serif;
  --font-serif: Merriweather, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.3rem;
  --shadow-2xs: 0px 2px 3px 0px hsl(28 18% 25% / 0.09);
  --shadow-xs: 0px 2px 3px 0px hsl(28 18% 25% / 0.09);
  --shadow-sm: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 1px 2px -1px hsl(28 18% 25% / 0.18);
  --shadow: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 1px 2px -1px hsl(28 18% 25% / 0.18);
  --shadow-md: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 2px 4px -1px hsl(28 18% 25% / 0.18);
  --shadow-lg: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 4px 6px -1px hsl(28 18% 25% / 0.18);
  --shadow-xl: 0px 2px 3px 0px hsl(28 18% 25% / 0.18), 0px 8px 10px -1px hsl(28 18% 25% / 0.18);
  --shadow-2xl: 0px 2px 3px 0px hsl(28 18% 25% / 0.45);
}

.dark {
  --background: oklch(0.2161 0.0061 56.0434);
  --foreground: oklch(0.9699 0.0013 106.4238);
  --card: oklch(0.2685 0.0063 34.2976);
  --card-foreground: oklch(0.9699 0.0013 106.4238);
  --popover: oklch(0.2685 0.0063 34.2976);
  --popover-foreground: oklch(0.9699 0.0013 106.4238);
  --primary: oklch(0.7049 0.1867 47.6044);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.4444 0.0096 73.6390);
  --secondary-foreground: oklch(0.9232 0.0026 48.7171);
  --muted: oklch(0.2685 0.0063 34.2976);
  --muted-foreground: oklch(0.7161 0.0091 56.2590);
  --accent: oklch(0.3598 0.0497 229.3202);
  --accent-foreground: oklch(0.9232 0.0026 48.7171);
  --destructive: oklch(0.5771 0.2152 27.3250);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3741 0.0087 67.5582);
  --input: oklch(0.3741 0.0087 67.5582);
  --ring: oklch(0.7049 0.1867 47.6044);
  --chart-1: oklch(0.7049 0.1867 47.6044);
  --chart-2: oklch(0.6847 0.1479 237.3225);
  --chart-3: oklch(0.7952 0.1617 86.0468);
  --chart-4: oklch(0.7161 0.0091 56.2590);
  --chart-5: oklch(0.5534 0.0116 58.0708);
  --sidebar: oklch(0.2685 0.0063 34.2976);
  --sidebar-foreground: oklch(0.9699 0.0013 106.4238);
  --sidebar-primary: oklch(0.7049 0.1867 47.6044);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.6847 0.1479 237.3225);
  --sidebar-accent-foreground: oklch(0.2839 0.0734 254.5378);
  --sidebar-border: oklch(0.3741 0.0087 67.5582);
  --sidebar-ring: oklch(0.7049 0.1867 47.6044);
  --font-sans: Oxanium, sans-serif;
  --font-serif: Merriweather, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.3rem;
  --shadow-2xs: 0px 2px 3px 0px hsl(0 0% 5% / 0.09);
  --shadow-xs: 0px 2px 3px 0px hsl(0 0% 5% / 0.09);
  --shadow-sm: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 1px 2px -1px hsl(0 0% 5% / 0.18);
  --shadow: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 1px 2px -1px hsl(0 0% 5% / 0.18);
  --shadow-md: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 2px 4px -1px hsl(0 0% 5% / 0.18);
  --shadow-lg: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 4px 6px -1px hsl(0 0% 5% / 0.18);
  --shadow-xl: 0px 2px 3px 0px hsl(0 0% 5% / 0.18), 0px 8px 10px -1px hsl(0 0% 5% / 0.18);
  --shadow-2xl: 0px 2px 3px 0px hsl(0 0% 5% / 0.45);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

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