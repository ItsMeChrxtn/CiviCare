import { Link } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

const Unauthorized = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <FiLock className="h-16 w-16 text-red-500" />
    <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
    <p className="mt-2 text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
    <Link to="/" className="btn-primary mt-6">
      Back to Home
    </Link>
  </div>
);

export default Unauthorized;
