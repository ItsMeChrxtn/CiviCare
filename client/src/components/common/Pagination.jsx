import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
        aria-label="Previous page"
      >
        <FiChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
      </button>
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-40"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span> <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
