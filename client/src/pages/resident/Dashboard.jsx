import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiAlertCircle, FiFileText, FiAlertTriangle, FiMapPin, FiDroplet, FiWind, FiCloudRain } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import useWeather from '../../hooks/useWeather';
import useSocketEvent from '../../hooks/useSocketEvent';
import { usePreferences } from '../../contexts/PreferencesContext';
import Badge from '../../components/common/Badge';
import HotlineIcon from '../../components/common/HotlineIcon';
import AnnouncementCard from '../../components/announcements/AnnouncementCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import { DEFAULT_MAP_CENTER, categoryLabel, documentLabel } from '../../utils/constants';

// Weather banner turns yellow / orange / red with the flood alert level set by officials (panel revision).
const BANNER = {
  low: { box: 'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100', sub: 'text-gray-500 dark:text-gray-400', chip: 'bg-emerald-100 text-emerald-700' },
  moderate: { box: 'bg-yellow-300 text-gray-900', sub: 'text-gray-800', chip: 'bg-white/70 text-gray-900' },
  high: { box: 'bg-orange-500 text-white', sub: 'text-white/90', chip: 'bg-white/25 text-white' },
  critical: { box: 'bg-red-600 text-white', sub: 'text-white/90', chip: 'bg-white/25 text-white' },
};

const WeatherBanner = ({ center }) => {
  const { t } = usePreferences();
  const weather = useWeather(center);
  const [emergency, setEmergency] = useSetting('emergency');
  useSocketEvent('emergency:updated', setEmergency);

  const risk = emergency?.floodRiskLevel || 'low';
  const style = BANNER[risk] || BANNER.low;

  return (
    <section className={`rounded-xl p-4 shadow-card transition-colors ${style.box}`} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-sm font-semibold">
          <FiMapPin /> Noveleta, Cavite
        </p>
        <span className={`badge uppercase ${style.chip}`}>
          <FiDroplet /> {t('dash.floodAlert')}: {t(`risk.${risk}`)}
        </span>
      </div>
      {weather === undefined ? (
        <p className={`py-4 text-center text-sm ${style.sub}`}>{t('common.loading')}</p>
      ) : weather === null ? (
        <p className={`py-4 text-center text-sm ${style.sub}`}>{t('hub.weatherNA')}</p>
      ) : (
        <>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-display text-4xl font-extrabold">{weather.temp}°C</span>
            <span className="min-w-0">
              <span className="block font-semibold">{weather.label}</span>
              <span className={`block text-xs ${style.sub}`}>{t('hub.feelsLike', { temp: weather.feelsLike })}</span>
            </span>
            <span className="ml-auto text-4xl" aria-hidden="true">
              {weather.icon}
            </span>
          </div>
          <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs ${style.sub}`}>
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
    </section>
  );
};

const StatusCard = ({ icon: Icon, title, to, items, empty, renderItem }) => {
  const { t } = usePreferences();
  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
          <Icon className="text-primary-600" /> {title}
        </h2>
        <Link to={to} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-600">
          {t('common.viewAll')} <FiArrowRight />
        </Link>
      </div>
      {items === null ? (
        <p className="py-2 text-xs text-gray-400">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="py-2 text-xs text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-1">{items.map(renderItem)}</ul>
      )}
    </section>
  );
};

const ResidentDashboard = () => {
  const { t } = usePreferences();
  const [general] = useSetting('general');
  const [hotlines, setHotlines] = useState([]);
  const [announcements, setAnnouncements] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [documents, setDocuments] = useState(null);

  const loadStatus = useCallback(() => {
    api.get('/incidents', { params: { limit: 3 } }).then(({ data }) => setIncidents(data.data)).catch(() => setIncidents([]));
    api.get('/documents', { params: { limit: 3 } }).then(({ data }) => setDocuments(data.data)).catch(() => setDocuments([]));
  }, []);

  useEffect(() => {
    api.get('/hotlines').then(({ data }) => setHotlines(data.data)).catch(() => {});
    api
      .get('/announcements', { params: { limit: 6, sort: '-isPinned,-createdAt' } })
      .then(({ data }) => setAnnouncements(data.data))
      .catch(() => setAnnouncements([]));
    loadStatus();
  }, [loadStatus]);

  // Officials' status updates on requests and reports show up here without a refresh.
  useSocketEvent('notification:new', (n) => ['incident', 'document'].includes(n?.type) && loadStatus());

  // Most important announcement: the newest one officials marked Important, else the newest emergency post.
  const featured = announcements?.find((a) => a.isPinned) || announcements?.find((a) => a.category === 'emergency') || null;
  const feed = (announcements || []).filter((a) => a._id !== featured?._id);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
      {/* Status column first on phones so residents see their updates right away. */}
      <aside className="space-y-4 lg:order-2">
        <WeatherBanner center={general?.mapCenter || DEFAULT_MAP_CENTER} />

        <StatusCard
          icon={FiFileText}
          title={t('dash.serviceStatus')}
          to="/resident/documents"
          items={documents}
          empty={t('service.noRequests')}
          renderItem={(d) => (
            <li key={d._id}>
              <Link to={`/resident/documents/${d._id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{documentLabel(d.type)}</span>
                  <span className="block font-mono text-[11px] text-gray-400">{d.referenceCode}</span>
                </span>
                <Badge status={d.status} />
              </Link>
            </li>
          )}
        />

        <StatusCard
          icon={FiAlertCircle}
          title={t('dash.incidentStatus')}
          to="/resident/incidents"
          items={incidents}
          empty={t('incident.noReports')}
          renderItem={(i) => (
            <li key={i._id}>
              <Link to={`/resident/incidents/${i._id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{categoryLabel(i.category)}</span>
                  <span className="block font-mono text-[11px] text-gray-400">{i.referenceCode}</span>
                </span>
                <Badge status={i.status} />
              </Link>
            </li>
          )}
        />

        <section className="card p-4">
          <h2 className="mb-3 font-display text-sm font-bold uppercase text-red-600">{t('dash.hotlines')}</h2>
          <ul className="space-y-1.5">
            {hotlines.map((h) => (
              <li key={h._id}>
                <a href={`tel:${h.number.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10">
                    <HotlineIcon category={h.category} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{h.name}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{h.number}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div className="min-w-0 space-y-4">
        {featured && (
          <section aria-labelledby="important-heading" className="overflow-hidden rounded-xl border-2 border-amber-400 bg-amber-50 shadow-card dark:bg-amber-500/10">
            <h2 id="important-heading" className="flex items-center gap-2 bg-amber-400 px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide text-gray-900">
              <FiAlertTriangle /> {t('dash.important')}
            </h2>
            <Link to={`/resident/announcements?focus=${featured._id}`} className="block transition hover:opacity-95">
              <AnnouncementCard item={featured} large />
            </Link>
          </section>
        )}

        {announcements === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : announcements.length === 0 ? (
          <p className="card p-8 text-center text-sm text-gray-400">{t('dash.noAnnouncements')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {feed.map((a) => (
              <Link key={a._id} to={`/resident/announcements?focus=${a._id}`} className="block transition hover:-translate-y-0.5">
                <AnnouncementCard item={a} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentDashboard;
