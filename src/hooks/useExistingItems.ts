import { useCallback, useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey } from '../api/types';

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractExistingIds = useCallback((items: any[]) => {
    return new Set(items.map(item => {
      if (app?.type === 'sonarr' && item.kind === 'series') {
        return item.tvdbId;
      } else if (app?.type === 'radarr' && item.kind === 'movie') {
        return item.tmdbId;
      }
      return item.id;
    }).filter((id): id is number => id !== undefined));
  }, [app?.type]);

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

      if (app.type === 'sonarr') {
        existingItems = await api.getAllSeries();
      } else if (app.type === 'radarr') {
        existingItems = await api.getAllMovies();
      }

      const ids = extractExistingIds(existingItems);
      setAddedItems(ids);
      await storage.saveExistingItems(app.id, existingItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing items');
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
    reload: refresh
  };
};
