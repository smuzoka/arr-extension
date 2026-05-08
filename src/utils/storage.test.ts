import { describe, expect, it, beforeEach } from "vitest";
import { storage } from "./storage";
import { resetStorageState } from "../test/setupTests";

describe("storage", () => {
  beforeEach(() => {
    resetStorageState();
  });

  describe("migrateApiKeys", () => {
    it("moves legacy apiKey fields into local storage", async () => {
      await chrome.storage.sync.set({
        arr_apps: [
          {
            id: "1",
            name: "Sonarr",
            type: "sonarr",
            url: "http://localhost:8989",
            apiKey: "abc12345",
            icon: "",
          },
        ],
      });

      await storage.migrateApiKeys();

      const syncResult = await chrome.storage.sync.get(["arr_apps"]);
      const localResult = await chrome.storage.local.get(["arr_api_keys"]);

      const syncApps = syncResult.arr_apps as Array<Record<string, unknown>>;
      expect(syncApps[0]).not.toHaveProperty("apiKey");
      expect((localResult.arr_api_keys as Record<string, string>)["1"]).toBe(
        "abc12345",
      );
    });

    it("skips migration when no legacy keys exist", async () => {
      await chrome.storage.sync.set({
        arr_apps: [
          {
            id: "1",
            name: "Sonarr",
            type: "sonarr",
            url: "http://localhost:8989",
            icon: "",
          },
        ],
      });

      await storage.migrateApiKeys();

      const localResult = await chrome.storage.local.get(["arr_api_keys"]);
      expect(localResult.arr_api_keys).toBeUndefined();
    });
  });

  describe("split storage read/write", () => {
    it("getArrApps merges sync metadata with local API keys", async () => {
      await chrome.storage.sync.set({
        arr_apps: [
          {
            id: "1",
            name: "Sonarr",
            type: "sonarr",
            url: "http://localhost:8989",
            icon: "",
          },
        ],
      });
      await chrome.storage.local.set({
        arr_api_keys: { "1": "mykey123" },
      });

      const apps = await storage.getArrApps();

      expect(apps).toHaveLength(1);
      expect(apps[0].apiKey).toBe("mykey123");
      expect(apps[0].name).toBe("Sonarr");
    });

    it("saveArrApps splits api keys to local and metadata to sync", async () => {
      await storage.saveArrApps([
        {
          id: "1",
          name: "Sonarr",
          type: "sonarr",
          url: "http://localhost:8989",
          apiKey: "key123",
          icon: "",
        },
      ]);

      const syncResult = await chrome.storage.sync.get(["arr_apps"]);
      const localResult = await chrome.storage.local.get(["arr_api_keys"]);

      const syncApps = syncResult.arr_apps as Array<Record<string, unknown>>;
      expect(syncApps[0]).not.toHaveProperty("apiKey");
      expect(syncApps[0].name).toBe("Sonarr");
      expect((localResult.arr_api_keys as Record<string, string>)["1"]).toBe(
        "key123",
      );
    });

    it("removeArrApp cleans both sync and local storage", async () => {
      await storage.saveArrApps([
        {
          id: "1",
          name: "Sonarr",
          type: "sonarr",
          url: "http://localhost:8989",
          apiKey: "key123",
          icon: "",
        },
        {
          id: "2",
          name: "Radarr",
          type: "radarr",
          url: "http://localhost:7878",
          apiKey: "key456",
          icon: "",
        },
      ]);

      await storage.removeArrApp("1");

      const apps = await storage.getArrApps();
      expect(apps).toHaveLength(1);
      expect(apps[0].id).toBe("2");

      const localResult = await chrome.storage.local.get(["arr_api_keys"]);
      const keys = localResult.arr_api_keys as Record<string, string>;
      expect(keys["1"]).toBeUndefined();
      expect(keys["2"]).toBe("key456");
    });
  });

  describe("selected app persistence", () => {
    it("persists and retrieves selected app id", async () => {
      await storage.setSelectedAppId("app-1");
      const id = await storage.getSelectedAppId();
      expect(id).toBe("app-1");
    });

    it("clears selected app id when set to null", async () => {
      await storage.setSelectedAppId("app-1");
      await storage.setSelectedAppId(null);
      const id = await storage.getSelectedAppId();
      expect(id).toBeNull();
    });
  });

  describe("existing items cache", () => {
    it("saves and retrieves cached items per app", async () => {
      const items = [
        {
          kind: "series" as const,
          id: 1,
          title: "Test",
          tvdbId: 123,
          images: [],
        },
      ];
      await storage.saveExistingItems("app-1", items);

      const cached = await storage.getExistingItems("app-1");
      expect(cached).not.toBeNull();
      expect(cached!.items).toEqual(items);
      expect(cached!.timestamp).toBeGreaterThan(0);
    });

    it("returns null for uncached app", async () => {
      const cached = await storage.getExistingItems("nonexistent");
      expect(cached).toBeNull();
    });
  });
});
