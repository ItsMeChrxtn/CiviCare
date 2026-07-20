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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {status === 'loading' && <FiLoader className="h-12 w-12 animate-spin text-primary-600" />}
      {status === 'success' && (
        <>
          <FiCheckCircle className="h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold">Email Verified!</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your account is now active. You may log in.</p>
          <Link to="/login" className="btn-primary mt-6">Go to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <FiXCircle className="h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">Verification Failed</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This link is invalid or has expired.</p>
          <Link to="/login" className="btn-secondary mt-6">Back to Login</Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
