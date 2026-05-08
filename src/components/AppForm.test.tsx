import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppForm from './AppForm';

const fillRequiredFields = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
  await user.selectOptions(screen.getByLabelText('App Type'), 'sonarr');
  return user;
};

describe('AppForm', () => {
  it('disables submit until url and api key are valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.selectOptions(screen.getByLabelText('App Type'), 'sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'not-a-url');
    await user.type(screen.getByLabelText('API Key'), 'short');

    const submit = screen.getByRole('button', { name: 'Add App' });
    expect(submit).toBeDisabled();
  });

  it('submits normalized app data without requesting permissions directly', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989/');
    await user.type(screen.getByLabelText('API Key'), 'longerkey');
    await user.click(screen.getByRole('button', { name: 'Add App' }));

    expect(chrome.permissions.request).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Sonarr',
      type: 'sonarr',
      url: 'http://localhost:8989',
      apiKey: 'longerkey',
      icon: '',
    });
  });
});
