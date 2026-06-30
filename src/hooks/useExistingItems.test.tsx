import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useExistingItems } from "./useExistingItems";
import type { ArrAppWithKey, MovieResult, SeriesResult } from "../api/types";

const createDeferred = <T,>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

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

    let resolveRefresh: (value: SeriesResult[]) => void;
    const refreshPromise = new Promise<SeriesResult[]>((resolve) => {
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

    let resolveSeries: (value: SeriesResult[]) => void;
    const seriesPromise = new Promise<SeriesResult[]>((resolve) => {
      resolveSeries = resolve;
    });

    let resolveMovies: (value: MovieResult[]) => void;
    const moviesPromise = new Promise<MovieResult[]>((resolve) => {
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

  it("ignores stale refresh when new app cache read is slow", async () => {
    const seriesDeferred = createDeferred<SeriesResult[]>();
    const moviesDeferred = createDeferred<MovieResult[]>();
    const cacheDeferred = createDeferred<{
      ids: number[];
      timestamp: number;
    }>();

    getAllSeries.mockReturnValueOnce(seriesDeferred.promise);
    getAllMovies.mockReturnValueOnce(moviesDeferred.promise);
    getExistingIds.mockImplementation((appId: string) => {
      if (appId === sonarrApp.id) {
        return Promise.resolve(null);
      }
      if (appId === radarrApp.id) {
        return cacheDeferred.promise;
      }
      return Promise.resolve(null);
    });

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
      expect(getExistingIds).toHaveBeenCalledWith(radarrApp.id);
    });

    expect(getAllMovies).not.toHaveBeenCalled();

    seriesDeferred.resolve([
      {
        id: 20,
        title: "Sonarr",
        tvdbId: 303,
        images: [],
        kind: "series",
      },
    ]);

    await waitFor(() => {
      expect(result.current.addedIds.has(303)).toBe(false);
    });

    cacheDeferred.resolve({
      ids: [],
      timestamp: Date.now(),
    });

    await waitFor(() => {
      expect(getAllMovies).toHaveBeenCalledTimes(1);
    });

    moviesDeferred.resolve([
      {
        id: 10,
        title: "Radarr",
        tmdbId: 202,
        images: [],
        kind: "movie",
      },
    ]);

    await waitFor(() => {
      expect(result.current.addedIds.has(202)).toBe(true);
    });

    expect(result.current.addedIds.has(303)).toBe(false);
  });

  it("does not cancel the new app refresh when the old cache resolves late", async () => {
    const cachedDeferred = createDeferred<{
      ids: number[];
      timestamp: number;
    }>();
    const moviesDeferred = createDeferred<MovieResult[]>();

    getExistingIds.mockImplementation((appId: string) => {
      if (appId === sonarrApp.id) {
        return cachedDeferred.promise;
      }
      return Promise.resolve(null);
    });
    getAllSeries.mockResolvedValue([]);
    getAllMovies.mockReturnValueOnce(moviesDeferred.promise);

    const { result, rerender } = renderHook(
      ({ app }) => useExistingItems(app),
      {
        initialProps: { app: sonarrApp },
      },
    );

    rerender({ app: radarrApp });

    await waitFor(() => {
      expect(getAllMovies).toHaveBeenCalledTimes(1);
    });

    cachedDeferred.resolve({
      ids: [111],
      timestamp: Date.now(),
    });
    await Promise.resolve();

    moviesDeferred.resolve([
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
  });

  it("ignores refresh results when app becomes null", async () => {
    getExistingIds.mockResolvedValue(null);
    const refreshDeferred = createDeferred<SeriesResult[]>();

    getAllSeries.mockReturnValueOnce(refreshDeferred.promise);

    const { result, rerender } = renderHook(
      ({ app }) => useExistingItems(app),
      {
        initialProps: { app: sonarrApp },
      },
    );

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true);
    });

    rerender({ app: null });

    refreshDeferred.resolve([
      {
        id: 20,
        title: "Sonarr",
        tvdbId: 303,
        images: [],
        kind: "series",
      },
    ]);

    await waitFor(() => {
      expect(result.current.addedIds.size).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.isSyncing).toBe(false);
    });

    expect(saveExistingIds).not.toHaveBeenCalled();
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
