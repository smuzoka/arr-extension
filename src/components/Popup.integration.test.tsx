import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Popup from './Popup';
import { resetStorageState } from '../test/setupTests';

const searchSeries = vi.fn(async () => []);
const getAllSeries = vi.fn(async () => []);
const searchMovies = vi.fn(async () => []);
const getAllMovies = vi.fn(async () => []);

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    searchSeries,
    getAllSeries,
    searchMovies,
    getAllMovies,
    testConnection: vi.fn(),
  }),
}));

const seedApp = async () => {
  await chrome.storage.sync.set({
    arr_apps: [
      {
        id: '1',
        name: 'My Sonarr',
        type: 'sonarr',
        url: 'http://localhost:8989',
        icon: '',
      },
    ],
  });
  await chrome.storage.local.set({
    arr_api_keys: { '1': 'testapikey123' },
  });
};

describe('Popup integration flows', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(chrome.runtime.getURL).mockImplementation(
      (path?: string) => `chrome-extension://test/${path ?? ''}`,
    );
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    vi.mocked(chrome.tabs.create).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
    vi.mocked(chrome.tabs.update).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('shows empty state when no apps configured', async () => {
    render(<Popup />);
    await waitFor(() => {
      expect(screen.getByText('No *arr apps configured.')).toBeInTheDocument();
    });
  });

  it('opens the setup tab from the settings button', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(await screen.findByRole('button', { name: 'Open settings' }));

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/setup.html',
      active: true,
    });
  });

  it('shows search bar when an app is configured', async () => {
    await seedApp();
    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search my sonarr/i)).toBeInTheDocument();
    });
  });

  it('performs search and displays results', async () => {
    const user = userEvent.setup();
    await seedApp();
    render(<Popup />);

    searchSeries.mockResolvedValue([
      {
        id: 1,
        title: 'Breaking Bad',
        year: 2008,
        kind: 'series',
        overview: 'A chemistry teacher becomes a meth producer',
        images: [],
        genres: ['Drama'],
        tvdbId: 81189,
      },
    ]);

    const searchInput = await screen.findByPlaceholderText(/search my sonarr/i);
    await user.type(searchInput, 'Breaking Bad{enter}');

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });
  });
});
