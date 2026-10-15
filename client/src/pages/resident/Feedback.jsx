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
import { usePreferences } from '../../contexts/PreferencesContext';

const CATEGORIES = ['service', 'official', 'facility', 'system', 'suggestion', 'complaint'];

const Feedback = () => {
  const { t } = usePreferences();
  const { rows, isLoading, refetch } = usePaginatedFetch('/feedback', { limit: 20 });
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post('/feedback', values);
      toast.success(t('feedback.thanks'));
      reset();
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || t('feedback.failed'));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <h1 className="page-title">{t('nav.feedback')}</h1>
          <p className="page-subtitle">{t('feedback.subtitle')}</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> {t('feedback.submit')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !rows.length ? (
        <EmptyState title={t('feedback.noneTitle')} message={t('feedback.noneBody')} />
      ) : (
        <div className="space-y-4">
          {rows.map((f) => (
            <div key={f._id} className="card card-hover animate-fadeIn p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{t(`feedback.cat.${f.category}`, null, f.category)}</span>
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
                  <p className="font-semibold text-primary-700 dark:text-primary-400">{t('feedback.response')}</p>
                  <p className="text-gray-600 dark:text-gray-300">{f.response}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-400">{format(new Date(f.createdAt), 'MMM d, yyyy')}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('feedback.submit')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('feedback.category')}</label>
            <select {...register('category', { required: true })} className="input-field capitalize">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`feedback.cat.${c}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('feedback.subject')}</label>
            <input {...register('subject', { required: true })} className="input-field" />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{t('common.required')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('feedback.message')}</label>
            <textarea rows={4} {...register('message', { required: true })} className="input-field" />
            {errors.message && <p className="mt-1 text-xs text-red-500">{t('common.required')}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('feedback.rating')}</label>
            <select {...register('rating')} className="input-field">
              <option value="">{t('feedback.noRating')}</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{t('feedback.stars', { count: r })}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isAnonymous')} className="accent-primary-600" />
            {t('feedback.anonymous')}
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('common.loading') : t('feedback.submit')}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Feedback;
