import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import useSocketEvent from '../../hooks/useSocketEvent';
import { DEFAULT_MAP_CENTER, MAP_LIMITS, INCIDENT_PIN_COLORS, categoryLabel } from '../../utils/constants';

// Panel revision: only active incidents are pinned; resolved ones stay in the records.
const LEGEND = [
  ['pending', 'Pending'],
  ['ongoing', 'Ongoing'],
];
const onMap = (incident) => incident.status !== 'resolved' && !incident.isArchived;

/** Officials' real-time incident map: new reports appear instantly via Socket.IO. */
const IncidentMap = ({ height = '22rem' }) => {
  const [general] = useSetting('general');
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    api.get('/incidents/map').then(({ data }) => setIncidents(data.data.filter(onMap))).catch(() => {});
  }, []);

  // Live updates: a report that becomes resolved drops off the map right away.
  const upsert = (incident) =>
    setIncidents((list) => [...(onMap(incident) ? [incident] : []), ...list.filter((i) => i._id !== incident._id)]);
  useSocketEvent('incident:new', upsert);
  useSocketEvent('incident:updated', upsert);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
      <div style={{ height }} className="relative z-0">
        <MapContainer center={general?.mapCenter || DEFAULT_MAP_CENTER} zoom={16} {...MAP_LIMITS} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {incidents.map((i) => {
            const [lng, lat] = i.location.coordinates;
            return (
              <CircleMarker
                key={i._id}
                center={[lat, lng]}
                radius={9}
                pathOptions={{ color: '#fff', weight: 2, fillColor: INCIDENT_PIN_COLORS[i.status] || '#6b7280', fillOpacity: 0.95 }}
              >
                <Popup>
                  <p className="font-mono text-[10px] text-gray-500">{i.referenceCode}</p>
                  <p className="font-semibold">{categoryLabel(i.category)}</p>
                  <p className="text-xs capitalize">
                    {i.status === 'assigned' ? 'ongoing' : i.status}
                  </p>
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })}</p>
                  <Link to={`/official/incidents/${i._id}`} className="text-xs font-semibold">
                    Open report →
                  </Link>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-4 bg-white px-3 py-2 text-xs dark:bg-gray-900">
        {LEGEND.map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: INCIDENT_PIN_COLORS[status] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default IncidentMap;
