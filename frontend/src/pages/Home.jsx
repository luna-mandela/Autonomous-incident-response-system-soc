import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const SEVERITY_MAP = {
  High: { color: 'red', label: 'High' },
  Medium: { color: 'yellow', label: 'Medium' },
  Low: { color: 'green', label: 'Low' },
};

export default function Home() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const navigate = useNavigate();

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await api.get('/incidents/');
      setIncidents(res.data);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError('Failed to load global threat feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const getLightClass = (color) => {
    switch (color) {
      case 'green': return 'bg-brand-cyber-green shadow-[0_0_15px_rgba(100,255,218,0.7)]';
      case 'yellow': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.7)]';
      case 'red': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse';
      default: return 'bg-slate-500';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-brand-navy-light pt-20 pb-32 border-b border-brand-cyber-green/20">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-10 h-full w-full">
            {[...Array(100)].map((_, i) => (
              <div key={i} className="border border-brand-cyber-green/20"></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight uppercase">
            SHIELD THE <span className="text-brand-cyber-green italic">WEB</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            AIRS provides deep-layer <span className="text-white font-bold">Reporting</span> to detect vulnerabilities and triggers <span className="text-white font-bold">Autonomous Responses</span> like Virtual Patching and Threat Intelligence sharing to keep you safe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="bg-brand-cyber-green text-brand-navy px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(100,255,218,0.3)]"
            >
              START FREE SCAN
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-transparent border-2 border-slate-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all hover:bg-white/5 hover:border-white"
            >
              OPERATOR LOGIN
            </button>
          </div>
        </div>
      </div>

      {/* Global Threat Feed Section */}
      <div className="p-6 max-w-6xl mx-auto w-full -mt-16 relative z-20">
        <div className="bg-brand-navy p-8 rounded-3xl border border-brand-cyber-green/20 shadow-2xl overflow-hidden relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyber-green/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight uppercase">
                <span className="w-3 h-3 bg-brand-cyber-green rounded-full animate-pulse shadow-[0_0_8px_#64ffda]"></span>
                Global Threat Pulse
              </h2>
              <p className="text-slate-500 text-sm font-mono mt-1">REAL-TIME TELEMETRY FROM AIRS NODES</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-brand-cyber-green uppercase tracking-[0.2em] mb-1">Status</p>
              <p className="text-lg font-mono text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-cyber-green rounded-full"></span>
                CONNECTED
              </p>
            </div>
          </div>

          <div className="grid gap-10 md:grid-cols-3 relative z-10">
            <div className="md:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {loading && <div className="text-brand-cyber-green font-mono py-10 animate-pulse">SYNCHRONIZING WITH THREAT FEED...</div>}
              {!loading && incidents.length === 0 && <div className="text-slate-600 font-mono py-10">STREAMS CLEAR. NO INCIDENTS DETECTED.</div>}
              {incidents.map(inc => {
                const sev = SEVERITY_MAP[inc.severity_level] || { color: 'green', label: inc.severity_level };
                return (
                  <div key={inc.incident_id} className="bg-brand-navy-light/40 p-5 rounded-2xl border border-slate-800 flex items-start gap-5 transition hover:bg-brand-navy-light hover:border-slate-700">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getLightClass(sev.color)}`}></div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-100 text-sm truncate">{inc.trigger_event}</h3>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0">{formatTime(inc.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 font-mono uppercase tracking-widest">{inc.autonomous_action.split(',')[0]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <div className="bg-brand-navy-light/30 p-6 rounded-3xl border border-slate-800 shadow-inner">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Threat Distribution</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-red-500 font-black tracking-widest uppercase">Critical</span>
                      <span className="text-xl font-mono text-white">{incidents.filter(i => i.severity_level === 'High').length}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_10px_#ef4444]" style={{ width: `${(incidents.filter(i => i.severity_level === 'High').length / (incidents.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-amber-500 font-black tracking-widest uppercase">Warning</span>
                      <span className="text-xl font-mono text-white">{incidents.filter(i => i.severity_level === 'Medium').length}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_#f59e0b]" style={{ width: `${(incidents.filter(i => i.severity_level === 'Medium').length / (incidents.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-brand-cyber-green font-black tracking-widest uppercase">Safe</span>
                      <span className="text-xl font-mono text-white">{incidents.filter(i => i.severity_level === 'Low').length}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-cyber-green transition-all duration-1000 shadow-[0_0_10px_#64ffda]" style={{ width: `${(incidents.filter(i => i.severity_level === 'Low').length / (incidents.length || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-brand-cyber-green/5 border border-brand-cyber-green/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyber-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-[10px] text-brand-cyber-green font-black tracking-[0.2em] mb-3 uppercase">Active Protection</p>
                <p className="text-xs text-slate-400 leading-relaxed relative z-10 font-medium">
                  AIRS Nodes have intercepted <span className="text-white font-bold">{incidents.length}</span> threats in the last cycle using virtual patching technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
