# ArrExtension

A Chrome extension that enables users to highlight text (e.g., a movie or series title) in their browser, right-click, and search for it in their configured *arr applications (e.g., Sonarr, Radarr, Lidarr, etc.). Search results are shown in a visually rich card format, and users can add items directly to their *arr apps.

## Features

- **Context Menu Integration**: Highlight text on any webpage, right-click, and search in your *arr apps
- **Multiple *arr App Support**: Configure and switch between Sonarr, Radarr, Lidarr, and Readarr
- **Rich Search Results**: Beautiful card layout with posters, ratings, genres, and descriptions
- **Smart Add Detection**: Shows which items are already in your collection with green checkmarks
- **Dynamic Add Forms**: Context-aware forms that adapt to each *arr application type
- **Connection Testing**: Built-in connectivity testing for all configured apps
- **Modern UI**: Clean, responsive interface with dark/light theme support

## Supported Applications

- **Sonarr** (TV Shows) - v3 API
- **Radarr** (Movies) - v3 API  
- **Lidarr** (Music) - v1 API
- **Readarr** (Books) - v1 API

## Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/smuzoka/arr-extension.git
   cd arr-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development mode:
   ```bash
   npm run dev
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `.output/chrome-mv3` folder

### Production Build

```bash
npm run build
npm run zip
```

## Configuration

1. **Install the extension** in your browser
2. **Right-click the extension icon** and select "Options" (or click the gear icon in the popup)
3. **Add your *arr applications**:
   - Click "Add New App"
   - Enter a name (e.g., "My Sonarr")
   - Select the app type
   - Enter the server URL (e.g., `http://localhost:8989`)
   - Enter your API key (found in Settings → General → Security in your *arr app)
   - Click "Test Connection" to verify
   - Click "Add App" to save

## Usage

### Basic Search

1. **Highlight text** on any webpage (movie title, TV show name, etc.)
2. **Right-click** and select "Search in *arr apps"
3. The extension popup will open with your search term pre-filled
4. **Switch between apps** using the icon bar at the top
5. **Browse results** in the card format
6. **Click any result** to open the add form

### Adding Items

1. **Click on a search result** to open the add form
2. **Configure settings**:
   - Select root folder
   - Choose quality profile
   - Set monitoring options
   - Configure search preferences
3. **Click "Add Item"** to add to your *arr application
4. Successfully added items will show a green checkmark

### Managing Apps

- **Test connections** using the "Test" button in settings
- **Edit existing apps** with the "Edit" button
- **Remove apps** with the "Delete" button
- **View connection status** and version information

## API Requirements

Your *arr applications must be accessible from your browser with proper CORS headers configured. Most *arr applications support this by default when accessed from browser extensions.

### Required API Endpoints

The extension uses these API endpoints:

- `GET /api/v3/system/status` - Connection testing
- `GET /api/v3/series/lookup` (Sonarr) - Search for series
- `GET /api/v3/movie/lookup` (Radarr) - Search for movies  
- `GET /api/v3/series` (Sonarr) - List existing series
- `GET /api/v3/movie` (Radarr) - List existing movies
- `GET /api/v3/qualityProfile` - Get quality profiles
- `GET /api/v3/rootfolder` - Get root folders
- `POST /api/v3/series` (Sonarr) - Add series
- `POST /api/v3/movie` (Radarr) - Add movies

## Security

- **API keys are stored securely** using Chrome's extension storage API
- **Connections use HTTPS** when possible
- **No data is transmitted** to external servers except your configured *arr applications
- **Local storage only** - all configuration stays on your device

## Development

### Project Structure

```
/
├── entrypoints/           # Extension entry points
│   ├── popup.tsx         # Main popup interface
│   ├── options.tsx       # Settings page
│   └── background.ts     # Background script
├── src/
│   ├── api/              # API interfaces and types
│   ├── components/       # React components
│   └── utils/            # Utility functions
├── public/               # Static assets
└── wxt.config.ts         # WXT configuration
```

### Tech Stack

- **WXT Framework** - Extension build tooling
- **React** - UI framework
- **TypeScript** - Type safety
- **Chrome Extensions API** - Storage, context menus, messaging

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Connection Issues

- **Verify URL format**: Include protocol (http:// or https://) and port
- **Check API key**: Copy from Settings → General → Security in your *arr app
- **Test connectivity**: Use the "Test Connection" button
- **Check CORS**: Ensure your *arr app allows browser requests

### Search Issues

- **No results**: Verify the app type matches your search (movies vs TV shows)
- **API errors**: Check your *arr application logs
- **Network errors**: Verify your *arr app is accessible from your browser

### Installation Issues

- **Development mode**: Ensure Developer mode is enabled in Chrome
- **Build errors**: Run `npm install` and check for missing dependencies
- **Permission errors**: Verify the extension has necessary permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **WXT Framework** for excellent extension development tooling
- **The *arr Community** for creating amazing media management applications
- **TMDb & TVDb** for providing the metadata that powers these applications 