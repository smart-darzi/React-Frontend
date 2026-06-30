import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalState } from '../context/LocalStateContext';
import { Scissors, Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useLocalState();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Invalid credentials / غلط معلومات');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="text-center mb-10">
            <div className="bg-primary w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30 rotate-3">
              <Scissors className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">MASTER LOGIN</h1>
            <p className="text-slate-500 mt-2 font-medium tracking-wide">Enter your tailoring portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email / ای میل</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="admin@sd.com"
                  className="input-field pl-14"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password / پاس ورڈ</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field pl-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100"
              >
                <ShieldCheck size={18} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="primary-btn w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-lg group shadow-xl shadow-primary/20"
            >
              Sign In <LogIn className="group-hover:translate-x-1 transition-transform" size={22} />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Demo Credentials: <span className="text-primary font-bold">admin@sd.com / admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
