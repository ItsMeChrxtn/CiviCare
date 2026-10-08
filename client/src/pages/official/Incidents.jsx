import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiCheckCircle, FiMap, FiList, FiSearch } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useSocketEvent from '../../hooks/useSocketEvent';
import api from '../../utils/api';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import IncidentMap from '../../components/map/IncidentMap';
import { TableSkeleton } from '../../components/common/Skeleton';
import { INCIDENT_CATEGORY, categoryLabel } from '../../utils/constants';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'resolved', label: 'Resolved' },
];

/** Incident Management (docu Figure 17). */
const Incidents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/incidents');
  const [tab, setTab] = useState('');
  const [view, setView] = useState('list');
  const [overview, setOverview] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState('');

  const loadOverview = () => api.get('/reports/overview').then(({ data }) => setOverview(data.data)).catch(() => {});
  useEffect(() => {
    loadOverview();
  }, []);

  const refresh = () => {
    refetch();
    loadOverview();
  };
  useSocketEvent('incident:new', (i) => {
    toast(`New report: ${categoryLabel(i.category)} (${i.referenceCode})`, { icon: '🚨' });
    refresh();
  });
  useSocketEvent('incident:updated', refresh);

  const selectTab = (key) => {
    setTab(key);
    updateFilters({ status: key || undefined });
  };

  const resolve = async () => {
    try {
      await api.patch(`/incidents/${resolving._id}/status`, { status: 'resolved', note: note || 'Resolved by barangay responders.' });
      toast.success(`${resolving.referenceCode} marked as resolved`);
      setResolving(null);
      setNote('');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve');
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-2xl font-bold">Incident Management</h2>
          <p className="text-sm text-gray-500">
            {overview?.activeIncidents ?? '—'} active incidents · {overview?.incidentsThisMonth ?? '—'} this month
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700" role="group" aria-label="View">
          {[
            ['list', FiList, 'List'],
            ['map', FiMap, 'Map'],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${view === key ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <div className="px-5 pb-5">
          <IncidentMap height="32rem" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-y border-gray-100 px-5 py-3 dark:border-gray-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => selectTab(t.key)}
                aria-pressed={tab === t.key}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  tab === t.key ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
            <select onChange={(e) => updateFilters({ category: e.target.value || undefined })} className="input-field ml-auto w-auto !py-1.5" aria-label="Type">
              <option value="">All types</option>
              {INCIDENT_CATEGORY.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" placeholder="Search ID or location" onChange={(e) => updateFilters({ search: e.target.value || undefined })} className="input-field !py-1.5 pl-9" />
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <TableSkeleton cols={6} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    {['Incident ID', 'Type', 'Location', 'Reported by', 'Priority', 'Status', 'Actions'].map((h) => (
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
                        No incidents found.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r._id} className="hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
                      <td className="px-5 py-4 font-mono text-xs">{r.referenceCode}</td>
                      <td className="px-5 py-4 font-bold">{categoryLabel(r.category)}</td>
                      <td className="max-w-[12rem] px-5 py-4 text-gray-600 dark:text-gray-300">
                        {r.location?.address || `${r.location.coordinates[1].toFixed(4)}, ${r.location.coordinates[0].toFixed(4)}`}
                      </td>
                      <td className="px-5 py-4">
                        {r.reportedBy?.firstName} {r.reportedBy?.lastName}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={r.severity} />
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={r.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1 text-gray-500">
                          <Link to={`/official/incidents/${r._id}`} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" title="View" aria-label="View">
                            <FiEye />
                          </Link>
                          {r.status !== 'resolved' && (
                            <button onClick={() => setResolving(r)} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" title="Mark resolved" aria-label="Mark resolved">
                              <FiCheckCircle />
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
        </>
      )}

      <ConfirmDialog
        isOpen={!!resolving}
        onClose={() => setResolving(null)}
        onConfirm={resolve}
        title={`Resolve ${resolving?.referenceCode || ''}`}
        confirmLabel="Mark Resolved"
        message={
          <span className="block">
            The reporter will be notified by SMS and in-app.
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Resolution note (optional)"
              rows={3}
              className="input-field mt-3"
            />
          </span>
        }
      />
    </div>
  );
};

export default Incidents;
