import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../utils/api';
import PageLoader from '../../components/common/PageLoader';
import { DOCUMENT_TYPES } from '../../utils/constants';

const VerifyDocumentPage = () => {
  const { referenceCode } = useParams();
  const [result, setResult] = useState(undefined);

  useEffect(() => {
    api
      .get(`/documents/verify/${referenceCode}`)
      .then(({ data }) => setResult(data.data))
      .catch(() => setResult(null));
  }, [referenceCode]);

  if (result === undefined) return <PageLoader />;

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center overflow-hidden px-4 py-24 text-center lg:px-8">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />
      <div className="absolute inset-0 -z-10 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_30%,black,transparent)]" />

      {result ? (
        <div className="animate-scaleIn w-full">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">Document Verified</h1>
          <div className="card mt-6 w-full p-6 text-left shadow-card-hover">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-gray-400 dark:text-gray-500">Reference Code</dt><dd className="font-semibold">{result.referenceCode}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400 dark:text-gray-500">Document Type</dt><dd className="text-right font-semibold">{DOCUMENT_TYPES.find((d) => d.value === result.type)?.label || result.type}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400 dark:text-gray-500">Issued To</dt><dd className="font-semibold">{result.residentName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400 dark:text-gray-500">Purpose</dt><dd className="text-right font-semibold">{result.purpose}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-400 dark:text-gray-500">Issued Date</dt><dd className="font-semibold">{format(new Date(result.issuedAt), 'MMM d, yyyy')}</dd></div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="animate-scaleIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <FiXCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-red-600 dark:text-red-400">Invalid or Unverified Document</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This reference code could not be verified. The document may be invalid, expired, or not yet issued.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerifyDocumentPage;
