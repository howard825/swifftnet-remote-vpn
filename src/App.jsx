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
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * --- BUSINESS CONFIGURATION ---
 */
const VPN_PRICE = 200;
const ADMIN_EMAIL = "ramoshowardkingsley58@gmail.com"; 
const appId = "swifftnet-remote-v3"; 
const INTERGRAM_ID = "5631296198"; 

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
const IconGoogle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const IconCopy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconTelegram = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const IconTicket = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;

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
  const [vpnProtocol, setVpnProtocol] = useState("l2tp"); 
  const [clientNote, setClientNote] = useState("");

  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // --- SUPPORT TICKET STATES ---
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  // --- INTERGRAM WIDGET ---
  useEffect(() => {
    window.intergramId = INTERGRAM_ID;
    window.intergramCustomizations = {
      title: 'SwifftNet Support',
      introMessage: 'How can we help you?',
      autoResponse: 'Connecting. Please wait for an admin..',
      mainColor: '#2563eb',
      alwaysShow: false
    };

    const script = document.createElement('script');
    script.id = 'intergram-widget';
    script.src = 'https://www.intergram.xyz/js/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById('intergram-widget');
      if (el) document.body.removeChild(el);
    };
  }, []);

  const openSupport = () => {
    if (window.intergram) window.intergram.open();
    else alert("Support widget is still loading.");
  };

  // --- UPDATED EMAIL SENDER ---
