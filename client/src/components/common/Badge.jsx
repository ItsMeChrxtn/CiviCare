import { STATUS_COLORS } from '../../utils/constants';

const Badge = ({ status, children }) => {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
  const label = children || status?.replace(/_/g, ' ');
  return <span className={`badge capitalize ${color}`}>{label}</span>;
};

export default Badge;
