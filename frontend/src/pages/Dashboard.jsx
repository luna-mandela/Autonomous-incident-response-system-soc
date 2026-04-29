import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const SEVERITY_MAP = {
  High: { color: 'red', label: 'High' },
  Medium: { color: 'yellow', label: 'Medium' },
  Low: { color: 'green', label: 'Low' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await api.get('/incidents/');
      setIncidents(res.data);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError('SOC Link Offline. Check Backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000); // Fast refresh for SOC
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.post('/scanner/scan', { url });
      setScanResult(res.data);
      setUrl('');
      fetchIncidents(); // Refresh feed to see new incident if any
    } catch (err) {
      console.error("Quick Scan Error:", err);
      const detail = err.response?.data?.detail;
      setError(detail || 'Scan Failed: Backend unreachable or internal crash.');
      setTimeout(() => setError(''), 10000);
    } finally {
      setScanning(false);
    }
  };

  const getLightClass = (color) => {
    switch (color) {
      case 'green': return 'bg-brand-cyber-green shadow-[0_0_10px_#64ffda]';
      case 'yellow': return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
      case 'red': return 'bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* SOC Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <span className="w-4 h-4 bg-red-600 rounded-full animate-ping"></span>
            SOC COMMAND <span className="text-brand-cyber-green">&</span> CONTROL
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-1 uppercase">OPERATOR: {user?.name?.toUpperCase()} // SYSTEM: AIRS_v2.0</p>
        </div>
        <div className="bg-brand-navy-light px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Uptime</p>
            <p className="text-brand-cyber-green font-mono">99.98%</p>
          </div>
          <div className="text-center border-l border-slate-700 pl-6">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Threats Blocked</p>
            <p className="text-red-500 font-mono">{incidents.filter(i => i.severity_level === 'High').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Quick Engine Trigger */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-navy-light p-6 rounded-3xl border border-brand-cyber-green/30 shadow-[0_0_30px_rgba(100,255,218,0.05)]">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Detection Engine</h3>
            <form onSubmit={handleQuickScan} className="space-y-4">
              <input 
                type="text" 
                placeholder="Target URL..."
                className="w-full bg-brand-navy border border-slate-700 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyber-green outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                type="submit"
                disabled={scanning}
                className="w-full bg-brand-cyber-green text-brand-navy font-black py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {scanning ? 'REPORTING...' : 'INITIATE REPORT'}
              </button>
            </form>

            {/* Quick Result Feedback */}
            {scanResult && (
              <div className={`mt-4 p-4 rounded-xl border animate-in fade-in duration-500 ${
                scanResult.status === 'Safe' ? 'bg-brand-cyber-green/10 border-brand-cyber-green/30 text-brand-cyber-green' : 
                'bg-red-900/10 border-red-500/30 text-red-500'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase">Status: {scanResult.status}</span>
                  <span className="text-[10px] font-mono">Risk: {scanResult.risk_score}</span>
                </div>
                <p className="text-[9px] leading-tight opacity-80">{scanResult.recommendation}</p>
                <button 
                  onClick={() => navigate('/scanner')} 
                  className="mt-2 text-[9px] font-bold underline hover:text-white transition"
                >
                  View Full Forensic Report →
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-600/10 border border-red-600/30 text-red-500 text-[10px] font-bold rounded-lg animate-pulse">
                {error}
              </div>
            )}

            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
              Crawl engine will analyze headers, HTML patterns, and domain reputation. Malicious findings trigger auto-response.
            </p>
          </div>

          <div className="bg-brand-navy/30 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Autonomous Policies</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 bg-brand-cyber-green rounded-full"></span> Auto-Blacklist URL
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 bg-brand-cyber-green rounded-full"></span> Admin Console Alert
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 bg-brand-cyber-green rounded-full"></span> Forensic Report Generation
              </li>
            </ul>
          </div>
        </div>

        {/* Right Content: The Incident Ledger */}
        <div className="lg:col-span-3">
          <div className="bg-brand-navy-light rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-brand-navy-light/50">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Active Incident Ledger</h3>
                <p className="text-xs text-slate-500">Live feed of scanner findings and autonomous responses.</p>
              </div>
              <span className="text-[10px] bg-brand-cyber-green/10 text-brand-cyber-green px-3 py-1 rounded-full font-mono">LIVE_STREAM</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
                    <th className="px-6 py-4 font-bold">Severity</th>
                    <th className="px-6 py-4 font-bold">Trigger Event</th>
                    <th className="px-6 py-4 font-bold">Autonomous Action</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {loading && (
                    <tr><td colSpan="5" className="px-6 py-20 text-center text-brand-cyber-green font-mono">DECRYPTING LEDGER...</td></tr>
                  )}
                  {!loading && incidents.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-500">No incidents detected. Systems nominal.</td></tr>
                  )}
                  {incidents.map(inc => {
                    const sev = SEVERITY_MAP[inc.severity_level] || { color: 'green', label: inc.severity_level };
                    return (
                      <tr key={inc.incident_id} className="hover:bg-brand-navy transition group cursor-default">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getLightClass(sev.color)}`}></div>
                            <span className={`text-[10px] font-black uppercase ${sev.color === 'red' ? 'text-red-500' : sev.color === 'yellow' ? 'text-amber-500' : 'text-brand-cyber-green'}`}>
                              {sev.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-200">{inc.trigger_event}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[11px] text-slate-400 max-w-xs">{inc.autonomous_action}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {inc.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-xs font-mono text-slate-500 uppercase">
                          {new Date(inc.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
