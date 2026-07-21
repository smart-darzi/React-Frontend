import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HardHat, X, UserCheck, Phone, Mail, Briefcase, Loader2 } from 'lucide-react';
import { useLocalState } from '../context/useLocalState';

// Shown on top of any admin page as soon as a worker creates their own
// (pending) account. Shows the worker's submitted details right there and
// lets the admin approve — and grant portal access — in one click, without
// having to leave the page they're on.
const NewWorkerAlert = () => {
  const { pendingWorkerAlerts, dismissWorkerAlert, approveWorker } = useLocalState();
  const navigate = useNavigate();
  const [approvingId, setApprovingId] = useState(null);

  if (!pendingWorkerAlerts || pendingWorkerAlerts.length === 0) return null;

  const handleApprove = async (worker) => {
    setApprovingId(worker._id);
    try {
      await approveWorker(worker._id);
      dismissWorkerAlert(worker._id);
    } catch {
      alert('Worker approve karne mein masla hua. Workers page se try karein.');
    } finally {
      setApprovingId(null);
    }
  };

  const viewInWorkers = (worker) => {
    dismissWorkerAlert(worker._id);
    navigate('/workers');
  };

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm">
      <AnimatePresence>
        {pendingWorkerAlerts.map(worker => (
          <motion.div
            key={worker._id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className="glass-card bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                <HardHat size={22} />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Naya Worker Aaya Hai!</p>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  Portal access ka intezar kar raha hai — details neeche check karein.
                </p>
              </div>
              <button
                onClick={() => dismissWorkerAlert(worker._id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>

            {/* Worker's submitted details — everything the admin needs to
                decide, right here in the popup. */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="font-black text-slate-800 text-base">{worker.name}</p>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Briefcase size={13} className="text-primary flex-shrink-0" /> {worker.role}
              </div>
              {worker.phone && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Phone size={13} className="text-primary flex-shrink-0" /> {worker.phone}
                </div>
              )}
              {worker.email && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Mail size={13} className="text-primary flex-shrink-0" /> {worker.email}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(worker)}
                disabled={approvingId === worker._id}
                className="primary-btn flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {approvingId === worker._id
                  ? <Loader2 className="animate-spin" size={16} />
                  : <UserCheck size={16} />}
                Approve & Give Access
              </button>
              <button
                onClick={() => viewInWorkers(worker)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                View
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NewWorkerAlert;
