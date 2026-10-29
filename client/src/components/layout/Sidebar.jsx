import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { NAV_BY_ROLE } from './dashboardNav';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';

// Panel revision: every portal uses a white sidebar, with green only as an accent.
const THEME = {
  aside: 'border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
  brand: 'border-gray-100 text-primary-800 dark:border-gray-800 dark:text-primary-300',
  brandSub: 'text-gray-500 dark:text-gray-400',
  active:
    'bg-primary-50/80 text-primary-800 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary-600 dark:bg-primary-500/10 dark:text-primary-300',
  idle: 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
  group: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
  footer: 'text-gray-500 dark:text-gray-400',
};

const NavItem = ({ item, onClose, t, theme }) => (
  <NavLink
    to={item.to}
    end={item.end}
    onClick={onClose}
    className={({ isActive }) =>
      `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-150 ${isActive ? theme.active : theme.idle}`
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
  const theme = THEME;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 transform flex-col overflow-y-auto shadow-2xl transition-transform duration-300 ease-out lg:w-64 lg:shadow-none lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${theme.aside} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-2 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <FiX className="h-5 w-5" />
        </button>
        <Link to={`/${user?.role}`} className={`flex items-center gap-2.5 border-b px-4 py-4 pr-12 lg:pr-4 ${theme.brand}`} onClick={onClose}>
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
          <p className={`whitespace-pre-line px-1 text-[10px] font-medium leading-snug ${theme.footer}`}>{t('shell.footer')}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
