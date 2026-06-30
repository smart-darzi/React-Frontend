import React from 'react';
import { useLocalState } from '../context/LocalStateContext';
import { Users, ClipboardList, CheckCircle, TrendingUp, Scissors, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.02] transition-all cursor-default"
  >
    <div className="space-y-2">
      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">{label}</p>
      <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h3>
    </div>
    <div className={`w-16 h-16 rounded-3xl ${color} flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform`}>
      <Icon size={32} />
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { getStats, loading } = useLocalState();
  const stats = getStats();

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading Dashboard...</p>
      </div>
    );
  }

  const cards = [
    { icon: Users, label: 'Total Customers / کل صارفین', value: stats.totalCustomers, color: 'bg-blue-500 shadow-blue-200', delay: 0.1 },
    { icon: ClipboardList, label: 'Active Orders / جاری آرڈرز', value: stats.activeOrders, color: 'bg-primary shadow-primary/20', delay: 0.2 },
    { icon: CheckCircle, label: 'Completed Today / آج مکمل', value: stats.completedToday, color: 'bg-emerald-500 shadow-emerald-200', delay: 0.3 },
  ];

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Dashboard</h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Mastering the art of tailoring, connected.</p>
        </div>
        <Link
          to="/add-customer"
          className="primary-btn px-8 py-5 rounded-2xl flex items-center gap-3 shadow-2xl shadow-primary/30 group"
        >
          <UserPlus size={24} />
          <span>New Customer / نیا کسٹمر</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, i) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-10 rounded-[3rem] relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-800 leading-tight">Quick Actions / تیز عمل</h2>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Link to="/add-order" className="p-6 bg-primary/5 rounded-3xl border border-primary/10 hover:bg-primary/10 transition-colors group">
                <Scissors className="text-primary mb-3 group-hover:rotate-12 transition-transform" />
                <p className="font-bold text-slate-800">New Order</p>
                <p className="text-xs text-slate-500 mt-1">Create tailoring job</p>
              </Link>
              <Link to="/view-customers" className="p-6 bg-blue-50 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                <Users className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-slate-800">Directory</p>
                <p className="text-xs text-slate-500 mt-1">Search customers</p>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-10 rounded-[3rem] bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl shadow-primary/30"
        >
          <h2 className="text-2xl font-black leading-tight">System Status / سسٹم کی حیثیت</h2>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <div>
                <p className="font-bold">Cloud Database Active</p>
                <p className="text-xs text-white/60">MongoDB persistence enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
              <TrendingUp className="text-white/80" />
              <div>
                <p className="font-bold">Performance Optimized</p>
                <p className="text-xs text-white/60">Backend API connected</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
