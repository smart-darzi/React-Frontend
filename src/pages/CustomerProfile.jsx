import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/useLocalState';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from '../components/OrderDetailsModal';
import {
  User, Phone, MapPin, Ruler, History, Plus,
  ChevronRight, ChevronDown, Save, Trash2, Scissors,
  ClipboardCheck, Clock, Loader2, Pencil
} from 'lucide-react';
import { getAdminStatusLabel, getAdminStatusColor } from '../utils/stages';

// Generate quarter-inch options
const generateOptions = (min, max) => {
  const opts = [];
  for (let whole = min; whole <= max; whole++) {
    opts.push({ value: `${whole}`, label: `${whole}` });
    if (whole < max) {
      opts.push({ value: `${whole} 1/4`, label: `${whole} 1/4 (سوا)` });
      opts.push({ value: `${whole} 1/2`, label: `${whole} 1/2 (آدھا)` });
      opts.push({ value: `${whole} 3/4`, label: `${whole} 3/4 (پونا)` });
    }
  }
  return opts;
};

// Hoisted to module scope — was previously defined *inside* CustomerProfile,
// which meant React saw a brand-new component type on every re-render
// (every keystroke / selection). That forced every dropdown to fully
// unmount + remount, which is what caused the page to jump to the top
// each time a value was picked. Living outside the component now, it's a
// stable component type across re-renders, so it just updates in place.
const MeasureDropdown = ({ field, value, disabled, onChange }) => {
  const options = generateOptions(field.range[0], field.range[1]);
  const [open, setOpen] = useState(false);
  const selected = value || '';
  const selectedLabel = options.find(o => o.value === selected)?.label || selected;
  return (
    <div className="space-y-2 relative">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1 block leading-relaxed">
        {field.label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="input-field !py-3 !h-14 flex items-center justify-between text-base font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? selectedLabel : 'Please Select'}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 font-medium"
            >
              Please Select
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors ${
                  selected === opt.value ? 'bg-primary text-white' : 'text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, sizes, orders, designs, fetchSize, saveSize, deleteCustomer, updateOrderStatus, deleteOrder } = useLocalState();

  const customer = customers.find(c => c._id === id);
  const customerSize = sizes[id] || {};
  const customerOrders = orders.filter(o => o.customerId?.toString() === id?.toString());

  const [activeTab, setActiveTab] = useState('sizing');
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [sizeForm, setSizeForm] = useState(customerSize);
  const [loading, setLoading] = useState(false);
  const [fetchingSize, setFetchingSize] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const loadSize = useCallback(async () => {
    if (id && !sizes[id]) {
      setFetchingSize(true);
      try {
        const data = await fetchSize(id);
        if (data) setSizeForm(data);
      } catch (error) {
        console.error('Error loading size:', error);
      } finally {
        setFetchingSize(false);
      }
    } else if (sizes[id]) {
      setSizeForm(sizes[id]);
    }
  }, [fetchSize, id, sizes]);

  useEffect(() => {
    loadSize();
  }, [loadSize]);

  if (!customer) return <div className="p-10 text-center">Customer not found.</div>;

  const handleSaveSize = async () => {
    setLoading(true);
    setError('');
    try {
      await saveSize(id, sizeForm);
      setIsEditingSize(false);
    } catch {
      setError('Failed to save size. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setLoading(true);
      try {
        await deleteCustomer(id);
        navigate('/view-customers');
      } catch {
        setError('Failed to delete customer.');
        setLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch {
      alert('Failed to update order status.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Kya aap is order ko delete karna chahti hain? Yeh permanently remove ho jayega.')) return;
    setDeletingOrderId(orderId);
    try {
      await deleteOrder(orderId);
    } catch (error) {
      alert('Failed to delete order: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeletingOrderId(null);
    }
  };

  const sizingFields = [
    { key: 'length', label: 'Length of Shirt /قمیص کی لمبائی', range: [10, 50] },
    { key: 'shoulder', label: 'Shoulder /کندھے/تیرا', range: [10, 23] },
    { key: 'chest', label: 'Chest /چھاتی', range: [20, 60] },
    { key: 'neck', label: 'Neck / گلا', range: [10, 20] },
    { key: 'armRound', label: 'Arm Round/بازو کی گولائی', range: [4, 10] },
    { key: 'waist', label: 'Waist/Fitting/کمر', range: [15, 60] },
    { key: 'lengthOfTrouser', label: 'Length of Pant /پتلون یا شلوار کی لمبائی', range: [20, 60] },
    { key: 'ankleWidth', label: 'Ankle Width/ پانچہ', range: [4, 20] },
    { key: 'armscye', label: 'Armscye / آرم سائی (Optional)', range: [5, 15] },
  ];


  return (
    <div className="space-y-8 pb-20">
      {/* Header Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-primary/5"
      >
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-white text-3xl sm:text-5xl font-black shadow-2xl shadow-primary/30 rotate-3 flex-shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase break-words">{customer.name}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm mt-1 break-all">Customer ID: {customer._id}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-600 font-medium">
              <span className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl"><Phone size={18} className="text-primary" /> {customer.phoneNumber}</span>
              <span className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl"><MapPin size={18} className="text-primary" /> {customer.address}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/add-order', { state: { customerId: id } })} className="primary-btn px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20">
              <Plus size={20} /> New Order
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Trash2 size={24} />}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm font-bold mt-4 text-center">{error}</p>}
      </motion.div>

      {/* Tabs Section */}
      <div className="flex gap-4 p-2 bg-slate-100 rounded-[2rem] max-w-lg mx-auto md:mx-0">
        <button onClick={() => setActiveTab('sizing')} className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all ${activeTab === 'sizing' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <Ruler size={18} /> Sizing / ماپ
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-xl' : 'text-slate-400'}`}>
          <History size={18} /> History / تاریخ
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sizing' ? (
          <motion.div
            key="sizing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-card p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem]"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Measurement Table</h2>
              {!isEditingSize ? (
                <button onClick={() => setIsEditingSize(true)} className="text-primary font-bold flex items-center gap-2 bg-primary/5 px-5 py-2.5 rounded-xl hover:bg-primary/10 transition-all">
                  Edit Dimensions / تبدیلی
                </button>
              ) : (
                <button
                  onClick={handleSaveSize}
                  disabled={loading}
                  className="bg-primary text-white font-bold flex items-center gap-2 px-8 py-3 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save All / محفوظ کریں
                </button>
              )}
            </div>

            {fetchingSize ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Fetching measurements...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sizingFields.map(field => (
                  <MeasureDropdown
                    key={field.key}
                    field={field}
                    value={sizeForm[field.key]}
                    disabled={!isEditingSize}
                    onChange={(val) => setSizeForm(prev => ({ ...prev, [field.key]: val }))}
                  />
                ))}
              </div>
            )}
            {sizes[id] && (
              <p className="mt-10 text-center text-slate-400 text-sm italic">Last updated: {new Date(sizes[id].updatedAt).toLocaleString()}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {customerOrders.length === 0 ? (
              <div className="glass-card p-20 rounded-[3rem] text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No orders yet / ابھی تک کوئی آرڈر نہیں ہے</p>
                <button onClick={() => navigate('/add-order', { state: { customerId: id } })} className="mt-6 text-primary font-black hover:underline px-6 py-3 rounded-2xl bg-primary/5 transition-all">Create your first order?</button>
              </div>
            ) : (
              customerOrders.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                  className="glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group hover:scale-[1.01] transition-transform"
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black border-2 ${order.orderStatus === 'Completed' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-primary/5 text-primary border-primary/10'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{order.orderType}</h3>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${getAdminStatusColor(order)}`}>
                        {getAdminStatusLabel(order)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-slate-500 text-sm font-medium">
                      <span className="flex items-center gap-2"><ClipboardCheck size={14} /> Style: {order.neckStyle} / {order.cuffStyle}</span>
                      <span className="flex items-center gap-2"><Clock size={14} /> Created: {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {order.orderStatus === 'Pending' && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'Active')} 
                        className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.05] transition-all"
                      >
                        Start Order
                      </button>
                    )}
                    {order.orderStatus === 'Active' && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'Completed')} 
                        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:scale-[1.05] transition-all"
                      >
                        Mark Complete
                      </button>
                    )}
                    {order.orderStatus === 'Completed' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'Received By Customer')}
                        className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.05] transition-all"
                      >
                        Mark as Received
                      </button>
                    )}
                    {order.orderStatus === 'Received By Customer' && (
                      <button className="px-6 py-3 bg-purple-100 text-purple-600 rounded-xl font-bold cursor-default" disabled>
                        Delivered ✓
                      </button>
                    )}
                    {order.orderStatus !== 'Completed' && order.orderStatus !== 'Received By Customer' && (
                      <button
                        onClick={() => navigate('/add-order', { state: { editOrder: order } })}
                        className="p-4 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Edit Order"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronRight />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      disabled={deletingOrderId === order._id}
                      className="p-4 bg-red-50 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                      title="Delete Order"
                    >
                      {deletingOrderId === order._id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          customerName={customer.name}
          onClose={() => setSelectedOrder(null)}
          onEdit={(order) => { setSelectedOrder(null); navigate('/add-order', { state: { editOrder: order } }); }}
          designs={designs}
        />
      )}
    </div>
  );
};

export default CustomerProfile;