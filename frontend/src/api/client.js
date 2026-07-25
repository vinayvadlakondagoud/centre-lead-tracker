const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);
  const contentType = res.headers.get('content-type');

  if (contentType && contentType.includes('text/csv')) {
    return res.text();
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Leads
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads${qs ? `?${qs}` : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveLead: (id, data = {}) => request(`/leads/${id}/archive`, { method: 'PATCH', body: JSON.stringify(data) }),
  restoreLead: (id, data = {}) => request(`/leads/${id}/restore`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Followups
  getFollowups: (leadId) => request(`/followups/${leadId}`),
  addFollowup: (leadId, data) => request(`/followups/${leadId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateFollowup: (leadId, fid, data) => request(`/followups/${leadId}/${fid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFollowup: (leadId, fid) => request(`/followups/${leadId}/${fid}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/dashboard${qs ? `?${qs}` : ''}`);
  },
  getDashboardByStatus: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/dashboard/by-status${qs ? `?${qs}` : ''}`);
  },
  getDashboardByCentre: () => request('/dashboard/by-centre'),
  getDashboardByOwner: () => request('/dashboard/by-owner'),
  getDashboardBySource: () => request('/dashboard/by-source'),
  getOverdueLeads: () => request('/dashboard/overdue'),

  // Export
  exportLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/export/leads${qs ? `?${qs}` : ''}`);
  },

  // Admin
  getCentres: () => request('/admin/centres'),
  getOwners: () => request('/admin/owners'),
  createCentre: (data) => request('/admin/centres', { method: 'POST', body: JSON.stringify(data) }),
  createOwner: (data) => request('/admin/owners', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadStatus: (id, status) => request(`/admin/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Health
  health: () => request('/health'),
};
