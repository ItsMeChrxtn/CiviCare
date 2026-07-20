import { useEffect, useState } from 'react';
import { FiUsers, FiShield, FiCheckCircle, FiUserCheck, FiAlertTriangle, FiFileText, FiActivity } from 'react-icons/fi';
import api from '../../utils/api';
import StatCard from '../../components/common/StatCard';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { CardSkeleton } from '../../components/common/Skeleton';

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    api.get('/users/stats/overview').then(({ data }) => setUserStats(data.data));
    api.get('/reports/overview').then(({ data }) => setOverview(data.data));
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Console</h1>
        <p className="page-subtitle">System-wide overview and controls.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Users" value={userStats?.total ?? '-'} color="primary" />
        <StatCard icon={FiUserCheck} label="Verified Users" value={userStats?.verified ?? '-'} color="emerald" />
        <StatCard icon={FiShield} label="Officials" value={userStats?.officials ?? '-'} color="indigo" />
        <StatCard icon={FiCheckCircle} label="Active Accounts" value={userStats?.active ?? '-'} color="blue" />
        <StatCard icon={FiAlertTriangle} label="Pending Incidents" value={overview?.pendingIncidents ?? '-'} color="amber" />
        <StatCard icon={FiFileText} label="Pending Documents" value={overview?.pendingDocuments ?? '-'} color="blue" />
      </div>

      <div className="mt-8 card animate-fadeIn p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
          <FiActivity className="h-4 w-4 text-primary-500" /> Platform Activity (12 months)
        </h2>
        {trends ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" />
            <TrendLineChart series={trends.events} label="Events" color="#10b981" />
          </div>
        ) : (
          <CardSkeleton />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
