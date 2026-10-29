import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isStaff = user?.role === 'official' || user?.role === 'admin';
  const { setEnglishOnly } = usePreferences();

  // EN/TL translation is for residents only; the staff portal is always English.
  useEffect(() => {
    setEnglishOnly(isStaff);
    return () => setEnglishOnly(false);
  }, [isStaff, setEnglishOnly]);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--portal-bg))] dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-3 py-4 pb-10 sm:p-5 lg:p-8">
          <div key={location.pathname} className="mx-auto max-w-7xl animate-slideUp">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
