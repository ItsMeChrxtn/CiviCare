import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';

const LAYER_META = {
  flood: { label: 'Flood Zones', color: '#3b82f6' },
  fire: { label: 'Fire Hazard', color: '#ef4444' },
  danger_zone: { label: 'Danger Zones', color: '#dc2626' },
  road_closure: { label: 'Road Closures', color: '#f59e0b' },
  evacuation_center: { label: 'Evacuation Centers', color: '#10b981' },
  safe_area: { label: 'Safe Areas', color: '#0ea5e9' },
};

// Avoids the classic Leaflet + bundler "broken marker icon path" issue -
// every point hazard renders as a colored divIcon instead of the default PNG.
const dotIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px ${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const FitToMarkers = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
};

/** Renders the barangay hazard map with toggleable GeoJSON-style layers (points/lines/polygons). */
const HazardMap = ({ height = '28rem', showLegend = true, center = [14.676, 121.0437], zoom = 15 }) => {
  const [hazards, setHazards] = useState([]);
  const [activeLayers, setActiveLayers] = useState(Object.keys(LAYER_META));

  useEffect(() => {
    api.get('/hazards').then(({ data }) => setHazards(data.data));
  }, []);

  const toggleLayer = (layer) =>
    setActiveLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]));

  const visible = useMemo(() => hazards.filter((h) => activeLayers.includes(h.layer)), [hazards, activeLayers]);
  const pointCoords = useMemo(
    () => visible.filter((h) => h.geometry.type === 'Point').map((h) => [h.geometry.coordinates[1], h.geometry.coordinates[0]]),
    [visible]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
      {showLegend && (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          {Object.entries(LAYER_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeLayers.includes(key)
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-400 dark:border-gray-700'
              }`}
              style={activeLayers.includes(key) ? { backgroundColor: meta.color } : {}}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ height }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pointCoords.length > 0 && <FitToMarkers points={pointCoords} />}

          {visible.map((hazard) => {
            const meta = LAYER_META[hazard.layer];
            if (hazard.geometry.type === 'Point') {
              const [lng, lat] = hazard.geometry.coordinates;
              return (
                <Marker key={hazard._id} position={[lat, lng]} icon={dotIcon(meta.color)}>
                  <Popup>
                    <p className="font-semibold">{hazard.name}</p>
                    <p className="text-xs">{hazard.description}</p>
                    {hazard.contactNumber && <p className="text-xs">📞 {hazard.contactNumber}</p>}
                  </Popup>
                </Marker>
              );
            }
            if (hazard.geometry.type === 'LineString') {
              const positions = hazard.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
              return (
                <Polyline key={hazard._id} positions={positions} pathOptions={{ color: meta.color, weight: 4 }}>
                  <Popup>{hazard.name}</Popup>
                </Polyline>
              );
            }
            if (hazard.geometry.type === 'Polygon') {
              const positions = hazard.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
              return (
                <Polygon key={hazard._id} positions={positions} pathOptions={{ color: meta.color, fillOpacity: 0.3 }}>
                  <Popup>
                    <p className="font-semibold">{hazard.name}</p>
                    <p className="text-xs">{hazard.description}</p>
                  </Popup>
                </Polygon>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default HazardMap;
