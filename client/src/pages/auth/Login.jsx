import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import AuthShell from '../../components/layout/AuthShell';
import { IDLE_FLAG_KEY } from '../../hooks/useIdleLogout';

const REMEMBER_KEY = 'civicare-remembered-email';
const roleHome = (role) => (role === 'resident' ? '/resident' : role === 'official' ? '/official' : '/admin');

const readRemembered = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
};

// Shown once after an idle session was ended automatically.
const takeIdleFlag = () => {
  try {
    const flagged = sessionStorage.getItem(IDLE_FLAG_KEY) === '1';
    sessionStorage.removeItem(IDLE_FLAG_KEY);
    return flagged;
  } catch {
    return false;
  }
};

const Login = () => {
  const remembered = readRemembered();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: remembered, remember: Boolean(remembered) } });
  const [showPassword, setShowPassword] = useState(false);
  const [review, setReview] = useState(null); // account under review / rejected / locked notice
  const [idleNotice] = useState(takeIdleFlag);
  const { login } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async ({ email, password, remember }) => {
    setReview(null);
    try {
      const user = await login(email, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // storage unavailable - nothing to remember
      }
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(location.state?.from?.pathname || roleHome(user.role), { replace: true });
    } catch (err) {
      const code = err.response?.data?.errors?.[0]?.code;
      // Panel revision: a temporarily locked account gets a lasting notice, not just a toast.
      if (err.response?.status === 423) {
        setReview({ code: 'ACCOUNT_LOCKED', message: err.response.data.message });
        return;
      }
      if (code === 'ACCOUNT_UNDER_REVIEW' || code === 'ACCOUNT_REJECTED') {
        setReview({ code, message: err.response.data.message });
        return;
      }
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <AuthShell>
      {idleNotice && !review && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-sky-100 px-4 py-3 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
          <FiClock className="mt-0.5 shrink-0" />
          <span>{t('auth.idleSignedOut')}</span>
        </div>
      )}
      {review && (
        <div
          role="alert"
          className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            review.code === 'ACCOUNT_UNDER_REVIEW' ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200' : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200'
          }`}
        >
          <FiClock className="mt-0.5 shrink-0" />
          <span>
            <b className="block">
              {review.code === 'ACCOUNT_UNDER_REVIEW' ? t('reg.reviewTitle') : review.code === 'ACCOUNT_LOCKED' ? t('auth.lockedTitle') : t('reg.rejectedTitle')}
            </b>
            {review.message}
          </span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t('auth.email')}
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPh')}
              {...register('email', { required: t('common.required') })}
              className="input-field pr-10"
            />
            <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.passwordPh')}
              {...register('password', { required: t('common.required') })}
              className="input-field pr-16"
            />
            <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('remember')} className="h-4 w-4 accent-primary-600" />
            {t('auth.remember')}
          </label>
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            {t('auth.forgot')}
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full !rounded-lg !py-3 text-lg tracking-wide">
          {isSubmitting ? t('common.loading') : t('auth.loginBtn')}
        </button>
      </form>

      <div className="mt-6 border-t-2 border-blue-200 pt-4 text-center text-sm dark:border-blue-900">
        <p className="text-gray-600 dark:text-gray-400">{t('auth.noAccount')}</p>
        <Link to="/register" className="mt-1 inline-block font-semibold text-blue-600 hover:underline dark:text-blue-400">
          {t('auth.registerHere')}
        </Link>
      </div>
    </AuthShell>
  );
};

export default Login;
