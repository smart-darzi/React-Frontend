import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/LocalStateContext';
import { motion } from 'framer-motion';
import {
  Scissors, Search, ClipboardList,
  Palette, Library, CheckCircle,
  ChevronRight, ArrowLeft, Loader2
} from 'lucide-react';

const AddOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customers, addOrder } = useLocalState();

  const [formData, setFormData] = useState({
    customerId: location.state?.customerId || '',
    orderType: 'Shalwar Qamees /شلوار قمیص',
    neckStyle: 'Collar /کالر',
    cuffStyle: 'Cuff / کف والے بازو',
    pocketStyle: 'Front Pocket / سامنے والی جیب',
    buttonStyle: 'Fancy /فینسی بٹن',
    elastic: 'Elastic / لاسٹک',
    embroidery: 'No / کوئی نہیں',
    embroidaryStyle: 'Single Salai / سنگل سلائی',
    bookNumber: '1',
    designNumber: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCustomer = customers.find(c => c._id === formData.customerId);
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.toString().includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addOrder(formData);
      setIsSuccess(true);
      setTimeout(() => navigate('/view-orders'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ... rest of the file remains similar, just update the button

  const Section = ({ title, icon: Icon, children }) => (
    <div className="glass-card p-10 rounded-[3rem] space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Icon size={24} /></div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </div>
  );

  const Dropdown = ({ label, options, value, onChange }) => (
    <div className="space-y-3">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <select
        className="input-field appearance-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  if (isSuccess) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl">
          <CheckCircle size={48} />
        </motion.div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Order Saved Successfully!</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg"><Scissors size={32} /></div>
            New Tailoring Order
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-16">Custom craft perfection for every client.</p>
        </div>
        <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-2xl text-slate-400 hover:text-primary transition-colors shadow-xl shadow-slate-200">
          <ArrowLeft size={24} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Selection Section */}
        <Section title="Customer / کسٹمر کا انتخاب" icon={Search}>
          <div className="lg:col-span-3 space-y-4">
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black">{selectedCustomer.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase">{selectedCustomer.name}</h3>
                    <p className="text-primary font-bold">{selectedCustomer.phoneNumber}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, customerId: '' })} className="text-slate-400 font-bold hover:text-red-500 transition-colors">Change Customer</button>
              </div>
            ) : (
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  className="input-field pl-16 py-6 text-lg rounded-[2.5rem]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {filteredCustomers.map(c => (
                      <button key={c._id} type="button" onClick={() => setFormData({ ...formData, customerId: c._id })} className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between text-left group/item">
                        <div>
                          <p className="font-black text-slate-800 uppercase">{c.name}</p>
                          <p className="text-xs text-slate-400 font-bold">{c.phoneNumber}</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover/item:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Styling Section */}
        <Section title="Dress Styling / پرہیز" icon={Palette}>
          <Dropdown label="Order Type / آرڈر کی قسم" value={formData.orderType} onChange={(v) => setFormData({ ...formData, orderType: v })} options={['Shalwar Qamees /شلوار قمیص', 'Shirt /شرٹ', 'Kurta Shalwar /کُرتا پاجامہ', 'Waist Coat / ویس کوٹ', 'Trouser / ٹراؤزر']} />
          <Dropdown label="Neck Style / گلا" value={formData.neckStyle} onChange={(v) => setFormData({ ...formData, neckStyle: v })} options={['Collar /کالر', 'Ban /بین ']} />
          <Dropdown label="Cuff Style / کف" value={formData.cuffStyle} onChange={(v) => setFormData({ ...formData, cuffStyle: v })} options={['Cuff / کف والے بازو', 'Simple /سادہ بازو']} />
          <Dropdown label="Pocket Style / جیب" value={formData.pocketStyle} onChange={(v) => setFormData({ ...formData, pocketStyle: v })} options={[
            'Front Pocket / سامنے والی جیب',
            '2 Side Pockets / سائڈ جیب ',
            'Trouser Pocket / ٹراؤزر جیب ',
            '1 Front Pocket + 2 Side + 1 Shalwar',
            '0 Front Pocket + 0 Side + 0 Shalwar',
            '0 Front + 2 Side + 1 Trouser Pocket',
            '2 Front + 2 Side + 1 Shalwar',
            '0 Front + 1 Left Side + 0 Shalwar',
            '0 Front + 1 Right Side + 0 Shalwar'
          ]} />
          <Dropdown label="Button Style / بٹن" value={formData.buttonStyle} onChange={(v) => setFormData({ ...formData, buttonStyle: v })} options={['Fancy /فینسی بٹن', 'Simple /سادہ بٹن ', 'Metallic /میٹل بٹن']} />
          <Dropdown label="Elastic / لاسٹک" value={formData.elastic} onChange={(v) => setFormData({ ...formData, elastic: v })} options={['Elastic / لاسٹک', 'Simple/نالا']} />
        </Section>

        {/* Embroidery Section */}
        <Section title="Embroidery / کڑھائی" icon={Library}>
          <Dropdown label="Embroidery Style / کڑہائی کا سٹائل" value={formData.embroidaryStyle} onChange={(v) => setFormData({ ...formData, embroidaryStyle: v })} options={['Single Salai / سنگل سلائی', 'Double Salai /ڈبل سلائی', 'Raishmi Single/ریشمی سنگل', 'Raishmi Double/ریشمی ڈبل']} />
          <Dropdown label="Book Number / کتاب کا نمبر" value={formData.bookNumber} onChange={(v) => setFormData({ ...formData, bookNumber: v })} options={['1', '2', '3']} />
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Design Number / ڈیزائن نمبر</label>
            <input type="text" className="input-field" placeholder="Enter design code..." value={formData.designNumber} onChange={(e) => setFormData({ ...formData, designNumber: e.target.value })} />
          </div>
        </Section>

        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] text-center font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-8">
          <button
            type="submit"
            disabled={!formData.customerId || loading}
            className="primary-btn px-16 py-6 rounded-3xl flex items-center gap-4 text-xl shadow-2xl shadow-primary/30 hover:scale-[1.05] disabled:bg-slate-300 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>Save Order & Finish / آرڈر محفوظ کریں <ClipboardList size={28} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrder;
