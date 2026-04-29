import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  
  const navigate = useNavigate();
  const { loginState } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: email,
        password,
        honeypot
      });

      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        email: email,
        otp_code: otp
      });
      loginState({
        email: email,
        role: res.data.role,
        name: res.data.name
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="bg-brand-navy-light p-8 rounded-3xl shadow-2xl w-full max-w-md border border-brand-cyber-green/30">
        <h1 className="text-3xl font-black mb-6 text-center text-brand-cyber-green tracking-tighter uppercase">Sign In</h1>
        {error && <div className="bg-red-900/50 text-red-200 border border-red-500/50 p-3 rounded-xl mb-4 text-[10px] font-bold uppercase tracking-widest">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                className="w-full p-4 rounded-2xl bg-brand-navy border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-cyber-green text-white font-mono text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                className="w-full p-4 rounded-2xl bg-brand-navy border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-cyber-green text-white font-mono text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden">
              <input type="text" name="honeypot" tabIndex="-1" autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <button type="submit" className="w-full bg-brand-cyber-green hover:bg-brand-cyber-green/80 text-brand-navy font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(100,255,218,0.2)] uppercase text-sm tracking-widest">
              Get Security Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Verify your identity to access SOC.</p>
              

            </div>

            <div>
              <label className="block text-[10px] font-bold mb-3 text-slate-500 uppercase tracking-widest">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                maxLength="6"
                className="w-full p-4 rounded-2xl bg-brand-navy border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-cyber-green text-center tracking-[0.5em] text-2xl font-mono text-brand-cyber-green"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full bg-brand-cyber-green hover:bg-brand-cyber-green/80 text-brand-navy font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(100,255,218,0.2)] uppercase text-sm tracking-widest">
              Authenticate
            </button>
            <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-600 hover:text-brand-cyber-green uppercase tracking-widest transition">
              ← Back to login
            </button>
          </form>
        )}

        {step === 1 && (
          <p className="mt-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            New here? <Link to="/register" className="text-brand-cyber-green hover:underline">Create Account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
