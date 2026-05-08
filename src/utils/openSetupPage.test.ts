import { beforeEach, describe, expect, it, vi } from "vitest";
import { openSetupPage } from "./openSetupPage";

describe("openSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chrome.runtime.getURL).mockImplementation(
      (path?: string) => `chrome-extension://test/${path ?? ""}`,
    );
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    vi.mocked(chrome.tabs.create).mockResolvedValue({
      id: 7,
    } as chrome.tabs.Tab);
    vi.mocked(chrome.tabs.update).mockResolvedValue({
      id: 7,
    } as chrome.tabs.Tab);
  });

  it("creates a setup tab when none exists", async () => {
    await openSetupPage("?action=add");

    expect(chrome.tabs.query).toHaveBeenCalledWith({
      url: "chrome-extension://test/setup.html*",
    });
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome-extension://test/setup.html?action=add",
      active: true,
    });
  });

  it("focuses an existing setup tab instead of creating a duplicate", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 42 },
    ] as chrome.tabs.Tab[]);

    await openSetupPage("?appId=abc");

    expect(chrome.tabs.update).toHaveBeenCalledWith(42, {
      active: true,
      url: "chrome-extension://test/setup.html?appId=abc",
    });
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });
});
