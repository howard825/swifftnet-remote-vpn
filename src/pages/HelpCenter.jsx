import React, { useState } from 'react';
import { IconShield, IconTelegram } from '../components/Icons';

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState(0);

  const faqs = [
    {
      category: "Networking & VPN",
      questions: [
        { q: "How to connect via L2TP/SSTP?", a: "Go to Winbox > PPP > Interface > Click (+). Select L2TP or SSTP Client. Input your assigned SwifftNet server address, username, and password. Enable 'Use Default Route' if you want to tunnel all traffic." },
        { q: "Can I use this for Port Forwarding?", a: "Yes. Once connected to our VPN, you can forward ports (like 80, 443, 8291) to access your local services remotely via our public nodes." },
        { q: "Why is my latency high?", a: "Check your local ISP connection first. Ensure you are connected to the SwifftNet node closest to your location (e.g., Manila or Singapore nodes)." }
      ]
    },
    {
      category: "Billing & Subscriptions",
      questions: [
        { q: "How long is the payment verification?", a: "Payments are verified within 1-12 hours. Please ensure you enter an exact reference number that match with your GCash/Bank receipt in the 'Payments' section." },
        { q: "Do you offer refunds?", a: "We offer a 24-hour trial period. Once a premium port is assigned and used beyond 24 hours, subscriptions are non-refundable." },
        { q: "Is there any hidden charge in purchasing any PLAN?", a: "None, all prices are fixed but may change without prior notice yet orders that have been accepted are not subject to change after acceptance in one (1) year time." },
        { q: "Is ther any contract?", a: "There are no contract and you can unsubscribe anytime you like, plan are purchased to order (PREPAID service)." }
      ]
    },
    {
      category: "Account Security",
      questions: [
        { q: "How to change my password?", a: "Go to 'My Profile' in the Navbar. You will need your old password to set a new one for security purposes." },
        { q: "I lost access to my email, what to do?", a: "Please contact SwifftNet Support immediately via Telegram or send us an email with your last transaction ID for identity verification." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center space-y-4 pt-10">
          <div className="inline-block p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-500 mb-4">
            <IconShield />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Help <span className="text-blue-600">Center</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Everything you need to know about SwifftNet</p>
        </div>

        {/* SEARCH BAR (Visual Only) */}
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Search for tutorials or troubleshooting..." 
            className="w-full bg-slate-900 border border-slate-800 p-5 rounded-[2rem] outline-none focus:border-blue-500 font-bold text-sm transition-all shadow-2xl"
          />
        </div>

        {/* FAQ ACCORDION */}
        <div className="space-y-8">
          {faqs.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-blue-500 font-black uppercase italic text-sm tracking-widest ml-4">{cat.category}</h2>
              <div className="grid gap-4">
                {cat.questions.map((item, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = activeTab === id;
                  return (
                    <div 
                      key={qIdx} 
                      onClick={() => setActiveTab(isOpen ? null : id)}
                      className={`cursor-pointer bg-slate-900/50 border ${isOpen ? 'border-blue-500' : 'border-slate-800'} p-6 rounded-[2.5rem] transition-all hover:bg-slate-900`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-sm uppercase italic tracking-tight">{item.q}</h3>
                        <span className={`text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                          <p className="text-slate-400 text-sm leading-relaxed font-medium italic">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA SECTION */}
        <div className="bg-blue-600 p-10 rounded-[3rem] text-center space-y-6 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
          <h3 className="text-2xl font-black uppercase italic">Still need help?</h3>
          <p className="text-blue-100 font-medium italic text-sm max-w-md mx-auto">Our lead developer and support team are available 24/7 via Telegram chat.</p>
          <button 
            onClick={() => window.intergram?.open()} 
            className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
          >
            Open Support Chat
          </button>
        </div>
      </div>
    </div>
  );
}