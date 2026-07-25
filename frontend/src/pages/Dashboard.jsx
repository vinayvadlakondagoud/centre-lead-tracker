import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ALL_STATUSES } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [byCentre, setByCentre] = useState([]);
  const [byOwner, setByOwner] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCentre, setFilterCentre] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [centres, setCentres] = useState([]);
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    Promise.all([api.getCentres(), api.getOwners()]).then(([c, o]) => {
      setCentres(c.data);
      setOwners(o.data);
    }).catch(() => {});
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (filterCentre) params.centre_id = filterCentre;
      if (filterOwner) params.owner_id = filterOwner;
      if (filterStatus) params.status = filterStatus;

      const [s, st, c, o, od] = await Promise.all([
        api.getDashboard(params),
        api.getDashboardByStatus(params),
        api.getDashboardByCentre(),
        api.getDashboardByOwner(),
        api.getOverdueLeads(),
      ]);
      setStats(s.data);
      setByStatus(st.data);
      setByCentre(c.data);
      setByOwner(o.data);
      setOverdue(od.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterCentre, filterOwner, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAll} />;

  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Date Range + Centre/Owner/Status Filters */}
      <div className="filter-bar">
        <label>
          From:
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          To:
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <select value={filterCentre} onChange={(e) => setFilterCentre(e.target.value)}>
          <option value="">All Centres</option>
          {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
          <option value="">All Owners</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(dateFrom || dateTo || filterCentre || filterOwner || filterStatus) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterCentre(''); setFilterOwner(''); setFilterStatus(''); }} className="btn btn-secondary btn-sm">Clear All</button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <Link to="/leads" className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Leads</div>
        </Link>
        <div className="stat-card stat-new">
          <div className="stat-number">{stats.new}</div>
          <div className="stat-label">New</div>
        </div>
        <div className="stat-card stat-demo">
          <div className="stat-number">{stats.demoScheduled}</div>
          <div className="stat-label">Demos Scheduled</div>
        </div>
        <div className="stat-card stat-converted">
          <div className="stat-number">{stats.converted}</div>
          <div className="stat-label">Converted</div>
        </div>
        <div className="stat-card stat-lost">
          <div className="stat-number">{stats.lost}</div>
          <div className="stat-label">Lost</div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-number">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card stat-archived">
          <div className="stat-number">{stats.archived}</div>
          <div className="stat-label">Archived</div>
        </div>
      </div>

      {/* Bar Chart — Leads by Status */}
      <div className="dashboard-section">
        <h2>Leads by Status</h2>
        <div className="bar-chart" data-testid="status-chart">
          {byStatus.map((item) => (
            <div key={item.status} className="bar-row">
              <span className="bar-label">{item.status}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(item.count / maxStatus) * 100}%` }}
                />
              </div>
              <span className="bar-value">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* By Centre */}
        <div className="dashboard-section">
          <h2>By Centre</h2>
          <table className="data-table">
            <thead>
              <tr><th>Centre</th><th>City</th><th>Count</th></tr>
            </thead>
            <tbody>
              {byCentre.map((c) => (
                <tr key={c.centreId}>
                  <td>{c.name}</td>
                  <td>{c.city}</td>
                  <td><strong>{c.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Owner */}
        <div className="dashboard-section">
          <h2>By Owner</h2>
          <table className="data-table">
            <thead>
              <tr><th>Owner</th><th>Email</th><th>Count</th></tr>
            </thead>
            <tbody>
              {byOwner.map((o) => (
                <tr key={o.ownerId}>
                  <td>{o.name}</td>
                  <td>{o.email}</td>
                  <td><strong>{o.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="dashboard-section">
          <h2>Overdue Follow-ups ({overdue.length})</h2>
          <table className="data-table">
            <thead>
              <tr><th>Parent</th><th>Child</th><th>Status</th><th>Centre</th><th>Owner</th><th>Due</th></tr>
            </thead>
            <tbody>
              {overdue.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/leads/${l.id}`}>{l.parent_name}</Link></td>
                  <td>{l.child_name}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>{l.centre_name}</td>
                  <td>{l.owner_name}</td>
                  <td className="text-danger">{new Date(l.next_followup_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
