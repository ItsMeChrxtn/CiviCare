import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCalendar, FiImage, FiSend, FiX } from 'react-icons/fi';
import { MdPerson } from 'react-icons/md';
import api from '../../utils/api';
import useSocketEvent from '../../hooks/useSocketEvent';
import Badge from '../../components/common/Badge';
import IncidentMap from '../../components/map/IncidentMap';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { CardSkeleton } from '../../components/common/Skeleton';
import { categoryLabel } from '../../utils/constants';

const BlueStat = ({ value, label, sub, icon: Icon }) => (
  <div className="flex items-center justify-center gap-4 rounded-xl bg-brand-blue p-5 text-white shadow-card">
    <div>
      <p className="font-display text-4xl font-extrabold leading-none">{value ?? '—'}</p>
      <p className="mt-1 text-lg font-bold leading-tight">{label}</p>
      <p className="text-xs text-white/70">{sub}</p>
    </div>
    <Icon className="h-14 w-14 shrink-0" />
  </div>
);

/** Officials Overview (docu Figure 15) + live incident map and 12-month trends. */
const OfficialDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState(null);
  const [trends, setTrends] = useState(null);
  const [post, setPost] = useState({ title: '', content: '', sendSms: false });
  const [image, setImage] = useState(null);
  const [posting, setPosting] = useState(false);

  const loadOverview = useCallback(() => api.get('/reports/overview').then(({ data }) => setOverview(data.data)), []);
  const loadRecent = useCallback(
    () => api.get('/incidents', { params: { limit: 5 } }).then(({ data }) => setRecent(data.data)),
    []
  );

  useEffect(() => {
    loadOverview();
    loadRecent();
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
  }, [loadOverview, loadRecent]);

  // Keep the cards and recent list current as residents report.
  useSocketEvent('incident:new', () => {
    loadOverview();
    loadRecent();
  });
  useSocketEvent('incident:updated', () => {
    loadOverview();
    loadRecent();
  });

  const publish = async (e) => {
    e.preventDefault();
    if (!post.content.trim()) return toast.error('Write the announcement first');
    setPosting(true);
    try {
      const form = new FormData();
      // The quick composer has one text box: the first line becomes the title.
      const [firstLine, ...rest] = post.content.trim().split('\n');
      form.append('title', post.title.trim() || firstLine.slice(0, 120));
      form.append('content', post.title.trim() ? post.content.trim() : rest.join('\n').trim() || firstLine);
      form.append('category', 'general');
      form.append('sendSms', String(post.sendSms));
      if (image) form.append('coverImage', image);
      await api.post('/announcements', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(post.sendSms ? 'Announcement posted and sent by SMS' : 'Announcement posted');
      setPost({ title: '', content: '', sendSms: false });
      setImage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  const month = format(new Date(), 'MMMM yyyy');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BlueStat value={overview?.residents?.toLocaleString()} label="Residents" sub={`As of ${month}`} icon={MdPerson} />
        <BlueStat
          value={overview?.activeIncidents}
          label="Active Incidents"
          sub={`As of ${overview?.purokCount ?? '—'} puroks`}
          icon={FiAlertTriangle}
        />
        <BlueStat value={overview?.serviceRequestsThisMonth} label="Service Request" sub="This month" icon={FiCalendar} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={publish} className="flex flex-col rounded-xl bg-brand-blue p-3 shadow-card">
          <h2 className="py-2 text-center font-display text-xl font-bold text-white">Announcement</h2>
          <div className="flex flex-1 flex-col rounded-lg bg-[#fbf8ec] p-4 dark:bg-gray-900">
            <input
              value={post.title}
              onChange={(e) => setPost((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title (optional)"
              className="mb-2 border-b border-gray-200 bg-transparent pb-1 font-semibold outline-none placeholder:text-gray-400 dark:border-gray-700"
              aria-label="Announcement title"
            />
            <textarea
              value={post.content}
              onChange={(e) => setPost((p) => ({ ...p, content: e.target.value }))}
              placeholder="Enter Announcements!"
              rows={6}
              className="flex-1 resize-none bg-transparent text-lg outline-none placeholder:text-gray-500"
              aria-label="Announcement text"
            />
            {image && (
              <p className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                <FiImage /> {image.name}
                <button type="button" onClick={() => setImage(null)} aria-label="Remove image">
                  <FiX />
                </button>
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={post.sendSms} onChange={(e) => setPost((p) => ({ ...p, sendSms: e.target.checked }))} className="h-4 w-4 accent-primary-600" />
                Also send by SMS to all residents
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-gray-600 hover:text-primary-600" title="Attach photo">
                  <FiImage className="h-7 w-7" />
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => setImage(e.target.files[0] || null)} />
                </label>
                <button type="submit" disabled={posting} className="btn-primary !py-2">
                  <FiSend /> {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>

        <section className="rounded-xl bg-brand-blue p-3 shadow-card">
          <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display font-bold">Recent Incidents</h2>
              <Link to="/official/incidents" className="text-sm font-semibold text-primary-600 hover:underline">
                View all →
              </Link>
            </div>
            {recent === null ? (
              <CardSkeleton />
            ) : recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No incidents reported yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {recent.map((i) => (
                  <li key={i._id}>
                    <Link to={`/official/incidents/${i._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[11px] text-gray-400">
                          {i.referenceCode} <Badge status={i.severity} />
                        </p>
                        <p className="font-semibold">{categoryLabel(i.category)}</p>
                        <p className="truncate text-xs text-gray-500">
                          {i.location?.address || `${i.location.coordinates[1].toFixed(4)}, ${i.location.coordinates[0].toFixed(4)}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge status={i.status} />
                        <p className="mt-1 text-[11px] text-gray-400">{formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-display font-bold">Incident Map</h2>
        <IncidentMap />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-display font-bold">Incident Reports (12 months)</h2>
          {trends ? <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-display font-bold">Service Requests (12 months)</h2>
          {trends ? <TrendLineChart series={trends.documents} label="Requests" color="#1546b8" /> : <CardSkeleton />}
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;
