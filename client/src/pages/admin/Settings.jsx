import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSettings, FiMessageSquare, FiMail, FiTag, FiUsers, FiImage } from 'react-icons/fi';
import api from '../../utils/api';
import { SERVICE_DOCUMENTS } from '../../utils/constants';
import PageLoader from '../../components/common/PageLoader';
import { invalidateSetting } from '../../hooks/useSetting';
import OfficialsEditor, { uploadImage } from './OfficialsEditor';

const TABS = ['general', 'officials', 'sms', 'email', 'categories'];
const TAB_ICONS = { general: FiSettings, officials: FiUsers, sms: FiMessageSquare, email: FiMail, categories: FiTag };

const Settings = () => {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm();
  const heroImage = watch('heroImage');

  const pickHero = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      setValue('heroImage', await uploadImage(file), { shouldDirty: true });
      toast.success('Photo uploaded. Click Save Settings to apply it.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const load = () => api.get('/settings').then(({ data }) => setSettings(data.data));
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (!['categories', 'officials'].includes(tab)) reset(settings[tab] || {});
  }, [tab, settings, reset]);

  const onSubmit = async (values) => {
    try {
      await api.put(`/settings/${tab}`, values);
      toast.success('Settings saved successfully');
      invalidateSetting(tab);
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
        <p className="page-subtitle">Configure barangay information, notifications, and offered documents.</p>
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

      {tab === 'officials' ? (
        <OfficialsEditor
          initial={settings.officials || []}
          onSaved={() => {
            invalidateSetting('officials');
            load();
          }}
        />
      ) : (
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
                <input {...register('email')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Phone</label>
                <input {...register('phone')} className="input-field" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">About Magdiwang (landing page)</label>
              <textarea rows={4} {...register('about')} className="input-field" />
            </div>
            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <p className="text-sm font-semibold">Landing page</p>
              <div>
                <label className="mb-1 block text-sm font-medium">Background photo (Barangay Hall)</label>
                {heroImage && <img src={heroImage} alt="Landing page background" className="mb-2 h-36 w-full rounded-xl object-cover" />}
                <div className="flex flex-wrap gap-2">
                  <label className="btn-secondary cursor-pointer !py-2 text-sm">
                    <FiImage /> {uploading ? 'Uploading...' : heroImage ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => pickHero(e.target.files[0])} />
                  </label>
                  {heroImage && (
                    <button type="button" onClick={() => setValue('heroImage', '', { shouldDirty: true })} className="btn-ghost !py-2 text-sm text-red-600">
                      Remove
                    </button>
                  )}
                </div>
                <input type="hidden" {...register('heroImage')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mission</label>
                <textarea rows={3} {...register('mission')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Vision</label>
                <textarea rows={3} {...register('vision')} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Map center latitude</label>
                <input type="number" step="any" {...register('mapCenter.0', { valueAsNumber: true })} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Map center longitude</label>
                <input type="number" step="any" {...register('mapCenter.1', { valueAsNumber: true })} className="input-field" />
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
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Documents residents can request through Service Request. Both are issued free of charge.</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {SERVICE_DOCUMENTS.map((d) => (
                <div key={d.value} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm">{d.label}</span>
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Free</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab !== 'categories' && (
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </form>
      )}
    </div>
  );
};

export default Settings;
