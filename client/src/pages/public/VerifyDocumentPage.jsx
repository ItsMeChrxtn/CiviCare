import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCheckCircle, FiXCircle, FiAlertOctagon, FiCamera } from 'react-icons/fi';
import api from '../../utils/api';
import PageLoader from '../../components/common/PageLoader';
import { documentLabel } from '../../utils/constants';

const VerifyDocumentPage = () => {
  const { referenceCode } = useParams();
  const [searchParams] = useSearchParams();
  const hash = searchParams.get('h');
  const [result, setResult] = useState(undefined); // undefined = loading
  const [failure, setFailure] = useState(null); // { tampered, message }

  useEffect(() => {
    setResult(undefined);
    setFailure(null);
    api
      .get(`/documents/verify/${referenceCode}`, { params: hash ? { h: hash } : {} })
      .then(({ data }) => setResult(data.data))
      .catch((err) => {
        setResult(null);
        // 400 with a hash = security code mismatch; 400 without one = needs a QR scan, not tampering.
        setFailure({ tampered: err.response?.status === 400 && Boolean(hash), message: err.response?.data?.message });
      });
  }, [referenceCode, hash]);

  if (result === undefined) return <PageLoader />;

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center overflow-hidden px-4 py-24 text-center lg:px-8">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />

      {result ? (
        <div className="w-full animate-scaleIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">Document Verified</h1>
          <p className="mt-1 text-sm text-gray-500">
            {hash ? 'Authentic and unaltered — issued by Barangay Magdiwang.' : 'This reference code matches an issued Barangay Magdiwang document.'}
          </p>
          <div className="card mt-6 w-full p-6 text-left shadow-card-hover">
            <dl className="space-y-3 text-sm">
              {[
                ['Reference Code', result.referenceCode],
                ['Document Type', documentLabel(result.type)],
                ['Issued To', result.residentName],
                ['Purpose', result.purpose],
                ['Issued Date', format(new Date(result.issuedAt), 'MMM d, yyyy')],
                ['Verified At', format(new Date(result.verifiedAt || Date.now()), 'MMM d, yyyy h:mm a')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-gray-400 dark:text-gray-500">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : failure?.tampered ? (
        <div className="animate-scaleIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
            <FiAlertOctagon className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-red-600">Possible Tampering Detected</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{failure.message}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Do not accept this document. Please report it to the Barangay Hall.</p>
        </div>
      ) : (
        <div className="animate-scaleIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <FiXCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-red-600 dark:text-red-400">Invalid or Unverified Document</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {failure?.message || 'This reference code could not be verified. The document may be invalid or not yet issued.'}
          </p>
        </div>
      )}

      <Link to="/verify" className="btn-secondary mt-8">
        <FiCamera /> Scan another document
      </Link>
    </div>
  );
};

export default VerifyDocumentPage;
