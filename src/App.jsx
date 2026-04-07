import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

// --- FIREBASE & CONFIG IMPORTS ---
import { auth, db, base, ADMIN_EMAIL, EJS_SERVICE_ID, EJS_TEMPLATE_ID, EJS_PUBLIC_KEY } from './config/firebase';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  doc 
} from 'firebase/firestore';

// --- PAGES & COMPONENTS IMPORTS ---
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
// Import mo rito ang LandingPage, PrivacyPolicy, at Terms kapag na-split mo na rin sila
// import LandingPage from './pages/LandingPage'; 

export default function App() {
  // --- GLOBAL STATES ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('loading'); // loading, landing, dashboard, admin
  const [isAuthReady, setIsAuthReady] = useState(false);

  // DATA STATES (Ipapasa ito sa Admin at Client bilang PROPS)
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [promos, setPromos] = useState([]);
  const [prices, setPrices] = useState({ vpnPrice: 100, internetVpnPrice: 300, promoPrice: 150 });

  // TICKET MODAL STATES (Shared para sa real-time chat)
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyBody, setReplyBody] = useState("");

  // --- GLOBAL FUNCTIONS ---
  const sendEmail = (toEmail, subject, body, ticketId = "General") => {
    const templateParams = { 
      to_email: toEmail, 
      subject: `[Ticket #${ticketId}] ${subject}`, 
      message: body 
    };
    emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, templateParams, EJS_PUBLIC_KEY)
      .then(() => console.log("SwifftNet Email Sent"))
      .catch((err) => console.error("Email Error:", err));
  };

  const handleLogout = () => signOut(auth);

  // --- 1. AUTH OBSERVER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        // Simple logic: Kung verified na o Google user
        const isGoogleUser = fUser.providerData.some(p => p.providerId === 'google.com');
        if (!isGoogleUser && !fUser.emailVerified) {
          setView('verify-email');
        } else {
          const role = fUser.email === ADMIN_EMAIL ? 'admin' : 'client';
          setUser({
            uid: fUser.uid,
            name: fUser.displayName || fUser.email.split('@')[0],
            email: fUser.email,
            role: role,
            createdAt: fUser.metadata.creationTime,
          });
          setView(role === 'admin' ? 'admin' : 'dashboard');
        }
      } else {
        setUser(null);
        setView('landing');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. CONSOLIDATED MASTER LISTENERS ---
  useEffect(() => {
    if (!user || !db) return;

    // A. PAYMENTS (Ordered by Date)
    const pQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'payments'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'payments'), where('email', '==', user.email), orderBy('date', 'desc'));

    // B. REQUESTS
    const rQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'requests'), orderBy('date', 'desc')) 
      : query(collection(db, ...base, 'requests'), where('email', '==', user.email), orderBy('date', 'desc'));

    // C. ASSIGNMENTS
    const aQuery = user.role === 'admin' 
      ? collection(db, ...base, 'assignments') 
      : query(collection(db, ...base, 'assignments'), where('clientEmail', '==', user.email));

    // D. TICKETS
    const tQuery = user.role === 'admin' 
      ? query(collection(db, ...base, 'tickets'), orderBy('lastUpdate', 'desc')) 
      : query(collection(db, ...base, 'tickets'), where('clientEmail', '==', user.email), orderBy('lastUpdate', 'desc'));

    // E. SETTINGS (Prices)
    const sRef = doc(db, ...base, 'settings', 'prices');

    // EXECUTE LISTENERS
    const unp = onSnapshot(pQuery, (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unr = onSnapshot(rQuery, (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const una = onSnapshot(aQuery, (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unt = onSnapshot(tQuery, (s) => setTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unpromo = onSnapshot(collection(db, ...base, 'promos'), (s) => setPromos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unprice = onSnapshot(sRef, (s) => {
      if (s.exists()) setPrices(s.data());
    });

    return () => { unp(); unr(); una(); unt(); unpromo(); unprice(); };
  }, [user]);

  // --- 3. REAL-TIME CHAT LISTENER (Messages) ---
  useEffect(() => {
    if (!activeTicket) return;
    const mQuery = query(collection(db, ...base, 'tickets', activeTicket.id, 'messages'), orderBy('timestamp', 'asc'));
    const unm = onSnapshot(mQuery, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unm();
  }, [activeTicket]);

  // --- 4. VIEW ROUTER ---
  if (!isAuthReady || view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono italic animate-pulse tracking-widest text-sm">
        INITIALIZING SWIFFTNET CORE...
      </div>
    );
  }

  // Common Props para maipasa sa Admin at Client
  const commonProps = {
    user, db, base, appId: "swifftnet-remote-v3", ADMIN_EMAIL,
    payments, requests, assignments, tickets, promos, prices,
    sendEmail, handleLogout, setView,
    activeTicket, setActiveTicket, messages, replyBody, setReplyBody
  };

  // I-render ang tamang view base sa 'view' state
  switch (view) {
    case 'admin':
      return <AdminPanel {...commonProps} />;
    
    case 'dashboard':
      return <ClientDashboard {...commonProps} openSupport={() => window.intergram?.open()} />;
    
    case 'landing':
      // Dito mo i-pa-paste ang Landing UI o ang component nito
      return <div className="text-white text-center p-20">Landing Page Placeholder (Please Move Landing Code Here)</div>;
    
    case 'verify-email':
      return <div className="text-white text-center p-20 font-black uppercase">Please Verify Your Email.</div>;

    default:
      return <div className="text-white">Something went wrong.</div>;
  }
}