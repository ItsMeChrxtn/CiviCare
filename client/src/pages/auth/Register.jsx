import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiHome,
  FiInfo,
  FiLogOut,
  FiMapPin,
  FiSmartphone,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import AuthShell from '../../components/layout/AuthShell';
import useSetting from '../../hooks/useSetting';
import { CIVIL_STATUS, DEFAULT_MAP_CENTER, PUROKS } from '../../utils/constants';

const STEPS = ['reg.stepPersonal', 'reg.stepAddress', 'reg.stepAccount'];
const STEP_FIELDS = [
  ['firstName', 'lastName', 'middleName', 'gender', 'civilStatus', 'birthdate'],
  ['street', 'purok', 'phone', 'residencySince'],
  ['email', 'password', 'confirmPassword', 'agree'],
];
// Radius around the barangay map center that counts as "inside Magdiwang" for the location check.
const RESIDENCY_RADIUS_KM = 2;
const GATE_KEY = 'civicare.registerGate';

const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const distanceKm = ([lat1, lng1], [lat2, lng2]) => {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Field = ({ id, label, error, optional, children }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
      {label} {!optional && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

/** "For residents only" confirmation shown before the form (reference: resident registration portal). */
const ResidentGate = ({ onContinue, onLeave, t }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
      <div className="bg-gradient-to-br from-[#1f3a5f] to-[#2c4a6e] px-6 pb-6 pt-8 text-center text-white">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl text-amber-400">
          <FiHome />
        </div>
        <p className="mt-4 text-sm font-bold tracking-[0.2em] text-amber-400">{t('reg.portal')}</p>
        <h2 id="gate-title" className="mt-2 font-display text-2xl font-extrabold">
          {t('reg.welcome')}
        </h2>
        <p className="mt-1 text-sm text-white/75">{t('reg.checkPlace')}</p>
      </div>
      <div className="space-y-3 p-6">
        <div className="rounded-xl border-l-4 border-amber-400 bg-gray-100 p-4 dark:bg-gray-800">
          <p className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
            <FiInfo className="shrink-0 text-[#1f3a5f] dark:text-blue-300" /> {t('reg.residentsOnly')}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('reg.residentsOnlyBody')}</p>
        </div>
        <button type="button" onClick={onContinue} className="btn-primary w-full !rounded-lg !py-3">
          <FiCheckCircle /> {t('reg.imResident')}
        </button>
        <button type="button" onClick={onLeave} className="btn-secondary w-full !rounded-lg !py-3">
          <FiLogOut className="rotate-180" /> {t('reg.notResident')}
        </button>
      </div>
    </div>
  </div>
);

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ shouldUnregister: false });
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [sinceBirth, setSinceBirth] = useState(false);
  const [geo, setGeo] = useState('idle'); // idle | checking | inside | outside | error
  const [gateOpen, setGateOpen] = useState(() => {
    try {
      return sessionStorage.getItem(GATE_KEY) !== 'ok';
    } catch {
      return true;
    }
  });
  const [general] = useSetting('general');
  const { register: registerUser } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();

  const today = localToday();
  const birthdate = watch('birthdate');

  // Keep "Since Birth" in sync if the birth date is edited after toggling it.
  useEffect(() => {
    if (sinceBirth) setValue('residencySince', birthdate || '');
  }, [sinceBirth, birthdate, setValue]);

  const continueAsResident = () => {
    try {
      sessionStorage.setItem(GATE_KEY, 'ok');
    } catch {
      /* private mode: the gate just shows again next visit */
    }
    setGateOpen(false);
  };

  const toggleSinceBirth = () => {
    setSinceBirth((v) => !v);
    if (sinceBirth) setValue('residencySince', '');
    clearErrors('residencySince');
  };

  const verifyResidency = () => {
    if (!navigator.geolocation) return setGeo('error');
    setGeo('checking');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const center = general?.mapCenter || DEFAULT_MAP_CENTER;
        setGeo(distanceKm([coords.latitude, coords.longitude], center) <= RESIDENCY_RADIUS_KM ? 'inside' : 'outside');
      },
      () => setGeo('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1);
  };

  const onSubmit = async ({ confirmPassword, agree, street, purok, residencySince, ...values }) => {
    try {
      await registerUser({
        ...values,
        address: { street, purok },
        residencySince: sinceBirth ? values.birthdate : residencySince,
        residentSinceBirth: sinceBirth,
      });
      toast.success('Registration received! Please check your email for the verification code.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Registration failed');
    }
  };

  const required = { required: t('common.required') };
  const notFuture = (v) => !v || v <= today || t('reg.futureDate');

  const barClass = (i) => (i < step ? 'bg-emerald-500' : i === step ? 'bg-[#1e3f99]' : 'bg-gray-200 dark:bg-gray-700');
  const labelClass = (i) =>
    i < step ? 'text-emerald-600 dark:text-emerald-400' : i === step ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400';

  return (
    <AuthShell>
      {gateOpen && <ResidentGate t={t} onContinue={continueAsResident} onLeave={() => navigate('/')} />}

      <div className="mb-5 flex items-start gap-2 rounded-xl bg-cyan-100 px-4 py-3 text-sm text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
        <FiInfo className="mt-0.5 shrink-0" />
        <span>
          {t('reg.trouble')}{' '}
          <Link to="/contact" className="font-semibold underline">
            {t('reg.contactUs')}
          </Link>
          .
        </span>
      </div>

      <h1 className="text-center font-display text-3xl font-extrabold text-gray-900 dark:text-white">{t('reg.title')}</h1>
      <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">{t('reg.subtitle')}</p>

      <ol className="mb-5 mt-5 grid grid-cols-3 gap-1.5" aria-label="Registration progress">
        {STEPS.map((key, i) => (
          <li key={key} aria-current={i === step ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors ${barClass(i)}`} />
            <p className={`mt-1.5 text-xs font-semibold ${labelClass(i)} ${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}`}>{t(key)}</p>
          </li>
        ))}
      </ol>

      <form
        onSubmit={
          step < 2
            ? (e) => {
                e.preventDefault();
                next();
              }
            : handleSubmit(onSubmit)
        }
        className="space-y-4"
        noValidate
      >
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field id="firstName" label={t('reg.firstName')} error={errors.firstName}>
                <input id="firstName" autoComplete="given-name" {...register('firstName', required)} className="input-field" />
              </Field>
              <Field id="lastName" label={t('reg.lastName')} error={errors.lastName}>
                <input id="lastName" autoComplete="family-name" {...register('lastName', required)} className="input-field" />
              </Field>
            </div>
            <Field id="middleName" label={t('reg.middleName')} optional>
              <input id="middleName" autoComplete="additional-name" {...register('middleName')} className="input-field" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="gender" label={t('reg.gender')} error={errors.gender}>
                <select id="gender" {...register('gender', required)} className="input-field">
                  <option value="">{t('reg.select')}</option>
                  {['male', 'female', 'other'].map((g) => (
                    <option key={g} value={g}>
                      {t(`reg.gender.${g}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="civilStatus" label={t('reg.civilStatus')} error={errors.civilStatus}>
                <select id="civilStatus" {...register('civilStatus', required)} className="input-field">
                  <option value="">{t('reg.select')}</option>
                  {CIVIL_STATUS.map((c) => (
                    <option key={c} value={c}>
                      {t(`reg.civil.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field id="birthdate" label={t('reg.birthDate')} error={errors.birthdate}>
              <input id="birthdate" type="date" max={today} autoComplete="bday" {...register('birthdate', { ...required, validate: notFuture })} className="input-field" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{t('reg.verification')}</p>
              <button
                type="button"
                onClick={verifyResidency}
                disabled={geo === 'checking'}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-400 px-4 py-2 font-semibold text-amber-600 transition hover:bg-amber-50 disabled:opacity-60 dark:text-amber-400 dark:hover:bg-amber-500/10"
              >
                <FiMapPin /> {geo === 'checking' ? t('reg.verifying') : t('reg.verify')}
              </button>
              {geo === 'inside' && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle /> {t('reg.verified')}
                </p>
              )}
              {geo === 'outside' && <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">{t('reg.outside')}</p>}
              {geo === 'error' && <p className="mt-1.5 text-xs text-gray-500">{t('reg.geoError')}</p>}
            </div>

            <Field id="street" label={t('reg.homeAddress')} error={errors.street}>
              <input id="street" autoComplete="street-address" placeholder={t('reg.homeAddressPh')} {...register('street', required)} className="input-field" />
            </Field>

            <Field id="purok" label={t('reg.purokZone')} error={errors.purok}>
              <select id="purok" {...register('purok', required)} className="input-field">
                <option value="">{t('reg.select')}</option>
                {PUROKS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="phone" label={t('reg.contact')} error={errors.phone}>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3.5 text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  <FiSmartphone />
                </span>
                <input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  placeholder="09XXXXXXXXX"
                  {...register('phone', { ...required, pattern: { value: /^09\d{9}$/, message: t('reg.contactInvalid') } })}
                  className="input-field !rounded-l-none"
                />
              </div>
              {!errors.phone && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('reg.contactHint1')} <b>09</b> {t('reg.contactHint2')} <b>{t('reg.contactHint3')}</b> (e.g. 09171234567).
                </p>
              )}
            </Field>

            <Field id="residencySince" label={t('reg.residencyDate')} error={errors.residencySince}>
              <div className="flex gap-2">
                <input
                  id="residencySince"
                  type="date"
                  max={today}
                  min={birthdate || undefined}
                  readOnly={sinceBirth}
                  {...register('residencySince', {
                    validate: (v) => {
                      if (sinceBirth) return true;
                      if (!v) return t('common.required');
                      if (birthdate && v < birthdate) return t('reg.beforeBirth');
                      return notFuture(v);
                    },
                  })}
                  className={`input-field flex-1 ${sinceBirth ? 'bg-gray-100 text-gray-500 dark:bg-gray-700' : ''}`}
                />
                <button
                  type="button"
                  onClick={toggleSinceBirth}
                  aria-pressed={sinceBirth}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
                    sinceBirth
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <FiHome /> {t('reg.sinceBirth')}
                </button>
              </div>
              {!errors.residencySince && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('reg.residencyHint')}</p>}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field id="email" label={t('auth.email')} error={errors.email}>
              <input id="email" type="email" autoComplete="email" placeholder={t('auth.emailPh')} {...register('email', required)} className="input-field" />
            </Field>

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
          </>
        )}

        <div className="flex gap-3 pt-1">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary !rounded-lg !py-3">
              <FiArrowLeft /> {t('reg.back')}
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 !rounded-lg !py-3 text-lg">
            {step < 2 ? (
              <>
                {t('reg.next')} <FiArrowRight />
              </>
            ) : isSubmitting ? (
              t('common.loading')
            ) : (
              t('auth.register')
            )}
          </button>
        </div>
      </form>

      <div className="mt-5 text-center text-sm">
        <p>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {t('reg.loginHere')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Register;
