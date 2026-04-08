import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Imports para sa Firebase Firestore functions na kailangan ng Admin
import { doc, updateDoc, deleteDoc, collection, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Imports para sa UI Icons (Inaakalang nasa src/components/Icons.jsx)
import { 
  IconShield, IconCard, IconTicket, IconHistory, 
  IconEdit, IconTelegram, IconGoogle, IconCheck, IconCopy 
} from '../components/Icons'; // I-adjust ang path kung iba ang folder structure mo

export default function AdminPanel({ 
  user,           // Ang kasalukuyang logged-in admin object
  payments,       // Listahan ng lahat ng payments mula sa master listener
  requests,       // Listahan ng lahat ng requests mula sa master listener
  tickets,        // Listahan ng lahat ng support tickets
  assignments,    // Listahan ng lahat ng VPN assignments/nodes
  promos,         // Listahan ng lahat ng active promo codes
  prices,         // Object na naglalaman ng vpnPrice, internetVpnPrice, promoPrice
  maint,           // <--- IDINAGDAG
  setMaint,        // <--- IDINAGDAG
  announcement,    // (Siguraduhin na nandito rin ito base sa code mo)
  setAnnouncement, // (Siguraduhin na nandito rin ito base sa code mo)
  db,             // Firebase Firestore database instance mula sa config
  appId,          // SwifftNet App ID constant
  base,           // Firestore base path array constant
  ADMIN_EMAIL,    // Ang email address mo (Ramos Howard Kingsley)
  setView,        // Function para maglipat ng view (e.g., pabalik sa dashboard)
  sendEmail,      // Function para mag-send ng email notifications (EmailJS)
  
  // Props para sa Support Ticket Conversation Modal (mula sa consolidated listeners sa App.js)
  activeTicket,    // Ang ticket object na kasalukuyang binabasa
  setActiveTicket, // Function para i-set ang active ticket o isara ang modal (null)
  messages,        // Listahan ng mga mensahe sa loob ng active ticket
  replyBody,       // State para sa input field ng reply
  setReplyBody     // Function para i-update ang replyBody state
}) {
  const navigate = useNavigate();
  // INTERNAL STATE: Para sa navigation tabs sa loob ng Admin Panel
  const [adminTab, setAdminTab] = useState('payments');

  // --- HELPER FUNCTIONS ---

  // Function para kalkulahin ang balanse ng partikular na client email
  const getUserBalance = (email) => {
    const deposits = payments
      .filter(p => p.email === email && p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const spent = requests
      .filter(r => r.email === email && r.type !== 'trial' && r.status !== 'denied')
      // Ginagamit ang price paid noong binili, o ang default vpnPrice kung renewal dati
      .reduce((sum, r) => sum + (r.pricePaid || prices.vpnPrice), 0); 
      
    return deposits - spent;
  };

  // Function para makakuha ng listahan ng lahat ng unique client emails
  const getAllClients = () => Array.from(new Set([...payments.map(p => p.email), ...requests.map(r => r.email)]));

  // --- ADMIN ACTION HANDLERS (Firestore Updates) ---

  // 1. Pag-approve o pag-deny ng payment (GCash deposit)
  const updatePaymentStatus = async (id, status, clientEmail) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id), { status });
      
      // Mag-send ng email notification sa client
      sendEmail(
        clientEmail, 
        status === 'confirmed' ? "Payment Confirmed ✅" : "Payment Denied ❌", 
        status === 'confirmed' ? "Your balance has been updated." : "We could not verify your reference number."
      );
      
      console.log(`Payment ${id} marked as ${status}`);
    } catch (err) {
      console.error("Error updating payment:", err);
      alert("Failed to update payment status.");
    }
  };

  // 2. Pag-authorize ng Node (Pag-assign ng VPN credentials at ports)
  const adminAssignTunnel = async (reqId, email, data, type, vpnId = null, category = 'remote') => {
    let finalExpiry = new Date();
    // Trial = 1 day, Paid = depende sa input ni admin
    const daysToAdd = type === 'trial' ? 1 : Number(data.days);

    try {
      // LOGIC: Check if this is a renewal and if the existing assignment exists
      if (type === 'renewal' && vpnId) {
        const existingAsgn = assignments.find(a => a.requestId === vpnId);
        
        if (existingAsgn) {
          // Kalkulahin ang bagong expiry: add sa current expiry kung active pa, o add sa date ngayon kung expired na.
          const currentExp = new Date(existingAsgn.expiry);
          const baseDate = currentExp > new Date() ? currentExp : new Date();
          baseDate.setDate(baseDate.getDate() + daysToAdd);
          finalExpiry = baseDate;

          // UPDATE existing assignment document
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', existingAsgn.id), {
            expiry: finalExpiry.toISOString(),
            expiryNotified: false, // Reset notification status
            // Siguraduhing updated ang details kung binago ni Admin
            user: data.u,
            pass: data.p,
            port: data.port,
            portAux: data.portAux
          });
        }
      } else {
        // NEW or TRIAL logic: Gumawa ng bagong document sa Firestore
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

      // Markahan ang request bilang assigned
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
    } catch (err) {
      console.error("Assignment Error:", err);
      alert("Failed to assign tunnel: " + err.message);
    }
  };

  // 3. Pag-reply ng Admin sa Support Ticket
  const handleAdminReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || !activeTicket) return;

    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id);
      
      // 1. Add Message to Subcollection
      await addDoc(collection(ticketRef, 'messages'), {
        sender: user.email, // Admin email
        clientEmail: activeTicket.clientEmail,
        text: replyBody,
        timestamp: serverTimestamp() // Importante para sa sorting
      });

      // 2. Update Main Ticket Document
      await updateDoc(ticketRef, {
        lastUpdate: serverTimestamp(),
        status: 'answered' // I-set ang status para malaman ng client na may reply ka
      });

      // 3. Email Notification sa Client
      sendEmail(activeTicket.clientEmail, `New Reply: ${activeTicket.subject}`, replyBody, activeTicket.id);
      
      setReplyBody(""); // Clear input field
    } catch (err) {
      console.error("Reply Error:", err);
      alert(`Failed to send reply: ${err.message}`);
    }
  };

  // 4. Pagbago ng Global Pricing Settings
  const updateSystemPrices = async (v, i, p) => {
    try {
      const sRef = doc(db, ...base, 'settings', 'prices');
      await updateDoc(sRef, {
        vpnPrice: Number(v),
        internetVpnPrice: Number(i),
        promoPrice: Number(p)
      });
      alert("Prices Updated Globally! 🚀");
    } catch (err) {
      // Kung first time at wala pang document sa Firestore, gumawa ng bago (SetDoc)
      await setDoc(doc(db, ...base, 'settings', 'prices'), {
        vpnPrice: Number(v),
        internetVpnPrice: Number(i),
        promoPrice: Number(p)
      });
      alert("System Initialized & Prices Saved!");
    }
  };

  // 5. Pag-manage ng Promo Codes
  const createPromoCode = async (code) => {
    if(!code) return;
    try {
      await addDoc(collection(db, ...base, 'promos'), { 
        code: code.toUpperCase() 
      });
      console.log(`Promo ${code} created.`);
    } catch (err) { console.error("Promo Error:", err); }
  };

  const deletePromoCode = async (id) => {
    if(!window.confirm("Delete this promo code?")) return;
    try {
      await deleteDoc(doc(db, ...base, 'promos', id));
      console.log(`Promo ${id} deleted.`);
    } catch (err) { console.error("Promo Delete Error:", err); }
  };

  const resendActivationEmail = (asgn) => {
    sendEmail(
      asgn.clientEmail, 
      "SwifftNet: Port Activation Resent 🚀", 
      `Your ports: Winbox ${asgn.port}, Secondary ${asgn.portAux}`
    );
    alert(`Activation resent to ${asgn.clientEmail}`);
  };

  const saveAnnouncement = async (data) => await setDoc(doc(db, ...base, 'settings', 'announcement'), data, { merge: true });

  // --- RENDERING ADMIN UI ---
  // Siguraduhing ang user ay ikaw (Admin) bago i-render ang buong page
  if (!user || user.email !== ADMIN_EMAIL) return <div className="p-10 text-red-500 font-black uppercase text-center">ACCESS DENIED - AUTHORIZED ADMIN ONLY</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
        
        {/* ADMIN HEADER & NAVIGATION */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-slate-900 pb-12">
          <h1 className="text-4xl font-black uppercase italic">Admin <span className="text-blue-500">Terminal</span></h1>
          <div className="flex bg-slate-900 p-2 rounded-[30px] border border-slate-800 shadow-2xl overflow-x-auto custom-scrollbar">
            {['payments', 'requests', 'tickets', 'clients', 'promos', 'settings'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setAdminTab(tab)} 
                className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase transition-all whitespace-nowrap ${adminTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600'}`}>
                {tab}
              </button>
            ))}
            {/* Button para bumalik sa Client Dashboard view para makita ang generated scripts */}
           <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 transition-all">DASHBOARD VIEW</button>
          </div>
        </header>

        {/* --- TAB CONTENT: PAYMENTS --- */}
        {adminTab === 'payments' && (
          <div className="grid md:grid-cols-3 gap-10">
            {/* I-filter para ipakita lang ang pending deposits */}
            {payments.filter(p => p.status === 'pending').length === 0 && (
              <p className="text-[11px] text-slate-600 uppercase font-black italic text-center col-span-3 py-10">No pending payments.</p>
            )}
            {payments.filter(p => p.status === 'pending').map(p => (
              <div key={p.id} className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-8 animate-in zoom-in-95">
                <p className="font-black text-blue-400 text-sm truncate italic">{p.email}</p>
                <div className="bg-black/40 p-8 rounded-[30px] text-center border border-slate-800">
                  <p className="text-4xl font-black mb-2">₱{p.amount}</p>
                  <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase">REF: {p.refNo}</p>
                  {p.date?.seconds && <p className="text-[8px] text-slate-700 mt-2 font-mono">{new Date(p.date.seconds * 1000).toLocaleString()}</p>}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => updatePaymentStatus(p.id, 'confirmed', p.email)} className="flex-1 bg-emerald-600 py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-emerald-500 transition-all">APPROVE</button>
                  <button onClick={() => updatePaymentStatus(p.id, 'denied', p.email)} className="flex-1 bg-red-600/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">DENY</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB CONTENT: REQUESTS --- */}
        {adminTab === 'requests' && (
          <div className="grid md:grid-cols-2 gap-12">
            {/* I-filter para ipakita lang ang pending requests (New, Trial, Renewal) */}
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-[11px] text-slate-600 uppercase font-black italic text-center col-span-2 py-10">No pending requests.</p>
            )}
            {requests.filter(r => r.status === 'pending').map(r => (
              <div key={r.id} className="bg-slate-900 p-12 rounded-[60px] border border-slate-800 shadow-2xl space-y-8 animate-in slide-in-from-left-4 relative">
                
                {/* Badge para sa Request Type */}
                <span className={`absolute top-8 right-8 px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${r.type === 'trial' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : r.type === 'renewal' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-blue-500/10 text-blue-500 border-blue-500/30'}`}>
                  {(r.type || 'new').toUpperCase()} REQUEST
                </span>

                <p className="font-black text-white text-lg truncate uppercase border-b border-slate-800 pb-6 pr-20">{r.email}</p>
                
                {/* Admin Assignment Form */}
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  const fd = new FormData(e.target); 
                  adminAssignTunnel(r.id, r.email, { 
                    days: fd.get('d'), // Inputted days
                    u: fd.get('u'),    // VPN User
                    p: fd.get('p'),    // VPN Pass
                    port: fd.get('port'), // Port 1
                    portAux: fd.get('portAux'), // Port 2
                    service: r.service || 'winbox' // Default service
                  }, r.type, r.vpnId, r.category); // Pass important request metadata
                }} className="space-y-6">
                  
                  {/* Days input: Default values base sa request type at category */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Subscription Days</label>
                    <input name="d" type="number" defaultValue={r.type === 'trial' ? "1" : (r.category === 'internet' ? "30" : "365")} className="w-full bg-slate-950 p-5 rounded-2xl text-center font-black border border-slate-800 outline-none text-emerald-500 focus:border-emerald-500" />
                  </div>

                  {/* VPN Credentials */}
                  <div className="grid grid-cols-2 gap-4">
                    <input name="u" placeholder="Generate VPN User" required className="bg-slate-950 p-5 rounded-2xl font-black w-full border border-slate-800 outline-none focus:border-blue-500" />
                    <input name="p" placeholder="Generate VPN Pass" required className="bg-slate-950 p-5 rounded-2xl font-black w-full border border-slate-800 outline-none focus:border-blue-500" />
                  </div>
                  
                  {/* Port Assignments */}
                  <div className="grid grid-cols-2 gap-4">
                    <input name="port" placeholder="Assigned Port 1 (Winbox)" required className="bg-slate-950 p-5 rounded-2xl font-black w-full text-center text-emerald-400 outline-none border border-slate-800 focus:border-emerald-500" />
                    <input name="portAux" placeholder="Assigned Port 2 (SSH/API)" className="bg-slate-950 p-5 rounded-2xl font-black w-full text-center text-blue-400 outline-none border border-slate-800 focus:border-blue-500" />
                  </div>

                  {/* Submit Button */}
                  <button className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-xs shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
                    <IconShield /> AUTHORIZE & DEPLOY NODE
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB CONTENT: TICKETS --- */}
        {adminTab === 'tickets' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Listahan ng Open at Answered Tickets, sorted by last update */}
            {tickets.filter(t => t.status !== 'closed').sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate)).length === 0 && (
              <p className="text-[11px] text-slate-600 uppercase font-black italic text-center col-span-3 py-10">No active support tickets.</p>
            )}
            {tickets.filter(t => t.status !== 'closed').sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate)).map(t => (
              <div key={t.id} onClick={() => setActiveTicket(t)} className={`bg-slate-900 p-8 rounded-[40px] border border-slate-800 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden group ${t.status === 'open' ? 'border-l-4 border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-l-4 border-l-emerald-500'}`}>
                <p className="text-[10px] font-black text-blue-500 mb-2 truncate uppercase tracking-widest">{t.clientEmail}</p>
                <p className="text-sm font-black uppercase mb-4 truncate italic">{t.subject}</p>
                <div className="flex justify-between items-center text-[9px] font-black text-slate-500">
                  {/* Ipakita lang ang oras kung ngayong araw */}
                  <span>LAST: {new Date(t.lastUpdate).toLocaleTimeString()}</span>
                  <span className={t.status === 'open' ? 'text-red-500 animate-pulse' : 'text-emerald-500'}>{(t.status || 'open').toUpperCase()}</span>
                </div>
                <button className="bg-blue-600 w-full py-3 rounded-2xl text-[10px] font-black uppercase mt-6 group-hover:bg-blue-500 transition-colors">Open Conversation</button>
              </div>
            ))}
            
            {/* SUPPORT CONVERSATION MODAL (FIXED OVERLAY) */}
            {activeTicket && (
              <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 md:p-10 z-[100] animate-in fade-in duration-300">
                <div className="bg-slate-900 w-full max-w-3xl h-[90vh] rounded-[50px] border border-slate-800 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.2)]">
                  
                  {/* Modal Header */}
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Support Case: {(activeTicket.id?.slice(-6) || 'N/A').toUpperCase()}</p>
                      <h2 className="font-black uppercase tracking-tight text-lg italic">{activeTicket.subject}</h2>
                      <p className="text-[9px] text-slate-500 font-bold">{activeTicket.clientEmail}</p>
                    </div>
                    <div className="flex gap-4">
                      {/* Button para isara (resolbahin) ang ticket */}
                      <button onClick={async () => { 
                        if (window.confirm("Mark this ticket as CLOSED/RESOLVED? Client will be notified.")) { 
                          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', activeTicket.id), { status: 'closed', lastUpdate: new Date().toISOString() }); 
                          sendEmail(activeTicket.clientEmail, "Ticket Closed ✅", `Your support ticket regarding "${activeTicket.subject}" has been marked as resolved.`); 
                          setActiveTicket(null); 
                        } 
                      }} className="px-6 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all">Close Ticket</button>
                      
                      {/* Button para isara ang modal lang */}
                      <button onClick={() => setActiveTicket(null)} className="text-xs font-black text-slate-500 uppercase px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700">Back</button>
                    </div>
                  </div>

                  {/* Modal Messages Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] custom-scrollbar">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === user.email ? 'items-end' : 'items-start'}`}>
                        {/* Bubble styling base sa sender */}
                        <div className={`p-5 rounded-[2rem] max-w-[85%] text-sm font-medium shadow-xl ${m.sender === user.email ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{m.text}</div>
                        <p className="text-[8px] mt-2 opacity-40 uppercase font-black tracking-widest px-2">{m.sender === user.email ? 'Admin (You)' : 'Client Response'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Modal Reply Form (Sticky at bottom) */}
                  <form onSubmit={handleAdminReply} className="p-8 bg-slate-950 border-t border-slate-800 flex gap-4">
                    <input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Type your official response..." className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] outline-none font-bold text-sm focus:border-blue-500 transition-all" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 rounded-[2.5rem] font-black uppercase text-xs shadow-lg transition-all flex items-center gap-2">Send Reply <IconTelegram /></button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: PROMOS --- */}
        {adminTab === 'promos' && (
          <div className="max-w-md mx-auto space-y-8">
            {/* Promo Creator Form */}
            <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-sm font-black uppercase mb-6 text-blue-500 italic flex items-center gap-3"><IconCard /> Reseller Promo Manager</h2>
              <form onSubmit={(e) => { e.preventDefault(); createPromoCode(e.target.promo.value); e.target.reset(); }} className="flex gap-4">
                <input name="promo" placeholder="Enter Code (e.g. SAVE150)" className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black text-sm focus:border-blue-500 transition-all" />
                <button className="bg-blue-600 px-6 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-blue-500 transition-all">Add</button>
              </form>
            </div>
            {/* Listahan ng Promo Codes */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {promos.length === 0 && (
                <p className="text-[11px] text-slate-600 uppercase font-black italic text-center py-10">No active promo codes.</p>
              )}
              {promos.map(p => (
                <div key={p.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all shadow-lg">
                  <span className="font-black text-emerald-500 tracking-widest uppercase font-mono">{p.code}</span>
                  <button onClick={() => deletePromoCode(p.id)} className="text-red-500 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: CLIENTS MASTERLIST --- */}
        {adminTab === 'clients' && (
          <div className="bg-slate-900 rounded-[60px] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-800/50 text-[11px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                <tr>
                  <th className="p-10">Client Profile</th>
                  <th className="p-10 text-center">Net Balance</th>
                  <th className="p-10">Network Nodes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {getAllClients().length === 0 && (
                  <tr><td colSpan="3" className="p-20 text-center text-slate-600 uppercase font-black italic text-[11px]">No client data available.</td></tr>
                )}
                {getAllClients().map(email => (
                  <tr key={email} className="hover:bg-slate-800/20 transition-all group">
                    {/* Column 1: Profile */}
                    <td className="p-10 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white italic truncate max-w-[350px] text-sm group-hover:text-blue-400 transition-colors">{email}</span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Verified SwifftNet User</span>
                      </div>
                    </td>
                    {/* Column 2: Balance */}
                    <td className="p-10 text-center align-top">
                      <div className="bg-slate-950/50 inline-block px-6 py-3 rounded-2xl border border-slate-800 shadow-inner">
                        <p className="text-2xl font-black text-emerald-500">₱{getUserBalance(email)}</p>
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Credits</p>
                      </div>
                    </td>
                    {/* Column 3: Active Nodes (Assignments) */}
                    <td className="p-10 align-top">
                      <div className="space-y-4">
                        {assignments.filter(a => a.clientEmail === email).length > 0 ? (
                          assignments.filter(a => a.clientEmail === email).map((t, i) => (
                            <div key={i} className={`bg-slate-950 p-5 rounded-3xl border transition-all relative group/node min-w-[300px] shadow-lg ${t.isOnline ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-slate-800 hover:border-slate-700'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col gap-1 pr-4 border-r border-slate-800">
                                  <span className="text-blue-400 font-mono text-[11px] font-black uppercase leading-none">W: <span className="text-white">{t.port}</span></span>
                                  <span className="text-blue-600 font-mono text-[11px] font-black uppercase mt-1">S: <span className="text-white">{t.portAux || 'N/A'}</span></span>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                  <span className={`text-[9px] font-black uppercase ${t.isOnline ? 'text-emerald-500' : 'text-slate-600'}`}>{t.isOnline ? 'Online' : 'Offline'}</span>
                                  <div className={`w-2 h-2 rounded-full ${t.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-700'}`} />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                                <span className={`font-mono text-[9px] font-black italic uppercase ${new Date() > new Date(t.expiry) ? 'text-red-500' : 'text-slate-600'}`}>Exp: {new Date(t.expiry).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover/node:opacity-100 transition-opacity">
                                  {/* Quick Actions para sa Admin */}
                                  <button onClick={() => resendActivationEmail(t)} className="bg-blue-600/10 text-blue-500 text-[8px] font-black px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">RESEND</button>
                                  <button onClick={async () => { if (window.confirm(`Terminate node on port ${t.port} for ${email}?`)) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assignments', t.id)); }} className="bg-red-500/10 text-red-500 text-[8px] font-black px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">DELETE</button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 font-black uppercase italic tracking-wider">No Active Nodes</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB CONTENT: SETTINGS (Pricing) --- */}
        {adminTab === 'settings' && (
          <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-[50px] border border-slate-800 space-y-8 animate-in zoom-in-95 shadow-2xl">
            <div className="text-center">
              <IconEdit />
              <h2 className="text-lg font-black uppercase text-blue-500 italic mt-3">Core Pricing</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Global System Configuration</p>
            </div>
            
            {/* Pricing Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              // I-pass ang mga inputted values sa handler
              updateSystemPrices(e.target.vpn.value, e.target.internet.value, e.target.promo.value);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Remote Access (Yearly Price)</label>
                <input name="vpn" type="number" defaultValue={prices.vpnPrice} className="w-full bg-slate-950 p-5 rounded-2xl font-black border border-slate-800 outline-none text-emerald-500 focus:border-emerald-500 transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Internet VPN (Monthly Price)</label>
                <input name="internet" type="number" defaultValue={prices.internetVpnPrice} className="w-full bg-slate-950 p-5 rounded-2xl font-black border border-slate-800 outline-none text-blue-500 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-4">Reseller Promo Price (saving code)</label>
                <input name="promo" type="number" defaultValue={prices.promoPrice} className="w-full bg-slate-950 p-5 rounded-2xl font-black border border-slate-800 outline-none text-orange-500 focus:border-orange-500 transition-all" />
              </div>

              <button className="w-full bg-blue-600 py-6 rounded-[30px] font-black uppercase text-xs shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <IconCheck /> Save Pricing Changes
              </button>
            </form>
            // UI para sa Admin (Simple Controls):
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-blue-500 font-black uppercase text-[10px] tracking-widest">Global Announcement</h3>
              <textarea 
                className="w-full bg-slate-950 p-4 rounded-xl text-xs font-bold text-white outline-none border border-slate-800 focus:border-blue-500"
                placeholder="Type your announcement here..."
                value={announcement.text}
                onChange={(e) => setAnnouncement({...announcement, text: e.target.value})}
              />
              <div className="flex gap-4">
                <button onClick={() => saveAnnouncement({ ...announcement, isActive: !announcement.isActive })} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] ${announcement.isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  {announcement.isActive ? "Turn Off Banner" : "Go Live"}
                </button>
                <button onClick={() => saveAnnouncement(announcement)} className="bg-blue-600 px-8 py-3 rounded-xl font-black uppercase text-[10px]">Update Message</button>
              </div>
            </div>

            {/* --- MAINTENANCE LOCKDOWN CARD --- */}
            <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl mt-8 border-t-4 border-t-orange-600">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-orange-500">
                  <h2 className="text-sm font-black uppercase italic tracking-widest">System Lockdown</h2>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${maint.isActive ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                  {maint.isActive ? 'SYSTEM DOWN' : 'SYSTEM LIVE'}
                </div>
              </div>

              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none px-2">Lockdown Message</p>
              
              <textarea 
                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-[2rem] outline-none focus:border-orange-500 font-bold text-xs text-white min-h-[120px] resize-none transition-all"
                placeholder="Write the reason for maintenance (e.g., Server Node Optimization)..."
                value={maint.message}
                onChange={(e) => setMaint({...maint, message: e.target.value})}
              />

              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      const mRef = doc(db, ...base, 'settings', 'maintenance');
                      await setDoc(mRef, { ...maint, isActive: !maint.isActive }, { merge: true });
                      alert(`SYSTEM ${!maint.isActive ? 'LOCKED' : 'UNLOCKED'} SUCCESSFULY!`);
                    } catch (err) { alert("Error: " + err.message); }
                  }}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all ${maint.isActive ? 'bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/20' : 'bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/20'}`}
                >
                  {maint.isActive ? 'STOP MAINTENANCE' : 'ACTIVATE MAINTENANCE'}
                </button>
                
                <button 
                  onClick={async () => {
                    const mRef = doc(db, ...base, 'settings', 'maintenance');
                    await setDoc(mRef, { message: maint.message }, { merge: true });
                    alert("Maintenance Message Updated!");
                  }}
                  className="w-full py-4 rounded-[2rem] font-black uppercase text-[9px] tracking-widest text-slate-500 border border-slate-800 hover:bg-slate-800 transition-all"
                >
                  Update Message Only
                </button>
              </div>

              <p className="text-[8px] text-slate-700 text-center font-black uppercase italic leading-tight">
                Note: Activating this will block all clients immediately.<br/>Admin access remains unrestricted.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}