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
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail, // Added for Forgot Password
  verifyBeforeUpdateEmail // Added for Change Email
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
const PROMO_PRICE = 120;
const ADMIN_EMAIL = "ramoshowardkingsley58@gmail.com"; 
const appId = "swifftnet-remote-v3"; 
const base = ['artifacts', appId, 'public', 'data'];
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
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

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

  //PROMO STATES
  const [promos, setPromos] = useState([]);
  const [promoInput, setPromoInput] = useState("");
  const [isPromoValid, setIsPromoValid] = useState(false);

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

  const sendEmail = (toEmail, subject, body, ticketId = "General") => {
    const templateParams = { 
      to_email: toEmail, 
      subject: `[Ticket #${ticketId}] ${subject}`, 
      message: body,
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

  // --- DATA LISTENERS ---
  // --- DATA LISTENERS (Fixed for Client Visibility) ---
  useEffect(() => {
    if (!user || !db) return;
    const base = ['artifacts', appId, 'public', 'data'];
    
    // 1. PAYMENTS listener
    const pCol = collection(db, ...base, 'payments');
    const pQuery = user.role === 'admin' ? pCol : query(pCol, where('email', '==', user.email));
    onSnapshot(pQuery, (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 2. REQUESTS listener (Dito ang bara kanina)
    const rCol = collection(db, ...base, 'requests');
    const rQuery = user.role === 'admin' ? rCol : query(rCol, where('email', '==', user.email));
    onSnapshot(rQuery, (s) => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 3. ASSIGNMENTS listener (Dapat 'clientEmail' ang gamit dito)
    const aCol = collection(db, ...base, 'assignments');
    const aQuery = user.role === 'admin' ? aCol : query(aCol, where('clientEmail', '==', user.email));
    onSnapshot(aQuery, (s) => setAssignments(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 4. TICKETS listener
    const tCol = collection(db, ...base, 'tickets');
    const tQuery = user.role === 'admin' ? tCol : query(tCol, where('clientEmail', '==', user.email));
    onSnapshot(tQuery, (s) => setTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!activeTicket || !db) return;
    const mCol = collection(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id, 'messages');
    const mQuery = query(mCol, orderBy('timestamp', 'asc'));
    return onSnapshot(mQuery, (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeTicket]);

  // 5. PROMOS listener (I-paste ito sa ilalim ng Tickets listener)
  const promoCol = collection(db, ...base, 'promos');
  onSnapshot(promoCol, (s) => setPromos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

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

  // --- AUTO-OFFLINE LOGIC ---
  useEffect(() => {
    if (user?.role !== 'admin' || !assignments.length) return;
    const interval = setInterval(() => {
      assignments.forEach(async (asgn) => {
        if (asgn.isOnline && asgn.lastSeen) {
          const lastSeenDate = new Date(asgn.lastSeen.seconds * 1000);
          const secondsSinceLastPing = (new Date() - lastSeenDate) / 1000;
          if (secondsSinceLastPing > 180) { 
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', asgn.id), { isOnline: false });
          }
        }
      });
    }, 60000); 
    return () => clearInterval(interval); 
  }, [assignments, user]);

  // --- NEW FEATURES HANDLERS ---
  const handleForgotPassword = async () => {
    if (!emailInput) {
      alert("Please enter your email in the field first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailInput);
      alert(`A password reset link has been sent to ${emailInput}.`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleUpdateEmail = async () => {
    const newEmail = prompt("Enter your new email address:");
    if (!newEmail || newEmail === user.email) return;

    try {
      // Sends a verification link to the NEW email.
      // The update only completes once the user verifies.
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      alert(`A verification link has been sent to ${newEmail}. Please verify it and then log back in.`);
      handleLogout();
    } catch (err) {
      alert(`Failed to update email: ${err.message}. You might need to sign in again to perform this sensitive action.`);
    }
  };

  // --- BASE HANDLERS ---
  const getUserBalance = (email) => {
  const deposits = payments
    .filter(p => p.email === email && p.status === 'confirmed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const spent = requests
    .filter(r => r.email === email && r.type !== 'trial' && r.status !== 'denied')
    .reduce((sum, r) => sum + (r.pricePaid || VPN_PRICE), 0); // Binabasa nito kung 150 o 200 ang binayad
    
  return deposits - spent;
};

  const getAllClients = () => Array.from(new Set([...payments.map(p => p.email), ...requests.map(r => r.email)]));

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, emailInput, passInput);
        await sendEmailVerification(userCred.user);
        alert("A verification email has been sent. Please check your inbox before logging in.");
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passInput);
      }
    } catch (err) { setAuthError(err.message); }
  };

  const validatePromo = () => {
  const found = promos.find(p => p.code.toUpperCase() === promoInput.toUpperCase());
  if (found) {
    setIsPromoValid(true);
    alert("Promo Applied! Price is now ₱150.");
  } else {
    setIsPromoValid(false);
    alert("Invalid Promo Code.");
  }
};

const createPromoCode = async (code) => {
  if(!code) return;
  // Gagamit na tayo ng spread operator (...) sa base
  await addDoc(collection(db, ...base, 'promos'), { 
    code: code.toUpperCase() 
  });
};

const deletePromoCode = async (id) => {
  // Siguraduhin na doc(db, ...base, 'promos', id) ang format
  await deleteDoc(doc(db, ...base, 'promos', id));
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

  const processAutoRenewal = async (vpnId) => {
    const balance = getUserBalance(user.email);
    
    if (balance < VPN_PRICE) {
      alert("Insufficient balance for auto-renewal.");
      return;
    }

    const existingAsgn = assignments.find(a => a.requestId === vpnId);
    if (!existingAsgn) {
      alert("Node assignment not found.");
      return;
    }

    try {
      // 1. Calculate New Expiry
      const currentExp = new Date(existingAsgn.expiry);
      const baseDate = currentExp > new Date() ? currentExp : new Date();
      baseDate.setDate(baseDate.getDate() + 365);
      const newExpiry = baseDate.toISOString();

      // 2. Update the Assignment directly
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', existingAsgn.id), {
        expiry: newExpiry,
        expiryNotified: false
      });

      // 3. Create a 'confirmed' request record as an audit trail (receipt)
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email,
        status: 'active', // 'active' agad, hindi na 'pending'
        type: 'renewal',
        vpnId: vpnId,
        service: existingAsgn.service || 'winbox',
        note: "Auto-Renewed (Paid)",
        date: new Date().toLocaleDateString()
      });

      // 4. Notifications
      sendEmail(user.email, "SwifftNet: Renewal Successful! ✅", 
        `Your VPN FOR REMOTE ACCESS has been auto-renewed for 1 year. New expiry: ${baseDate.toLocaleDateString()}`);
      
      sendEmail(ADMIN_EMAIL, `Alert: Auto-Renewal Paid (${user.email})`, 
        `User ${user.email} auto-renewed Node ${existingAsgn.port}. ₱${VPN_PRICE} deducted.`);

      alert("Node successfully renewed for +1 year!");
    } catch (err) {
      alert("Renewal failed: " + err.message);
    }
  };

  const createVpnRequest = async (type = 'new', vpnId = null) => {
  const currentPrice = isPromoValid ? PROMO_PRICE : VPN_PRICE;
  const balance = getUserBalance(user.email);
  
  if (balance >= currentPrice) {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
      email: user.email, 
      status: 'pending', 
      type, 
      vpnId, 
      service: requestService, 
      protocol: vpnProtocol, 
      pricePaid: currentPrice, // Sine-save ang presyong binayaran
      note: (isPromoValid ? "[PROMO] " : "") + (clientNote || (type === 'renewal' ? "Renewal" : "")), 
      date: new Date().toLocaleDateString()
    });
    setClientNote("");
    setIsPromoValid(false); // Reset promo after buy
    setPromoInput("");
    sendEmail(ADMIN_EMAIL, `New Node Request`, `User: ${user.email}\nPrice: ₱${currentPrice}`);
  } else { alert(`Insufficient balance. You need ₱${currentPrice}.`); }
};

  const createTrialRequest = async () => {
    // 1. Check kung may trial na sa listahan
    const alreadyHasTrial = requests.some(r => r.email === user.email && r.type === 'trial');
    
    if (alreadyHasTrial) {
      alert("System: You have already used your free trial.");
      return;
    }

    try {
      // 2. Add the document to Firestore
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
        email: user.email,
        status: 'pending',
        type: 'trial',
        service: requestService, 
        protocol: vpnProtocol,  
        note: "Free Trial Request",
        date: new Date().toLocaleDateString()
      });
      
      // 3. Magbigay ng confirmation alert
      alert("Trial Request Sent! Please wait for the Admin to authorize VPN CREDENTIALS.");
    } catch (err) {
      // 4. Magbigay ng error alert kung may problema (hal. Permissions)
      console.error("Trial Error:", err);
      alert("Error: " + err.message);
    }
  };

  const adminAssignTunnel = async (reqId, email, data, type, vpnId = null) => {
    let finalExpiry = new Date();
    const daysToAdd = type === 'trial' ? 1 : Number(data.days);

    // LOGIC: Check if this is a renewal and if the existing assignment exists
    if (type === 'renewal' && vpnId) {
      const existingAsgn = assignments.find(a => a.requestId === vpnId);
      
      if (existingAsgn) {
        // Find existing expiry: kung hindi pa expired, add sa current expiry. 
        // Kung expired na, add sa date ngayon.
        const currentExp = new Date(existingAsgn.expiry);
        const baseDate = currentExp > new Date() ? currentExp : new Date();
        baseDate.setDate(baseDate.getDate() + daysToAdd);
        finalExpiry = baseDate;

        // UPDATE existing document instead of adding new
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', existingAsgn.id), {
          expiry: finalExpiry.toISOString(),
          expiryNotified: false,
          // Update details din para sigurado kung binago ni Admin ang ports/pass
          user: data.u,
          pass: data.p,
          port: data.port,
          portAux: data.portAux
        });
      }
    } else {
      // NEW or TRIAL logic (Existing logic)
      finalExpiry.setDate(finalExpiry.getDate() + daysToAdd);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assignments'), { 
        requestId: reqId, 
        clientEmail: email, 
        user: data.u, 
        pass: data.p, 
        port: data.port, 
        portAux: data.portAux, 
        service: data.service, 
        expiry: finalExpiry.toISOString(),
        expiryNotified: false,
        isOnline: false 
      });
    }

    // Mark the request as assigned
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), { status: 'assigned' });
    
    // Notify client via email
    sendEmail(
      email, 
      type === 'renewal' ? "SwifftNet: VPN Renewed! ⏳" : "SwifftNet: VPN PORT Assigned! 🚀", 
      type === 'renewal' 
        ? `Your VPN CREDENTIALS has been extended. New expiry: ${finalExpiry.toLocaleDateString()}`
        : `Your VPN credentials are ready as well as Your ports are ready. Winbox: ${data.port}, SSH/API: ${data.portAux}`
    );
    
    alert(type === 'renewal' ? "Assignment Updated (Renewed)" : "New Assignment Created");
  };

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

    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id);
      await addDoc(collection(ticketRef, 'messages'), {
        sender: user.email,
        text: replyBody,
        timestamp: serverTimestamp()
      });

      await updateDoc(ticketRef, {
        lastUpdate: new Date().toISOString(),
        status: user.role === 'admin' ? 'answered' : 'open'
      });

      const notifyEmail = user.role === 'admin' ? activeTicket.clientEmail : ADMIN_EMAIL;
      sendEmail(notifyEmail, `New Reply: ${activeTicket.subject}`, replyBody, activeTicket.id);
      setReplyBody("");
    } catch (err) {
      alert(`Failed to send reply: ${err.message}`);
    }
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

  if (!isAuthReady) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono italic animate-pulse tracking-widest text-sm">INITIALIZING SWIFFTNET CORE...</div>;

  // --- VIEW: VERIFY EMAIL ---
  if (view === 'verify-email') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
        <div className="text-orange-500 mb-8 scale-150 animate-bounce"><IconShield /></div>
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-orange-500/20 shadow-2xl text-center space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-widest italic">Verify Identity</h2>
          <p className="text-slate-400 font-medium text-sm">Check your inbox for the activation link to start using SwifftNet.</p>
          <div className="bg-black/40 p-4 rounded-2xl border border-slate-800">
            <code className="text-blue-400 text-xs font-bold">{auth.currentUser?.email}</code>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase shadow-xl transition-all">I have Verified</button>
          <button onClick={handleLogout} className="w-full text-slate-500 text-[10px] font-black uppercase underline tracking-widest">Logout & Try Again</button>
        </div>
      </div>
    );
  }

  // --- VIEW: LANDING (Verification Compliant) ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
        <div className="text-blue-500 mb-6 scale-125 animate-pulse"><IconShield /></div>
        
        {/* Brand Identity & Description */}
        <div className="text-center max-w-2xl mb-10 space-y-4">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
            SwifftNet <span className="text-blue-600">Remote</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            Professional Remote Access & VPN Solutions
          </p>
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl text-xs text-slate-500 leading-relaxed">
            <p className="mb-2 text-blue-400 font-black uppercase">App Functionality:</p>
            <p>SwifftNet Remote provides network administrators with secure L2TP/SSTP tunnels for remote Winbox, SSH, and API management of MikroTik routers. Our platform automates port assignment and subscription management to ensure seamless connectivity for ISPs and private networks.</p>
            <p className="mt-4 text-emerald-500 font-black uppercase">Data Transparency:</p>
            <p>We request your email and Google profile strictly for account authentication and service-related notifications. We do not monitor your traffic or share your data with third parties except as required for payment processing.</p>
          </div>
        </div>

        {/* Login/Signup Card */}
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
          <h2 className="text-center text-xl font-black uppercase tracking-widest">{isSignUp ? 'Join SwifftNet' : 'Login'}</h2>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" placeholder="Email" required value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            <input type="password" placeholder="Password" required value={passInput} onChange={(e)=>setPassInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
            {!isSignUp && (
              <div className="text-right px-2">
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-500 transition-colors">Forgot Password?</button>
              </div>
            )}
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all">
              {isSignUp ? 'Register' : 'Login'}
            </button>
          </form>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black flex items-center justify-center gap-4 uppercase tracking-widest shadow-lg">
            <IconGoogle /> Google Login
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-blue-500 text-xs font-black uppercase underline tracking-widest">
            {isSignUp ? 'Switch to Login' : 'Create Account'}
          </button>
          {authError && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{authError}</p>}
        </div>

        {/* COMPLIANCE FOOTER */}
        <footer className="mt-12 flex gap-8">
          <button onClick={() => setView('privacy')} className="text-slate-600 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest transition-colors">Privacy Policy</button>
          <button onClick={() => setView('terms')} className="text-slate-600 hover:text-emerald-500 text-[10px] font-black uppercase tracking-widest transition-colors">Terms of Use</button>
        </footer>
      </div>
    );
  }
