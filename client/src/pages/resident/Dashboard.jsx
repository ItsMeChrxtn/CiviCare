import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiFileText, FiCalendar, FiGift, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState(null);
  const [documents, setDocuments] = useState(null);

  useEffect(() => {
    api.get('/incidents?limit=5').then(({ data }) => setIncidents(data.data));
    api.get('/documents?limit=5').then(({ data }) => setDocuments(data.data));
  }, []);

  const pendingIncidents = incidents?.filter((i) => i.status !== 'resolved').length ?? '-';
  const pendingDocuments = documents?.filter((d) => d.status === 'pending').length ?? '-';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.firstName}!</h1>
        <p className="page-subtitle">Here's what's happening in your barangay.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiAlertTriangle} label="Active Reports" value={pendingIncidents} color="amber" />
        <StatCard icon={FiFileText} label="Pending Documents" value={pendingDocuments} color="blue" />
        <Link to="/resident/events"><StatCard icon={FiCalendar} label="Community Events" value="View" color="emerald" /></Link>
        <Link to="/resident/donations"><StatCard icon={FiGift} label="Donations" value="Give" color="indigo" /></Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card card-hover animate-fadeIn p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display font-bold">
              <FiAlertTriangle className="h-4 w-4 text-amber-500" /> Recent Incident Reports
            </h2>
            <Link to="/resident/incidents" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              View all <FiArrowRight />
            </Link>
          </div>
          {incidents === null ? (
            <CardSkeleton />
          ) : incidents.length === 0 ? (
            <EmptyState icon={FiAlertTriangle} title="No incident reports yet" message="Reports you file will show up here." />
          ) : (
            <div className="space-y-2">
              {incidents.map((i) => (
                <Link key={i._id} to={`/resident/incidents/${i._id}`} className="flex items-center justify-between rounded-xl p-2 transition-colors duration-150 hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-gray-400">{format(new Date(i.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <Badge status={i.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card card-hover animate-fadeIn p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display font-bold">
              <FiFileText className="h-4 w-4 text-blue-500" /> Recent Document Requests
            </h2>
            <Link to="/resident/documents" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              View all <FiArrowRight />
            </Link>
          </div>
          {documents === null ? (
            <CardSkeleton />
          ) : documents.length === 0 ? (
            <EmptyState icon={FiFileText} title="No document requests yet" message="Requests you submit will show up here." />
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <Link key={d._id} to={`/resident/documents/${d._id}`} className="flex items-center justify-between rounded-xl p-2 transition-colors duration-150 hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize">{d.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{format(new Date(d.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <Badge status={d.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
