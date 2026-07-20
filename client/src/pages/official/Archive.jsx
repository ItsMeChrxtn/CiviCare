import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiRotateCcw } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

const MODULES = ['user', 'incident', 'announcement', 'event', 'donation', 'document', 'hazard', 'feedback'];

const RESTORE_ENDPOINT = {
  user: (id) => `/users/${id}/restore`,
  incident: (id) => `/incidents/${id}/restore`,
  announcement: (id) => `/announcements/${id}/restore`,
  event: (id) => `/events/${id}/restore`,
  donation: (id) => `/donations/${id}/restore`,
  document: (id) => `/documents/${id}/restore`,
  hazard: (id) => `/hazards/${id}/restore`,
  feedback: (id) => `/feedback/${id}/restore`,
};

const Archive = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/logs/archives');
  const [busyId, setBusyId] = useState(null);

  const handleRestore = async (archiveEntry) => {
    const buildUrl = RESTORE_ENDPOINT[archiveEntry.module];
    if (!buildUrl) return toast.error('Restore not supported for this module');

    setBusyId(archiveEntry._id);
    try {
      await api.patch(buildUrl(archiveEntry.documentId));
      toast.success('Record restored successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Archive System</h1>
        <select onChange={(e) => updateFilters({ module: e.target.value || undefined })} className="input-field w-48 capitalize">
          <option value="">All Modules</option>
          {MODULES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No archive activity yet."
          columns={[
            { header: 'Module', accessor: (r) => <span className="capitalize">{r.module}</span> },
            { header: 'Action', accessor: (r) => <Badge status={r.action === 'archived' ? 'rejected' : 'resolved'}>{r.action}</Badge> },
            { header: 'Snapshot', accessor: (r) => r.snapshot?.title || r.snapshot?.name || r.snapshot?.referenceCode || r.snapshot?.email || '-' },
            { header: 'Performed By', accessor: (r) => `${r.performedBy?.firstName || ''} ${r.performedBy?.lastName || ''}` },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy h:mm a') },
            {
              header: 'Actions',
              accessor: (r) =>
                r.action === 'archived' && (
                  <button
                    onClick={() => handleRestore(r)}
                    disabled={busyId === r._id}
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                  >
                    <FiRotateCcw /> Restore
                  </button>
                ),
            },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
};

export default Archive;
