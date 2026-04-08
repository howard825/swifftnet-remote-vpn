import React, { useState } from 'react';
import { IconShield, IconCheck, IconCopy } from './Icons';

export default function NetworkUtils() {
  // --- IP SUBNET STATES ---
  const [cidr, setCidr] = useState("192.168.88.1/24");
  const [ipResult, setIpResult] = useState(null);

  // --- MAC LOOKUP STATES ---
  const [mac, setMac] = useState("");
  const [vendor, setVendor] = useState(null);
  const [loadingMac, setLoadingMac] = useState(false);

  // --- PORT TESTER STATES ---
  const [testIp, setTestIp] = useState("");
  const [testPort, setTestPort] = useState("");
  const [testStatus, setTestStatus] = useState(null);

  // --- PTP PLANNER STATES ---
  const [dist, setDist] = useState(5); 
  const [gain, setGain] = useState(23); 
  const [signal, setSignal] = useState(null);

  // --- ROI CALCULATOR STATES ---
  const [ispCost, setIspCost] = useState(2500);
  const [clients, setClients] = useState(10);
  const [monthlyFee, setMonthlyFee] = useState(500);

  // --- LOGIC FUNCTIONS ---

  const calculateSubnet = () => {
    try {
      const [ip, mask] = cidr.split('/');
      const maskNum = parseInt(mask);
      if (maskNum < 0 || maskNum > 32) throw new Error();
      const ipParts = ip.split('.').map(Number);
      const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const maskHex = maskNum === 0 ? 0 : (~0 << (32 - maskNum));
      const netId = ipNum & maskHex;
      const broadcast = netId | ~maskHex;
      const numHosts = Math.pow(2, 32 - maskNum) - 2;
      const toIP = (num) => [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
      setIpResult({ network: toIP(netId), broadcast: toIP(broadcast), range: `${toIP(netId + 1)} - ${toIP(broadcast - 1)}`, hosts: numHosts < 0 ? 0 : numHosts.toLocaleString() });
    } catch (e) { alert("Invalid CIDR format!"); }
  };

  const lookupMac = async () => {
    if (mac.length < 6) return;
    setLoadingMac(true);
    try {
      const res = await fetch(`https://api.macvendors.com/${mac}`);
      if (res.ok) { setVendor(await res.text()); } 
      else { setVendor("Unknown Vendor"); }
    } catch (e) { setVendor("API Error"); } 
    finally { setLoadingMac(false); }
  };

  const checkPort = async () => {
    if(!testIp || !testPort) return;
    setTestStatus("checking");
    try {
      const res = await fetch(`https://api.hackertarget.com/nmap/?q=${testIp}`);
      const text = await res.text();
      setTestStatus(text.includes(testPort) && text.includes("open") ? "open" : "closed");
    } catch (e) { setTestStatus("error"); }
  };

  const calculatePTP = () => {
    const fspl = 20 * Math.log10(dist) + 20 * Math.log10(5800) + 32.44;
    const totalSignal = 27 + (Number(gain) * 2) - fspl;
    setSignal(Math.round(totalSignal));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* GRID 1: SUBNET & MAC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🧮 IP SUBNET MASTER */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
          <h3 className="text-xs font-black uppercase text-blue-500 tracking-[0.3em] italic">Subnet Calculator</h3>
          <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <input value={cidr} onChange={(e) => setCidr(e.target.value)} placeholder="192.168.88.1/24" className="flex-1 bg-transparent px-4 py-2 outline-none font-mono text-sm text-blue-400" />
            <button onClick={calculateSubnet} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Calc</button>
          </div>
          {ipResult && (
            <div className="grid grid-cols-2 gap-4 text-[10px] font-mono animate-in slide-in-from-top-2">
              <div className="bg-black/40 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-slate-600 uppercase font-black mb-1">Network</p>
                <p className="text-white font-black">{ipResult.network}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-slate-600 uppercase font-black mb-1">Broadcast</p>
                <p className="text-white font-black">{ipResult.broadcast}</p>
              </div>
              <div className="col-span-2 bg-black/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                <p className="text-emerald-500 font-black">{ipResult.range}</p>
                <p className="text-white font-black">Hosts: {ipResult.hosts}</p>
              </div>
            </div>
          )}
        </div>

        {/* 🔍 MAC OUI LOOKUP */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
          <h3 className="text-xs font-black uppercase text-emerald-500 tracking-[0.3em] italic">MAC OUI Lookup</h3>
          <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <input value={mac} onChange={(e) => setMac(e.target.value)} placeholder="AA:BB:CC" className="flex-1 bg-transparent px-4 py-2 outline-none font-mono text-sm text-emerald-400 uppercase" />
            <button onClick={lookupMac} className="bg-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Find</button>
          </div>
          <div className="min-h-[60px] flex items-center justify-center bg-black/40 rounded-3xl border border-slate-800/50 p-4 text-center">
            {loadingMac ? <span className="animate-pulse text-[10px] font-black uppercase text-slate-600 tracking-widest">Searching...</span> : <span className="text-xs font-black text-white italic">{vendor || "Identify Hardware brand"}</span>}
          </div>
        </div>
      </div>

      {/* GRID 2: PORT TESTER & PTP PLANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🌐 PORT REACHABILITY */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
          <h3 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] italic">Remote Port Tester</h3>
          <input value={testIp} onChange={e=>setTestIp(e.target.value)} placeholder="IP / Hostname" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-mono text-xs text-blue-400" />
          <div className="flex gap-2">
            <input value={testPort} onChange={e=>setTestPort(e.target.value)} placeholder="Port (8291)" className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-mono text-xs text-blue-400" />
            <button onClick={checkPort} className="bg-blue-600 px-8 rounded-2xl font-black uppercase text-[10px]">Test</button>
          </div>
          {testStatus && (
            <div className={`p-4 rounded-2xl border text-center text-[10px] font-black uppercase tracking-widest ${testStatus === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {testStatus === 'checking' ? 'Scanning...' : `Status: ${testStatus}`}
            </div>
          )}
        </div>

        {/* 📶 PTP SIGNAL PLANNER */}
        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
          <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic">Wireless PTP Planner</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-600 uppercase ml-2">Dist (km)</label>
              <input type="number" value={dist} onChange={e=>setDist(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none text-xs font-black text-white text-center" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-600 uppercase ml-2">Antenna (dBi)</label>
              <input type="number" value={gain} onChange={e=>setGain(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none text-xs font-black text-white text-center" />
            </div>
          </div>
          <button onClick={calculatePTP} className="w-full bg-emerald-600 py-3 rounded-2xl font-black uppercase text-[10px]">Analyze Signal</button>
          {signal && (
            <div className="text-center animate-in zoom-in-95">
              <p className="text-4xl font-black italic">{signal} <span className="text-xs text-slate-500 uppercase not-italic">dBm</span></p>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800"><div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${Math.max(0, 100 + signal)}%` }} /></div>
            </div>
          )}
        </div>
      </div>

      {/* 💸 WISP ROI CALCULATOR */}
      <div className="bg-slate-900/50 p-10 rounded-[50px] border border-slate-800 space-y-8 shadow-2xl mt-8">
        <h3 className="text-sm font-black uppercase text-orange-500 tracking-[0.3em] italic border-b border-slate-800/50 pb-6">WISP Profit & ROI Manager</h3>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div><label className="text-[9px] font-black text-slate-600 uppercase ml-4 block mb-2">ISP Monthly Cost</label><input type="number" value={ispCost} onChange={e=>setIspCost(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-white text-center" /></div>
            <div><label className="text-[9px] font-black text-slate-600 uppercase ml-4 block mb-2">Total Clients</label><input type="number" value={clients} onChange={e=>setClients(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-blue-400 text-center" /></div>
            <div><label className="text-[9px] font-black text-slate-600 uppercase ml-4 block mb-2">Monthly Fee/Client</label><input type="number" value={monthlyFee} onChange={e=>setMonthlyFee(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-emerald-500 text-center" /></div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-8 rounded-[40px] border border-slate-800/50 text-center flex flex-col justify-center">
              <p className="text-[10px] text-slate-600 font-black uppercase mb-1">Gross Revenue</p>
              <h4 className="text-4xl font-black text-white italic">₱{(clients * monthlyFee).toLocaleString()}</h4>
            </div>
            <div className="bg-black/40 p-8 rounded-[40px] border border-emerald-500/20 text-center flex flex-col justify-center">
              <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Net Monthly Profit</p>
              <h4 className="text-5xl font-black text-emerald-500 italic">₱{((clients * monthlyFee) - ispCost - 500).toLocaleString()}</h4>
            </div>
            <div className="md:col-span-2 bg-orange-600/5 p-6 rounded-[30px] border border-orange-500/10 text-center">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic">ROI Efficiency: {Math.round(((clients * monthlyFee) / ispCost) * 100)}% Monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📉 ISP CAPACITY PLANNER (Original Location Kept) */}
      <div className="bg-slate-900/50 p-10 rounded-[50px] border border-slate-800 space-y-10 shadow-2xl relative overflow-hidden mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/50 pb-8">
          <div><h3 className="text-sm font-black uppercase text-orange-500 tracking-[0.3em] italic">ISP Capacity Planner</h3><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Estimate bandwidth & monthly data consumption</p></div>
          <div className="bg-orange-500/10 px-4 py-2 rounded-2xl border border-orange-500/20 text-[10px] font-black text-orange-500 uppercase italic">Network Architect Tool</div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase ml-4 text-left block">Users</label><input type="number" defaultValue={10} id="plannerUsers" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-blue-400 text-center" /></div>
            <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase ml-4 text-left block">Profile</label><select id="plannerType" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-emerald-400 text-[10px] uppercase"><option value="1.5">Light Browsing</option><option value="5" selected>Standard HD</option><option value="25">Heavy 4K</option></select></div>
            <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase ml-4 text-left block">Contention</label><select id="plannerRatio" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-slate-400 text-[10px] uppercase"><option value="1">1:1 (Dedicated)</option><option value="4" selected>1:4 (Standard)</option><option value="10">1:10 (Home)</option></select></div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-8 rounded-[40px] border border-slate-800/50 text-center"><p className="text-[9px] text-slate-600 font-black uppercase mb-2 leading-none">Recommended Bandwidth</p><h4 className="text-5xl font-black text-white italic" id="recSpeed">--</h4><p className="text-[10px] text-blue-500 font-black uppercase mt-1">Mbps Total</p></div>
            <div className="bg-black/40 p-8 rounded-[40px] border border-slate-800/50 text-center"><p className="text-[9px] text-slate-600 font-black uppercase mb-2 leading-none">Monthly Data Estimate</p><h4 className="text-4xl font-black text-orange-400 italic" id="estData">--</h4><p className="text-[10px] text-slate-500 font-black uppercase mt-1">GB / Month</p></div>
            <div className="md:col-span-2"><button onClick={() => { const u = document.getElementById('plannerUsers').value; const t = document.getElementById('plannerType').value; const r = document.getElementById('plannerRatio').value; const speed = (u * t) / r; const monthlyGB = (speed / 8) * 3600 * 8 * 30 / 1024; document.getElementById('recSpeed').innerText = Math.round(speed); document.getElementById('estData').innerText = Math.round(monthlyGB).toLocaleString(); }} className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-[30px] font-black uppercase text-xs tracking-[0.2em] shadow-xl">Generate Capacity Report</button></div>
          </div>
        </div>
      </div>

    </div>
  );
}