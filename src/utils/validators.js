// Single source of truth for phone / email / password rules across the
// whole frontend — Add Customer, Worker sign-up, and Customer Portal
// sign-up/login all import from here so the same message and the same
// rule shows up everywhere, instead of each form having its own copy.

export const PHONE_REGEX = /^03\d{9}$/;

// Strips non-digits and caps at 11 characters as the user types — doesn't
// silently rewrite what they typed, just keeps it to digits.
export const cleanPhoneInput = (value) => value.replace(/\D/g, '').slice(0, 11);

export const validatePhone = (phone, { required = true } = {}) => {
  if (!phone) return required ? 'Phone number is required / فون نمبر درکار ہے' : null;
  if (!PHONE_REGEX.test(phone)) {
    return 'Invalid number format — must be 11 digits starting with 03 (e.g. 03XXXXXXXXX) / نمبر درست نہیں';
  }
  return null;
};

// Only Gmail addresses are allowed — applies to everyone, including admin.
export const EMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

export const validateEmail = (email, { required = true } = {}) => {
  if (!email) return required ? 'Email is required / ای میل درکار ہے' : null;
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Sirf @gmail.com email allowed hai / Only @gmail.com email addresses are allowed';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password zaroori hai';
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || /^(.)\1+$/.test(password)) {
    return 'Strong password enter karein — kam az kam 8 characters, letters aur numbers dono shamil hon';
  }
  return null;
};

// Design Number is stored as a Number in the DB (backend/model/orderSchema.js)
// — anything with a letter in it (e.g. "7r84") fails to save. Validated here
// so the form catches it immediately instead of a confusing save-time error.
export const validateDesignNumber = (value, { required = false } = {}) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return required ? 'Design number is required / ڈیزائن نمبر درکار ہے' : null;
  if (!/^\d+$/.test(trimmed)) {
    return 'Numbers only, no letters / صرف نمبر لکھیں، حروف نہیں';
  }
  return null;
};
