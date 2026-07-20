import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <p className="text-7xl font-extrabold text-primary-600">404</p>
    <h1 className="mt-4 text-2xl font-bold">Page Not Found</h1>
    <p className="mt-2 text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn-primary mt-6">
      <FiHome /> Back to Home
    </Link>
  </div>
);

export default NotFound;
