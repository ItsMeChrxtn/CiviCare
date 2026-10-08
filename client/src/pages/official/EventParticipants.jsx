import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiUsers, FiUserCheck } from 'react-icons/fi';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

const EventParticipants = () => {
  const { id } = useParams();
  const [participants, setParticipants] = useState(null);
  const [residentId, setResidentId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/events/${id}/participants`).then(({ data }) => setParticipants(data.data));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const checkIn = async (body) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/events/${id}/checkin`, body);
      toast.success(data.message);
      setResidentId('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  const present = participants?.filter((p) => p.attendance.isPresent).length ?? 0;

  return (
    <div>
      <Link to="/official/events" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 transition hover:underline dark:text-primary-400">
        <FiArrowLeft /> Back to Events
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FiUsers className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Event Participants
          </h1>
          <p className="page-subtitle">
            {participants ? `${present} of ${participants.length} registered residents checked in.` : 'Registered residents and their attendance.'}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (residentId.trim()) checkIn({ residentId });
          }}
          className="flex gap-2"
        >
          <input
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            placeholder="Resident ID, e.g. MG-2026-0142"
            className="input-field w-64"
            aria-label="Resident ID"
          />
          <button type="submit" disabled={busy || !residentId.trim()} className="btn-primary shrink-0">
            <FiUserCheck /> Check in
          </button>
        </form>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={participants === null}
          rows={participants || []}
          emptyMessage="No one has registered for this event yet."
          columns={[
            { header: 'Name', accessor: (p) => <span className="font-medium text-gray-800 dark:text-gray-100">{p.resident?.firstName} {p.resident?.lastName}</span> },
            { header: 'Resident ID', accessor: (p) => <span className="font-mono text-xs">{p.resident?.residentId || '—'}</span> },
            { header: 'Contact', accessor: (p) => p.resident?.phone || p.resident?.email },
            {
              header: 'Attendance',
              accessor: (p) =>
                p.attendance.isPresent ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><FiCheckCircle /> Present</span>
                ) : (
                  <button
                    onClick={() => checkIn({ userId: p.resident?._id })}
                    disabled={busy || !p.resident}
                    className="rounded-lg border border-primary-200 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300"
                  >
                    Mark present
                  </button>
                ),
            },
            {
              header: 'Certificate',
              accessor: (p) => (p.certificateIssued ? <Badge status="approved">Issued</Badge> : <span className="text-gray-400 dark:text-gray-600">-</span>),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default EventParticipants;
