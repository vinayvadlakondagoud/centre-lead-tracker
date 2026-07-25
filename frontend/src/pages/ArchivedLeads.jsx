import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ArchivedLeads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getLeads({ archived: 'true', page, limit: 10 });
      setLeads(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);

  const handleRestore = async (leadId, leadName) => {
    if (!window.confirm(`Restore "${leadName}"? It will reappear in the main leads list.`)) return;
    try {
      await api.restoreLead(leadId);
      fetchArchived();
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
  };

  return (
    <div className="archived-leads">
      <div className="page-header">
        <h1>Archived Leads</h1>
        <Link to="/leads" className="btn btn-secondary">Active Leads</Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading archived leads..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchArchived} />
      ) : leads.length === 0 ? (
        <div className="empty-state">No archived leads.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table" data-testid="archived-table">
              <thead>
                <tr>
                  <th>Parent</th>
                  <th>Child</th>
                  <th>Centre</th>
                  <th>Status</th>
                  <th>Archived At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td><Link to={`/leads/${lead.id}`}>{lead.parent_name}</Link></td>
                    <td>{lead.child_name}</td>
                    <td>{lead.centre_name}</td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td>{lead.archived_at ? new Date(lead.archived_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}</td>
                    <td>
                      <button onClick={() => handleRestore(lead.id, lead.parent_name)} className="btn btn-sm btn-primary">
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
