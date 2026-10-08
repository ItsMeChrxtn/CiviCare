import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const PreferencesContext = createContext(null);
const STORAGE_KEY = 'civicare-preferences';

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

/**
 * Bilingual (English/Tagalog) + accessibility mode (larger text, high contrast).
 * Dark theme stays in ThemeContext. Preferences are per-device, stored locally.
 */
export const PreferencesProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(() => ({ lang: 'en', largeText: false, highContrast: false, ...readStored() }));

  useEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.lang === 'tl' ? 'tl' : 'en';
    root.classList.toggle('a11y-large', prefs.largeText);
    root.classList.toggle('a11y-contrast', prefs.highContrast);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable (private mode) - preferences just won't persist
    }
  }, [prefs]);

  const t = useCallback(
    (key, vars, fallback) => {
      const template = TRANSLATIONS[prefs.lang]?.[key] ?? TRANSLATIONS.en[key] ?? (fallback !== undefined ? fallback : key);
      if (!vars || typeof template !== 'string') return template;
      return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : `{${name}}`));
    },
    [prefs.lang]
  );

  const value = useMemo(
    () => ({
      ...prefs,
      t,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      toggleLang: () => setPrefs((p) => ({ ...p, lang: p.lang === 'en' ? 'tl' : 'en' })),
      toggleLargeText: () => setPrefs((p) => ({ ...p, largeText: !p.largeText })),
      toggleHighContrast: () => setPrefs((p) => ({ ...p, highContrast: !p.highContrast })),
    }),
    [prefs, t]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
