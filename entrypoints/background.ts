import { storage } from '../src/utils/storage';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'arr-search',
      title: 'Search in *arr apps',
      contexts: ['selection'],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== 'arr-search' || !info.selectionText) {
      return;
    }

    await storage.setSelectedText(info.selectionText);

    if (tab?.id) {
      await chrome.action.openPopup();
    }
  });
});
