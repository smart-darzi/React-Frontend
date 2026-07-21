import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { useLocalState } from '../context/useLocalState';
import { getWorkerHistory } from '../utils/stages';

// Rows are grouped by order: an order that went Cutting → Sewing →
// Embroidery → Ironing produces one stageHistory entry per stage, and a flat
// row-per-entry table repeated that order's name/customer on every single
// row — noisy and repetitive. Instead the Order/Customer cell is merged
// (rowSpan) across all of that order's stages, shown once, with the
// stage → worker → date progression listed underneath it in the order it
// actually happened.
// Rows are grouped by order (see comment above), so "page" here counts
// pages of ORDERS, not raw table rows. Both the combined "All Workers" feed
// and the single-worker view show 6 orders per page — this now lives on its
// own dedicated page (moved off the bottom of the Workers list, which used
// to leave the list looking oddly long/blank once the table itself was
// empty), so it can afford a slightly bigger page size than it had inline.
const PAGE_SIZE = 6;

const WorkerHistory = () => {
  const { workers, orders, customers, loading } = useLocalState();
  const navigate = useNavigate();
  const [selectedWorkerId, setSelectedWorkerId] = useState('all');
  const [page, setPage] = useState(1);

  const getCustomer = (id) => customers.find(c => c._id?.toString() === id?.toString())?.name || 'Unknown';

  const approvedWorkers = workers.filter(w => w.isApproved !== false);

  const combinedHistory = approvedWorkers.flatMap(w =>
    getWorkerHistory(orders, w._id).map(entry => ({ ...entry, worker: w }))
  );
  const filteredHistory = selectedWorkerId === 'all'
    ? combinedHistory
    : combinedHistory.filter(e => e.worker._id?.toString() === selectedWorkerId);

  const groupsMap = new Map();
  filteredHistory.forEach(entry => {
    const key = entry.order._id;
    if (!groupsMap.has(key)) groupsMap.set(key, { order: entry.order, entries: [] });
    groupsMap.get(key).entries.push(entry);
  });
  const groups = Array.from(groupsMap.values())
    .map(g => {
      const entries = [...g.entries].sort((a, b) => new Date(a.at) - new Date(b.at));
      return { order: g.order, entries, latestAt: Math.max(...entries.map(e => new Date(e.at).getTime())) };
    })
    .sort((a, b) => b.latestAt - a.latestAt);

  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedGroups = groups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading History...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 min-w-0">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <button
            onClick={() => navigate('/workers')}
            className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Workers
          </button>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
            <div className="bg-emerald-500 p-2.5 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><History size={24} className="sm:hidden" /><History size={32} className="hidden sm:block" /></div>
            <span className="truncate">Work History / کام کی تاریخ</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-lg ml-[52px] sm:ml-16">
            {combinedHistory.length} completed stage{combinedHistory.length === 1 ? '' : 's'} across {approvedWorkers.length} worker{approvedWorkers.length === 1 ? '' : 's'}
          </p>
        </div>
      </motion.header>

      <div className="glass-card rounded-[3rem] overflow-hidden min-w-0">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50 border-b border-emerald-100">
          <h2 className="text-xl font-black text-emerald-700 uppercase tracking-tighter flex items-center gap-2">
            <History size={20} /> All Completed Work
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-emerald-600 uppercase tracking-widest hidden sm:block">
              Worker:
            </label>
            <select
              value={selectedWorkerId}
              onChange={e => { setSelectedWorkerId(e.target.value); setPage(1); }}
              className="input-field appearance-none cursor-pointer bg-white py-2.5 px-4 text-sm font-bold w-full md:w-64"
            >
              <option value="all">All Workers ({combinedHistory.length})</option>
              {approvedWorkers.map(w => {
                const count = combinedHistory.filter(e => e.worker._id?.toString() === w._id?.toString()).length;
                if (count === 0) return null;
                return (
                  <option key={w._id} value={w._id}>{w.name} — {w.role} ({count})</option>
                );
              })}
            </select>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="p-16 text-center">
            <History size={40} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-400">
              {selectedWorkerId === 'all' ? 'Abhi tak kisi ka bhi kaam mukammal nahi hua' : 'Is worker ki abhi tak koi mukammal history nahi hai'}
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1.5">Jab koi stage complete hoga, wo yahan dikhega.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left font-black uppercase text-[10px] tracking-widest px-8 py-3">Order</th>
                  <th className="text-left font-black uppercase text-[10px] tracking-widest px-4 py-3">Stage</th>
                  <th className="text-left font-black uppercase text-[10px] tracking-widest px-4 py-3">Worker</th>
                  <th className="text-right font-black uppercase text-[10px] tracking-widest px-8 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {pagedGroups.map((g, gi) => (
                  <React.Fragment key={g.order._id}>
                    {g.entries.map((entry, ei) => (
                      <tr
                        key={`${g.order._id}-${entry.stage}-${entry.at}`}
                        onClick={() => navigate(`/order/${g.order._id}`)}
                        className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                          gi > 0 && ei === 0 ? 'border-t-4 border-slate-100' : 'border-t border-slate-100'
                        }`}
                      >
                        {ei === 0 && (
                          <td
                            rowSpan={g.entries.length}
                            className="px-8 py-3 align-top bg-slate-50/60 border-r border-slate-100"
                          >
                            <p className="font-black text-slate-800 uppercase whitespace-nowrap">{g.order.orderType}</p>
                            <p className="text-slate-500 font-medium text-xs whitespace-nowrap mt-0.5">{getCustomer(g.order.customerId)}</p>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 whitespace-nowrap">
                            {entry.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700 uppercase whitespace-nowrap">{entry.worker.name}</td>
                        <td className="px-8 py-3 text-right text-slate-400 font-medium whitespace-nowrap">
                          {new Date(entry.at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-8 py-5 bg-slate-50 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Page {safePage} of {totalPages} · {groups.length} orders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerHistory;
