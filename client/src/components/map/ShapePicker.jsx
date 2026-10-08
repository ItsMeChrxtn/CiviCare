import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';

const ClickHandler = ({ onAdd }) => {
  useMapEvents({ click: (e) => onAdd([e.latlng.lat, e.latlng.lng]) });
  return null;
};

/**
 * Click-to-draw editor for hazard features. `kind` is Point | LineString | Polygon,
 * `points` is an array of [lat, lng]. Points keep only the last click.
 */
const ShapePicker = ({ kind, points, onChange, center = DEFAULT_MAP_CENTER, color = '#dc2626' }) => {
  const add = (p) => onChange(kind === 'Point' ? [p] : [...points, p]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800">
        <span>
          {kind === 'Point' ? 'Tap the map to place the point.' : `Tap the map to add vertices (${points.length} added${kind === 'Polygon' ? ', min 3' : ', min 2'}).`}
        </span>
        <span className="flex gap-3 font-semibold text-primary-600">
          <button type="button" onClick={() => onChange(points.slice(0, -1))} disabled={!points.length} className="disabled:opacity-40">
            Undo
          </button>
          <button type="button" onClick={() => onChange([])} disabled={!points.length} className="disabled:opacity-40">
            Clear
          </button>
        </span>
      </div>
      <div style={{ height: '18rem' }} className="relative z-0">
        <MapContainer center={points[0] || center} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onAdd={add} />
          {kind === 'LineString' && points.length > 1 && <Polyline positions={points} pathOptions={{ color, weight: 5 }} />}
          {kind === 'Polygon' && points.length > 2 && <Polygon positions={points} pathOptions={{ color, fillOpacity: 0.3 }} />}
          {points.map((p, i) => (
            <CircleMarker key={`${p[0]}-${p[1]}-${i}`} center={p} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

/** Converts picker points ([lat, lng]) into a GeoJSON geometry ([lng, lat]); null when incomplete. */
export const toGeometry = (kind, points) => {
  const flip = ([lat, lng]) => [lng, lat];
  if (kind === 'Point') return points.length ? { type: 'Point', coordinates: flip(points[0]) } : null;
  if (kind === 'LineString') return points.length >= 2 ? { type: 'LineString', coordinates: points.map(flip) } : null;
  if (points.length < 3) return null;
  const ring = points.map(flip);
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
};

export default ShapePicker;
