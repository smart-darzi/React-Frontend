// Shared helpers for searching/highlighting customer phone numbers.
//
// Rule: when the search term looks like digits, it must match starting
// from the FIRST digit of the phone number (i.e. a "starts with" match,
// not "contains anywhere"). Example: searching "0349" matches
// "03490356584" but NOT "39490356584" or a number that merely contains
// "0349" somewhere in the middle.

export const isDigitsOnly = (term) => /^\d+$/.test(term.trim());

// Returns true if `phone` should show up for the given `term`.
export const matchesPhoneSearch = (phone, term) => {
  const phoneStr = (phone || '').toString();
  const trimmed = term.trim();
  if (!trimmed) return true;
  if (isDigitsOnly(trimmed)) {
    return phoneStr.startsWith(trimmed);
  }
  // Non-numeric search terms just fall back to a normal substring check
  // (covers people who paste a formatted number with dashes/spaces etc.)
  return phoneStr.includes(trimmed);
};

// Splits a phone number into [matchedPrefix, rest] so callers can render
// the matched digits highlighted. Returns { matched: '', rest: phone }
// when there's nothing to highlight.
export const splitPhoneMatch = (phone, term) => {
  const phoneStr = (phone || '').toString();
  const trimmed = term.trim();
  if (!trimmed || !isDigitsOnly(trimmed) || !phoneStr.startsWith(trimmed)) {
    return { matched: '', rest: phoneStr };
  }
  return { matched: phoneStr.slice(0, trimmed.length), rest: phoneStr.slice(trimmed.length) };
};
