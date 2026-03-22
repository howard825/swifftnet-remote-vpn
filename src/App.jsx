import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

/**
 * --- SWIFFTNET CONFIGURATION ---
 */
const VPN_PRICE = 180;
const ADMIN_EMAIL = "ramoshowardkingsley58@gmail.com"; 
const appId = "swifftnet-remote-v3"; 

// --- TELEGRAM LIVE CREDENTIALS ---
const TELEGRAM_BOT_TOKEN = "8679365415:AAFSSspMPCOTBF4xeyAs5BuDgW3R9Cm2ENA"; 
const ADMIN_CHAT_ID = "-3824597445"; 

const firebaseConfig = {
  apiKey: "AIzaSyD7KSnje8RL_y6p2YVJB1C449Sudvhv6Ek",
  authDomain: "swifftnet-remote.firebaseapp.com",
  projectId: "swifftnet-remote",
  storageBucket: "swifftnet-remote.firebasestorage.app",
  messagingSenderId: "75832411435",
  appId: "1:75832411435:web:6b718c4d9b89db533d316e",
  measurementId: "G-EQ7VZ079W9"
};

// Initialize Firebase
let app, auth, db;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
auth = getAuth(app);
db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

/**
 * --- ICONS ---
 */
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCard = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconGoogle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const IconAlert = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconTag = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IconCopy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCode = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconSignal = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/></svg>;

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('landing'); 
  const [adminTab, setAdminTab] = useState('payments');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [tunnelStatus, setTunnelStatus] = useState({});

  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        const role = fUser.email === ADMIN_EMAIL ? 'admin' : 'client';
        setUser({ uid: fUser.uid, name: fUser.displayName || fUser.email.split('@')[0], email: fUser.email, role, photo: fUser.photoURL });
        setView(role === 'admin' ? 'admin' : 'dashboard');
      } else {
        setUser(null);
        setView('landing');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user || !db) return;
    const pCol = collection(db, 'artifacts', appId, 'public', 'data', 'payments');
    const rCol = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const aCol = collection(db, 'artifacts', appId, 'public', 'data', 'assignments');
    const unsubP = onSnapshot(pCol, (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubR = onSnapshot(rCol, (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubA = onSnapshot(aCol, (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubR(); unsubA(); };
  }, [user]);

  /**
   * --- TELEGRAM LIVE NOTIFICATIONS ---
   */
  const sendTelegramAlert = async (message) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'HTML' })
      });
    } catch (e) { console.error("Telegram alert failed", e); }
  };

  /**
   * --- REAL-TIME PORT MONITORING ---
   */
  const checkConnection = async (id, port) => {
    setTunnelStatus(prev => ({ ...prev, [id]: 'checking' }));
    const target = `https://remote.swifftnet.site:${port}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    try {
      // Handshake check
      await fetch(target, { mode: 'no-cors', signal: controller.signal });
      setTunnelStatus(prev => ({ ...prev, [id]: 'online' }));
    } catch (err) {
      if (err.name === 'AbortError') {
        setTunnelStatus(prev => ({ ...prev, [id]: 'offline' }));
      } else {
        // TypeError usually means the server reset the connection (it's alive)
        setTunnelStatus(prev => ({ ...prev, [id]: 'online' }));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  /**
   * --- APP LOGIC ---
   */
  const getUserBalance = (email) => {
    const deposits = payments.filter(p => p.email === email && p.status === 'confirmed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const spent = requests.filter(r => r.email === email).length * VPN_PRICE;
    return deposits - spent;
  };

  const submitDeposit = async (amount, refNo) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payments'), {
      email: user.email, amount, refNo, status: 'pending', date: new Date().toLocaleDateString()
    });
    sendTelegramAlert(`💰 <b>PAYMENT ALERT</b>\n\n<b>User:</b> ${user.email}\n<b>Amount:</b> ₱${amount}\n<b>Reference:</b> <code>${refNo}</code>`);
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
    const balance = getUserBalance(user.email);
    if (balance >= VPN_PRICE) {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email, status: 'pending', type, vpnId, date: new Date().toLocaleDateString()
      });
      sendTelegramAlert(`🛠 <b>VPN REQUEST</b>\n\n<b>User:</b> ${user.email}\n<b>Type:</b> ${type.toUpperCase()}\n<b>Request ID:</b> <code>${docRef.id}</code>`);
    }
  };

  const adminAssignTunnel = async (reqId, email, data, type) => {
    if (type === 'renewal') {
      const target = assignments.find(a => a.requestId === data.vpnId);
      if (target) {
        const curExp = new Date(target.expiry);
        const newExp = new Date(curExp.getTime() + (Number(data.days) * 24 * 60 * 60 * 1000));
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', target.id), { expiry: newExp.toLocaleDateString() });
      }
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'active' });
    } else {
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(data.days));
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), {
        requestId: reqId, clientEmail: email, user: data.u, pass: data.p,
        winbox: data.wp, api: data.ap, ssh: data.ssh, expiry: exp.toLocaleDateString()
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-widest font-mono italic">Initializing SwifftNet Core...</div>;

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-500">
        <div className="text-blue-500 mb-8 scale-150 animate-bounce"><IconShield /></div>
        <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic text-white leading-tight">SwifftNet <span className="text-blue-600">Remote</span></h1>
        <p className="text-slate-500 max-w-sm mb-12 text-lg font-medium leading-relaxed font-sans">Cloud Infrastructure Management para sa MikroTik at OLT nodes.</p>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full max-w-md bg-white text-slate-900 px-10 py-5 rounded-full font-black text-lg shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-100 transition-all uppercase tracking-widest font-sans"><IconGoogle /> Sign in with Google</button>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    const bal = getUserBalance(user.email);
    const myReqs = requests.filter(r => r.email === user.email);
    const scriptBase = `/ip firewall filter add action=accept chain=input src-address=192.168.89.0/24\n/ip firewall filter add action=accept chain=forward src-address=192.168.89.0/24\n/ip service set api,api-ssl,ftp,ssh,telnet address=192.168.89.0/24`;

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 shadow-xl gap-6">
            <div className="flex items-center gap-5">
              {user.photo && <img src={user.photo} alt="profile" className="w-16 h-16 rounded-full border-4 border-blue-600" />}
              <div><h1 className="text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1><p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 font-mono">{user.email}</p></div>
            </div>
            <div className="flex gap-4">
               {user.role === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Admin Panel</button>}
               <button onClick={() => signOut(auth)} className="bg-slate-800 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest px-10 py-3 rounded-2xl transition-all">Sign Out</button>
            </div>
          </header>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 font-mono">Balance</p>
              <p className="text-5xl font-black tracking-tighter">₱{bal}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-xl md:col-span-3 flex items-center justify-between px-12">
               <div><p className="text-slate-500 text-[10px] font-black uppercase mb-1 font-mono">Rate</p><p className="text-2xl font-black italic">₱{VPN_PRICE} / Year</p></div>
               {bal >= VPN_PRICE ? (
                 <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-3xl font-black text-xs flex items-center gap-4 uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/20"><IconPlus /> Add Instance</button>
               ) : <span className="text-red-500 text-[10px] font-black uppercase italic tracking-widest">Insufficient Credits</span>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase font-mono italic tracking-widest leading-none"><IconShield /> Remote Instances</h2>
              {myReqs.filter(r => r.type === 'new').map((req) => {
                const asgn = assignments.find(a => a.requestId === req.id);
                const status = tunnelStatus[req.id];
                return (
                  <div key={req.id} className="bg-slate-900 rounded-[50px] border border-slate-800 overflow-hidden shadow-2xl mb-12 animate-in zoom-in-95 duration-500">
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase font-mono italic">UID: {req.id.slice(-8)}</span>
                        {req.status === 'active' && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-slate-800">
                             <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse' : status === 'offline' ? 'bg-red-500' : 'bg-slate-600'}`} />
                             <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-tighter">{status || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${req.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{req.status}</span>
                    </div>

                    <div className="p-12 space-y-12">
                      {(req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-top-2">
                           {req.status === 'assigned' && <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { status: 'active' })} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl">DEPLOYMENT FINISHED</button>}
                           
                           <div className="space-y-10">
                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-3 italic font-mono">01. Winbox GUI Configuration</h4>
                                <p className="text-xs text-slate-400 italic leading-relaxed">Gamitin ang Winbox GUI. Sa Winbox GUI, Click ang <b>Interfaces</b>, Click ang <b>+</b>, Click ang <b>L2TP Client</b>, Click ang <b>Dial out tab</b>. E copy paste ng tama ang mga data na eto sa L2TP Client.</p>
                                <div className="bg-black/60 p-10 rounded-[32px] border border-slate-800 font-mono text-sm leading-relaxed text-slate-400 space-y-3 shadow-inner italic">
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Server</span> <span className="text-emerald-400 font-black">remote.swifftnet.site</span></div>
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">User</span> <span className="text-white font-black">{asgn.user}</span></div>
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                  <h4 className="text-xs font-black text-blue-400 uppercase italic font-mono">02. Terminal Script</h4>
                                  <button onClick={() => handleCopy(scriptBase, `script-${req.id}`)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${copiedId === `script-${req.id}` ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    {copiedId === `script-${req.id}` ? <IconCheck /> : <IconCopy />} {copiedId === `script-${req.id}` ? 'Copied!' : 'Copy Script'}
                                  </button>
                                </div>
                                <div className="bg-black/80 p-6 rounded-[24px] border border-slate-800 font-mono text-[10px] text-slate-500 overflow-x-auto italic"><pre className="whitespace-pre-wrap">{scriptBase}</pre></div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-3 italic font-mono">03. Remote Access Instructions</h4>
                                <p className="text-xs text-slate-400 italic leading-relaxed">Pwede mo ng e remote ang iyong router gamit ang Winbox at api or ssh sa desktop o laptop, o Mikrotik app sa cellphone. Gamitin lamang ang address at port na eto:</p>
                                <div className="bg-blue-600/10 p-8 rounded-[32px] border border-blue-500/20 text-center font-mono text-sm shadow-inner">
                                  <span className="text-blue-400 font-black">remote.swifftnet.site:</span> <span className="text-white italic">[ your assigned port below ]</span>
                                </div>
                              </div>
                           </div>

                           {req.status === 'active' && (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-800">
                               <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center shadow-inner">
                                 <p className="text-[9px] text-slate-500 font-black uppercase mb-1 font-mono">Winbox</p>
                                 <p className="text-xs font-black text-blue-400 font-mono">PORT: {asgn.winbox}</p>
                               </div>
                               <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center shadow-inner">
                                 <p className="text-[9px] text-slate-500 font-black uppercase mb-1 font-mono">API</p>
                                 <p className="text-xs font-black text-indigo-400 font-mono">PORT: {asgn.api}</p>
                               </div>
                               <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center shadow-inner">
                                 <p className="text-[9px] text-slate-500 font-black uppercase mb-1 font-mono">SSH</p>
                                 <p className="text-xs font-black text-emerald-400 font-mono">PORT: {asgn.ssh}</p>
                               </div>
                               
                               <button onClick={() => checkConnection(req.id, asgn.winbox)} disabled={tunnelStatus[req.id] === 'checking'} className="col-span-full bg-slate-900 border border-slate-800 py-4 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition-all text-slate-400">
                                 {tunnelStatus[req.id] === 'checking' ? <div className="animate-spin text-blue-500"><IconRefresh /></div> : <IconSignal />}
                                 {tunnelStatus[req.id] === 'checking' ? 'Probing Device...' : 'Check Tunnel Connection'}
                               </button>

                               <div className="col-span-full flex justify-between items-center bg-slate-950/50 p-10 rounded-[40px] border border-slate-800 mt-6 shadow-xl">
                                 <div><span className="text-[10px] text-slate-600 font-black uppercase block italic font-mono tracking-widest">Renewal Date</span><span className="text-2xl font-black text-white">{asgn.expiry}</span></div>
                                 <button onClick={() => createVpnRequest('renewal', req.id)} className="bg-indigo-600 px-8 py-4 rounded-full font-black text-[10px] flex items-center gap-3 uppercase shadow-lg transition-all"><IconRefresh /> Extend access</button>
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase font-mono italic tracking-widest"><IconCard /> Fund Account</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-10 shadow-2xl">
                <form onSubmit={(e) => { e.preventDefault(); submitDeposit(e.target.amount.value, e.target.ref.value); e.target.reset(); }} className="space-y-8">
                  <div className="bg-slate-950 p-8 rounded-[32px] border border-slate-800 text-center border-dashed border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase italic font-mono tracking-widest">RECEIVER GCASH</p>
                      <p className="text-3xl font-black text-blue-500 tracking-tighter font-mono leading-none shadow-blue-600/10">0968 385 9759</p>
                  </div>
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 font-black italic tracking-tight" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 font-black uppercase font-mono italic tracking-widest" />
                  <button className="w-full bg-emerald-600 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:bg-emerald-500">Confirm Deposit</button>
                </form>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-600 uppercase font-mono tracking-widest">Deposit History</p>
                  <div className="max-h-60 overflow-y-auto space-y-4 pr-3 custom-scrollbar font-mono italic">
                    {payments.filter(p => p.email === user.email).map(p => (
                      <div key={p.id} className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center text-[10px]">
                        <div><span className="text-slate-500 font-black block mb-1 uppercase tracking-tighter">REF: {p.refNo}</span><span className="text-slate-400 font-black">₱{p.amount} | {p.date}</span></div>
                        <span className={`font-black uppercase px-4 py-1.5 rounded-full border text-[9px] ${p.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DEVELOPER INFORMATION */}
              <div className="bg-slate-900/40 p-10 rounded-[50px] border border-slate-800/50 space-y-6 shadow-2xl animate-in fade-in duration-1000">
                <div className="flex items-center gap-4 text-blue-500 mb-2 font-mono"><IconCode /><h2 className="text-[10px] font-black uppercase tracking-[0.2em]">System Architect</h2></div>
                <p className="text-2xl font-black tracking-tighter text-white italic">Howard Kingsley Ramos</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lead Developer & Network Engineer</p>
                <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center font-mono italic">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Platform</span>
                    <span className="text-[9px] font-black text-blue-400 uppercase">SwifftNet Remote v3.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Interface
  if (view === 'admin' && user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans italic">
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
          <header className="flex justify-between items-center border-b border-slate-900 pb-12">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Admin <span className="text-blue-500">Terminal</span></h1>
            <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800">
              {['payments', 'requests', 'clients'].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`px-12 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest ${adminTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{tab}</button>
              ))}
              <button onClick={() => setView('dashboard')} className="px-12 py-4 rounded-[24px] text-[10px] font-black text-emerald-500 uppercase tracking-widest">Exit</button>
            </div>
          </header>

          <div className="animate-in fade-in duration-700">
            {adminTab === 'payments' && (
              <div className="grid md:grid-cols-3 gap-10">
                {payments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
                    <p className="font-black text-blue-400 text-sm truncate uppercase font-mono tracking-widest">{p.email}</p>
                    <div className="bg-black/40 p-10 rounded-[40px] border border-slate-800 text-center font-mono italic">
                      <p className="text-5xl font-black text-white tracking-tighter mb-2 leading-none">₱{p.amount}</p>
                      <p className="text-[11px] text-slate-600 font-black tracking-widest uppercase italic">REF: {p.refNo}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', p.id), { status: 'confirmed' })} className="flex-1 bg-emerald-600 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">APPROVE</button>
                      <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', p.id), { status: 'denied' })} className="flex-1 bg-red-600/20 text-red-500 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">DENY</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {adminTab === 'requests' && (
              <div className="grid md:grid-cols-2 gap-12 italic font-sans">
                {requests.filter(r => r.status === 'pending').map(r => (
                  <div key={r.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-10 animate-in slide-in-from-right-10">
                    <p className="font-black text-white text-xl border-b border-slate-800 pb-6 uppercase font-mono tracking-tighter">{r.email}</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      adminAssignTunnel(r.id, r.email, { days: fd.get('d'), u: fd.get('u'), p: fd.get('p'), wp: fd.get('wp'), ap: fd.get('ap'), ssh: fd.get('ssh'), vpnId: r.vpnId }, r.type);
                    }} className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[11px] text-slate-600 font-black uppercase tracking-widest ml-6">Period (Days)</label>
                         <input name="d" type="number" defaultValue="365" required className="w-full bg-slate-950 p-7 rounded-[2.5rem] text-xl font-black outline-none border border-slate-800 text-center italic" />
                      </div>
                      {r.type === 'new' && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-6">
                            <input name="u" placeholder="VPN User" required className="bg-slate-950 p-6 rounded-[2rem] text-sm font-black outline-none border border-slate-800 italic" />
                            <input name="p" placeholder="VPN Pass" required className="bg-slate-950 p-6 rounded-[2rem] text-sm font-black outline-none border border-slate-800 italic" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <input name="wp" placeholder="Winbox Port" required className="bg-slate-950 p-6 rounded-[2rem] text-sm font-black outline-none border border-slate-800 italic" />
                            <input name="ssh" placeholder="SSH Port" required className="bg-slate-950 p-6 rounded-[2rem] text-sm font-black outline-none border border-slate-800 italic" />
                          </div>
                          <input name="ap" placeholder="API Port" required className="bg-slate-950 p-6 rounded-[2rem] text-sm font-black outline-none border border-slate-800 italic" />
                        </div>
                      )}
                      <button className="w-full bg-blue-600 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500 transition-all">Authorize Node</button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'clients' && (
              <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl font-mono italic">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/80 text-[11px] uppercase font-black text-slate-700 tracking-widest">
                      <tr><th className="p-12">User</th><th className="p-12 text-center">Balance</th><th className="p-12">Active Nodes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Array.from(new Set([...payments.map(p => p.email), ...requests.map(r => r.email)])).map(email => (
                        <tr key={email} className="hover:bg-slate-800/20 transition-all group">
                          <td className="p-12 font-black text-white italic">{email}</td>
                          <td className="p-12 text-center font-black text-emerald-500 text-2xl">₱{getUserBalance(email)}</td>
                          <td className="p-12">
                            <div className="space-y-4">
                              {assignments.filter(a => a.clientEmail === email).map((t, i) => (
                                <div key={i} className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 flex justify-between gap-12 border-dashed shadow-inner">
                                   <span className="text-blue-500 text-[11px] font-black uppercase">PORT: {t.winbox}</span>
                                   <span className="text-slate-600 text-[11px] font-black uppercase">EXP: {t.expiry}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
