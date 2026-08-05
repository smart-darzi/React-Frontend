// Single source of truth for phone / email / password rules across the
// whole frontend — Add Customer, Worker sign-up, and Customer Portal
// sign-up/login all import from here so the same message and the same
// rule shows up everywhere, instead of each form having its own copy.
//
// Every message is read from i18next (see locales/en.json /
// locales/ur.json under the "validation" key) so only the currently
// selected language is ever shown — never both English and Urdu (or
// Roman Urdu) glued together in the same string. Callers pass in the
// `t` function from react-i18next's `useTranslation()`; if it's omitted
// (e.g. a call site not yet updated) we fall back to plain English so
// nothing breaks, but every caller in this codebase now passes `t`.

export const PHONE_REGEX = /^03\d{9}$/;

// Strips non-digits and caps at 11 characters as the user types — doesn't
// silently rewrite what they typed, just keeps it to digits.
export const cleanPhoneInput = (value) => value.replace(/\D/g, '').slice(0, 11);

const fallback = (t) => t || ((key, defaultValue) => defaultValue);

export const validatePhone = (phone, { required = true, t } = {}) => {
  const tr = fallback(t);
  if (!phone) return required ? tr('validation.phoneRequired', 'Phone number is required') : null;
  if (!PHONE_REGEX.test(phone)) {
    return tr('validation.phoneInvalid', 'Invalid number format — must be 11 digits starting with 03 (e.g. 03XXXXXXXXX)');
  }
  return null;
};

// Only Gmail addresses are allowed — applies to everyone, including admin.
export const EMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

export const validateEmail = (email, { required = true, t } = {}) => {
  const tr = fallback(t);
  if (!email) return required ? tr('validation.emailRequired', 'Email is required') : null;
  if (!EMAIL_REGEX.test(email.trim())) {
    return tr('validation.emailGmailOnly', 'Only @gmail.com email addresses are allowed');
  }
  return null;
};

export const validatePassword = (password, { t } = {}) => {
  const tr = fallback(t);
  if (!password) return tr('validation.passwordRequired', 'Password is required');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || /^(.)\1+$/.test(password)) {
    return tr('validation.passwordWeak', 'Enter a strong password — at least 8 characters, including both letters and numbers');
  }
  return null;
};

// Design Number is stored as a Number in the DB (backend/model/orderSchema.js)
// — anything with a letter in it (e.g. "7r84") fails to save. Validated here
// so the form catches it immediately instead of a confusing save-time error.
export const validateDesignNumber = (value, { required = false, t } = {}) => {
  const tr = fallback(t);
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return required ? tr('validation.designNumberRequired', 'Design number is required') : null;
  if (!/^\d+$/.test(trimmed)) {
    return tr('validation.designNumberInvalid', 'Numbers only, no letters allowed');
  }
  return null;
};
