import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiClock, FiRefreshCw, FiCheckCircle, FiEye, FiCheck, FiCamera, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { documentLabel } from '../../utils/constants';

const STATUS_FILTERS = ['pending', 'processing', 'ready_for_pickup', 'claimed', 'rejected'];

const Stat = ({ icon: Icon, value, label, color }) => (
  <div className="rounded-xl bg-white/70 p-5 dark:bg-gray-900/60">
    <Icon className={`h-6 w-6 ${color}`} />
    <p className="mt-3 font-display text-3xl font-bold">{value ?? '—'}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

/** Service Requests (docu Figure 18): triage, process, approve with QR, release. */
const Documents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/documents');
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const loadStats = useCallback(() => api.get('/documents/stats/overview').then(({ data }) => setStats(data.data)).catch(() => {}), []);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const countOf = (status) => stats?.byStatus?.find((s) => s._id === status)?.count ?? 0;

  const openDetail = async (row) => {
    setRejectionReason('');
    setSelected(row);
    const { data } = await api.get(`/documents/${row._id}`);
    setSelected(data.data);
  };

  const act = async (request, message) => {
    setBusy(true);
    try {
      const { data } = await request();
      toast.success(message);
      refetch();
      loadStats();
      if (selected) {
        const fresh = await api.get(`/documents/${data.data._id}`);
        setSelected(fresh.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const approve = (doc) => act(() => api.patch(`/documents/${doc._id}/review`, { decision: 'approved' }), 'Approved — PDF with QR code generated and resident notified');
  const reject = () => {
    if (!rejectionReason.trim()) return toast.error('Please give a reason for rejecting');
    return act(() => api.patch(`/documents/${selected._id}/review`, { decision: 'rejected', rejectionReason }), 'Request rejected and resident notified');
  };

  const d = selected?.details || {};

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="p-5">
          <h2 className="font-display text-2xl font-bold">Service Requests</h2>
          <p className="text-sm text-gray-500">
            {stats?.processedThisMonth ?? '—'} processed this month · {countOf('pending') + countOf('processing')} pending action
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 bg-primary-50/50 px-5 py-4 dark:bg-primary-500/5 sm:grid-cols-3">
          <Stat icon={FiClock} value={countOf('pending')} label="Pending" color="text-gray-500" />
          <Stat icon={FiRefreshCw} value={countOf('processing')} label="Processing" color="text-orange-500" />
          <Stat icon={FiCheckCircle} value={stats?.approvedToday} label="Approved Today" color="text-emerald-600" />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-y border-gray-100 px-5 py-3 dark:border-gray-800">
          <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-auto !py-1.5" aria-label="Status">
            <option value="">All statuses</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select onChange={(e) => updateFilters({ priority: e.target.value || undefined })} className="input-field w-auto !py-1.5" aria-label="Priority">
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
          <input type="search" placeholder="Search request ID or purpose" onChange={(e) => updateFilters({ search: e.target.value || undefined })} className="input-field w-auto !py-1.5" />
          <Link to="/verify" target="_blank" className="btn-secondary ml-auto !py-1.5">
            <FiCamera /> Scan &amp; verify QR
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton cols={7} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {['Request ID', 'Document Type', 'Applicant', 'Submitted', 'Priority', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      No service requests found.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
                    <td className="px-5 py-4 font-mono text-xs">{r.referenceCode}</td>
                    <td className="px-5 py-4 font-bold">{documentLabel(r.type)}</td>
                    <td className="px-5 py-4">
                      {[r.details?.firstName, r.details?.lastName].filter(Boolean).join(' ') || `${r.requestedBy?.firstName} ${r.requestedBy?.lastName}`}
                    </td>
                    <td className="px-5 py-4">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-4">
                      <Badge status={r.priority || 'normal'} />
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 text-gray-500">
                        <button onClick={() => openDetail(r)} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="View" aria-label="View">
                          <FiEye />
                        </button>
                        {['pending', 'processing'].includes(r.status) && (
                          <button onClick={() => approve(r)} disabled={busy} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" title="Approve" aria-label="Approve">
                            <FiCheck />
                          </button>
                        )}
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
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `${documentLabel(selected.type)} — ${selected.referenceCode}` : ''} size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={selected.status} />
              <select
                value={selected.priority || 'normal'}
                onChange={(e) => act(() => api.patch(`/documents/${selected._id}/priority`, { priority: e.target.value }), 'Priority updated')}
                className="input-field w-auto !py-1 text-xs"
                aria-label="Priority"
              >
                <option value="normal">Normal priority</option>
                <option value="urgent">Urgent</option>
              </select>
              {selected.requestedBy?.isRbiVerified ? (
                <span className="badge bg-emerald-100 text-emerald-700">RBI verified</span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700">Not yet in RBI — ask resident to visit for DCF & picture</span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              {[
                ['Name', [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ') || `${selected.requestedBy?.firstName} ${selected.requestedBy?.lastName}`],
                ['Resident ID', selected.requestedBy?.residentId],
                ['Age', d.age],
                ['Civil status', d.civilStatus],
                ['Address', d.address],
                ['Contact', selected.requestedBy?.phone || selected.requestedBy?.email],
                ['Purpose', selected.purpose],
              ].map(([k, v]) => (
                <div key={k} className={k === 'Address' || k === 'Purpose' ? 'col-span-2' : ''}>
                  <dt className="text-xs text-gray-400">{k}</dt>
                  <dd className="font-medium capitalize">{v || '—'}</dd>
                </div>
              ))}
            </dl>

            {['pending', 'processing'].includes(selected.status) && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'pending' && (
                    <button onClick={() => act(() => api.patch(`/documents/${selected._id}/process`), 'Marked as processing; resident notified')} disabled={busy} className="btn-secondary">
                      <FiRefreshCw /> Start Processing
                    </button>
                  )}
                  <button onClick={() => approve(selected)} disabled={busy} className="btn-primary">
                    <FiCheck /> Approve &amp; Generate QR Document
                  </button>
                </div>
                <div className="flex gap-2">
                  <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection" className="input-field" />
                  <button onClick={reject} disabled={busy} className="btn-danger shrink-0">
                    Reject
                  </button>
                </div>
              </div>
            )}

            {selected.status === 'rejected' && <p className="rounded-xl bg-red-50 p-3 text-red-700">Rejected: {selected.rejectionReason}</p>}

            {['ready_for_pickup', 'claimed'].includes(selected.status) && (
              <div className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:flex-row">
                {selected.qrDataUrl && <img src={selected.qrDataUrl} alt="Verification QR" className="h-32 w-32" />}
                <div className="flex-1 space-y-2">
                  <p>
                    Issued {selected.issuedAt && format(new Date(selected.issuedAt), 'MMM d, yyyy h:mm a')}
                    {selected.claimedAt && ` · Claimed ${format(new Date(selected.claimedAt), 'MMM d, yyyy')}`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.pdfFile?.url && (
                      <a href={selected.pdfFile.url} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5">
                        <FiDownload /> Printable PDF
                      </a>
                    )}
                    {selected.status === 'ready_for_pickup' && (
                      <button onClick={() => act(() => api.patch(`/documents/${selected._id}/claim`), 'Marked as claimed')} disabled={busy} className="btn-primary !py-1.5">
                        <FiCheckCircle /> Mark Released / Claimed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selected.scanLogs?.length > 0 && (
              <div>
                <p className="mb-1 font-semibold">QR scan log</p>
                <ul className="max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100 text-xs dark:divide-gray-800 dark:border-gray-800">
                  {[...selected.scanLogs].reverse().map((s) => (
                    <li key={s._id} className="flex justify-between px-3 py-1.5">
                      <span>{format(new Date(s.scannedAt), 'MMM d, yyyy h:mm:ss a')}</span>
                      <span className={s.result === 'valid' ? 'text-emerald-600' : 'font-semibold text-red-600'}>{s.result}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Documents;
