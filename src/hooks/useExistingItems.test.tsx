import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useExistingItems } from './useExistingItems';
import type { ArrAppWithKey } from '../api/types';

const { getAllSeries, getAllMovies } = vi.hoisted(() => ({
  getAllSeries: vi.fn(async () => []),
  getAllMovies: vi.fn(async () => []),
}));

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    getAllSeries,
    getAllMovies,
  }),
}));

const { getExistingItems, saveExistingItems } = vi.hoisted(() => ({
  getExistingItems: vi.fn(),
  saveExistingItems: vi.fn(),
}));

vi.mock('../utils/storage', () => ({
  storage: {
    getExistingItems,
    saveExistingItems,
  },
}));

const sonarrApp: ArrAppWithKey = {
  id: 'sonarr-1',
  name: 'Sonarr',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'abc12345',
  icon: '',
};

describe('useExistingItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses tvdbId even when cached items lack kind', async () => {
    getExistingItems.mockResolvedValue({
      items: [{ id: 1, tvdbId: '418666' }],
      timestamp: Date.now(),
    });
    getAllSeries.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useExistingItems(sonarrApp));

    await waitFor(() => {
      expect(result.current.addedItems.has(418666)).toBe(true);
    });
  });
});
