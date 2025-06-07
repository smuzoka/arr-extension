export default defineBackground(() => {
  // Create context menu when extension is installed
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'search-arr',
      title: 'Search in *arr apps: "%s"',
      contexts: ['selection']
    });
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'search-arr' && info.selectionText) {
      // Store the selected text for the popup
      await chrome.storage.local.set({ 
        searchTerm: info.selectionText.trim() 
      });
    }
  });
}); 