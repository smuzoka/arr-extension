import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

type StorageAreaData = Record<string, unknown>;

type StorageArea = {
  get: (keys?: string[]) => Promise<StorageAreaData>;
  set: (items: StorageAreaData) => Promise<void>;
  remove: (keys: string[]) => Promise<void>;
};

const storageState: { local: StorageAreaData; sync: StorageAreaData } = {
  local: {},
  sync: {},
};

const createStorageArea = (area: "local" | "sync"): StorageArea => ({
  get: vi.fn(async (keys?: string[]) => {
    if (!keys) return storageState[area];
    const result: StorageAreaData = {};
    keys.forEach((key) => {
      result[key] = storageState[area][key];
    });
    return result;
  }),
  set: vi.fn(async (items: StorageAreaData) => {
    Object.assign(storageState[area], items);
  }),
  remove: vi.fn(async (keys: string[]) => {
    keys.forEach((key) => delete storageState[area][key]);
  }),
});

if (!globalThis.chrome) {
  globalThis.chrome = {
    storage: {
      local: createStorageArea("local"),
      sync: createStorageArea("sync"),
    },
    permissions: {
      request: vi.fn(async () => true),
      contains: vi.fn(async () => true),
    },
  } as unknown as typeof chrome;
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

export const resetStorageState = () => {
  storageState.local = {};
  storageState.sync = {};
};
