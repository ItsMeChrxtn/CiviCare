import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DONATION_STATUS } from '../../utils/constants';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Donation Management</h1>
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-44 capitalize">
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Reference', accessor: (r) => r.referenceCode },
            { header: 'Donor', accessor: (r) => `${r.donor?.firstName} ${r.donor?.lastName}` },
            { header: 'Type', accessor: (r) => <span className="capitalize">{r.type}</span> },
            { header: 'Details', accessor: (r) => (r.type === 'cash' ? `₱${r.amount}` : r.quantity || '-') },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <button onClick={() => setModalItem(r)} className="text-sm font-medium text-primary-600 hover:underline">
                  Update
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {modalItem.referenceCode} - {modalItem.type} donation from {modalItem.donor?.firstName} {modalItem.donor?.lastName}
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
