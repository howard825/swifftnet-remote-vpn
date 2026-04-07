import React from 'react';
import { Link } from 'react-router-dom';
import { IconShield, IconTelegram, IconCard, IconGoogle } from '../components/Icons';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      
      {/* 1. BRAND IDENTITY & NAVIGATION */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-8 max-w-7xl mx-auto border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="text-blue-500 scale-125"><IconShield /></div>
          <div className="flex flex-col">
            <span className="text-2xl font-black uppercase italic tracking-tighter leading-none">SwifftNet</span>
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Remote V3</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-600/20">
            Client Portal
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION - APP FUNCTIONALITY */}
      <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
          Secure <span className="text-blue-600">Remote</span> Access Solution.
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
          SwifftNet provides professional-grade VPN tunnels and port-forwarding services 
          designed specifically for <strong>MikroTik RouterOS</strong> users, network engineers, and gamers. 
          Access your local services anywhere in the world without a public IP.
        </p>
        <div className="flex justify-center gap-4 pt-4">
           <Link to="/login" className="bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 transition-all text-sm">
            Get Your Port Now
          </Link>
        </div>
      </section>

      {/* 3. TRANSPARENCY & DATA PURPOSE (Critical for Google Verification) */}
      <section className="px-6 py-16 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">Transparency & Data Usage</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center bg-slate-950 p-10 rounded-[40px] border border-slate-800 shadow-inner">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-500">
                <IconGoogle />
                <h3 className="font-black uppercase tracking-widest text-sm">Why Google Sign-In?</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                SwifftNet Remote requests access to your Google <strong>Email</strong> and <strong>Basic Profile</strong> solely for the purpose of 
                account authentication and identification. 
              </p>
              <ul className="text-[11px] text-slate-500 space-y-2 font-bold uppercase">
                <li>• No Password Stored (via Firebase Auth)</li>
                <li>• Instant Account Verification</li>
                <li>• Secure Management of VPN Subscriptions</li>
              </ul>
            </div>
            <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10">
              <p className="text-xs text-blue-300 italic leading-relaxed">
                "We respect your privacy. We only use your email to link your VPN assignments 
                and payment history to your identity. We never share your data with third parties."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICE INFORMATION */}
      <section className="px-6 py-24 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 space-y-4 group hover:bg-slate-900 transition-all">
          <h3 className="text-xl font-black uppercase italic text-blue-500">Winbox Remote</h3>
          <p className="text-slate-500 text-sm font-medium">Manage your MikroTik routers remotely via L2TP or SSTP tunnels. Secure and encrypted.</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 space-y-4 group hover:bg-slate-900 transition-all">
          <h3 className="text-xl font-black uppercase italic text-emerald-500">Internet VPN</h3>
          <p className="text-slate-500 text-sm font-medium">Global internet tunnels for private browsing. Masquerade your traffic with high-speed nodes.</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 space-y-4 group hover:bg-slate-900 transition-all">
          <h3 className="text-xl font-black uppercase italic text-orange-500">DDoS Shield</h3>
          <p className="text-slate-500 text-sm font-medium">Our nodes are protected by advanced firewall filters to keep your remote connection stable.</p>
        </div>
      </section>

      {/* 5. FOOTER & COMPLIANCE LINKS */}
      <footer className="py-20 border-t border-slate-900 bg-slate-950 text-center space-y-8">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <Link to="/" className="text-[10px] font-black uppercase text-white tracking-widest">Home</Link>
          <Link to="/login" className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-colors">Client Portal</Link>
          {/* MANDATORY PRIVACY LINK */}
          <Link to="/privacy-policy" className="text-[10px] font-black uppercase text-blue-500 hover:underline tracking-widest transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-use" className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-colors">Terms of Service</Link>
        </div>
        
        <div className="space-y-2">
          <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">SwifftNet Management © 2026</p>
          <p className="text-slate-800 text-[8px] font-black uppercase">Santa Ana, Cagayan Valley, Philippines</p>
        </div>
      </footer>

      {/* SUPPORT WIDGET (Intergram) */}
      <div className="fixed bottom-8 right-8 z-50">
        <button onClick={() => window.intergram?.open()} className="bg-slate-900 p-4 rounded-full border border-slate-800 shadow-2xl hover:bg-blue-600 transition-all group">
          <IconTelegram />
        </button>
      </div>
    </div>
  );
}