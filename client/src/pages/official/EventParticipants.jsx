import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCamera, FiCheckCircle, FiUsers } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import QRScanner from '../../components/qr/QRScanner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

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
      <Link to="/official/events" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 transition hover:underline dark:text-primary-400">
        <FiArrowLeft /> Back to Events
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FiUsers className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Event Participants
          </h1>
          <p className="page-subtitle">Registered residents and their attendance for this event.</p>
        </div>
        <button onClick={() => setScannerOpen(true)} className="btn-primary"><FiCamera /> Scan QR for Attendance</button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={participants === null}
          rows={participants || []}
          emptyMessage="No one has registered for this event yet."
          columns={[
            { header: 'Name', accessor: (p) => <span className="font-medium text-gray-800 dark:text-gray-100">{p.resident?.firstName} {p.resident?.lastName}</span> },
            { header: 'Contact', accessor: (p) => p.resident?.phone || p.resident?.email },
            {
              header: 'Attendance',
              accessor: (p) =>
                p.attendance.isPresent ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><FiCheckCircle /> Present</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-600">Not checked in</span>
                ),
            },
            {
              header: 'Certificate',
              accessor: (p) => (p.certificateIssued ? <Badge status="approved">Issued</Badge> : <span className="text-gray-400 dark:text-gray-600">-</span>),
            },
          ]}
        />
      </div>

      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Resident QR Code">
        <QRScanner onScan={handleScan} />
      </Modal>
    </div>
  );
};

export default EventParticipants;
