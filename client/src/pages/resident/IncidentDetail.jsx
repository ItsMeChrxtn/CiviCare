import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiMapPin, FiAlertTriangle, FiUser, FiClock } from 'react-icons/fi';
import api from '../../utils/api';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';

const IncidentDetail = () => {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    api.get(`/incidents/${id}`).then(({ data }) => setIncident(data.data));
  }, [id]);

  if (!incident) return <PageLoader />;

  return (
    <div>
      <Link to="/resident/incidents" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
        <FiArrowLeft /> Back to Reports
      </Link>

      <div className="card animate-fadeIn p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <FiAlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{incident.referenceCode}</p>
              <h1 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50">{incident.title}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge status={incident.severity} />
            <Badge status={incident.status} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{incident.description}</p>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <FiMapPin className="h-3.5 w-3.5" /> {incident.location?.address || `${incident.location.coordinates[1]}, ${incident.location.coordinates[0]}`}
        </p>

        {incident.images?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {incident.images.map((img) => (
              <img key={img.publicId} src={img.url} alt="Evidence" className="h-24 w-full rounded-xl object-cover shadow-soft transition-transform duration-300 hover:scale-[1.03]" />
            ))}
          </div>
        )}

        {incident.assignedTo && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <FiUser className="h-4 w-4 text-gray-400" /> Assigned to: <span className="font-medium text-gray-900 dark:text-gray-100">{incident.assignedTo.firstName} {incident.assignedTo.lastName}</span>
          </p>
        )}

        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-gray-50">
            <FiClock className="h-4 w-4 text-gray-400" /> Status Timeline
          </h3>
          <div className="space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
            {incident.statusHistory?.map((h, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-500/20" />
                <Badge status={h.status} />
                {h.note && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{h.note}</p>}
                <p className="mt-0.5 text-xs text-gray-400">{format(new Date(h.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
