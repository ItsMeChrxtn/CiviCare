import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiCalendar, FiUsers, FiDownload } from 'react-icons/fi';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const inPortal = useLocation().pathname.startsWith('/resident');

  const load = useCallback(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data.data));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Signed-in residents always view events inside their portal, never the public site.
  if (user?.role === 'resident' && !inPortal) return <Navigate to={`/resident/events/${id}`} replace />;
  if (!event) return <PageLoader />;

  const handleJoin = async () => {
    setBusy(true);
    try {
      await api.post(`/events/${id}/join`);
      toast.success(t('events.joined'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('events.joinFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await api.delete(`/events/${id}/join`);
      toast.success(t('events.cancelled'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('events.cancelFailed'));
    } finally {
      setBusy(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const { data } = await api.post(`/events/${id}/certificate`);
      window.open(data.data.url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || t('events.certNotYet'));
    }
  };

  return (
    <div className={`mx-auto max-w-4xl animate-fadeIn ${inPortal ? '' : 'px-4 py-16 lg:px-8'}`}>
      <Link
        to={inPortal ? '/resident/events' : '/events'}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
      >
        <FiArrowLeft /> {t('events.back')}
      </Link>

      {event.coverImage?.url && (
        <img src={event.coverImage.url} alt={event.title} className="mb-6 w-full rounded-2xl object-cover shadow-card" style={{ maxHeight: 360 }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{t(`events.cat.${event.category}`, null, event.category?.replace(/_/g, ' '))}</span>
        <Badge status={event.status} />
      </div>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">{event.title}</h1>

      <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-2"><FiCalendar className="text-primary-500" /> {format(new Date(event.startDate), 'MMM d, yyyy, h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
        <span className="flex items-center gap-2"><FiMapPin className="text-primary-500" /> {event.location}</span>
        {event.capacity > 0 && <span className="flex items-center gap-2"><FiUsers className="text-primary-500" /> {t('map.capacity')}: {event.capacity}</span>}
      </div>

      <p className="mt-6 whitespace-pre-line text-gray-600 dark:text-gray-300">{event.description}</p>

      {event.gallery?.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {event.gallery.map((g) => (
            <img key={g.publicId} src={g.url} alt={event.title} className="h-28 w-full rounded-xl object-cover shadow-soft transition duration-300 hover:scale-[1.03]" />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {!user && (
          <Link to="/login" className="btn-primary">
            {t('events.loginToJoin')}
          </Link>
        )}
        {user?.role === 'resident' && !event.isRegistered && (
          <button onClick={handleJoin} disabled={busy} className="btn-primary">
            {busy ? t('common.loading') : t('events.join')}
          </button>
        )}
        {user?.role === 'resident' && event.isRegistered && (
          <>
            <button onClick={handleLeave} disabled={busy} className="btn-secondary">
              {t('events.cancelRegistration')}
            </button>
            <button onClick={downloadCertificate} className="btn-primary">
              <FiDownload /> {t('events.downloadCert')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
