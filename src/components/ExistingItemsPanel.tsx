import React from 'react';
import type { SearchResult } from '../api/types';

interface ExistingItemsPanelProps {
  items: SearchResult[];
  loading: boolean;
  onRemove: (item: SearchResult) => void;
}

const ExistingItemsPanel: React.FC<ExistingItemsPanelProps> = ({
  items,
  loading,
  onRemove,
}) => {
  if (loading) {
    return <div className="loading-message">Loading library items...</div>;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="existing-items">
      {items.map((item) => (
        <div key={`${item.kind}-${item.id}`} className="existing-item">
          <div className="existing-item-title">{item.title}</div>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onRemove(item)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

export default ExistingItemsPanel;
