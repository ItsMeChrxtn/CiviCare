import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiMoon, FiSun, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 shadow-sm shadow-gray-900/[0.02] backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
        <FiMenu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 animate-scaleIn origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="font-semibold">Notifications</p>
                <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && <p className="p-4 text-center text-sm text-gray-400">No notifications yet.</p>}
                {notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      markAsRead(n._id);
                      if (n.link) navigate(n.link);
                      setShowNotifs(false);
                    }}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      !n.isRead ? 'bg-primary-50/60 dark:bg-primary-500/5' : ''
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="truncate text-xs text-gray-400">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowUserMenu((v) => !v)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="Avatar" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-500/20" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-soft">
                <FiUser className="h-4 w-4" />
              </div>
            )}
            <span className="hidden text-sm font-medium sm:inline">{user?.firstName}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 animate-scaleIn origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-card-hover dark:border-gray-800 dark:bg-gray-900">
              <Link
                to={`/${user?.role}/profile`}
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FiUser className="h-4 w-4" /> My Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <FiLogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
