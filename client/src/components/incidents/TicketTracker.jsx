import { FiCheck } from 'react-icons/fi';
import { usePreferences } from '../../contexts/PreferencesContext';
import { INCIDENT_STATUS_FLOW } from '../../utils/constants';

const normalize = (status) => (status === 'assigned' ? 'ongoing' : status);

/** Pending -> Ongoing -> Resolved stepper ("Ticket Status Tracker" in the docu's definition of terms). */
const TicketTracker = ({ status, compact = false }) => {
  const { t } = usePreferences();
  const current = INCIDENT_STATUS_FLOW.indexOf(normalize(status));

  return (
    <ol className="flex w-full items-start" aria-label={t('ticket.tracker')}>
      {INCIDENT_STATUS_FLOW.map((step, i) => {
        const done = i <= current;
        const isLast = i === INCIDENT_STATUS_FLOW.length - 1;
        return (
          <li key={step} className={`flex items-start ${isLast ? '' : 'flex-1'}`} aria-current={i === current ? 'step' : undefined}>
            <div className="flex flex-col items-center text-center">
              <span
                className={`flex items-center justify-center rounded-full border-2 font-bold ${compact ? 'h-6 w-6 text-[10px]' : 'h-9 w-9 text-sm'} ${
                  done ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                {i < current ? <FiCheck /> : i + 1}
              </span>
              <span className={`mt-1 font-semibold ${compact ? 'text-[10px]' : 'text-xs'} ${done ? 'text-primary-700 dark:text-primary-400' : 'text-gray-400'}`}>
                {t(`status.${step}`)}
              </span>
              {!compact && <span className="mt-0.5 hidden max-w-[9rem] text-[11px] text-gray-400 sm:block">{t(`ticket.${step}Desc`)}</span>}
            </div>
            {!isLast && (
              <span className={`mx-1 mt-3 h-0.5 flex-1 rounded ${compact ? '!mt-3' : 'mt-4'} ${i < current ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default TicketTracker;
