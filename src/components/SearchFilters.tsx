import React, { useMemo, useState } from 'react';
import type { SearchFilters } from '../api/types';

export type SearchFilterOptions = {
  years: number[];
  genres: string[];
  networks: string[];
  languages: string[];
};

interface SearchFiltersProps {
  filters: SearchFilters;
  options: SearchFilterOptions;
  onChange: (filters: SearchFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  options,
  onChange,
  totalCount,
  filteredCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.year) count += 1;
    if (filters.network) count += 1;
    if (filters.language) count += 1;
    if (filters.genres && filters.genres.length > 0) count += filters.genres.length;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;
  const showResultCount = totalCount > 0 && filteredCount < totalCount;

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : null;
    onChange({
      ...filters,
      year: Number.isFinite(value) ? value : null
    });
  };

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value || null;
    onChange({
      ...filters,
      network: value
    });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value || null;
    onChange({
      ...filters,
      language: value
    });
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres ?? [];
    const isActive = current.includes(genre);
    const nextGenres = isActive
      ? current.filter(item => item !== genre)
      : [...current, genre];

    onChange({
      ...filters,
      genres: nextGenres
    });
  };

  const clearFilters = () => {
    onChange({
      year: null,
      genres: [],
      network: null,
      language: null
    });
  };

  return (
    <div className={`search-filters ${isOpen ? 'open' : ''}`}>
      <div className="search-filters-header">
        <button
          className="filters-toggle"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
        >
          <i className="fas fa-filter"></i>
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </button>

        {showResultCount && (
          <div className="filter-count">
            Showing {filteredCount} of {totalCount}
          </div>
        )}

        {hasActiveFilters && (
          <button
            className="filters-clear"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-filters-body">
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-year">Year</label>
            <select
              id="filter-year"
              className="filter-select"
              value={filters.year ?? ''}
              onChange={handleYearChange}
            >
              <option value="">All</option>
              {options.years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Genre</label>
            <div className="filter-chips">
              {options.genres.length === 0 && (
                <span className="filter-empty">No genres available</span>
              )}
              {options.genres.map(genre => {
                const isActive = (filters.genres ?? []).includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-network">Network/Studio</label>
            <select
              id="filter-network"
              className="filter-select"
              value={filters.network ?? ''}
              onChange={handleNetworkChange}
            >
              <option value="">All</option>
              {options.networks.map(network => (
                <option key={network} value={network}>
                  {network}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-language">Language</label>
            <select
              id="filter-language"
              className="filter-select"
              value={filters.language ?? ''}
              onChange={handleLanguageChange}
            >
              <option value="">All</option>
              {options.languages.map(language => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
