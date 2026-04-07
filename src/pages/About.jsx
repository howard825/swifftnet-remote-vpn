import React from 'react';
import { IconShield } from '../components/Icons';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-slate-900/50 p-12 rounded-[50px] border border-slate-800 text-center space-y-8">
        <div className="flex justify-center text-blue-500 scale-150 mb-4"><IconShield /></div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">SwifftNet <span className="text-blue-600">Management</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Advanced Network Solutions</p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 pt-8">
          <div className="bg-slate-950/50 p-8 rounded-[40px] border border-blue-500/20">
            <h3 className="text-blue-500 font-black uppercase text-xs tracking-widest mb-2">Executive Leadership</h3>
            <p className="text-2xl font-black text-white italic">Howard Kingsley Ramos</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">CEO & Lead Developer</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto italic">
          "SwifftNet is built on the foundation of secure, high-speed remote access for the modern network era. 
          We specialize in MikroTik optimization and encrypted tunnels."
        </p>

        <div className="pt-6 text-slate-700 text-[9px] font-black uppercase">
          Based in Santa Ana, Cagayan Valley, Philippines
        </div>
      </div>
    </div>
  );
}