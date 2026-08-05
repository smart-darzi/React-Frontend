import React from 'react';
import { highlightNameMatch } from '../utils/nameSearch';
import { useLanguage } from '../context/LanguageContext';

// Highlights the matched portion of a design/order name — same treatment
// used on the Admin's Customers/Designs search, reused on the Customer and
// Worker portals' Browse Designs search for consistency.
//
// isPersonName: set true for customer/worker names (freely-typed, Roman
// script only). In Urdu mode these get run through tn() and shown plain —
// highlighting is skipped because the search term is still typed in Roman
// and won't substring-match the transliterated Urdu text. Design names are
// left at their default (false): those already carry an authored Urdu
// translation elsewhere (design.nameUrdu) and shouldn't be re-guessed here.
const HighlightedName = ({ name, term, isPersonName = false }) => {
  const { language, tn } = useLanguage();

  if (isPersonName && language === 'ur') {
    return <>{tn(name)}</>;
  }

  return (
    <>
      {highlightNameMatch(name, term).map((seg, i) =>
        seg.match
          ? <span key={i} className="bg-yellow-200 text-slate-800 rounded px-0.5">{seg.text}</span>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  );
};

export default HighlightedName;
