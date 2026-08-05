import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Star, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DesignThumb from './DesignThumb';

// Usage: <DesignDetailModal design={d} relatedDesigns={[...]} onSelectRelated={fn} onClose={fn} />
// relatedDesigns/onSelectRelated are optional — omit both to show a plain
// detail view with no "Related Designs" section (used by the Worker Portal,
// where the point is reviewing the one design for this order, not browsing).
// onEdit/onDelete are also optional — only the admin Designs page passes
// these, so the edit/delete buttons only appear there. deleting mirrors the
// caller's in-flight delete state so the trash icon can show a spinner.
const DesignDetailModal = ({ design, relatedDesigns = [], onSelectRelated, onClose, onEdit, onDelete, deleting = false }) => {
  const [activeImage, setActiveImage] = useState(0);
  const { t, language } = useLanguage();

  // Reset back to the cover image whenever the modal switches to a
  // different design (e.g. tapping a related design).
  useEffect(() => { setActiveImage(0); }, [design?._id]);

  if (!design) return null;
  const images = design.images && design.images.length > 0 ? design.images : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-xl shadow-lg text-slate-600 transition-all z-10"
          >
            <X size={16} />
          </button>
          {design.isFeatured && (
            <span className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-white z-10">
              <Star size={10} fill="currentColor" /> {t('Featured', 'نمایاں')}
            </span>
          )}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
            {images[activeImage] ? (
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                <DesignThumb
                  src={images[activeImage].url}
                  alt={design.name}
                  className="w-full h-full object-cover object-center"
                  iconSize={28}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-100 border border-slate-100" />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(i => Math.max(0, i - 1))}
                  disabled={activeImage === 0}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-xl shadow-lg text-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/90"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImage(i => Math.min(images.length - 1, i + 1))}
                  disabled={activeImage === images.length - 1}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-xl shadow-lg text-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/90"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="absolute bottom-1.5 right-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-black/50 text-white backdrop-blur-sm">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
            {(onEdit || onDelete) && (
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(design); }}
                    className="p-1.5 bg-white/90 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(design); }}
                    disabled={deleting}
                    className="p-1.5 bg-white/90 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg disabled:opacity-40"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-1.5 px-6 pt-4 overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <DesignThumb src={img.url} className="w-full h-full object-cover" alt={`${design.name} ${i + 1}`} iconSize={14} />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                dir={language === 'ur' && design.nameUrdu ? 'rtl' : 'ltr'}
                className="text-lg font-black text-slate-800 uppercase tracking-tight"
              >
                {language === 'ur' && design.nameUrdu ? design.nameUrdu : design.name}
              </h2>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600">
                {(() => { const [cEn, cUr] = (design.category || '').split(' / '); return t(cEn, cUr || cEn); })()}
              </span>
            </div>
            {design.price !== null && design.price !== undefined && (
              <span className="text-primary font-black text-base whitespace-nowrap">Rs {design.price}</span>
            )}
          </div>

          {design.description && (
            <p
              dir={language === 'ur' && design.descriptionUrdu ? 'rtl' : 'ltr'}
              className="text-slate-500 text-sm font-medium"
            >
              {language === 'ur' && design.descriptionUrdu ? design.descriptionUrdu : design.description}
            </p>
          )}

          {relatedDesigns.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Related Designs', 'ملتے جلتے ڈیزائن')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {relatedDesigns.map(rd => (
                  <button
                    key={rd._id}
                    onClick={() => onSelectRelated(rd)}
                    className="rounded-xl overflow-hidden border-2 border-slate-100 hover:border-primary/40 transition-all text-left"
                  >
                    <DesignThumb src={rd.images?.[0]?.url} alt={rd.name} className="w-full h-16 object-cover" iconSize={16} />
                    <p dir={language === 'ur' && rd.nameUrdu ? 'rtl' : 'ltr'} className="text-[9px] font-black text-slate-700 uppercase truncate px-1.5 py-1">
                      {language === 'ur' && rd.nameUrdu ? rd.nameUrdu : rd.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignDetailModal;
