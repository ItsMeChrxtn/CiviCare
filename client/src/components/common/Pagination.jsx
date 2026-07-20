import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-1 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
      >
        <FiChevronLeft className="h-4 w-4" /> Prev
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
      >
        Next <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
