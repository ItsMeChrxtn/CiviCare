import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiLogOut, FiUser, FiGlobe, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { MdAccessibilityNew } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import useSetting from '../../hooks/useSetting';
import useSocketEvent from '../../hooks/useSocketEvent';
import useClickOutside from '../../hooks/useClickOutside';
import { activeAlerts } from '../../utils/emergency';
import { findNavItem } from './dashboardNav';

const Dropdown = ({ open, children, className = 'w-72' }) =>
  open ? (
    <div
      className={`absolute right-0 top-full z-30 mt-2 origin-top-right animate-scaleIn rounded-2xl border border-gray-100 bg-white p-2 text-gray-900 shadow-card-hover dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
    </div>
  ) : null;

const Toggle = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
  >
    {label}
    <span className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
  </button>
);

const iconBtn = 'relative flex items-center gap-1 rounded-lg p-2 text-white transition hover:bg-white/15';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t, lang, toggleLang, textSize, setTextSize, highContrast, toggleHighContrast } = usePreferences();
  const [emergency, setEmergency] = useSetting('emergency');
  const [menu, setMenu] = useState(null); // 'a11y' | 'alerts' | 'notifs' | 'user'
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useSocketEvent('emergency:updated', setEmergency);

  const close = useCallback(() => setMenu(null), []);
  const ref = useClickOutside(close, Boolean(menu));
  const toggle = (name) => setMenu((m) => (m === name ? null : name));

  const navItem = findNavItem(user?.role, pathname);
  const alerts = activeAlerts(emergency);
  const isResident = user?.role === 'resident';
  const idLabel = isResident ? t('shell.residentId') : user?.role === 'admin' ? t('shell.adminId') : t('shell.officialId');
  const hubPath = isResident ? '/resident/emergency-hub' : '/official/broadcast';

  return (
    <header
      ref={ref}
      className={`sticky top-0 z-20 flex items-center gap-2 px-3 py-2.5 text-white shadow-md lg:px-6 ${
        isResident ? 'bg-brand-green' : 'bg-brand-blue'
      }`}
    >
      <button onClick={onMenuClick} className={`${iconBtn} lg:hidden`} aria-label="Open menu">
        <FiMenu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-extrabold uppercase tracking-wide sm:text-2xl">
        {navItem ? t(navItem.labelKey) : ''}
      </h1>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <button onClick={toggleLang} className={iconBtn} aria-label={`${t('shell.language')}: ${lang.toUpperCase()}`} title={t('shell.language')}>
          <FiGlobe className="h-5 w-5" />
          <span className="text-xs font-bold">{lang.toUpperCase()}</span>
        </button>

        <div className="relative">
          <button onClick={() => toggle('a11y')} className={iconBtn} aria-label={t('shell.accessibility')} title={t('shell.accessibility')}>
            <MdAccessibilityNew className="h-5 w-5" />
          </button>
          <Dropdown open={menu === 'a11y'} className="w-64">
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">{t('shell.accessibility')}</p>
            <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm">
              <span>{t('shell.textSize')}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTextSize(textSize - 1)}
                  disabled={textSize === 0}
                  aria-label={t('shell.smaller')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-30 dark:border-gray-700"
                >
                  A−
                </button>
                <span className="w-20 text-center text-xs font-semibold" aria-live="polite">
                  {t(`shell.size${textSize}`)}
                </span>
                <button
                  type="button"
                  onClick={() => setTextSize(textSize + 1)}
                  disabled={textSize === 2}
                  aria-label={t('shell.larger')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-base font-bold disabled:opacity-30 dark:border-gray-700"
                >
                  A+
                </button>
              </span>
            </div>
            <Toggle label={t('shell.highContrast')} checked={highContrast} onChange={toggleHighContrast} />
            <Toggle label={t('shell.darkTheme')} checked={isDark} onChange={toggleTheme} />
            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-gray-400">{t('shell.language')}</p>
            <div className="flex gap-2 px-3 pb-2">
              {['en', 'tl'].map((code) => (
                <button
                  key={code}
                  onClick={() => lang !== code && toggleLang()}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-sm font-semibold ${
                    lang === code ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {lang === code && <FiCheck />} {code === 'en' ? 'English' : 'Tagalog'}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <button onClick={() => toggle('alerts')} className={iconBtn} aria-label={t('shell.alerts')} title={t('shell.alerts')}>
            <FiAlertTriangle className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-gray-900">
                {alerts.length}
              </span>
            )}
          </button>
          <Dropdown open={menu === 'alerts'}>
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">{t('shell.alerts')}</p>
            {(emergency?.alerts || []).map((a) => (
              <div key={a.key} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm">
                <span className="font-medium">{a.label}</span>
                <span className={`text-xs font-semibold ${alerts.includes(a) ? 'text-orange-600' : 'text-gray-400'}`}>{a.level}</span>
              </div>
            ))}
            {!emergency?.alerts?.length && <p className="px-3 py-2 text-sm text-gray-400">{t('shell.noAlerts')}</p>}
            <Link to={hubPath} onClick={close} className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-semibold text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              {isResident ? t('shell.viewHub') : t('nav.emergencySms')}
            </Link>
          </Dropdown>
        </div>

        <div className="relative">
          <button onClick={() => toggle('notifs')} className={iconBtn} aria-label={t('nav.notifications')}>
            <FiBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <Dropdown open={menu === 'notifs'} className="w-80">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="font-semibold">{t('nav.notifications')}</p>
              <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:underline">
                {t('shell.markAllRead')}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && <p className="p-4 text-center text-sm text-gray-400">{t('shell.noNotifications')}</p>}
              {notifications.map((n) => (
                <button
                  key={n._id || n.createdAt}
                  onClick={() => {
                    if (n._id) markAsRead(n._id);
                    if (n.link) navigate(n.link);
                    close();
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !n.isRead ? 'bg-primary-50/60 dark:bg-primary-500/5' : ''
                  }`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="truncate text-xs text-gray-400">{n.message}</p>
                  {n.createdAt && (
                    <p className="mt-0.5 text-[10px] text-gray-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  )}
                </button>
              ))}
            </div>
            <Link to={`/${user?.role}/notifications`} onClick={close} className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-semibold text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              {t('common.viewAll')}
            </Link>
          </Dropdown>
        </div>

        <div className="relative">
          <button onClick={() => toggle('user')} className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-white/15">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/50" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
                <FiUser className="h-4 w-4" />
              </span>
            )}
            <span className="hidden leading-tight md:block">
              <span className="block text-sm font-bold">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="block text-[11px] text-white/80">
                {idLabel}: {user?.residentId || '—'}
              </span>
            </span>
          </button>
          <Dropdown open={menu === 'user'} className="w-52">
            <Link
              to={`/${user?.role}/profile`}
              onClick={close}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FiUser className="h-4 w-4" /> {t('nav.profile')}
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <FiLogOut className="h-4 w-4" /> {t('shell.logout')}
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
