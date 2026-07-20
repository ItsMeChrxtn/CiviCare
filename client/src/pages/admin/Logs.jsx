import { format } from 'date-fns';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

const LEVEL_STATUS = { info: 'approved', warning: 'pending', error: 'rejected' };

const Logs = () => {
  const { rows, meta, params, setPage, updateFilters, isLoading } = usePaginatedFetch('/logs');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Audit / System Logs</h1>
        <input placeholder="Search action or module..." onChange={(e) => updateFilters({ search: e.target.value })} className="input-field w-64" />
      </div>

      <div className="card p-5">
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
