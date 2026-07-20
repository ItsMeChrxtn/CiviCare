const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-4' };

const Spinner = ({ size = 'md', className = '' }) => (
  <div
    className={`animate-spin rounded-full border-primary-200 border-t-primary-600 dark:border-primary-500/20 dark:border-t-primary-400 ${SIZES[size]} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export default Spinner;
