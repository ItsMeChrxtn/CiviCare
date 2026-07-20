import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiStar } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const Feedback = () => {
  const { rows, isLoading, refetch } = usePaginatedFetch('/feedback', { limit: 20 });
  const [modalItem, setModalItem] = useState(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  const submitResponse = async () => {
    if (!response) return toast.error('Please write a response');
    setBusy(true);
    try {
      await api.patch(`/feedback/${modalItem._id}/respond`, { response, status: 'resolved' });
      toast.success('Response sent');
      setModalItem(null);
      setResponse('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Feedback Management</h1>

      {isLoading ? (
        <CardSkeleton />
      ) : !rows.length ? (
        <EmptyState title="No feedback submitted yet" />
      ) : (
        <div className="space-y-4">
          {rows.map((f) => (
            <div key={f._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{f.category}</span>
                  <h3 className="mt-2 font-bold">{f.subject}</h3>
                  <p className="text-xs text-gray-400">{f.isAnonymous ? 'Anonymous' : `${f.submittedBy?.firstName} ${f.submittedBy?.lastName}`} • {format(new Date(f.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <Badge status={f.status} />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{f.message}</p>
              {f.rating && (
                <div className="mt-2 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} className={i < f.rating ? 'fill-current' : ''} />)}
                </div>
              )}
              {f.response ? (
                <div className="mt-3 rounded-xl bg-primary-50 p-3 text-sm dark:bg-primary-500/10">
                  <p className="font-semibold text-primary-700 dark:text-primary-400">Your Response:</p>
                  <p className="text-gray-600 dark:text-gray-300">{f.response}</p>
                </div>
              ) : (
                <button onClick={() => setModalItem(f)} className="btn-secondary mt-3 text-sm">Respond</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title="Respond to Feedback">
        <textarea
          placeholder="Type your response..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          className="input-field"
          rows={4}
        />
        <button onClick={submitResponse} disabled={busy} className="btn-primary mt-4 w-full">
          {busy ? 'Sending...' : 'Send Response'}
        </button>
      </Modal>
    </div>
  );
};

export default Feedback;
