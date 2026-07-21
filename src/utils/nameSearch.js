// Shared helpers for searching/highlighting customer names.
//
// Problem this fixes: a plain "includes" match (e.g. searching "Tahir")
// was ranking every customer whose name merely *contains* those letters
// the same way — so "Tahir", "Amina Tahir" and "Tahira Bibi" all looked
// like an equally-good match and got jumbled together in whatever order
// the database happened to return them in. This gives exact / whole-word
// matches priority so a standalone "Tahir" and "Amina Tahir" both show up
// clearly (instead of getting buried under unrelated partial matches),
// and provides a highlighter so the matched part of the name is visible.

const norm = (v) => (v || '').toString().trim();

export const matchesNameSearch = (name, term) => {
  const trimmed = norm(term);
  if (!trimmed) return true;
  return norm(name).toLowerCase().includes(trimmed.toLowerCase());
};

// Lower number = better match.
// 0: name is exactly the search term ("Tahir" === "Tahir")
// 1: one whole word of the name equals the search term ("Tahir" inside "Amina Tahir")
// 2: name or a word starts with the search term ("Tahi" -> "Tahir Bhai")
// 3: search term appears anywhere in the name ("Tahir" -> "Mukhtahir")
// 4: no match
export const nameMatchRank = (name, term) => {
  const trimmed = norm(term).toLowerCase();
  if (!trimmed) return 4;
  const nameStr = norm(name).toLowerCase();
  if (!nameStr) return 4;

  if (nameStr === trimmed) return 0;

  const words = nameStr.split(/\s+/).filter(Boolean);
  if (words.includes(trimmed)) return 1;
  if (nameStr.startsWith(trimmed) || words.some(w => w.startsWith(trimmed))) return 2;
  if (nameStr.includes(trimmed)) return 3;
  return 4;
};

// Sorts customers so the closest name matches (exact word matches like a
// standalone "Tahir") come before loose/partial matches (like "Amina
// Tahir" or "Tahira"), with alphabetical order as a tie-breaker.
export const sortByNameMatch = (customers, term) => {
  const trimmed = norm(term);
  if (!trimmed) return customers;
  return [...customers].sort((a, b) => {
    const diff = nameMatchRank(a.name, trimmed) - nameMatchRank(b.name, trimmed);
    if (diff !== 0) return diff;
    return norm(a.name).localeCompare(norm(b.name));
  });
};

// Splits a name into segments around every occurrence of the search term
// so callers can render the matched part highlighted, e.g.:
// highlightNameMatch('Amina Tahir', 'Tahir')
//   -> [{ text: 'Amina ', match: false }, { text: 'Tahir', match: true }]
export const highlightNameMatch = (name, term) => {
  const nameStr = norm(name);
  const trimmed = norm(term);
  if (!trimmed) return [{ text: nameStr, match: false }];

  const lowerName = nameStr.toLowerCase();
  const lowerTerm = trimmed.toLowerCase();
  const idx0 = lowerName.indexOf(lowerTerm);
  if (idx0 === -1) return [{ text: nameStr, match: false }];

  const segments = [];
  let start = 0;
  let idx = idx0;
  while (idx !== -1) {
    if (idx > start) segments.push({ text: nameStr.slice(start, idx), match: false });
    segments.push({ text: nameStr.slice(idx, idx + trimmed.length), match: true });
    start = idx + trimmed.length;
    idx = lowerName.indexOf(lowerTerm, start);
  }
  if (start < nameStr.length) segments.push({ text: nameStr.slice(start), match: false });
  return segments;
};
