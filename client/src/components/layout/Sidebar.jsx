import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import { NAV_BY_ROLE } from './dashboardNav';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';

// Panel revision: the resident sidebar is light (green only as an accent); staff keep the green sidebar.
const THEMES = {
  green: {
    aside: 'shell-sidebar',
    brand: 'border-white/10 text-white',
    brandSub: 'text-white/80',
    active: 'bg-white text-primary-800 shadow-soft',
    idle: 'text-white/85 hover:bg-white/10 hover:text-white',
    group: 'text-accent-300/90 hover:text-accent-200',
    assistant: 'border-white text-white hover:bg-white/10',
    assistantActive: 'bg-white/15',
    footer: 'text-white/80',
  },
  light: {
    aside: 'border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
    brand: 'border-gray-100 text-primary-800 dark:border-gray-800 dark:text-primary-300',
    brandSub: 'text-gray-500 dark:text-gray-400',
    active: 'bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-600 dark:bg-primary-500/10 dark:text-primary-300',
    idle: 'text-gray-700 hover:bg-gray-100 hover:text-primary-800 dark:text-gray-300 dark:hover:bg-gray-800',
    group: 'text-gray-400 hover:text-gray-600',
    assistant: 'border-primary-700 text-primary-800 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-500/10',
    assistantActive: 'bg-primary-50 dark:bg-primary-500/10',
    footer: 'text-gray-500 dark:text-gray-400',
  },
};

const NavItem = ({ item, onClose, t, theme }) => (
  <NavLink
    to={item.to}
    end={item.end}
    onClick={onClose}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-150 ${isActive ? theme.active : theme.idle}`
    }
  >
    <item.icon className="h-5 w-5 shrink-0" />
    <span className="leading-tight">{t(item.labelKey)}</span>
  </NavLink>
);

const NavGroup = ({ label, items, onClose, t, theme, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!items?.length) return null;
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${theme.group}`}
        aria-expanded={open}
      >
        {label}
        <FiChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} t={t} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const { t } = usePreferences();
  const nav = NAV_BY_ROLE[user?.role] || { main: [] };
  const isResident = user?.role === 'resident';
  const theme = THEMES[isResident ? 'light' : 'green'];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col overflow-y-auto transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${theme.aside} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to={`/${user?.role}`} className={`flex items-center gap-2.5 border-b px-4 py-4 ${theme.brand}`} onClick={onClose}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-amber-300">
            <img src="/magdiwang-logo.jpeg" alt="Barangay Magdiwang seal" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-extrabold leading-tight">
              CIVICARE
              {!isResident && (
                <span className="ml-1.5 rounded-md bg-accent-400 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-primary-950">
                  {user?.role === 'admin' ? 'Admin' : 'Official'}
                </span>
              )}
            </span>
            <span className={`block truncate text-[11px] ${theme.brandSub}`}>{t('shell.brgy')}</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
          {nav.main.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} t={t} theme={theme} />
          ))}
          <NavGroup label={t('nav.more')} items={nav.more} onClose={onClose} t={t} theme={theme} />
          <NavGroup label={t('nav.system')} items={nav.system} onClose={onClose} t={t} theme={theme} defaultOpen />
        </nav>

        <div className="space-y-3 px-3 pb-4">
          {nav.assistant && (
            <NavLink
              to={nav.assistant}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${theme.assistant} ${isActive ? theme.assistantActive : ''}`
              }
            >
              <span className="flex h-9 w-11 items-center justify-center rounded-lg border-2 border-current">
                <FiMessageSquare className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold">{t('nav.assistant')}</span>
            </NavLink>
          )}
          <p className={`whitespace-pre-line px-1 text-[10px] font-medium leading-snug ${theme.footer}`}>{t('shell.footer')}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
