import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiRadio, FiSend } from 'react-icons/fi';
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
      <div className="mb-6 flex items-center gap-2">
        <FiRadio className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Broadcast / Emergency Alert</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Send an urgent, standalone alert to all residents - separate from a full Announcement post.
      </p>

      <div className="card p-6">
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
        <div className="card mt-4 p-4 text-sm text-gray-500 dark:text-gray-400">
          Last broadcast reached <span className="font-semibold text-primary-600">{lastResult.notifiedCount}</span> residents via app.
        </div>
      )}
    </div>
  );
};

export default Broadcast;
