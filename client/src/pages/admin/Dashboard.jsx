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
      <section className="hero-panel mb-6 p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid-slate bg-[length:28px_28px] opacity-40 [mask-image:radial-gradient(ellipse_80%_100%_at_100%_0%,black,transparent)]" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
              Admin <span className="text-accent-300">Console</span>
            </h1>
            <p className="mt-1 text-white/80">System-wide overview and controls for Barangay Magdiwang.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users" className="btn-primary !bg-none bg-white !py-2 text-sm !text-primary-700 hover:!bg-gray-100">
              <FiUsers /> Manage Users
            </Link>
            <Link to="/admin/settings" className="btn-secondary !border-white/25 !bg-white/10 !py-2 text-sm !text-white backdrop-blur-sm hover:!bg-white/20">
              Settings <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Users" value={userStats?.total ?? '-'} color="primary" />
        <StatCard icon={FiUserCheck} label="Verified Users" value={userStats?.verified ?? '-'} color="emerald" />
        <StatCard icon={FiShield} label="Officials" value={userStats?.officials ?? '-'} color="teal" />
        <StatCard icon={FiCheckCircle} label="Active Accounts" value={userStats?.active ?? '-'} color="primary" />
        <StatCard icon={FiAlertTriangle} label="Pending Incidents" value={overview?.pendingIncidents ?? '-'} color="amber" />
        <StatCard icon={FiFileText} label="Pending Documents" value={overview?.pendingDocuments ?? '-'} color="teal" />
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
