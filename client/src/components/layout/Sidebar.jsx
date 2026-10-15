import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import { NAV_BY_ROLE } from './dashboardNav';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';

const NavItem = ({ item, onClose, t }) => (
  <NavLink
    to={item.to}
    end={item.end}
    onClick={onClose}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ${
        isActive ? 'bg-white/15 ring-1 ring-inset ring-white' : 'hover:bg-white/10'
      }`
    }
  >
    <item.icon className="h-5 w-5 shrink-0" />
    <span className="leading-tight">{t(item.labelKey)}</span>
  </NavLink>
);

const NavGroup = ({ label, items, onClose, t, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!items?.length) return null;
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
        aria-expanded={open}
      >
        {label}
        <FiChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} t={t} />
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

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col overflow-y-auto transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isResident ? 'bg-brand-green' : 'bg-brand-blue'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link to={`/${user?.role}`} className="flex items-center gap-2.5 border-b border-white/15 px-4 py-3 text-white" onClick={onClose}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-amber-300">
            <img src="/magdiwang-logo.jpeg" alt="Barangay Magdiwang seal" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-extrabold leading-tight">
              CIVICARE{!isResident && ' Admin'}
            </span>
            <span className="block truncate text-[11px] text-white/80">{t('shell.brgy')}</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
          {nav.main.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} t={t} />
          ))}
          <NavGroup label={t('nav.more')} items={nav.more} onClose={onClose} t={t} />
          <NavGroup label={t('nav.system')} items={nav.system} onClose={onClose} t={t} defaultOpen />
        </nav>

        <div className="space-y-3 px-3 pb-4">
          {nav.assistant && (
            <NavLink
              to={nav.assistant}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border-2 border-white px-3 py-2.5 text-white transition hover:bg-white/10 ${
                  isActive ? 'bg-white/15' : ''
                }`
              }
            >
              <span className="flex h-9 w-11 items-center justify-center rounded-lg border-2 border-white">
                <FiMessageSquare className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold">{t('nav.assistant')}</span>
            </NavLink>
          )}
          <p className="whitespace-pre-line px-1 text-[10px] font-medium leading-snug text-white/80">{t('shell.footer')}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
