import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, addDoc, query, onSnapshot, doc, updateDoc, 
  serverTimestamp, deleteDoc, arrayUnion, setDoc, getDoc, 
  orderBy, limit, writeBatch 
} from 'firebase/firestore';
import { 
  IconCard, IconHistory, IconCheck, IconSearch, 
  IconCopy, IconEdit, IconDownload, IconShield 
} from '../components/Icons';

export default function BillingSystem({ user, db, bal, appId, prices, base }) {
  // --- STATES ---
  const [customers, setCustomers] = useState([]);
  const [notices, setNotices] = useState([]); 
  const [collections, setCollections] = useState([]); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  
  // SETTINGS STATES
  const [paymentInfo, setPaymentInfo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [wispName, setWispName] = useState("");
  const [wispLogo, setWispLogo] = useState("");

  // --- FEATURE: ACCESS SYNC ---
  const hasAccess = useMemo(() => {
    if (!user?.billingAccessUntil) return false;
    const expiry = liveUser.billingAccessUntil.toDate ? liveUser.billingAccessUntil.toDate() : new Date(liveUser.billingAccessUntil);
    return expiry > new Date();
  }, [user?.billingAccessUntil]);

  // --- 1. MASTER LISTENERS ---
  useEffect(() => {
    if (!hasAccess) return;

    const unsubCustomers = onSnapshot(query(collection(db, 'billing_systems', user.uid, 'customers')), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubNotices = onSnapshot(query(collection(db, 'billing_systems', user.uid, 'notices')), (snap) => {
      setNotices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCollections = onSnapshot(query(collection(db, 'billing_systems', user.uid, 'collections'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
        setCollections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // PROFILE LISTENER (Para sa Activation & Balance Sync)
    const userRef = doc(db, 'users', user.email); // Ginagamit ang EMAIL bilang ID
    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setLiveUser({ ...user, ...snap.data() });
    });

    // Isama sa return para mag-unsubscribe
    return () => { unsubCustomers(); unsubNotices(); unsubCollections(); unsubProfile(); };

    const fetchSettings = async () => {
        const sDoc = await getDoc(doc(db, 'billing_systems', user.uid));
        if (sDoc.exists()) {
          setPaymentInfo(sDoc.data().paymentInstructions || "");
          setPrimaryColor(sDoc.data().primaryColor || "#10b981");
          setWispName(sDoc.data().wispName || ""); // <--- ADD THIS
          setWispLogo(sDoc.data().wispLogo || ""); // <--- ADD THIS
        }
    };
    fetchSettings();

    return () => { unsubCustomers(); unsubNotices(); unsubCollections(); };
  }, [hasAccess, user.uid, db]);

  // --- 2. LOGIC ---
  const getCustomerStatus = (client) => {
    const today = new Date();
    const currentMonthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
    if (client.lastPaidMonth === currentMonthYear) return 'paid';
    if (today.getDate() > Number(client.dueDate)) return 'overdue';
    return 'pending';
  };

  const totalExpected = customers.reduce((sum, c) => sum + Number(c.monthlyFee), 0);
  const totalPaidThisMonth = customers.filter(c => getCustomerStatus(c) === 'paid').reduce((sum, c) => sum + Number(c.monthlyFee), 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaidThisMonth / totalExpected) * 100) : 0;
  const lifetimeIncome = collections.reduce((sum, log) => sum + Number(log.amount), 0);

  // --- 3. CORE HANDLERS ---

  const handleUnlock = async () => {
    const dynamicPrice = Number(prices?.billing_system_license || 150); 
    const currentBal = Number(bal); // Siguraduhin na number ang balance
    const currentBal = Number(user?.credits || 0);

    if (currentBal < dynamicPrice) return alert(`Insufficient balance! Needs ₱${dynamicPrice}`);

    if (window.confirm(`Deduct ₱${dynamicPrice} from credits to unlock Billing for 30 days?`)) {
        setLoading(true);
        try {
            // FIX: Gamitin ang user.email bilang ID ng document
            const userRef = doc(db, 'users', user.email); 
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            await setDoc(userRef, { 
                billingAccessUntil: expiryDate,
                // Optional: Kung gusto mo ring bawasan ang static credit field
                credits: Number(currentBal) - Number(dynamicPrice) 
            }, { merge: true });

            // Mag-record ng payment request para ma-track sa history
            await addDoc(collection(db, 'artifacts', appId || 'swifftnet-remote-v3', 'public', 'data', 'requests'), {
                email: user.email, 
                pricePaid: dynamicPrice, 
                status: 'assigned', // Auto-approved dahil nag-deduct na tayo
                type: 'billing_license', 
                category: 'license',
                date: serverTimestamp()
            });

            alert(`System Unlocked!`);
        } catch (err) { alert("Error: " + err.message); } 
        finally { setLoading(false); }
    }
  };

  const updateBranding = async (color) => {
    try {
      setPrimaryColor(color);
      const ref = doc(db, 'billing_systems', user.uid);
      await setDoc(ref, { primaryColor: color }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const copyKillScript = (client) => {
    const script = `/ip firewall address-list add list=OVERDUE_LIST address=${client.ipAddress || "0.0.0.0"} comment="Overdue: ${client.name}"; /ppp secret disable [find name="${client.name}"]`;
    navigator.clipboard.writeText(script);
    alert(`Kill Script for ${client.name} Copied!`);
  };

  const saveBranding = async () => {
    setLoading(true);
    try {
      const ref = doc(db, 'billing_systems', user.uid);
      await setDoc(ref, { 
        primaryColor, 
        wispName, 
        wispLogo, 
        paymentInstructions: paymentInfo 
      }, { merge: true });
      alert("Portal Branding Updated Successfully!");
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      await addDoc(collection(db, 'billing_systems', user.uid, 'customers'), {
        name: fd.get('customerName').toUpperCase(),
        monthlyFee: Number(fd.get('monthlyFee')),
        dueDate: fd.get('dueDate'),
        ipAddress: fd.get('ipAddress') || "DHCP",
        napBox: fd.get('napBox') || "N/A",
        napPort: fd.get('napPort') || "N/A",
        mapsLink: fd.get('mapsLink') || "",
        lastPaidMonth: "",
        history: [],
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      alert("Customer & Inventory Added!");
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      const docRef = doc(db, 'billing_systems', user.uid, 'customers', editingCustomer.id);
      await updateDoc(docRef, {
        name: fd.get('name').toUpperCase(),
        monthlyFee: Number(fd.get('fee')),
        dueDate: fd.get('date'),
        ipAddress: fd.get('ipAddress'),
        napBox: fd.get('napBox'),
        napPort: fd.get('napPort'),
        mapsLink: fd.get('mapsLink')
      });
      setEditingCustomer(null);
      alert("Update Successful!");
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const markAsPaid = async (client) => {
    const today = new Date();
    const currentMonthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
    if (getCustomerStatus(client) === 'paid') return alert("Already paid!");

    try {
      const customerRef = doc(db, 'billing_systems', user.uid, 'customers', client.id);
      await updateDoc(customerRef, {
        lastPaidMonth: currentMonthYear,
        history: arrayUnion({ date: today.toLocaleDateString(), amount: client.monthlyFee, type: 'Full Payment' })
      });
      await addDoc(collection(db, 'billing_systems', user.uid, 'collections'), {
          customerName: client.name, amount: client.monthlyFee, timestamp: serverTimestamp(), dateStr: today.toLocaleDateString()
      });
      alert("Payment Confirmed!");
    } catch (err) { alert(err.message); }
  };

  const approveNotice = async (notice) => {
    const client = customers.find(c => c.id === notice.customerId);
    if (!client) return alert("Customer missing.");
    await markAsPaid(client);
    await deleteDoc(doc(db, 'billing_systems', user.uid, 'notices', notice.id));
  };

  const exportToCSV = () => {
    const headers = "Name,Monthly Fee,Due Date,IP,NAP,Status\n";
    const rows = customers.map(c => `${c.name},${c.monthlyFee},${c.dueDate},${c.ipAddress},${c.napBox}-${c.napPort},${getCustomerStatus(c)}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WISP_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const filteredList = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.ipAddress && c.ipAddress.includes(searchTerm));
    const matchesFilter = filterStatus === "all" ? true : getCustomerStatus(c) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[50px] border border-emerald-500/20 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto text-emerald-500"><IconCard /></div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Premium Billing</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">Unlock enterprise tools for your ISP Business.</p>
          <button onClick={handleUnlock} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all">
            {loading ? "AUTHORIZING..." : `Unlock for ₱${prices?.billing_system_license || 150}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans relative">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            <span style={{ color: primaryColor }} className="underline decoration-2">SwifftNet</span> Billing
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Advanced ISP OS</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { if(window.confirm("Reset All Status?")) { /* Logic handleBulkReset already in core handlers */ }}} className="bg-orange-600/10 border border-orange-500/20 text-orange-500 px-6 py-4 rounded-2xl font-black uppercase text-[9px] hover:bg-orange-600 hover:text-white transition-all">Reset Cycle</button>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 px-10 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-blue-500 transition-all">+ Add Client</button>
        </div>
      </header>

      {/* ANALYTICS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl">
            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Target Revenue</p>
            <p className="text-4xl font-black italic">₱{totalExpected.toLocaleString()}</p>
            <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${collectionRate}%`, backgroundColor: primaryColor }}></div>
            </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-emerald-500/20 shadow-xl">
            <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">Collected</p>
            <p className="text-4xl font-black text-emerald-500 italic">₱{totalPaidThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-red-500/20 shadow-xl">
            <p className="text-[9px] text-red-500 font-black uppercase mb-1">Overdue Nodes</p>
            <p className="text-4xl font-black text-red-500 italic">{customers.filter(c => getCustomerStatus(c) === 'overdue').length}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-blue-500/20 shadow-xl">
            <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Total Income</p>
            <p className="text-4xl font-black text-white italic">₱{lifetimeIncome.toLocaleString()}</p>
        </div>
      </div>

      {/* QUEUE & HISTORY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* VERIFICATION QUEUE */}
          <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[45px] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase text-blue-500 italic mb-6">Payment Proofs ({notices.length})</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {notices.map(notice => (
                  <div key={notice.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center group">
                     <div>
                        <p className="text-xs font-black uppercase text-white">{notice.customerName}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 tracking-widest uppercase">REF: {notice.refNo}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => deleteDoc(doc(db, 'billing_systems', user.uid, 'notices', notice.id))} className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500 transition-all text-[10px] font-black">X</button>
                        <button onClick={() => approveNotice(notice)} className="bg-emerald-600 p-3 rounded-xl hover:bg-emerald-500 transition-all shadow-lg"><IconCheck className="w-4 h-4" /></button>
                     </div>
                  </div>
                ))}
                {notices.length === 0 && <p className="text-center py-10 text-slate-700 font-black uppercase italic text-[9px]">No pending notices.</p>}
              </div>
          </div>

          {/* COLLECTION INBOX */}
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[45px] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase text-slate-400 italic mb-6 flex items-center gap-3"><IconHistory className="w-4 h-4" /> Live Collections</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {collections.map(log => (
                  <div key={log.id} className="bg-black/30 p-4 rounded-2xl flex justify-between items-center border border-slate-800/30">
                     <p className="text-[10px] font-black uppercase text-slate-300">{log.customerName} <span className="text-[8px] text-slate-600 ml-2">{log.dateStr}</span></p>
                     <p className="text-[11px] font-black text-emerald-500">+₱{log.amount}</p>
                  </div>
                ))}
              </div>
          </div>
      </div>

      {/* WISP SETTINGS & BRANDING */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div>
                <h3 className="text-xs font-black text-blue-500 uppercase italic">Public Portal Branding</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">This is what your customers will see.</p>
              </div>
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[8px] text-slate-600 font-black uppercase ml-2">WISP Business Name</p>
                <input 
                  value={wispName} 
                  onChange={e => setWispName(e.target.value.toUpperCase())} 
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-black text-xs text-white" 
                  placeholder="E.G. KINGSLEY INTERNET"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[8px] text-slate-600 font-black uppercase ml-2">Logo URL (Optional)</p>
                <input 
                  value={wispLogo} 
                  onChange={e => setWispLogo(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-[10px] text-blue-400" 
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[8px] text-slate-600 font-black uppercase ml-2">Payment Instructions / GCash Details</p>
              <textarea 
                value={paymentInfo} 
                onChange={e => setPaymentInfo(e.target.value)} 
                className="bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-bold text-[10px] text-white w-full resize-none h-20" 
                placeholder="Gcash: 0912... (Name)" 
              />
            </div>

            <div className="flex gap-2">
                <button onClick={saveBranding} disabled={loading} className="flex-1 bg-blue-600 py-5 rounded-3xl font-black uppercase text-[10px] shadow-xl hover:bg-blue-500 transition-all">
                  {loading ? "SAVING..." : "Apply Changes to Portal"}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/check-bill?id=${user.uid}`); alert("Portal Link Copied!"); }} className="bg-slate-800 p-5 rounded-3xl hover:bg-slate-700 transition-all">
                  <IconCopy className="w-4 h-4" />
                </button>
            </div>
        </section>
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xs font-black text-blue-500 uppercase italic">Branding & Portal</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Personalize your client portal.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Theme Color</span>
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => updateBranding(e.target.value)}
                    className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <p className="text-[8px] text-slate-600 font-black uppercase mb-2 ml-2">Public Payment Instructions</p>
                  <textarea value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} className="bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-bold text-[10px] text-white w-full resize-none h-24" placeholder="Example: Gcash 09123456789 (Name)" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={async () => { const ref = doc(db, 'billing_systems', user.uid); await setDoc(ref, { paymentInstructions: paymentInfo }, { merge: true }); alert("Saved!"); }} className="flex-1 bg-blue-600 px-8 py-5 rounded-3xl font-black uppercase text-[10px]">Save Settings</button>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/check-bill?id=${user.uid}`); alert("Portal Link Copied!"); }} className="bg-slate-800 p-5 rounded-3xl hover:bg-slate-700 transition-all"><IconCopy className="w-4 h-4" /></button>
                </div>
              </div>
          </section>

          <div className="bg-emerald-500/5 p-10 rounded-[45px] border border-emerald-500/10 flex items-center justify-between">
              <div className="space-y-3">
                  <h4 className="text-sm font-black text-emerald-500 uppercase italic tracking-tighter">Inventory Audit</h4>
                  <p className="text-[9px] text-slate-500 font-black uppercase max-w-xs">Export all client data including IP addresses, NAP ports, and payment history.</p>
                  <button onClick={exportToCSV} className="bg-emerald-600 px-10 py-5 rounded-3xl font-black uppercase text-[10px] mt-4 flex items-center gap-3 shadow-xl"><IconDownload /> Download Ledger</button>
              </div>
              <div className="hidden md:block opacity-10"><IconHistory className="w-24 h-24" /></div>
          </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-slate-900/50 p-6 rounded-[45px] border border-slate-800 mb-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center bg-slate-950 rounded-3xl px-6 border border-slate-800 group focus-within:border-blue-500 transition-all">
          <IconSearch className="text-slate-700 w-5 h-5 group-focus-within:text-blue-500" />
          <input className="w-full bg-transparent p-5 outline-none text-sm font-black uppercase placeholder:text-slate-800 text-white" placeholder="Search customer or IP address..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-slate-950 border border-slate-800 px-8 rounded-3xl text-[10px] font-black uppercase outline-none text-blue-500 cursor-pointer" onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Status: All</option>
            <option value="paid">✅ Fully Paid</option>
            <option value="pending">⏳ Pending</option>
            <option value="overdue">🚨 Overdue</option>
        </select>
      </div>

      {/* CUSTOMER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredList.map(client => {
          const status = getCustomerStatus(client);
          return (
            <div key={client.id} className={`bg-slate-900 p-8 rounded-[45px] border flex flex-col justify-between transition-all group ${status === 'paid' ? 'border-emerald-500/20 shadow-lg' : status === 'overdue' ? 'border-red-500/20' : 'border-slate-800'}`}>
              <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4 items-center">
                    <div onDoubleClick={() => { if(window.confirm(`Delete ${client.name}?`)) deleteDoc(doc(db, 'billing_systems', user.uid, 'customers', client.id)) }} className={`w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-2xl uppercase shadow-xl transition-all ${status === 'paid' ? 'bg-emerald-600 text-white' : status === 'overdue' ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-950 border border-slate-800 text-slate-600'}`}>
                      {client.name[0]}
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-black uppercase text-base italic tracking-tighter text-white">{client.name}</h4>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                          IP: <span className="text-blue-500 font-mono">{client.ipAddress || "N/A"}</span> • Port: <span className="text-orange-500">{client.napBox}-{client.napPort}</span>
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="text-lg font-black italic text-white tracking-tighter">₱{client.monthlyFee}</p>
                      <p className="text-[8px] text-slate-700 font-black uppercase">Monthly</p>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 px-2">
                  <span>Due Day {client.dueDate}</span>
                  <span className={status === 'paid' ? 'text-emerald-500' : 'text-red-500'}>{status}</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setEditingCustomer(client)} className="flex-1 bg-slate-950 py-4 rounded-2xl border border-slate-800 hover:border-orange-500 text-slate-500 transition-all flex items-center justify-center"><IconEdit className="w-4 h-4" /></button>
                   <button onClick={() => markAsPaid(client)} disabled={status === 'paid'} className={`flex-[3] py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${status === 'paid' ? 'bg-slate-950 border border-slate-800 text-slate-700' : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-500'}`}>
                      {status === 'paid' ? 'SETTLED' : 'CONFIRM PAYMENT'}
                   </button>
                   <button onClick={() => copyKillScript(client)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all" title="Copy Kill Script"><IconShield className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-[200]">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[60px] border border-slate-800 shadow-2xl space-y-8">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-500">Create Node</h2>
            <form onSubmit={saveCustomer} className="space-y-4">
              <input name="customerName" required placeholder="FULL NAME" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-black text-sm uppercase text-white focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <input name="monthlyFee" type="number" required defaultValue="500" placeholder="FEE" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-black text-sm text-white" />
                <input name="dueDate" type="number" required defaultValue="1" placeholder="DUE DAY" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-black text-sm text-white" />
              </div>
              
              <div className="p-5 bg-black/20 rounded-3xl space-y-4 border border-slate-800/50">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Network Inventory</p>
                <input name="ipAddress" placeholder="ASSIGNED IP" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs text-blue-400" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="napBox" placeholder="NAP BOX #" className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs" />
                  <input name="napPort" placeholder="PORT #" className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs" />
                </div>
                <input name="mapsLink" placeholder="GOOGLE MAPS LINK (OPTIONAL)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-[9px]" />
              </div>

              <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 font-black uppercase text-[10px] text-slate-600">CANCEL</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 py-5 rounded-3xl font-black uppercase text-xs shadow-xl">{loading ? 'CREATING...' : 'ADD CUSTOMER'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-[200]">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[60px] border border-slate-800 shadow-2xl space-y-8">
             <h2 className="text-xl font-black uppercase italic text-orange-500">Edit Node Info</h2>
             <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <input name="name" defaultValue={editingCustomer.name} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-black text-sm uppercase text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] text-slate-600 font-black uppercase ml-4">Monthly Fee</p>
                    <input name="fee" type="number" defaultValue={editingCustomer.monthlyFee} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl font-black text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-slate-600 font-black uppercase ml-4">Due Date</p>
                    <input name="date" type="number" defaultValue={editingCustomer.dueDate} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl font-black text-white" />
                  </div>
                </div>

                <div className="p-5 bg-black/20 rounded-3xl space-y-4 border border-slate-800/50">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Update Inventory</p>
                  <input name="ipAddress" defaultValue={editingCustomer.ipAddress} placeholder="IP ADDRESS" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs text-orange-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="napBox" defaultValue={editingCustomer.napBox} placeholder="NAP BOX" className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs" />
                    <input name="napPort" defaultValue={editingCustomer.napPort} placeholder="PORT" className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-xs" />
                  </div>
                  <input name="mapsLink" defaultValue={editingCustomer.mapsLink} placeholder="MAPS LINK" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-[9px]" />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button type="submit" disabled={loading} className="w-full bg-orange-600 py-6 rounded-3xl font-black uppercase text-xs shadow-xl">{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
                  <button type="button" onClick={() => setEditingCustomer(null)} className="w-full text-[10px] font-black text-slate-600 uppercase">CANCEL</button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}