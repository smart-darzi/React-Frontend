import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// This is the permanent i18next setup for the app. Pages migrate to it one
// at a time (Dashboard.jsx is the first / reference example) — pages not
// yet migrated keep working exactly as before via the old useLanguage()
// `t(en, ur)` pair helper in LanguageContext.jsx, since that context still
// exists and both systems stay in sync (see the sync effect in
// LanguageContext.jsx). Once every page is migrated, the old `t(en, ur)`
// helper in LanguageContext can be deleted and this becomes the only
// translation system in the app.
//
// Same storage key as LanguageContext.jsx so a page refresh keeps whichever
// language was last selected, regardless of which translation system reads
// it first.
const STORAGE_KEY = 'smartmaster_language';

const getInitialLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes output, so no double-escaping needed
    },
    // Keys read like "dashboard.title" / "stages.Cutting" — nested JSON
    // objects map directly to dot-separated keys.
    keySeparator: '.',
    nsSeparator: false, // strings like "Received By Customer" contain no ':' so this just avoids any accidental namespace-splitting
  });

export default i18n;