const sendEmail = (toEmail, subject, body, ticketId = "General") => {
  const templateParams = { 
    to_email: toEmail, 
    subject: `[Ticket #${ticketId}] ${subject}`, 
    message: body,
    // Change 'your-registered-domain.com' to your actual domain
    reply_to: `reply+${ticketId}@your-registered-domain.com` 
  };
  
  emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, templateParams, EJS_PUBLIC_KEY)
    .then(() => console.log("Email Sent via SwifftNet Core"))
    .catch((err) => console.error("Email Error:", err));
};

  // --- AUTH OBSERVER ---
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

  // --- DATA LISTENERS ---
  useEffect(() => {
    if (!user || !db) return;
    const base = ['artifacts', appId, 'public', 'data'];
    
    onSnapshot(collection(db, ...base, 'payments'), (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, ...base, 'requests'), (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, ...base, 'assignments'), (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // Support Ticket Listener
    const tCol = collection(db, ...base, 'tickets');
    const tQuery = user.role === 'admin' ? tCol : query(tCol, where('clientEmail', '==', user.email));
    onSnapshot(tQuery, (s) => setTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Message Listener for active ticket
  useEffect(() => {
    if (!activeTicket || !db) return;
    const mCol = collection(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id, 'messages');
    const mQuery = query(mCol, orderBy('timestamp', 'asc'));
    return onSnapshot(mQuery, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeTicket]);

  // --- AUTO-EXPIRY WATCHER ---
  useEffect(() => {
    if (user?.role !== 'admin' || !assignments.length) return;

    const checkExpirations = async () => {
      const now = new Date();
      for (const asgn of assignments) {
        const expiryDate = new Date(asgn.expiry);
        if (now > expiryDate && !asgn.expiryNotified) {
          sendEmail(asgn.clientEmail, "SwifftNet: Node Expired ⚠️", 
            `Your VPN node for port ${asgn.port} has expired. Please top up your account to restore service.`);
          
          sendEmail(ADMIN_EMAIL, `Alert: Node Expired (${asgn.clientEmail})`, 
            `User ${asgn.clientEmail} has an expired port (${asgn.port}).`);

          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', asgn.id), {
            expiryNotified: true
          });
        }
      }
    };
    checkExpirations();
  }, [assignments, user]);

  // --- ADD THE AUTO-OFFLINE LOGIC HERE ---
  useEffect(() => {
    // Only the admin needs to run this "cleaner" logic to update the DB
    if (user?.role !== 'admin' || !assignments.length) return;

    const interval = setInterval(() => {
      assignments.forEach(async (asgn) => {
        // If node is marked online but we haven't heard from it in 3 minutes
        if (asgn.isOnline && asgn.lastSeen) {
          const lastSeenDate = new Date(asgn.lastSeen.seconds * 1000);
          const secondsSinceLastPing = (new Date() - lastSeenDate) / 1000;
          
          if (secondsSinceLastPing > 180) { // 180 seconds = 3 minutes
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', asgn.id), {
              isOnline: false
            });
            console.log(`Node ${asgn.port} timed out and marked offline.`);
          }
        }
      });
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval); // Cleanup on logout/close
  }, [assignments, user]);

  // --- HANDLERS ---
  const getUserBalance = (email) => {
    const deposits = payments
      .filter(p => p.email === email && p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const spent = requests.filter(r => r.email === email && r.type !== 'trial' && r.status !== 'denied').length * VPN_PRICE;
    return deposits - spent;
  };

  const getAllClients = () => Array.from(new Set([...payments.map(p => p.email), ...requests.map(r => r.email)]));

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, emailInput, passInput);
      else await signInWithEmailAndPassword(auth, emailInput, passInput);
    } catch (err) { setAuthError(err.message); }
  };

  const handleGoogleLogin = async () => {
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
    sendEmail(clientEmail, status === 'confirmed' ? "Payment Confirmed ✅" : "Payment Denied ❌", 
      status === 'confirmed' ? "Your balance has been updated." : "We could not verify your reference number.");
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
    const balance = getUserBalance(user.email);
    if (balance >= VPN_PRICE) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email, status: 'pending', type, vpnId, service: requestService, protocol: vpnProtocol, 
        note: clientNote || (type === 'renewal' ? "Renewal" : ""), date: new Date().toLocaleDateString()
      });
      setClientNote("");
      sendEmail(ADMIN_EMAIL, `New Node Request`, `User: ${user.email}\nService: ${requestService}`);
    } else { alert("Insufficient balance."); }
  };

  const createTrialRequest = async () => {
    if (requests.some(r => r.email === user.email && r.type === 'trial')) return alert("Trial already used.");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      email: user.email, status: 'pending', type: 'trial', service: requestService, protocol: vpnProtocol, 
      note: clientNote || "Free Trial", date: new Date().toLocaleDateString()
    });
  };

  // --- NEW: DUAL PORT ASSIGNMENT ---
  const adminAssignTunnel = async (reqId, email, data, type) => {
    const exp = new Date();
    const duration = type === 'trial' ? 1 : Number(data.days);
    exp.setDate(exp.getDate() + duration);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), { 
      requestId: reqId, 
      clientEmail: email, 
      user: data.u, 
      pass: data.p, 
      port: data.port, // Port 1: Winbox
      portAux: data.portAux, // Port 2: SSH/API
      service: data.service, 
      expiry: exp.toISOString(),
      expiryNotified: false,
      isOnline: false 
    });
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
    
    sendEmail(
      email, 
      "SwifftNet: Nodes Assigned! 🚀", 
      `Your ports are ready. Winbox: ${data.port}, SSH/API: ${data.portAux}`
    );
  };

  // --- NEW: SUPPORT TICKET HANDLERS ---
  const createTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject) return;
    const tRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets'), {
      clientEmail: user.email,
      subject: ticketSubject,
      status: 'open',
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    });
    sendEmail(ADMIN_EMAIL, "New Support Ticket", `User ${user.email} opened a ticket: ${ticketSubject}`, tRef.id);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets', tRef.id, 'messages'), {
      sender: user.email,
      text: `Support Request: ${ticketSubject}`,
      timestamp: serverTimestamp()
    });
    sendEmail(ADMIN_EMAIL, "New Support Ticket", `User ${user.email} opened a ticket: ${ticketSubject}`);
    setTicketSubject("");
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody || !activeTicket) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id, 'messages'), {
      sender: user.email,
      text: replyBody,
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id), {
      lastUpdate: new Date().toISOString(),
      status: user.role === 'admin' ? 'answered' : 'open'
    });
    
    const notifyTarget = user.role === 'admin' ? activeTicket.clientEmail : ADMIN_EMAIL;
    sendEmail(notifyTarget, "New Ticket Reply", `New message: ${replyBody}`, activeTicket.id);
    setReplyBody("");
  };

  const resendActivationEmail = (asgn) => {
    sendEmail(
      asgn.clientEmail, 
      "SwifftNet: Port Activation Resent 🚀", 
      `Your ports: Winbox ${asgn.port}, Secondary ${asgn.portAux}`
    );
    alert(`Activation resent to ${asgn.clientEmail}`);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono italic animate-pulse tracking-widest">INITIALIZING SWIFFTNET CORE...</div>;

  // --- VIEWS ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
        <div className="text-blue-500 mb-8 scale-150 animate-bounce"><IconShield /></div>
        <h1 className="text-5xl font-black mb-12 tracking-tighter uppercase italic text-center leading-none">SwifftNet <span className="text-blue-600">Remote</span></h1>
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
          <h2 className="text-center text-xl font-black uppercase tracking-widest">{isSignUp ? 'Join SwifftNet' : 'Login'}</h2>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" placeholder="Email" required value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <input type="password" placeholder="Password" required value={passInput} onChange={(e)=>setPassInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl">{isSignUp ? 'Register' : 'Login'}</button>
          </form>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black flex items-center justify-center gap-4 uppercase tracking-widest"><IconGoogle /> Google Login</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-blue-500 text-xs font-black uppercase underline tracking-widest">{isSignUp ? 'Switch to Login' : 'Create Account'}</button>
          {authError && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{authError}</p>}
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    const bal = getUserBalance(user.email);
    const myReqs = requests.filter(r => r.email === user.email);
    const hasTrialUsed = myReqs.some(r => r.type === 'trial');
    const isAccountNew = (new Date().getTime() - new Date(user.createdAt).getTime()) < (24 * 60 * 60 * 1000); 

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 gap-6 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600">{user.name[0]}</div>
              <div><h1 className="text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1><p className="text-xs text-slate-500 font-bold uppercase mt-2">{user.email}</p></div>
            </div>
            <div className="flex gap-4">
               <button onClick={openSupport} className="flex items-center gap-2 bg-slate-800 hover:bg-blue-600 text-white font-black text-[10px] uppercase px-6 py-3 rounded-2xl transition-all border border-slate-700"><IconTelegram /> Support</button>
               {user.role === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Admin Panel</button>}
               <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-600 text-white font-black text-xs uppercase px-10 py-3 rounded-2xl transition-all">Sign Out</button>
            </div>
          </header>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-blue-400 text-[10px] font-black uppercase mb-2">My Balance</p>
              <p className="text-5xl font-black">₱{bal}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[40px] text-center shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Node Price</p>
              <p className="text-4xl font-black text-emerald-500">₱{VPN_PRICE}</p>
              <p className="text-[9px] text-slate-600 font-black uppercase mt-2 italic">Per Node / Year</p>
            </div>
            {!hasTrialUsed && isAccountNew && (
              <div className="bg-indigo-600/20 border border-indigo-500/30 p-8 rounded-[40px] text-center flex flex-col items-center justify-center gap-4 animate-pulse">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">24-Hour Trial</p>
                <button onClick={createTrialRequest} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all">Claim Trial</button>
              </div>
            )}
            <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[40px] flex flex-col items-stretch justify-center gap-6 ${(!hasTrialUsed && isAccountNew) ? 'md:col-span-1' : 'md:col-span-2 shadow-xl'}`}>
               <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <select value={requestService} onChange={(e)=>setRequestService(e.target.value)} className="w-full lg:w-auto bg-slate-950 border border-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-blue-400 outline-none cursor-pointer">
                     <option value="winbox">Winbox</option><option value="api">API</option><option value="ssh">SSH</option>
                  </select>
                  <select value={vpnProtocol} onChange={(e)=>setVpnProtocol(e.target.value)} className="w-full lg:w-auto bg-slate-950 border border-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-emerald-400 outline-none cursor-pointer">
                     <option value="l2tp">L2TP</option><option value="sstp">SSTP</option>
                  </select>
                  <input value={clientNote} onChange={(e)=>setClientNote(e.target.value)} placeholder="Note..." className="flex-1 w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-medium outline-none" />
                  {bal >= VPN_PRICE ? (
                    <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl transition-all whitespace-nowrap">Buy Node</button>
                  ) : <span className="text-red-500 text-[10px] font-black uppercase italic animate-pulse">Top-up Needed</span>}
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase font-mono italic mt-12"><IconShield /> Remote Instances</h2>
              {myReqs.filter(r => r.type === 'new' || r.type === 'trial' || r.type === 'renewal').map((req) => {
                const asgn = assignments.find(a => a.requestId === req.id);
                const protocol = req.protocol || 'l2tp'; 
                const isExpired = asgn ? new Date() > new Date(asgn.expiry) : false;
                const isOnline = asgn?.isOnline === true;

                const script = asgn ? `${protocol === 'l2tp' 
                  ? `/interface l2tp-client add connect-to=remote.swifftnet.site name=SwifftNet-Remote user=${asgn.user} password=${asgn.pass} use-ipsec=yes`
                  : `/interface sstp-client add connect-to=remote.swifftnet.site name=SwifftNet-Remote user=${asgn.user} password=${asgn.pass} profile=default-encryption`
                }
/ip firewall filter add action=accept chain=input comment="SwifftNet Remote" src-address=192.168.89.0/24
/ip firewall filter add action=accept chain=input comment="Allow SwifftNet Top" place-before=0 src-address=192.168.89.0/24
/ip firewall filter add action=accept chain=forward comment="Allow SwifftNet Fwd" place-before=0 src-address=192.168.89.0/24
/ip service
set winbox address=192.168.89.0/24
set api address=192.168.89.0/24
set ssh address=192.168.89.0/24` : "";

                return (
                  <div key={req.id} className={`bg-slate-900 rounded-[50px] border shadow-2xl mb-12 animate-in slide-in-from-bottom-2 ${isExpired ? 'border-red-500/50 opacity-80' : 'border-slate-800'}`}>
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        {!isExpired && (asgn) && (
                          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-600'}`} />
                        )}
                        <span className="text-[10px] font-black text-slate-500 uppercase font-mono">ID: {req.id.slice(-6)} | {protocol.toUpperCase()}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                        {isExpired ? 'EXPIRED' : isOnline ? 'CONNECTED' : req.status}
                      </span>
                    </div>
                    <div className="p-12">
                      {isExpired ? (
                        <div className="text-center space-y-6">
                          <p className="text-slate-400 font-bold italic">Node has expired. Please renew to continue service.</p>
                          {bal >= VPN_PRICE ? (
                            <button onClick={() => createVpnRequest('renewal', req.id)} className="bg-emerald-600 hover:bg-emerald-500 px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all">Renew (₱{VPN_PRICE})</button>
                          ) : <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Insufficient Balance for Renewal</p>}
                        </div>
                      ) : (req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-10">
                          
                          {/* 1. DEPLOYMENT BUTTON: Shows ONLY when status is 'assigned' */}
                          {req.status === 'assigned' && (
                            <button 
                              onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { status: 'active' })} 
                              className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] uppercase hover:bg-emerald-500 transition-all animate-bounce flex items-center justify-center gap-3"
                            >
                              <IconCheck /> FINISHED DEPLOYMENT
                            </button>
                          )}

                          {/* 2. INSTRUCTIONS PANEL: Shows ONLY when status is 'active' */}
                          {req.status === 'active' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[35px] space-y-5 animate-in fade-in zoom-in-95 shadow-2xl">
                              <div className="flex items-center gap-3 text-emerald-400">
                                <IconShield />
                                <h3 className="font-black uppercase italic text-sm tracking-widest">Koneksyon Ready!</h3>
                              </div>
                              <p className="text-[13px] leading-relaxed text-slate-300 font-medium">
                                Pwede mo nang i-remote ang iyong router gamit ang <strong>Winbox</strong> at <strong>API</strong> o <strong>SSH</strong> sa desktop o laptop, o <strong>MikroTik app</strong> sa cellphone. Gamitin lamang ang address at port na ito:
                              </p>
                              <div className="bg-black/60 p-5 rounded-2xl border border-emerald-500/20 text-center shadow-inner">
                                <code className="text-emerald-400 font-black text-lg font-mono tracking-tighter">
                                  remote.swifftnet.site:<span className="text-white underline">{asgn.port}</span>
                                </code>
                              </div>
                              <div className="pt-4 border-t border-emerald-500/10 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Valid Until:</span>
                                <span className="text-[10px] font-black text-white bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                                    {new Date(asgn.expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 3. CREDENTIALS BOX: Always visible for both statuses */}
                          <div className="bg-black/60 p-10 rounded-[32px] border border-slate-800 font-mono text-sm text-slate-400 space-y-3 shadow-inner relative overflow-hidden">
                            <div className="flex justify-between py-1 border-b border-slate-800/50"><span>VPN User</span> <span className="text-white font-black">{asgn.user}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-800/50"><span>VPN Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                          </div>

                          {/* 4. MIKROTIK SCRIPT: Always visible */}
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase italic tracking-[0.2em]">Deployment Script:</p>
                            <div className="bg-black/80 p-6 rounded-[24px] border border-slate-800 font-mono text-[10px] text-slate-500 relative group shadow-2xl">
                              <pre className="whitespace-pre-wrap">{script}</pre>
                              <button onClick={() => handleCopy(script, `script-${req.id}`)} className="absolute right-4 top-4 bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-all border border-slate-700">
                                {copiedId === `script-${req.id}` ? <IconCheck /> : <IconCopy />}
                              </button>
                            </div>
                          </div>

                          {/* 5. PORT SUMMARY FOOTER: Always visible */}
                          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-800">
                            <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800 shadow-xl">
                              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Winbox Port</p>
                              <p className="text-2xl font-black text-emerald-400 font-mono">{asgn.port}</p>
                            </div>
                            <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800 shadow-xl">
                              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">SSH/API Port</p>
                              <p className="text-2xl font-black text-blue-400 font-mono">{asgn.portAux || '---'}</p>
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
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono"><IconTicket /> Support Tickets</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-6 shadow-2xl overflow-hidden min-h-[400px]">
                {!activeTicket ? (
                  <>
                    <form onSubmit={createTicket} className="space-y-4">
                      <input value={ticketSubject} onChange={e=>setTicketSubject(e.target.value)} placeholder="Topic: e.g. Port help..." className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-bold text-sm" />
                      <button className="w-full bg-blue-600 py-4 rounded-3xl font-black uppercase text-xs">Open Ticket</button>
                    </form>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {tickets.map(t => (
                        <div key={t.id} onClick={()=>setActiveTicket(t)} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all">
                          <p className="text-xs font-black uppercase mb-1 truncate">{t.subject}</p>
                          <div className="flex justify-between items-center text-[8px] font-black">
                            <span className={t.status === 'open' ? 'text-orange-500' : 'text-emerald-500'}>{t.status.toUpperCase()}</span>
                            <span className="text-slate-600">{new Date(t.lastUpdate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={()=>setActiveTicket(null)} className="text-[10px] font-black text-blue-500 uppercase">← All Tickets</button>
                      <span className="text-[8px] font-black bg-blue-500/10 px-3 py-1 rounded-full">{activeTicket.subject.slice(0, 15)}...</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                      {messages.map(m => (
                        <div key={m.id} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-medium ${m.sender === user.email ? 'bg-blue-600 ml-auto' : 'bg-slate-800'}`}>
                          {m.text}
                          <p className="text-[7px] mt-1 opacity-50 uppercase">{m.sender === user.email ? 'Me' : 'Admin'}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleReply} className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                      <input value={replyBody} onChange={e=>setReplyBody(e.target.value)} placeholder="Type reply..." className="flex-1 bg-transparent p-2 outline-none text-xs" />
                      <button className="bg-emerald-600 px-4 py-2 rounded-xl font-black uppercase text-[9px]">Reply</button>
                    </form>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono pt-10"><IconCard /> GCASH Load</h2>
              <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-8 shadow-2xl">
                <div className="bg-slate-950 p-6 rounded-3xl border border-dashed border-slate-800 text-center"><p className="text-2xl font-black text-blue-500 font-mono">0968 385 9759</p></div>
                <form onSubmit={(e) => { e.preventDefault(); submitDeposit(e.target.amount.value, e.target.ref.value); e.target.reset(); }} className="space-y-6">
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl outline-none font-black" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl outline-none font-black uppercase" />
                  <button className="w-full bg-emerald-600 py-6 rounded-3xl font-black uppercase">Confirm Deposit</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN TERMINAL ---
  if (view === 'admin' && user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
          <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
            <h1 className="text-4xl font-black uppercase italic">Admin <span className="text-blue-500">Terminal</span></h1>
            <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl overflow-x-auto">
              {['payments', 'requests', 'tickets', 'clients'].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase transition-all whitespace-nowrap ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600'}`}>{tab}</button>
              ))}
              <button onClick={() => setView('dashboard')} className="px-8 py-4 text-emerald-500 text-[10px] font-black uppercase whitespace-nowrap">Dashboard</button>
            </div>
          </header>

          {adminTab === 'payments' && (
            <div className="grid md:grid-cols-3 gap-10">
              {payments.filter(p => p.status === 'pending').map(p => (
                <div key={p.id} className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-8 animate-in zoom-in-95">
                  <p className="font-black text-blue-400 text-sm truncate italic">{p.email}</p>
                  <div className="bg-black/40 p-8 rounded-[30px] text-center border border-slate-800"><p className="text-4xl font-black mb-2">₱{p.amount}</p><p className="text-[10px] text-slate-600 font-black">REF: {p.refNo}</p></div>
                  <div className="flex gap-4">
                    <button onClick={() => updatePaymentStatus(p.id, 'confirmed', p.email)} className="flex-1 bg-emerald-600 py-5 rounded-2xl text-[10px] font-black uppercase">APPROVE</button>
                    <button onClick={() => updatePaymentStatus(p.id, 'denied', p.email)} className="flex-1 bg-red-600/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase">DENY</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'requests' && (
            <div className="grid md:grid-cols-2 gap-12">
              {requests.filter(r => r.status === 'pending').map(r => (
                <div key={r.id} className={`bg-slate-900 p-12 rounded-[60px] border shadow-2xl space-y-8 animate-in slide-in-from-left-4 border-slate-800`}>
                  <p className="font-black text-white text-lg truncate uppercase border-b border-slate-800 pb-6">{r.email}</p>
                  <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); adminAssignTunnel(r.id, r.email, { days: fd.get('d'), u: fd.get('u'), p: fd.get('p'), port: fd.get('port'), portAux: fd.get('portAux'), service: r.service || 'winbox' }, r.type); }} className="space-y-6">
                    <input name="d" type="number" defaultValue={r.type === 'trial' ? "1" : "365"} className="w-full bg-slate-950 p-5 rounded-2xl text-center font-black border border-slate-800 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="u" placeholder="VPN User" required className="bg-slate-950 p-5 rounded-2xl font-black w-full outline-none" />
                      <input name="p" placeholder="VPN Pass" required className="bg-slate-950 p-5 rounded-2xl font-black w-full outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="port" placeholder="Port 1 (Winbox)" required className="bg-slate-950 p-5 rounded-2xl font-black w-full text-center text-emerald-400 outline-none border border-slate-800" />
                      <input name="portAux" placeholder="Port 2 (SSH/API)" required className="bg-slate-950 p-5 rounded-2xl font-black w-full text-center text-blue-400 outline-none border border-slate-800" />
                    </div>
                    <button className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase shadow-2xl hover:bg-blue-500 transition-all">Authorize Node</button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'tickets' && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* TICKET LIST */}
              {tickets.filter(t => t.status !== 'closed').sort((a,b) => new Date(b.lastUpdate) - new Date(a.lastUpdate)).map(t => (
                <div key={t.id} onClick={() => setActiveTicket(t)} className={`bg-slate-900 p-8 rounded-[40px] border border-slate-800 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden group ${t.status === 'open' ? 'border-l-4 border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-l-4 border-l-emerald-500'}`}>
                  <p className="text-[10px] font-black text-blue-500 mb-2 truncate uppercase tracking-widest">{t.clientEmail}</p>
                  <p className="text-sm font-black uppercase mb-4 truncate italic">{t.subject}</p>
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-500">
                    <span>LAST: {new Date(t.lastUpdate).toLocaleTimeString()}</span>
                    <span className={t.status === 'open' ? 'text-red-500 animate-pulse' : 'text-emerald-500'}>{t.status.toUpperCase()}</span>
                  </div>
                  <button className="bg-blue-600 w-full py-3 rounded-2xl text-[10px] font-black uppercase mt-6 group-hover:bg-blue-500 transition-colors">Open Conversation</button>
                </div>
              ))}

              {/* ADMIN CHAT MODAL */}
              {activeTicket && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 md:p-10 z-[100] animate-in fade-in duration-300">
                  <div className="bg-slate-900 w-full max-w-3xl h-[90vh] rounded-[50px] border border-slate-800 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.2)]">
                    
                    {/* MODAL HEADER */}
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Support Case: {activeTicket.id.slice(-6)}</p>
                        <h2 className="font-black uppercase tracking-tight text-lg italic">{activeTicket.subject}</h2>
                        <p className="text-[9px] text-slate-500 font-bold">{activeTicket.clientEmail}</p>
                      </div>
                      <div className="flex gap-4">
                        {/* CLOSE TICKET BUTTON */}
                        <button 
                            onClick={async () => {
                              if(window.confirm("Close this ticket? Client will be notified.")) {
                                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id), { status: 'closed', lastUpdate: new Date().toISOString() });
                                sendEmail(activeTicket.clientEmail, "Ticket Closed ✅", `Your support ticket regarding "${activeTicket.subject}" has been marked as resolved.`);
                                setActiveTicket(null);
                              }
                            }}
                            className="px-6 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all"
                        >
                            Close Ticket
                        </button>
                        <button onClick={() => setActiveTicket(null)} className="text-xs font-black text-slate-500 uppercase px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700">Back</button>
                      </div>
                    </div>

                    {/* CHAT MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
                      {messages.map(m => (
                        <div key={m.id} className={`flex flex-col ${m.sender === user.email ? 'items-end' : 'items-start'}`}>
                          <div className={`p-5 rounded-[2rem] max-w-[85%] text-sm font-medium shadow-xl ${m.sender === user.email ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                            {m.text}
                          </div>
                          <p className="text-[8px] mt-2 opacity-40 uppercase font-black tracking-widest px-2">{m.sender === user.email ? 'Admin (You)' : 'Client Response'}</p>
                        </div>
                      ))}
                    </div>

                    {/* ADMIN REPLY FORM */}
                    <form onSubmit={handleReply} className="p-8 bg-slate-950 border-t border-slate-800 flex gap-4">
                      <input 
                        value={replyBody} 
                        onChange={e => setReplyBody(e.target.value)} 
                        placeholder="Type your official response..." 
                        className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] outline-none font-bold text-sm focus:border-blue-500 transition-all" 
                      />
                      <button className="bg-blue-600 hover:bg-blue-500 px-10 rounded-[2.5rem] font-black uppercase text-xs shadow-lg transition-all flex items-center gap-2">
                        Send Reply
                      </button>
                    </form>

                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'clients' && (
          <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-800/50 text-[11px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                <tr>
                  <th className="p-10">Client Profile</th>
                  <th className="p-10 text-center">Net Balance</th>
                  <th className="p-10">Network Nodes (Ports & Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {getAllClients().map(email => (
                  <tr key={email} className="hover:bg-slate-800/20 transition-all group">
                    {/* CLIENT INFO */}
                    <td className="p-10 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white italic truncate max-w-[250px] text-sm group-hover:text-blue-400 transition-colors">
                          {email}
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                          Verified SwifftNet User
                        </span>
                      </div>
                    </td>

                    {/* BALANCE INFO */}
                    <td className="p-10 text-center align-top">
                      <div className="bg-slate-950/50 inline-block px-6 py-3 rounded-2xl border border-slate-800">
                        <p className="text-2xl font-black text-emerald-500">₱{getUserBalance(email)}</p>
                        <p className="text-[8px] text-slate-600 font-black uppercase">Available Credits</p>
                      </div>
                    </td>

                    {/* ASSIGNMENTS / NODES */}
                    <td className="p-10 align-top">
                      <div className="space-y-4">
                        {assignments.filter(a => a.clientEmail === email).length > 0 ? (
                          assignments.filter(a => a.clientEmail === email).map((t, i) => (
                            <div 
                              key={i} 
                              className={`bg-slate-950 p-5 rounded-3xl border transition-all relative group/node min-w-[280px] shadow-lg ${
                                t.isOnline 
                                ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                                : 'border-slate-800'
                              }`}
                            >
                              {/* HEADER: STATUS & PORTS */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                  <span className="text-blue-400 font-mono text-[11px] font-black uppercase leading-none">
                                    Winbox: <span className="text-white">{t.port}</span>
                                  </span>
                                  <span className="text-blue-600 font-mono text-[11px] font-black uppercase mt-1">
                                    SSH/API: <span className="text-white">{t.portAux || 'N/A'}</span>
                                  </span>
                                </div>
                                
                                {/* LIVE INDICATOR */}
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase ${t.isOnline ? 'text-emerald-500' : 'text-slate-600'}`}>
                                      {t.isOnline ? 'Active' : 'Offline'}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${t.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
                                  </div>
                                  {t.lastSeen && (
                                    <span className="text-[7px] text-slate-700 font-black uppercase">
                                      Ping: {new Date(t.lastSeen.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* EXPIRY INFO */}
                              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                                <span className="text-slate-600 font-mono text-[9px] font-black italic uppercase">
                                  Exp: {new Date(t.expiry).toLocaleDateString()}
                                </span>
                                
                                {/* ADMIN ACTIONS ON HOVER */}
                                <div className="flex items-center gap-2 opacity-0 group-hover/node:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => resendActivationEmail(t)} 
                                    className="bg-blue-600/10 text-blue-500 text-[8px] font-black px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                  >
                                    RESEND
                                  </button>
                                  <button 
                                    onClick={async() => { 
                                      if(window.confirm(`Terminate node ${t.port} for ${email}?`)) 
                                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', t.id)); 
                                    }} 
                                    className="bg-red-500/10 text-red-500 text-[8px] font-black px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                                  >
                                    DELETE
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 font-black uppercase italic">No Active Nodes Found</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    );
  }
  return null;
}