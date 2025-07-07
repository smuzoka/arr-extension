import { storage } from '../src/utils/storage';

export default defineBackground(() => {
  console.log('Background script started');

  // Create context menu
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'arr-search',
      title: 'Search in *arr apps',
      contexts: ['selection']
    });
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'arr-search' && info.selectionText) {
      // Store selected text
      await storage.setSelectedText(info.selectionText);
      
      // Open popup
      if (tab?.id) {
        await chrome.action.openPopup();
      }
    }
  });

  // Handle messages from popup/content scripts
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
      case 'GET_SELECTED_TEXT':
        storage.getSelectedText().then(sendResponse);
        return true; // Will respond asynchronously
      
      case 'CLEAR_SELECTED_TEXT':
        storage.clearSelectedText().then(() => sendResponse({ success: true }));
        return true;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  });
}); 