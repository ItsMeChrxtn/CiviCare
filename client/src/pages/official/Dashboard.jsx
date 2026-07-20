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
      <h1 className="text-2xl font-bold">Official Dashboard</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">Barangay operations at a glance.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Residents" value={overview?.residents ?? '-'} color="primary" />
        <StatCard icon={FiAlertTriangle} label="Pending Incidents" value={overview?.pendingIncidents ?? '-'} color="amber" />
        <StatCard icon={FiActivity} label="Ongoing Incidents" value={overview?.ongoingIncidents ?? '-'} color="indigo" />
        <StatCard icon={FiFileText} label="Pending Documents" value={overview?.pendingDocuments ?? '-'} color="blue" />
        <StatCard icon={FiCalendar} label="Upcoming Events" value={overview?.upcomingEvents ?? '-'} color="emerald" />
        <StatCard icon={FiGift} label="Total Donations" value={overview?.totalDonations ?? '-'} color="indigo" />
        <StatCard icon={FiMessageSquare} label="New Feedback" value={overview?.newFeedback ?? '-'} color="red" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Incident Reports (12 months)</h2>
          {trends ? <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Document Requests (12 months)</h2>
          {trends ? <TrendLineChart series={trends.documents} label="Documents" color="#3b82f6" /> : <CardSkeleton />}
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;
