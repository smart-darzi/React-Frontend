import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import {
  ArrowLeft, Phone, Mail, KeyRound, Scissors, ClipboardList,
  History, HardHat, Loader2, Pencil, Trash2, Save, X, Lock,
} from 'lucide-react';
import { getWorkerHistory, getWorkerStatusLabel, getWorkerStatusColor, roleToStage, ROLES } from '../utils/stages';
import { validateEmail } from '../utils/validators';

const HISTORY_PAGE_SIZE = 5;

// ✅ Clicking a worker card on the Workers list now lands here instead of
// only expanding an inline panel — a dedicated page with the worker's full
// profile up top and their COMPLETE work history (every finished stage,
// across every order, oldest hand-offs included) below, not just the
// worker's currently-active tasks.
const EMPTY_FORM = { name: '', role: '', phone: '', email: '', password: '' };

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workers, orders, customers, loading, updateWorker, deleteWorker } = useLocalState();
  const [page, setPage] = useState(1);

  // ── Edit / Delete — moved here from the Workers list so the list can
  // stay a simple glanceable directory. This detail page is now the only
  // place a worker's own record can be changed or removed.
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wantsPortal, setWantsPortal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  const worker = workers.find(w => w._id?.toString() === id?.toString());

  const openEdit = () => {
    if (!worker) return;
    setForm({ name: worker.name, role: worker.role, phone: worker.phone || '', email: worker.email || '', password: '' });
    setWantsPortal(Boolean(worker.email));
    setFormError('');
    setEditing(true);
  };
  const closeEdit = () => { setEditing(false); setForm(EMPTY_FORM); setFormError(''); };

  const handlePhoneChange = (e) => {
    setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }));
  };
  const validatePhone = (phone) => {
    if (!phone) return null;
    if (!/^03\d{9}$/.test(phone)) return 'Invalid number format — must be 11 digits starting with 03 / نمبر درست نہیں';
    return null;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim()) { setFormError('Name aur Role zaroori hain'); return; }
    const phoneError = validatePhone(form.phone);
    if (phoneError) { setFormError(phoneError); return; }
    if (wantsPortal && form.email) {
      const emailError = validateEmail(form.email);
      if (emailError) { setFormError(emailError); return; }
    }
    if (wantsPortal && form.password) {
      if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
        setFormError('Strong password enter karein — kam az kam 8 characters, letters aur numbers dono');
        return;
      }
    }
    setSaving(true); setFormError('');
    try {
      const payload = { name: form.name, role: form.role, phone: form.phone };
      if (wantsPortal && form.email) payload.email = form.email;
      if (wantsPortal && form.password) payload.password = form.password;
      await updateWorker(worker._id, payload);
      closeEdit();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Is worker ko delete karein? Yeh permanently remove ho jayega.')) return;
    setDeleting(true);
    try {
      await deleteWorker(worker._id);
      navigate('/workers');
    } catch {
      alert('Failed to delete worker.');
      setDeleting(false);
    }
  };

  const getCustomer = (cid) => customers.find(c => c._id?.toString() === cid?.toString())?.name || 'Unknown';

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading Worker...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="glass-card p-16 rounded-[3rem] text-center space-y-4">
        <HardHat size={48} className="mx-auto text-slate-300" />
        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Worker not found</h3>
        <button onClick={() => navigate('/workers')} className="primary-btn px-8 py-3 rounded-2xl inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Workers
        </button>
      </div>
    );
  }

  const assigned = orders.filter(o =>
    o.assignedWorkerId?.toString() === worker._id?.toString() && o.orderStatus === 'Active'
  );
  const liveOrder =
    assigned.find(o => o.workerStatus === 'Blocked') ||
    assigned.find(o => o.workerStatus === 'In-Progress') ||
    assigned.find(o => o.workerStatus === 'Completed-Review') ||
    assigned[0];

  // Full history — every finished stage this worker ever did, oldest hand-
  // offs included (not just currently-active work), newest first.
  const history = getWorkerHistory(orders, worker._id);
  const totalPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedHistory = history.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/workers')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Workers / واپس
        </button>
        {!editing && (
          <div className="flex gap-3">
            <button
              onClick={openEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-100 transition-all"
            >
              <Pencil size={15} /> Edit / ترمیم
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 font-bold text-sm rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete / حذف کریں
            </button>
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Edit Worker / ترمیم کریں</h2>
            <button onClick={closeEdit} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Name / نام *</label>
              <input type="text" className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Role / کام *</label>
              <select className="input-field appearance-none cursor-pointer" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="">Select role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone / فون</label>
              <input type="tel" inputMode="numeric" className="input-field font-mono tracking-wider" placeholder="03XXXXXXXXX" value={form.phone} onChange={handlePhoneChange} maxLength={11} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={wantsPortal} onChange={e => setWantsPortal(e.target.checked)} className="w-5 h-5 accent-primary rounded cursor-pointer" />
              <span className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-widest">
                <KeyRound size={16} className="text-primary" /> Portal Access / پورٹل رسائی
              </span>
            </label>
            {wantsPortal && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail size={13} /> Email</label>
                  <input type="email" className="input-field" placeholder="worker@gmail.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={13} /> Password</label>
                  <input type="password" className="input-field" placeholder="Leave blank to keep current" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {formError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">⚠ {formError}</div>
          )}
          <div className="flex gap-4">
            <button onClick={handleSave} disabled={saving} className="primary-btn px-10 py-4 rounded-2xl flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Update
            </button>
            <button onClick={closeEdit} className="px-10 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-primary/5"
      >
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-white text-3xl sm:text-5xl font-black shadow-2xl shadow-primary/30 -rotate-3 flex-shrink-0">
            {worker.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase break-words">{worker.name}</h1>
              <p className="text-primary font-bold text-sm sm:text-base mt-1">{worker.role}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {worker.phone && (
                <span className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-medium text-sm"><Phone size={16} className="text-primary" /> {worker.phone}</span>
              )}
              {worker.email && (
                <span className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-medium text-sm"><Mail size={16} className="text-primary" /> {worker.email}</span>
              )}
              {worker.email ? (
                <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl bg-indigo-100 text-indigo-700 flex items-center gap-1.5"><KeyRound size={12} /> Portal access</span>
              ) : (
                <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl bg-slate-100 text-slate-500">No login yet</span>
              )}
              {roleToStage(worker.role) && (
                <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl bg-primary/10 text-primary">Handles: {roleToStage(worker.role)}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <span className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-blue-100 text-blue-700">{assigned.length} active</span>
              <span className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700">{history.length} completed</span>
              {liveOrder ? (
                <span className={`text-xs font-black uppercase px-4 py-2 rounded-xl border ${getWorkerStatusColor(liveOrder)}`}>
                  {liveOrder.workerStatus === 'Blocked' ? '⚠ ' : '● '}{getWorkerStatusLabel(liveOrder)}
                </span>
              ) : (
                <span className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-slate-100 text-slate-400">Idle / خالی</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active / assigned work */}
      {assigned.length > 0 && (
        <div className="glass-card rounded-[2.5rem] overflow-hidden">
          <div className="p-6 sm:p-8 bg-primary/5 border-b border-primary/10">
            <h2 className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
              <ClipboardList size={18} /> Assigned Work / تفویض شدہ کام ({assigned.length})
            </h2>
          </div>
          <div className="p-6 sm:p-8 space-y-3">
            {assigned.map(o => (
              <div
                key={o._id}
                onClick={() => navigate(`/order/${o._id}`)}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl hover:shadow-md transition-all cursor-pointer border border-slate-100"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <Scissors size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm uppercase truncate">{o.orderType}</p>
                  <p className="text-xs text-slate-500">{getCustomer(o.customerId)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase whitespace-nowrap">
                    {o.workStage || 'Active'}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase whitespace-nowrap ${getWorkerStatusColor(o)}`}>
                    {o.workerStatus === 'Blocked' ? '⚠ ' : ''}{getWorkerStatusLabel(o)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full work history */}
      <div className="glass-card rounded-[3rem] overflow-hidden min-w-0">
        <div className="p-8 bg-emerald-50 border-b border-emerald-100">
          <h2 className="text-xl font-black text-emerald-700 uppercase tracking-tighter flex items-center gap-2">
            <History size={20} /> Work History / کام کی تاریخ
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Is worker ki abhi tak koi mukammal history nahi hai.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[560px] text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left font-black uppercase text-[10px] tracking-widest px-8 py-3">Order</th>
                  <th className="text-left font-black uppercase text-[10px] tracking-widest px-4 py-3">Stage</th>
                  <th className="text-right font-black uppercase text-[10px] tracking-widest px-8 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {pagedHistory.map((entry) => (
                  <tr
                    key={`${entry.order._id}-${entry.stage}-${entry.at}`}
                    onClick={() => navigate(`/order/${entry.order._id}`)}
                    className="border-t border-slate-100 hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-8 py-3 align-top">
                      <p className="font-black text-slate-800 uppercase whitespace-nowrap">{entry.order.orderType}</p>
                      <p className="text-slate-500 font-medium text-xs whitespace-nowrap mt-0.5">{getCustomer(entry.order.customerId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 whitespace-nowrap">
                        {entry.stage}
                      </span>
                    </td>
                    <td className="px-8 py-3 text-right text-slate-400 font-medium whitespace-nowrap">
                      {new Date(entry.at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-8 py-5 bg-slate-50 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Page {safePage} of {totalPages} · {history.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

export default WorkerDetail;
