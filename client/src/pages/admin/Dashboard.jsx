import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUsers, FiShield, FiCheckCircle, FiUserCheck, FiAlertTriangle, FiFileText, FiActivity, FiGift, FiArrowRight } from 'react-icons/fi';
import api from '../../utils/api';
import StatCard from '../../components/common/StatCard';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { CardSkeleton } from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import { donationDetails } from '../../utils/constants';

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [donations, setDonations] = useState(null);

  useEffect(() => {
    api.get('/users/stats/overview').then(({ data }) => setUserStats(data.data));
    api.get('/reports/overview').then(({ data }) => setOverview(data.data));
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
    api
      .get('/donations', { params: { limit: 6, sort: '-createdAt' } })
      .then(({ data }) => setDonations(data.data))
      .catch(() => setDonations([]));
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
        <StatCard icon={FiGift} label="Donations" value={overview?.totalDonations ?? '-'} color="emerald" />
        <StatCard icon={FiGift} label="Pledges to Receive" value={overview?.pendingDonations ?? '-'} color="amber" />
      </div>

      <div className="mt-8 card animate-fadeIn p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiGift className="h-4 w-4 text-primary-500" /> Recent Donations
          </h2>
          <Link to="/official/donations" className="flex items-center gap-1 text-sm font-semibold text-primary-600">
            View all <FiArrowRight />
          </Link>
        </div>
        {donations === null ? (
          <CardSkeleton />
        ) : donations.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No donations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Donor</th>
                  <th className="py-2 pr-4">Donated</th>
                  <th className="py-2 pr-4">Beneficiary</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {donations.map((d) => (
                  <tr key={d._id}>
                    <td className="py-2 pr-4 font-medium">
                      {d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : '—'}
                      {d.donor?.residentId && <span className="block text-xs font-normal text-gray-400">{d.donor.residentId}</span>}
                    </td>
                    <td className="py-2 pr-4">{donationDetails(d)}</td>
                    <td className="py-2 pr-4">{d.beneficiary || '—'}</td>
                    <td className="py-2 pr-4"><Badge status={d.status} /></td>
                    <td className="py-2">{format(new Date(d.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
