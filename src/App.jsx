import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// --- FIREBASE & CONFIG ---
import { auth, db, base, ADMIN_EMAIL, EJS_SERVICE_ID, EJS_TEMPLATE_ID, EJS_PUBLIC_KEY } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, collection, query, where, orderBy, doc } from 'firebase/firestore';

// --- PAGES IMPORT ---
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login'; 
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
import BillingSystem from './pages/BillingSystem'; 
import Profile from './pages/Profile';
import About from './pages/About';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import PublicCheckBill from './pages/PublicCheckBill';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [maint, setMaint] = useState({ isActive: false, message: "" });

  // DATA STATES
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [promos, setPromos] = useState([]);
  const [prices, setPrices] = useState({ vpnPrice: 100, internetVpnPrice: 300, promoPrice: 150, billing_system_license: 150 });
  const [announcement, setAnnouncement] = useState({ text: "", isActive: false, type: "info" });
  
  // SUPPORT MESSAGING STATES
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyBody, setReplyBody] = useState("");

  const handleLogout = () => signOut(auth).then(() => window.location.href = "/");
  const sendEmail = (to, sub, msg, id) => emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, { to_email: to, subject: `[${id}] ${sub}`, message: msg }, EJS_PUBLIC_KEY);

  // --- FEATURE: REAL-TIME USER SYNC (Dito ang fix) ---
  useEffect(() => {
    let unsubProfile = () => {};

    const unsubAuth = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        // Makikinig tayo sa document ng user sa Firestore para mag-sync agad ang credits at billing status
        unsubProfile = onSnapshot(doc(db, 'users', fUser.email), (snap) => {
          const role = fUser.email === ADMIN_EMAIL ? 'admin' : 'client';
          const firestoreData = snap.exists() ? snap.data() : {};
          
          setUser({ 
            uid: fUser.uid, 
            name: fUser.displayName || fUser.email.split('@')[0], 
            email: fUser.email, 
            role,
            ...firestoreData // Real-time update para sa credits at billingAccessUntil
          });
          setIsAuthReady(true);
        });
      } else {
        setUser(null);
        setIsAuthReady(true);
        unsubProfile();
      }
    });

    return () => { unsubAuth(); unsubProfile(); };
  }, []);

  // MASTER DATA LISTENERS
  useEffect(() => {
    if (!user || !db) return;

    const pQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'payments'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'payments'), where('email', '==', user.email), orderBy('date', 'desc'));

    const rQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'requests'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'requests'), where('email', '==', user.email), orderBy('date', 'desc'));

    const aQuery = user.role === 'admin' 
      ? collection(db, ...base, 'assignments') 
      : query(collection(db, ...base, 'assignments'), where('clientEmail', '==', user.email));

    const tQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'tickets'), orderBy('lastUpdate', 'desc')) 
      : query(collection(db, ...base, 'tickets'), where('clientEmail', '==', user.email), orderBy('lastUpdate', 'desc'));

    const unp = onSnapshot(pQuery, (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unr = onSnapshot(rQuery, (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const una = onSnapshot(aQuery, (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unt = onSnapshot(tQuery, (s) => setTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unpromo = onSnapshot(collection(db, ...base, 'promos'), (s) => setPromos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const unprice = onSnapshot(doc(db, ...base, 'settings', 'prices'), (s) => {
      if (s.exists()) setPrices(prev => ({ ...prev, ...s.data() }));
    });

    const unAnnounce = onSnapshot(doc(db, ...base, 'settings', 'announcement'), (s) => {
      if (s.exists()) setAnnouncement(s.data());
    });

    const unMaint = onSnapshot(doc(db, ...base, 'settings', 'maintenance'), (s) => {
      if (s.exists()) setMaint(s.data());
    });

    return () => { unp(); unr(); una(); unt(); unpromo(); unprice(); unMaint(); unAnnounce(); };
  }, [user?.uid]); // User UID as trigger for safety

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono animate-pulse uppercase">SwifftNet V3 Starting...</div>;

  const totalDeposits = payments
  .filter(p => p.status === 'confirmed')
  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalSpent = requests
    .filter(r => r.type !== 'trial' && r.status !== 'denied')
    .reduce((sum, r) => sum + (Number(r.pricePaid) || Number(prices.vpnPrice)), 0);

  const calculatedBal = totalDeposits - totalSpent;

  const commonProps = {
    user, db, base, appId: "swifftnet-remote-v3", ADMIN_EMAIL,
    payments, requests, assignments, tickets, promos, prices,
    bal: callculatedBal, // <--- Prop para sa Billing System balance sync
    sendEmail, handleLogout, activeTicket, setActiveTicket, messages, replyBody, setReplyBody, announcement, setAnnouncement, maint, setMaint
  };

  // MAINTENANCE GATE
  if (maint.isActive && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-6">⚙️</div>
        <h1 className="text-4xl font-black uppercase italic text-white mb-2 tracking-tighter">System Optimization</h1>
        <p className="text-slate-500 max-w-md font-medium italic text-sm">{maint.message || "We're optimizing SwifftNet. Be back soon!"}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-bill" element={<PublicCheckBill />} />
        
        <Route path="/login" element={!user ? <Login /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)} />
        <Route path="/dashboard" element={user ? <ClientDashboard {...commonProps} /> : <Navigate to="/login" />} />
        <Route path="/billing" element={user ? <BillingSystem {...commonProps} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile {...commonProps} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel {...commonProps} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}