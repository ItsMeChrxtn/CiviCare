import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiFilter } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { INCIDENT_CATEGORY } from '../../utils/constants';

const STATUS_OPTIONS = ['pending', 'assigned', 'ongoing', 'resolved'];

const Incidents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading } = usePaginatedFetch('/incidents');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incident Management</h1>
        <p className="page-subtitle">Track, filter, and respond to reported incidents.</p>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
          <FiFilter className="h-4 w-4" /> Filters
        </span>
        <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-40 capitalize">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select onChange={(e) => updateFilters({ category: e.target.value || undefined })} className="input-field w-40 capitalize">
          <option value="">All Categories</option>
          {INCIDENT_CATEGORY.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Reference', accessor: (r) => <Link to={`/official/incidents/${r._id}`} className="font-medium text-primary-600 hover:underline dark:text-primary-400">{r.referenceCode}</Link> },
            { header: 'Title', accessor: (r) => r.title },
            { header: 'Reported By', accessor: (r) => `${r.reportedBy?.firstName} ${r.reportedBy?.lastName}` },
            { header: 'Category', accessor: (r) => <span className="capitalize">{r.category}</span> },
            { header: 'Severity', accessor: (r) => <Badge status={r.severity} /> },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
};

export default Incidents;
