import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Scissors,
  ClipboardList,
  Settings,
  HardHat,
  Palette,
  Menu,
  X,
  ChevronDown,
  Save,
  Check
} from 'lucide-react';
import { useLocalState } from '../context/useLocalState';
import { useLanguage } from '../context/LanguageContext';
import NewWorkerAlert from './NewWorkerAlert';
import PortalFooter from './PortalFooter';

const navItems = [
  { icon: LayoutDashboard, labelEn: 'Dashboard', labelUr: 'ڈیش بورڈ', to: '/', end: true },
  { icon: UserPlus, labelEn: 'Add Customer', labelUr: 'کسٹمر شامل کریں', to: '/add-customer' },
  { icon: Users, labelEn: 'Customers', labelUr: 'کسٹمرز', to: '/view-customers' },
  { icon: ClipboardList, labelEn: 'Orders', labelUr: 'آرڈرز', to: '/view-orders' },
  { icon: HardHat, labelEn: 'Workers', labelUr: 'ورکرز', to: '/workers' },
  { icon: Palette, labelEn: 'Designs', labelUr: 'ڈیزائنز', to: '/designs' },
  { icon: Settings, labelEn: 'Settings', labelUr: 'ترتیبات', to: '/settings' },
];

// ✅ Below the lg breakpoint the sidebar becomes an off-canvas drawer —
// fixed + translated off-screen by default, slid in over a dim overlay
// when the Topbar's hamburger is tapped. At lg+ it reverts to the original
// always-visible sticky column (translate is forced to 0 there regardless
// of open/close state). Without this, the old permanently-visible w-72
// column pushed page content into a horizontal scroll on any phone-width
// screen — the main reason the app didn't feel responsive at all.
const Sidebar = ({ mobileOpen, onClose }) => {
  const { logout } = useLocalState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`
          w-72 max-w-[85vw] text-white fixed top-0 left-0 h-screen flex-shrink-0 flex flex-col shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{ background: 'linear-gradient(165deg, #10707F 0%, #0E606E 45%, #0A4A55 100%)' }}
      >
        <div className="p-6 sm:p-8 flex items-center justify-between gap-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white p-2.5 rounded-xl shadow-lg rotate-3 group-hover:rotate-0 transition-all flex-shrink-0">
              <Scissors className="text-primary w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Smart Master</h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 p-6 mt-4 space-y-2 overflow-y-auto custom-scrollbar min-h-0">
          {navItems.map((item) => (
            <NavLink
              key={item.labelEn}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `
                relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group
                ${isActive
                  ? 'bg-white text-primary font-bold'
                  : 'hover:bg-white/[0.06] text-white/70 hover:text-white'}
              `}
              style={({ isActive }) => isActive ? { boxShadow: '0 10px 24px -8px rgba(0,0,0,0.35)' } : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={isActive ? 'text-primary' : 'group-hover:scale-110 transition-transform'} />
                  <span className="text-sm tracking-wide leading-relaxed">{t(item.labelEn, item.labelUr)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-xl bg-red-500/10 hover:bg-red-500 text-red-100 hover:text-white transition-all duration-300 font-bold group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            <span className="text-sm">{t('Logout', 'لاگ آؤٹ')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Slim sticky topbar above the page content — shows where you are (since the
// sidebar can be scrolled past on smaller viewports) and who's logged in,
// mirroring the header pattern already used on the Customer/Worker portals.
const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const active = navItems.find(item => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))) || navItems[0];
  const today = new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 lg:px-10 py-4 lg:py-5 flex items-center justify-between gap-3 sm:gap-6" style={{ boxShadow: '0 1px 0 rgba(15,23,42,0.03), 0 8px 24px -16px rgba(15,23,42,0.15)' }}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 text-primary items-center justify-center flex-shrink-0">
          <active.icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Smart Master Admin', 'اسمارٹ ماسٹر ایڈمن')}</p>
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate">{t(active.labelEn, active.labelUr)}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <span className="hidden md:block text-xs font-bold text-slate-400">{today}</span>
        {/* Language toggle — flips every bilingual string across the app
            to render only its English or only its Urdu half (see
            LanguageContext). Numbers/prices are unaffected either way. */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ur')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            اردو
          </button>
        </div>
        <AdminMenu />
      </div>
    </div>
  );
};

// Clicking the admin avatar opens a small popover to view + edit the
// admin's own display name right there, inline — Settings and Logout
// already live as their own sidebar nav items, so repeating them here
// would just be duplication for duplication's sake, not a useful control.
const AdminMenu = () => {
  const { currentUser, adminName, updateAdminName } = useLocalState();
  const { t, tn } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(adminName || '');
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const displayName = adminName || currentUser?.name || currentUser?.email || t('Admin', 'ایڈمن');
  // Don't transliterate an email fallback or the already-Urdu "Admin" label —
  // only a real typed name (adminName / currentUser.name) should go through tn().
  const isRealName = !!(adminName || currentUser?.name);
  const shownName = isRealName ? tn(displayName) : displayName;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) { setDraft(adminName || ''); setSaved(false); }
  }, [open]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === adminName) return;
    updateAdminName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 sm:gap-2.5 bg-slate-50 border border-slate-200 rounded-xl pl-2 pr-2.5 sm:pr-3.5 py-1.5 sm:py-2 hover:border-primary/30 hover:bg-primary/5 transition-all"
      >
        <span
          className="w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:block text-xs font-bold text-slate-600 truncate max-w-[140px]">
          {shownName}
        </span>
        <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <span
              className="w-11 h-11 rounded-xl text-white flex items-center justify-center text-base font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10707F, #0A4A55)' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">{shownName}</p>
              {currentUser?.email && <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>}
            </div>
          </div>

          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">{t('Display Name', 'دکھنے والا نام')}</label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Aapka naam..."
              className="input-field !py-2.5 text-sm flex-1"
            />
            <button
              onClick={handleSave}
              disabled={!draft.trim() || draft.trim() === adminName}
              className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark'
              }`}
              aria-label="Save display name"
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Pages whose content wants to run flush to the topbar/sidebar/right edge
// (the wave-background directories) instead of sitting inside the usual
// padded, centered column every other page uses.
const FULL_BLEED_PATHS = ['/view-customers', '/workers'];

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isFullBleed = FULL_BLEED_PATHS.some(p => location.pathname === p);
  return (
    <div className="flex fabric-bg min-h-screen overflow-x-hidden w-full max-w-full">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <NewWorkerAlert />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden w-full max-w-full min-w-0 lg:pl-72 justify-between">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        {isFullBleed ? (
          <main className="min-w-0 flex-1 w-full max-w-full flex flex-col justify-between">
            <div className="flex-1 w-full">{children}</div>
            <footer className="px-3.5 sm:px-6 lg:px-10 mt-auto w-full max-w-full">
              <div className="max-w-6xl mx-auto min-w-0 w-full">
                <PortalFooter />
              </div>
            </footer>
          </main>
        ) : (
          <main className="min-w-0 flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full flex flex-col justify-between">
            <div className="max-w-6xl mx-auto min-w-0 w-full flex-1">
              {children}
            </div>
            <footer className="max-w-6xl mx-auto min-w-0 w-full pt-8 mt-auto">
              <PortalFooter />
            </footer>
          </main>
        )}
      </div>
    </div>
  );
};

export default Layout;