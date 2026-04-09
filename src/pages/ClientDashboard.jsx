import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import AnnouncementBanner from '../components/AnnouncementBanner';
import NetworkToolbox from '../components/NetworkToolbox';
import NetworkUtils from '../components/NetworkUtils';

// Icons Import
import { 
  IconShield, IconCard, IconTelegram, IconTicket, 
  IconHistory, IconCopy, IconCheck 
} from '../components/Icons';

export default function ClientDashboard({ 
  user,           // Current logged-in user
  payments,       // Synced payments (filtered to user)
  requests,       // Synced requests
  tickets,        // Synced tickets
  assignments,    // Synced VPN assignments
  promos,         // Available promo codes
  prices,         // Global prices { vpnPrice, internetVpnPrice, promoPrice, billing_system_license }
  db,             // Firestore instance
  appId,          // App ID constant
  base,           // Base path array
  ADMIN_EMAIL,    // Your admin email
  handleLogout,   // Logout function
  openSupport,    // Intergram/Support opener
  sendEmail,      // EmailJS function
  setView,
  announcement,
  
  // Support Modal Props
  activeTicket, 
  setActiveTicket, 
  messages, 
  replyBody, 
  setReplyBody, 
  handleReply 
}) {
  const navigate = useNavigate();

  // --- INTERNAL UI STATES ---
  const [serviceCategory, setServiceCategory] = useState("remote"); // remote or internet
  const [requestService, setRequestService] = useState("winbox");
  const [vpnProtocol, setVpnProtocol] = useState("sstp");
  const [promoInput, setPromoInput] = useState("");
  const [isPromoValid, setIsPromoValid] = useState(false);
  const [clientNote, setClientNote] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [liveUser, setLiveUser] = useState(user);


  // Makikinig tayo sa changes ng document mo sa 'users' collection
  useEffect(() => {
    if (!user?.email) return;
    
     // Siguraduhing imported ito o gamitin ang existing
    const userRef = doc(db, 'users', user.email);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log("Profile Synced:", docSnap.data());
        setLiveUser({ ...user, ...docSnap.data() }); // I-merge ang Auth data at Firestore data
      }
    });

    return () => unsubscribe();
  }, [user.email, db]);

  // --- LOGIC: BALANCE CALCULATION ---
  const getUserBalance = () => {
    const deposits = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const spent = requests
      .filter(r => r.type !== 'trial' && r.status !== 'denied')
      .reduce((sum, r) => sum + (r.pricePaid || prices.vpnPrice), 0);
      
    return deposits - spent;
  };

  const bal = getUserBalance();
  const currentPrice = isPromoValid ? prices.promoPrice : (serviceCategory === 'remote' ? prices.vpnPrice : prices.internetVpnPrice);
  const canAfford = bal >= currentPrice;

  // --- HANDLERS ---

  const validatePromo = () => {
    const found = promos.find(p => (p.code || '').toUpperCase() === (promoInput || '').toUpperCase());
    if (found) {
      setIsPromoValid(true);
      alert(`Promo Applied! New price: ₱${prices.promoPrice}`);
    } else {
      setIsPromoValid(false);
      alert("Invalid Promo Code.");
    }
  };

  const handleVpnRequest = async (type = 'new', vpnId = null) => {
    if (bal < currentPrice) return alert("Insufficient balance.");

    try {
      const promoDoc = promos.find(p => p.code.toUpperCase() === promoInput.toUpperCase());
      
      await addDoc(collection(db, ...base, 'requests'), {
        email: user.email,
        status: 'pending',
        type,
        category: serviceCategory,
        vpnId,
        service: requestService,
        protocol: vpnProtocol,
        pricePaid: currentPrice,
        promoUsed: isPromoValid ? promoInput.toUpperCase() : "NONE",
        note: clientNote || (serviceCategory === 'internet' ? "Internet VPN Subscription" : "Remote Access"),
        date: serverTimestamp()
      });

      if (isPromoValid && promoDoc) {
        await deleteDoc(doc(db, ...base, 'promos', promoDoc.id));
      }

      setPromoInput("");
      setIsPromoValid(false);
      sendEmail(ADMIN_EMAIL, `New Node Request`, `User: ${user.email}\nService: ${serviceCategory}`);
      alert("Request Sent! Please wait for Admin approval.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleTrialRequest = async () => {
    const alreadyHasTrial = requests.some(r => r.type === 'trial');
    if (alreadyHasTrial) return alert("You have already used your free trial.");

    try {
      await addDoc(collection(db, ...base, 'requests'), {
        email: user.email,
        status: 'pending',
        type: 'trial',
        category: serviceCategory,
        service: requestService,
        protocol: vpnProtocol,
        note: "Free Trial Request",
        date: serverTimestamp()
      });
      alert("Trial Request Sent!");
    } catch (err) { alert(err.message); }
  };

  // I-paste mo rito sa pagitan nila
  const handleAvailBilling = async () => {
    const licensePrice = Number(prices?.billing_system_license || 150);
    const currentBal = Number(bal);

    if (currentBal < licensePrice) {
      return alert(`Insufficient balance! Needs ₱${licensePrice}`);
    }

    try {
      await addDoc(collection(db, ...base, 'requests'), {
        email: user.email,
        status: 'pending',
        type: 'billing_license',
        category: 'license',
        pricePaid: licensePrice,
        note: "WISP Billing System Activation",
        date: serverTimestamp()
      });
      alert("Billing License Request Sent! Admin will activate it shortly. 🚀");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
// Dito nag-uumpisa yung susunod mong function (submitDeposit)

  const submitDeposit = async (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    const refNo = e.target.ref.value;
    await addDoc(collection(db, ...base, 'payments'), {
      email: user.email,
      amount,
      refNo,
      status: 'pending',
      date: serverTimestamp()
    });
    e.target.reset();
    alert("Deposit reference sent for verification.");
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    const tData = { 
      clientEmail: user.email, 
      subject: ticketSubject, 
      status: 'open', 
      createdAt: new Date().toISOString(), 
      lastUpdate: new Date().toISOString() 
    };
    const tRef = await addDoc(collection(db, ...base, 'tickets'), tData);
    await addDoc(collection(db, ...base, 'tickets', tRef.id, 'messages'), { 
      sender: user.email, 
      text: `Support Request: ${ticketSubject}`, 
      timestamp: serverTimestamp() 
    });
    setTicketSubject("");
    alert("Ticket Opened.");
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateNickname = async (id, currentName) => {
    const newName = prompt("Enter a nickname for this node:", currentName || "");
    if (newName === null) return;
    
    try {
      const nodeRef = doc(db, 'artifacts', appId, 'public', 'data', 'assignments', id);
      await updateDoc(nodeRef, { nickname: newName });
    } catch (err) {
      alert("Error updating nickname: " + err.message);
    }
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      {/* 1. ANNOUNCEMENT BANNER */}
      <AnnouncementBanner announcement={announcement} />
      
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-800 gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600 shadow-lg">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none italic">{user.name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={openSupport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase">
              <IconTelegram /> Support
            </button>
            {user.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-all">
                Admin Terminal
              </button>
            )}
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-slate-800 hover:bg-red-600 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase">
              Sign Out
            </button>
          </div>
        </header>

        {/* TOP STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[40px] text-center shadow-xl flex flex-col justify-center">
            <p className="text-blue-400 text-[10px] font-black uppercase mb-2">My Balance</p>
            <p className="text-5xl font-black italic">₱{bal}</p>
          </div>

          {/* BILLING SYSTEM CARD */}
          <div className="bg-slate-900/50 p-8 rounded-[45px] border border-slate-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <IconCard className="w-6 h-6" />
                  </div>
                  <div className="bg-emerald-600/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">New Feature</p>
                  </div>
              </div>
              <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">WISP Billing System</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                      Manage collections, clients, and branding professionally.
                  </p>
              </div>
              <button 
                  onClick={() => {
                    // Gamit ang liveUser para ma-detect agad ang activation ng Admin
                    const hasAccess = liveUser.billingAccessUntil && (liveUser.billingAccessUntil.toDate ? liveUser.billingAccessUntil.toDate() : new Date(liveUser.billingAccessUntil)) > new Date();
                    
                    if (hasAccess) { 
                      navigate('/billing'); 
                    } else { 
                      handleAvailBilling(); 
                    }
                  }} 
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-[2rem] font-black uppercase text-[9px] tracking-widest shadow-xl transition-all"
                >
                  {/* Label logic using liveUser */}
                  {liveUser.billingAccessUntil && (liveUser.billingAccessUntil.toDate ? liveUser.billingAccessUntil.toDate() : new Date(liveUser.billingAccessUntil)) > new Date() 
                    ? "Open Dashboard" 
                    : `Avail License (₱${prices?.billing_system_license || 150})`}
                </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] text-center shadow-xl flex flex-col justify-center">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-2">
              {serviceCategory === 'remote' ? 'Remote Rate' : 'VPN Rate'}
            </p>
            <p className="text-4xl font-black text-emerald-500 italic">₱{currentPrice}</p>
            <p className="text-[8px] text-slate-600 font-black uppercase mt-1 italic">
              {serviceCategory === 'remote' ? 'Per Node / Year' : 'Per Node / Month'}
            </p>
          </div>

          <div className="md:col-span-2 lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-[40px] flex flex-col justify-center gap-4 shadow-xl">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button onClick={() => setServiceCategory('remote')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${serviceCategory === 'remote' ? 'bg-blue-600 shadow-md' : 'text-slate-600'}`}>Remote</button>
              <button onClick={() => setServiceCategory('internet')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${serviceCategory === 'internet' ? 'bg-emerald-600 shadow-md' : 'text-slate-600'}`}>Internet</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <select value={requestService} onChange={(e)=>setRequestService(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] font-black uppercase text-blue-400 outline-none">
                <option value="winbox">Winbox</option>
                {serviceCategory === 'internet' && <option value="internet">Internet</option>}
                <option value="api">API / SSH</option>
              </select>
              <button onClick={()=>handleVpnRequest()} disabled={!canAfford} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase transition-all ${canAfford ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 text-slate-600'}`}>
                {canAfford ? 'Buy Now' : 'Refill Balance'}
              </button>
            </div>
          </div>
        </div>

        {/* MAIN AREA: NODES & SIDEBAR */}
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: ACTIVE NODES */}
          <div className="lg:col-span-2 space-y-10">
            <NetworkUtils />
            <NetworkToolbox />

            <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase italic tracking-tighter">
              <IconShield /> Active Remote Nodes
            </h2>
            
            {assignments.length === 0 && (
              <div className="bg-slate-900/50 p-20 rounded-[50px] border border-dashed border-slate-800 text-center">
                <p className="text-slate-600 font-black uppercase italic text-xs tracking-widest">No active nodes detected.</p>
                <button onClick={handleTrialRequest} className="mt-4 text-blue-500 text-[10px] font-black uppercase underline">Activate Free Trial</button>
              </div>
            )}

            {assignments.map((asgn) => {
                const isExpired = new Date() > new Date(asgn.expiry);

                const script = (() => {
                    const protocol = asgn.protocol || 'l2tp';
                    const isInternet = asgn.category === 'internet';
                    const interfaceName = `SwifftNet-${isInternet ? 'Internet' : 'Remote'}`;

                    let baseScript = protocol === 'l2tp' 
                    ? `/interface l2tp-client add connect-to=remote.swifftnet.site name=${interfaceName} user=${asgn.user} password=${asgn.pass} use-ipsec=yes`
                    : `/interface sstp-client add connect-to=remote.swifftnet.site name=${interfaceName} user=${asgn.user} password=${asgn.pass} profile=default-encryption`;

                    if (isInternet) {
                      return `${baseScript}\n/ip route add dst-address=0.0.0.0/0 gateway=${interfaceName} distance=1 check-gateway=ping\n/ip firewall nat add chain=srcnat out-interface=${interfaceName} action=masquerade`;
                    } else {
                      // Original Remote Script + Silent Monitor Port logic
                      return `${baseScript}\n/ip firewall filter add action=accept chain=input comment="SwifftNET-Remote" place-before=0 src-address=192.168.88.0/21\n/ip firewall filter add action=accept chain=forward comment="SwifftNET-Remote" place-before=1 src-address=192.168.88.0/21\n/ip service set winbox address=192.168.88.0/21 api address=192.168.88.0/21 ssh address=192.168.88.0/21 www address=192.168.88.0/21`;
                    }
                })();

              return (
                <div key={asgn.id} className={`bg-slate-900 rounded-[50px] border p-8 md:p-12 shadow-2xl mb-8 transition-all ${isExpired ? 'border-red-500/50 opacity-80' : 'border-slate-800 hover:border-blue-500/20'}`}>
                  
                  {/* Status Header */}
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-4">
                      {/* SILENT WEB STATUS CHECKER (Pulse on asgn.isOnline) */}
                      <div className={`w-3 h-3 rounded-full ${asgn.isOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-600'}`} />
                      <span onClick={() => updateNickname(asgn.id, asgn.nickname)} className="text-sm font-black text-white uppercase italic cursor-pointer hover:text-blue-400 transition-colors">
                        {asgn.nickname || "Set Node Alias +"}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : asgn.isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {isExpired ? 'EXPIRED' : asgn.isOnline ? 'ACTIVE CONNECTION' : 'WAITING FOR SYNC'}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* CONNECTION PORTS (ONLY 2 VISIBLE AS PER LEAD DEV INSTRUCTION) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Winbox Mapped Address */}
                      <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center group/item transition-all hover:border-blue-500/50">
                        <div className="space-y-1">
                          <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Winbox Mapped Address</p>
                          <p className="text-[12px] font-mono font-bold text-white italic truncate tracking-tight">remote.swifftnet.site:{asgn.port}</p>
                        </div>
                        <button onClick={() => handleCopy(`remote.swifftnet.site:${asgn.port}`, asgn.id)} className="bg-slate-900 p-3 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-slate-800 transition-all shadow-lg">
                          <IconCopy />
                        </button>
                      </div>

                      {/* SSH / API Tunnel Port (Merged) */}
                      <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center group/item transition-all hover:border-emerald-500/50">
                        <div className="space-y-1">
                          <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">SSH / API Management Port</p>
                          <p className="text-[12px] font-mono font-bold text-blue-400 italic tracking-tight">{asgn.sshPort || asgn.apiPort || 'N/A'}</p>
                        </div>
                        <button onClick={() => handleCopy(`${asgn.sshPort || asgn.apiPort}`, `merged-${asgn.id}`)} className="bg-slate-900 p-3 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-800 transition-all shadow-lg">
                          <IconCopy />
                        </button>
                      </div>
                    </div>

                    {/* Auth Details Grid */}
                    <div className="bg-black/40 p-6 rounded-[32px] border border-slate-800 font-mono text-xs text-slate-400 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="uppercase tracking-widest opacity-50">Username</span> 
                        <span className="text-white font-black">{asgn.user}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="uppercase tracking-widest opacity-50">Password</span> 
                        <span className="text-white font-black">{asgn.pass}</span>
                      </div>
                    </div>

                    {/* Setup Command Script */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-blue-400 uppercase italic px-2 tracking-widest">MikroTik Router Command:</p>
                      <div className="bg-black/60 p-6 rounded-3xl border border-slate-800 font-mono text-[10px] text-slate-500 relative group/script">
                        <pre className="whitespace-pre-wrap leading-relaxed">{script}</pre>
                        <button 
                          onClick={() => handleCopy(script, `s-${asgn.id}`)} 
                          className="absolute right-4 top-4 bg-slate-800 p-2.5 rounded-xl opacity-0 group-hover/script:opacity-100 transition-all shadow-xl hover:bg-slate-700"
                        >
                          <IconCopy />
                        </button>
                      </div>
                    </div>

                    {/* DEPLOYMENT STATUS BUTTON & EXPIRY PROGRESS */}
                    <div className="pt-4 space-y-4">
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} 
                          style={{ width: `${Math.max(0, Math.min(100, ((new Date(asgn.expiry).getTime() - new Date().getTime()) / (365 * 24 * 60 * 60 * 1000)) * 100))}%` }}
                        />
                      </div>
                      
                      {asgn.status !== 'active' ? (
                        <button disabled className="w-full bg-slate-800 py-4 rounded-2xl font-black uppercase text-[10px] text-slate-600 italic animate-pulse tracking-widest border border-slate-700">
                          Deploying Remote Environment...
                        </button>
                      ) : (
                        <button className="w-full bg-blue-600/10 text-blue-500 border border-blue-500/20 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-blue-600 hover:text-white transition-all">
                          Finished Deployment Successfully
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="space-y-12">
            
            {/* SUPPORT TICKETS BOX */}
            <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
              <h2 className="text-lg font-black flex items-center gap-3 text-emerald-400 uppercase italic tracking-tighter">
                <IconTicket /> Help Desk
              </h2>
              <form onSubmit={createTicket} className="space-y-3">
                <input 
                  value={ticketSubject} 
                  onChange={e=>setTicketSubject(e.target.value)} 
                  placeholder="Topic: e.g. Port forwarding..." 
                  className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl outline-none text-[10px] font-black uppercase text-white placeholder:text-slate-700 focus:border-blue-500 transition-all" 
                />
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-blue-500 transition-all">Open New Ticket</button>
              </form>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar text-[10px]">
                {tickets.map(t => (
                  <div key={t.id} onClick={()=>setActiveTicket(t)} className={`bg-slate-950 p-4 rounded-2xl border border-slate-800 cursor-pointer hover:border-blue-500 transition-all ${t.status === 'answered' ? 'border-emerald-500 shadow-md' : ''}`}>
                    <p className="font-black uppercase mb-1 truncate">{t.subject}</p>
                    <div className="flex justify-between text-[7px] font-black uppercase tracking-widest opacity-60">
                      <span className={t.status === 'open' ? 'text-orange-500' : 'text-emerald-500'}>{(t.status || 'open')}</span>
                      <span className="text-slate-600">{new Date(t.lastUpdate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {tickets.length === 0 && <p className="text-center py-6 text-slate-800 font-black uppercase italic text-[9px]">No ticket history.</p>}
              </div>
            </section>

            {/* AFFILIATE PROGRAM BOX */}
            <section className="bg-slate-900/50 p-8 rounded-[40px] border border-blue-500/20 space-y-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-1000"><IconShield className="w-20 h-20" /></div>
              <h3 className="text-[10px] font-black uppercase text-blue-400 italic tracking-widest">Affiliate Program</h3>
              <p className="text-[9px] text-slate-500 font-medium italic leading-relaxed">Refer your friends and earn 10% credits for every successful payment they make.</p>
              <div className="flex gap-2 relative z-10">
                <input readOnly value={`${window.location.origin}/login?ref=${user.uid}`} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-[8px] font-mono text-slate-600 outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/login?ref=${user.uid}`); alert("Referral Link Copied!"); }} className="bg-blue-600 hover:bg-blue-500 px-5 py-4 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg">Copy</button>
              </div>
            </section>

            {/* GCASH REFILL BOX */}
            <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
              <h2 className="text-lg font-black flex items-center gap-3 text-emerald-400 uppercase italic tracking-tighter">
                <IconCard /> Wallet Refill
              </h2>
              <div className="bg-slate-950 p-5 rounded-3xl border border-dashed border-slate-800 text-center">
                <p className="text-xl font-black text-blue-500 font-mono italic tracking-tight">0968 385 9759</p>
                <p className="text-[9px] text-slate-600 font-black uppercase mt-1 tracking-widest">Howard Kingsley Ramos</p>
              </div>
              <form onSubmit={submitDeposit} className="space-y-4">
                <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl outline-none font-black text-xs text-white" />
                <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl outline-none font-black text-xs uppercase text-white" />
                <button className="w-full bg-emerald-600 py-5 rounded-3xl font-black uppercase text-[10px] shadow-xl hover:bg-emerald-500 transition-all">Submit Payment</button>
              </form>
            </section>

            {/* TRANSACTION HISTORY SECTION */}
            <section className="space-y-4 pb-10">
              <div className="flex items-center gap-2 text-slate-500 px-4">
                <IconHistory className="w-4 h-4" /> 
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Audit Trail</span>
              </div>
              <div className="bg-slate-900 p-6 rounded-[40px] border border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar shadow-2xl">
                {payments.map(p => (
                  <div key={p.id} className="bg-black/40 p-5 rounded-2xl border border-slate-800 flex justify-between items-center mb-4 transition-all hover:border-slate-700">
                    <div>
                      <p className="text-xs font-black italic text-white">₱{p.amount}</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Ref: {p.refNo}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1 rounded-full ${p.status === 'confirmed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-center py-10 text-slate-800 font-black uppercase italic text-[9px] tracking-widest">
                    No records found in Swifftnet database.
                  </p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* FOOTER POWERED BY */}
      <footer className="mt-12 text-center text-[8px] text-slate-800 font-black uppercase tracking-[0.6em] pb-10">
        SwifftNet Remote V3 • Enterprise Network Solution
      </footer>
    </div>
  );
}