import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiFilter, FiEye, FiSearch, FiDownload } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { downloadFile } from '../../utils/download';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DONATION_STATUS, DONATION_TYPES, DONATION_TYPE_LABELS, donationDetails } from '../../utils/constants';

const STATUS_FLOW = [DONATION_STATUS.PLEDGED, DONATION_STATUS.RECEIVED, DONATION_STATUS.DISTRIBUTED];

const donorName = (d) => (d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : 'Unknown donor');

/** Donation Management: who donated, what was donated, and where it is in Pledged -> Received -> Distributed. */
const Donations = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/donations', { sort: '-createdAt' });
  const [viewing, setViewing] = useState(null);
  const [note, setNote] = useState('');

  const updateStatus = async (status) => {
    try {
      const { data } = await api.patch(`/donations/${viewing._id}/status`, { status, acknowledgementNote: note });
      toast.success(`Marked as ${status}`);
      setViewing({ ...viewing, ...data.data, donor: viewing.donor });
      setNote('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const exportCsv = () =>
    downloadFile('/reports/export/csv', { module: 'donations' }, `donations-${format(new Date(), 'yyyy-MM-dd')}.csv`).catch(() =>
      toast.error('Export failed')
    );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Donations</h1>
        <p className="page-subtitle">See who donated, what they donated, and track each pledge until it is distributed.</p>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search reference, item or beneficiary..."
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
            className="input-field pl-10"
          />
        </div>
        <FiFilter className="h-4 w-4 shrink-0 text-gray-400" />
        <select onChange={(e) => updateFilters({ type: e.target.value || undefined })} className="input-field w-40" aria-label="Filter by type">
          <option value="">All Types</option>
          {DONATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {DONATION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-44 capitalize" aria-label="Filter by status">
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <button onClick={exportCsv} className="btn-secondary shrink-0">
          <FiDownload /> Export CSV
        </button>
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
            {
              header: 'Donor',
              accessor: (r) => (
                <span>
                  <span className="font-medium">{donorName(r)}</span>
                  {r.donor?.residentId && <span className="block text-xs text-gray-400">{r.donor.residentId}</span>}
                </span>
              ),
            },
            { header: 'Donated', accessor: (r) => donationDetails(r) },
            { header: 'Beneficiary', accessor: (r) => r.beneficiary || '—' },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <button onClick={() => setViewing(r)} className="flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:underline dark:text-primary-400">
                  <FiEye className="h-3.5 w-3.5" /> View
                </button>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing ? `Donation ${viewing.referenceCode}` : ''}>
        {viewing && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-400">Donor</dt>
                <dd className="font-medium">{donorName(viewing)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Resident ID</dt>
                <dd className="font-medium">{viewing.donor?.residentId || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Contact</dt>
                <dd className="font-medium">{[viewing.donor?.phone, viewing.donor?.email].filter(Boolean).join(' · ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Purok</dt>
                <dd className="font-medium">{viewing.donor?.address?.purok || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Donated</dt>
                <dd className="font-medium">{donationDetails(viewing)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Intended beneficiary</dt>
                <dd className="font-medium">{viewing.beneficiary || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Pledged on</dt>
                <dd className="font-medium">{format(new Date(viewing.createdAt), 'MMM d, yyyy h:mm a')}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Status</dt>
                <dd>
                  <Badge status={viewing.status} />
                </dd>
              </div>
            </dl>
            {viewing.description && (
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="whitespace-pre-line">{viewing.description}</p>
              </div>
            )}
            {viewing.proofImage?.url && (
              <a href={viewing.proofImage.url} target="_blank" rel="noreferrer">
                <img src={viewing.proofImage.url} alt="Donation proof" className="max-h-64 w-full rounded-xl object-cover" />
              </a>
            )}
            {viewing.acknowledgementNote && (
              <p className="rounded-xl bg-gray-50 p-3 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
                <span className="font-semibold">Note:</span> {viewing.acknowledgementNote}
              </p>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <textarea
                placeholder="Acknowledgement note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-field"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.filter((s) => s !== viewing.status).map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} className="btn-secondary text-sm capitalize">
                    Mark as {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Donations;
