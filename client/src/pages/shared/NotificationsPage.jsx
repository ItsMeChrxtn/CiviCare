import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiBell, FiCheck } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import portalLink from '../../utils/portalLink';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <h1 className="page-title">{t('nav.notifications')}</h1>
          <p className="page-subtitle">{t('notif.subtitle')}</p>
        </div>
        <button onClick={markAllAsRead} className="btn-secondary text-sm">
          <FiCheck /> {t('shell.markAllRead')}
        </button>
      </div>

      {!notifications.length ? (
        <EmptyState icon={FiBell} title={t('notif.emptyTitle')} message={t('notif.emptyBody')} />
      ) : (
        <div className="card mt-6 divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => {
                markAsRead(n._id);
                if (n.link) navigate(portalLink(n.link, user?.role));
              }}
              className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                !n.isRead ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''
              }`}
            >
              <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${!n.isRead ? 'bg-primary-600 dark:bg-primary-400' : 'bg-transparent'}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
