import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsIcon } from './icons';

describe('SettingsIcon', () => {
  it('renders as a filled gear silhouette with the gear viewBox', () => {
    const { container } = render(<SettingsIcon />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('stroke', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelector('circle')).toBeNull();
  });
});
