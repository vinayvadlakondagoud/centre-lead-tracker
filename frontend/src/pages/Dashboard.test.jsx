import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

const mockDashboard = {
  success: true,
  data: { total: 25, new: 7, demoScheduled: 4, converted: 3, lost: 3, archived: 2, overdue: 5, todayFollowups: 3 },
};
const mockByStatus = {
  success: true,
  data: [
    { status: 'New', count: 7 },
    { status: 'Contacted', count: 6 },
    { status: 'Converted', count: 3 },
    { status: 'Lost', count: 3 },
  ],
};
const mockByCentre = { success: true, data: [{ centreId: 1, name: 'Andheri', city: 'Mumbai', count: 5 }] };
const mockByOwner = { success: true, data: [{ ownerId: 1, name: 'Priya', email: 'priya@test.com', count: 10 }] };
const mockOverdue = { success: true, data: [{ id: 1, parent_name: 'Test Parent', child_name: 'Test Child', status: 'New', centre_name: 'Andheri', owner_name: 'Priya', next_followup_at: '2020-01-01T00:00:00Z' }] };

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const responses = {
      '/api/dashboard': mockDashboard,
      '/api/dashboard/by-status': mockByStatus,
      '/api/dashboard/by-centre': mockByCentre,
      '/api/dashboard/by-owner': mockByOwner,
      '/api/dashboard/overdue': mockOverdue,
      '/api/admin/centres': { success: true, data: [] },
      '/api/admin/owners': { success: true, data: [] },
    };
    const key = url.replace('http://localhost', '');
    return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve(responses[key] || { success: true, data: {} }) });
  });
});

describe('Dashboard', () => {
  it('renders total leads stat', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Total Leads')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('renders stat cards for converted and lost', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText('Converted').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Lost').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the status bar chart', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('status-chart')).toBeInTheDocument();
      expect(screen.getAllByText('Contacted').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders overdue leads section', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Overdue Follow-ups/)).toBeInTheDocument();
      expect(screen.getByText('Test Parent')).toBeInTheDocument();
    });
  });

  it('renders by-centre and by-owner tables', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText('Andheri').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Priya').length).toBeGreaterThanOrEqual(1);
    });
  });
});
