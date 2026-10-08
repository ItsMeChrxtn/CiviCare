import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiInfo, FiArrowRight, FiAlertCircle, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import { usePreferences } from '../../contexts/PreferencesContext';
import Badge from '../../components/common/Badge';
import HotlineIcon from '../../components/common/HotlineIcon';
import AnnouncementCard from '../../components/announcements/AnnouncementCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import { categoryLabel, documentLabel } from '../../utils/constants';

const GreenCard = ({ children, className = '' }) => (
  <section className={`rounded-xl bg-brand-green p-4 text-white shadow-card ${className}`}>{children}</section>
);

const ResidentDashboard = () => {
  const { t } = usePreferences();
  const [general] = useSetting('general');
  const [stats, setStats] = useState(null);
  const [hotlines, setHotlines] = useState([]);
  const [announcements, setAnnouncements] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.get('/reports/public-stats').then(({ data }) => setStats(data.data)).catch(() => {});
    api.get('/hotlines').then(({ data }) => setHotlines(data.data)).catch(() => {});
    api
      .get('/announcements', { params: { limit: 6, sort: '-isPinned,-createdAt' } })
      .then(({ data }) => setAnnouncements(data.data))
      .catch(() => setAnnouncements([]));
    api.get('/incidents', { params: { limit: 5 } }).then(({ data }) => setIncidents(data.data)).catch(() => {});
    api.get('/documents', { params: { limit: 5 } }).then(({ data }) => setDocuments(data.data)).catch(() => {});
  }, []);

  // Most important announcement: the newest one officials marked Important, else the newest emergency post.
  const featured = announcements?.find((a) => a.isPinned) || announcements?.find((a) => a.category === 'emergency') || null;
  const feed = (announcements || []).filter((a) => a._id !== featured?._id);

  const activeTickets = incidents.filter((i) => i.status !== 'resolved');
  const openRequests = documents.filter((d) => !['claimed', 'rejected'].includes(d.status));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[17rem_1fr]">
      <div className="space-y-4">
        <GreenCard>
          <h2 className="mb-2 flex items-center justify-center gap-1.5 font-display text-sm font-bold uppercase">
            <FiInfo /> {t('dash.about')}
          </h2>
          <p className="text-center text-xs leading-relaxed text-white/90">{general?.about}</p>
        </GreenCard>

        <GreenCard className="text-center">
          <p className="text-[11px] text-white/80">CIVICARE · Barangay Magdiwang, Noveleta, Cavite</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">{t('dash.welcomeTitle')}</h2>
          <p className="mt-1 text-xs text-white/90">{t('dash.welcomeBody')}</p>
          <div className="mt-3 flex justify-around">
            <div>
              <p className="font-display text-2xl font-extrabold">{stats?.residents?.toLocaleString() ?? '—'}</p>
              <p className="text-xs">{t('dash.residents')}</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold">{stats?.eventsThisWeek ?? '—'}</p>
              <p className="text-xs">{t('dash.eventsThisWeek')}</p>
            </div>
          </div>
        </GreenCard>

        <GreenCard>
          <h2 className="mb-3 text-center font-display text-sm font-bold uppercase">{t('dash.hotlines')}</h2>
          <ul className="space-y-2.5">
            {hotlines.map((h) => (
              <li key={h._id}>
                <a href={`tel:${h.number.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-white/10">
                  <HotlineIcon category={h.category} className="h-7 w-7 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{h.name}</span>
                    <span className="block text-xs text-white/80">{h.number}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </GreenCard>
      </div>

      <div className="space-y-4">
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

        {(activeTickets.length > 0 || openRequests.length > 0) && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
                  <FiAlertCircle className="text-primary-600" /> {t('dash.myTickets')}
                </h2>
                <Link to="/resident/incidents" className="flex items-center gap-1 text-xs font-semibold text-primary-600">
                  {t('common.viewAll')} <FiArrowRight />
                </Link>
              </div>
              {activeTickets.length === 0 && <p className="text-xs text-gray-400">—</p>}
              {activeTickets.map((i) => (
                <Link key={i._id} to={`/resident/incidents/${i._id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="truncate">
                    <span className="font-mono text-xs text-gray-400">{i.referenceCode}</span> · {categoryLabel(i.category)}
                  </span>
                  <Badge status={i.status} />
                </Link>
              ))}
            </div>
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
                  <FiFileText className="text-primary-600" /> {t('service.myRequests')}
                </h2>
                <Link to="/resident/documents" className="flex items-center gap-1 text-xs font-semibold text-primary-600">
                  {t('common.viewAll')} <FiArrowRight />
                </Link>
              </div>
              {openRequests.length === 0 && <p className="text-xs text-gray-400">—</p>}
              {openRequests.map((d) => (
                <Link key={d._id} to={`/resident/documents/${d._id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="truncate">{documentLabel(d.type)}</span>
                  <Badge status={d.status} />
                </Link>
              ))}
            </div>
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
