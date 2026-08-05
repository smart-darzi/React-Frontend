// Cycles any string (name, id, role) through a small palette so each row in
// a contact-list-style directory (Customers, Workers) gets a consistent but
// varied little colour accent — same idea as the little coloured icons next
// to each name in the reference mock, just built from the app's own teal
// family plus a couple of warm accents instead of arbitrary colours.
const BADGE_PALETTE = [
  { bg: '#0E606E', ring: '#0E606E33' }, // teal
  { bg: '#1C6B82', ring: '#1C6B8233' }, // deep teal-blue
  { bg: '#D9A441', ring: '#D9A44133' }, // gold/mustard
  { bg: '#4FA6B8', ring: '#4FA6B833' }, // light teal
  { bg: '#FF9E80', ring: '#FF9E8033' }, // coral/peach
  { bg: '#0A4A55', ring: '#0A4A5533' }, // dark teal
];

export const getBadgeColor = (seed = '') => {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return BADGE_PALETTE[hash % BADGE_PALETTE.length];
};
