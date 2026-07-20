import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus, FiStar } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const CATEGORIES = ['service', 'official', 'facility', 'system', 'suggestion', 'complaint'];

const Feedback = () => {
  const { rows, isLoading, refetch } = usePaginatedFetch('/feedback', { limit: 20 });
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post('/feedback', values);
      toast.success('Thank you for your feedback!');
      reset();
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <h1 className="page-title">Feedback</h1>
          <p className="page-subtitle">Share suggestions, complaints, or compliments with the barangay.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> Submit Feedback
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !rows.length ? (
        <EmptyState title="No feedback submitted yet" message="Your submitted feedback and official responses will appear here." />
      ) : (
        <div className="space-y-4">
          {rows.map((f) => (
            <div key={f._id} className="card card-hover animate-fadeIn p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{f.category}</span>
                  <h3 className="mt-2 font-display font-bold text-gray-900 dark:text-gray-50">{f.subject}</h3>
                </div>
                <Badge status={f.status} />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{f.message}</p>
              {f.rating && (
                <div className="mt-2 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar key={i} className={i < f.rating ? 'fill-current' : ''} />
                  ))}
                </div>
              )}
              {f.response && (
                <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm dark:border-primary-500/20 dark:bg-primary-500/10">
                  <p className="font-semibold text-primary-700 dark:text-primary-400">Official Response:</p>
                  <p className="text-gray-600 dark:text-gray-300">{f.response}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-400">{format(new Date(f.createdAt), 'MMM d, yyyy')}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Submit Feedback">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select {...register('category', { required: true })} className="input-field capitalize">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>
            <input {...register('subject', { required: true })} className="input-field" />
            {errors.subject && <p className="mt-1 text-xs text-red-500">Subject is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea rows={4} {...register('message', { required: true })} className="input-field" />
            {errors.message && <p className="mt-1 text-xs text-red-500">Message is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rating (optional)</label>
            <select {...register('rating')} className="input-field">
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isAnonymous')} className="accent-primary-600" />
            Submit anonymously
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Feedback;
