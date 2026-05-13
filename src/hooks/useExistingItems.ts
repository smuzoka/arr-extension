import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "../utils/storage";
import { createArrApi } from "../api/arrApi";
import type { ArrAppWithKey, SearchResult } from "../api/types";

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshToken = useRef(0);

  const extractExistingIds = useCallback(
    (items: SearchResult[]) => {
      const normalizeId = (value: unknown): number | null => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string" && value.trim()) {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      return new Set(
        items
          .map((item) => {
            if (app?.type === "sonarr") {
              return normalizeId(item.tvdbId ?? item.id);
            }
            if (app?.type === "radarr") {
              return normalizeId(item.tmdbId ?? item.id);
            }
            return normalizeId(item.id);
          })
          .filter((id): id is number => id !== null),
      );
    },
    [app?.type],
  );

  const refresh = useCallback(async () => {
    if (!app) {
      refreshToken.current += 1;
      setAddedIds(new Set());
      setIsSyncing(false);
      setError(null);
      return;
    }

    const requestId = (refreshToken.current += 1);
    setIsSyncing(true);
    setError(null);

    try {
      const api = createArrApi(app);
      let existingItems = [];

      if (app.type === "sonarr") {
        existingItems = await api.getAllSeries();
      } else if (app.type === "radarr") {
        existingItems = await api.getAllMovies();
      }

      const ids = extractExistingIds(existingItems);
      if (refreshToken.current !== requestId) {
        return;
      }
      setAddedIds(ids);
      await storage.saveExistingIds(app.id, Array.from(ids));
    } catch (err) {
      if (refreshToken.current !== requestId) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load existing items",
      );
    } finally {
      if (refreshToken.current === requestId) {
        setIsSyncing(false);
      }
    }
  }, [app, extractExistingIds]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!app) {
        setAddedIds(new Set());
        setIsSyncing(false);
        setError(null);
        return;
      }

      const cached = await storage.getExistingIds(app.id);
      if (cached && isMounted) {
        setAddedIds(new Set(cached.ids));
      }

      await refresh();
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [app, refresh]);

  return {
    addedIds,
    isSyncing,
    error,
    reload: refresh,
  };
};
