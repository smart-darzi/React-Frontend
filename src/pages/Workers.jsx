import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, Plus, Phone, Loader2, Save,
  Mail, Lock, KeyRound, History,
  Clock, XCircle, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ROLES, getWorkerStatusLabel, getWorkerStatusColor } from '../utils/stages';
import { validateEmail } from '../utils/validators';
import { useLanguage } from '../context/LanguageContext';

const EMPTY = { name: '', role: '', phone: '', email: '', password: '' };

const WorkerCard = ({ w, orders }) => {
  const navigate = useNavigate();
  const { t, td } = useLanguage();

  const assigned = orders.filter(o =>
    o.assignedWorkerId?.toString() === w._id?.toString() && o.orderStatus === 'Active'
  );

  // ✅ Live tracking — what is this worker actually doing right now, at a
  // glance. Priority: a Blocked order is the most urgent thing an admin
  // needs to notice, then In-Progress ("working"), then Completed-Review
  // ("sent it off, self-checking"), and if none of that applies but they
  // do have assigned work, they just haven't started yet. No assigned
  // work at all -> genuinely idle.
  const liveOrder =
    assigned.find(o => o.workerStatus === 'Blocked') ||
    assigned.find(o => o.workerStatus === 'In-Progress') ||
    assigned.find(o => o.workerStatus === 'Completed-Review') ||
    assigned[0];

  // Everything else (full history, edit, delete) lives on the worker's
  // own detail page — this card is just enough to identify + spot-check.
  return (
    <div
      onClick={() => navigate(`/worker/${w._id}`)}
      className="glass-card rounded-[2.5rem] p-8 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black flex-shrink-0">
        {w.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-black text-slate-800 uppercase truncate">{w.name}</h3>
        <p className="text-primary font-bold text-sm">{td(w.role)}</p>
        {w.phone && <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-0.5"><Phone size={11} /> {w.phone}</p>}
        <div className="flex gap-3 mt-2 flex-wrap">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{assigned.length} {t('active', 'فعال')}</span>
          {liveOrder ? (
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getWorkerStatusColor(liveOrder)}`}>
              {liveOrder.workerStatus === 'Blocked' ? '⚠ ' : '● '}{getWorkerStatusLabel(liveOrder, t('en', 'ur'))}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">{t('Idle', 'خالی')}</span>
          )}
          {w.email ? (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <KeyRound size={10} /> {t('Portal access', 'پورٹل رسائی')}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Workers = () => {
  const { workers, orders, loading, addWorker, updateWorker, deleteWorker, approveWorker } = useLocalState();
  const navigate = useNavigate();
  const { t, td } = useLanguage();
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [wantsPortal, setWantsPortal] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY); setError(''); setWantsPortal(false); setPhoneTouched(false); setEmailTouched(false); setPasswordTouched(false); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); setError(''); setWantsPortal(false); setPhoneTouched(false); setEmailTouched(false); setPasswordTouched(false); };

  // ── Password strength — at least 8 characters, letters + numbers both.
  // Editing an existing worker: empty password just means "don't change it",
  // so it's only validated when the admin actually types something.
  const validatePassword = (password) => {
    if (!password) return editingId ? null : (wantsPortal && form.email ? 'Password zaroori hai' : null);
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || /^(.)\1+$/.test(password)) {
      return 'Strong password enter karein — kam az kam 8 characters, letters aur numbers dono shamil hon';
    }
    return null;
  };

  // ── Phone helpers — same 11-digit, starts-with-03 rule as Add Customer.
  // Phone stays optional for workers (empty is fine). We don't rewrite what
  // the admin types — just restrict to digits/length — and show a clear
  // error message if the final value isn't a valid 03XXXXXXXXX number.
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setForm(p => ({ ...p, phone: val }));
    if (!phoneTouched) setPhoneTouched(true);
  };

  const validatePhone = (phone) => {
    if (!phone) return null; // phone is optional for workers
    if (!/^03\d{9}$/.test(phone)) {
      return 'Invalid number format — must be 11 digits starting with 03 (e.g. 03XXXXXXXXX) / نمبر درست نہیں';
    }
    return null;
  };

  const handleSave = async () => {
    setPhoneTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!form.name.trim() || !form.role.trim()) { setError('Name aur Role zaroori hain'); return; }
    const phoneError = validatePhone(form.phone);
    if (phoneError) { setError(phoneError); return; }
    if (wantsPortal && form.email) {
      const emailError = validateEmail(form.email);
      if (emailError) { setError(emailError); return; }
    }
    if (wantsPortal && form.email && !form.password && !editingId) { setError('Portal access dene ke liye password bhi likhein'); return; }
    if (wantsPortal && form.password) {
      const passwordError = validatePassword(form.password);
      if (passwordError) { setError(passwordError); return; }
    }
    setSaving(true); setError('');
    try {
      // Only send email/password if the admin actually turned on portal
      // access and filled them in — workers without login access simply
      // don't get those fields.
      const payload = { name: form.name, role: form.role, phone: form.phone };
      if (wantsPortal && form.email) payload.email = form.email;
      if (wantsPortal && form.password) payload.password = form.password;

      editingId ? await updateWorker(editingId, payload) : await addWorker(payload);
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Is worker ko delete karein?')) return;
    setDeletingId(id);
    try { await deleteWorker(id); } catch { alert('Failed to delete worker.'); } finally { setDeletingId(null); }
  };

  const [approvingId, setApprovingId] = useState(null);

  // Workers grid pagination — 4 per page (2x2), separate from the pending-
  // approval list above which always shows in full.
  const WORKER_PAGE_SIZE = 4;
  const [workerPage, setWorkerPage] = useState(1);
  const approvedWorkers = workers.filter(w => w.isApproved !== false);
  const totalWorkerPages = Math.max(1, Math.ceil(approvedWorkers.length / WORKER_PAGE_SIZE));
  const safeWorkerPage = Math.min(workerPage, totalWorkerPages);
  const handleApprove = async (id) => {
    setApprovingId(id);
    try { await approveWorker(id); } catch { alert('Failed to approve worker.'); } finally { setApprovingId(null); }
  };
  const handleReject = async (id) => {
    if (!window.confirm('Is request ko reject karein? Account delete ho jayega.')) return;
    setDeletingId(id);
    try { await deleteWorker(id); } catch { alert('Failed to reject request.'); } finally { setDeletingId(null); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Workers...', 'ورکرز لوڈ ہو رہے ہیں...')}</p>
    </div>
  );

  const totalActive = orders.filter(o => o.orderStatus === 'Active' && o.assignedWorkerId).length;

  return (
    <div className="space-y-10 pb-20 min-w-0">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3 sm:gap-4">
            <div className="bg-primary p-2.5 sm:p-3 rounded-2xl text-white shadow-lg flex-shrink-0"><HardHat size={24} className="sm:hidden" /><HardHat size={32} className="hidden sm:block" /></div>
            <span className="truncate">{t('Workers', 'ورکرز')}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-lg ml-[52px] sm:ml-16">
            {workers.filter(w => w.isApproved !== false).length} {t('workers', 'ورکرز')} · {totalActive} {t('active assignments', 'فعال تفویضات')}
          </p>
        </div>
        {!showForm && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/workers/history')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold hover:bg-emerald-100 transition-all whitespace-nowrap"
            >
              <History size={20} /> {t('Work History', 'کام کی تاریخ')}
            </button>
            <button onClick={openAdd} className="primary-btn w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 whitespace-nowrap">
              <Plus size={22} /> {t('Add Worker', 'ورکر شامل کریں')}
            </button>
          </div>
        )}
      </motion.header>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] space-y-6"
        >
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {editingId ? t('Edit Worker', 'ترمیم کریں') : t('New Worker', 'نیا ورکر')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Name', 'نام')} *</label>
              <input type="text" className="input-field" placeholder="Worker ka naam..." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Role', 'کام')} *</label>
              <select className="input-field appearance-none cursor-pointer" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="">{t('Select role...', 'کام منتخب کریں...')}</option>
                {ROLES.map(r => <option key={r} value={r}>{td(r)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Phone', 'فون')}</label>
              <input
                type="tel"
                inputMode="numeric"
                className={`input-field font-mono tracking-wider ${phoneTouched && validatePhone(form.phone) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
                placeholder="03XXXXXXXXX"
                value={form.phone}
                onChange={handlePhoneChange}
                onBlur={() => setPhoneTouched(true)}
                maxLength={11}
              />
              {phoneTouched && validatePhone(form.phone) && (
                <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">
                  ⚠ {validatePhone(form.phone)}
                </p>
              )}
            </div>
          </div>

          {/* Portal access — optional login credentials so this worker can sign in
              from the same login page and see their own assigned tasks.
              This is deliberately OFF by default and collapsed: assigning a
              task to a worker (via the Assign Worker popup on an order) never
              touches this section — it's purely for granting/removing login. */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wantsPortal}
                onChange={e => setWantsPortal(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <span className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-widest">
                <KeyRound size={16} className="text-primary" /> {t('Give Portal Access (Optional)', 'پورٹل رسائی دیں (اختیاری)')}
              </span>
            </label>
            {!wantsPortal && (
              <p className="text-xs text-slate-400 px-1">
                Is toggle ko off hi rehne dein agar yeh worker sirf task assignment ke through kaam karega. Email/password dena sirf tab zaroori hai jab worker ko khud login kar ke apne tasks dekhne dena ho.
              </p>
            )}
            {wantsPortal && (
              <>
                <p className="text-xs text-slate-400 -mt-2">Email aur password dein taake yeh worker khud login kar ke apne tasks dekh sakay.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail size={13} /> Email
                    </label>
                    <input
                      type="email"
                      className={`input-field ${emailTouched && form.email && validateEmail(form.email) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
                      placeholder="worker@example.com"
                      value={form.email}
                      onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (!emailTouched) setEmailTouched(true); }}
                      onBlur={() => setEmailTouched(true)}
                    />
                    {emailTouched && form.email && validateEmail(form.email) && (
                      <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validateEmail(form.email)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={13} /> Password
                    </label>
                    <input
                      type="password"
                      className={`input-field ${passwordTouched && form.password && validatePassword(form.password) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (!passwordTouched) setPasswordTouched(true); }}
                      onBlur={() => setPasswordTouched(true)}
                    />
                    {passwordTouched && form.password && validatePassword(form.password) ? (
                      <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">
                        ⚠ {validatePassword(form.password)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 px-1">Kam az kam 8 characters, letters aur numbers dono shamil hon / Enter a strong password</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
              ⚠ {error}
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={handleSave} disabled={saving} className="primary-btn px-10 py-4 rounded-2xl flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editingId ? t('Update', 'اپڈیٹ کریں') : t('Save', 'محفوظ کریں')}
            </button>
            <button onClick={closeForm} className="px-10 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">{t('Cancel', 'منسوخ کریں')}</button>
          </div>
        </motion.div>
      )}

      {/* Pending Self-Registration Requests — workers who created their own
          account from the public /register page and are waiting for the
          admin to approve them before they can log in. */}
      {workers.some(w => w.isApproved === false) && (
        <div className="glass-card p-8 rounded-[3rem] space-y-5 border-2 border-amber-200 bg-amber-50/40">
          <h2 className="text-lg font-black text-amber-700 uppercase tracking-tighter flex items-center gap-2">
            <Clock size={20} /> {t('Pending Approval', 'منظوری کا انتظار')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.filter(w => w.isApproved === false).map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-800 uppercase truncate">{w.name}</p>
                  <p className="text-primary font-bold text-sm">{td(w.role)}</p>
                  {w.email && <p className="text-slate-500 text-xs font-medium truncate">{w.email}</p>}
                  {w.phone && <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-0.5"><Phone size={11} /> {w.phone}</p>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(w._id)}
                    disabled={approvingId === w._id}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase flex items-center gap-1.5 hover:bg-emerald-600 transition-all disabled:opacity-60"
                  >
                    {approvingId === w._id ? <Loader2 className="animate-spin" size={14} /> : <UserCheck size={14} />} {t('Approve', 'منظور کریں')}
                  </button>
                  <button
                    onClick={() => handleReject(w._id)}
                    disabled={deletingId === w._id}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase flex items-center gap-1.5 hover:bg-red-100 transition-all disabled:opacity-60"
                  >
                    {deletingId === w._id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />} {t('Reject', 'مسترد کریں')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Workers Grid — approved workers only; pending requests show above.
          Paged 4 at a time (2x2) instead of dumping the whole roster on
          the page; Prev/Next below pages through the rest. */}
      {workers.filter(w => w.isApproved !== false).length === 0 ? (
        <div className="glass-card p-20 rounded-[3rem] text-center">
          <HardHat size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('No workers yet', 'ابھی کوئی ورکر نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Add Worker button se pehla worker add karein', 'Add Worker بٹن سے پہلا ورکر شامل کریں')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvedWorkers.slice((safeWorkerPage - 1) * WORKER_PAGE_SIZE, safeWorkerPage * WORKER_PAGE_SIZE).map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
                whileHover={{ y: -3 }}
              >
                <WorkerCard w={w} orders={orders} />
              </motion.div>
            ))}
          </div>

          {approvedWorkers.length > WORKER_PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setWorkerPage(p => Math.max(1, p - 1))}
                disabled={safeWorkerPage === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-500">
                {t('Page', 'صفحہ')} {safeWorkerPage} / {totalWorkerPages}
              </span>
              <button
                onClick={() => setWorkerPage(p => Math.min(totalWorkerPages, p + 1))}
                disabled={safeWorkerPage === totalWorkerPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Workers;
