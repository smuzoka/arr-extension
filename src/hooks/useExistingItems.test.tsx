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

const radarrApp: ArrAppWithKey = {
  id: "radarr-1",
  name: "Radarr",
  type: "radarr",
  url: "http://localhost:7878",
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

  it("ignores stale refresh results after app switch", async () => {
    getExistingIds.mockResolvedValue(null);

    let resolveSeries: (value: any[]) => void;
    const seriesPromise = new Promise<any[]>((resolve) => {
      resolveSeries = resolve;
    });

    let resolveMovies: (value: any[]) => void;
    const moviesPromise = new Promise<any[]>((resolve) => {
      resolveMovies = resolve;
    });

    getAllSeries.mockReturnValueOnce(seriesPromise);
    getAllMovies.mockReturnValueOnce(moviesPromise);

    const { result, rerender } = renderHook(
      ({ app }) => useExistingItems(app),
      {
        initialProps: { app: sonarrApp },
      },
    );

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true);
    });

    rerender({ app: radarrApp });

    await waitFor(() => {
      expect(getAllMovies).toHaveBeenCalledTimes(1);
    });

    resolveMovies!([
      {
        id: 10,
        title: "Radarr",
        tmdbId: 202,
        images: [],
        kind: "movie",
      },
    ]);

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.addedIds.has(202)).toBe(true);
    });

    resolveSeries!([
      {
        id: 20,
        title: "Sonarr",
        tvdbId: 303,
        images: [],
        kind: "series",
      },
    ]);

    await waitFor(() => {
      expect(result.current.addedIds.has(202)).toBe(true);
      expect(result.current.addedIds.has(303)).toBe(false);
    });

    expect(saveExistingIds).toHaveBeenCalledTimes(1);
    expect(saveExistingIds).toHaveBeenCalledWith(radarrApp.id, [202]);
  });

  it("clears error when app becomes null", async () => {
    getExistingIds.mockResolvedValue(null);
    getAllSeries.mockRejectedValueOnce(new Error("boom"));

    const { result, rerender } = renderHook(
      ({ app }) => useExistingItems(app),
      {
        initialProps: { app: sonarrApp },
      },
    );

    await waitFor(() => {
      expect(result.current.error).toBe("boom");
      expect(result.current.isSyncing).toBe(false);
    });

    rerender({ app: null });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.addedIds.size).toBe(0);
      expect(result.current.isSyncing).toBe(false);
    });
  });
});
