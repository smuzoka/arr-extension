import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Popup from './Popup';
import type { ArrApp } from '../api/types';

const app: ArrApp = {
  id: '1',
  name: 'Test',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'abc12345',
  icon: ''
};

const { getArrApps, getSelectedText, searchSeries, getAllSeries } = vi.hoisted(() => ({
  getArrApps: vi.fn(async () => [app]),
  getSelectedText: vi.fn(async () => {
    return new Promise<string>((resolve) => {
      setTimeout(() => resolve('Star Trek'), 50);
    });
  }),
  searchSeries: vi.fn(async () => []),
  getAllSeries: vi.fn(async () => [])
}));

vi.mock('../utils/storage', () => ({
  storage: {
    getArrApps,
    getSelectedText,
    getSelectedAppId: vi.fn(async () => null),
    setSelectedAppId: vi.fn(async () => {}),
    migrateApiKeys: vi.fn(async () => {}),
    addArrApp: vi.fn(),
    updateArrApp: vi.fn(),
    removeArrApp: vi.fn(),
    saveArrApps: vi.fn(),
    clearSelectedText: vi.fn(),
    saveLastUsedOptions: vi.fn(),
    getLastUsedOptions: vi.fn(),
    saveArrMetadata: vi.fn(),
    getArrMetadata: vi.fn()
  }
}));

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    searchSeries,
    getAllSeries,
    searchMovies: vi.fn(),
    getAllMovies: vi.fn(),
    testConnection: vi.fn()
  })
}));

describe('Popup init', () => {
  it('renders without crashing', async () => {
    const { container } = render(<Popup />);
    expect(container).toBeDefined();
  });
});
