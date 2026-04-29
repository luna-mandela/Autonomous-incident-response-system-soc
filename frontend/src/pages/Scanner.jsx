import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Scanner() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [shieldActive, setShieldActive] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setScanning(true);
    setResult(null);
    setError('');
    setShieldActive(false);

    try {
      const res = await api.post('/scanner/scan', { url });
      setResult(res.data);
      if (res.data.risk_score >= 40) {
        setShieldActive(true);
      }
    } catch (err) {
      console.error("Scan Error:", err);
      const detail = err.response?.data?.detail;
      setError(detail || 'Connection Error: Backend unreachable or internal crash.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">
          AIRS <span className="text-brand-cyber-green">REPORT</span> ENGINE
        </h1>
        <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">External Vulnerability & Threat Detection System</p>
      </div>

      <div className="bg-brand-navy-light p-8 rounded-3xl shadow-2xl border border-slate-800 mb-10 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyber-green/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <form onSubmit={handleScan} className="relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <input 
                type="text" 
                placeholder="Enter Target URL (e.g., malicious-site.com)"
                className="w-full p-5 rounded-2xl bg-brand-navy border border-slate-700 focus:ring-2 focus:ring-brand-cyber-green text-white outline-none font-mono text-lg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Target_Input</div>
            </div>
            <button 
              type="submit" 
              disabled={scanning}
              className={`px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                scanning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 
                'bg-brand-cyber-green text-brand-navy hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(100,255,218,0.2)]'
              }`}
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
                  REPORTING...
                </>
              ) : 'INITIATE REPORT'}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-red-500 text-xs font-bold font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Blacklist Specific Warning */}
          {result.status === 'Blacklisted' && (
            <div className="bg-red-600 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-pulse">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-center md:text-left text-white">
                <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">CRITICAL: DATA THEFT PREVENTED</h3>
                <p className="font-bold text-lg leading-tight">
                  AIRS has identified this site as a known MALICIOUS ENTITY. 
                  <span className="block mt-2 text-red-100 text-sm font-medium">
                    Do NOT enter any personal information, credit card details, or credentials. This site is designed to harvest your data for identity theft.
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Shield Status Banner */}
          {shieldActive && result.status !== 'Blacklisted' && (
            <div className="bg-brand-cyber-green/10 border-2 border-brand-cyber-green/50 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-[0_0_40px_rgba(100,255,218,0.1)]">
              <div className="relative">
                <div className="w-20 h-20 bg-brand-cyber-green/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyber-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-cyber-green rounded-full border-4 border-brand-navy flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-navy rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                  AIRS ACTIVE SHIELD <span className="bg-brand-cyber-green text-brand-navy text-[10px] px-2 py-0.5 rounded font-black">DEPLOYED</span>
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Virtual patching has been applied. Malicious traffic from <span className="text-brand-cyber-green font-mono">{result.url}</span> is being intercepted and rerouted to a secure sandbox.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase text-center">Threat Intel Status</span>
                <div className="bg-slate-800 px-4 py-2 rounded-xl text-brand-cyber-green font-mono text-xs border border-slate-700">
                  URL_BLACKLISTED: TRUE
                </div>
              </div>
            </div>
          )}

          {/* Result Card */}
          <div className={`rounded-3xl p-8 border-2 ${
            result.status === 'Safe' ? 'bg-brand-navy-light/30 border-brand-cyber-green/20' : 
            result.status === 'Dangerous' || result.status === 'Blacklisted' ? 'bg-red-900/10 border-red-500/30' : 
            'bg-amber-900/10 border-amber-500/30'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Scan Results for</div>
                <h2 className="text-3xl font-black text-white break-all">{result.url}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    result.status === 'Safe' ? 'bg-brand-cyber-green text-brand-navy' : 
                    result.status === 'Dangerous' || result.status === 'Blacklisted' ? 'bg-red-600 text-white' : 
                    'bg-amber-500 text-white'
                  }`}>
                    {result.status}
                  </span>
                  {result.incident_id && (
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="text-[10px] text-slate-500 hover:text-brand-cyber-green font-mono bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700 transition"
                    >
                      LOG_ID: {result.incident_id.split('-')[0]}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-brand-navy p-6 rounded-3xl border border-slate-800 min-w-[200px] text-center shadow-inner">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Aggregated Risk</div>
                <div className={`text-6xl font-black leading-none ${
                  result.risk_score > 75 ? 'text-red-500' : 
                  result.risk_score > 40 ? 'text-amber-500' : 
                  'text-brand-cyber-green'
                }`}>
                  {result.risk_score}<span className="text-2xl text-slate-700">/100</span>
                </div>
                <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      result.risk_score > 75 ? 'bg-red-500' : 
                      result.risk_score > 40 ? 'bg-amber-500' : 
                      'bg-brand-cyber-green'
                    }`}
                    style={{ width: `${result.risk_score}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vulnerabilities List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Findings Report
                </h3>
                
                {result.vulnerabilities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {result.vulnerabilities.map((vuln, idx) => (
                      <div key={idx} className="bg-brand-navy-light/40 p-4 rounded-2xl border border-slate-800/50 flex items-start gap-4 hover:border-slate-700 transition group">
                        <div className={`p-2 rounded-xl mt-1 ${
                          vuln.severity === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-100">{vuln.type}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                              vuln.severity === 'High' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{vuln.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-brand-cyber-green/5 p-12 rounded-3xl border border-brand-cyber-green/10 text-center">
                    <div className="w-16 h-16 bg-brand-cyber-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-cyber-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-brand-cyber-green font-black uppercase tracking-widest">Target Verified Clean</p>
                    <p className="text-slate-500 text-xs mt-2 font-mono">No heuristic anomalies detected in current report cycle.</p>
                  </div>
                )}
              </div>

              {/* Recommendation & Mitigation */}
              <div className="space-y-6">
                <div className="bg-brand-navy p-6 rounded-3xl border border-slate-800 shadow-xl">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Response Protocol</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-brand-cyber-green/10 text-brand-cyber-green rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{result.recommendation}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-[10px] font-black text-brand-cyber-green uppercase mb-2">Automated Mitigations:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-[10px] text-slate-400">
                          <div className={`w-1.5 h-1.5 rounded-full ${shieldActive ? 'bg-brand-cyber-green shadow-[0_0_5px_#64ffda]' : 'bg-slate-700'}`}></div>
                          Virtual Patching {shieldActive ? 'Active' : 'N/A'}
                        </li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400">
                          <div className={`w-1.5 h-1.5 rounded-full ${shieldActive ? 'bg-brand-cyber-green shadow-[0_0_5px_#64ffda]' : 'bg-slate-700'}`}></div>
                          Traffic Interception {shieldActive ? 'Active' : 'N/A'}
                        </li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400">
                          <div className={`w-1.5 h-1.5 rounded-full ${shieldActive ? 'bg-brand-cyber-green shadow-[0_0_5px_#64ffda]' : 'bg-slate-700'}`}></div>
                          Blacklist Broadcast {shieldActive ? 'Active' : 'N/A'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-navy-light/20 p-6 rounded-3xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 italic leading-relaxed">
                    AIRS Report Engine utilizes advanced crawling and heuristic analysis to identify threats before they impact your network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
