import { Link } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

const Unauthorized = () => (
  <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
    <div className="absolute inset-0 -z-10 bg-radial-fade" />
    <div className="absolute inset-0 -z-10 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black,transparent)]" />

    <div className="animate-scaleIn">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
        <FiLock className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Access Denied</h1>
      <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  </div>
);

export default Unauthorized;
