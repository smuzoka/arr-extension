import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    expect(await screen.findByText('App added and ready to use.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new app/i })).toBeInTheDocument();
  });
});

describe('SetupPage entrypoint styles', () => {
  it('includes full-width layout rules', () => {
    const cssPath = resolve(process.cwd(), 'entrypoints/setup/style.css');
    const css = readFileSync(cssPath, 'utf8');

    expect(css).toMatch(/body\s*\{[^}]*min-height:\s*100vh;/s);
    expect(css).toMatch(/#app\s*\{[^}]*width:\s*100%;/s);
    expect(css).toMatch(
      /\.setup-page-shell\s*\{[^}]*width:\s*min\(1200px,\s*100%\);/s,
    );
    expect(css).toMatch(
      /\.settings-layout\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*360px\)\s+minmax\(0,\s*1fr\);/s,
    );
    expect(css).toMatch(/@media\s*\(max-width:\s*900px\)/s);
  });
});
