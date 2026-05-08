import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SetupPage from './SetupPage';
import { resetStorageState } from '../test/setupTests';

describe('SetupPage', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('keeps the app saved and marks it as permission required when permission is denied', async () => {
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.click(screen.getByRole('button', { name: /add new app/i }));
    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989');
    await user.type(screen.getByLabelText('API Key'), 'testapikey123');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    expect(
      await screen.findByText(
        'App saved. Grant permission before using it in the popup.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Permission required')).toBeInTheDocument();

    const syncData = await chrome.storage.sync.get(['arr_apps']);
    expect(syncData.arr_apps).toHaveLength(1);
  });

  it('requests permission and keeps the page open after a successful save', async () => {
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.click(screen.getByRole('button', { name: /add new app/i }));
    await user.type(screen.getByLabelText('App Name'), 'My Radarr');
    await user.selectOptions(screen.getByLabelText('App Type'), 'radarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:7878');
    await user.type(screen.getByLabelText('API Key'), 'radarrkey123');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ['http://localhost:7878/*'],
    });
    expect(
      await screen.findByText('App added and ready to use.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add new app/i }),
    ).toBeInTheDocument();
  });
});
