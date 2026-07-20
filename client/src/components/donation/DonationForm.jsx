import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { DONATION_TYPES } from '../../utils/constants';

/** Pledge form shared by the public Donation page and the resident Donations dashboard. */
const DonationForm = ({ onSuccess }) => {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const [proofFile, setProofFile] = useState(null);
  const type = watch('type');

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => formData.append(key, val));
      if (proofFile) formData.append('proofImage', proofFile);

      await api.post('/donations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Thank you! Your donation pledge has been submitted.');
      reset();
      setProofFile(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit donation');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Donation Type</label>
        <select {...register('type', { required: true })} className="input-field capitalize">
          <option value="">Select type</option>
          {DONATION_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-xs text-red-500">Please select a donation type</p>}
      </div>

      {type === 'cash' ? (
        <div>
          <label className="mb-1 block text-sm font-medium">Amount (PHP)</label>
          <input type="number" min="1" step="0.01" {...register('amount', { required: true, min: 1 })} className="input-field" />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">Quantity / Description</label>
          <input placeholder="e.g. 20 sacks of rice" {...register('quantity')} className="input-field" />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Description (optional)</label>
        <textarea rows={3} {...register('description')} className="input-field" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Intended Beneficiary (optional)</label>
        <input placeholder="e.g. Flood victims - Purok 3" {...register('beneficiary')} className="input-field" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Proof / Photo (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} className="input-field" />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Pledge'}
      </button>
    </form>
  );
};

export default DonationForm;
