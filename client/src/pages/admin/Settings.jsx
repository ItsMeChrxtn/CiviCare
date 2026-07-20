import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { DOCUMENT_TYPES } from '../../utils/constants';
import { CardSkeleton } from '../../components/common/Skeleton';

const TABS = ['general', 'sms', 'email', 'categories'];

const Settings = () => {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = () => api.get('/settings').then(({ data }) => setSettings(data.data));
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (tab === 'categories') {
      reset(settings.categories?.documentFees || {});
    } else {
      reset(settings[tab] || {});
    }
  }, [tab, settings, reset]);

  const onSubmit = async (values) => {
    try {
      if (tab === 'categories') {
        await api.put('/settings/categories', { ...settings.categories, documentFees: values });
      } else {
        await api.put(`/settings/${tab}`, values);
      }
      toast.success('Settings saved successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (!settings) return <CardSkeleton />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">System Settings</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-100 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl space-y-4 p-6">
        {tab === 'general' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Barangay Name</label>
              <input {...register('barangayName')} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <input {...register('address')} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Office Hours</label>
              <input {...register('officeHours')} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Email</label>
                <input {...register('contactEmail')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Phone</label>
                <input {...register('contactPhone')} className="input-field" />
              </div>
            </div>
          </>
        )}

        {tab === 'sms' && (
          <>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('enabled')} className="accent-primary-600" /> Enable SMS notifications (Semaphore)</label>
            <div>
              <label className="mb-1 block text-sm font-medium">Sender Name</label>
              <input {...register('senderName')} className="input-field" />
            </div>
            <p className="text-xs text-gray-400">The Semaphore API key itself is configured server-side via environment variables for security.</p>
          </>
        )}

        {tab === 'email' && (
          <>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('enabled')} className="accent-primary-600" /> Enable email notifications</label>
            <div>
              <label className="mb-1 block text-sm font-medium">From Name</label>
              <input {...register('fromName')} className="input-field" />
            </div>
            <p className="text-xs text-gray-400">SMTP credentials are configured server-side via environment variables for security.</p>
          </>
        )}

        {tab === 'categories' && (
          <>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Set the processing fee (PHP) for each document type.</p>
            {DOCUMENT_TYPES.map((d) => (
              <div key={d.value} className="flex items-center justify-between gap-3">
                <label className="text-sm">{d.label}</label>
                <input type="number" min="0" {...register(d.value)} className="input-field w-32" />
              </div>
            ))}
          </>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
