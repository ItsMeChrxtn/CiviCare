import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon: Icon = FiInbox, title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-16 text-center">
    <Icon className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-700" />
    <p className="font-semibold text-gray-700 dark:text-gray-300">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-gray-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
