import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useExistingItems } from "./useExistingItems";
import type { ArrAppWithKey } from "../api/types";

const { getAllSeries, getAllMovies } = vi.hoisted(() => ({
  getAllSeries: vi.fn(async () => []),
  getAllMovies: vi.fn(async () => []),
}));

vi.mock("../api/arrApi", () => ({
  createArrApi: () => ({
    getAllSeries,
    getAllMovies,
  }),
}));

const { getExistingIds, saveExistingIds } = vi.hoisted(() => ({
  getExistingIds: vi.fn(),
  saveExistingIds: vi.fn(),
}));

vi.mock("../utils/storage", () => ({
  storage: {
    getExistingIds,
    saveExistingIds,
  },
}));

const sonarrApp: ArrAppWithKey = {
  id: "sonarr-1",
  name: "Sonarr",
  type: "sonarr",
  url: "http://localhost:8989",
  apiKey: "abc12345",
  icon: "",
};

describe("useExistingItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses cached ids before refresh completes", async () => {
    getExistingIds.mockResolvedValue({
      ids: [418666],
      timestamp: Date.now(),
    });

    let resolveRefresh: (value: any[]) => void;
    const refreshPromise = new Promise<any[]>((resolve) => {
      resolveRefresh = resolve;
    });
    getAllSeries.mockReturnValue(refreshPromise);

    const { result } = renderHook(() => useExistingItems(sonarrApp));

    await waitFor(() => {
      expect(result.current.addedIds.has(418666)).toBe(true);
      expect(result.current.isSyncing).toBe(true);
    });

    resolveRefresh!([
      {
        id: 1,
        title: "Test",
        tvdbId: 418666,
        images: [],
        kind: "series",
      },
    ]);

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });

  it("keeps cached ids when refresh fails", async () => {
    getExistingIds.mockResolvedValue({
      ids: [111],
      timestamp: Date.now(),
    });
    getAllSeries.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useExistingItems(sonarrApp));

    await waitFor(() => {
      expect(result.current.addedIds.has(111)).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.error).toBe("boom");
    });
  });
});
