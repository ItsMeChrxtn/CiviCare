import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import api from '../../utils/api';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';
import { DOCUMENT_TYPES } from '../../utils/constants';

const DocumentDetail = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    api.get(`/documents/${id}`).then(({ data }) => setDoc(data.data));
  }, [id]);

  if (!doc) return <PageLoader />;

  return (
    <div>
      <Link to="/resident/documents" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <FiArrowLeft /> Back to Requests
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400">{doc.referenceCode}</p>
            <h1 className="text-xl font-bold capitalize">{DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label || doc.type}</h1>
          </div>
          <Badge status={doc.status} />
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-gray-400">Purpose</dt><dd className="font-medium">{doc.purpose}</dd></div>
          <div><dt className="text-xs text-gray-400">Fee</dt><dd className="font-medium">{doc.fee ? `₱${doc.fee}` : 'Free'}</dd></div>
          <div><dt className="text-xs text-gray-400">Requested On</dt><dd className="font-medium">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</dd></div>
          {doc.issuedAt && <div><dt className="text-xs text-gray-400">Issued On</dt><dd className="font-medium">{format(new Date(doc.issuedAt), 'MMM d, yyyy')}</dd></div>}
        </dl>

        {doc.status === 'rejected' && doc.rejectionReason && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            Rejection reason: {doc.rejectionReason}
          </div>
        )}

        {['ready_for_pickup', 'claimed'].includes(doc.status) && doc.pdfFile?.url && (
          <a href={doc.pdfFile.url} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
            <FiDownload /> Download PDF
          </a>
        )}
      </div>
    </div>
  );
};

export default DocumentDetail;
