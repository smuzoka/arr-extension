import { render, screen } from '@testing-library/react';
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

describe('Popup setup handoff', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
    vi.mocked(chrome.runtime.getURL).mockImplementation(
      (path?: string) => `chrome-extension://test/${path ?? ''}`,
    );
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    vi.mocked(chrome.tabs.create).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
    vi.mocked(chrome.tabs.update).mockResolvedValue({ id: 7 } as chrome.tabs.Tab);
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('opens the setup tab from the empty-state button', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    await user.click(await screen.findByRole('button', { name: /add app/i }));

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/setup.html?action=add',
      active: true,
    });
    expect(screen.queryByLabelText('App Name')).not.toBeInTheDocument();
  });

  it('renders apps without permission as disabled', async () => {
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
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    render(<Popup />);

    expect(
      await screen.findByRole('button', { name: /switch to my sonarr/i }),
    ).toBeDisabled();
    expect(
      screen.getByText('Finish setup in the setup tab to grant access to this app.'),
    ).toBeInTheDocument();
  });
});
