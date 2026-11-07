import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiMail, FiClock, FiCheck } from 'react-icons/fi';
import { usePreferences } from '../../contexts/PreferencesContext';
import api from '../../utils/api';

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: location.state?.email || '', code: '' } });
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [underReview, setUnderReview] = useState(false);
  const { t } = usePreferences();

  const onSubmit = async ({ email, code }) => {
    try {
      const { data } = await api.post('/auth/verify-email', { email, code });
      // Panel revision: new accounts wait for an official to verify their proof of residency.
      if (data.data?.approvalStatus === 'pending') {
        setUnderReview(true);
        return;
      }
      toast.success('Email verified! You may now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const onResend = async () => {
    const email = getValues('email');
    if (!email) return toast.error('Enter your email first');

    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification code resent. Check your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (underReview) {
    return (
      <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 -z-10 bg-radial-fade" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8 text-center shadow-card-hover" role="status">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <FiClock className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{t('reg.reviewTitle')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('reg.reviewBody')}</p>
          <ol className="mt-5 space-y-2 text-left text-sm">
            {['reg.reviewStep1', 'reg.reviewStep2', 'reg.reviewStep3'].map((key, i) => (
              <li key={key} className="flex items-start gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${i === 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  {i === 0 ? <FiCheck /> : i + 1}
                </span>
                {t(key)}
              </li>
            ))}
          </ol>
          <Link to="/" className="btn-primary mt-6 w-full">
            {t('reg.reviewBack')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />

      <Link to="/" className="mb-6 flex items-center gap-2.5 font-display font-extrabold text-primary-700 dark:text-primary-400">
        <img src="/favicon.svg" alt="CiviCare" className="h-9 w-9" />
        <span className="text-xl">CiviCare</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8 shadow-card-hover">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <FiMail className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-extrabold tracking-tight">Verify Your Email</h1>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter the 6-digit code we sent to your email address.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input-field"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Verification Code</label>
            <input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              {...register('code', {
                required: 'Code is required',
                pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
              })}
              className="input-field text-center text-lg tracking-[0.5em]"
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={onResend}
            disabled={isResending || cooldown > 0}
            className="font-semibold text-primary-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline dark:text-primary-400"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
