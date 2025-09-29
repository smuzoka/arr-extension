import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ArrExtension',
    description: 'Search and add media to your *arr applications.',
    version: '1.0.0',
    permissions: [
      'storage',
      'contextMenus',
      'activeTab'
    ],
    host_permissions: [
      '*://*/*'
    ],
    action: {
      default_popup: 'popup.html',
      default_title: 'ArrExtension'
    },
    icons: {
      16: 'arr16x16.png',
      32: 'arr32x32.png',
      48: 'arr48x48.png',
      128: 'arr128x128.png'
    }
  }
}); 