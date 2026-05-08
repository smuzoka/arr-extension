import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArrAppWithKey } from '../api/types';
import AppSettingsPanel from './AppSettingsPanel';

const baseApp: ArrAppWithKey = {
  id: '1',
  name: 'My Sonarr',
  type: 'sonarr',
  url: 'http://localhost:8989',
  apiKey: 'apikey123',
  icon: '',
};

const buildProps = (overrides: Partial<React.ComponentProps<typeof AppSettingsPanel>> = {}) => ({
  apps: [baseApp],
  editingApp: baseApp,
  showForm: true,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  onTestConnection: vi.fn().mockResolvedValue({ success: true, message: 'ok' }),
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onGrantPermission: vi.fn(),
  permissionByAppId: { [baseApp.id]: false },
  ...overrides,
});

describe('AppSettingsPanel', () => {
  it('shows the list and form when the form is open', () => {
    render(<AppSettingsPanel {...buildProps()} />);

    expect(screen.getByRole('button', { name: /add new app/i })).toBeInTheDocument();
    expect(screen.getByText('My Sonarr')).toBeInTheDocument();
    expect(screen.getByLabelText('App Name')).toBeInTheDocument();
  });
});
