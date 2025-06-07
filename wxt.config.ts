import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '*arr Search & Add Tool',
    description: 'Search and add content to your *arr applications (Sonarr, Radarr, etc.)',
    permissions: [
      'contextMenus',
      'storage',
      'activeTab'
    ],
    host_permissions: [
      'https://*/*',
      'http://*/*'
    ]
  }
}); 