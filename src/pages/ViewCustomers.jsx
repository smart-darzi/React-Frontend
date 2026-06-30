import React, { useState } from 'react';
import { useLocalState } from '../context/LocalStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Phone, MapPin, Eye, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ViewCustomers = () => {
  const { customers, deleteCustomer, loading } = useLocalState();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Loading Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Customer Directory</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Manage your elite clientele. / کسٹمرز کی فہرست</p>
        </div>

        <div className="relative group max-w-md w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search name or phone... / تلاش کریں"
            className="input-field pl-14 shadow-lg shadow-slate-200/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              key={customer._id}
              className="glass-card p-8 rounded-[2.5rem] relative group hover:shadow-2xl hover:shadow-primary/10 transition-all border-none"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <User size={28} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { if (window.confirm('Delete customer?')) deleteCustomer(customer._id); }}
                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1 uppercase tracking-tight">{customer.name}</h3>
                  <p className="text-slate-400 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} /> {customer.phoneNumber}
                  </p>
                </div>

                <div className="flex items-start gap-2 pt-2 text-slate-500 text-sm min-h-[40px]">
                  <MapPin size={14} className="mt-1 flex-shrink-0" />
                  <p className="line-clamp-2 italic">{customer.address}</p>
                </div>

                <Link
                  to={`/customer/${customer._id}`}
                  className="w-full mt-4 py-3 bg-slate-50 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold text-slate-600 transition-all group/btn"
                >
                  View Profile <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-600">No customers found / کوئی کسٹمر نہیں ملا</h3>
          <p className="text-slate-400 mt-1">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
};

export default ViewCustomers;
