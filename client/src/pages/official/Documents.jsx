import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DOCUMENT_TYPES } from '../../utils/constants';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Document Requests</h1>
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-48 capitalize">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'rejected', 'ready_for_pickup', 'claimed'].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
          ))}
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
                    <button onClick={() => setModalItem(r)} className="text-sm font-medium text-primary-600 hover:underline">Review</button>
                  )}
                  {r.status === 'ready_for_pickup' && (
                    <button onClick={() => markClaimed(r._id)} className="text-sm font-medium text-emerald-600 hover:underline">Mark Claimed</button>
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
            <p className="text-sm">
              <span className="font-semibold">{modalItem.requestedBy?.firstName} {modalItem.requestedBy?.lastName}</span> requests a{' '}
              <span className="font-semibold">{DOCUMENT_TYPES.find((d) => d.value === modalItem.type)?.label}</span> for: {modalItem.purpose}
            </p>
            <textarea
              placeholder="Rejection reason (required only if rejecting)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={reject} disabled={busy} className="btn-secondary !border-red-200 !text-red-600 flex-1">Reject</button>
              <button onClick={approve} disabled={busy} className="btn-primary flex-1">Approve & Generate</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Documents;
