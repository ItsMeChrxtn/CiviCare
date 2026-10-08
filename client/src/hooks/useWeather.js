import { useEffect, useState } from 'react';

// WMO weather codes -> short description + icon (Open-Meteo convention).
const WEATHER = [
  [[0], 'Clear Sky', '☀️'],
  [[1, 2], 'Partly Cloudy', '⛅'],
  [[3], 'Overcast', '☁️'],
  [[45, 48], 'Foggy', '🌫️'],
  [[51, 53, 55, 56, 57], 'Drizzle', '🌦️'],
  [[61, 63, 66, 80, 81], 'Rain', '🌧️'],
  [[65, 67, 82], 'Heavy Rain', '🌧️'],
  [[95, 96, 99], 'Thunderstorm', '⛈️'],
];
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Current conditions from Open-Meteo (free, no API key). Returns undefined while loading, null on failure. */
const useWeather = ([lat, lng]) => {
  const [weather, setWeather] = useState(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m' +
      '&timezone=Asia%2FManila';

    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('weather'))))
      .then(({ current: c }) => {
        const [, label, icon] = WEATHER.find(([codes]) => codes.includes(c.weather_code)) || [null, 'Cloudy', '☁️'];
        setWeather({
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          windDir: COMPASS[Math.round(c.wind_direction_10m / 45) % 8],
          rain: c.precipitation,
          label,
          icon,
        });
      })
      .catch((err) => err.name !== 'AbortError' && setWeather(null));

    return () => controller.abort();
  }, [lat, lng]);

  return weather;
};

export default useWeather;
