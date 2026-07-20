import { NavLink } from 'react-router-dom';
import { NAV_BY_ROLE, ROLE_LABEL } from './dashboardNav';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const items = NAV_BY_ROLE[user?.role] || [];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform overflow-y-auto border-r border-gray-100 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <img src="/favicon.svg" alt="CiviCare" className="h-8 w-8" />
          <div>
            <p className="font-display font-extrabold leading-tight text-primary-700 dark:text-primary-400">CiviCare</p>
            <p className="text-xs text-gray-400">{ROLE_LABEL[user?.role]}</p>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft'
                    : 'text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
