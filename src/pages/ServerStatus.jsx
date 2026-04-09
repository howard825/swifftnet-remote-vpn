import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function ServerStatus() {
  const [nodes, setNodes] = useState([
    // ASIA PACIFIC
    { id: 1, name: 'PH-Manila Core', endpoint: 'ph.swifftnet.site', location: 'Philippines', status: 'checking', ms: 0, icon: '🇵🇭' },
    { id: 2, name: 'SG-Premium Gateway', endpoint: 'sg.swifftnet.site', location: 'Singapore', status: 'checking', ms: 0, icon: '🇸🇬' },
    { id: 3, name: 'JP-Tokyo Edge', endpoint: 'jp.swifftnet.site', location: 'Japan', status: 'checking', ms: 0, icon: '🇯🇵' },
    { id: 4, name: 'HK-Kowloon Node', endpoint: 'hk.swifftnet.site', location: 'Hong Kong', status: 'checking', ms: 0, icon: '🇭🇰' },
    
    // NORTH AMERICA
    { id: 5, name: 'US-West Silicon Valley', endpoint: 'us.swifftnet.site', location: 'USA', status: 'checking', ms: 0, icon: '🇺🇸' },
    { id: 6, name: 'US-East New York', endpoint: 'us1.swifftnet.site', location: 'USA', status: 'checking', ms: 0, icon: '🇺🇸' },
    
    // EUROPE & OTHERS
    { id: 7, name: 'EU-Frankfurt Core', endpoint: 'eu.swifftnet.site', location: 'Germany', status: 'checking', ms: 0, icon: '🇩🇪' },
    { id: 8, name: 'UK-London Bridge', endpoint: 'uk.swifftnet.site', location: 'United Kingdom', status: 'checking', ms: 0, icon: '🇬🇧' },
    { id: 9, name: 'AU-Sydney Harbor', endpoint: 'au.swifftnet.site', location: 'Australia', status: 'checking', ms: 0, icon: '🇦🇺' },
    ]);

  const pingNode = useCallback(async (node) => {
    const start = performance.now();
    try {
      // Nagdadagdag tayo ng random query string para hindi i-cache ng browser ang result
      await fetch(`${node.endpoint}?t=${Date.now()}`, { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const end = performance.now();
      return { status: 'online', ms: Math.round(end - start) };
    } catch (err) {
      return { status: 'offline', ms: 0 };
    }
  }, []);

  useEffect(() => {
    const updateAllNodes = async () => {
      // Gumagamit tayo ng Promise.all para sabay-sabay silang mag-ping bawat segundo
      const updatedNodes = await Promise.all(nodes.map(async (node) => {
        const result = await pingNode(node);
        return { ...node, ...result };
      }));
      setNodes(updatedNodes);
    };

    updateAllNodes();
    
    // Binago natin mula 5000 (5s) patungong 1000 (1s)
    const interval = setInterval(updateAllNodes, 1000); 
    
    return () => clearInterval(interval);
  }, [pingNode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 selection:bg-blue-500 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* TOP NAV */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-blue-600/20">SN</div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">SwifftNet <span className="text-blue-500 text-sm">Status</span></h1>
          </div>
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Return to Terminal</Link>
        </div>

        {/* HERO STATUS */}
        <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[50px] text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 text-white">Live Network Intelligence</span>
          </div>

          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Operational</span>
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">Real-time health monitoring of our global routing infrastructure.</p>
        </div>

        {/* NODES LIST */}
        {/* NODES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(node => (
            <div key={node.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between hover:border-blue-500/30 transition-all group relative overflow-hidden">
            
            {/* Background Glow Effect */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 blur-3xl opacity-10 ${node.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                <span className="text-2xl">{node.icon}</span>
                <div>
                    <h3 className="font-black uppercase italic text-[11px] text-white group-hover:text-blue-400 transition-colors leading-none">{node.name}</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{node.location}</p>
                </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-800/50">
                <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Network Latency</span>
                <span className={`font-mono text-sm font-black ${node.ms < 100 ? 'text-emerald-500' : node.ms < 200 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {node.status === 'online' ? `${node.ms}ms` : 'TIMEOUT'}
                </span>
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter opacity-50">Verified Live</span>
            </div>
            </div>
        ))}
        </div>

        {/* FOOTER */}
        <div className="pt-12 pb-24 text-center space-y-2">
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">Global Monitoring Active • {new Date().toLocaleTimeString()}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">SwifftNET Infrastructure is non-custodial and secure.</p>
        </div>

      </div>
    </div>
  );
}