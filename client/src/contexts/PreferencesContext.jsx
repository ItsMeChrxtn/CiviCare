import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const PreferencesContext = createContext(null);
const STORAGE_KEY = 'civicare-preferences';
const MAX_TEXT_SIZE = 2; // 0 normal, 1 large, 2 extra large

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
  const [prefs, setPrefs] = useState(() => {
    const stored = readStored();
    // Older saves used a boolean largeText; map it onto the 3-step text size.
    const textSize = stored.textSize ?? (stored.largeText ? 1 : 0);
    return { lang: 'en', highContrast: false, ...stored, textSize };
  });

  // English/Tagalog is for residents (clients) only; the officials/admin portal stays in English.
  const [englishOnly, setEnglishOnly] = useState(false);
  const lang = englishOnly ? 'en' : prefs.lang;

  useEffect(() => {
    document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-large', prefs.textSize === 1);
    root.classList.toggle('a11y-xlarge', prefs.textSize === 2);
    root.classList.toggle('a11y-contrast', prefs.highContrast);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable (private mode) - preferences just won't persist
    }
  }, [prefs]);

  const t = useCallback(
    (key, vars, fallback) => {
      const template = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? (fallback !== undefined ? fallback : key);
      if (!vars || typeof template !== 'string') return template;
      return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : `{${name}}`));
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      ...prefs,
      lang,
      t,
      setEnglishOnly,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      toggleLang: () => setPrefs((p) => ({ ...p, lang: p.lang === 'en' ? 'tl' : 'en' })),
      largeText: prefs.textSize > 0,
      setTextSize: (size) => setPrefs((p) => ({ ...p, textSize: Math.min(Math.max(size, 0), MAX_TEXT_SIZE) })),
      toggleHighContrast: () => setPrefs((p) => ({ ...p, highContrast: !p.highContrast })),
    }),
    [prefs, lang, t]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
