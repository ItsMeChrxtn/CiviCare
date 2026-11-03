import { FiBell, FiCheckCircle, FiCloudLightning } from 'react-icons/fi';
import { usePreferences } from '../../contexts/PreferencesContext';

/** Current natural-hazard alerts (official + automatic weather alerts); calm state when there are none. */
const AlertList = ({ alerts }) => {
  const { t } = usePreferences();

  if (!alerts.length) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <FiCheckCircle className="shrink-0" /> {t('hub.noAlerts')}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li key={a.key} className="flex items-center gap-3 rounded-lg bg-orange-50 p-2.5 dark:bg-orange-500/10">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20">
            {a.auto ? <FiCloudLightning className="h-4 w-4" /> : <FiBell className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t(`alert.${a.key}`, null, a.label)}</span>
            <span className="block text-xs font-semibold text-orange-600 dark:text-orange-300">{a.level}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};

export default AlertList;
