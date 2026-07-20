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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Residents</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search residents..."
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="input-field w-64 pl-10"
          />
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Name', accessor: (r) => `${r.firstName} ${r.lastName}` },
            { header: 'Email', accessor: (r) => r.email },
            { header: 'Phone', accessor: (r) => r.phone || '-' },
            { header: 'Verified', accessor: (r) => <Badge status={r.isVerified ? 'approved' : 'pending'}>{r.isVerified ? 'Verified' : 'Unverified'}</Badge> },
            { header: 'Status', accessor: (r) => <Badge status={r.isActive ? 'resolved' : 'rejected'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
            {
              header: 'Actions',
              accessor: (r) => (
                <button onClick={() => setConfirming(r)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                  <FiArchive /> Archive
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
