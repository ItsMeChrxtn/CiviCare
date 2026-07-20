import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { FiCrosshair } from 'react-icons/fi';

const markerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px 9999px 9999px 0;background:#0f766e;transform:rotate(45deg);border:2px solid white;"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

/** Click-to-pin (or GPS) location picker used by the resident incident report form. */
const LocationPicker = ({ value, onChange, defaultCenter = [14.676, 121.0437] }) => {
  const [position, setPosition] = useState(value || null);

  const handlePick = (latlng) => {
    setPosition(latlng);
    onChange(latlng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      handlePick(latlng);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800">
        <span>{position ? `Pinned: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Tap the map to pin the incident location'}</span>
        <button type="button" onClick={useMyLocation} className="flex items-center gap-1 font-medium text-primary-600">
          <FiCrosshair /> Use my location
        </button>
      </div>
      <div style={{ height: '18rem' }}>
        <MapContainer center={position || defaultCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;
