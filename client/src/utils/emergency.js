// Alert levels that mean "nothing to act on"; anything else counts as an active alert.
const CALM_LEVELS = ['low', 'normal', 'none', 'no signal', 'clear'];

export const isAlertActive = (alert) => alert?.active !== false && !CALM_LEVELS.includes(String(alert?.level).toLowerCase());

export const activeAlerts = (emergency) => (emergency?.alerts || []).filter(isAlertActive);

export const RISK_STYLES = {
  low: { bar: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-700', width: '25%' },
  moderate: { bar: 'bg-amber-500', text: 'text-amber-600', chip: 'bg-amber-100 text-amber-700', width: '50%' },
  high: { bar: 'bg-orange-500', text: 'text-orange-600', chip: 'bg-orange-100 text-orange-700', width: '75%' },
  critical: { bar: 'bg-red-600', text: 'text-red-600', chip: 'bg-red-100 text-red-700', width: '100%' },
};

// Panel revision: the hub shows only current natural hazards. Besides the alerts officials raise,
// live weather in Noveleta adds automatic alerts for thunderstorms, heavy rain and strong winds.
const THUNDERSTORM_CODES = [95, 96, 99];
const HEAVY_RAIN_CODES = [65, 67, 82];

export const weatherAlerts = (weather) => {
  if (!weather) return [];
  const list = [];
  if (THUNDERSTORM_CODES.includes(weather.code)) {
    list.push({ key: 'weather_thunderstorm', label: 'Thunderstorm', level: 'Ongoing thunderstorm in Noveleta', auto: true });
  }
  if (HEAVY_RAIN_CODES.includes(weather.code) || weather.rain >= 7.5) {
    list.push({ key: 'weather_rain', label: 'Heavy Rainfall', level: `Heavy rain now (${weather.rain} mm) — watch for flooding`, auto: true });
  }
  if (weather.wind >= 39) {
    list.push({ key: 'weather_wind', label: 'Strong Winds', level: `Winds at ${weather.wind} km/h — secure loose objects`, auto: true });
  }
  return list;
};

// Panel revision: the Emergency Alerts panel exists only while the admin has set an emergency;
// live weather alerts ride along but never open it on their own.
export const currentAlerts = (emergency, weather) => {
  const set = activeAlerts(emergency);
  return set.length ? [...set, ...weatherAlerts(weather)] : [];
};
