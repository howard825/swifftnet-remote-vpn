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
const IconGoogle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const IconCode = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconMail = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconCopy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('landing'); 
  const [adminTab, setAdminTab] = useState('payments');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [requestService, setRequestService] = useState("winbox");

  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const sendEmail = (toEmail, subject, body) => {
    const templateParams = { to_email: toEmail, subject: subject, message: body };
    emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, templateParams, EJS_PUBLIC_KEY)
      .then(() => console.log(`Email Sent`))
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
          createdAt: fUser.metadata.creationTime,
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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailInput, passInput);
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passInput);
      }
    } catch (err) { setAuthError(err.message); }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try { await signInWithPopup(auth, googleProvider); } catch (err) { setAuthError(err.message); }
  };

  const handleLogout = () => signOut(auth);

  const submitDeposit = async (amount, refNo) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payments'), {
      email: user.email, amount, refNo, status: 'pending', date: new Date().toLocaleDateString()
    });
  };

  const updatePaymentStatus = async (id, status, clientEmail) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), { status });
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
    const balance = getUserBalance(user.email);
    if (balance >= VPN_PRICE || type === 'renewal') {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email, status: 'pending', type, vpnId, 
        service: requestService,
        date: new Date().toLocaleDateString()
      });
      sendEmail(ADMIN_EMAIL, "New Request", `Client ${user.email} node request for ${requestService}.`);
    }
  };

  const createTrialRequest = async () => {
    const alreadyTrialed = requests.some(r => r.email === user.email && r.type === 'trial');
    if (alreadyTrialed) return alert("System record: Trial already used for this account.");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      email: user.email, status: 'pending', type: 'trial', 
      service: 'winbox',
      date: new Date().toLocaleDateString()
    });
    sendEmail(ADMIN_EMAIL, "Trial Alert", `New trial requested by ${user.email}.`);
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
      exp.setDate(exp.getDate() + (type === 'trial' ? 7 : Number(data.days)));
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), {
        requestId: reqId, clientEmail: email, user: data.u, pass: data.p,
        port: data.port, service: data.service, 
        expiry: exp.toLocaleDateString(), isTrial: type === 'trial'
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
      
      const subj = type === 'trial' ? "7-Day Trial Ready! 🚀" : "Instance Authorized! 🚀";
      const body = `Your ${data.service} port has been authorized. Login to vpn.swifftnet.site to view credentials.`;
      sendEmail(email, subj, body);
    }
  };

  const finalizeVpnStatus = async (reqId) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'active' });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono italic">Initializing SwifftNet Core...</div>;

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
        <div className="text-blue-500 mb-8 scale-150 animate-bounce"><IconShield /></div>
        <h1 className="text-5xl font-black mb-12 tracking-tighter uppercase italic text-center">SwifftNet <span className="text-blue-600">Remote</span></h1>
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
          <h2 className="text-center text-xl font-black uppercase tracking-widest">{isSignUp ? 'Create Account' : 'Welcome'}</h2>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" placeholder="Email" required value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <input type="password" placeholder="Password" required value={passInput} onChange={(e)=>setPassInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl">
              {isSignUp ? 'Register' : 'Login'}
            </button>
          </form>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black flex items-center justify-center gap-4 uppercase tracking-widest transition-all"><IconGoogle /> Google Login</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-blue-500 text-xs font-black uppercase underline tracking-widest">
            {isSignUp ? 'Return to Login' : 'Register Account'}
          </button>
          {authError && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{authError}</p>}
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    const bal = getUserBalance(user.email);
    const myReqs = requests.filter(r => r.email === user.email);
    const myPays = payments.filter(p => p.email === user.email);
    const hasTrialUsed = myReqs.some(r => r.type === 'trial');
    
    const creationDate = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const isAccountNew = (now - creationDate) < (24 * 60 * 60 * 1000); 

    const scriptBase = `/ip firewall filter add action=accept chain=input src-address=192.168.89.0/24 
/ip firewall filter add action=accept chain=input comment="" place-before=*0 src-address=192.168.89.0/24
/ip service set api,api-ssl,ssh address=192.168.89.0/24`;

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 shadow-xl gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600 shadow-lg">{user.name[0]}</div>
              <div><h1 className="text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1><p className="text-xs text-slate-500 font-bold uppercase mt-2">{user.email}</p></div>
            </div>
            <div className="flex gap-4">
               {user.role === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Admin Panel</button>}
               <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-600 text-white font-black text-xs uppercase px-10 py-3 rounded-2xl transition-all">Sign Out</button>
            </div>
          </header>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-blue-400 text-[10px] font-black uppercase mb-2">My Balance</p>
              <p className="text-5xl font-black tracking-tighter">₱{bal}</p>
            </div>
            {!hasTrialUsed && isAccountNew && (
              <div className="bg-indigo-600/20 border border-indigo-500/30 p-8 rounded-[40px] text-center flex flex-col items-center justify-center gap-4 animate-pulse shadow-xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">TRIAL PROMO</p>
                <button onClick={createTrialRequest} className="bg-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-500">Free Winbox Node</button>
              </div>
            )}
            <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between px-12 gap-6 ${(!hasTrialUsed && isAccountNew) ? 'md:col-span-2' : 'md:col-span-3'}`}>
               <div className="space-y-4">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Add New Node</p>
                  <select value={requestService} onChange={(e)=>setRequestService(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-black uppercase text-blue-400 outline-none">
                     <option value="winbox">Winbox Port</option>
                     <option value="api">API Port</option>
                     <option value="ssh">SSH Port</option>
                  </select>
               </div>
               {bal >= VPN_PRICE ? (
                 <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-3xl font-black text-xs flex items-center gap-4 uppercase transition-all shadow-2xl"><IconPlus /> Request Port (₱{VPN_PRICE})</button>
               ) : <div className="text-right text-slate-700 font-black uppercase italic text-[10px]">Deposit required</div>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase font-mono italic"><IconShield /> My Active Tunnels</h2>
              {myReqs.filter(r => r.type === 'new' || r.type === 'trial').map((req) => {
                const asgn = assignments.find(a => a.requestId === req.id);
                return (
                  <div key={req.id} className="bg-slate-900 rounded-[50px] border border-slate-800 overflow-hidden shadow-2xl mb-12">
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase font-mono">ID: {req.id.slice(-6)} <span className="text-blue-500 ml-2">[{req.service || 'winbox'}]</span></span>
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${req.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{req.status}</span>
                    </div>
                    <div className="p-12">
                      {(req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                           {req.status === 'assigned' && <button onClick={() => finalizeVpnStatus(req.id)} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl uppercase shadow-lg hover:bg-emerald-500 transition-all">DEPLOYMENT FINISHED</button>}
                           
                           {/* INSTRUCTIONS DISPLAYED FOR EVERYONE */}
                           <div className="space-y-8">
                             <div className="bg-black/60 p-10 rounded-[32px] border border-slate-800 font-mono text-sm leading-relaxed text-slate-400 space-y-3 shadow-inner">
                               <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Server</span> <span className="text-emerald-400 font-black italic">remote.swifftnet.site</span></div>
                               <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">User</span> <span className="text-white font-black">{asgn.user}</span></div>
                               <div className="flex justify-between py-1 border-b border-slate-800/50"><span className="text-slate-600 uppercase text-[9px] font-black">Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                             </div>

                             <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic font-mono">Terminal Script</h4>
                                  <button onClick={() => handleCopy(scriptBase, `script-${req.id}`)} className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-all text-slate-400">
                                    {copiedId === `script-${req.id}` ? <IconCheck /> : <IconCopy />}
                                  </button>
                                </div>
                                <div className="bg-black/80 p-6 rounded-[24px] border border-slate-800 font-mono text-[10px] text-slate-500 overflow-x-auto italic">
                                  <pre className="whitespace-pre-wrap">{scriptBase}</pre>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-800">
                               <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800">
                                 <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Assigned Port ({asgn.service})</p>
                                 <p className="text-2xl font-black text-blue-400 font-mono italic">{asgn.port}</p>
                               </div>
                               <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800">
                                 <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Expiry</p>
                                 <p className="text-xs font-black text-emerald-400 font-mono">{asgn.expiry}</p>
                               </div>
                           </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono"><IconCard /> Fund Account</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-10 shadow-2xl">
                <div className="bg-slate-950 p-8 rounded-[32px] border border-slate-800 text-center border-dashed">
                  <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">GCASH RECEIVER</p>
                  <p className="text-3xl font-black text-blue-500 tracking-tighter leading-none font-mono">0968 385 9759</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submitDeposit(e.target.amount.value, e.target.ref.value); e.target.reset(); }} className="space-y-8">
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 text-lg font-black" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-7 rounded-[2.5rem] outline-none focus:border-blue-500 text-lg font-black uppercase font-mono" />
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-7 rounded-[2.5rem] font-black text-sm uppercase shadow-2xl transition-all">Confirm Deposit</button>
                </form>
                <div className="space-y-6 pt-10 border-t border-slate-800">
                  <p className="text-[10px] font-black text-slate-600 uppercase font-mono">MY LOGS</p>
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                    {myPays.map(p => (
                      <div key={p.id} className="bg-slate-950 p-6 rounded-[24px] border border-slate-800 flex justify-between items-center text-[10px]">
                        <div><span className="text-slate-500 font-black block mb-1 font-mono">REF: {p.refNo}</span><span>₱{p.amount} | {p.date}</span></div>
                        <span className={`font-black uppercase px-4 py-1.5 rounded-full border text-[9px] ${p.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20' : 'text-orange-500 border-orange-500/20'}`}>{p.status}</span>
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
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
          <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
            <div><h1 className="text-4xl font-black uppercase italic leading-none">Admin <span className="text-blue-500">Terminal</span></h1></div>
            <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl">
              {['payments', 'requests', 'clients', 'transactions'].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`px-8 py-4 rounded-[24px] text-[10px] font-black transition-all uppercase ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600'}`}>{tab}</button>
              ))}
              <button onClick={() => setView('dashboard')} className="px-8 py-4 text-emerald-500 text-[10px] font-black uppercase">Dashboard</button>
            </div>
          </header>

          <div className="animate-in fade-in duration-700">
            {adminTab === 'payments' && (
              <div className="grid md:grid-cols-3 gap-10">
                {payments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
                    <p className="font-black text-blue-400 text-sm font-mono italic truncate">{p.email}</p>
                    <div className="bg-black/40 p-10 rounded-[40px] text-center border border-slate-800"><p className="text-5xl font-black mb-2">₱{p.amount}</p><p className="text-[11px] text-slate-600 font-black font-mono">REF: {p.refNo}</p></div>
                    <div className="flex gap-4">
                      <button onClick={() => updatePaymentStatus(p.id, 'confirmed', p.email)} className="flex-1 bg-emerald-600 py-6 rounded-3xl text-[10px] font-black uppercase hover:bg-emerald-500">APPROVE</button>
                      <button onClick={() => updatePaymentStatus(p.id, 'denied', p.email)} className="flex-1 bg-red-600/20 text-red-500 py-6 rounded-3xl text-[10px] font-black uppercase">DENY</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {adminTab === 'transactions' && (
              <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-800 text-[11px] uppercase font-black text-slate-700 tracking-widest">
                    <tr><th className="p-10">Date</th><th className="p-10">Client</th><th className="p-10 text-right">Amount</th><th className="p-10 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.sort((a,b)=> new Date(b.date) - new Date(a.date)).map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="p-10 text-slate-500 text-[10px]">{p.date}</td>
                        <td className="p-10 font-black text-white italic truncate">{p.email}</td>
                        <td className="p-10 text-right font-black">₱{p.amount}</td>
                        <td className="p-10 text-center"><span className="font-black uppercase px-4 py-1.5 rounded-full border text-[9px]">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {adminTab === 'requests' && (
              <div className="grid md:grid-cols-2 gap-12">
                {requests.filter(r => r.status === 'pending').map(r => (
                  <div key={r.id} className={`bg-slate-900 p-12 rounded-[60px] border shadow-2xl space-y-10 animate-in slide-in-from-right-10 ${r.type === 'trial' ? 'border-indigo-500' : 'border-slate-800'}`}>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-6"><p className="font-black text-white text-lg uppercase truncate font-mono">{r.email}</p>{r.type === 'trial' && <span className="text-[10px] bg-indigo-600 text-white px-4 py-2 rounded-full font-black animate-pulse uppercase">Trial</span>}</div>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); adminAssignTunnel(r.id, r.email, { days: fd.get('d'), u: fd.get('u'), p: fd.get('p'), port: fd.get('port'), service: r.service || 'winbox' }, r.type); }} className="space-y-8">
                      <div className="bg-slate-950 p-6 rounded-3xl text-center border border-slate-800"><p className="text-[10px] text-slate-600 uppercase font-black">Requested Port Type</p><p className="text-xl font-black text-blue-500 uppercase">{r.service || 'winbox'}</p></div>
                      <input name="d" type="number" defaultValue={r.type === 'trial' ? "7" : "365"} disabled={r.type === 'trial'} className="w-full bg-slate-950 p-6 rounded-3xl text-center font-black border border-slate-800 outline-none" />
                      <div className="grid grid-cols-2 gap-4"><input name="u" placeholder="VPN User" required className="bg-slate-950 p-5 rounded-3xl font-black w-full outline-none" /><input name="p" placeholder="VPN Pass" required className="bg-slate-950 p-5 rounded-3xl font-black w-full outline-none" /></div>
                      <input name="port" placeholder="Assign Port Number" required className="bg-slate-950 p-5 rounded-3xl font-black w-full text-center text-xl text-blue-400 outline-none" />
                      <button className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase shadow-2xl hover:bg-blue-500 transition-all">Authorize Port</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            {adminTab === 'clients' && (
              <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-800 text-[11px] uppercase font-black text-slate-700 tracking-widest"><tr><th className="p-12">Client</th><th className="p-12 text-center">Balance</th><th className="p-12">Active Nodes</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {clients.map(email => (
                      <tr key={email} className="hover:bg-slate-800/20 transition-all"><td className="p-12 font-black text-white italic">{email}</td><td className="p-12 text-center font-black text-emerald-500 text-2xl">₱{getUserBalance(email)}</td><td className="p-12"><div className="space-y-4">{assignments.filter(a => a.clientEmail === email).map((t, i) => (<div key={i} className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 flex justify-between gap-12 border-dashed shadow-inner"><span className="text-blue-500 font-mono text-[11px] font-black uppercase">{t.service || 'winbox'}: {t.port}</span><span className="text-slate-600 font-mono text-[11px] font-black uppercase italic">EXP: {t.expiry}</span></div>))}</div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
}