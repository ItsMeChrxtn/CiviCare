import { useEffect, useState } from 'react';
import { FiUsers, FiAlertTriangle, FiActivity, FiFileText, FiCalendar, FiGift, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';
import StatCard from '../../components/common/StatCard';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { CardSkeleton } from '../../components/common/Skeleton';

const OfficialDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    api.get('/reports/overview').then(({ data }) => setOverview(data.data));
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <span className="section-eyebrow w-fit">Overview</span>
        <h1 className="page-title">Official Dashboard</h1>
        <p className="page-subtitle">Barangay operations at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Residents" value={overview?.residents ?? '-'} color="primary" />
        <StatCard icon={FiAlertTriangle} label="Pending Incidents" value={overview?.pendingIncidents ?? '-'} color="amber" />
        <StatCard icon={FiActivity} label="Ongoing Incidents" value={overview?.ongoingIncidents ?? '-'} color="indigo" />
        <StatCard icon={FiFileText} label="Pending Documents" value={overview?.pendingDocuments ?? '-'} color="blue" />
        <StatCard icon={FiCalendar} label="Upcoming Events" value={overview?.upcomingEvents ?? '-'} color="emerald" />
        <StatCard icon={FiGift} label="Total Donations" value={overview?.totalDonations ?? '-'} color="indigo" />
        <StatCard icon={FiMessageSquare} label="New Feedback" value={overview?.newFeedback ?? '-'} color="red" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-gray-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <FiActivity className="h-4 w-4" />
            </span>
            Incident Reports <span className="text-sm font-normal text-gray-400 dark:text-gray-500">(12 months)</span>
          </h2>
          {trends ? <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-gray-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <FiFileText className="h-4 w-4" />
            </span>
            Document Requests <span className="text-sm font-normal text-gray-400 dark:text-gray-500">(12 months)</span>
          </h2>
          {trends ? <TrendLineChart series={trends.documents} label="Documents" color="#3b82f6" /> : <CardSkeleton />}
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;
