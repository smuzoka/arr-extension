import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SetupPage from './SetupPage';
import { resetStorageState } from '../test/setupTests';

describe('SetupPage integration flows', () => {
  beforeEach(() => {
    resetStorageState();
    vi.clearAllMocks();
  });

  it('retries permission grant from the saved app row', async () => {
    const user = userEvent.setup();
    (chrome.permissions.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    (chrome.permissions.contains as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    render(<SetupPage />);

    await user.click(screen.getByRole('button', { name: /add new app/i }));
    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989');
    await user.type(screen.getByLabelText('API Key'), 'testapikey123');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    await user.click(await screen.findByRole('button', { name: /grant permission/i }));

    expect(await screen.findByText('My Sonarr is ready to use.')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
