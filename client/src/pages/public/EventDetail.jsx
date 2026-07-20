import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiCalendar, FiUsers, FiDownload } from 'react-icons/fi';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data.data));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!event) return <PageLoader />;

  const handleJoin = async () => {
    setBusy(true);
    try {
      await api.post(`/events/${id}/join`);
      toast.success('Successfully joined the event!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join event');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await api.delete(`/events/${id}/join`);
      toast.success('Registration cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const { data } = await api.post(`/events/${id}/certificate`);
      window.open(data.data.url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate not available yet');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <Link to="/events" className="mb-6 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <FiArrowLeft /> Back to Events
      </Link>

      {event.coverImage?.url && (
        <img src={event.coverImage.url} alt={event.title} className="mb-6 w-full rounded-2xl object-cover" style={{ maxHeight: 360 }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{event.category?.replace(/_/g, ' ')}</span>
        <Badge status={event.status} />
      </div>
      <h1 className="mt-3 text-3xl font-extrabold">{event.title}</h1>

      <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-2"><FiCalendar /> {format(new Date(event.startDate), 'MMM d, yyyy, h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
        <span className="flex items-center gap-2"><FiMapPin /> {event.location}</span>
        {event.capacity > 0 && <span className="flex items-center gap-2"><FiUsers /> Capacity: {event.capacity}</span>}
      </div>

      <p className="mt-6 whitespace-pre-line text-gray-600 dark:text-gray-300">{event.description}</p>

      {event.gallery?.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {event.gallery.map((g) => (
            <img key={g.publicId} src={g.url} alt="Event gallery" className="h-28 w-full rounded-xl object-cover" />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {!user && (
          <Link to="/login" className="btn-primary">
            Log in to Join This Event
          </Link>
        )}
        {user?.role === 'resident' && !event.isRegistered && (
          <button onClick={handleJoin} disabled={busy} className="btn-primary">
            {busy ? 'Joining...' : 'Join Event'}
          </button>
        )}
        {user?.role === 'resident' && event.isRegistered && (
          <>
            <button onClick={handleLeave} disabled={busy} className="btn-secondary">
              Cancel Registration
            </button>
            <button onClick={downloadCertificate} className="btn-primary">
              <FiDownload /> Download Certificate
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
