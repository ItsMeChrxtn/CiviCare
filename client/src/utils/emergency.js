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
