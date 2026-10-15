import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';
import { usePreferences } from '../../contexts/PreferencesContext';

// Interactive Evacuation Map layers. Flood zones, fire hazard, danger zones and road closures
// were removed per panel revision; features on other layers are ignored by the map.
export const LAYER_META = {
  evacuation_center: { label: 'Evacuation Center', color: '#16a34a', symbol: '⛺' },
  evacuation_route: { label: 'Evacuation Route', color: '#0f766e', dashed: true },
  safe_area: { label: 'Safe Area', color: '#0ea5e9' },
  health_center: { label: 'Health Center', color: '#db2777', symbol: '✚' },
  fire_station: { label: 'Fire Station', color: '#dc2626', symbol: '🔥' },
  police_station: { label: 'Police Station', color: '#1d4ed8', symbol: '🛡' },
};

// Avoids Leaflet's broken default marker image paths under bundlers: every point is a colored divIcon.
const pointIcon = (meta) =>
  L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:${meta.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);color:white;font-size:12px;line-height:1">${meta.symbol || ''}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// The map always opens centered on Barangay Magdiwang, Noveleta, Cavite (panel revision);
// re-centers when the configured center arrives after the first render.
const KeepCentered = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

/** Legend list matching the map symbology; rendered separately in the hub layout. */
export const HazardLegend = ({ className = '' }) => {
  const { t } = usePreferences();
  return (
    <ul className={`space-y-1.5 text-xs ${className}`}>
      {Object.entries(LAYER_META).map(([key, meta]) => (
        <li key={key} className="flex items-center gap-2">
          {meta.dashed ? (
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: meta.color }} />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white" style={{ backgroundColor: meta.color }}>
              {meta.symbol}
            </span>
          )}
          {t(`layer.${key}`, null, meta.label)}
        </li>
      ))}
    </ul>
  );
};

/** Barangay hazard / evacuation map with toggleable GeoJSON-style layers (points, lines, polygons). */
const HazardMap = ({ height = '28rem', showLegend = true, center = DEFAULT_MAP_CENTER, zoom = 16, children }) => {
  const { t } = usePreferences();
  const [hazards, setHazards] = useState([]);
  const [activeLayers, setActiveLayers] = useState(Object.keys(LAYER_META));

  useEffect(() => {
    api.get('/hazards').then(({ data }) => setHazards(data.data)).catch(() => {});
  }, []);

  const toggleLayer = (layer) =>
    setActiveLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]));

  const visible = useMemo(() => hazards.filter((h) => activeLayers.includes(h.layer) && LAYER_META[h.layer]), [hazards, activeLayers]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
      {showLegend && (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          {Object.entries(LAYER_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              aria-pressed={activeLayers.includes(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeLayers.includes(key) ? 'border-transparent text-white' : 'border-gray-200 text-gray-400 dark:border-gray-700'
              }`}
              style={activeLayers.includes(key) ? { backgroundColor: meta.color } : {}}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {t(`layer.${key}`, null, meta.label)}
            </button>
          ))}
        </div>
      )}

      <div style={{ height }} className="relative z-0">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <KeepCentered center={center} zoom={zoom} />

          {visible.map((hazard) => {
            const meta = LAYER_META[hazard.layer];
            const popup = (
              <Popup>
                <p className="font-semibold">{hazard.name}</p>
                {hazard.description && <p className="text-xs">{hazard.description}</p>}
                {hazard.capacity ? <p className="text-xs">{t('map.capacity')}: {hazard.capacity}</p> : null}
                {hazard.contactNumber && <p className="text-xs">📞 {hazard.contactNumber}</p>}
              </Popup>
            );
            if (hazard.geometry.type === 'Point') {
              const [lng, lat] = hazard.geometry.coordinates;
              return (
                <Marker key={hazard._id} position={[lat, lng]} icon={pointIcon(meta)}>
                  {popup}
                  {hazard.layer === 'evacuation_center' && (
                    <Tooltip permanent direction="top" offset={[0, -14]}>
                      {hazard.name}
                    </Tooltip>
                  )}
                </Marker>
              );
            }
            if (hazard.geometry.type === 'LineString') {
              const positions = hazard.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
              return (
                <Polyline key={hazard._id} positions={positions} pathOptions={{ color: meta.color, weight: 5, dashArray: meta.dashed ? '8 8' : undefined }}>
                  {popup}
                </Polyline>
              );
            }
            if (hazard.geometry.type === 'Polygon') {
              const positions = hazard.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
              return (
                <Polygon key={hazard._id} positions={positions} pathOptions={{ color: meta.color, fillOpacity: 0.3 }}>
                  {popup}
                </Polygon>
              );
            }
            return null;
          })}
          {children}
        </MapContainer>
      </div>
    </div>
  );
};

export default HazardMap;
