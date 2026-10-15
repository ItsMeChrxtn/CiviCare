import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiMapPin, FiUser, FiClock } from 'react-icons/fi';
import api from '../../utils/api';
import useSocketEvent from '../../hooks/useSocketEvent';
import { usePreferences } from '../../contexts/PreferencesContext';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';
import TicketTracker from '../../components/incidents/TicketTracker';
import StaticPinMap from '../../components/map/StaticPinMap';
import { categoryLabel, INCIDENT_PIN_COLORS } from '../../utils/constants';

const IncidentDetail = () => {
  const { id } = useParams();
  const { t } = usePreferences();
  const [incident, setIncident] = useState(null);

  const load = useCallback(() => api.get(`/incidents/${id}`).then(({ data }) => setIncident(data.data)), [id]);
  useEffect(() => {
    load();
  }, [load]);
  useSocketEvent('notification:new', (n) => String(n?.relatedId) === id && load());

  if (!incident) return <PageLoader />;
  const [lng, lat] = incident.location.coordinates;

  return (
    <div>
      <Link to="/resident/incidents" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400">
        <FiArrowLeft /> {t('ticket.back')}
      </Link>

      <div className="card animate-fadeIn p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-gray-400">{incident.referenceCode}</p>
            <h1 className="font-display text-2xl font-bold">{categoryLabel(incident.category)}</h1>
            <p className="text-xs text-gray-400">{format(new Date(incident.createdAt), 'MMMM d, yyyy h:mm a')}</p>
          </div>
          <div className="flex gap-2">
            <Badge status={incident.severity} />
            <Badge status={incident.status} />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-primary-50/60 p-4 dark:bg-primary-500/5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300">{t('ticket.tracker')}</p>
          <TicketTracker status={incident.status} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            {incident.description && <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{incident.description}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
              <FiMapPin className="h-3.5 w-3.5" /> {incident.location?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </p>
            {incident.assignedTo && (
              <p className="mt-3 flex items-center gap-1.5 text-sm">
                <FiUser className="h-4 w-4 text-gray-400" /> {t('ticket.assignedTo')}:{' '}
                <span className="font-semibold">
                  {incident.assignedTo.firstName} {incident.assignedTo.lastName}
                  {incident.assignedTo.position ? ` (${incident.assignedTo.position})` : ''}
                </span>
              </p>
            )}
            {incident.images?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {incident.images.map((img) => (
                  <a key={img.publicId || img.url} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={t('incident.photo')} className="h-28 w-full rounded-xl object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <StaticPinMap position={[lat, lng]} color={INCIDENT_PIN_COLORS[incident.status]} />
        </div>

        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
            <FiClock className="h-4 w-4 text-gray-400" /> {t('ticket.timeline')}
          </h3>
          <div className="space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
            {incident.statusHistory?.map((h, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-500/20" />
                <Badge status={h.status} />
                {h.note && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{h.note}</p>}
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
