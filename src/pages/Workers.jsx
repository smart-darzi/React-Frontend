import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocalState } from '../context/useLocalState';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, Plus, Phone, Loader2, Save,
  Mail, Lock, KeyRound, History,
  Clock, XCircle, UserCheck, ClipboardCheck
} from 'lucide-react';
import { ROLES, getWorkerStatusLabel, getWorkerStatusColor } from '../utils/stages';
import { validateEmail } from '../utils/validators';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import PaginationControls from '../components/PaginationControls';
import DirectoryHero from '../components/DirectoryHero';
import PageWaveBackdrop from '../components/PageWaveBackdrop';
import { getBadgeColor } from '../utils/badgeColors';

const EMPTY = { name: '', role: '', phone: '', email: '', password: '' };

const WorkerCard = ({ w, orders }) => {
  const navigate = useNavigate();
  const { t, td, tn } = useLanguage();

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
  // own detail page — this row is just enough to identify + spot-check.
  const badge = getBadgeColor(w._id || w.name);
  return (
    <div
      onClick={() => navigate(`/worker/${w._id}`)}
      className="flex items-center gap-3 sm:gap-5 px-3 py-3 sm:px-6 sm:py-4 cursor-pointer hover:bg-primary/5 transition-colors min-w-0"
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary text-base sm:text-xl font-black ring-2 ring-white shadow-sm">
          {w.name.charAt(0).toUpperCase()}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ring-2 ring-white"
          style={{ background: badge.bg }}
        >
          <HardHat size={9} className="text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-lg font-black uppercase truncate" style={{ color: '#0E606E' }}>{tn(w.name)}</h3>
        <p className="text-primary font-bold text-xs sm:text-sm truncate">
          {td(w.role)}
          {w.phone && <span className="text-slate-400 font-medium normal-case"> · {w.phone}</span>}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {liveOrder ? (
          <span className={`text-[8px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap ${getWorkerStatusColor(liveOrder)}`}>
            {liveOrder.workerStatus === 'Blocked' ? '⚠ ' : '● '}{getWorkerStatusLabel(liveOrder, t('en', 'ur'))}
          </span>
        ) : (
          <span className="text-[8px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 whitespace-nowrap">{t('Idle', 'خالی')}</span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">{assigned.length} {t('active', 'فعال')}</span>
          {w.email ? (
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0" title={t('Portal access', 'پورٹل رسائی')}>
              <KeyRound size={11} />
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
  const { t, td, tn, language } = useLanguage();
  const { t: ti } = useTranslation();
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
    if (!password) return editingId ? null : (wantsPortal && form.email ? ti('validation.passwordRequired') : null);
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || /^(.)\1+$/.test(password)) {
      return ti('validation.passwordWeak');
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
      return ti('validation.phoneInvalid');
    }
    return null;
  };

  const handleSave = async () => {
    setPhoneTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!form.name.trim() || !form.role.trim()) { setError(ti('validation.nameRoleRequired')); return; }
    const phoneError = validatePhone(form.phone);
    if (phoneError) { setError(phoneError); return; }
    if (wantsPortal && form.email) {
      const emailError = validateEmail(form.email, { t: ti });
      if (emailError) { setError(emailError); return; }
    }
    if (wantsPortal && form.email && !form.password && !editingId) { setError(ti('validation.portalAccessNeedsPassword')); return; }
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
    if (!window.confirm(ti('validation.confirmDeleteWorker'))) return;
    setDeletingId(id);
    try { await deleteWorker(id); } catch { alert(t('Failed to delete worker.', 'ورکر حذف نہیں ہو سکا۔')); } finally { setDeletingId(null); }
  };

  const [approvingId, setApprovingId] = useState(null);

  // Workers list pagination — 8 per page, separate from the pending-
  // approval list above which always shows in full.
  const WORKER_PAGE_SIZE = 8;
  const [workerPage, setWorkerPage] = useState(1);
  const approvedWorkers = workers.filter(w => w.isApproved !== false);
  const totalWorkerPages = Math.max(1, Math.ceil(approvedWorkers.length / WORKER_PAGE_SIZE));
  const safeWorkerPage = Math.min(workerPage, totalWorkerPages);
  const handleApprove = async (id) => {
    setApprovingId(id);
    try { await approveWorker(id); } catch { alert('Failed to approve worker.'); } finally { setApprovingId(null); }
  };
  const handleReject = async (id) => {
    if (!window.confirm(ti('validation.confirmRejectWorkerRequest'))) return;
    setDeletingId(id);
    try { await deleteWorker(id); } catch { alert(language === 'ur' ? 'درخواست مسترد نہیں ہو سکی۔' : 'Could not reject the request.'); } finally { setDeletingId(null); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">{t('Loading Workers...', 'ورکرز لوڈ ہو رہے ہیں...')}</p>
    </div>
  );

  const totalActive = orders.filter(o => o.orderStatus === 'Active' && o.assignedWorkerId).length;

  return (
    <PageWaveBackdrop>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <DirectoryHero
          eyebrow={t('Directory', 'ڈائریکٹری')}
          heading={t('Workers', 'ورکرز')}
          description={t(
            'Manage your team, track who is on which job, and see everyone at a glance.',
            'اپنی ٹیم کا انتظام کریں، دیکھیں کون کس کام پر ہے، اور سب کو ایک نظر میں دیکھیں۔'
          )}
          cta={
            !showForm && (
              <button onClick={openAdd} className="inline-flex items-center gap-2 bg-white text-primary font-black text-sm px-6 py-3.5 rounded-full shadow-lg hover:scale-[1.03] transition-transform">
                <Plus size={18} /> {t('Add Worker', 'ورکر شامل کریں')}
              </button>
            )
          }
          rightContent={
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Team overview', 'ٹیم کا خلاصہ')}</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-600"><HardHat size={15} className="text-primary" /> {t('Workers', 'ورکرز')}</span>
                  <span className="font-black text-slate-800">{workers.filter(w => w.isApproved !== false).length}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-600"><ClipboardCheck size={15} className="text-emerald-600" /> {t('Active assignments', 'فعال تفویضات')}</span>
                  <span className="font-black text-slate-800">{totalActive}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/workers/history')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase tracking-wide hover:bg-primary/15 transition-all"
              >
                <History size={15} /> {t('Work History', 'کام کی تاریخ')}
              </button>
            </div>
          }
        />
      </motion.header>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="rounded-2xl p-5 sm:p-10"
          style={{ background: 'linear-gradient(165deg, #10707F 0%, #0E606E 45%, #0A4A55 100%)' }}
        >
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">
            {/* Left — live preview card, same pattern as the Add Customer
                page: avatar + name/role, plus a couple of quick facts
                instead of a nav menu. */}
            <div className="w-full lg:w-72 bg-white rounded-xl p-6 flex-shrink-0">
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
                <span className="w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}>
                  {form.name.trim() ? form.name.trim().charAt(0).toUpperCase() : <HardHat size={20} />}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{form.name.trim() || t('New Worker', 'نیا ورکر')}</p>
                  <p className="text-xs text-primary font-bold truncate">{form.role ? td(form.role) : '—'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{form.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <KeyRound size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{wantsPortal ? t('Portal access on', 'پورٹل رسائی آن') : t('No portal access', 'کوئی پورٹل رسائی نہیں')}</span>
                </div>
              </div>
            </div>

            {/* Right — the actual form, styled as label-left/input-right
                rows inside one white card. */}
            <div className="flex-1 w-full bg-white rounded-xl p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
                {editingId ? t('Edit Worker', 'ترمیم کریں') : t('New Worker', 'نیا ورکر')}
              </h2>

              <div className="divide-y divide-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="text-sm font-bold text-slate-700 flex-shrink-0">{t('Name', 'نام')} *</label>
                  <input
                    type="text"
                    className="flex-1 text-left bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600 placeholder:text-slate-300 min-w-0"
                    placeholder={t('Worker\'s name...', 'ورکر کا نام...')}
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="text-sm font-bold text-slate-700 flex-shrink-0">{t('Role', 'کام')} *</label>
                  <select
                    className="flex-1 text-left bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600 cursor-pointer min-w-0"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="">{t('Select role...', 'کام منتخب کریں...')}</option>
                    {ROLES.map(r => <option key={r} value={r}>{td(r)}</option>)}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-4">
                  <label className="text-sm font-bold text-slate-700 flex-shrink-0">{t('Phone', 'فون')}</label>
                  <div className="flex-1 min-w-0 text-left">
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="w-full text-left bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600 font-mono tracking-wider placeholder:text-slate-300 placeholder:font-sans"
                      placeholder="03XXXXXXXXX"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      onBlur={() => setPhoneTouched(true)}
                      maxLength={11}
                    />
                    {phoneTouched && validatePhone(form.phone) && (
                      <p className="text-xs text-red-600 font-bold mt-1 flex items-center justify-end gap-1">
                        ⚠ {validatePhone(form.phone)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Portal access — optional login credentials so this worker can sign in
                  from the same login page and see their own assigned tasks.
                  This is deliberately OFF by default and collapsed: assigning a
                  task to a worker (via the Assign Worker popup on an order) never
                  touches this section — it's purely for granting/removing login. */}
              <div className="pt-4 mt-2 border-t border-slate-100 space-y-2 sm:space-y-4">
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
                    {t(
                      'Leave this toggle off if this worker will only work through task assignments. Giving an email/password is only needed if the worker will log in themselves to see their own tasks.',
                      'اس ٹوگل کو آف ہی رہنے دیں اگر یہ ورکر صرف ٹاسک اسائنمنٹ کے ذریعے کام کرے گا۔ ای میل/پاس ورڈ دینا صرف اس وقت ضروری ہے جب ورکر کو خود لاگ ان کر کے اپنے ٹاسکس دیکھنے دینا ہو۔'
                    )}
                  </p>
                )}
                {wantsPortal && (
                  <>
                    <p className="text-xs text-slate-400 -mt-2">
                      {t(
                        'Give an email and password so this worker can log in themselves and see their own tasks.',
                        'ای میل اور پاس ورڈ دیں تاکہ یہ ورکر خود لاگ ان کر کے اپنے ٹاسکس دیکھ سکے۔'
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Mail size={13} /> Email
                        </label>
                        <input
                          type="email"
                          className={`input-field !px-3 !py-3 sm:!px-5 sm:!py-4 ${emailTouched && form.email && validateEmail(form.email, { t: ti }) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
                          placeholder="worker@example.com"
                          value={form.email}
                          onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (!emailTouched) setEmailTouched(true); }}
                          onBlur={() => setEmailTouched(true)}
                        />
                        {emailTouched && form.email && validateEmail(form.email, { t: ti }) && (
                          <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validateEmail(form.email, { t: ti })}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Lock size={13} /> Password
                        </label>
                        <input
                          type="password"
                          className={`input-field !px-3 !py-3 sm:!px-5 sm:!py-4 ${passwordTouched && form.password && validatePassword(form.password) ? 'border-2 border-red-400 focus:border-red-500' : ''}`}
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
                          <p className="text-xs text-slate-400 px-1">{t('At least 8 characters, including both letters and numbers', 'کم از کم 8 حروف، جن میں حروفِ تہجی اور نمبر دونوں شامل ہوں')}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 mt-6">
                  ⚠ {error}
                </div>
              )}
              <div className="flex gap-3 sm:gap-4 mt-6">
                <button onClick={handleSave} disabled={saving} className="primary-btn px-5 py-2 text-xs sm:px-10 sm:py-4 sm:text-base rounded-xl flex items-center gap-1.5 sm:gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  {editingId ? t('Update', 'اپڈیٹ کریں') : t('Save', 'محفوظ کریں')}
                </button>
                <button onClick={closeForm} className="px-5 py-2 text-xs sm:px-10 sm:py-4 sm:text-base rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">{t('Cancel', 'منسوخ کریں')}</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pending Self-Registration Requests — workers who created their own
          account from the public /register page and are waiting for the
          admin to approve them before they can log in. */}
      {workers.some(w => w.isApproved === false) && (
        <div className="glass-card p-8 rounded-xl space-y-5 border-2 border-amber-200 bg-amber-50/40">
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
                className="bg-white rounded-xl p-3 sm:p-6 flex items-center justify-between gap-2 sm:gap-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-800 uppercase truncate text-sm sm:text-base">{tn(w.name)}</p>
                  <p className="text-primary font-bold text-xs sm:text-sm">{td(w.role)}</p>
                  {w.email && <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate">{w.email}</p>}
                  {w.phone && <p className="text-slate-500 text-[10px] sm:text-xs font-medium flex items-center gap-1 mt-0.5"><Phone size={10} /> {w.phone}</p>}
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(w._id)}
                    disabled={approvingId === w._id}
                    className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-500 text-white text-[10px] sm:text-xs font-black uppercase flex items-center gap-1 sm:gap-1.5 hover:bg-emerald-600 transition-all disabled:opacity-60 whitespace-nowrap"
                  >
                    {approvingId === w._id ? <Loader2 className="animate-spin" size={12} /> : <UserCheck size={12} />} {t('Approve', 'منظور کریں')}
                  </button>
                  <button
                    onClick={() => handleReject(w._id)}
                    disabled={deletingId === w._id}
                    className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-red-50 text-red-600 text-[10px] sm:text-xs font-black uppercase flex items-center gap-1 sm:gap-1.5 hover:bg-red-100 transition-all disabled:opacity-60 whitespace-nowrap"
                  >
                    {deletingId === w._id ? <Loader2 className="animate-spin" size={12} /> : <XCircle size={12} />} {t('Reject', 'مسترد کریں')}
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
        <div className="glass-card p-20 rounded-xl text-center">
          <HardHat size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">{t('No workers yet', 'ابھی کوئی ورکر نہیں')}</h3>
          <p className="text-slate-400 font-medium mt-2">{t('Use the Add Worker button to add your first worker', 'Add Worker بٹن سے پہلا ورکر شامل کریں')}</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-xl divide-y divide-slate-100 overflow-hidden">
            {approvedWorkers.slice((safeWorkerPage - 1) * WORKER_PAGE_SIZE, safeWorkerPage * WORKER_PAGE_SIZE).map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
              >
                <WorkerCard w={w} orders={orders} />
              </motion.div>
            ))}
          </div>

          <PaginationControls
            label={t('Page', 'صفحہ')}
            currentPage={safeWorkerPage}
            totalPages={totalWorkerPages}
            onPrev={() => setWorkerPage(p => Math.max(1, p - 1))}
            onNext={() => setWorkerPage(p => Math.min(totalWorkerPages, p + 1))}
            className="pt-2"
          />
        </>
      )}
    </PageWaveBackdrop>
  );
};

export default Workers;
