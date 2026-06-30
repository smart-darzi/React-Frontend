import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/LocalStateContext';
import { motion } from 'framer-motion';
import { UserPlus, User, Phone, MapPin, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const AddCustomer = () => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addCustomer } = useLocalState();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Map address to familyName for backend compatibility
      const customerData = {
        ...formData,
        familyName: formData.address,
        id: Math.floor(Math.random() * 10000) // Backend expects a numeric ID
      };
      const customer = await addCustomer(customerData);
      setIsSuccess(true);
      setTimeout(() => {
        navigate(`/customer/${customer._id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Saved Successfully!</h2>
          <p className="text-slate-500 font-medium mt-1">Redirecting to sizing... / ماپ کی طرف منتقلی</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
            <UserPlus size={32} />
          </div>
          Add New Customer
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-lg ml-16">Enter details to begin the tailoring journey.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-[3rem]"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest px-1">
                <User size={16} className="text-primary" />
                Full Name / نام
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Shahbaz Nawaz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest px-1">
                <Phone size={16} className="text-primary" />
                Phone Number / فون نمبر
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="03XXXXXXXXX"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest px-1">
              <MapPin size={16} className="text-primary" />
              Address / پتہ
            </label>
            <textarea
              className="input-field min-h-[120px] resize-none py-4"
              placeholder="Full address details..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 text-lg group shadow-2xl shadow-primary/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>Register & Continue / رجسٹر کریں <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddCustomer;
