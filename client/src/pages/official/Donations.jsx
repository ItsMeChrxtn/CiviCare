import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DONATION_STATUS } from '../../utils/constants';
import { FiFilter, FiEdit2 } from 'react-icons/fi';

const STATUS_FLOW = [DONATION_STATUS.PLEDGED, DONATION_STATUS.RECEIVED, DONATION_STATUS.DISTRIBUTED];

const Donations = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/donations');
  const [modalItem, setModalItem] = useState(null);
  const [note, setNote] = useState('');

  const updateStatus = async (status) => {
    try {
      await api.patch(`/donations/${modalItem._id}/status`, { status, acknowledgementNote: note });
      toast.success('Donation status updated');
      setModalItem(null);
      setNote('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Donation Management</h1>
        <p className="page-subtitle">Track pledges and update donation status through their lifecycle.</p>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <FiFilter className="h-4 w-4 shrink-0 text-gray-400" />
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-44 capitalize">
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No donations recorded yet."
          columns={[
            { header: 'Reference', accessor: (r) => <span className="font-medium text-gray-800 dark:text-gray-100">{r.referenceCode}</span> },
            { header: 'Donor', accessor: (r) => `${r.donor?.firstName} ${r.donor?.lastName}` },
            { header: 'Type', accessor: (r) => <span className="capitalize">{r.type}</span> },
            { header: 'Details', accessor: (r) => (r.type === 'cash' ? `₱${r.amount}` : r.quantity || '-') },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <button onClick={() => setModalItem(r)} className="flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:underline dark:text-primary-400">
                  <FiEdit2 className="h-3.5 w-3.5" /> Update
                </button>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title="Update Donation Status">
        {modalItem && (
          <div className="space-y-4">
            <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-gray-50">{modalItem.referenceCode}</span> - {modalItem.type} donation from{' '}
              {modalItem.donor?.firstName} {modalItem.donor?.lastName}
            </p>
            <textarea
              placeholder="Acknowledgement note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((s) => (
                <button key={s} onClick={() => updateStatus(s)} className="btn-secondary text-sm capitalize">
                  Mark as {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Donations;