// --- VIEW: DASHBOARD ---
// --- VIEW: DASHBOARD ---
if (view === 'dashboard' && user) {
  const bal = getUserBalance(user.email);
  const myReqs = requests.filter(r => r.email === user.email);
  const myPayments = payments.filter(p => p.email === user.email).sort((a, b) => new Date(b.date) - new Date(a.date));
  const hasTrialUsed = myReqs.some(r => r.type === 'trial');
  const isAccountNew = (new Date().getTime() - new Date(user.createdAt).getTime()) < (24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600">{user.name[0]}</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-slate-500 font-bold uppercase">{user.email}</p>
                <button onClick={handleUpdateEmail} className="text-slate-700 hover:text-blue-500 transition-colors" title="Change Email"><IconEdit /></button>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={openSupport} className="flex items-center gap-2 bg-slate-800 hover:bg-blue-600 text-white font-black text-[10px] uppercase px-6 py-3 rounded-2xl transition-all border border-slate-700"><IconTelegram /> Support</button>
            {user.role === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Admin Panel</button>}
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-600 text-white font-black text-xs uppercase px-10 py-3 rounded-2xl transition-all">Sign Out</button>
          </div>
        </header>

        {/* TOP STATS CARDS */}
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
              <select value={requestService} onChange={(e) => setRequestService(e.target.value)} className="w-full lg:w-auto bg-slate-950 border border-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-blue-400 outline-none cursor-pointer">
                <option value="winbox">Winbox</option>
                <option value="api">API</option>
                <option value="ssh">SSH</option>
              </select>
              <select value={vpnProtocol} onChange={(e) => setVpnProtocol(e.target.value)} className="w-full lg:w-auto bg-slate-950 border border-slate-800 p-4 rounded-2xl text-[10px] font-black uppercase text-emerald-400 outline-none cursor-pointer">
                <option value="l2tp">L2TP</option>
                <option value="sstp">SSTP</option>
              </select>
              <input value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Note..." className="flex-1 w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-medium outline-none" />
              <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <input value={promoInput} onChange={(e)=>setPromoInput(e.target.value)} placeholder="Promo?" className="bg-transparent px-2 outline-none text-[10px] uppercase font-black w-20" />
                <button onClick={validatePromo} className="bg-slate-800 hover:bg-emerald-600 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all">Apply</button>
              </div>
              {bal >= VPN_PRICE ? (
                <button onClick={() => createVpnRequest('new')} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl transition-all whitespace-nowrap">Buy Node</button>
              ) : (
                <span className="text-red-500 text-[10px] font-black uppercase italic animate-pulse">Top-up Needed</span>
              )}
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT: INSTANCES VS SIDEBAR */}
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* LEFT: REMOTE INSTANCES (SASAKOP NG 2/3 NG SCREEN) */}
          <div className="lg:col-span-2 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase font-mono italic"><IconShield /> Remote Instances</h2>
            {(() => {
              const seenNodes = new Set();
              const uniqueRequests = [];
              const sortedReqs = [...myReqs]
                .filter(r => ['new', 'trial', 'renewal'].includes(r.type))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              sortedReqs.forEach(req => {
                const nodeKey = req.vpnId || req.id;
                if (!seenNodes.has(nodeKey)) {
                  uniqueRequests.push(req);
                  seenNodes.add(nodeKey);
                }
              });

              if (uniqueRequests.length === 0) return <div className="bg-slate-900/30 p-12 rounded-[40px] border border-slate-800 border-dashed text-center text-slate-500 font-bold italic uppercase">No active instances yet.</div>;

              return uniqueRequests.map((req) => {
                const asgn = assignments.find(a => 
                  a.requestId === req.id || 
                  (req.vpnId && a.requestId === req.vpnId) ||
                  (a.clientEmail === req.email && a.port === req.port)
                );
                const hasPendingRenewal = requests.some(r => r.vpnId === req.id && r.status === 'pending');
                const protocol = req.protocol || 'l2tp'; 
                const isExpired = asgn ? new Date() > new Date(asgn.expiry) : false;
                const isOnline = asgn?.isOnline === true;
                const script = asgn ? `${protocol === 'l2tp' ? `/interface l2tp-client add connect-to=remote.swifftnet.site name=SwifftNet-Remote user=${asgn.user} password=${asgn.pass} use-ipsec=yes` : `/interface sstp-client add connect-to=remote.swifftnet.site name=SwifftNet-Remote user=${asgn.user} password=${asgn.pass} profile=default-encryption`}\n/ip firewall filter add action=accept chain=input comment="SwifftNet Remote" src-address=192.168.88.0/21\n/ip firewall filter add action=accept chain=input comment="Allow SwifftNet Top" place-before=0 src-address=192.168.88.0/21\n/ip firewall filter add action=accept chain=forward comment="Allow SwifftNet Fwd" place-before=0 src-address=192.168.88.0/21\n/ip service\nset winbox address=192.168.88.0/21\nset api address=192.168.88.0/21\nset ssh address=192.168.88.0/21` : "";

                return (
                  <div key={req.id} className={`bg-slate-900 rounded-[50px] border shadow-2xl mb-8 animate-in slide-in-from-left-4 ${isExpired ? 'border-red-500/50 opacity-80' : 'border-slate-800'}`}>
                    <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800 rounded-t-[50px]">
                      <div className="flex items-center gap-3">
                        {!isExpired && asgn && (<div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-600'}`} />)}
                        <span className="text-[10px] font-black text-slate-500 uppercase font-mono">ID: {req.id.slice(-6)} | {protocol.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {req.status === 'active' && !isExpired && !hasPendingRenewal && (
                          <button onClick={() => processAutoRenewal(req.id)} className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 px-4 py-1.5 rounded-full text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Renew +1 Year</button>
                        )}
                        <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/10 text-red-500' : isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {isExpired ? 'EXPIRED' : isOnline ? 'CONNECTED' : req.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-12">
                      {isExpired ? (
                        <div className="text-center space-y-6">
                          <p className="text-slate-400 font-bold italic">Node has expired. Please renew.</p>
                          {bal >= VPN_PRICE ? (<button onClick={() => processAutoRenewal(req.id)} className="bg-emerald-600 px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all">Renew (₱{VPN_PRICE})</button>) : <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Insufficient Balance</p>}
                        </div>
                      ) : (req.status === 'assigned' || req.status === 'active') && asgn && (
                        <div className="space-y-10">
                          {req.status === 'assigned' && (<button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { status: 'active' })} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] uppercase hover:bg-emerald-500 animate-bounce flex items-center justify-center gap-3"><IconCheck /> FINISHED DEPLOYMENT</button>)}
                          {req.status === 'active' && (<div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[35px] space-y-5 animate-in fade-in zoom-in-95"><div className="flex items-center gap-3 text-emerald-400"><IconShield /><h3 className="font-black uppercase italic text-sm tracking-widest">Koneksyon Ready!</h3></div><p className="text-[13px] leading-relaxed text-slate-300 font-medium">Use <strong>Winbox</strong> or <strong>SSH</strong> to access your router.</p></div>)}
                          <div className="bg-black/60 p-10 rounded-[32px] border border-slate-800 font-mono text-sm text-slate-400 space-y-3 shadow-inner relative overflow-hidden">
                            <div className="flex justify-between py-1 border-b border-slate-800/50"><span>VPN User</span> <span className="text-white font-black">{asgn.user}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-800/50"><span>VPN Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase italic tracking-[0.2em]">Deployment Script:</p>
                            <div className="bg-black/80 p-6 rounded-[24px] border border-slate-800 font-mono text-[10px] text-slate-500 relative group shadow-2xl">
                              <pre className="whitespace-pre-wrap">{script}</pre>
                              <button onClick={() => handleCopy(script, `script-${req.id}`)} className="absolute right-4 top-4 bg-slate-800 p-2 rounded-lg hover:bg-slate-700 border border-slate-700">{copiedId === `script-${req.id}` ? <IconCheck /> : <IconCopy />}</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-800">
                            <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800 shadow-xl"><p className="text-[9px] text-slate-500 font-black uppercase mb-1">Winbox Port</p><p className="text-2xl font-black text-emerald-400 font-mono">{asgn.port}</p></div>
                            <div className="bg-slate-950 p-6 rounded-[24px] text-center border border-slate-800 shadow-xl"><p className="text-[9px] text-slate-500 font-black uppercase mb-1">SSH/API Port</p><p className="text-2xl font-black text-blue-400 font-mono">{asgn.portAux || '---'}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* RIGHT: SIDEBAR (TICKETS, GCASH, HISTORY) */}
          <div className="space-y-12">
            
            {/* SUPPORT TICKETS SECTION */}
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono"><IconTicket /> Support</h2>
              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden min-h-[300px]">
                {!activeTicket ? (
                  <>
                    <form onSubmit={createTicket} className="space-y-4">
                      <input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Topic: e.g. Port help..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-3xl outline-none font-bold text-xs" />
                      <button className="w-full bg-blue-600 py-3 rounded-3xl font-black uppercase text-[10px]">Open Ticket</button>
                    </form>
                    <div className="space-y-3 mt-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {tickets.map(t => (
                        <div key={t.id} onClick={() => setActiveTicket(t)} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all">
                          <p className="text-[10px] font-black uppercase mb-1 truncate">{t.subject}</p>
                          <div className="flex justify-between items-center text-[7px] font-black"><span className={t.status === 'open' ? 'text-orange-500' : 'text-emerald-500'}>{t.status.toUpperCase()}</span><span>{new Date(t.lastUpdate).toLocaleDateString()}</span></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-4"><button onClick={() => setActiveTicket(null)} className="text-[10px] font-black text-blue-500 uppercase">← Back</button></div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 text-[10px]">
                      {messages.map(m => (
                        <div key={m.id} className={`p-3 rounded-2xl max-w-[90%] ${m.sender === user.email ? 'bg-blue-600 ml-auto' : 'bg-slate-800'}`}>
                          {m.text}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleReply} className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                      <input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Reply..." className="flex-1 bg-transparent p-2 outline-none text-[10px]" />
                      <button className="bg-emerald-600 px-3 py-1 rounded-xl font-black uppercase text-[8px]">Send</button>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* GCASH LOAD SECTION */}
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center gap-4 text-emerald-400 uppercase italic font-mono"><IconCard /> GCASH Load</h2>
              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
                <div className="bg-slate-950 p-5 rounded-3xl border border-dashed border-slate-800 text-center"><p className="text-xl font-black text-blue-500 font-mono">0968 385 9759</p></div>
                <form onSubmit={(e) => { e.preventDefault(); submitDeposit(e.target.amount.value, e.target.ref.value); e.target.reset(); }} className="space-y-4">
                  <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black text-sm" />
                  <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black uppercase text-sm" />
                  <button className="w-full bg-emerald-600 py-4 rounded-2xl font-black uppercase text-xs">Confirm Deposit</button>
                </form>
              </div>
            </section>

            {/* RECENT HISTORY SECTION */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                <IconHistory />
                <h3 className="font-black text-[10px] uppercase tracking-widest italic">History</h3>
              </div>
              <div className="bg-slate-900 p-6 rounded-[40px] border border-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar shadow-2xl">
                {myPayments.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic uppercase text-center py-4">No data</p>
                ) : myPayments.map((p) => (
                  <div key={p.id} className="bg-black/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center mb-3 group hover:border-slate-700 transition-all">
                    <div>
                      <p className="text-xs font-black text-white">₱{p.amount}</p>
                      <p className="text-[7px] text-slate-500 font-bold uppercase">Ref: {p.refNo}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[8px] font-black uppercase ${p.status === 'confirmed' ? 'text-emerald-500' : p.status === 'denied' ? 'text-red-500' : 'text-orange-500'}`}>
                        {p.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div> {/* END SIDEBAR */}
        </div> {/* END MAIN GRID */}

      </div>
    </div>
  );
}

// --- VIEW: ADMIN ---
if (view === 'admin' && user) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
        <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
          <h1 className="text-4xl font-black uppercase italic">Admin <span className="text-blue-500">Terminal</span></h1>
          <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl overflow-x-auto">
            {['payments', 'requests', 'tickets', 'clients', 'promos'].map(tab => (
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
                <div className="bg-black/40 p-8 rounded-[30px] text-center border border-slate-800">
                  <p className="text-4xl font-black mb-2">₱{p.amount}</p>
                  <p className="text-[10px] text-slate-600 font-black">REF: {p.refNo}</p>
                </div>
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
              <div key={r.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-8 animate-in slide-in-from-left-4">
                <p className="font-black text-white text-lg truncate uppercase border-b border-slate-800 pb-6">{r.email}</p>
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  const fd = new FormData(e.target); 
                  adminAssignTunnel(r.id, r.email, { 
                    days: fd.get('d'), 
                    u: fd.get('u'), 
                    p: fd.get('p'), 
                    port: fd.get('port'), 
                    portAux: fd.get('portAux'), 
                    service: r.service || 'winbox' 
                  }, r.type, r.vpnId); 
                }} className="space-y-6">
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
            {tickets.filter(t => t.status !== 'closed').sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate)).map(t => (
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
            {activeTicket && (
              <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 md:p-10 z-[100] animate-in fade-in duration-300">
                <div className="bg-slate-900 w-full max-w-3xl h-[90vh] rounded-[50px] border border-slate-800 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.2)]">
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Support Case: {activeTicket.id.slice(-6)}</p>
                      <h2 className="font-black uppercase tracking-tight text-lg italic">{activeTicket.subject}</h2>
                      <p className="text-[9px] text-slate-500 font-bold">{activeTicket.clientEmail}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={async () => { 
                        if (window.confirm("Close this ticket? Client will be notified.")) { 
                          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id), { status: 'closed', lastUpdate: new Date().toISOString() }); 
                          sendEmail(activeTicket.clientEmail, "Ticket Closed ✅", `Your support ticket regarding "${activeTicket.subject}" has been marked as resolved.`); 
                          setActiveTicket(null); 
                        } 
                      }} className="px-6 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all">Close Ticket</button>
                      <button onClick={() => setActiveTicket(null)} className="text-xs font-black text-slate-500 uppercase px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700">Back</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === user.email ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-[2rem] max-w-[85%] text-sm font-medium shadow-xl ${m.sender === user.email ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{m.text}</div>
                        <p className="text-[8px] mt-2 opacity-40 uppercase font-black tracking-widest px-2">{m.sender === user.email ? 'Admin (You)' : 'Client Response'}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleReply} className="p-8 bg-slate-950 border-t border-slate-800 flex gap-4">
                    <input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Type your official response..." className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] outline-none font-bold text-sm focus:border-blue-500 transition-all" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 rounded-[2.5rem] font-black uppercase text-xs shadow-lg transition-all flex items-center gap-2">Send Reply</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'promos' && (
          <div className="max-w-md mx-auto space-y-8">
            <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 shadow-2xl">
              <h2 className="text-sm font-black uppercase mb-6 text-blue-500 italic">Reseller Promo Manager</h2>
              <form onSubmit={(e) => { e.preventDefault(); createPromoCode(e.target.promo.value); e.target.reset(); }} className="flex gap-4">
                <input name="promo" placeholder="CODE150" className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black" />
                <button className="bg-blue-600 px-6 rounded-2xl font-black uppercase text-[10px]">Add</button>
              </form>
            </div>
            <div className="space-y-4">
              {promos.map(p => (
                <div key={p.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
                  <span className="font-black text-emerald-500 tracking-widest">{p.code}</span>
                  <button onClick={() => deletePromoCode(p.id)} className="text-red-500 text-[10px] font-black uppercase">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'clients' && (
          <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-800/50 text-[11px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                <tr><th className="p-10">Client Profile</th><th className="p-10 text-center">Net Balance</th><th className="p-10">Network Nodes</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {getAllClients().map(email => (
                  <tr key={email} className="hover:bg-slate-800/20 transition-all group">
                    <td className="p-10 align-top"><div className="flex flex-col gap-1"><span className="font-black text-white italic truncate max-w-[250px] text-sm group-hover:text-blue-400 transition-colors">{email}</span><span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Verified SwifftNet User</span></div></td>
                    <td className="p-10 text-center align-top"><div className="bg-slate-950/50 inline-block px-6 py-3 rounded-2xl border border-slate-800"><p className="text-2xl font-black text-emerald-500">₱{getUserBalance(email)}</p><p className="text-[8px] text-slate-600 font-black uppercase">Credits</p></div></td>
                    <td className="p-10 align-top">
                      <div className="space-y-4">
                        {assignments.filter(a => a.clientEmail === email).length > 0 ? (
                          assignments.filter(a => a.clientEmail === email).map((t, i) => (
                            <div key={i} className={`bg-slate-950 p-5 rounded-3xl border transition-all relative group/node min-w-[280px] shadow-lg ${t.isOnline ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-slate-800'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                  <span className="text-blue-400 font-mono text-[11px] font-black uppercase leading-none">Winbox: <span className="text-white">{t.port}</span></span>
                                  <span className="text-blue-600 font-mono text-[11px] font-black uppercase mt-1">SSH/API: <span className="text-white">{t.portAux || 'N/A'}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase ${t.isOnline ? 'text-emerald-500' : 'text-slate-600'}`}>{t.isOnline ? 'Active' : 'Offline'}</span>
                                  <div className={`w-2 h-2 rounded-full ${t.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                                <span className="text-slate-600 font-mono text-[9px] font-black italic uppercase">Exp: {new Date(t.expiry).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover/node:opacity-100 transition-opacity">
                                  <button onClick={() => resendActivationEmail(t)} className="bg-blue-600/10 text-blue-500 text-[8px] font-black px-3 py-1.5 rounded-lg border border-blue-500/20">RESEND</button>
                                  <button onClick={async () => { if (window.confirm(`Terminate node ${t.port}?`)) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', t.id)); }} className="bg-red-500/10 text-red-500 text-[8px] font-black px-3 py-1.5 rounded-lg border border-red-500/20">DELETE</button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 font-black uppercase italic">No Active Nodes</span>
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

// --- VIEW: PRIVACY POLICY (FULL & EXACT) ---
if (view === 'privacy') {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-slate-900/50 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-2xl space-y-8">
        
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-blue-500 leading-none">Privacy Policy</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Last Updated: March 31, 2026</p>
          </div>
          <button 
            onClick={() => setView('landing')} 
            className="bg-slate-800 hover:bg-blue-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700"
          >
            Back
          </button>
        </header>

        <div className="text-slate-300 text-sm space-y-8 font-medium leading-relaxed overflow-y-auto max-h-[65vh] pr-4 custom-scrollbar">
          <p>
            This Privacy Policy outlines how <strong>SwifftNET</strong> (vpn.swifftnet.site) collects, uses, and protects your data when you use our Remote Access and VPN services. As a Philippine-based provider, we are committed to upholding the <strong>Data Privacy Act of 2012 (RA 10173)</strong> and ensuring your network activity remains secure and private.
          </p>

          <section className="space-y-4">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">1. Information We Collect</h2>
            <p>To provide reliable remote access, we collect two categories of information:</p>
            
            <div className="pl-6 space-y-4 border-l-2 border-blue-500/30">
              <div>
                <h3 className="text-white font-bold uppercase text-xs mb-2">A. Account Information</h3>
                <p className="mb-2 italic text-slate-400">When you subscribe or create an account, we may collect:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Personal Identity:</strong> Full Name, Contact Number, and Email Address.</li>
                  <li><strong>Billing Details:</strong> Records of payments and subscription status.</li>
                  <li><strong>Credentials:</strong> Username and encrypted passwords for VPN access.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold uppercase text-xs mb-2">B. Technical & Usage Logs</h3>
                <p className="mb-2 italic text-slate-400">As an ISP/Remote Access provider, we process limited technical data to maintain service quality:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Connection Metadata:</strong> Time of connection/disconnection and total bandwidth used.</li>
                  <li><strong>IP Addresses:</strong> Your assigned internal VPN IP and the public IP used to connect.</li>
                  <li><strong>Device Info:</strong> Basic identifiers of the device connecting to the server.</li>
                </ul>
              </div>
            </div>
            <p className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-xs italic">
              <strong>Note:</strong> We do <strong>not</strong> monitor, record, or store the specific websites you visit or the content of your communications while connected to our Remote Access service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">2. Purpose of Data Processing</h2>
            <p>We use your data strictly for the following purposes:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Service Delivery:</strong> Authenticating your access and managing your remote connection.</li>
              <li><strong>Security:</strong> Monitoring for unauthorized login attempts or network abuse.</li>
              <li><strong>Support:</strong> Troubleshooting connectivity issues for your specific account.</li>
              <li><strong>Legal Compliance:</strong> Adhering to Philippine laws, such as the <strong>Anti-Child Pornography Act (RA 9775)</strong>, which requires ISPs to preserve certain access logs (origin/destination of access) for a limited period.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">3. Data Retention & Security</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Encryption:</strong> All remote access traffic is secured using industry-standard protocols (e.g., WireGuard, OVPN, L2TP, or SSTP) with <strong>AES-256 bit encryption</strong>.</li>
              <li><strong>Retention:</strong> We only keep personal data for as long as your account is active or as required by NTC regulations. Connection logs are automatically purged after <strong>60 days</strong> unless a longer period is legally mandated.</li>
              <li><strong>Access Control:</strong> Access to our backend systems (MikroTik/RouterOS) is strictly limited to authorized SwifftNET administrators.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">4. Your Rights as a Data Subject</h2>
            <p>Under the Data Privacy Act of 2012, you have the right to:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Be Informed:</strong> Know how your data is being used (as detailed here).</li>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Rectify:</strong> Correct any inaccuracies in your account details.</li>
              <li><strong>Object/Erasure:</strong> Request the deletion of your account and data, subject to legal retention requirements.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">5. Third-Party Sharing</h2>
            <p>We <strong>never sell</strong> your personal data. Sharing only occurs with:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong>Payment Processors:</strong> To verify and complete your subscription payments.</li>
              <li><strong>Law Enforcement:</strong> Only when presented with a valid court order or subpoena in accordance with Philippine law.</li>
            </ul>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-blue-500 font-black uppercase tracking-tight italic text-lg">6. Contact Us</h2>
            <p>If you have questions about this policy or wish to exercise your privacy rights, please contact our Data Protection Officer:</p>
            <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 space-y-1">
              <p className="font-black text-white uppercase text-sm">SwifftNET Support</p>
              <p className="text-blue-400 font-bold">Email: ramoshowardkingsley58@gmail.com</p>
              <p className="text-slate-500 text-xs">Location: Santa Ana Cagayan Valley</p>
              <p className="text-slate-500 text-xs">Website: vpn.swifftnet.site</p>
            </div>
          </section>
        </div>

        <footer className="pt-4">
          <button 
            onClick={() => setView('landing')} 
            className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
          >
            I Understand - Return to Login
          </button>
        </footer>
      </div>
    </div>
  );
}

// --- VIEW: TERMS OF USE (FULL & EXACT) ---
if (view === 'terms') {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-slate-900/50 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-2xl space-y-8">
        
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-emerald-500 leading-none">Terms of Service</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Last Updated: March 31, 2026</p>
          </div>
          <button 
            onClick={() => setView('landing')} 
            className="bg-slate-800 hover:bg-emerald-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700"
          >
            Back
          </button>
        </header>

        <div className="text-slate-300 text-sm space-y-8 font-medium leading-relaxed overflow-y-auto max-h-[65vh] pr-4 custom-scrollbar">
          <p className="italic text-slate-400">
            This Terms of Service agreement governs your use of <strong>SwifftNET REMOTE Access</strong> and the services provided via <strong>vpn.swifftnet.site</strong>. By accessing or using our services, you agree to be bound by these terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">1. Acceptance of Terms</h2>
            <p>By subscribing to or using SwifftNET services, you acknowledge that you have read, understood, and agreed to these Terms of Service. If you are using this service on behalf of a business or entity, you represent that you have the authority to bind that entity to these terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">2. Description of Service</h2>
            <p>SwifftNET provides remote access and VPN solutions primarily designed for network management, secure browsing, and remote connectivity. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time to maintain network integrity or perform scheduled maintenance.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">3. User Responsibilities & Conduct</h2>
            <p>You are responsible for all activity that occurs under your account. To maintain the security and quality of our network, you agree <strong>not</strong> to:</p>
            <div className="pl-6 space-y-4 border-l-2 border-emerald-500/30">
              <p><strong>Illegal Activity:</strong> Use the service for any purpose that violates Philippine laws, including the <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong>.</p>
              <p><strong>Abuse:</strong> Attempt to gain unauthorized access to our servers, perform DDoS attacks, or distribute malware.</p>
              <p><strong>Reselling:</strong> Sell, trade, or transfer your account to third parties without express written consent from SwifftNET management.</p>
              <p><strong>Spamming:</strong> Use our remote access tunnels to send unsolicited bulk emails or commercial advertisements.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">4. Payment and Subscriptions</h2>
            <div className="space-y-3 text-slate-400">
              <p><strong>Fees:</strong> Access to SwifftNET Remote Access is provided on a subscription basis. Current rates are listed on our official website.</p>
              <p><strong>Refunds:</strong> Due to the digital nature of our service, payments are generally non-refundable. However, issues involving technical failure on our end will be reviewed on a case-by-case basis.</p>
              <p><strong>Late Payments:</strong> Failure to settle subscription renewals may result in the automatic suspension of your remote access tunnel.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">5. Service Level & Disclaimers</h2>
            <div className="space-y-3 text-slate-400">
              <p><strong>"As-Is" Basis:</strong> The service is provided "as is" and "as available." While we strive for 99.9% uptime, we do not guarantee that the service will be uninterrupted or error-free.</p>
              <p><strong>Speed & Latency:</strong> Connection speeds may vary depending on your local ISP (e.g., PLDT, Globe, Starlink), network congestion, and geographical distance from our nodes.</p>
              <p><strong>Data Loss:</strong> SwifftNET is not responsible for any data loss or security breaches resulting from user negligence, such as weak passwords or shared credentials.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, <strong>SwifftNET</strong> and its developers shall not be liable for any indirect, incidental, or consequential damages (including loss of profits or data) arising out of your use or inability to use the service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">7. Termination</h2>
            <p>We reserve the right to terminate or suspend your access immediately, without prior notice, if you breach these terms or engage in activities that threaten the stability of our network. Upon termination, your right to use the service will cease immediately.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">8. Governing Law</h2>
            <p>These terms are governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>. Any legal actions arising from these terms shall be settled in the proper courts of the Philippines.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">9. Changes to Terms</h2>
            <p>SwifftNET reserves the right to update these terms at any time. We will notify active subscribers of significant changes via the email address associated with their account or through a notice on vpn.swifftnet.site.</p>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h2 className="text-emerald-500 font-black uppercase tracking-tight italic text-lg">Contact Information</h2>
            <p>For any inquiries regarding these terms, please reach out to:</p>
            <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 space-y-1">
              <p className="font-black text-white uppercase text-sm">SwifftNET Management</p>
              <p className="text-emerald-400 font-bold">Email: ramoshowardkingsley58@gmail.com</p>
              <p className="text-slate-500 text-xs">Website: vpn.swifftnet.site</p>
            </div>
          </section>
        </div>

        <footer className="pt-4">
          <button 
            onClick={() => setView('landing')} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            I Accept These Terms
          </button>
        </footer>
      </div>
    </div>
  );
}

return null;
}