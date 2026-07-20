import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiDownload, FiFileText, FiTag, FiDollarSign, FiCalendar, FiCheckCircle } from 'react-icons/fi';
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
      <Link to="/resident/documents" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
        <FiArrowLeft /> Back to Requests
      </Link>

      <div className="card animate-fadeIn p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <FiFileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{doc.referenceCode}</p>
              <h1 className="font-display text-xl font-bold capitalize text-gray-900 dark:text-gray-50">{DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label || doc.type}</h1>
            </div>
          </div>
          <Badge status={doc.status} />
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <FiTag className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div><dt className="text-xs text-gray-400">Purpose</dt><dd className="font-medium text-gray-800 dark:text-gray-100">{doc.purpose}</dd></div>
          </div>
          <div className="flex items-start gap-3">
            <FiDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div><dt className="text-xs text-gray-400">Fee</dt><dd className="font-medium text-gray-800 dark:text-gray-100">{doc.fee ? `₱${doc.fee}` : 'Free'}</dd></div>
          </div>
          <div className="flex items-start gap-3">
            <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div><dt className="text-xs text-gray-400">Requested On</dt><dd className="font-medium text-gray-800 dark:text-gray-100">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</dd></div>
          </div>
          {doc.issuedAt && (
            <div className="flex items-start gap-3">
              <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div><dt className="text-xs text-gray-400">Issued On</dt><dd className="font-medium text-gray-800 dark:text-gray-100">{format(new Date(doc.issuedAt), 'MMM d, yyyy')}</dd></div>
            </div>
          )}
        </dl>

        {doc.status === 'rejected' && doc.rejectionReason && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <span className="font-semibold">Rejection reason:</span> {doc.rejectionReason}
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
