import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import api from '../../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />
      <div className="card w-full max-w-md animate-scaleIn p-10">
        {status === 'loading' && (
          <>
            <FiLoader className="mx-auto h-12 w-12 animate-spin text-primary-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <FiCheckCircle className="h-9 w-9" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Email Verified!</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your account is now active. You may log in.</p>
            <Link to="/login" className="btn-primary mt-6">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <FiXCircle className="h-9 w-9" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Verification Failed</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This link is invalid or has expired.</p>
            <Link to="/login" className="btn-secondary mt-6">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
