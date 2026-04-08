import React, { useState, useEffect } from 'react';
import { IconShield, IconCheck } from './Icons';

export default function NetworkToolbox() {
  const [publicIP, setPublicIP] = useState("Detecting...");
  const [latency, setLatency] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // 1. GET PUBLIC IP (Free API)
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setPublicIP(data.ip))
      .catch(() => setPublicIP("Error detecting IP"));
  }, []);

  // 2. LATENCY / PING TEST (HTTP-based RTT)
  const testLatency = async () => {
    setIsTesting(true);
    setLatency("Testing...");
    const start = Date.now();
    try {
      // Mag-fe-fetch tayo sa server mo para makuha ang actual RTT
      await fetch('https://remote.swifftnet.site', { mode: 'no-cors', cache: 'no-cache' });
      const end = Date.now();
      setLatency(`${end - start}ms`);
    } catch (err) {
      setLatency("Timeout");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-8 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="text-blue-500 scale-110"><IconShield /></div>
        <h2 className="text-lg font-black uppercase italic tracking-widest text-white">Network Toolbox</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* PUBLIC IP DISPLAY */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Your Public IP</p>
          <p className="text-xl font-mono font-black text-blue-400">{publicIP}</p>
          <p className="text-[7px] text-slate-700 font-bold uppercase italic">Detected via IPify Cloud</p>
        </div>

        {/* LATENCY TEST */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Server Latency</p>
            <p className={`text-xl font-mono font-black ${latency === 'Timeout' ? 'text-red-500' : 'text-emerald-500'}`}>
              {latency || '---'}
            </p>
          </div>
          <button 
            onClick={testLatency} 
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Ping'}
          </button>
        </div>

        {/* PORT STATUS CHECKER (Link to external for zero-cost accuracy) */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">External Port Audit</p>
             <p className="text-[11px] font-medium text-slate-400 italic leading-tight">Validate if your assigned port is reachable from the public internet.</p>
          </div>
          <a 
            href="https://portchecker.co/" 
            target="_blank" 
            className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl text-[9px] font-black uppercase text-center border border-slate-700 transition-all"
          >
            Open Port Checker →
          </a>
        </div>

      </div>
    </section>
  );
}