import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiHome, FiInfo, FiMapPin, FiSend, FiTruck } from 'react-icons/fi';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import useSetting from '../../hooks/useSetting';
import { DONATION_CONDITIONS, DONATION_TYPES } from '../../utils/constants';

const CATEGORY_ORDER = ['food', ...DONATION_TYPES.filter((type) => type !== 'food')];
const METHODS = [
  { value: 'dropoff', icon: FiHome, title: 'donation.dropoff', desc: 'donation.dropoffDesc' },
  { value: 'pickup', icon: FiTruck, title: 'donation.pickup', desc: 'donation.pickupDesc' },
];
const EMPTY = { targetDate: '', quantity: '', amount: '', type: 'food', itemCondition: 'new', description: '' };

const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const isWeekend = (value) => [0, 6].includes(new Date(value).getUTCDay());
const registeredAddress = (a) => [a?.street, a?.purok, a?.barangay, a?.city, a?.province].filter(Boolean).join(', ');

const Step = ({ number, title, subtitle, badge, children }) => (
  <section className="card p-4 sm:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
          {number}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold sm:text-base">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {badge && <span className="badge bg-primary-50 text-[10px] uppercase text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">{badge}</span>}
    </div>
    {children}
  </section>
);

const ReadOnly = ({ label, icon: Icon, value }) => (
  <div>
    <p className="mb-1 block text-sm font-medium">{label}</p>
    <p className="flex min-h-[2.625rem] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
      <Icon className="shrink-0 text-gray-400" /> <span className="min-w-0">{value}</span>
    </p>
  </div>
);

/** Three-step pledge form (panel revision): hand-over method, schedule and contact, then item details. */
const DonationForm = ({ onSuccess }) => {
  const { t } = usePreferences();
  const { user } = useAuth();
  const [general] = useSetting('general');
  const [method, setMethod] = useState('dropoff');
  const [form, setForm] = useState(EMPTY);
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const isPickup = method === 'pickup';
  const isCash = form.type === 'cash';
  const address = registeredAddress(user?.address);
  const officeHours = general?.officeHours || t('donation.defaultHours');
  const change = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const reset = () => {
    setMethod('dropoff');
    setForm(EMPTY);
    setContactNumber(user?.phone || '');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.targetDate) return toast.error(t('donation.needDate'));
    if (isWeekend(form.targetDate)) return toast.error(t('donation.weekdayOnly'));
    if (!/^(09|\+639)\d{9}$/.test(contactNumber.replace(/[\s-]/g, ''))) return toast.error(t('donation.needContact'));
    if (isPickup && !address) return toast.error(t('donation.needAddress'));
    if (isCash ? !(Number(form.amount) > 0) : !form.quantity.trim()) return toast.error(t(isCash ? 'donation.amountRequired' : 'donation.needQty'));

    setSubmitting(true);
    try {
      const { data } = await api.post('/donations', {
        deliveryMethod: method,
        targetDate: form.targetDate,
        contactNumber,
        pickupAddress: isPickup ? address : undefined,
        type: form.type,
        quantity: isCash ? undefined : form.quantity.trim(),
        amount: isCash ? form.amount : undefined,
        itemCondition: isCash ? undefined : form.itemCondition,
        description: form.description.trim() || undefined,
      });
      toast.success(t('donation.thanksRef', { code: data.data.referenceCode }), { duration: 8000 });
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('donation.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="min-w-0 space-y-4">
      <Step number={1} title={t('donation.step1')} subtitle={t('donation.step1Sub')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('donation.step1')}>
          {METHODS.map(({ value, icon: Icon, title, desc }) => {
            const selected = method === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMethod(value)}
                className={`relative rounded-xl border p-4 text-left transition ${
                  selected ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                {selected && <FiCheckCircle className="absolute right-3 top-3 h-5 w-5 text-primary-600" aria-hidden="true" />}
                <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${selected ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="block text-sm font-bold">{t(title)}</span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t(desc)}</span>
              </button>
            );
          })}
        </div>
      </Step>

      <Step number={2} title={t(isPickup ? 'donation.step2Pickup' : 'donation.step2Dropoff')} badge={t(isPickup ? 'donation.badgePickup' : 'donation.badgeDropoff')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnly
            label={t(isPickup ? 'donation.pickupAddress' : 'donation.dropoffLocation')}
            icon={FiMapPin}
            value={isPickup ? address || t('donation.noAddress') : t('donation.hallAddress')}
          />
          <ReadOnly label={t(isPickup ? 'donation.pickupHours' : 'donation.receivingHours')} icon={FiClock} value={officeHours} />
          <div>
            <label htmlFor="donation-date" className="mb-1 block text-sm font-medium">
              {t(isPickup ? 'donation.targetPickup' : 'donation.targetDropoff')} <span className="text-red-500">*</span>
            </label>
            <input id="donation-date" type="date" min={localToday()} value={form.targetDate} onChange={change('targetDate')} className="input-field" />
          </div>
          <div>
            <label htmlFor="donation-contact" className="mb-1 block text-sm font-medium">
              {t('donation.contact')} <span className="text-red-500">*</span>
            </label>
            <input id="donation-contact" type="tel" placeholder="0917-000-0000" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="input-field" />
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <FiInfo className="mt-0.5 shrink-0" />
          <span>
            <b>{t(isPickup ? 'donation.pickupNoteTitle' : 'donation.dropoffNoteTitle')}</b> {t(isPickup ? 'donation.pickupNote' : 'donation.dropoffNote')}
          </span>
        </p>
      </Step>

      <Step number={3} title={t('donation.step3')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="donation-category" className="mb-1 block text-sm font-medium">
              {t('donation.category')} <span className="text-red-500">*</span>
            </label>
            <select id="donation-category" value={form.type} onChange={change('type')} className="input-field">
              {CATEGORY_ORDER.map((type) => (
                <option key={type} value={type}>
                  {t(`donation.cat.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div className={isCash ? 'sm:col-span-2' : ''}>
            <label htmlFor="donation-quantity" className="mb-1 block text-sm font-medium">
              {t(isCash ? 'donation.amount' : 'donation.estQty')} <span className="text-red-500">*</span>
            </label>
            {isCash ? (
              <input id="donation-quantity" type="number" min="1" step="0.01" value={form.amount} onChange={change('amount')} className="input-field" />
            ) : (
              <input id="donation-quantity" value={form.quantity} onChange={change('quantity')} placeholder={t('donation.estQtyPh')} className="input-field" />
            )}
          </div>
          {!isCash && (
            <div>
              <label htmlFor="donation-condition" className="mb-1 block text-sm font-medium">
                {t('donation.condition')}
              </label>
              <select id="donation-condition" value={form.itemCondition} onChange={change('itemCondition')} className="input-field">
                {DONATION_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {t(`donation.condition.${c}`)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-3">
            <label htmlFor="donation-description" className="mb-1 block text-sm font-medium">
              {t('donation.itemList')}
            </label>
            <textarea id="donation-description" rows={3} value={form.description} onChange={change('description')} placeholder={t('donation.itemListPh')} className="input-field" />
          </div>
        </div>
      </Step>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={reset} disabled={submitting} className="btn-secondary !py-2 text-sm">
          {t('common.cancel')}
        </button>
        <button type="submit" disabled={submitting} className="btn-primary !py-2 text-sm">
          <FiSend /> {submitting ? t('common.loading') : t('donation.submitRequest')}
        </button>
      </div>
    </form>
  );
};

export default DonationForm;
