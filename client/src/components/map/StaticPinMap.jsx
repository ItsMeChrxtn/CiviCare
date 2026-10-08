import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';

/** Read-only map with a single pin; used on incident detail pages. `position` is [lat, lng]. */
const StaticPinMap = ({ position, height = '14rem', color = '#dc2626' }) => (
  <div style={{ height }} className="relative z-0 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
    <MapContainer center={position} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={position} radius={11} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }} />
    </MapContainer>
  </div>
);

export default StaticPinMap;
