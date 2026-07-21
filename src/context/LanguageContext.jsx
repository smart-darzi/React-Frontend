import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // `tdLog(str)` — same idea as `td`, but for the backend-generated audit
  // log lines (Order History, "Admin sent guidance", etc.). Those are
  // written as "اردو phrase / clean English phrase" — the OPPOSITE order
  // from every other bilingual string in this app (which is always
  // "English / اردو"). Using `td` on a log line would pick the wrong half
  // for each language, so this picks from the correct side for these
  // specifically. Falls back to the original string if there's no " / "
  // separator to split on.
  const tdLog = (str) => {
    if (typeof str !== 'string') return str;
    const idx = str.lastIndexOf(' / ');
    if (idx === -1) return str;
    const first = str.slice(0, idx).trim();
    const second = str.slice(idx + 3).trim();
    return language === 'ur' ? first : second;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, td, tdLog }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
