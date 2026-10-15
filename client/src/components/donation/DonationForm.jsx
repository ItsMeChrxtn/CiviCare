import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import { DONATION_TYPES } from '../../utils/constants';

/** "Make a Donation Pledge" form used in the resident Donations page. */
const DonationForm = ({ onSuccess }) => {
  const { t } = usePreferences();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { type: 'medicine' } });
  const [proofFile, setProofFile] = useState(null);
  const type = watch('type');

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== '') formData.append(key, val);
      });
      if (proofFile) formData.append('proofImage', proofFile);

      await api.post('/donations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('donation.thanks'));
      reset();
      setProofFile(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('donation.failed'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="donation-type" className="mb-1 block text-sm font-medium">
          {t('donation.type')}
        </label>
        <select id="donation-type" {...register('type', { required: true })} className="input-field">
          {DONATION_TYPES.map((d) => (
            <option key={d} value={d}>
              {t(`donation.type.${d}`)}
            </option>
          ))}
        </select>
      </div>

      {type === 'cash' ? (
        <div>
          <label htmlFor="donation-amount" className="mb-1 block text-sm font-medium">
            {t('donation.amount')}
          </label>
          <input id="donation-amount" type="number" min="1" step="0.01" {...register('amount', { required: true, min: 1 })} className="input-field" />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{t('common.required')}</p>}
        </div>
      ) : (
        <div>
          <label htmlFor="donation-quantity" className="mb-1 block text-sm font-medium">
            {t('donation.quantity')}
          </label>
          <input id="donation-quantity" placeholder={t('donation.quantityPh')} {...register('quantity', { required: true })} className="input-field" />
          {errors.quantity && <p className="mt-1 text-xs text-red-500">{t('common.required')}</p>}
        </div>
      )}

      <div>
        <label htmlFor="donation-description" className="mb-1 block text-sm font-medium">
          {t('donation.description')}
        </label>
        <textarea id="donation-description" rows={3} {...register('description')} className="input-field" />
      </div>

      <div>
        <label htmlFor="donation-beneficiary" className="mb-1 block text-sm font-medium">
          {t('donation.beneficiary')}
        </label>
        <input id="donation-beneficiary" placeholder={t('donation.beneficiaryPh')} {...register('beneficiary')} className="input-field" />
      </div>

      <div>
        <label htmlFor="donation-proof" className="mb-1 block text-sm font-medium">
          {t('donation.proof')}
        </label>
        <input id="donation-proof" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} className="input-field" />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? t('common.loading') : t('donation.submit')}
      </button>
    </form>
  );
};

export default DonationForm;
