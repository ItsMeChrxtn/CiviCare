import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCamera, FiCheckCircle } from 'react-icons/fi';
import api from '../../utils/api';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import QRScanner from '../../components/qr/QRScanner';
import { CardSkeleton } from '../../components/common/Skeleton';

const EventParticipants = () => {
  const { id } = useParams();
  const [participants, setParticipants] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = useCallback(() => {
    api.get(`/events/${id}/participants`).then(({ data }) => setParticipants(data.data));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleScan = async (qrCode) => {
    try {
      const { data } = await api.post(`/events/${id}/checkin`, { qrCode });
      toast.success(data.message);
      load();
      setScannerOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <div>
      <Link to="/official/events" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <FiArrowLeft /> Back to Events
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Participants</h1>
        <button onClick={() => setScannerOpen(true)} className="btn-primary"><FiCamera /> Scan QR for Attendance</button>
      </div>

      {participants === null ? (
        <CardSkeleton />
      ) : !participants.length ? (
        <EmptyState title="No registrations yet" />
      ) : (
        <div className="card overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Attendance</th>
                <th className="px-3 py-3">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {participants.map((p) => (
                <tr key={p._id}>
                  <td className="px-3 py-3">{p.resident?.firstName} {p.resident?.lastName}</td>
                  <td className="px-3 py-3">{p.resident?.phone || p.resident?.email}</td>
                  <td className="px-3 py-3">
                    {p.attendance.isPresent ? (
                      <span className="flex items-center gap-1 text-emerald-600"><FiCheckCircle /> Present</span>
                    ) : (
                      <span className="text-gray-400">Not checked in</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{p.certificateIssued ? 'Issued' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Resident QR Code">
        <QRScanner onScan={handleScan} />
      </Modal>
    </div>
  );
};

export default EventParticipants;
