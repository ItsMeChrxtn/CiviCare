import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon: Icon = FiInbox, title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center dark:border-gray-800 dark:bg-gray-900/30">
    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-700">
      <Icon className="h-8 w-8" />
    </div>
    <p className="font-display font-semibold text-gray-700 dark:text-gray-300">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-gray-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
