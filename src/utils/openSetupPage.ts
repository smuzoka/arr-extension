const SETUP_PAGE = "setup.html";

export const openSetupPage = async (search = ""): Promise<void> => {
  const baseUrl = chrome.runtime.getURL(SETUP_PAGE);
  const targetUrl = `${baseUrl}${search}`;
  let existingTab: chrome.tabs.Tab | undefined;
  try {
    [existingTab] = await chrome.tabs.query({ url: `${baseUrl}*` });
  } catch {
    existingTab = undefined;
  }

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, {
      active: true,
      url: targetUrl,
    });
    return;
  }

  await chrome.tabs.create({
    url: targetUrl,
    active: true,
  });
};
