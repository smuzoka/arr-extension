import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AppForm from './AppForm';

const fillRequiredFields = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
  await user.selectOptions(screen.getByLabelText('App Type'), 'sonarr');
  return user;
};

describe('AppForm', () => {
  beforeEach(() => {
    const requestMock = vi.fn(async () => true);
    (chrome.permissions.request as unknown as { mockImplementation: (fn: () => Promise<boolean>) => void })
      .mockImplementation(requestMock);
  });

  it('disables submit until url and api key are valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

    await user.type(screen.getByLabelText('App Name'), 'My Sonarr');
    await user.selectOptions(screen.getByLabelText('App Type'), 'sonarr');
    await user.type(screen.getByLabelText('Server URL'), 'not-a-url');
    await user.type(screen.getByLabelText('API Key'), 'short');

    const submit = screen.getByRole('button', { name: 'Add App' });
    expect(submit).toBeDisabled();
  });

  it('requests permission and submits on grant', async () => {
    const onSubmit = vi.fn();

    render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

    const user = await fillRequiredFields();
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989/');
    await user.type(screen.getByLabelText('API Key'), 'longerkey');

    await user.click(screen.getByRole('button', { name: 'Add App' }));

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ['http://localhost:8989/*']
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Sonarr',
      type: 'sonarr',
      url: 'http://localhost:8989',
      apiKey: 'longerkey',
      icon: ''
    });
  });

  it('shows error when permission is denied', async () => {
    (chrome.permissions.request as unknown as { mockResolvedValue: (value: boolean) => void })
      .mockResolvedValue(false);

    const onSubmit = vi.fn();

    render(<AppForm onSubmit={onSubmit} onCancel={() => undefined} />);

    const user = await fillRequiredFields();
    await user.type(screen.getByLabelText('Server URL'), 'http://localhost:8989');
    await user.type(screen.getByLabelText('API Key'), 'longerkey');

    await user.click(screen.getByRole('button', { name: 'Add App' }));

    expect(await screen.findByText('Permission denied for this server origin.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
