import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiChevronDown, FiMapPin, FiDroplet, FiWind, FiCloudRain, FiBell } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import useSocketEvent from '../../hooks/useSocketEvent';
import useWeather from '../../hooks/useWeather';
import { usePreferences } from '../../contexts/PreferencesContext';
import HazardMap, { HazardLegend } from '../../components/map/HazardMap';
import HotlineIcon from '../../components/common/HotlineIcon';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';
import { activeAlerts, isAlertActive, RISK_STYLES } from '../../utils/emergency';

// Safety checklists / preparedness guides tailored to Barangay Magdiwang's common hazards (floods, typhoons).
const GUIDES = [
  {
    key: 'gobag',
    title: 'Emergency go-bag checklist',
    checklist: true,
    items: [
      'Drinking water (3 liters per person per day, for 3 days)',
      'Ready-to-eat food and can opener',
      'Flashlight, extra batteries and power bank',
      'First aid kit and maintenance medicines',
      'Copies of IDs and important documents in a waterproof pouch',
      'Cash in small bills',
      'Whistle, face masks, and rain gear',
      'Change of clothes, blanket, hygiene kit',
      'Battery-powered radio',
    ],
  },
  {
    key: 'family',
    title: 'Family evacuation plan',
    checklist: true,
    items: [
      'Know your nearest evacuation center (see the map below)',
      'Agree on a family meeting point',
      'Assign who brings the go-bag, pets, and assists elderly/PWD members',
      'Save barangay and MDRRMO hotlines on every phone',
      'Practice the evacuation route with the whole family',
    ],
  },
  {
    key: 'firstaid',
    title: 'First aid guides',
    items: [
      'Wounds: apply direct pressure with a clean cloth, then elevate.',
      'Burns: cool under running water for 10-20 minutes; do not apply toothpaste or ice.',
      'Fainting: lay the person flat and raise the legs; check breathing.',
      'Drowning: call for help, start rescue breaths/CPR if trained, keep the person warm.',
      'Electric shock: switch off the power source before touching the victim.',
    ],
  },
  {
    key: 'earthquake',
    title: 'Earthquake safety procedures',
    items: [
      'DROP, COVER and HOLD ON under a sturdy table.',
      'Stay away from windows, shelves and hanging objects.',
      'When shaking stops, exit calmly and go to an open area.',
      'Avoid damaged buildings, posts and electrical wires.',
      'Expect aftershocks; follow barangay instructions.',
    ],
  },
  {
    key: 'flood',
    title: 'Flood preparedness',
    checklist: true,
    items: [
      'Monitor PAGASA rainfall warnings and barangay SMS alerts',
      'Move valuables and appliances to higher places',
      'Turn off the main power switch if water may enter',
      'Do not walk or drive through floodwater',
      'Evacuate early when told by barangay officials',
    ],
  },
  {
    key: 'typhoon',
    title: 'Typhoon preparedness',
    checklist: true,
    items: [
      'Secure roofs, windows and loose outdoor items',
      'Stock food, water and medicines for at least 3 days',
      'Charge phones and power banks; prepare flashlights',
      'Keep away from coastal and riverbank areas during storm surge',
      'Follow pre-emptive evacuation orders',
    ],
  },
];

const CHECK_KEY = 'civicare-checklist';
const readChecks = () => {
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY)) || {};
  } catch {
    return {};
  }
};

const Panel = ({ title, children, className = '', titleClass = '' }) => (
  <section className={`rounded-xl bg-white p-4 shadow-card dark:bg-gray-900 ${className}`}>
    {title && <h2 className={`mb-3 text-center font-display text-sm font-bold uppercase tracking-wide ${titleClass}`}>{title}</h2>}
    {children}
  </section>
);

