import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Shared pager used across every paginated admin list (Designs, Workers,
// Customers, Worker History/Detail) so pagination looks and behaves
// identically everywhere: "‹ Previous   [page]   Next ›", with the current
// page number in a small teal badge, sitting at the end (right) of its row.
const PaginationControls = ({ currentPage, totalPages, onPrev, onNext, className = '' }) => {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage === 1}
        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400"
      >
        <ChevronLeft size={13} />
        {t('Previous', 'پچھلا')}
      </button>

      <span className="flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-lg text-xs font-black text-white bg-primary shadow-sm">
        {currentPage}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400"
      >
        {t('Next', 'اگلا')}
        <ChevronRight size={13} />
      </button>
    </div>
  );
};

export default PaginationControls;
