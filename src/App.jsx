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
import Login from './pages/Login'; // Na-rename na natin ito
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // DATA STATES (Shared Props)
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [promos, setPromos] = useState([]);
  const [prices, setPrices] = useState({ vpnPrice: 100, internetVpnPrice: 300, promoPrice: 150 });
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyBody, setReplyBody] = useState("");

  const handleLogout = () => signOut(auth).then(() => window.location.href = "/");
  const sendEmail = (to, sub, msg, id) => emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, { to_email: to, subject: `[${id}] ${sub}`, message: msg }, EJS_PUBLIC_KEY);

  // AUTH & DATA LISTENERS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        const role = fUser.email === ADMIN_EMAIL ? 'admin' : 'client';
        setUser({ uid: fUser.uid, name: fUser.displayName || fUser.email.split('@')[0], email: fUser.email, role });
      } else { setUser(null); }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. CONSOLIDATED MASTER LISTENERS ---
  useEffect(() => {
    if (!user || !db) return;

    // A. PAYMENTS
    const pQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'payments'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'payments'), where('email', '==', user.email), orderBy('date', 'desc'));

    // B. REQUESTS
    const rQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'requests'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'requests'), where('email', '==', user.email), orderBy('date', 'desc'));

    // C. ASSIGNMENTS (Dito nakabase yung Nodes nila)
    // IMPORTANT: Check mo kung 'clientEmail' o 'email' ang field name mo sa Firestore!
    const aQuery = user.role === 'admin' 
      ? collection(db, ...base, 'assignments') 
      : query(collection(db, ...base, 'assignments'), where('clientEmail', '==', user.email));

    // D. TICKETS
    const tQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'tickets'), orderBy('lastUpdate', 'desc')) 
      : query(collection(db, ...base, 'tickets'), where('clientEmail', '==', user.email), orderBy('lastUpdate', 'desc'));

    // E. SETTINGS (Prices)
    const sRef = doc(db, ...base, 'settings', 'prices');

    // EXECUTE LISTENERS (Dapat nandito ang mga ito para mag-update ang UI)
    const unp = onSnapshot(pQuery, (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unr = onSnapshot(rQuery, (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const una = onSnapshot(aQuery, (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unt = onSnapshot(tQuery, (s) => setTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unpromo = onSnapshot(collection(db, ...base, 'promos'), (s) => setPromos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unprice = onSnapshot(sRef, (s) => {
        if (s.exists()) {
          console.log("Current Prices from DB:", s.data()); // I-log natin para makita mo sa Console (F12)
          setPrices(prev => ({ ...prev, ...s.data() })); // Merge natin para safe
        }
      });

    // Cleanup para hindi mabagal ang app
    return () => { unp(); unr(); una(); unt(); unpromo(); unprice(); };
  }, [user]);

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono animate-pulse">SWIFFTNET CORE STARTING...</div>;

  const commonProps = {
    user, db, base, appId: "swifftnet-remote-v3", ADMIN_EMAIL,
    payments, requests, assignments, tickets, promos, prices,
    sendEmail, handleLogout, activeTicket, setActiveTicket, messages, replyBody, setReplyBody
  };

  return (
    <BrowserRouter>
      {/* GLOBAL NAVBAR: Lilitaw sa lahat ng page */}
      <Navbar user={user} handleLogout={handleLogout} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={user ? <Profile {...commonProps} /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />

        {/* LOGIN: Redirects to dashboard if already logged in */}
        <Route path="/login" element={
          !user ? <Login /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)
        } />

        {/* PROTECTED: Redirects to HOME (/) if not logged in */}
        <Route path="/dashboard" element={
          user ? <ClientDashboard {...commonProps} openSupport={() => window.intergram?.open()} /> : <Navigate to="/" />
        } />

        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminPanel {...commonProps} /> : <Navigate to="/" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}