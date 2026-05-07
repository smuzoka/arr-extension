import { useCallback, useEffect, useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey } from '../api/types';

export const useExistingItems = (app: ArrAppWithKey | null) => {
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExistingItems = useCallback(async () => {
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

      // Use external identifiers instead of internal IDs
      const existingIds = new Set(existingItems.map(item => {
        if (app.type === 'sonarr' && item.kind === 'series') {
          return item.tvdbId;
        } else if (app.type === 'radarr' && item.kind === 'movie') {
          return item.tmdbId;
        }
        return item.id;
      }).filter((id): id is number => id !== undefined));

      setAddedItems(existingIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing items');
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    loadExistingItems();
  }, [app, loadExistingItems]);

  return {
    addedItems,
    loading,
    error,
    reload: loadExistingItems
  };
};
