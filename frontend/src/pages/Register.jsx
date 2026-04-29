import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    honeypot: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        honeypot: formData.honeypot
      });
      alert(res.data.msg);
      navigate('/login');
    } catch (err) {
      console.error("Full Registration Error:", err);
      if (err.response) {
        setError(err.response.data?.detail || JSON.stringify(err.response.data));
      } else {
        setError(err.message || 'Network Error or CORS issue');
      }
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="bg-brand-navy-light p-8 rounded-2xl shadow-2xl w-full max-w-md border border-brand-cyber-green/30">
        <h1 className="text-3xl font-bold mb-6 text-center text-brand-cyber-green">Sign Up</h1>
        {error && <div className="bg-red-900/50 text-red-200 border border-red-500/50 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Full Name</label>
            <input 
              type="text" name="name"
              className="w-full p-2.5 rounded bg-brand-navy border border-slate-700 focus:ring-2 focus:ring-brand-cyber-green text-white outline-none"
              value={formData.name} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Email Address</label>
            <input 
              type="email" name="email"
              className="w-full p-2.5 rounded bg-brand-navy border border-slate-700 focus:ring-2 focus:ring-brand-cyber-green text-white outline-none"
              value={formData.email} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Password</label>
            <input 
              type="password" name="password"
              className="w-full p-2.5 rounded bg-brand-navy border border-slate-700 focus:ring-2 focus:ring-brand-cyber-green text-white outline-none"
              value={formData.password} onChange={handleChange} required
            />
          </div>
          
          <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden">
            <input type="text" name="honeypot" tabIndex="-1" autoComplete="off" value={formData.honeypot} onChange={handleChange} />
          </div>

          <button type="submit" className="w-full bg-brand-cyber-green hover:bg-brand-cyber-green/80 text-brand-navy font-black py-3 rounded mt-2 transition-all shadow-[0_0_15px_rgba(100,255,218,0.3)]">
            Create Account
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-cyber-green font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
