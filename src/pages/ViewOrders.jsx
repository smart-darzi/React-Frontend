import React from 'react';
import { useLocalState } from '../context/LocalStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, CheckCircle, Clock,
  User, Scissors, Calendar,
  ArrowRight, Search, Loader2
} from 'lucide-react';

const ViewOrders = () => {
  const { orders, customers, updateOrderStatus, loading } = useLocalState();

  const getCustomerName = (id) => {
    const c = customers.find(c => c._id === id);
    return c ? c.name : 'Unknown Customer';
  };

  const statusMetrics = {
    pending: orders.filter(o => o.orderStatus === 'Pending').length,
    active: orders.filter(o => o.orderStatus === 'Active').length,
    completed: orders.filter(o => o.orderStatus === 'Completed').length,
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading Orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Order Queue</h1>
          <p className="text-slate-500 mt-2 font-medium tracking-wide">Managing the flow of craftsmanship. / آرڈرز کی تفضیلات</p>
        </div>

        <div className="flex gap-4">
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-amber-200 bg-amber-50">
            <Clock className="text-amber-500" />
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase">Pending</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.pending}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-emerald-200 bg-emerald-50">
            <CheckCircle className="text-emerald-500" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase">Done</p>
              <p className="text-xl font-black text-slate-800">{statusMetrics.completed}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={order._id}
              className="glass-card p-10 rounded-[3rem] group hover:scale-[1.01] transition-all hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary text-3xl font-black border-2 border-primary/10 group-hover:rotate-6 transition-transform">
                  <Scissors size={32} />
                </div>

                <div className="flex-1 space-y-4 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{order.orderType}</h3>
                    <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${order.orderStatus === 'Pending' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                        order.orderStatus === 'Completed' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                          'bg-blue-100 text-blue-600 border-blue-200'
                      }`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                      <User size={18} className="text-primary" />
                      {getCustomerName(order.customerId)}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Calendar size={18} />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Neck / گلا</p>
                      <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{order.neckStyle}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuff / کف</p>
                      <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{order.cuffStyle}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Book / کتاب</p>
                      <p className="font-bold text-slate-700 text-sm">{order.bookNumber}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Design / ڈیزائن</p>
                      <p className="font-bold text-slate-700 text-sm">{order.designNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px] w-full lg:w-auto">
                  {order.orderStatus === 'Pending' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'Active')}
                      className="primary-btn w-full py-4 rounded-2xl shadow-lg shadow-primary/20"
                    >
                      Process Order
                    </button>
                  )}
                  {order.orderStatus === 'Active' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'Completed')}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all"
                    >
                      Finish Crafting
                    </button>
                  )}
                  <button className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                    Full Details <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-32 glass-card rounded-[4rem] border-4 border-dashed border-slate-100 bg-transparent">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ClipboardList size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">Your queue is empty</h3>
          <p className="text-slate-400 font-medium mt-2">Ready for a new masterpiece?</p>
        </div>
      )}
    </div>
  );
};

export default ViewOrders;
