import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { FiSend, FiPlus, FiTrash2, FiAlertTriangle, FiMessageSquare, FiSave } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting, { invalidateSetting } from '../../hooks/useSetting';
import TrendLineChart from '../../components/charts/TrendLineChart';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { PUROKS } from '../../utils/constants';
import { RISK_STYLES } from '../../utils/emergency';

const CHANNELS = [
  { value: 'both', label: 'SMS + In-App (recommended)' },
  { value: 'sms', label: 'SMS only' },
  { value: 'app', label: 'In-App only' },
];

const TEMPLATES = [
  { label: 'Flood warning', title: 'Flood Warning', message: 'Water levels are rising in low-lying areas of Barangay Magdiwang. Prepare your go-bag and be ready to evacuate to the Covered Court.' },
  { label: 'Pre-emptive evacuation', title: 'Pre-emptive Evacuation', message: 'Residents of flood-prone areas are advised to evacuate NOW to the nearest evacuation center. Bring IDs, medicines and go-bags.' },
  { label: 'Typhoon signal', title: 'Typhoon Advisory', message: 'PAGASA has raised a tropical cyclone wind signal over Cavite. Secure your homes, stay indoors and monitor barangay updates.' },
  { label: 'Fire alert', title: 'Fire Alert', message: 'A fire has been reported in the barangay. Keep the roads clear for responders and stay away from the area.' },
  { label: 'All clear', title: 'All Clear', message: 'The emergency has passed. Residents may return home safely. Report any damage through CiviCare Incident Reporting.' },
];

const SMS_SEGMENT = 160;

