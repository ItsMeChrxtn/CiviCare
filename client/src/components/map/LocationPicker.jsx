import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, MAP_LIMITS, isInsideMagdiwang } from '../../utils/constants';

const markerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:26px;height:26px;border-radius:9999px 9999px 9999px 0;background:#dc2626;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

// Panel revision: pins can only be dropped inside Barangay Magdiwang.
const ClickHandler = ({ onPick, onOutside }) => {
  useMapEvents({
    click(e) {
      const point = [e.latlng.lat, e.latlng.lng];
      if (isInsideMagdiwang(point)) onPick(point);
      else onOutside?.();
    },
  });
  return null;
};

/** Pans to the pin whenever it changes from outside (e.g. the "Use your location" button). */
const FollowValue = ({ value }) => {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo(value, Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [value, map]);
  return null;
};

/** Controlled click-to-pin map used by the incident report screen. `value` is [lat, lng] or null. */
const LocationPicker = ({ value, onChange, onOutside, center = DEFAULT_MAP_CENTER, height = '18rem', zoom = 16 }) => (
  <div style={{ height }} className="relative z-0 w-full">
    <MapContainer center={value || center} zoom={zoom} {...MAP_LIMITS} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} onOutside={onOutside} />
      <FollowValue value={value} />
      {value && <Marker position={value} icon={markerIcon} />}
    </MapContainer>
  </div>
);

export default LocationPicker;
