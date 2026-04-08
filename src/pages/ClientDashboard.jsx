import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AnnouncementBanner from '../components/AnnouncementBanner';
import NetworkToolbox from '../components/NetworkToolbox';
import NetworkUtils from '../components/NetworkUtils';

// Imports para sa UI Icons (Inaakalang nasa src/components/Icons.jsx)
import { 
  IconShield, IconCard, IconTelegram, IconTicket, 
  IconHistory, IconCopy, IconCheck 
} from '../components/Icons';

export default function ClientDashboard({ 
  user,           // Current logged-in user
  payments,       // Synced payments (filtered to user in App.js or here)
  requests,       // Synced requests
  tickets,        // Synced tickets
  assignments,    // Synced VPN assignments
  promos,         // Available promo codes
  prices,         // Global prices { vpnPrice, internetVpnPrice, promoPrice }
  db,             // Firestore instance
  appId,          // App ID constant
  base,           // Base path array
  ADMIN_EMAIL,    // Your admin email
  handleLogout,   // Logout function
  openSupport,    // Intergram opener
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
  const [vpnProtocol, setVpnProtocol] = useState("l2tp");
  const [promoInput, setPromoInput] = useState("");
  const [isPromoValid, setIsPromoValid] = useState(false);
  const [clientNote, setClientNote] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [copiedId, setCopiedId] = useState(null);

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
    const newName = prompt("Enter a nickname for this node (e.g. Office Router, Home Lab):", currentName || "");
    if (newName === null) return; // Cancelled
    
    try {
      const nodeRef = doc(db, 'artifacts', appId, 'public', 'data', 'assignments', id);
      await updateDoc(nodeRef, { nickname: newName });
      // Automatic na mag-u-update ang UI dahil sa onSnapshot listener sa App.jsx
    } catch (err) {
      alert("Error updating nickname: " + err.message);
    }
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      {/* 1. ANNOUNCEMENT BANNER - GLOBAL BROADCAST */}
      <AnnouncementBanner announcement={announcement} />
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-slate-800 gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-black text-2xl uppercase border-4 border-blue-600 shadow-lg">{user.name[0]}</div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none">{user.name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={openSupport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase"><IconTelegram /> Support</button>
            {user.role === 'admin' && <button onClick={() => navigate('/admin')} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-all">Admin Terminal</button>}
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-slate-800 hover:bg-red-600 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase">Sign Out</button>
          </div>
        </header>

        {/* TOP STATS & BUY SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[40px] text-center shadow-xl">
            <p className="text-blue-400 text-[10px] font-black uppercase mb-2">My Balance</p>
            <p className="text-5xl font-black">₱{bal}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] text-center shadow-xl">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-2">{serviceCategory === 'remote' ? 'Remote Access' : 'Internet VPN'}</p>
            <p className="text-4xl font-black text-emerald-500">₱{currentPrice}</p>
            <p className="text-[9px] text-slate-600 font-black uppercase mt-2 italic">{serviceCategory === 'remote' ? 'Per Node / Year' : 'Per Account / Month'}</p>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-[40px] flex flex-col justify-center gap-6 shadow-xl">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button onClick={() => setServiceCategory('remote')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${serviceCategory === 'remote' ? 'bg-blue-600' : 'text-slate-600'}`}>Remote Access</button>
              <button onClick={() => setServiceCategory('internet')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${serviceCategory === 'internet' ? 'bg-emerald-600' : 'text-slate-600'}`}>Internet VPN</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={requestService} onChange={(e)=>setRequestService(e.target.value)} className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-[10px] font-black uppercase text-blue-400 outline-none">
                <option value="winbox">Winbox</option>
                {serviceCategory === 'internet' && <option value="internet">Internet</option>}
                <option value="api">API</option>
                <option value="ssh">SSH</option>
              </select>
              <select value={vpnProtocol} onChange={(e)=>setVpnProtocol(e.target.value)} className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-[10px] font-black uppercase text-emerald-400">
                <option value="l2tp">L2TP</option>
                <option value="sstp">SSTP</option>
              </select>
              <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input value={promoInput} onChange={(e)=>setPromoInput(e.target.value)} placeholder="PROMO?" className="bg-transparent px-3 outline-none text-[10px] font-black w-full" />
                <button onClick={validatePromo} className="bg-slate-800 px-4 py-2 rounded-lg text-[8px] font-black">Apply</button>
              </div>
              <button onClick={()=>handleVpnRequest()} disabled={!canAfford} className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all ${canAfford ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                {canAfford ? 'Buy Now' : 'Refill Balance'}
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: INSTANCES & SIDEBAR */}
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT: ACTIVE NODES */}
          <div className="lg:col-span-2 space-y-10">
            <NetworkUtils />
            <NetworkToolbox />
            <h2 className="text-xl font-black flex items-center gap-4 text-blue-400 uppercase italic font-mono"><IconShield /> Remote Instances</h2>
            
            {assignments.length === 0 && (
              <div className="bg-slate-900/50 p-20 rounded-[50px] border border-dashed border-slate-800 text-center">
                <p className="text-slate-600 font-black uppercase italic text-xs">No active nodes found. Purchase a node to get started.</p>
                <button onClick={handleTrialRequest} className="mt-6 text-blue-500 text-[10px] font-black uppercase underline">Request Free 24h Trial</button>
              </div>
            )}

            {assignments.map((asgn) => {
                const isExpired = new Date() > new Date(asgn.expiry);

                // --- COMPLETE MIKROTIK SCRIPT LOGIC (RESTORING ORIGINAL) ---
                const script = (() => {
                    const protocol = asgn.protocol || 'l2tp';
                    const isInternet = asgn.category === 'internet' || (asgn.service && asgn.service === 'internet'); 
                    const interfaceName = `SwifftNet-${isInternet ? 'Internet' : 'Remote'}`;

                    // 1. BASE TUNNEL SCRIPT
                    let baseScript = protocol === 'l2tp' 
                    ? `/interface l2tp-client add connect-to=remote.swifftnet.site name=${interfaceName} user=${asgn.user} password=${asgn.pass} use-ipsec=yes`
                    : `/interface sstp-client add connect-to=remote.swifftnet.site name=${interfaceName} user=${asgn.user} password=${asgn.pass} profile=default-encryption`;

                    if (isInternet) {
                    // 2. INTERNET VPN ADD-ONS (Monthly Service)
                    return `${baseScript}
                /ip route add dst-address=0.0.0.0/0 gateway=${interfaceName} distance=1 check-gateway=ping
                /ip firewall nat add chain=srcnat out-interface=${interfaceName} action=masquerade comment="SwifftNet VPN Internet"`;
                    } else {
                    // 3. REMOTE ACCESS ADD-ONS (Yearly Service + Security)
                    return `${baseScript}
                /ip firewall filter add action=accept chain=input comment="SwifftNet Remote" src-address=192.168.88.0/21
                /ip firewall filter add action=accept chain=input comment="Allow SwifftNet Top" place-before=0 src-address=192.168.88.0/21
                /ip firewall filter add action=accept chain=forward comment="Allow SwifftNet Fwd" place-before=0 src-address=192.168.88.0/21
                /ip service
                set winbox address=192.168.88.0/21
                set api address=192.168.88.0/21
                set ssh address=192.168.88.0/21`;
                    }
                })();

              return (
                <div key={asgn.id} className={`bg-slate-900 rounded-[50px] border shadow-2xl mb-8 animate-in slide-in-from-left-4 ${isExpired ? 'border-red-500/50 opacity-80' : 'border-slate-800'}`}>
                  <div className="px-12 py-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-800 rounded-t-[50px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${asgn.isOnline ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse' : 'bg-slate-600'}`} />
                      <span onClick={() => updateNickname(asgn.id, asgn.nickname)} className="text-sm font-black text-white uppercase italic cursor-pointer hover:text-blue-400 transition-colors">{asgn.nickname || "Set Nickname +"}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isExpired ? 'EXPIRED' : asgn.isOnline ? 'CONNECTED' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="p-12 space-y-8">
                    <div className="grid grid-cols-2 gap-4 bg-black/40 p-5 rounded-[28px] border border-slate-800/50">
                      <div className="flex flex-col gap-1 px-4 border-r border-slate-800">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Status</span>
                        <span className="text-[11px] font-black text-white">{asgn.isOnline ? 'Active Tunnels' : 'Waiting for Ping'}</span>
                      </div>
                      <div className="flex flex-col gap-1 px-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Expiration</span>
                        <span className={`text-[11px] font-black ${isExpired ? 'text-red-500' : 'text-blue-400'}`}>{new Date(asgn.expiry).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {!isExpired && (
                      <>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl flex items-center justify-between gap-4">
                          <code className="bg-black/40 text-white font-mono text-xs px-3 py-1.5 rounded-xl">remote.swifftnet.site:{asgn.port}</code>
                          <button onClick={() => handleCopy(`remote.swifftnet.site:${asgn.port}`, asgn.id)} className="bg-emerald-600 p-2.5 rounded-xl"><IconCopy /></button>
                        </div>
                        <div className="bg-black/60 p-8 rounded-[32px] border border-slate-800 font-mono text-sm text-slate-400 space-y-2">
                          <div className="flex justify-between"><span>User</span> <span className="text-white font-black">{asgn.user}</span></div>
                          <div className="flex justify-between"><span>Pass</span> <span className="text-white font-black">{asgn.pass}</span></div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-blue-400 uppercase italic">MikroTik Script:</p>
                          <div className="bg-black/80 p-6 rounded-3xl border border-slate-800 font-mono text-[10px] text-slate-500 relative">
                            <pre className="whitespace-pre-wrap">{script}</pre>
                            <button onClick={() => handleCopy(script, `s-${asgn.id}`)} className="absolute right-4 top-4 bg-slate-800 p-2 rounded-lg"><IconCopy /></button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* PROGRESS BAR LOGIC */}
                    <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800/50">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          ((new Date(asgn.expiry).getTime() - new Date().getTime()) / (365 * 24 * 60 * 60 * 1000)) * 100 < 15 
                          ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' 
                          : 'bg-blue-500'
                        }`} 
                        style={{ width: `${Math.max(0, Math.min(100, ((new Date(asgn.expiry).getTime() - new Date().getTime()) / (365 * 24 * 60 * 60 * 1000)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="space-y-12">
            {/* SUPPORT TICKETS */}
            <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
              <h2 className="text-lg font-black flex items-center gap-3 text-emerald-400 uppercase italic"><IconTicket /> Tickets</h2>
              <form onSubmit={createTicket} className="space-y-3">
                <input value={ticketSubject} onChange={e=>setTicketSubject(e.target.value)} placeholder="Topic: e.g. Port help..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none text-xs font-bold" />
                <button className="w-full bg-blue-600 py-3 rounded-2xl font-black uppercase text-[10px]">Open Ticket</button>
              </form>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {tickets.map(t => (
                  <div key={t.id} onClick={()=>setActiveTicket(t)} className={`bg-slate-950 p-4 rounded-2xl border border-slate-800 cursor-pointer hover:border-blue-500 transition-all ${t.status === 'answered' ? 'border-emerald-500' : ''}`}>
                    <p className="text-[10px] font-black uppercase mb-1 truncate">{t.subject}</p>
                    <div className="flex justify-between text-[7px] font-black">
                      <span className={t.status === 'open' ? 'text-orange-500' : 'text-emerald-500'}>{(t.status || 'open').toUpperCase()}</span>
                      <span className="text-slate-600">{new Date(t.lastUpdate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900/50 p-8 rounded-[40px] border border-blue-500/20 space-y-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform"><IconShield /></div>
              <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic">Affiliate Program</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Earn 10% credits for every successful referral.</p>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={`${window.location.origin}/login?ref=${user.uid}`} 
                  className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-[8px] font-mono text-slate-500 outline-none"
                />
                <button 
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/login?ref=${user.uid}`); alert("Link Copied!"); }}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl text-[8px] font-black uppercase transition-all shadow-lg shadow-blue-600/20"
                >
                  Copy
                </button>
              </div>
            </section>

            {/* GCASH REFILL */}
            <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
              <h2 className="text-lg font-black flex items-center gap-3 text-emerald-400 uppercase italic"><IconCard /> GCASH Refill</h2>
              <div className="bg-slate-950 p-4 rounded-2xl border border-dashed border-slate-800 text-center">
                <p className="text-xl font-black text-blue-500 font-mono">0968 385 9759</p>
                <p className="text-[8px] text-slate-600 font-black uppercase mt-1">Howard Kingsley Ramos</p>
              </div>
              <form onSubmit={submitDeposit} className="space-y-4">
                <input name="amount" type="number" placeholder="₱ Amount" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black text-sm" />
                <input name="ref" placeholder="G-Ref Number" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black text-sm uppercase" />
                <button className="w-full bg-emerald-600 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Submit Deposit</button>
              </form>
            </section>

            {/* HISTORY */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 px-4">
                <IconHistory /> <span className="text-[9px] font-black uppercase tracking-widest italic">Transaction History</span>
              </div>
              <div className="bg-slate-900 p-6 rounded-[40px] border border-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                {payments.map(p => (
                  <div key={p.id} className="bg-black/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs font-black">₱{p.amount}</p>
                      <p className="text-[7px] text-slate-600 font-bold">Ref: {p.refNo}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase ${p.status === 'confirmed' ? 'text-emerald-500' : 'text-orange-500'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}