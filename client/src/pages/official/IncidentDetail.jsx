import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiUser, FiPhone, FiClock, FiUserPlus, FiEdit3, FiLock } from 'react-icons/fi';
import api from '../../utils/api';
import useSocketEvent from '../../hooks/useSocketEvent';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';
import TicketTracker from '../../components/incidents/TicketTracker';
import StaticPinMap from '../../components/map/StaticPinMap';
import { INCIDENT_PIN_COLORS, categoryLabel } from '../../utils/constants';

const STATUS_OPTIONS = ['pending', 'ongoing', 'resolved'];

/** Officials-only working notes; the API never returns them to residents. */
const InternalNotes = ({ incidentId, notes, onAdded }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/incidents/${incidentId}/notes`, { note: text });
      setText('');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-1.5 font-display font-bold">
        <FiLock className="h-4 w-4 text-primary-500" /> Internal Notes
      </h3>
      <p className="mb-3 text-xs text-gray-400">Visible to officials only.</p>
      <ul className="mb-3 max-h-60 space-y-2 overflow-y-auto">
        {(notes || []).length === 0 && <li className="text-xs text-gray-400">No notes yet.</li>}
        {(notes || []).map((n) => (
          <li key={n._id} className="rounded-lg bg-gray-50 p-2 text-sm dark:bg-gray-800/60">
            <p>{n.note}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {n.author ? `${n.author.firstName} ${n.author.lastName} · ` : ''}
              {format(new Date(n.createdAt), 'MMM d, h:mm a')}
            </p>
          </li>
        ))}
      </ul>
      <form onSubmit={add}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Add a note for the team..." className="input-field" />
        <button type="submit" disabled={busy || !text.trim()} className="btn-secondary mt-2 w-full">
          Add Note
        </button>
      </form>
    </div>
  );
};

const IncidentDetail = () => {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [assignee, setAssignee] = useState('');
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/incidents/${id}`).then(({ data }) => setIncident(data.data));
  }, [id]);

  useEffect(() => {
    load();
    api.get('/users?role=official&limit=100').then(({ data }) => setOfficials(data.data));
  }, [load]);

  useSocketEvent('incident:updated', (i) => i._id === id && load());

  if (!incident) return <PageLoader />;
  const [lng, lat] = incident.location.coordinates;

  const handleAssign = async () => {
    if (!assignee) return toast.error('Select a responder first');
    setBusy(true);
    try {
      await api.patch(`/incidents/${id}/assign`, { assignedTo: assignee });
      toast.success('Responder assigned');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return toast.error('Select a status first');
    setBusy(true);
    try {
      await api.patch(`/incidents/${id}/status`, statusForm);
      toast.success('Status updated');
      setStatusForm({ status: '', note: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link
        to="/official/incidents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition hover:gap-2 hover:underline dark:text-primary-400"
      >
        <FiArrowLeft /> Back to Incidents
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card animate-fadeIn p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{incident.referenceCode}</p>
              <h1 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50">{categoryLabel(incident.category)}</h1>
              <p className="text-xs text-gray-400">Reported {format(new Date(incident.createdAt), 'MMM d, yyyy h:mm a')}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiUser className="h-3.5 w-3.5" /> {incident.reportedBy?.firstName} {incident.reportedBy?.lastName}
                  {incident.reportedBy?.residentId && <span className="font-mono text-xs">({incident.reportedBy.residentId})</span>}
                </span>
                {incident.reportedBy?.phone && (
                  <span className="flex items-center gap-1"><FiPhone className="h-3.5 w-3.5" /> {incident.reportedBy.phone}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge status={incident.severity} />
              <Badge status={incident.status} />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-primary-50/60 p-4 dark:bg-primary-500/5">
            <TicketTracker status={incident.status} />
          </div>

          {incident.description && <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{incident.description}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <FiMapPin className="h-3.5 w-3.5" /> {incident.location?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="ml-2 font-semibold text-primary-600 hover:underline"
            >
              Directions
            </a>
          </p>
          <div className="mt-3">
            <StaticPinMap position={[lat, lng]} color={INCIDENT_PIN_COLORS[incident.status]} height="16rem" />
          </div>

          {incident.images?.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {incident.images.map((img) => (
                <img
                  key={img.publicId}
                  src={img.url}
                  alt="Evidence"
                  className="h-24 w-full rounded-xl border border-gray-100 object-cover dark:border-gray-800"
                />
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
              <FiClock className="h-4 w-4 text-primary-500" /> Status Timeline
            </h3>
            <div className="space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
              {incident.statusHistory?.map((h, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary-600 dark:border-gray-900" />
                  <Badge status={h.status} />
                  {h.note && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-gray-400">{format(new Date(h.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="animate-fadeIn space-y-6">
          {incident.assignedTo && (
            <div className="card p-4 text-sm">
              <p className="text-xs text-gray-400">Assigned responder</p>
              <p className="font-semibold">
                {incident.assignedTo.firstName} {incident.assignedTo.lastName}
                {incident.assignedTo.position ? ` · ${incident.assignedTo.position}` : ''}
              </p>
            </div>
          )}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
              <FiUserPlus className="h-4 w-4 text-primary-500" /> Assign Responder
            </h3>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input-field">
              <option value="">Select official</option>
              {officials.map((o) => (
                <option key={o._id} value={o._id}>{o.firstName} {o.lastName} {o.position ? `(${o.position})` : ''}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={busy} className="btn-primary mt-3 w-full">Assign</button>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
              <FiEdit3 className="h-4 w-4 text-primary-500" /> Update Status
            </h3>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
              className="input-field capitalize"
            >
              <option value="">Select status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <textarea
              placeholder="Note (optional)"
              value={statusForm.note}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
              className="input-field mt-3"
              rows={3}
            />
            <button onClick={handleStatusUpdate} disabled={busy} className="btn-primary mt-3 w-full">Update Status</button>
            <p className="mt-2 text-[11px] text-gray-400">The reporter receives an SMS and in-app notification on every status change.</p>
          </div>

          <InternalNotes incidentId={id} notes={incident.internalNotes} onAdded={load} />
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
