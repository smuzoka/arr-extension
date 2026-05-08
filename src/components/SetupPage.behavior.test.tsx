import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArrAppWithKey } from '../api/types';
import SetupPage from './SetupPage';
import { storage } from '../utils/storage';
import { resetStorageState } from '../test/setupTests';

const testConnection = vi.fn().mockResolvedValue({ version: '1.0' });

vi.mock('../api/arrApi', () => ({
  createArrApi: () => ({
    testConnection,
  }),
}));

const baseApp: ArrAppWithKey = {
  id: '1',
  name: 'My Sonarr',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'apikey123',
  icon: '',
};

describe('SetupPage behaviors', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
  });

  it('updates permission status after a successful test connection', async () => {
    const user = userEvent.setup();
    (chrome.permissions.contains as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await storage.addArrApp(baseApp);

    render(<SetupPage />);

    expect(await screen.findByText('My Sonarr')).toBeInTheDocument();
    expect(screen.getByText('Permission required')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^test$/i }));

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Permission required')).not.toBeInTheDocument();
    });
  });

  it('clears the form when deleting the edited app', async () => {
    const user = userEvent.setup();

    await storage.addArrApp(baseApp);

    render(<SetupPage />);

    expect(await screen.findByText('My Sonarr')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(await screen.findByRole('button', { name: /update app/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(
      await screen.findByText('Select an app to edit or add a new one.'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /update app/i })).not.toBeInTheDocument();
    });

    expect(await screen.findByText(/No \*arr apps configured\./i)).toBeInTheDocument();
  });
});
