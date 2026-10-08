import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import AuthShell from '../../components/layout/AuthShell';
import { PUROKS } from '../../utils/constants';

const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-medium">
      {label} <span className="text-red-500">*</span>
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [show, setShow] = useState(false);
  const { register: registerUser } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();

  const onSubmit = async ({ confirmPassword, agree, ...values }) => {
    try {
      await registerUser(values);
      toast.success('Registration received! Please check your email for the verification code.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Registration failed');
    }
  };

  const required = { required: t('common.required') };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <Field id="fullName" label={t('auth.fullName')} error={errors.fullName}>
          <input id="fullName" autoComplete="name" placeholder={t('auth.fullNamePh')} {...register('fullName', required)} className="input-field" />
        </Field>

        <Field id="email" label={t('auth.email')} error={errors.email}>
          <input id="email" type="email" autoComplete="email" placeholder={t('auth.emailPh')} {...register('email', required)} className="input-field" />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="phone" label={t('auth.phone')} error={errors.phone}>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel"
              placeholder={t('auth.phonePh')}
              {...register('phone', {
                ...required,
                pattern: { value: /^09\d{9}$/, message: 'Use 11 digits, e.g. 09171234567' },
              })}
              className="input-field"
            />
          </Field>
          <Field id="purok" label={t('auth.purok')} error={errors.purok}>
            <select id="purok" {...register('purok', required)} className="input-field">
              <option value="">—</option>
              {PUROKS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="password" label={t('auth.password')} error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.createPassword')}
              {...register('password', { ...required, minLength: { value: 8, message: t('auth.passwordHint') } })}
              className="input-field pr-10"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Toggle password visibility">
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {!errors.password && <p className="mt-1 text-xs text-gray-400">{t('auth.passwordHint')}</p>}
        </Field>

        <Field id="confirmPassword" label={t('auth.confirmPassword')} error={errors.confirmPassword}>
          <input
            id="confirmPassword"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('auth.confirmPasswordPh')}
            {...register('confirmPassword', { ...required, validate: (v) => v === watch('password') || 'Passwords do not match' })}
            className="input-field"
          />
        </Field>

        <label className="flex items-start gap-2 pt-1 text-xs text-gray-600 dark:text-gray-400">
          <input type="checkbox" {...register('agree', { required: true })} className="mt-0.5 h-4 w-4 accent-primary-600" />
          <span>
            {t('auth.agree')}{' '}
            <Link to="/terms" target="_blank" className="text-blue-600 hover:underline">
              {t('auth.terms')}
            </Link>{' '}
            {t('auth.and')}{' '}
            <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline">
              {t('auth.privacy')}
            </Link>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-red-500">{t('common.required')}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full !rounded-lg !py-3 text-lg">
          {isSubmitting ? t('common.loading') : t('auth.register')}
        </button>
      </form>

      <div className="mt-5 border-t-2 border-blue-200 pt-3 text-center text-sm dark:border-blue-900">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          {t('auth.login')}
        </Link>
      </div>
    </AuthShell>
  );
};

export default Register;
