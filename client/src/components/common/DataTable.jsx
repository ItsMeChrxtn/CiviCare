import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

/**
 * Generic list table shared across every admin/official CRUD screen.
 * `columns`: [{ header, accessor: row => node, className? }]
 */
const DataTable = ({ columns, rows, isLoading, page, totalPages, onPageChange, emptyMessage = 'No records found.' }) => {
  if (isLoading) return <TableSkeleton cols={columns.length} />;
  if (!rows?.length) return <EmptyState title="No records" message={emptyMessage} />;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-gray-900/60">
              {columns.map((col) => (
                <th key={col.header} className="px-4 py-3 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row._id} className="transition-colors duration-150 hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  );
};

export default DataTable;
