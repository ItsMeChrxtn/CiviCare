import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiRadio, FiSend, FiCheckCircle } from 'react-icons/fi';
import api from '../../utils/api';

const CHANNELS = [
  { value: 'app', label: 'In-App Notification Only' },
  { value: 'sms', label: 'SMS Only' },
  { value: 'both', label: 'In-App + SMS' },
];

const Broadcast = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { channel: 'app' } });
  const [lastResult, setLastResult] = useState(null);

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/broadcast', values);
      toast.success('Broadcast sent successfully');
      setLastResult(data.data);
      reset({ title: '', message: '', channel: values.channel });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header items-center text-center sm:items-start sm:text-left">
        <div className="mb-1 flex h-12 w-12 items-center justify-center self-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 sm:self-start">
          <FiRadio className="h-6 w-6" />
        </div>
        <h1 className="page-title">Broadcast / Emergency Alert</h1>
        <p className="page-subtitle">
          Send an urgent, standalone alert to all residents - separate from a full Announcement post.
        </p>
      </div>

      <div className="card animate-fadeIn p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input {...register('title', { required: true })} className="input-field" placeholder="e.g. Flood Warning" />
            {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea rows={4} {...register('message', { required: true })} className="input-field" placeholder="Broadcast message..." />
            {errors.message && <p className="mt-1 text-xs text-red-500">Message is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Channel</label>
            <select {...register('channel')} className="input-field">
              {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            <FiSend /> {isSubmitting ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      {lastResult && (
        <div className="card animate-slideUp mt-4 flex items-center gap-3 p-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FiCheckCircle className="h-4 w-4" />
          </span>
          <p>
            Last broadcast reached <span className="font-semibold text-primary-600 dark:text-primary-400">{lastResult.notifiedCount}</span> residents via app.
          </p>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
