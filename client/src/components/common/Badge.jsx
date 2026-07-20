import { STATUS_COLORS, SEVERITY_COLORS } from '../../utils/constants';

const Badge = ({ status, children }) => {
  const color =
    STATUS_COLORS[status] || SEVERITY_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
  const label = children || status?.replace(/_/g, ' ');
  return (
    <span className={`badge capitalize ring-1 ring-inset ring-current/10 ${color}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default Badge;
