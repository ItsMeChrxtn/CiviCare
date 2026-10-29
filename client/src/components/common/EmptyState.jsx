import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon: Icon = FiInbox, title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 text-center dark:border-gray-800 dark:bg-gray-900/30 sm:py-16">
    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-400 ring-8 ring-primary-50/50 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/5">
      <Icon className="h-8 w-8" />
    </div>
    <p className="font-display font-semibold text-gray-700 dark:text-gray-300">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-gray-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
