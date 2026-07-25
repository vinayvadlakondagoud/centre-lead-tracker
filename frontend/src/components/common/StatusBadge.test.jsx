import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the status label', () => {
    render(<StatusBadge status="New" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('New');
  });

  it('renders "Converted" with green styling', () => {
    render(<StatusBadge status="Converted" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Converted');
    expect(badge.style.color).toBe('rgb(16, 185, 129)');
  });

  it('renders "Lost" with red styling', () => {
    render(<StatusBadge status="Lost" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Lost');
    expect(badge.style.color).toBe('rgb(239, 68, 68)');
  });

  it('renders unknown status with default grey', () => {
    render(<StatusBadge status="Unknown" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Unknown');
    expect(badge.style.color).toBe('rgb(107, 114, 128)');
  });
});
