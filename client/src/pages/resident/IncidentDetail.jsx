import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
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
      <Link to="/resident/incidents" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <FiArrowLeft /> Back to Reports
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400">{incident.referenceCode}</p>
            <h1 className="text-xl font-bold">{incident.title}</h1>
          </div>
          <div className="flex gap-2">
            <Badge status={incident.severity} />
            <Badge status={incident.status} />
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{incident.description}</p>

        <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <FiMapPin /> {incident.location?.address || `${incident.location.coordinates[1]}, ${incident.location.coordinates[0]}`}
        </p>

        {incident.images?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {incident.images.map((img) => (
              <img key={img.publicId} src={img.url} alt="Evidence" className="h-24 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}

        {incident.assignedTo && (
          <p className="mt-4 text-sm">
            Assigned to: <span className="font-medium">{incident.assignedTo.firstName} {incident.assignedTo.lastName}</span>
          </p>
        )}

        <div className="mt-6">
          <h3 className="mb-3 font-bold">Status Timeline</h3>
          <div className="space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
            {incident.statusHistory?.map((h, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary-600" />
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
