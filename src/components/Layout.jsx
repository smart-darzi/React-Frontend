import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  LogOut,
  Scissors,
  ClipboardList,
  Settings,
  HardHat
} from 'lucide-react';
import { useLocalState } from '../context/LocalStateContext';

const Sidebar = () => {
  const { logout } = useLocalState();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard / ڈیش بورڈ', to: '/', end: true },
    { icon: UserPlus, label: 'Add Customer / کسٹمر', to: '/add-customer' },
    { icon: Users, label: 'Customers / کسٹمرز', to: '/view-customers' },
    { icon: ClipboardList, label: 'Orders / آرڈرز', to: '/view-orders' },
    { icon: HardHat, label: 'Workers / ورکرز', to: '#' },
    { icon: Settings, label: 'Settings / ترتیبات', to: '#' },
  ];

  return (
    <div className="w-72 bg-primary text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50">
      <div className="p-8 flex items-center gap-3 border-b border-white/10">
        <div className="bg-white p-2.5 rounded-2xl shadow-lg rotate-3 group-hover:rotate-0 transition-all">
          <Scissors className="text-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Smart Master</h1>
          <p className="text-[9px] text-white/50 tracking-[0.2em] font-bold mt-1">OFFLINE VERSION</p>
        </div>
      </div>

      <nav className="flex-1 p-6 mt-4 space-y-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-white text-primary shadow-xl scale-[1.02] font-bold' 
                : 'hover:bg-white/5 text-white/70 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} className={isActive ? 'text-primary' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl hover:bg-red-500/20 text-red-100/70 hover:text-red-100 transition-all font-bold group"
        >
          <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Logout / لاگ آؤٹ</span>
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
