# *arr Search & Add Tool - Chrome Extension

A modern Chrome extension that enables users to highlight text (e.g., a movie or series title) in their browser, right-click, and search for it in their configured *arr applications (Sonarr, Radarr, etc.). Features a unified popup interface with integrated settings for a seamless user experience.

## ✨ Features

- **🔍 Context Menu Search**: Highlight text on any webpage, right-click, and search in your *arr apps
- **🎬 Multiple *arr App Support**: Configure and switch between Sonarr, Radarr, and other *arr applications
- **🖼️ Rich Search Results**: View results with poster images, titles, years, and descriptions
- **⚡ One-Click Adding**: Add content to your *arr applications with customizable settings
- **✅ Already Added Detection**: Shows which content is already in your library
- **⚙️ Integrated Settings**: Settings management within the popup
- **📱 Modern UX**: Mobile-like interface with seamless navigation

## Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd arr-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Load extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `.output/chrome-mv3` folder

### Production Build

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Create distribution zip**:
   ```bash
   npm run zip
   ```

## Usage

### Setup

1. **Install the extension** (see Installation section above)

2. **Configure your *arr applications**:
   - Click the extension icon to open the popup
   - Click the **settings gear (⚙️)** in the top-right corner
   - Click "Add Application"
   - Fill in your app details:
     - Name: A friendly name for your app
     - Type: Sonarr (TV Shows) or Radarr (Movies)
     - URL: Your app's URL (e.g., `http://localhost:8989`)
     - API Key: Your app's API key (found in Settings > General in your *arr app)
   - Click "Test" (🔌) to verify the connection, then "Add"
   - Click **✕** to return to the main view

### Searching and Adding Content

1. **Search from webpage**:
   - Highlight any text on a webpage (movie or TV show title)
   - Right-click and select "Search in *arr apps: [highlighted text]"
   - The extension popup will open with search results

2. **Switch between apps**:
   - Use the app icons at the top to switch between configured applications
   - Each search will show results from the selected app

3. **Add content**:
   - Click on any search result card to open the add form
   - Configure settings (Quality Profile, Root Folder, etc.)
   - Click "Add" to add the content to your *arr application

## 📁 Project Structure

```
/
├── entrypoints/
│   ├── background.ts          # Background script for context menu
│   └── popup/                 # Main popup interface with integrated settings
│       ├── App.tsx           # Main popup component with settings toggle
│       ├── Settings.tsx      # Integrated settings component
│       ├── App.css           # Unified popup and settings styles
│       ├── main.tsx          # Popup entry point
│       └── index.html        # Popup HTML
├── src/
│   ├── api/
│   │   ├── arrApi.ts         # *arr API service
│   │   └── types.ts          # TypeScript interfaces
│   └── utils/
│       └── storage.ts        # Chrome storage utilities
├── .cursor/rules/            # Cursor AI navigation rules
├── requirements/             # Project requirements and design docs
├── package.json
├── wxt.config.ts             # WXT configuration
├── tsconfig.json             # TypeScript configuration
├── .gitignore
└── README.md
```

## Supported *arr Applications

- **Sonarr**: TV show management
- **Radarr**: Movie management

## API Integration

The extension uses the official *arr APIs:

### Sonarr (TV Shows)
- Search: `GET /api/v3/series/lookup?term={searchTerm}`
- Add: `POST /api/v3/series`
- Profiles: `GET /api/v3/qualityProfile`
- Folders: `GET /api/v3/rootfolder`

### Radarr (Movies)
- Search: `GET /api/v3/movie/lookup?term={searchTerm}`
- Add: `POST /api/v3/movie`
- Profiles: `GET /api/v3/qualityProfile`
- Folders: `GET /api/v3/rootfolder`

## 🛠️ Development

### Tech Stack
- **WXT.dev**: Extension build tooling and manifest management
- **React**: UI components with integrated settings pattern
- **TypeScript**: Type safety and interfaces
- **Chrome Extensions API**: Storage, context menus, and Manifest V3
- **Vite**: Fast build tooling and hot reload

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production version
- `npm run zip`: Create distribution zip file
- `npm run compile`: Type check without building

### Architecture Highlights
- **🔄 Integrated Settings**: No separate options page - settings are part of the popup
- **📱 Mobile-Like UX**: Single window experience with smooth navigation
- **⚡ Instant Updates**: Settings changes immediately reflect in the main interface
- **🎯 Compact Design**: All functionality optimized for popup constraints

### Adding New *arr Applications

To add support for new *arr applications:

1. Update the `ArrApp` type in `src/api/types.ts`
2. Add API endpoints in `src/api/arrApi.ts`
3. Update the UI to handle the new app type
4. Add appropriate icons and styling

## 🔧 Troubleshooting

### Connection Issues
- Verify your *arr application is running and accessible
- Check that the URL format is correct (include http/https)
- Ensure the API key is valid (found in your *arr app's Settings > General)
- Check for CORS issues if connecting to remote instances
- Use the test button (🔌) in settings to verify connectivity

### Search Issues
- Make sure your search terms are specific enough
- Verify the *arr application has access to search providers
- Check the extension popup for error messages
- Try switching between different configured *arr apps

### Settings Issues
- Click the settings gear (⚙️) to access app configuration
- If settings won't save, check the connection test first
- Settings are stored in Chrome sync storage and will sync across devices

### Permission Issues
- Ensure the extension has the necessary permissions in Chrome
- Check Chrome's extension settings for any blocked permissions
- The extension needs access to make HTTP requests to your *arr applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly with real *arr applications
5. Update documentation if needed
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Submit a pull request

### Development Guidelines
- Follow the integrated settings pattern for new features
- Maintain popup window constraints (400px width)
- Use TypeScript for all new code
- Test with both Sonarr and Radarr
- Update Cursor Rules if adding new architectural patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WXT.dev](https://wxt.dev/) for the excellent Chrome extension framework
- [*arr Community](https://github.com/Radarr/Radarr) for the fantastic media management applications
- Chrome Extensions team for Manifest V3 guidance

---

**⭐ If you find this extension useful, please give it a star!** 