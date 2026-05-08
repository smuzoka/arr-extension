import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSearch } from './useSearch';
import type { ArrAppWithKey, SeriesResult, MovieResult } from '../api/types';

const searchSeries = vi.fn<(term: string) => Promise<SeriesResult[]>>();
const searchMovies = vi.fn<(term: string) => Promise<MovieResult[]>>();

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    searchSeries,
    searchMovies,
  }),
}));

const sonarrApp: ArrAppWithKey = {
  id: 'sonarr-1',
  name: 'Sonarr',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'abc12345',
  icon: '',
};

const radarrApp: ArrAppWithKey = {
  id: 'radarr-1',
  name: 'Radarr',
  type: 'radarr',
  url: 'http://localhost:7878',
  apiKey: 'abc12345',
  icon: '',
};

const mockSeriesResults: SeriesResult[] = [
  { kind: 'series', id: 1, title: 'Test Show', tvdbId: 123, images: [], year: 2024 },
];

const mockMovieResults: MovieResult[] = [
  { kind: 'movie', id: 1, title: 'Test Movie', tmdbId: 456, images: [], year: 2024 },
];

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchSeries.mockReset();
    searchMovies.mockReset();
    searchSeries.mockResolvedValue(mockSeriesResults);
    searchMovies.mockResolvedValue(mockMovieResults);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search by 300ms', async () => {
    const { result } = renderHook(() => useSearch(sonarrApp));

    act(() => {
      result.current.setQuery('test');
    });

    // Before debounce fires
    expect(searchSeries).not.toHaveBeenCalled();

    // After debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(searchSeries).toHaveBeenCalledTimes(1);
    expect(searchSeries).toHaveBeenCalledWith('test');
  });

  it('caches results by app and query', async () => {
    const { result } = renderHook(() => useSearch(sonarrApp));

    // First search
    act(() => {
      result.current.setQuery('test');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(searchSeries).toHaveBeenCalledTimes(1);

    // Clear query
    act(() => {
      result.current.setQuery('');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Same query again — should still call API (cache provides instant results, API refreshes)
    act(() => {
      result.current.setQuery('test');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Cache provides immediate results, but API is called again to refresh
    expect(searchSeries).toHaveBeenCalledTimes(2);
  });

  it('clears results when query is empty', async () => {
    const { result } = renderHook(() => useSearch(sonarrApp));

    act(() => {
      result.current.setQuery('test');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.allResults).toHaveLength(1);

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.allResults).toHaveLength(0);
  });

  it('clears results when app is null', () => {
    const { result } = renderHook(() => useSearch(null));

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.allResults).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('calls searchMovies for radarr apps', async () => {
    const { result } = renderHook(() => useSearch(radarrApp));

    act(() => {
      result.current.setQuery('movie');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(searchMovies).toHaveBeenCalledTimes(1);
    expect(searchSeries).not.toHaveBeenCalled();
  });

  it('sets error on search failure', async () => {
    searchSeries.mockRejectedValue(new Error('Server timed out.'));

    const { result } = renderHook(() => useSearch(sonarrApp));

    act(() => {
      result.current.setQuery('fail');
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.error).toBe('Server timed out.');
    expect(result.current.loading).toBe(false);
  });
});
