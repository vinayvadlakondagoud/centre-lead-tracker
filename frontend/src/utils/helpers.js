const STATUS_CONFIG = {
  'New': { color: '#3b82f6', bg: '#eff6ff', label: 'New' },
  'Contacted': { color: '#f59e0b', bg: '#fffbeb', label: 'Contacted' },
  'Demo Scheduled': { color: '#8b5cf6', bg: '#f5f3ff', label: 'Demo Scheduled' },
  'Demo Completed': { color: '#06b6d4', bg: '#ecfeff', label: 'Demo Completed' },
  'Converted': { color: '#10b981', bg: '#ecfdf5', label: 'Converted' },
  'Lost': { color: '#ef4444', bg: '#fef2f2', label: 'Lost' },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { color: '#6b7280', bg: '#f9fafb', label: status };
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export const CHANNELS = ['Phone', 'WhatsApp', 'Email', 'In-Person', 'Walk-in', 'SMS', 'Other'];
export const OUTCOMES = ['Reached', 'No Response', 'Busy', 'Voicemail', 'Interested', 'Not Interested', 'Rescheduled', 'Callback Scheduled', 'Converted'];
export const SOURCES = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Phone', 'Other'];

export function formatIST(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
