import { STATUS_COLORS, SEVERITY_COLORS, STATUS_LABELS } from '../../utils/constants';
import { usePreferences } from '../../contexts/PreferencesContext';

const Badge = ({ status, children }) => {
  const { t } = usePreferences();
  const color =
    STATUS_COLORS[status] || SEVERITY_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
  // Translated label when one exists (e.g. "Pending" -> "Nakabinbin"), otherwise a readable fallback.
  const translated = status ? t(`status.${status}`, null, '') : '';
  const label = children || translated || STATUS_LABELS[status] || status?.replace(/_/g, ' ');
  return (
    <span className={`badge capitalize ring-1 ring-inset ring-current/10 ${color}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default Badge;
