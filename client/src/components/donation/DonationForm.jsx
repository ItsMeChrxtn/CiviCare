import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import { DONATION_PRESETS } from '../../utils/constants';

/**
 * "Make a Donation Pledge" form used in the resident Donations page.
 * Panel revision: residents tick commonly donated items from a preset checklist (plus cash or "others").
 * Ticked items are grouped by donation type and sent as one pledge per type, so officials can track each.
 */
const DonationForm = ({ onSuccess }) => {
  const { t, lang } = usePreferences();
  const [checked, setChecked] = useState({}); // preset key -> quantity text
  const [cash, setCash] = useState({ on: false, amount: '' });
  const [others, setOthers] = useState('');
  const [description, setDescription] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key) =>
    setChecked((c) => {
      const next = { ...c };
      if (key in next) delete next[key];
      else next[key] = '';
      return next;
    });

  const send = (fields) => {
    const formData = new FormData();
    Object.entries({ ...fields, description, beneficiary }).forEach(([key, val]) => {
      if (val !== undefined && val !== '') formData.append(key, val);
    });
    if (proofFile) formData.append('proofImage', proofFile);
    return api.post('/donations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const byType = {};
    DONATION_PRESETS.filter((p) => p.key in checked).forEach((p) => {
      const qty = checked[p.key].trim();
      (byType[p.type] ||= []).push(qty ? `${p.label} (${qty})` : p.label);
    });
    if (others.trim()) (byType.goods ||= []).push(others.trim());

    if (cash.on && !(Number(cash.amount) > 0)) return toast.error(t('donation.amountRequired'));
    if (!cash.on && !Object.keys(byType).length) return toast.error(t('donation.chooseOne'));

    setSubmitting(true);
    try {
      await Promise.all([
        ...(cash.on ? [send({ type: 'cash', amount: cash.amount })] : []),
        ...Object.entries(byType).map(([type, items]) => send({ type, quantity: items.join(', ') })),
      ]);
      toast.success(t('donation.thanks'));
      setChecked({});
      setCash({ on: false, amount: '' });
      setOthers('');
      setDescription('');
      setBeneficiary('');
      setProofFile(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('donation.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset>
        <legend className="mb-2 block text-sm font-medium">{t('donation.checklist')}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DONATION_PRESETS.map((p) => {
            const on = p.key in checked;
            return (
              <div key={p.key} className={`rounded-xl border p-2.5 transition ${on ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={on} onChange={() => toggle(p.key)} className="h-4 w-4 accent-primary-600" />
                  {lang === 'tl' ? p.labelTl : p.label}
                </label>
                {on && (
                  <input
                    value={checked[p.key]}
                    onChange={(e) => setChecked((c) => ({ ...c, [p.key]: e.target.value }))}
                    placeholder={t('donation.qtyPh')}
                    className="input-field mt-2 !py-1.5 text-xs"
                    aria-label={`${p.label} — ${t('donation.qtyPh')}`}
                  />
                )}
              </div>
            );
          })}

          <div className={`rounded-xl border p-2.5 transition ${cash.on ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={cash.on} onChange={() => setCash((c) => ({ ...c, on: !c.on }))} className="h-4 w-4 accent-primary-600" />
              {t('donation.type.cash')}
            </label>
            {cash.on && (
              <input
                type="number"
                min="1"
                step="0.01"
                value={cash.amount}
                onChange={(e) => setCash((c) => ({ ...c, amount: e.target.value }))}
                placeholder={t('donation.amount')}
                className="input-field mt-2 !py-1.5 text-xs"
                aria-label={t('donation.amount')}
              />
            )}
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="donation-others" className="mb-1 block text-sm font-medium">
          {t('donation.others')}
        </label>
        <input id="donation-others" value={others} onChange={(e) => setOthers(e.target.value)} placeholder={t('donation.quantityPh')} className="input-field" />
      </div>

      <div>
        <label htmlFor="donation-description" className="mb-1 block text-sm font-medium">
          {t('donation.description')}
        </label>
        <textarea id="donation-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
      </div>

      <div>
        <label htmlFor="donation-beneficiary" className="mb-1 block text-sm font-medium">
          {t('donation.beneficiary')}
        </label>
        <input id="donation-beneficiary" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder={t('donation.beneficiaryPh')} className="input-field" />
      </div>

      <div>
        <label htmlFor="donation-proof" className="mb-1 block text-sm font-medium">
          {t('donation.proof')}
        </label>
        <input id="donation-proof" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0] || null)} className="input-field" />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? t('common.loading') : t('donation.submit')}
      </button>
    </form>
  );
};

export default DonationForm;
