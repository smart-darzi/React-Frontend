import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import { transliterateRomanUrdu } from '../utils/transliterate';

// App-wide English/Urdu toggle. The whole app's bilingual strings already
// carry both languages ("Dashboard / ڈیش بورڈ"), so switching languages here
// means picking one half of that pair to actually render, everywhere, via
// the `t(en, ur)` helper below — not translating anything new.
//
// Numbers (prices, phone numbers, counts) are intentionally never touched
// by this — they stay as plain digits in both languages, since Urdu-locale
// numerals aren't used anywhere in this app.
const LanguageContext = createContext(null);

const STORAGE_KEY = 'smartmaster_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* ignore */ }
    // Keep i18next (used by pages migrated to react-i18next, e.g.
    // Dashboard.jsx) pointed at the same language as the old t(en, ur)
    // system below — so the single toggle button in Topbar switches both
    // at once, regardless of which system a given page uses.
    i18n.changeLanguage(language);
    // NOTE: `dir` is intentionally NOT flipped at the document level here.
    // The app already marks individual pure-Urdu fields with their own
    // dir="rtl" (design Urdu names, the Urdu keyboard, etc. — see
    // index.css's `[dir="rtl"]` rule). Flipping the whole document to rtl
    // on top of that reversed the entire page's flex layout — including
    // the sidebar, which jumped from the left to the right edge of the
    // screen every time the language was switched. Keeping the document
    // itself always ltr means the app's structure (sidebar, topbar,
    // cards) stays put, while Urdu glyphs still render correctly
    // right-to-left at the character level wherever they appear.
    document.documentElement.lang = language === 'ur' ? 'ur' : 'en';
  }, [language]);

  // `t(en, ur)` — pass the English and Urdu versions of a string, get back
  // whichever one matches the current language. Falls back to whichever
  // one exists if only one was provided.
  const t = (en, ur) => (language === 'ur' ? (ur ?? en) : (en ?? ur));

  // `td(str)` — for DATA values that are already saved as a single combined
  // "English / اردو" string (order type, pant style, worker role, etc.),
  // picks out just the half that matches the current language so the two
  // scripts don't show mixed together on screen. Safe to call on anything:
  // strings without the " / " separator (free-typed values) are returned
  // unchanged, and non-strings pass through untouched.
  const td = (str) => {
    if (typeof str !== 'string') return str;
    const parts = str.split(' / ');
    if (parts.length !== 2) return str;
    const [en, ur] = parts;
    return language === 'ur' ? ur.trim() : en.trim();
  };

  // `tdLog(str)` — for orderHistory / timeline entries coming from the
  // backend, which are saved as "<Urdu line> / <English line>" (Urdu half
  // FIRST — the opposite order of `td`'s "English / Urdu" data values).
  // Picks out just the half matching the current language, so a timeline
  // entry never shows Urdu and English glued together on screen. Safe to
  // call on anything: strings without the " / " separator (e.g. old,
  // pre-refactor Roman-Urdu-only entries saved before this convention
  // existed) are returned unchanged, and non-strings pass through untouched.
  const tdLog = (str) => {
    if (typeof str !== 'string') return str;
    const parts = str.split(' / ');
    if (parts.length !== 2) return str;
    const [ur, en] = parts;
    return language === 'ur' ? ur.trim() : en.trim();
  };

  // `tn(name)` — for freely-typed PEOPLE names (customer, worker, admin).
  // Unlike td()/tdLog(), there's no pre-written Urdu half stored anywhere —
  // the name was typed once, in Roman script, at signup. In Urdu mode this
  // runs it through a best-effort phonetic transliteration instead; in
  // English mode it's returned unchanged. Not a translation (names aren't
  // translated) — a script guess, so it won't always be 100% accurate.
  const tn = (name) => (language === 'ur' ? transliterateRomanUrdu(name) : name);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, td, tdLog, tn }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
