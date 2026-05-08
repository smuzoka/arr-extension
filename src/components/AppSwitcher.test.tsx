import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppSwitcher from './AppSwitcher';

const apps = [
  {
    id: '1',
    name: 'My Sonarr',
    type: 'sonarr',
    url: 'http://localhost:8989',
    icon: '',
  },
  {
    id: '2',
    name: 'My Radarr',
    type: 'radarr',
    url: 'http://localhost:7878',
    icon: '',
  },
];

describe('AppSwitcher', () => {
  it('disables apps without permission and blocks selection', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <AppSwitcher
        apps={apps}
        selectedApp={apps[0]}
        disabledAppIds={new Set(['2'])}
        onAppSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: /switch to my radarr/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /switch to my sonarr/i }));
    expect(onSelect).toHaveBeenCalledWith(apps[0]);
  });
});
