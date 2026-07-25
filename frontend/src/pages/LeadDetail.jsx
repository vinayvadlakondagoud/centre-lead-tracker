import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CHANNELS, OUTCOMES, formatIST, isOverdue } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/common/Modal';

const CLOSED_STATUSES = ['Converted', 'Lost'];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupForm, setFollowupForm] = useState({ channel: 'Phone', outcome: 'Reached', followed_up_at: '', notes: '', next_followup_at: '' });
  const [followupLoading, setFollowupLoading] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getLead(id);
      setLead(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  const handleArchive = async () => {
    if (!window.confirm('Archive this lead? It will be hidden from the main list but can be restored.')) return;
    try {
      await api.archiveLead(id);
      navigate('/leads');
    } catch (err) {
      alert('Archive failed: ' + err.message);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    setFollowupLoading(true);
    try {
      const payload = { ...followupForm };
      if (!payload.followed_up_at) delete payload.followed_up_at;
      await api.addFollowup(id, payload);
      setShowFollowupForm(false);
      setFollowupForm({ channel: 'Phone', outcome: 'Reached', followed_up_at: '', notes: '', next_followup_at: '' });
      fetchLead();
    } catch (err) {
      alert('Failed to add followup: ' + err.message);
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleDeleteFollowup = async (fid) => {
    if (!window.confirm('Delete this followup?')) return;
    try {
      await api.deleteFollowup(id, fid);
      fetchLead();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading lead..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchLead} />;
  if (!lead) return <ErrorMessage message="Lead not found" />;

  const isClosed = CLOSED_STATUSES.includes(lead.status);

  return (
    <div className="lead-detail">
      <div className="page-header">
        <div>
          <Link to="/leads" className="back-link">&larr; Back to Leads</Link>
          <h1>{lead.parent_name}</h1>
        </div>
        <div className="page-actions">
          <StatusBadge status={lead.status} />
          {!lead.is_archived && (
            <>
              {!isClosed && (
                <Link to={`/leads/${id}/edit`} className="btn btn-secondary">Edit</Link>
              )}
              <button onClick={() => setShowFollowupForm(true)} className="btn btn-primary">+ Follow-up</button>
              <button onClick={handleArchive} className="btn btn-danger">Archive</button>
            </>
          )}
        </div>
      </div>

      {isClosed && (
        <div className="info-banner">
          Lead is <strong>{lead.status}</strong>. Only notes can be edited.
        </div>
      )}

      {/* Lead Info */}
      <div className="detail-grid">
        <div className="detail-card">
          <h3>Contact Information</h3>
          <dl>
            <dt>Parent</dt><dd>{lead.parent_name}</dd>
            <dt>Child</dt><dd>{lead.child_name}, age {lead.child_age}</dd>
            <dt>Phone</dt><dd>{lead.phone}</dd>
            <dt>Email</dt><dd>{lead.email}</dd>
          </dl>
        </div>
        <div className="detail-card">
          <h3>Enquiry Details</h3>
          <dl>
            <dt>Centre</dt><dd>{lead.centre_name} ({lead.centre_city})</dd>
            <dt>Source</dt><dd>{lead.source}</dd>
            <dt>Owner</dt><dd>{lead.owner_name}</dd>
            <dt>Created</dt><dd>{formatIST(lead.created_at)}</dd>
            <dt>Next Follow-up</dt>
            <dd className={isOverdue(lead.next_followup_at) ? 'text-danger' : ''}>
              {lead.next_followup_at ? formatIST(lead.next_followup_at) : '-'}
              {isOverdue(lead.next_followup_at) && ' (OVERDUE)'}
            </dd>
          </dl>
        </div>
        {lead.notes && (
          <div className="detail-card detail-notes">
            <h3>Notes</h3>
            <p>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Followups Timeline */}
      <div className="followups-section">
        <h2>Follow-ups ({lead.followups?.length || 0})</h2>
        {lead.followups && lead.followups.length > 0 ? (
          <div className="followups-timeline">
            {lead.followups.map((f) => (
              <div key={f.id} className="followup-card">
                <div className="followup-header">
                  <span className="followup-channel">{f.channel}</span>
                  <span className="followup-outcome">{f.outcome}</span>
                  <span className="followup-date">{formatIST(f.followed_up_at)}</span>
                  <button onClick={() => handleDeleteFollowup(f.id)} className="btn-icon" title="Delete">&times;</button>
                </div>
                {f.notes && <p className="followup-notes">{f.notes}</p>}
                {f.next_followup_at && (
                  <div className="followup-next">
                    Next: {formatIST(f.next_followup_at)}
                    {!isClosed && isOverdue(f.next_followup_at) && <span className="text-danger"> (OVERDUE)</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No follow-ups recorded yet.</p>
        )}
      </div>

      {/* Add Followup Modal */}
      <Modal isOpen={showFollowupForm} onClose={() => setShowFollowupForm(false)} title="Add Follow-up">
        <form onSubmit={handleAddFollowup} className="form">
          <div className="form-group">
            <label>Follow-up Date</label>
            <input type="datetime-local" value={followupForm.followed_up_at} onChange={(e) => setFollowupForm({ ...followupForm, followed_up_at: e.target.value })} />
            <small className="text-muted">Leave empty for current date/time</small>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Channel</label>
              <select value={followupForm.channel} onChange={(e) => setFollowupForm({ ...followupForm, channel: e.target.value })}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Outcome</label>
              <select value={followupForm.outcome} onChange={(e) => setFollowupForm({ ...followupForm, outcome: e.target.value })}>
                {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows="3" value={followupForm.notes} onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Next Follow-up Date</label>
            <input type="datetime-local" value={followupForm.next_followup_at} onChange={(e) => setFollowupForm({ ...followupForm, next_followup_at: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowFollowupForm(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={followupLoading} className="btn btn-primary">
              {followupLoading ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
