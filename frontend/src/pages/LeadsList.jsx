import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ALL_STATUSES, SOURCES, isOverdue } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const CLOSED_STATUSES = ['Converted', 'Lost'];

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    centre_id: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 10,
  });

  const [centres, setCentres] = useState([]);

  useEffect(() => {
    api.getCentres().then((r) => setCentres(r.data)).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) params[k] = v;
      });
      const result = await api.getLeads(params);
      setLeads(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'page' && k !== 'limit') params[k] = v;
      });
      const csv = await api.exportLeads(params);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="leads-list">
      <div className="page-header">
        <h1>Leads</h1>
        <div className="page-actions">
          <button onClick={handleExport} className="btn btn-secondary">Export CSV</button>
          <Link to="/leads/new" className="btn btn-primary">+ New Lead</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="filter-search"
        />
        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.source} onChange={(e) => handleFilterChange('source', e.target.value)}>
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.centre_id} onChange={(e) => handleFilterChange('centre_id', e.target.value)}>
          <option value="">All Centres</option>
          {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="filter-date">
          From:
          <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
        </label>
        <label className="filter-date">
          To:
          <input type="date" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
        </label>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading leads..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <div className="empty-state">No leads found matching your filters.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table" data-testid="leads-table">
              <thead>
                <tr>
                  <th>Parent</th>
                  <th>Child</th>
                  <th>Phone</th>
                  <th>Centre</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isClosed = CLOSED_STATUSES.includes(lead.status);
                  const showOverdue = !isClosed && isOverdue(lead.next_followup_at);
                  return (
                    <tr key={lead.id} className={showOverdue ? 'row-overdue' : ''}>
                      <td><Link to={`/leads/${lead.id}`}>{lead.parent_name}</Link></td>
                      <td>{lead.child_name} ({lead.child_age})</td>
                      <td>{lead.phone}</td>
                      <td>{lead.centre_name}</td>
                      <td>{lead.source}</td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td>{lead.owner_name}</td>
                      <td className={showOverdue ? 'text-danger' : ''}>
                        {lead.next_followup_at
                          ? new Date(lead.next_followup_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
