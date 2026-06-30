import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultCard from './ResultCard';
import type { SearchResult } from '../api/types';

const series: SearchResult = {
  kind: 'series',
  id: 1,
  title: 'Severance',
  tvdbId: 123,
  year: 2022,
  images: [
    {
      coverType: 'poster',
      url: 'https://image.test/poster.jpg',
    },
  ],
  remotePoster: 'https://image.test/remote.jpg',
};

describe('ResultCard', () => {
  it('renders the poster source immediately without waiting for an observer', () => {
    render(<ResultCard result={series} isAdded={false} onClick={() => {}} />);

    expect(screen.getByRole('img', { name: /severance/i })).toHaveAttribute(
      'src',
      'https://image.test/poster.jpg',
    );
  });

  it('falls back to the remote poster, then the placeholder', () => {
    render(<ResultCard result={series} isAdded={false} onClick={() => {}} />);

    const image = screen.getByRole('img', { name: /severance/i });

    fireEvent.error(image);
    expect(image).toHaveAttribute('src', 'https://image.test/remote.jpg');

    fireEvent.error(image);
    expect(image.getAttribute('src')).toContain('data:image/svg+xml;base64,');
  });
});