/** Emergency SMS (docu Figure 19, SMS Integration): broadcast via Semaphore, alert levels, usage and history. */
const Broadcast = () => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { channel: 'both', purok: '' },
  });
  const [usage, setUsage] = useState(null);
  const [emergency] = useSetting('emergency');
  const [status, setStatus] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const loadUsage = useCallback(() => api.get('/broadcast/sms-usage').then(({ data }) => setUsage(data.data)).catch(() => setUsage(null)), []);
  useEffect(() => {
    loadUsage();
  }, [loadUsage]);
  useEffect(() => {
    if (emergency) setStatus(emergency);
  }, [emergency]);

  const message = watch('message') || '';
  const title = watch('title') || '';
  const smsLength = `[CiviCare Alert] ${title}: ${message}`.length;

  const series = useMemo(() => {
    const byDay = new Map((usage?.daily || []).map((d) => [d._id, d.count]));
    return Array.from({ length: 30 }, (_, i) => {
      const day = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
      return { _id: day.slice(5), count: byDay.get(day) || 0 };
    });
  }, [usage]);

  const onSubmit = async (values) => {
    if (!window.confirm(`Send "${values.title}" to ${values.purok || 'ALL residents'} via ${values.channel.toUpperCase()}?`)) return;
    try {
      const { data } = await api.post('/broadcast', { ...values, purok: values.purok || undefined });
      const r = data.data;
      const smsInfo = r.smsResult?.skipped ? 'SMS skipped (gateway not configured or disabled)' : r.smsResult?.error ? `SMS failed: ${r.smsResult.error}` : `${r.smsCount} SMS queued`;
      toast.success(`Sent. ${r.notifiedCount} in-app · ${smsInfo}`, { duration: 7000 });
      reset({ title: '', message: '', channel: values.channel, purok: values.purok });
      loadUsage();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    }
  };

  const saveStatus = async () => {
    setSavingStatus(true);
    try {
      await api.put('/settings/emergency', status);
      invalidateSetting('emergency');
      toast.success('Emergency Hub alert levels updated for all residents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update alert levels');
    } finally {
      setSavingStatus(false);
    }
  };

  const updateAlert = (i, patch) => setStatus((s) => ({ ...s, alerts: s.alerts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
            <FiMessageSquare className="text-red-500" /> Send Emergency SMS / Alert
          </h2>
          <p className="mb-4 text-xs text-gray-500">Delivered through the Semaphore SMS gateway so residents without internet still receive it.</p>

          <div className="mb-3 flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setValue('title', tpl.title);
                  setValue('message', tpl.message);
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
              <input id="title" {...register('title', { required: true })} className="input-field" placeholder="e.g. Flood Warning" />
              {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium">Message</label>
              <textarea id="message" rows={4} {...register('message', { required: true })} className="input-field" />
              <p className={`mt-1 text-right text-xs ${smsLength > SMS_SEGMENT ? 'text-orange-600' : 'text-gray-400'}`}>
                {smsLength} characters · {Math.ceil(smsLength / SMS_SEGMENT)} SMS credit(s) per recipient
              </p>
              {errors.message && <p className="text-xs text-red-500">Message is required</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="channel" className="mb-1 block text-sm font-medium">Channel</label>
                <select id="channel" {...register('channel')} className="input-field">
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="purok" className="mb-1 block text-sm font-medium">Recipients</label>
                <select id="purok" {...register('purok')} className="input-field">
                  <option value="">All residents</option>
                  {PUROKS.map((p) => (
                    <option key={p} value={p}>
                      {p} only
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-danger w-full">
              <FiSend /> {isSubmitting ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
            <FiAlertTriangle className="text-orange-500" /> Emergency Hub Alert Levels
          </h2>
          <p className="mb-4 text-xs text-gray-500">Shown live on every resident's Emergency & Disaster Hub and top bar.</p>
          {!status ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium">Flood Risk Level</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {['low', 'moderate', 'high', 'critical'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setStatus((s) => ({ ...s, floodRiskLevel: r }))}
                      aria-pressed={status.floodRiskLevel === r}
                      className={`rounded-lg border-2 px-2 py-2 text-xs font-bold uppercase ${
                        status.floodRiskLevel === r ? `${RISK_STYLES[r].chip} border-current` : 'border-gray-200 text-gray-500 dark:border-gray-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Alerts</p>
                {status.alerts.map((a, i) => (
                  <div key={a.key} className="flex items-center gap-2">
                    <input type="checkbox" checked={a.active !== false} onChange={(e) => updateAlert(i, { active: e.target.checked })} className="h-4 w-4 accent-primary-600" aria-label="Show alert" />
                    <input value={a.label} onChange={(e) => updateAlert(i, { label: e.target.value })} className="input-field !py-1.5" aria-label="Alert name" />
                    <input value={a.level} onChange={(e) => updateAlert(i, { level: e.target.value })} className="input-field w-40 !py-1.5" aria-label="Level" placeholder="Low / Normal / Signal No. 2" />
                    <button
                      type="button"
                      onClick={() => setStatus((s) => ({ ...s, alerts: s.alerts.filter((_, idx) => idx !== i) }))}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      aria-label="Remove alert"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStatus((s) => ({ ...s, alerts: [...s.alerts, { key: `custom_${Date.now()}`, label: 'New Alert', level: 'Normal', active: true }] }))}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-600"
                >
                  <FiPlus /> Add alert
                </button>
                <p className="text-[11px] text-gray-400">Levels “Low”, “Normal” or “None” are shown but not counted as active.</p>
              </div>
              <button onClick={saveStatus} disabled={savingStatus} className="btn-primary w-full">
                <FiSave /> {savingStatus ? 'Saving...' : 'Publish Alert Levels'}
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">SMS Usage (last 30 days)</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {usage && !usage.configured && <span className="badge bg-amber-100 text-amber-700">Semaphore API key not configured — SMS are logged but not sent</span>}
            {usage?.account?.credit_balance !== undefined && <span className="badge bg-primary-100 text-primary-700">Credits: {usage.account.credit_balance}</span>}
            <span className="badge bg-emerald-100 text-emerald-700">Sent: {usage?.totals?.sent ?? 0}</span>
            <span className="badge bg-red-100 text-red-700">Failed: {usage?.totals?.failed ?? 0}</span>
            <span className="badge bg-gray-100 text-gray-600">Skipped: {usage?.totals?.skipped ?? 0}</span>
          </div>
        </div>
        {usage ? <TrendLineChart series={series} label="Messages sent" color="#0b7a3e" /> : <CardSkeleton />}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Recent Messages</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {['Date', 'Purpose', 'Message', 'Recipients', 'Status', 'Sent by'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(usage?.recent || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                    No messages yet.
                  </td>
                </tr>
              )}
              {(usage?.recent || []).map((m) => (
                <tr key={m._id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{format(new Date(m.createdAt), 'MMM d, h:mm a')}</td>
                  <td className="px-3 py-2 text-xs capitalize">{m.purpose.replace(/_/g, ' ')}</td>
                  <td className="max-w-md px-3 py-2 text-xs" title={m.message}>
                    <span className="line-clamp-2">{m.message}</span>
                  </td>
                  <td className="px-3 py-2">{m.recipientCount}</td>
                  <td className="px-3 py-2">
                    <Badge status={m.status === 'sent' ? 'approved' : m.status === 'failed' ? 'rejected' : 'pending'}>{m.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">{m.sentBy ? `${m.sentBy.firstName} ${m.sentBy.lastName}` : 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Broadcast;
