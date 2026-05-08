import { useCallback, useEffect, useState } from "react";
import { storage } from "../utils/storage";
import { createArrApi } from "../api/arrApi";
import type { ArrAppWithKey, SearchResult } from "../api/types";

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setAddedItems(new Set());
      return;
    }

    setLoading(true);
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
      setAddedItems(ids);
      await storage.saveExistingItems(app.id, existingItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load existing items",
      );
    } finally {
      setLoading(false);
    }
  }, [app, extractExistingIds]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!app) {
        setAddedItems(new Set());
        return;
      }

      // Load cached items first
      const cached = await storage.getExistingItems(app.id);
      if (cached && isMounted) {
        const ids = extractExistingIds(cached.items);
        setAddedItems(ids);
      }

      // Refresh in background
      await refresh();
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [app, refresh, extractExistingIds]);

  return {
    addedItems,
    loading,
    error,
    reload: refresh,
  };
};
