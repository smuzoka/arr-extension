import { useEffect, useMemo, useRef, useState } from 'react';
import { createArrApi } from '../api/arrApi';
import type { ArrAppWithKey, SearchFilters, SearchResult } from '../api/types';

const DEFAULT_FILTERS: SearchFilters = {
  year: null,
  genres: [],
  network: null,
  language: null
};

export const useSearch = (app: ArrAppWithKey | null) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchIdRef = useRef(0);
  const debounceRef = useRef<number | undefined>(undefined);
  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

  useEffect(() => {
    if (!app || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cacheKey = `${app.id}:${query.trim().toLowerCase()}`;
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      setResults(cached);
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const currentSearchId = ++searchIdRef.current;
      setLoading(true);
      setError(null);
      setFilters(DEFAULT_FILTERS);

      try {
        const api = createArrApi(app);
        const nextResults = app.type === 'sonarr'
          ? await api.searchSeries(query)
          : await api.searchMovies(query);

        if (currentSearchId === searchIdRef.current) {
          cacheRef.current.set(cacheKey, nextResults);
          setResults(nextResults);
        }
      } catch (err) {
        if (currentSearchId === searchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Search failed');
        }
      } finally {
        if (currentSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [app, query]);

  const filteredResults = useMemo(() => {
    if (results.length === 0) return [];
    const hasFilters = Boolean(
      filters.year ||
      filters.network ||
      filters.language ||
      (filters.genres && filters.genres.length > 0)
    );
    if (!hasFilters) return results;

    const yearFilter = filters.year ?? null;
    const networkFilter = filters.network?.trim().toLowerCase();
    const languageFilter = filters.language?.trim().toLowerCase();
    const selectedGenres = (filters.genres ?? [])
      .map(genre => genre.trim().toLowerCase())
      .filter(Boolean);

    return results.filter(result => {
      if (yearFilter && result.year !== yearFilter) return false;
      if (networkFilter) {
        const network = result.network?.trim().toLowerCase();
        if (!network || network !== networkFilter) return false;
      }
      if (languageFilter) {
        const language = (result.language ?? result.originalLanguage?.name)
          ?.trim()
          .toLowerCase();
        if (!language || language !== languageFilter) return false;
      }
      if (selectedGenres.length > 0) {
        const resultGenres = (result.genres ?? [])
          .map(genre => genre.trim().toLowerCase())
          .filter(Boolean);
        const matchesGenre = selectedGenres.some(genre => resultGenres.includes(genre));
        if (!matchesGenre) return false;
      }
      return true;
    });
  }, [results, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return {
    query,
    setQuery,
    results: filteredResults,
    allResults: results,
    filters,
    setFilters,
    loading,
    error,
    resetFilters
  };
};