const EmergencyHub = () => {
  const { t } = usePreferences();
  const { pathname, hash } = useLocation();
  const inPortal = pathname.startsWith('/resident');
  const [general] = useSetting('general');
  const [emergency, setEmergency] = useSetting('emergency');
  const [hotlines, setHotlines] = useState([]);
  const [openGuide, setOpenGuide] = useState(hash === '#checklist' ? 'gobag' : null);
  const [checked, setChecked] = useState(readChecks);
  const center = general?.mapCenter || DEFAULT_MAP_CENTER;
  const weather = useWeather(center);

  useSocketEvent('emergency:updated', setEmergency);

  useEffect(() => {
    api.get('/hotlines').then(({ data }) => setHotlines(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (hash === '#checklist') document.getElementById('checklist')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const toggleItem = (item) => {
    const next = { ...checked, [item]: !checked[item] };
    setChecked(next);
    try {
      localStorage.setItem(CHECK_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable - checklist just won't persist
    }
  };

  const risk = emergency?.floodRiskLevel || 'low';
  const riskStyle = RISK_STYLES[risk] || RISK_STYLES.low;
  const alerts = emergency?.alerts || [];
  const activeCount = activeAlerts(emergency).length;

  return (
    <div className={inPortal ? '' : 'mx-auto max-w-7xl px-4 py-10 lg:px-8'}>
      {!inPortal && <h1 className="mb-6 text-center font-display text-3xl font-extrabold">{t('hub.title')}</h1>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[15rem_1fr_1fr_11rem]">
        <section className="rounded-xl bg-brand-green p-4 text-white shadow-card xl:row-span-1">
          <h2 className="mb-3 text-center font-display text-sm font-bold uppercase text-red-200">{t('hub.hotlines')}</h2>
          <ul className="space-y-2.5">
            {hotlines.map((h) => (
              <li key={h._id}>
                <a href={`tel:${h.number.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/10">
                  <HotlineIcon category={h.category} className="h-6 w-6 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{h.name}</span>
                    <span className="block text-xs text-white/80">{h.number}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <Panel>
            <p className="flex items-center gap-1 text-sm font-semibold text-red-600">
              <FiMapPin /> Noveleta, Cavite
            </p>
            {weather === undefined ? (
              <p className="py-6 text-center text-sm text-gray-400">{t('common.loading')}</p>
            ) : weather === null ? (
              <p className="py-6 text-center text-sm text-gray-400">{t('hub.weatherNA')}</p>
            ) : (
              <>
                <div className="mt-1 flex items-center gap-4">
                  <span className="font-display text-5xl font-extrabold">{weather.temp}°C</span>
                  <span>
                    <span className="block font-semibold">{weather.label}</span>
                    <span className="block text-xs text-gray-500">{t('hub.feelsLike', { temp: weather.feelsLike })}</span>
                  </span>
                  <span className="ml-auto text-5xl" aria-hidden="true">
                    {weather.icon}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <FiDroplet /> {weather.humidity}% {t('hub.humidity')}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiWind /> {weather.wind} km/h {weather.windDir}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCloudRain /> {weather.rain} mm {t('hub.rain')}
                  </span>
                </div>
              </>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-semibold">
                <FiDroplet className="text-blue-600" /> {t('hub.floodRisk')}
              </p>
              <span className={`badge uppercase ${riskStyle.chip}`}>{t(`risk.${risk}`)}</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="meter" aria-valuetext={risk}>
              <div className={`h-full rounded-full ${riskStyle.bar}`} style={{ width: riskStyle.width }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-gray-500">
              {['low', 'moderate', 'high', 'critical'].map((r) => (
                <span key={r}>{t(`risk.${r}`)}</span>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={t('hub.prepCenter')} className="md:col-span-2 xl:col-span-1" titleClass="text-primary-800 dark:text-primary-300">
          <div id="checklist" className="scroll-mt-24 divide-y divide-gray-100 dark:divide-gray-800">
            {GUIDES.map((g) => {
              const isOpen = openGuide === g.key;
              const done = g.checklist ? g.items.filter((i) => checked[i]).length : null;
              return (
                <div key={g.key}>
                  <button
                    type="button"
                    onClick={() => setOpenGuide(isOpen ? null : g.key)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold"
                  >
                    <span>
                      {g.title}
                      {done !== null && (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {done}/{g.items.length}
                        </span>
                      )}
                    </span>
                    <FiChevronDown className={`shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <ul className="space-y-1.5 pb-3">
                      {g.items.map((item) =>
                        g.checklist ? (
                          <li key={item}>
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input type="checkbox" checked={!!checked[item]} onChange={() => toggleItem(item)} className="mt-0.5 h-4 w-4 accent-primary-600" />
                              <span className={checked[item] ? 'text-gray-400 line-through' : ''}>{item}</span>
                            </label>
                          </li>
                        ) : (
                          <li key={item} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={t('hub.legend')}>
          <HazardLegend />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_17rem]">
        <section aria-label={t('hub.map')}>
          <HazardMap height="26rem" showLegend={false} center={center} />
        </section>

        <Panel>
          <h2 className="mb-3 flex items-center justify-between font-display font-bold">
            <span className="flex items-center gap-2">
              <FiBell className="text-red-500" /> {t('hub.alerts')}
            </span>
            {activeCount > 0 && <span className="badge bg-red-600 text-white">{t('hub.active', { count: activeCount })}</span>}
          </h2>
          <ul className="space-y-2">
            {alerts.map((a) => {
              const active = isAlertActive(a);
              return (
                <li key={a.key} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800/60">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                    <FiBell className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className={`block text-xs ${active ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>{a.level}</span>
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-orange-500' : 'bg-blue-500'}`} />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

export default EmergencyHub;
