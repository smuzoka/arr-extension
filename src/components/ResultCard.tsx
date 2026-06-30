import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SearchResult } from '../api/types';
import {
  AddIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  StarIcon,
  TvIcon,
} from '../utils/icons';
import { PLACEHOLDER_POSTER } from '../utils/constants';

interface ResultCardProps {
  result: SearchResult;
  isAdded: boolean;
  onClick: () => void;
  showControls?: boolean;
}

const getPosterUrl = (result: SearchResult) => {
  const posterImage = result.images?.find(
    (image) => image.coverType?.toLowerCase() === 'poster' || image.coverType?.toLowerCase() === 'posters',
  );

  return posterImage?.url || result.remotePoster || PLACEHOLDER_POSTER;
};

const ResultCard: React.FC<ResultCardProps> = ({
  result,
  isAdded,
  onClick,
  showControls = true,
}) => {
  const posterUrl = getPosterUrl(result);
  const rating = result.ratings?.value ?? result.ratings?.imdb?.value ?? result.ratings?.tmdb?.value;
  const language = result.language || result.originalLanguage?.name;
  const validLanguage = language && typeof language === 'string' && language.trim() ? language.trim() : null;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const overviewRef = useRef<HTMLDivElement>(null);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.getAttribute('src') !== result.remotePoster && result.remotePoster) {
        img.src = result.remotePoster;
        return;
      }

      img.src = PLACEHOLDER_POSTER;
    },
    [result.remotePoster],
  );

  useEffect(() => {
    if (!overviewRef.current || !result.overview) {
      return;
    }

    const element = overviewRef.current;
    setShowToggle(element.scrollHeight > element.clientHeight);
  }, [result.overview]);

  return (
    <div className="result-card" onClick={onClick}>
      <img
        src={posterUrl}
        loading="lazy"
        alt={result.title}
        className="result-image"
        onError={handleImageError}
      />

      <div className="result-details">
        <h4 className="result-title">{result.title}</h4>

        {((result.year && result.year > 0) || typeof rating === 'number' || validLanguage || result.network) && (
          <div className="result-metadata">
            {result.year && result.year > 0 && (
              <span className="result-year">{result.year}</span>
            )}

            {typeof rating === 'number' && (
              <span className="result-rating">
                <StarIcon /> {rating.toFixed(1)}
              </span>
            )}

            {validLanguage && (
              <span className="result-language">
                <GlobeIcon /> {validLanguage.toUpperCase()}
              </span>
            )}

            {result.network && (
              <span className="result-network">
                <TvIcon /> {result.network}
              </span>
            )}
          </div>
        )}

        {result.genres && result.genres.length > 0 && (
          <div className="result-genres">
            <span className="genre-badge">{result.genres[0]}</span>
          </div>
        )}

        {result.overview && (
          <div className={`result-overview ${isExpanded ? 'expanded' : ''}`} ref={overviewRef}>
            {result.overview}
            {showToggle && (
              <span className="result-overview-toggle" onClick={handleToggleExpand}>
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </span>
            )}
          </div>
        )}
      </div>

      {showControls &&
        (isAdded ? (
          <div className="added-indicator">
            <CheckIcon />
          </div>
        ) : (
          <button
            className="add-button"
            aria-label={`Add ${result.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <AddIcon />
          </button>
        ))}
    </div>
  );
};

export default ResultCard;
