import { getStatusConfig } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  const { color, bg, label } = getStatusConfig(status);
  return (
    <span
      className="status-badge"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}20` }}
      data-testid="status-badge"
    >
      {label}
    </span>
  );
}
