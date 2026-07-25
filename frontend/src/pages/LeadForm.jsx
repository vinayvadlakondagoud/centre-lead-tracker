import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ALL_STATUSES, SOURCES } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const CLOSED_STATUSES = ['Converted', 'Lost'];

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    parent_name: '',
    child_name: '',
    child_age: '',
    phone: '',
    email: '',
    centre_id: '',
    source: '',
    owner_id: '',
    status: 'New',
    next_followup_at: '',
    notes: '',
  });

  const [centres, setCentres] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [leadStatus, setLeadStatus] = useState(null);
  const [depsError, setDepsError] = useState(null);

  useEffect(() => {
    Promise.all([api.getCentres(), api.getOwners()]).then(([c, o]) => {
      setCentres(c.data);
      setOwners(o.data);
    }).catch((err) => {
      setDepsError('Failed to load centres/owners: ' + err.message);
    });
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.getLead(id).then((result) => {
        const l = result.data;
        setLeadStatus(l.status);
        setForm({
          parent_name: l.parent_name || '',
          child_name: l.child_name || '',
          child_age: l.child_age || '',
          phone: l.phone || '',
          email: l.email || '',
          centre_id: l.centre_id || '',
          source: l.source || '',
          owner_id: l.owner_id || '',
          status: l.status || 'New',
          next_followup_at: l.next_followup_at ? l.next_followup_at.slice(0, 16) : '',
          notes: l.notes || '',
        });
        setLoading(false);
      }).catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      child_age: parseInt(form.child_age, 10),
      centre_id: parseInt(form.centre_id, 10),
      owner_id: parseInt(form.owner_id, 10),
      next_followup_at: form.next_followup_at || null,
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        if (CLOSED_STATUSES.includes(leadStatus)) {
          delete payload.status;
          delete payload.parent_name;
          delete payload.child_name;
          delete payload.child_age;
          delete payload.phone;
          delete payload.email;
          delete payload.centre_id;
          delete payload.source;
          delete payload.owner_id;
          delete payload.next_followup_at;
        }
        await api.updateLead(id, payload);
        navigate(`/leads/${id}`);
      } else {
        const result = await api.createLead(payload);
        navigate(`/leads/${result.data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading lead..." />;

  const isClosedEdit = isEdit && CLOSED_STATUSES.includes(leadStatus);

  return (
    <div className="lead-form-page">
      <div className="page-header">
        <div>
          <Link to={isEdit ? `/leads/${id}` : '/leads'} className="back-link">&larr; Back</Link>
          <h1>{isEdit ? 'Edit Lead' : 'New Lead'}</h1>
        </div>
      </div>

      {isClosedEdit && (
        <div className="info-banner">
          Lead is <strong>{leadStatus}</strong>. Only notes can be edited.
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      {depsError && <ErrorMessage message={depsError} />}

      <form onSubmit={handleSubmit} className="form form-card">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="parent_name">Parent Name *</label>
            <input id="parent_name" name="parent_name" value={form.parent_name} onChange={handleChange} required disabled={isClosedEdit} />
          </div>
          <div className="form-group">
            <label htmlFor="child_name">Child Name *</label>
            <input id="child_name" name="child_name" value={form.child_name} onChange={handleChange} required disabled={isClosedEdit} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="child_age">Child Age *</label>
            <input id="child_age" name="child_age" type="number" min="1" max="18" value={form.child_age} onChange={handleChange} required disabled={isClosedEdit} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} required disabled={isClosedEdit} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={isClosedEdit} />
          </div>
          <div className="form-group">
            <label htmlFor="source">Source *</label>
            <select id="source" name="source" value={form.source} onChange={handleChange} required disabled={isClosedEdit}>
              <option value="">Select source</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="centre_id">Centre *</label>
            <select id="centre_id" name="centre_id" value={form.centre_id} onChange={handleChange} required disabled={isClosedEdit}>
              <option value="">Select centre</option>
              {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="owner_id">Owner *</label>
            <select id="owner_id" name="owner_id" value={form.owner_id} onChange={handleChange} required disabled={isClosedEdit}>
              <option value="">Select owner</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange} disabled={isClosedEdit}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="next_followup_at">Next Follow-up</label>
            <input id="next_followup_at" name="next_followup_at" type="datetime-local" value={form.next_followup_at} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows="4" value={form.notes} onChange={handleChange} />
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/leads/${id}` : '/leads'} className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
