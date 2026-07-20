import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => (
  <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
    <div className="absolute inset-0 -z-10 bg-radial-fade" />
    <div className="absolute inset-0 -z-10 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black,transparent)]" />

    <div className="animate-scaleIn">
      <p className="font-display text-8xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-6">
        <FiHome /> Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
