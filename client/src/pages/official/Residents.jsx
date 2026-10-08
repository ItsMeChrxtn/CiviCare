import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { FiSearch, FiEye, FiTrash2, FiDownload, FiUserCheck, FiSlash, FiCheckCircle } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { downloadFile } from '../../utils/download';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';

const INACTIVE_AFTER_DAYS = 90;

// Suspended = deactivated by an admin; Inactive = no login for 90 days; otherwise Active.
const accountStatus = (u) => {
  if (!u.isActive) return 'suspended';
  if (!u.lastLoginAt || differenceInDays(new Date(), new Date(u.lastLoginAt)) > INACTIVE_AFTER_DAYS) return 'inactive';
  return 'active';
};

const FILTERS = {
  all: {},
  active: { isActive: 'true' },
  suspended: { isActive: 'false' },
  unverified: { isRbiVerified: 'false' },
  verified: { isRbiVerified: 'true' },
};

const initials = (u) => `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase();

/** Resident Management (docu Figure 16). */
const Residents = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/users', { role: 'resident' });
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const applyFilter = (key) => {
    setFilter(key);
    updateFilters({ isActive: undefined, isRbiVerified: undefined, ...FILTERS[key] });
  };

  const run = async (request, success) => {
    try {
      const { data } = await request();
      toast.success(success);
      refetch();
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
      return null;
    }
  };

  const toggleVerify = async (r) => {
    const updated = await run(() => api.patch(`/users/${r._id}/verify`, { verified: !r.isRbiVerified }), r.isRbiVerified ? 'Verification removed' : 'Resident verified against RBI');
    if (updated && viewing?._id === r._id) setViewing(updated);
  };

  const toggleSuspend = async (r) => {
    const updated = await run(() => api.patch(`/users/${r._id}/toggle-active`), r.isActive ? 'Account suspended' : 'Account reactivated');
    if (updated && viewing?._id === r._id) setViewing(updated);
  };

  const handleArchive = async () => {
    await run(() => api.patch(`/users/${confirming._id}/archive`), 'Resident archived');
    setConfirming(null);
  };

  const exportCsv = () =>
    downloadFile('/reports/export/csv', { module: 'residents' }, `residents-${format(new Date(), 'yyyy-MM-dd')}.csv`).catch(() =>
      toast.error('Export failed')
    );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-2xl font-bold">Resident Management</h2>
          <p className="text-sm text-gray-500">{meta.total ?? '—'} registered residents</p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => applyFilter(e.target.value)} className="input-field w-auto !py-2" aria-label="Filter by status">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="verified">RBI verified</option>
            <option value="unverified">Not yet verified</option>
          </select>
          <button onClick={() => applyFilter('unverified')} className="btn-primary !py-2">
            <FiUserCheck /> Verify User
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-gray-100 px-5 py-3 dark:border-gray-800">
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search residents by name, ID or purok..."
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
            className="input-field pl-10"
            aria-label="Search residents"
          />
        </div>
        <button onClick={exportCsv} className="btn-secondary !py-2">
          <FiDownload /> Export
        </button>
      </div>

      {isLoading ? (
        <div className="p-5">
          <TableSkeleton cols={6} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/60">
              <tr>
                {['Resident', 'ID', 'Purok', 'Role', 'RBI', 'Status', 'Registered', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No residents found.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">{initials(r)}</span>
                      <span>
                        <span className="block font-semibold">
                          {r.firstName} {r.lastName}
                        </span>
                        <span className="block text-xs text-gray-400">{r.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.residentId || '—'}</td>
                  <td className="px-4 py-3">{r.address?.purok || '—'}</td>
                  <td className="px-4 py-3 capitalize">{r.role}</td>
                  <td className="px-4 py-3">
                    {r.isRbiVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <FiCheckCircle /> Verified
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={accountStatus(r)} />
                  </td>
                  <td className="px-4 py-3 text-xs">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-500">
                      <button onClick={() => setViewing(r)} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="View" aria-label="View">
                        <FiEye />
                      </button>
                      <button
                        onClick={() => toggleVerify(r)}
                        className={`rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${r.isRbiVerified ? 'text-emerald-600' : ''}`}
                        title={r.isRbiVerified ? 'Remove RBI verification' : 'Mark as verified in RBI'}
                        aria-label="Toggle verification"
                      >
                        <FiUserCheck />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => toggleSuspend(r)}
                          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={r.isActive ? 'Suspend account' : 'Reactivate account'}
                          aria-label="Toggle suspension"
                        >
                          <FiSlash />
                        </button>
                      )}
                      <button onClick={() => setConfirming(r)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" title="Archive" aria-label="Archive">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-5 pb-4">
        <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Resident Details" size="lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              {viewing.avatar?.url ? (
                <img src={viewing.avatar.url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">{initials(viewing)}</span>
              )}
              <div>
                <p className="font-display text-lg font-bold">{viewing.fullName || `${viewing.firstName} ${viewing.lastName}`}</p>
                <p className="font-mono text-xs text-gray-500">{viewing.residentId}</p>
                <div className="mt-1 flex gap-2">
                  <Badge status={accountStatus(viewing)} />
                  <Badge status={viewing.isRbiVerified ? 'approved' : 'pending'}>{viewing.isRbiVerified ? 'RBI verified' : 'Not yet verified'}</Badge>
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Email', viewing.email],
                ['Phone', viewing.phone],
                ['Purok', viewing.address?.purok],
                ['Address', [viewing.address?.street, viewing.address?.barangay, viewing.address?.city].filter(Boolean).join(', ')],
                ['Birthdate', viewing.birthdate && format(new Date(viewing.birthdate), 'MMM d, yyyy')],
                ['Civil status', viewing.civilStatus],
                ['Registered', format(new Date(viewing.createdAt), 'MMM d, yyyy')],
                ['Last login', viewing.lastLoginAt ? format(new Date(viewing.lastLoginAt), 'MMM d, yyyy h:mm a') : 'Never'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-gray-400">{k}</dt>
                  <dd className="font-medium">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {viewing.validIdImage?.url && (
              <div>
                <p className="mb-1 text-xs text-gray-400">Uploaded valid ID</p>
                <a href={viewing.validIdImage.url} target="_blank" rel="noreferrer">
                  <img src={viewing.validIdImage.url} alt="Valid ID" className="max-h-48 rounded-lg border border-gray-200" />
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button onClick={() => toggleVerify(viewing)} className="btn-primary">
                <FiUserCheck /> {viewing.isRbiVerified ? 'Remove verification' : 'Verify in RBI'}
              </button>
              {isAdmin && (
                <button onClick={() => toggleSuspend(viewing)} className={viewing.isActive ? 'btn-danger' : 'btn-secondary'}>
                  <FiSlash /> {viewing.isActive ? 'Suspend' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive Resident"
        message={`Archive ${confirming?.firstName} ${confirming?.lastName}'s account? They will no longer be able to log in. It can be restored from Archive.`}
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Residents;
