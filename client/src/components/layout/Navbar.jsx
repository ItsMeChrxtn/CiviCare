import { useCallback, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiMoon, FiSun, FiLogOut, FiUser, FiGrid } from 'react-icons/fi';
import useClickOutside from '../../hooks/useClickOutside';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Panel revision: fewer, compact tabs. The evacuation map lives inside the Emergency Hub (/hazard-map still works).
const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/events', label: 'Events' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
];

const roleHome = (role) => (role === 'resident' ? '/resident' : role === 'official' ? '/official' : '/admin');
const homeLabel = (role) => (role === 'resident' ? 'Overview' : 'Dashboard');
const initials = (u) => `${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase();

const Avatar = ({ user, className = 'h-9 w-9' }) =>
  user?.avatar?.url ? (
    <img src={user.avatar.url} alt="" className={`${className} rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-500/20`} />
  ) : (
    <span className={`${className} flex items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white ring-2 ring-primary-100 dark:ring-primary-500/20`}>
      {initials(user) || <FiUser />}
    </span>
  );

/** Panel revision: logged-in users see their profile icon on the landing page, with quick links. */
const ProfileMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(close, open);
  const home = roleHome(user.role);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" className="flex items-center rounded-full">
        <Avatar user={user} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-100 p-3 dark:border-gray-800">
            <Avatar user={user} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-gray-500">{user.isSuperAdmin ? 'Super Admin' : user.role}</p>
            </div>
          </div>
          <div className="p-1 text-sm">
            <Link role="menuitem" to={home} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
              <FiGrid /> {homeLabel(user.role)}
            </Link>
            <Link role="menuitem" to={`${home}/profile`} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
              <FiUser /> My Profile
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <FiLogOut /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 shadow-sm shadow-gray-900/[0.02] backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5 font-display font-extrabold text-primary-700 dark:text-primary-400">
          <img src="/civicare-logo.svg" alt="CiviCare" className="h-9 w-auto transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg">CiviCare</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>

          {user ? (
            <ProfileMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/login" className="btn-secondary !py-2 text-sm">
                Log In
              </Link>
              <Link to="/register" className="btn-primary !py-2 text-sm">
                Register
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && <ProfileMenu user={user} onLogout={handleLogout} />}
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              {user ? (
                <Link to={roleHome(user.role)} className="btn-primary flex-1 text-sm">
                  {homeLabel(user.role)}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary flex-1 text-sm">
                    Log In
                  </Link>
                  <Link to="/register" className="btn-primary flex-1 text-sm">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
