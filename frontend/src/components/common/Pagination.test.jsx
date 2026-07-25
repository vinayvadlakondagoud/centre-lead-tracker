import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders page info', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={() => {}} />);
    expect(screen.getByText(/page 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/50 total/)).toBeInTheDocument();
  });

  it('disables Prev on first page', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={() => {}} />);
    const prevBtn = screen.getByText('Prev');
    expect(prevBtn).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(<Pagination page={5} totalPages={5} total={50} onPageChange={() => {}} />);
    const nextBtn = screen.getByText('Next');
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Pagination page={2} totalPages={5} total={50} onPageChange={handleChange} />);
    await user.click(screen.getByText('3'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not render when totalPages <= 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} total={5} onPageChange={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
