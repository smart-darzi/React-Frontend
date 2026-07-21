import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { Scissors, User, Mail, Lock, Phone, Home, ArrowRight, ShieldAlert, ArrowLeft, Sparkles } from 'lucide-react';
import { cleanPhoneInput, validatePhone, validateEmail, validatePassword } from '../utils/validators';

const EMPTY = { name: '', phone: '', address: '', email: '', password: '' };

// Public "create your own account" page for customers. Unlike the worker
// version, this does NOT need admin approval — submitting here logs the
// customer straight into their own portal, same flow as: enter email +
// password on the shared Login page, see "Not have an account?", tap
// Sign Up, fill this form, tap Create Account, land on the portal.
const CustomerRegister = () => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { registerCustomer } = useLocalState();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const val = cleanPhoneInput(e.target.value);
    setForm(p => ({ ...p, phone: val }));
    if (!phoneTouched) setPhoneTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError('');

    if (!form.name.trim()) {
      setError('Naam zaroori hai / Name is required');
      return;
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) { setError(phoneError); return; }
    const emailError = validateEmail(form.email);
    if (emailError) { setError(emailError); return; }
    const passwordError = validatePassword(form.password);
    if (passwordError) { setError(passwordError); return; }

    setLoading(true);
    try {
      await registerCustomer({
        name: form.name.trim(),
        phoneNumber: form.phone,
        familyName: form.address || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/customer-portal');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Account nahi ban saka. Dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0E606E 0%, #0A4A55 50%, #083840 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
             style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Scissors className="text-white" size={22} />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-widest uppercase">Smart Master</p>
            <p className="text-white/50 text-xs font-medium tracking-widest">TAILORING MANAGEMENT</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <Sparkles size={14} className="text-white/80" />
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Customer Sign Up</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tighter">
            Apna Account<br/>
            <span className="text-white/50">Khud</span><br/>
            Banayein
          </h1>
          <p className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
            Account banayein aur apne orders, unki tracking aur details apne apne portal se kabhi bhi dekhein.
          </p>
        </div>

        <p className="text-white/30 text-sm font-medium relative z-10">
          © 2025 Smart Master · Crafted for tailors
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">

          <div className="lg:hidden flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="text-white" size={22} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg tracking-wide uppercase">Smart Master</p>
              <p className="text-slate-400 text-xs font-medium">Tailoring Management</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Create Account</h2>
            <p className="text-slate-500 font-medium text-lg">Apna customer account banayein</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Name / نام *</label>
              <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Apna naam likhein"
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Phone / فون *</label>
              <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                  <Phone size={18} className="text-slate-400" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="03XXXXXXXXX"
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-mono tracking-wider"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneTouched(true)}
                  maxLength={11}
                />
              </div>
              {phoneTouched && validatePhone(form.phone) && (
                <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validatePhone(form.phone)}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Address / پتہ</label>
              <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                  <Home size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ghar ka pata"
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email / ای میل *</label>
              <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  onBlur={() => setEmailTouched(true)}
                />
              </div>
              {emailTouched && validateEmail(form.email) && (
                <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validateEmail(form.email)}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password / پاس ورڈ *</label>
              <div className={`flex items-stretch border rounded-2xl overflow-hidden bg-white/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all ${passwordTouched && validatePassword(form.password) ? 'border-red-400' : 'border-slate-200 focus-within:border-primary/30'}`}>
                <div className="flex items-center justify-center px-4 bg-slate-100/80 border-r border-slate-200 min-w-[52px]">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (!passwordTouched) setPasswordTouched(true); }}
                  onBlur={() => setPasswordTouched(true)}
                />
              </div>
              {passwordTouched && validatePassword(form.password) ? (
                <p className="text-xs text-red-600 font-bold px-1 flex items-center gap-1">⚠ {validatePassword(form.password)}</p>
              ) : (
                <p className="text-xs text-slate-400 px-1">Kam az kam 8 characters, letters aur numbers dono shamil hon</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-bold">
                <ShieldAlert size={18} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base font-black shadow-2xl shadow-primary/25 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs font-medium leading-relaxed">
            Pehle se account hai?{' '}
            <Link to="/login" className="text-primary font-black hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Login karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
