import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { INCIDENT_CATEGORY } from '../../utils/constants';

const STATUS_OPTIONS = ['pending', 'assigned', 'ongoing', 'resolved'];

const Incidents = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading } = usePaginatedFetch('/incidents');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Incident Management</h1>
        <div className="flex flex-wrap gap-2">
          <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field w-40 capitalize">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select onChange={(e) => updateFilters({ category: e.target.value || undefined })} className="input-field w-40 capitalize">
            <option value="">All Categories</option>
            {INCIDENT_CATEGORY.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Reference', accessor: (r) => <Link to={`/official/incidents/${r._id}`} className="font-medium text-primary-600 hover:underline">{r.referenceCode}</Link> },
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
