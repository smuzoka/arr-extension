import React, { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '../api/types';
import { AddIcon, CheckIcon } from '../utils/icons';

interface ResultCardProps {
  result: SearchResult;
  isAdded: boolean;
  onClick: () => void;
  showControls?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, isAdded, onClick, showControls = true }) => {
  // More robust poster URL selection
  const getPosterUrl = () => {
    // console.log('Getting poster URL for:', result.title);
    // console.log('Images array:', result.images);
    // console.log('Remote poster:', result.remotePoster);
    
    // Try to find poster from images array (check multiple possible coverType values)
    if (result.images && Array.isArray(result.images) && result.images.length > 0) {
      // console.log('Found images array with', result.images.length, 'items');
      const posterImage = result.images.find(img => 
        img.coverType?.toLowerCase() === 'poster' || 
        img.coverType?.toLowerCase() === 'posters'
      );
      if (posterImage?.url) {
        // console.log('Using poster from images array:', posterImage.url);
        return posterImage.url;
      }
      // console.log('No poster found in images array');
    }
    
    // Fall back to remotePoster
    if (result.remotePoster) {
      // console.log('Using remotePoster:', result.remotePoster);
      return result.remotePoster;
    }
    
    // Default placeholder
    console.log('Using default placeholder');
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCA2MCA5MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMCA0NUwyNSAzNUwzNSA0NUw0MCAzNUw0NSA0NUw0MCA1NUwzNSA0NUwyNSA1NUwyMCA0NVoiIGZpbGw9IiNkMWQ1ZGIiLz4KPC9zdmc+';
  };
  
  const posterUrl = getPosterUrl();

  const rating = result.ratings?.value ?? result.ratings?.imdb?.value ?? result.ratings?.tmdb?.value;
  const language = result.language || result.originalLanguage?.name;
  const validLanguage = language && typeof language === 'string' && language.trim() ? language.trim() : null;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const overviewRef = useRef<HTMLDivElement>(null);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Check if overview text is truncated and needs a toggle
  useEffect(() => {
    if (overviewRef.current && result.overview) {
      const element = overviewRef.current;
      // Check if content is being clamped (scrollHeight > clientHeight)
      const isTruncated = element.scrollHeight > element.clientHeight;
      setShowToggle(isTruncated);
    }
  }, [result.overview]);

  return (
    <div className="result-card" onClick={onClick}>
      <img 
        src={posterUrl} 
        alt={result.title}
        className="result-image"
        onError={(e) => {
          const img = e.currentTarget;
          console.log('Poster failed to load for:', result.title);
          console.log('Failed URL:', img.src);
          console.log('Available remotePoster:', result.remotePoster);
          
          // If we're not already on the remotePoster and it exists, try it
          if (img.src !== result.remotePoster && result.remotePoster) {
            console.log('Trying remotePoster fallback:', result.remotePoster);
            img.src = result.remotePoster;
          } else {
            // Use the default placeholder
            console.log('Using placeholder for:', result.title);
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCA2MCA5MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoOiBkPSJNMjAgNDVMMjUgMzVMMzUgNDVMNDAgMzVMNDUgNDVMNDAgNTVMMzUgNDVMMjUgNTVMMjAgNDVaIiBmaWxsPSIjZDFkNWRiIi8+Cjwvc3ZnPg==';
          }
        }}
        onLoad={() => {
          console.log('Poster loaded successfully for:', result.title, 'from URL:', posterUrl);
        }}
      />
      
      <div className="result-details">
        <h4 className="result-title">{result.title}</h4>
        
        {(result.year && result.year > 0 || typeof rating === 'number' || validLanguage || result.network) && (
          <div className="result-metadata">
            {result.year && result.year > 0 && (
              <span className="result-year">{result.year}</span>
            )}
            
            {typeof rating === 'number' && (
              <span className="result-rating">
                <i className="fas fa-star"></i> {rating.toFixed(1)}
              </span>
            )}
            
            {validLanguage && (
              <span className="result-language">
                <i className="fas fa-globe"></i> {validLanguage.toUpperCase()}
              </span>
            )}
            
            {result.network && (
              <span className="result-network">
                <i className="fas fa-tv"></i> {result.network}
              </span>
            )}
          </div>
        )}
        
        {result.genres && result.genres.length > 0 && (
          <div className="result-genres">
            <span className="genre-badge">
              {result.genres[0]}
            </span>
          </div>
        )}
        
        {result.overview && (
          <div className={`result-overview ${isExpanded ? 'expanded' : ''}`} ref={overviewRef}>
            {result.overview}
            {showToggle && (
              <span className="result-overview-toggle" onClick={handleToggleExpand}>
                <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </span>
            )}
          </div>
        )}
      </div>
      
      {showControls && (
        <>
          {isAdded ? (
            <div className="added-indicator">
              <CheckIcon />
            </div>
          ) : (
            <button 
              className="add-button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <AddIcon />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ResultCard; 