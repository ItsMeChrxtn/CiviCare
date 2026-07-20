import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DOCUMENT_TYPES } from '../../utils/constants';
import { FiFilter, FiEye, FiCheckCircle } from 'react-icons/fi';

const Documents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/documents');
  const [modalItem, setModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      await api.patch(`/documents/${modalItem._id}/review`, { decision: 'approved' });
      toast.success('Document approved and generated');
      setModalItem(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectionReason) return toast.error('Please provide a rejection reason');
    setBusy(true);
    try {
      await api.patch(`/documents/${modalItem._id}/review`, { decision: 'rejected', rejectionReason });
      toast.success('Document request rejected');
      setModalItem(null);
      setRejectionReason('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setBusy(false);
    }
  };

  const markClaimed = async (id) => {
    try {
      await api.patch(`/documents/${id}/claim`);
      toast.success('Marked as claimed');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Document Requests</h1>
        <p className="page-subtitle">Review, approve, and track resident document requests.</p>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <FiFilter className="h-4 w-4 shrink-0 text-gray-400" />
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-48 capitalize">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'rejected', 'ready_for_pickup', 'claimed'].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No document requests found."
          columns={[
            { header: 'Reference', accessor: (r) => <span className="font-medium text-gray-800 dark:text-gray-100">{r.referenceCode}</span> },
            { header: 'Resident', accessor: (r) => `${r.requestedBy?.firstName} ${r.requestedBy?.lastName}` },
            { header: 'Type', accessor: (r) => DOCUMENT_TYPES.find((d) => d.value === r.type)?.label || r.type },
            { header: 'Purpose', accessor: (r) => r.purpose },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex gap-3">
                  {r.status === 'pending' && (
                    <button onClick={() => setModalItem(r)} className="flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:underline dark:text-primary-400">
                      <FiEye className="h-3.5 w-3.5" /> Review
                    </button>
                  )}
                  {r.status === 'ready_for_pickup' && (
                    <button onClick={() => markClaimed(r._id)} className="flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:underline dark:text-emerald-400">
                      <FiCheckCircle className="h-3.5 w-3.5" /> Mark Claimed
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title="Review Document Request">
        {modalItem && (
          <div className="space-y-4">
            <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-gray-50">{modalItem.requestedBy?.firstName} {modalItem.requestedBy?.lastName}</span> requests a{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-50">{DOCUMENT_TYPES.find((d) => d.value === modalItem.type)?.label}</span> for: {modalItem.purpose}
            </p>
            <textarea
              placeholder="Rejection reason (required only if rejecting)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={reject} disabled={busy} className="btn-secondary !border-red-200 !text-red-600 flex-1 dark:!border-red-500/30 dark:!text-red-400">Reject</button>
              <button onClick={approve} disabled={busy} className="btn-primary flex-1">Approve & Generate</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Documents;
