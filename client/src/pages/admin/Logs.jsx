import { format } from 'date-fns';
import { FiSearch } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

const LEVEL_STATUS = { info: 'approved', warning: 'pending', error: 'rejected' };

const Logs = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading } = usePaginatedFetch('/logs');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit / System Logs</h1>
        <p className="page-subtitle">Track system and user activity across the platform.</p>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search action or module..." onChange={(e) => updateFilters({ search: e.target.value })} className="input-field pl-10" />
        </div>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Action', accessor: (r) => r.action },
            { header: 'Module', accessor: (r) => <span className="capitalize">{r.module}</span> },
            { header: 'Actor', accessor: (r) => (r.actor ? `${r.actor.firstName} ${r.actor.lastName} (${r.actorRole})` : 'System') },
            { header: 'Description', accessor: (r) => <span className="line-clamp-1 max-w-xs">{r.description}</span> },
            { header: 'Level', accessor: (r) => <Badge status={LEVEL_STATUS[r.level]}>{r.level}</Badge> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy h:mm a') },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
};

export default Logs;
