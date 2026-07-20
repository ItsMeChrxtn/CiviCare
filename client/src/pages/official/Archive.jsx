import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiRotateCcw, FiFilter } from 'react-icons/fi';
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
      <div className="page-header">
        <h1 className="page-title">Archive System</h1>
        <p className="page-subtitle">Browse and restore archived records across all modules.</p>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <FiFilter className="h-4 w-4 shrink-0 text-gray-400" />
        <select onChange={(e) => updateFilters({ module: e.target.value || undefined })} className="input-field w-48 capitalize">
          <option value="">All Modules</option>
          {MODULES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>
      </div>

      <div className="card animate-fadeIn p-5">
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
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:underline disabled:opacity-50 dark:text-primary-400"
                  >
                    <FiRotateCcw className="h-3.5 w-3.5" /> Restore
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
