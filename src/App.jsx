import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// --- FIREBASE & CONFIG ---
import { auth, db, base, ADMIN_EMAIL, EJS_SERVICE_ID, EJS_TEMPLATE_ID, EJS_PUBLIC_KEY } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, collection, query, where, orderBy, doc } from 'firebase/firestore';

// --- PAGES IMPORT ---
import Home from './pages/Home';
import Login from './pages/Login'; // Na-rename na natin ito
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
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

  const handleLogout = () => signOut(auth);
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

  useEffect(() => {
    if (!user || !db) return;
    // ... (Yung onSnapshot listeners mo para sa payments, requests, etc. dito)
  }, [user]);

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono animate-pulse">SWIFFTNET CORE STARTING...</div>;

  const commonProps = {
    user, db, base, appId: "swifftnet-remote-v3", ADMIN_EMAIL,
    payments, requests, assignments, tickets, promos, prices,
    sendEmail, handleLogout, activeTicket, setActiveTicket, messages, replyBody, setReplyBody
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC PAGES (Kahit sino pwedeng pumasok) */}
        <Route path="/" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* AUTH PAGE (Login/Signup) */}
        <Route path="/login" element={
          !user ? <Login /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)
        } />

        {/* PROTECTED PAGES (Kailangan naka-login) */}
        <Route path="/dashboard" element={
          user ? <ClientDashboard {...commonProps} openSupport={() => window.intergram?.open()} /> : <Navigate to="/login" />
        } />

        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminPanel {...commonProps} /> : <Navigate to="/login" />
        } />

        {/* 404 REDIRECT (Security Catch-all) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}