import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import emailjs from '@emailjs/browser';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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
 * --- BUSINESS CONFIGURATION ---
 */
const VPN_PRICE = 180;
const ADMIN_EMAIL = "ramoshowardkingsley58@gmail.com"; 
const appId = "swifftnet-remote-v3"; 

const EJS_SERVICE_ID = "service_7s9tg36"; 
const EJS_TEMPLATE_ID = "template_9pjx12n"; 
const EJS_PUBLIC_KEY = "gULI8936r5B6AVPx1"; 

const firebaseConfig = {
  apiKey: "AIzaSyD7KSnje8RL_y6p2YVJB1C449Sudvhv6Ek",
  authDomain: "swifftnet-remote.firebaseapp.com",
  projectId: "swifftnet-remote",
  storageBucket: "swifftnet-remote.firebasestorage.app",
  messagingSenderId: "75832411435",
  appId: "1:75832411435:web:6b718c4d9b89db533d316e",
  measurementId: "G-EQ7VZ079W9"
};

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
 * --- UI ICONS ---
 */
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCard = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconGoogle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const IconAlert = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconCode = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconMail = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('landing'); 
  const [adminTab, setAdminTab] = useState('payments');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");

  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const sendEmail = (toEmail, subject, body) => {
    const templateParams = { to_email: toEmail, subject: subject, message: body };
    emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, templateParams, EJS_PUBLIC_KEY)
      .then(() => console.log(`Email Sent to ${toEmail}`))
      .catch((err) => console.error("Email Error:", err));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        const role = fUser.email === ADMIN_EMAIL ? 'admin' : 'client';
        setUser({
          uid: fUser.uid,
          name: fUser.displayName || fUser.email.split('@')[0],
          email: fUser.email,
          role: role,
          photo: fUser.photoURL
        });
        setView(role === 'admin' ? 'admin' : 'dashboard');
      } else {
        setUser(null);
        setView('landing');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

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

  const getUserBalance = (email) => {
    const deposits = payments
      .filter(p => p.email === email && p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const spent = requests.filter(r => r.email === email && r.type !== 'trial').length * VPN_PRICE;
    return deposits - spent;
  };

  const getAllClients = () => {
    const emails = new Set([...payments.map(p => p.email), ...requests.map(r => r.email)]);
    return Array.from(emails);
  };

  /**
   * --- AUTH METHODS ---
   */
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailInput, passInput);
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passInput);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  /**
   * --- DATA METHODS ---
   */
  const submitDeposit = async (amount, refNo) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payments'), {
      email: user.email, amount, refNo, status: 'pending', date: new Date().toLocaleDateString()
    });
  };

  const updatePaymentStatus = async (id, status, clientEmail) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), { status });
    const subject = status === 'confirmed' ? "SwifftNet: Payment Success!" : "SwifftNet: Payment Denied";
    const body = status === 'confirmed' 
      ? `Good news! Your payment has been confirmed.`
      : `Unfortunately, your payment reference was not verified.`;
    sendEmail(clientEmail, subject, body);
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
    const balance = getUserBalance(user.email);
    if (balance >= VPN_PRICE || type === 'renewal') {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email, status: 'pending', type, vpnId, date: new Date().toLocaleDateString()
      });
      sendEmail(ADMIN_EMAIL, "New Request Queue", `Client ${user.email} requested a node.`);
    }
  };

  const createTrialRequest = async () => {
    const alreadyTrialed = requests.some(r => r.email === user.email && r.type === 'trial');
    if (alreadyTrialed) return alert("System record: Trial already requested for this account.");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      email: user.email, status: 'pending', type: 'trial', date: new Date().toLocaleDateString()
    });
  };

  const adminAssignTunnel = async (reqId, email, data, type) => {
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
      const days = type === 'trial' ? 7 : Number(data.days);
      exp.setDate(exp.getDate() + days);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), {
        requestId: reqId, clientEmail: email, user: data.u, pass: data.p,
        winbox: data.wp, api: data.ap, ssh: data.ssh, expiry: exp.toLocaleDateString(),
        isTrial: type === 'trial'
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
    }
  };

  const finalizeVpnStatus = async (reqId) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'active' });
  };

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono italic">Initializing SwifftNet Core...</div>;

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
        <div className="text-blue-500 mb-8 scale-150 animate-bounce"><IconShield /></div>
        <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase italic">SwifftNet <span className="text-blue-600">Remote</span></h1>
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
          <h2 className="text-center text-xl font-black uppercase tracking-widest">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" placeholder="Email" required value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <input type="password" placeholder="Password" required value={passInput} onChange={(e)=>setPassInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest">
              {isSignUp ? 'Register' : 'Login'}
            </button>
          </form>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black flex items-center justify-center gap-4 uppercase tracking-widest">
            <IconGoogle /> Continue with Google
          </button>
          <p className="text-center text-xs font-bold text-slate-500 mt-6">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-500 underline uppercase tracking-tighter ml-1">
              {isSignUp ? 'Back to Login' : 'Sign Up Now'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    const bal = getUserBalance(user.email);
    const myReqs = requests.filter(r => r.email === user.email);
    const myPays = payments.filter(p => p.email === user.email);
    const hasTrial = myReqs.some(r => r.type === 'trial');

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
          <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 shadow-xl gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600 shadow-lg">{user.name[0]}</div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-4">
               {user.role === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Admin Panel</button>}
               <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest px-10 py-3 rounded-2xl transition-all">Sign Out</button>
            </div>
          </header>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-blue-400 text-[10px] font-black uppercase mb-2">Iyong Balance</p>
              <p className="text-5xl font-black tracking-tighter">₱{bal}</p>
            </div>

            {!hasTrial && (
              <div className="bg-indigo-600/20 border border-indigo-500/30 p-8 rounded-[40px] shadow-xl md:col-span-1 flex flex-col items-center justify-center text-center gap-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PROMO</p>
                <button onClick={createTrialRequest} className="bg-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Request 7-Day Trial</button>
              </div>
            )}

            <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-xl flex flex-col md:flex-row items-center justify-between px-12 gap-6 ${hasTrial ? 'md:col-span-3' : 'md:col-span-2'}`}>
               <div><p className="text-slate-500 text-[10px] font-black uppercase mb-1">Active Tunnels</p><p className="text-4xl font-black">{myReqs.filter(r => r.status === 'active').length}</p></div>
               {bal >= VPN_PRICE ? (
                 <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-3xl font-black text-xs flex items-center gap-4 shadow-2xl uppercase tracking-widest transition-all"><IconPlus /> Add Instance (₱{VPN_PRICE})</button>
               ) : <div className="text-right text-slate-700 font-black uppercase italic text-[10px]">Insufficient Funds</div>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase font-mono italic"><IconShield /> Remote Instances</h2>
              {myReqs.filter(r => r.type === 'new' || r.type === 'trial').map((req) => {
                const asgn = assignments.find(a => a.requestId === req.id);
                return (
                  <div key={req.id} className="bg-slate-900 rounded-[50px] border border-slate-800 overflow-hidden shadow-2xl mb-12">
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">UID: {req.id.slice(-8)} {req.type === 'trial' && <span className="text-indigo-500 ml-2 font-black italic">[ 7-DAY TRIAL ]</span>}</span>
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${req.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{req.status}</span>
                    </div>
                    <div className="p-12">
                      {(req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-10">
                           {req.status === 'assigned' && <button onClick={() => finalizeVpnStatus(req.id)} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg uppercase">DEPLOYMENT FINISHED</button>}
                           <div className="bg-black/60 p-10 rounded-[32px] border border-slate-800 font-mono text-sm leading-relaxed text-slate-400 space-y-3 shadow-inner">
                             <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Server</span> <span className="text-emerald-400 font-black italic">remote.swifftnet.site</span></div>
                             <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">User</span> <span className="text-white font-black">{asgn.user}</span></div>
                             <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAYMENT LOGS & INFO FIXED HERE */}
            <div className="space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono"><IconCard /> Fund Account</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-10 shadow-2xl">
                
                {/* 1. Send Payment To Box */}
                <div className="bg-slate-950 p-8 rounded-[32px] border border-slate-800 text-center mb-6 border-dashed">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest font-mono italic">RECEIVER GCASH</p>
                  <p className="text-3xl font-black text-blue-500 tracking-tighter leading-none font-mono">0968 385 9759</p>
                </div>

                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  submitDeposit(e.target.amount.value, e.target.ref.value); 
                  e.target.reset(); 
                }} className="space-y-8">
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 text-lg font-black" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 text-lg font-black uppercase font-mono" />
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl">Confirm Transaction</button>
                </form>

                {/* 2. Previous Transactions Box */}
                <div className="space-y-6 pt-10 border-t border-slate-800">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">DEPOSIT LOGS</p>
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                    {myPays.map(p => (
                      <div key={p.id} className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center text-[10px]">
                        <div><span className="text-slate-500 font-black block mb-1 font-mono">REF: {p.refNo}</span><span className="text-slate-400 font-black">₱{p.amount} | {p.date}</span></div>
                        <span className={`font-black uppercase px-4 py-1.5 rounded-full border text-[9px] ${p.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : p.status === 'denied' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>{p.status}</span>
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

  // Admin Interface
  if (view === 'admin' && user) {
    const clients = getAllClients();
    const totalRevenue = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
          <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
            <div>
               <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Admin <span className="text-blue-500">Terminal</span></h1>
               <p className="mt-4 bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest inline-block border border-emerald-500/10">Revenue: ₱{totalRevenue}</p>
            </div>
            <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl">
              {['payments', 'requests', 'clients', 'transactions'].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`px-8 py-4 rounded-[24px] text-[10px] font-black transition-all uppercase tracking-widest ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}>{tab}</button>
              ))}
              <button onClick={() => setView('dashboard')} className="px-8 py-4 text-emerald-500 text-[10px] font-black uppercase">Dashboard</button>
            </div>
          </header>

          <div className="animate-in fade-in duration-700">
            {adminTab === 'payments' && (
              <div className="grid md:grid-cols-3 gap-10">
                {payments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
                    <p className="font-black text-blue-400 text-sm truncate font-mono italic">{p.email}</p>
                    <div className="bg-black/40 p-10 rounded-[40px] text-center border border-slate-800">
                      <p className="text-5xl font-black text-white tracking-tighter mb-2">₱{p.amount}</p>
                      <p className="text-[11px] text-slate-600 font-black uppercase font-mono">REF: {p.refNo}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => updatePaymentStatus(p.id, 'confirmed', p.email)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl text-[10px] font-black uppercase">APPROVE</button>
                      <button onClick={() => updatePaymentStatus(p.id, 'denied', p.email)} className="flex-1 bg-red-600/20 text-red-500 py-6 rounded-3xl text-[10px] font-black uppercase">DENY</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ADMIN TRANSACTIONS FIXED HERE */}
            {adminTab === 'transactions' && (
              <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-800/80 text-[11px] uppercase font-black text-slate-700 tracking-widest">
                    <tr><th className="p-10">Date</th><th className="p-10">Client</th><th className="p-10">Ref No</th><th className="p-10 text-right">Amount</th><th className="p-10 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.sort((a,b)=> new Date(b.date) - new Date(a.date)).map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="p-10 text-slate-500 text-[10px]">{p.date}</td>
                        <td className="p-10 font-black text-white italic truncate max-w-[200px]">{p.email}</td>
                        <td className="p-10 text-blue-400 font-black">{p.refNo}</td>
                        <td className="p-10 text-right font-black text-white">₱{p.amount}</td>
                        <td className="p-10 text-center"><span className={`font-black uppercase px-4 py-1.5 rounded-full border text-[9px] ${p.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : p.status === 'denied' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Existing Clients & Requests tabs... */}
          </div>
        </div>
      </div>
    );
  }

  return null;
}