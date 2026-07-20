import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiArchive } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Residents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/users', { role: 'resident' });
  const [confirming, setConfirming] = useState(null);

  const handleArchive = async () => {
    try {
      await api.patch(`/users/${confirming._id}/archive`);
      toast.success('Resident archived');
      setConfirming(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Residents</h1>
        <p className="page-subtitle">Manage registered resident accounts.</p>
      </div>

      <div className="card mb-4 p-4">
        <div className="relative max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search residents..."
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Name', accessor: (r) => <span className="font-medium text-gray-800 dark:text-gray-100">{r.firstName} {r.lastName}</span> },
            { header: 'Email', accessor: (r) => r.email },
            { header: 'Phone', accessor: (r) => r.phone || '-' },
            { header: 'Verified', accessor: (r) => <Badge status={r.isVerified ? 'approved' : 'pending'}>{r.isVerified ? 'Verified' : 'Unverified'}</Badge> },
            { header: 'Status', accessor: (r) => <Badge status={r.isActive ? 'resolved' : 'rejected'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
            {
              header: 'Actions',
              accessor: (r) => (
                <button
                  onClick={() => setConfirming(r)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <FiArchive className="h-3.5 w-3.5" /> Archive
                </button>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive Resident"
        message={`Are you sure you want to archive ${confirming?.firstName}'s account?`}
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Residents;
