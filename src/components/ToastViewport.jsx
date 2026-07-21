import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const STYLES = {
  success: { bg: 'bg-emerald-500', icon: CheckCircle2 },
  error:   { bg: 'bg-red-500',     icon: AlertTriangle },
  info:    { bg: 'bg-indigo-500',  icon: Info },
};

// Fixed top-right stack, rendered once at the root of the app (see App.jsx)
// so a toast fired from anywhere — any page, any CRUD action — shows up on
// top of whatever the user is currently looking at.
const ToastViewport = () => {
  const ctx = useToast();
  if (!ctx) return null;
  const { toasts, dismissToast } = ctx;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const { bg, icon: Icon } = STYLES[t.type] || STYLES.success;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto ${bg} text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3`}
            >
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-bold leading-snug">{t.message}</p>
              <button
                onClick={() => dismissToast(t.id)}
                className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastViewport;
