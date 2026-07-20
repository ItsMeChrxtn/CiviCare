import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSettings, FiMessageSquare, FiMail, FiTag } from 'react-icons/fi';
import api from '../../utils/api';
import { DOCUMENT_TYPES } from '../../utils/constants';
import PageLoader from '../../components/common/PageLoader';

const TABS = ['general', 'sms', 'email', 'categories'];
const TAB_ICONS = { general: FiSettings, sms: FiMessageSquare, email: FiMail, categories: FiTag };

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

  if (!settings) return <PageLoader />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <p className="page-subtitle">Configure barangay information, notifications, and document fees.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium capitalize transition ${
                tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" /> {t}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card animate-fadeIn max-w-2xl space-y-4 p-6">
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
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <span className="relative inline-flex shrink-0">
                <input type="checkbox" {...register('enabled')} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors duration-200 peer-checked:bg-primary-600 dark:bg-gray-700" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
              </span>
              Enable SMS notifications (Semaphore)
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium">Sender Name</label>
              <input {...register('senderName')} className="input-field" />
            </div>
            <p className="text-xs text-gray-400">The Semaphore API key itself is configured server-side via environment variables for security.</p>
          </>
        )}

        {tab === 'email' && (
          <>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <span className="relative inline-flex shrink-0">
                <input type="checkbox" {...register('enabled')} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors duration-200 peer-checked:bg-primary-600 dark:bg-gray-700" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
              </span>
              Enable email notifications
            </label>
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
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {DOCUMENT_TYPES.map((d) => (
                <div key={d.value} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <label className="text-sm">{d.label}</label>
                  <input type="number" min="0" {...register(d.value)} className="input-field w-32" />
                </div>
              ))}
            </div>
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
