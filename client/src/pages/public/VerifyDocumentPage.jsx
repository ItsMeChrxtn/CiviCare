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
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center lg:px-8">
      {result ? (
        <>
          <FiCheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-extrabold text-emerald-600">Document Verified</h1>
          <div className="card mt-6 w-full p-6 text-left">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Reference Code</dt><dd className="font-semibold">{result.referenceCode}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Document Type</dt><dd className="font-semibold">{DOCUMENT_TYPES.find((d) => d.value === result.type)?.label || result.type}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Issued To</dt><dd className="font-semibold">{result.residentName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Purpose</dt><dd className="font-semibold">{result.purpose}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Issued Date</dt><dd className="font-semibold">{format(new Date(result.issuedAt), 'MMM d, yyyy')}</dd></div>
            </dl>
          </div>
        </>
      ) : (
        <>
          <FiXCircle className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-extrabold text-red-600">Invalid or Unverified Document</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This reference code could not be verified. The document may be invalid, expired, or not yet issued.
          </p>
        </>
      )}
    </div>
  );
};

export default VerifyDocumentPage;
