import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

// --- Configuration (MANDATORY RULES 1 & 3) ---
const VPN_PRICE = 250;
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'swifftnet-remote-official';

// --- Icons (SVG) ---
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCard = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconUsers = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

export default function App() {
  const [user, setUser] = useState(null); // Local app session (Admin/Client)
  const [view, setView] = useState('landing'); 
  const [adminTab, setAdminTab] = useState('payments');
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase auth state
  
  // Real-time Database States
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // --- Auth & Initial Sign-in (RULE 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- Real-time Listeners (RULE 1 & 2) ---
  useEffect(() => {
    // Guard every Firestore operation with if (!firebaseUser) to prevent permission errors
    if (!firebaseUser) return;

    // Strict Paths as per Rule 1
    const pCol = collection(db, 'artifacts', appId, 'public', 'data', 'payments');
    const rCol = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const aCol = collection(db, 'artifacts', appId, 'public', 'data', 'assignments');

    const unsubP = onSnapshot(pCol, 
      (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))), 
      (e) => console.error("Payment Listener Error:", e)
    );
    const unsubR = onSnapshot(rCol, 
      (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))), 
      (e) => console.error("Request Listener Error:", e)
    );
    const unsubA = onSnapshot(aCol, 
      (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))), 
      (e) => console.error("Assignment Listener Error:", e)
    );

    return () => { unsubP(); unsubR(); unsubA(); };
  }, [firebaseUser]);

  // --- Calculations ---
  const getUserBalance = (email) => {
    const deposits = payments
      .filter(p => p.email === email && p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const spent = requests
      .filter(r => r.email === email)
      .length * VPN_PRICE;

    return deposits - spent;
  };

  const getAllClients = () => {
    const emails = new Set([
      ...payments.map(p => p.email),
      ...requests.map(r => r.email)
    ]);
    return Array.from(emails);
  };

  // --- Database Interactions ---
  const handleLogin = (email, role) => {
    setUser({ name: email.split('@')[0], role, email });
    setView(role === 'admin' ? 'admin' : 'dashboard');
  };

  const submitDeposit = async (amount, refNo) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payments'), {
        email: user.email, 
        amount, 
        refNo, 
        status: 'pending', 
        date: new Date().toLocaleDateString()
      });
    } catch (e) {
      console.error("Deposit Error:", e);
    }
  };

  const updatePaymentStatus = async (id, status) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), { status });
    } catch (e) {
      console.error("Status Update Error:", e);
    }
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
    if (!firebaseUser) return;
    const balance = getUserBalance(user.email);
    if (balance >= VPN_PRICE) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
          email: user.email, 
          status: 'pending', 
          type, 
          vpnId, 
          date: new Date().toLocaleDateString()
        });
      } catch (e) {
        console.error("VPN Request Error:", e);
      }
    }
  };

  const adminProcessTunnel = async (reqId, email, data, type) => {
    if (!firebaseUser) return;
    try {
      if (type === 'renewal') {
        const target = assignments.find(a => a.requestId === data.vpnId);
        if (target) {
          const curExp = new Date(target.expiry);
          const newExp = new Date(curExp.getTime() + (Number(data.days) * 24 * 60 * 60 * 1000));
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', target.id), {
            expiry: newExp.toLocaleDateString()
          });
        }
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'active' });
      } else {
        const exp = new Date();
        exp.setDate(exp.getDate() + Number(data.days));
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), {
          requestId: reqId, 
          clientEmail: email, 
          user: data.u, 
          pass: data.p,
          winbox: data.wp, 
          api: data.ap, 
          ssh: data.ssh, 
          expiry: exp.toLocaleDateString()
        });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
      }
    } catch (e) {
      console.error("Admin Process Error:", e);
    }
  };

  const finalizeVpnStatus = async (reqId) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'active' });
    } catch (e) {
      console.error("Finalize Error:", e);
    }
  };

  const handleLogout = () => { setUser(null); setView('landing'); };

  // --- Views ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="text-blue-500 mb-8 animate-pulse"><IconShield /></div>
        <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">SwifftNet <span className="text-blue-600">Remote</span></h1>
        <p className="text-slate-500 max-w-sm mb-12 text-lg">Your Enterprise Portal for MikroTik & OLT Remote Access Management.</p>
        <button onClick={() => setView('login')} className="bg-blue-600 hover:bg-blue-500 px-12 py-5 rounded-3xl font-black text-xl shadow-2xl transition-all uppercase tracking-widest">Open Secure Terminal</button>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="bg-slate-900 p-12 rounded-[50px] w-full max-w-md border border-slate-800 shadow-2xl space-y-10">
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-200">Authentication</h2>
          <div className="space-y-4">
            <button onClick={() => handleLogin('admin@swifftnet.site', 'admin')} className="w-full bg-slate-800 hover:bg-slate-700 p-5 rounded-3xl font-black border border-slate-700 transition-all uppercase tracking-widest text-xs">Admin Access</button>
            <button onClick={() => handleLogin('client@swifftnet.site', 'client')} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-3xl font-black shadow-lg transition-all uppercase tracking-widest text-xs">Client Access</button>
          </div>
          <button onClick={() => setView('landing')} className="text-slate-600 text-xs font-black uppercase tracking-widest hover:text-white">Cancel</button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    const bal = getUserBalance(user.email);
    const myReqs = requests.filter(r => r.email === user.email);
    const myPays = payments.filter(p => p.email === user.email);
    const scriptBase = `/ip firewall filter add action=accept chain=input src-address=192.168.89.0/24 
/ip firewall filter add action=accept chain=forward src-address=192.168.89.0/24
/ip service set api,api-ssl,ftp,ssh,telnet address=192.168.89.0/24`;

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard <span className="text-blue-500">// {user.name}</span></h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Live Cloud Infrastructure Status</p>
            </div>
            <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 px-8 py-3 rounded-2xl text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all">Logout</button>
          </header>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Available Balance</p>
              <p className="text-5xl font-black">₱{bal}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] md:col-span-2 flex items-center justify-between px-12">
               <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Tunnels</p>
                  <p className="text-3xl font-black">{myReqs.filter(r => r.status === 'active').length}</p>
               </div>
               {bal >= VPN_PRICE ? (
                 <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-3xl font-black text-xs flex items-center gap-4 shadow-2xl shadow-blue-600/30 transition-all uppercase tracking-widest">
                    <IconPlus /> Request New VPN (₱{VPN_PRICE})
                 </button>
               ) : <span className="text-slate-700 text-[10px] font-black uppercase italic tracking-widest">Insufficient balance for request</span>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase tracking-widest"><IconShield /> Remote VPN Instances</h2>
              {myReqs.filter(r => r.type === 'new').length === 0 && <div className="bg-slate-900/50 border border-dashed border-slate-800 p-24 rounded-[50px] text-center text-slate-700 font-black uppercase tracking-widest text-xs">No active instances found</div>}
              
              {myReqs.filter(r => r.type === 'new').map((req) => {
                const asgn = assignments.find(a => a.requestId === req.id);
                const isPendingRenewal = myReqs.some(r => r.type === 'renewal' && r.vpnId === req.id && r.status === 'pending');

                return (
                  <div key={req.id} className="bg-slate-900 rounded-[50px] border border-slate-800 overflow-hidden shadow-2xl mb-10">
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">UID: {req.id}</span>
                      <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-full border ${req.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="p-12 space-y-12">
                      {req.status === 'pending' && <div className="text-center py-10 italic text-slate-600 font-bold uppercase tracking-widest animate-pulse">Wait: Admin is assigning your ports...</div>}

                      {(req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-5">
                           {req.status === 'assigned' && (
                             <div className="bg-emerald-600 p-10 rounded-[32px] shadow-2xl text-center space-y-6">
                                <p className="font-black text-white text-lg uppercase tracking-widest">Tunnel Assigned</p>
                                <button onClick={() => finalizeVpnStatus(req.id)} className="w-full bg-white text-emerald-600 py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-slate-50 transition-all uppercase tracking-widest">FINALIZE SETUP</button>
                             </div>
                           )}

                           <div className="space-y-10">
                              <div className="space-y-6">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-3">STEP 01: Winbox GUI Setup</h4>
                                <div className="bg-black/60 p-8 rounded-[32px] border border-slate-800 font-mono text-sm leading-relaxed text-slate-400 space-y-3">
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black tracking-widest">Server</span> <span className="text-emerald-400 font-black">remote.swifftnet.site</span></div>
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">User</span> <span className="text-white font-black">{asgn.user}</span></div>
                                   <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                                   <div className="flex justify-between pt-1"><span className="text-slate-600 uppercase text-[9px] font-black">Timeout</span> <span className="text-white font-black">10</span></div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-3">STEP 02: New Terminal Commands</h4>
                                <div className="bg-black/80 p-6 rounded-[24px] border border-slate-800 font-mono text-[10px] text-slate-500 overflow-x-auto italic leading-loose">
                                  <pre className="whitespace-pre-wrap">{scriptBase}</pre>
                                </div>
                              </div>
                           </div>

                           {req.status === 'active' && (
                             <div className="pt-10 border-t border-slate-800 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center">
                                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">Winbox</p>
                                      <p className="text-xs font-black text-blue-400 font-mono break-all">{asgn.winbox}</p>
                                   </div>
                                   <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center">
                                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">API (Taoki)</p>
                                      <p className="text-xs font-black text-indigo-400 font-mono break-all">{asgn.api}</p>
                                   </div>
                                   <div className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 text-center">
                                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">SSH</p>
                                      <p className="text-xs font-black text-emerald-400 font-mono break-all">{asgn.ssh}</p>
                                   </div>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-center bg-slate-950/50 p-10 rounded-[40px] border border-slate-800 gap-8">
                                   <div>
                                     <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-1">Termination Date</span>
                                     <span className="text-2xl font-black text-white">{asgn.expiry}</span>
                                   </div>
                                   
                                   {isPendingRenewal ? (
                                     <span className="text-[10px] text-orange-500 font-black bg-orange-500/10 px-8 py-3 rounded-full border border-orange-500/20 animate-pulse uppercase tracking-widest">Ext. Requested</span>
                                   ) : (
                                     bal >= VPN_PRICE && (
                                       <button 
                                         onClick={() => createVpnRequest('renewal', req.id)} 
                                         className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-[20px] font-black text-xs flex items-center gap-3 shadow-2xl transition-all uppercase tracking-widest"
                                       >
                                         <IconRefresh /> Renew VPN (₱{VPN_PRICE})
                                       </button>
                                     )
                                   )}
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
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase tracking-widest"><IconCard /> Account Funding</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-12 shadow-2xl">
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  submitDeposit(e.target.amount.value, e.target.ref.value); 
                  e.target.reset(); 
                }} className="space-y-8">
                  <div className="space-y-2 text-center pb-6">
                    <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Payment Receiver</p>
                    <p className="text-4xl font-black text-blue-500 tracking-tighter">0912 345 6789</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-2 italic">Name: SwifftNet Admin</p>
                  </div>
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-6 rounded-[24px] outline-none focus:border-blue-500 text-sm font-black" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-6 rounded-[24px] outline-none focus:border-blue-500 text-sm font-black" />
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[24px] font-black text-sm shadow-2xl transition-all uppercase tracking-widest">Confirm Payment</button>
                </form>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">History</p>
                  <div className="max-h-80 overflow-y-auto space-y-4 custom-scrollbar">
                    {myPays.map(p => (
                      <div key={p.id} className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center text-[10px]">
                        <div><span className="text-slate-500 font-black block mb-1">REF: {p.refNo}</span><span className="text-slate-400 font-black">₱{p.amount} <span className="mx-1 opacity-20">|</span> {p.date}</span></div>
                        <span className={`font-black uppercase px-4 py-1.5 rounded-full border text-[9px] ${p.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : p.status === 'denied' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin' && user) {
    const clients = getAllClients();
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control <span className="text-blue-500">Center</span></h1>
            <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl overflow-hidden">
              {['payments', 'requests', 'clients'].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`px-12 py-4 rounded-[24px] text-[10px] font-black transition-all uppercase tracking-widest ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600'}`}>{tab}</button>
              ))}
            </div>
            <button onClick={handleLogout} className="text-slate-700 hover:text-white font-black text-[10px] uppercase tracking-widest border border-slate-900 px-10 py-4 rounded-full transition-all">Logout</button>
          </header>

          <div className="animate-in fade-in duration-700">
            {adminTab === 'payments' && (
              <div className="space-y-12">
                <h2 className="text-3xl font-black text-emerald-500 flex items-center gap-5 uppercase tracking-widest"><IconCard /> Verification Queue</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {payments.filter(p => p.status === 'pending').map(p => (
                    <div key={p.id} className="bg-slate-900 p-12 rounded-[50px] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
                      <p className="font-black text-blue-400 text-sm truncate uppercase tracking-widest italic">{p.email}</p>
                      <div className="bg-black/40 p-8 rounded-[32px] border border-slate-800 text-center">
                        <p className="text-4xl font-black text-white tracking-tighter mb-1">₱{p.amount}</p>
                        <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase font-mono">REF: {p.refNo}</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => updatePaymentStatus(p.id, 'confirmed')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">APPROVE</button>
                        <button onClick={() => updatePaymentStatus(p.id, 'denied')} className="flex-1 bg-red-600/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-600/30 transition-all">DENY</button>
                      </div>
                    </div>
                  ))}
                </div>
                {payments.filter(p => p.status === 'pending').length === 0 && <p className="text-slate-800 italic text-center py-40 font-black uppercase tracking-widest text-xs opacity-50">Inbox Zero Reached</p>}
              </div>
            )}

            {adminTab === 'requests' && (
              <div className="space-y-12">
                <h2 className="text-3xl font-black text-blue-500 flex items-center gap-5 uppercase tracking-widest"><IconShield /> System Deployment</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  {requests.filter(r => r.status === 'pending').map(r => (
                    <div key={r.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-10 animate-in slide-in-from-right-10">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-10">
                        <p className="font-black text-white text-xl">{r.email}</p>
                        <span className={`text-[10px] font-black px-6 py-2.5 rounded-full border ${r.type === 'renewal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} uppercase tracking-widest`}>
                          {r.type}
                        </span>
                      </div>

                      {r.type === 'renewal' ? (
                        <form onSubmit={(e) => { e.preventDefault(); adminProcessTunnel(r.id, r.email, { days: e.target.d.value, vpnId: r.vpnId }, 'renewal'); }} className="space-y-8">
                          <input name="d" type="number" defaultValue="30" required className="w-full bg-slate-950 p-6 rounded-[32px] text-lg font-black outline-none border border-slate-800 focus:border-indigo-500 text-center" />
                          <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all">Authorize Extension</button>
                        </form>
                      ) : (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.target);
                          adminProcessTunnel(r.id, r.email, { days: fd.get('d'), u: fd.get('u'), p: fd.get('p'), wp: fd.get('wp'), ap: fd.get('ap'), ssh: fd.get('ssh') }, 'new');
                        }} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <input name="d" type="number" defaultValue="30" className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full text-center" />
                            <input name="ssh" placeholder="SSH Port" required className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full text-center" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <input name="u" placeholder="L2TP User" required className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full" />
                            <input name="p" placeholder="L2TP Pass" required className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <input name="wp" placeholder="Winbox Port" required className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full" />
                            <input name="ap" placeholder="API Port" required className="bg-slate-950 p-5 rounded-[24px] text-sm font-black outline-none border border-slate-800 focus:border-blue-500 w-full" />
                          </div>
                          <button className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[32px] text-xs font-black uppercase tracking-widest shadow-2xl transition-all mt-6">Authorize Node</button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'clients' && (
              <div className="space-y-12">
                <h2 className="text-3xl font-black text-indigo-400 flex items-center gap-5 uppercase tracking-widest"><IconUsers /> System Registry</h2>
                <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-800/80 text-[10px] uppercase font-black text-slate-700 tracking-widest">
                        <tr>
                          <th className="p-12 font-black">Entity ID</th>
                          <th className="p-12 text-center font-black">Net Worth</th>
                          <th className="p-12 font-black">Active Nodes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {clients.map(email => (
                          <tr key={email} className="hover:bg-slate-800/20 transition-all">
                            <td className="p-12 font-black text-white italic">{email}</td>
                            <td className="p-12 text-center font-black text-emerald-500 tracking-tighter">₱{getUserBalance(email)}</td>
                            <td className="p-12">
                              <div className="space-y-3">
                                {assignments.filter(a => a.clientEmail === email).map((t, i) => (
                                  <div key={i} className="bg-slate-950 p-4 rounded-[20px] border border-slate-800 flex justify-between gap-10">
                                     <span className="text-blue-500 font-mono text-[10px] font-black uppercase tracking-widest font-mono">W: {t.winbox}</span>
                                     <span className="text-slate-600 font-mono text-[10px] font-black uppercase tracking-widest font-mono italic">EXP: {t.expiry}</span>
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}