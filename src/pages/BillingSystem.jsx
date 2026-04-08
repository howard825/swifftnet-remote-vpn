import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc, arrayUnion, setDoc, getDoc, orderBy, limit, writeBatch } from 'firebase/firestore';
import { IconCard, IconHistory, IconCheck, IconSearch, IconCopy, IconEdit, IconDownload, IconShield } from '../components/Icons';

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
  const [paymentInfo, setPaymentInfo] = useState("");

  const hasAccess = user.billingAccessUntil && user.billingAccessUntil.toDate() > new Date();

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

    const fetchSettings = async () => {
        const sDoc = await getDoc(doc(db, 'billing_systems', user.uid));
        if (sDoc.exists()) setPaymentInfo(sDoc.data().paymentInstructions || "");
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
    const dynamicPrice = prices?.billing_system_license || base?.billing_system_license || 150; 
    if (bal < dynamicPrice) return alert(`Insufficient balance! Needs ₱${dynamicPrice}`);

    if (window.confirm(`Unlock Billing System for 30 days? ₱${dynamicPrice} will be deducted.`)) {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid); 
            await setDoc(userRef, { 
                billingAccessUntil: expiryDate,
                credits: Number(bal) - Number(dynamicPrice) 
            }, { merge: true });
            await addDoc(collection(db, 'artifacts', appId || 'swifftnet-remote-v3', 'public', 'data', 'payments'), {
                email: user.email, amount: -dynamicPrice, status: 'confirmed', type: 'billing_license', refNo: `BILL-${Math.random().toString(36).toUpperCase().slice(2,8)}`, date: serverTimestamp()
            });
            alert(`System Unlocked!`);
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    }
  };

  const markAsPaid = async (client) => {
    const today = new Date();
    const currentMonthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
    if (getCustomerStatus(client) === 'paid') return alert("Already paid for this month!");

    try {
      const customerRef = doc(db, 'billing_systems', user.uid, 'customers', client.id);
      await updateDoc(customerRef, {
        lastPaidMonth: currentMonthYear,
        history: arrayUnion({ date: today.toLocaleDateString(), amount: client.monthlyFee, type: 'Full Payment' })
      });
      await addDoc(collection(db, 'billing_systems', user.uid, 'collections'), {
          customerName: client.name, amount: client.monthlyFee, timestamp: serverTimestamp(), dateStr: today.toLocaleDateString()
      });
      return true;
    } catch (err) { alert(err.message); return false; }
  };

  const approveNotice = async (notice) => {
    const client = customers.find(c => c.id === notice.customerId);
    if (!client) return alert("Customer not found.");
    const success = await markAsPaid(client);
    if (success) {
      await deleteDoc(doc(db, 'billing_systems', user.uid, 'notices', notice.id));
      alert(`Verified payment for ${notice.customerName}`);
    }
  };

  const handleBulkReset = async () => {
    if (!window.confirm("Reset ALL customers to PENDING status?")) return;
    const batch = writeBatch(db);
    customers.forEach(c => {
        batch.update(doc(db, 'billing_systems', user.uid, 'customers', c.id), { lastPaidMonth: "" });
    });
    await batch.commit();
    alert("Cycle Reset!");
  };

  const exportToCSV = () => {
    const headers = "Name,Monthly Fee,Due Date,Status\n";
    const rows = customers.map(c => `${c.name},${c.monthlyFee},${c.dueDate},${getCustomerStatus(c)}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SwifftNet_Billing_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'billing_systems', user.uid, 'customers'), {
        name: e.target.customerName.value.toUpperCase(),
        monthlyFee: Number(e.target.monthlyFee.value),
        dueDate: e.target.dueDate.value,
        lastPaidMonth: "",
        history: [],
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      alert("Customer Added!");
    } catch (err) { alert(err.message); }
  };

  const filteredList = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" ? true : getCustomerStatus(c) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 p-12 rounded-[50px] border border-emerald-500/20 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto text-emerald-500"><IconCard /></div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Premium Billing</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Full ISP management, automated tracking, and public portal access.</p>
          <button onClick={handleUnlock} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">
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
          <h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-emerald-500 underline decoration-2">SwifftNet</span> Billing</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Master ISP Management</p>
        </div>
        <div className="flex gap-4">
            <button onClick={handleBulkReset} className="bg-orange-600/10 border border-orange-500/20 text-orange-500 px-6 py-4 rounded-2xl font-black uppercase text-[9px] hover:bg-orange-600 hover:text-white transition-all">Reset Cycle</button>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 px-10 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-blue-500 transition-all">+ Add Client</button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl">
            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Monthly Goal</p>
            <p className="text-4xl font-black italic">₱{totalExpected.toLocaleString()}</p>
            <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${collectionRate}%` }}></div>
            </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-emerald-500/20 shadow-xl">
            <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">Confirmed</p>
            <p className="text-4xl font-black text-emerald-500 italic">₱{totalPaidThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-red-500/20 shadow-xl">
            <p className="text-[9px] text-red-500 font-black uppercase mb-1">Overdue</p>
            <p className="text-4xl font-black text-red-500 italic">{customers.filter(c => getCustomerStatus(c) === 'overdue').length}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[40px] border border-blue-500/20 shadow-xl">
            <p className="text-[9px] text-blue-500 font-black uppercase mb-1">Lifetime Income</p>
            <p className="text-4xl font-black text-white italic">₱{lifetimeIncome.toLocaleString()}</p>
        </div>
      </div>

      {/* QUEUE & INBOX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[45px] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase text-blue-500 italic mb-6">Verification Queue ({notices.length})</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {notices.map(notice => (
                  <div key={notice.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center group">
                     <div>
                        <p className="text-xs font-black uppercase text-white tracking-tight">{notice.customerName}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 tracking-widest uppercase">REF: {notice.refNo}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => deleteDoc(doc(db, 'billing_systems', user.uid, 'notices', notice.id))} className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[10px] font-black">X</button>
                        <button onClick={() => approveNotice(notice)} className="bg-emerald-600 p-3 rounded-xl hover:bg-emerald-500 transition-all shadow-lg"><IconCheck className="w-4 h-4" /></button>
                     </div>
                  </div>
                ))}
                {notices.length === 0 && <p className="text-center py-10 text-slate-700 font-black uppercase italic text-[9px]">No pending verifications.</p>}
              </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[45px] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase text-slate-400 italic mb-6 flex items-center gap-3"><IconHistory className="w-4 h-4" /> Collection Inbox</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {collections.map(log => (
                  <div key={log.id} className="bg-black/30 p-4 rounded-2xl flex justify-between items-center border border-slate-800/30">
                     <p className="text-[10px] font-black uppercase text-slate-300">{log.customerName} <span className="text-[8px] text-slate-600 ml-2">{log.dateStr}</span></p>
                     <p className="text-[11px] font-black text-emerald-500">+₱{log.amount}</p>
                  </div>
                ))}
              </div>
          </div>
      </div>

      {/* SETTINGS & SHARE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex flex-col md:flex-row gap-8 items-center">
             <div className="flex-1">
                <h3 className="text-xs font-black text-blue-500 uppercase italic">Public Portal Info</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Shown to customers on the Checker link.</p>
             </div>
             <div className="flex flex-col gap-4 w-full md:w-auto">
                <textarea value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none font-bold text-[10px] text-white w-full md:w-64 resize-none" placeholder="GCash: 09..." />
                <div className="flex gap-2">
                    <button onClick={async () => { const ref = doc(db, 'billing_systems', user.uid); await setDoc(ref, { paymentInstructions: paymentInfo }, { merge: true }); alert("Saved!"); }} className="flex-1 bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px]">Save</button>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/check-bill?id=${user.uid}`); alert("Link Copied!"); }} className="bg-slate-800 p-4 rounded-2xl hover:bg-slate-700 transition-all"><IconCopy className="w-4 h-4" /></button>
                </div>
             </div>
          </section>
          <div className="bg-emerald-500/5 p-10 rounded-[45px] border border-emerald-500/10 flex items-center justify-between">
              <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-500 uppercase italic tracking-tighter">Reports</h4>
                  <p className="text-[9px] text-slate-500 font-black uppercase">Download customer ledger in CSV.</p>
                  <button onClick={exportToCSV} className="bg-emerald-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] mt-4 transition-all flex items-center gap-3"><IconDownload /> Export CSV</button>
              </div>
          </div>
      </div>

      {/* FILTER BOX */}
      <div className="bg-slate-900/50 p-6 rounded-[45px] border border-slate-800 mb-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center bg-slate-950 rounded-3xl px-6 border border-slate-800">
          <IconSearch className="text-slate-700 w-5 h-5" />
          <input className="w-full bg-transparent p-5 outline-none text-sm font-black uppercase placeholder:text-slate-800" placeholder="Filter customers..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-slate-950 border border-slate-800 px-8 rounded-3xl text-[10px] font-black uppercase outline-none text-emerald-500" onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Status: All</option>
            <option value="paid">✅ Paid</option>
            <option value="pending">⏳ Pending</option>
            <option value="overdue">🚨 Overdue</option>
        </select>
      </div>

      {/* CUSTOMER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredList.map(client => {
          const status = getCustomerStatus(client);
          return (
            <div key={client.id} className={`bg-slate-900 p-8 rounded-[45px] border flex flex-col justify-between transition-all group ${status === 'paid' ? 'border-emerald-500/20 shadow-lg shadow-emerald-900/5' : status === 'overdue' ? 'border-red-500/20' : 'border-slate-800'}`}>
              <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4 items-center">
                    <div onDoubleClick={() => { if(window.confirm("Delete?")) deleteDoc(doc(db, 'billing_systems', user.uid, 'customers', client.id)) }} className={`w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-2xl uppercase shadow-xl transition-all ${status === 'paid' ? 'bg-emerald-600 text-white' : status === 'overdue' ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-950 border border-slate-800 text-slate-600'}`}>{client.name[0]}</div>
                    <div className="space-y-1">
                        <h4 className="font-black uppercase text-base italic tracking-tighter text-white">{client.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Day {client.dueDate} • <span className={status === 'paid' ? 'text-emerald-500' : 'text-red-500'}>{status.toUpperCase()}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="text-lg font-black italic text-white tracking-tighter">₱{client.monthlyFee}</p>
                      <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Rate</p>
                  </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setEditingCustomer(client)} className="flex-1 bg-slate-950 py-4 rounded-2xl border border-slate-800 hover:border-orange-500 text-slate-500 hover:text-orange-500 transition-all flex items-center justify-center"><IconEdit className="w-4 h-4" /></button>
                 <button onClick={() => markAsPaid(client)} className={`flex-[3] py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${status === 'paid' ? 'bg-slate-950 border border-slate-800 text-slate-700 cursor-not-allowed opacity-50' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500'}`}>
                    {status === 'paid' ? 'FULL PAID' : 'MARK AS PAID'}
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-[200]">
          <div className="bg-slate-900 w-full max-w-md p-12 rounded-[60px] border border-slate-800 animate-in zoom-in-95 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-500 mb-10">Add Customer</h2>
            <form onSubmit={saveCustomer} className="space-y-8">
              <input name="customerName" required placeholder="FULL NAME" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-[2rem] outline-none font-black text-sm uppercase text-white focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <input name="monthlyFee" type="number" required defaultValue="500" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-[2rem] outline-none font-black text-sm text-white" />
                <input name="dueDate" type="number" required defaultValue="1" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-[2rem] outline-none font-black text-sm text-white" />
              </div>
              <div className="flex gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 font-black uppercase text-[10px] text-slate-600">CANCEL</button>
                  <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-500 py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl transition-all">Create Node</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-[200]">
          <div className="bg-slate-900 w-full max-w-md p-12 rounded-[60px] border border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <h2 className="text-xl font-black uppercase italic text-orange-500 mb-8">Edit Details</h2>
             <form onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.target);
                 await updateDoc(doc(db, 'billing_systems', user.uid, 'customers', editingCustomer.id), {
                   name: fd.get('name').toUpperCase(),
                   monthlyFee: Number(fd.get('fee')),
                   dueDate: fd.get('date')
                 });
                 setEditingCustomer(null);
             }} className="space-y-6">
                <input name="name" defaultValue={editingCustomer.name} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none font-black text-sm uppercase text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="fee" type="number" defaultValue={editingCustomer.monthlyFee} required className="bg-slate-950 border border-slate-800 p-5 rounded-3xl font-black text-white outline-none" />
                  <input name="date" type="number" defaultValue={editingCustomer.dueDate} required className="bg-slate-950 border border-slate-800 p-5 rounded-3xl font-black text-white outline-none" />
                </div>
                <button type="submit" className="w-full bg-orange-600 py-6 rounded-[2.5rem] font-black uppercase text-xs shadow-xl">Update Record</button>
                <button type="button" onClick={() => setEditingCustomer(null)} className="w-full text-[10px] font-black text-slate-600 uppercase">Cancel</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}