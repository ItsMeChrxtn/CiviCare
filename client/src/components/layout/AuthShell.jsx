import { Link, NavLink } from 'react-router-dom';
import { FiArrowLeft, FiGlobe } from 'react-icons/fi';
import { usePreferences } from '../../contexts/PreferencesContext';

/** Shared Login/Register frame: logo panel on the left, tabbed card on the right (docu Figures 4-5). */
const AuthShell = ({ children, showTabs = true }) => {
  const { t, lang, toggleLang } = usePreferences();

  const tab = ({ isActive }) =>
    `flex-1 rounded-t-2xl py-3 text-center font-display text-xl font-semibold transition ${
      isActive ? 'bg-brand-green text-white' : 'bg-[#fbf8ec] text-gray-800 hover:bg-[#f3eeda] dark:bg-gray-800 dark:text-gray-100'
    }`;

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-brand-sand dark:bg-gray-950 lg:flex-row">
      {/* Barangay Magdiwang seal as the page background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <img
          src="/magdiwang-logo.jpeg"
          alt=""
          className="h-[120vmin] w-[120vmin] max-w-none rounded-full object-cover opacity-[0.12] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen"
        />
      </div>
      {/* Panel revision: explicit way back to the landing page */}
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-soft transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <FiArrowLeft /> {t('auth.backToLanding')}
      </Link>
      <button
        onClick={toggleLang}
        className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-black/5 dark:text-gray-300"
      >
        <FiGlobe /> {lang.toUpperCase()}
      </button>
      <div className="relative flex flex-col items-center justify-center px-6 pb-10 pt-20 lg:w-1/2 lg:py-10">
        <Link to="/" className="flex flex-col items-center">
          <div className="flex items-center gap-4">
            <img src="/magdiwang-logo.jpeg" alt="Barangay Magdiwang seal" className="h-28 w-28 rounded-full object-cover shadow-card sm:h-36 sm:w-36" />
            <img src="/civicare-logo.svg" alt="CiviCare" className="h-28 w-auto sm:h-36" />
          </div>
          <span className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-[#1e3f99]">Civi</span>
            <span className="text-[#2f9a3a]">Care</span>
          </span>
          <span className="mt-1 border-t border-gray-400 pt-1 text-xs font-semibold tracking-[0.25em] text-gray-600 dark:text-gray-400">
            {t('auth.tagline')}
          </span>
          <span className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Barangay Magdiwang, Noveleta, Cavite</span>
        </Link>
        <p className="mt-10 text-sm text-gray-600 dark:text-gray-400 lg:absolute lg:bottom-6 lg:left-8 lg:mt-0">© 2026 CIVICARE</p>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pb-10 lg:items-center lg:py-10">
        <div className="w-full max-w-md">
          {showTabs && (
            <div className="flex gap-1">
              <NavLink to="/login" className={tab}>
                {t('auth.login')}
              </NavLink>
              <NavLink to="/register" className={tab}>
                {t('auth.register')}
              </NavLink>
            </div>
          )}
          <div className={`bg-[#fffdf5] p-6 shadow-card dark:bg-gray-900 sm:p-8 ${showTabs ? 'rounded-b-2xl' : 'rounded-2xl'}`}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
