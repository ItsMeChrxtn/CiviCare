import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiToggleLeft, FiToggleRight, FiArchive, FiSearch } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';

const ROLES = ['resident', 'official', 'admin'];
const ROLE_BADGE_CLASSES = {
  resident: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  official: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  admin: 'bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400',
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/users');
  const [isOpen, setIsOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post('/users', values);
      toast.success('Account created successfully');
      reset();
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`/users/${user._id}/toggle-active`);
      toast.success(`${user.firstName} is now ${user.isActive ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/users/${confirming._id}/archive`);
      toast.success('User archived');
      setConfirming(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div>
      <div className="page-header mb-3">
        <h1 className="page-title">Manage Users</h1>
        <p className="page-subtitle">Create and manage resident, official, and admin accounts.</p>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search..." onChange={(e) => updateFilters({ search: e.target.value })} className="input-field pl-10" />
        </div>
        <select onChange={(e) => updateFilters({ role: e.target.value || undefined })} className="input-field w-40 capitalize">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <button onClick={() => setIsOpen(true)} className="btn-primary shrink-0"><FiPlus /> New Account</button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Name', accessor: (r) => <span className="font-medium">{r.firstName} {r.lastName}{r._id === currentUser?._id && <span className="ml-1 text-xs font-normal text-gray-400">(You)</span>}</span> },
            { header: 'Email', accessor: (r) => r.email },
            { header: 'Role', accessor: (r) => <span className={`badge capitalize ${ROLE_BADGE_CLASSES[r.role] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'}`}>{r.role}</span> },
            { header: 'Verified', accessor: (r) => <Badge status={r.isVerified ? 'approved' : 'pending'}>{r.isVerified ? 'Verified' : 'Unverified'}</Badge> },
            {
              header: 'Active',
              accessor: (r) =>
                r._id === currentUser?._id ? (
                  <FiToggleRight className="h-6 w-6 text-gray-300" title="You cannot deactivate your own account" />
                ) : (
                  <button onClick={() => toggleActive(r)} className="text-primary-600">
                    {r.isActive ? <FiToggleRight className="h-6 w-6" /> : <FiToggleLeft className="h-6 w-6 text-gray-400" />}
                  </button>
                ),
            },
            {
              header: 'Actions',
              accessor: (r) =>
                r._id !== currentUser?._id && (
                  <button onClick={() => setConfirming(r)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                    <FiArchive /> Archive
                  </button>
                ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Official / Admin Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name</label>
              <input {...register('firstName', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name</label>
              <input {...register('lastName', { required: true })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" {...register('email', { required: true })} className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-red-500">Email is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Temporary Password</label>
            <input type="password" {...register('password', { required: true, minLength: 8 })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select {...register('role', { required: true })} className="input-field capitalize">
                <option value="official">Official</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Position (optional)</label>
              <input placeholder="e.g. Barangay Secretary" {...register('position')} className="input-field" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive User"
        message={`Are you sure you want to archive ${confirming?.firstName}'s account?`}
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Users;
