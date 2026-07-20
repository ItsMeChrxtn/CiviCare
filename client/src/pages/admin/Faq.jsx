import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const Faq = () => {
  const [faqs, setFaqs] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = () => api.get('/settings/faqs').then(({ data }) => setFaqs(data.data || []));
  useEffect(() => {
    load();
  }, []);

  const save = async (nextFaqs) => {
    await api.put('/settings/faqs', nextFaqs);
    setFaqs(nextFaqs);
  };

  const onSubmit = async (values) => {
    try {
      await save([...(faqs || []), { question: values.question, answer: values.answer, order: (faqs?.length || 0) }]);
      toast.success('FAQ added');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    }
  };

  const removeFaq = async (index) => {
    try {
      const next = faqs.filter((_, i) => i !== index);
      await save(next);
      toast.success('FAQ removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove FAQ');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">FAQ Manager</h1>
          <p className="page-subtitle">Manage frequently asked questions shown to residents.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary shrink-0"><FiPlus /> Add FAQ</button>
      </div>

      {faqs === null ? (
        <CardSkeleton />
      ) : !faqs.length ? (
        <EmptyState title="No FAQs yet" message="Add a question to help residents find answers faster." />
      ) : (
        <div className="card animate-fadeIn divide-y divide-gray-100 dark:divide-gray-800">
          {faqs.map((f, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-4 transition-colors duration-150 hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
              <div className="min-w-0">
                <p className="font-semibold">{f.question}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.answer}</p>
              </div>
              <button onClick={() => removeFaq(i)} className="shrink-0 rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add FAQ">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Question</label>
            <input {...register('question', { required: true })} className="input-field" />
            {errors.question && <p className="mt-1 text-xs text-red-500">Question is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Answer</label>
            <textarea rows={4} {...register('answer', { required: true })} className="input-field" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Add FAQ'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Faq;
