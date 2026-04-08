import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { IconSearch, IconCheck, IconShield, IconCard } from '../components/Icons';

export default function PublicCheckBill() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id'); // Kinukuha ang ?id= sa URL

  // BRANDING STATES
  const [wispData, setWispData] = useState({
    wispName: "SwifftNet Portal",
    wispLogo: "",
    primaryColor: "#10b981",
    paymentInstructions: ""
  });

  // SEARCH & CUSTOMER STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noticeSent, setNoticeSent] = useState(false);

  // 1. FETCH BRANDING (Dynamic Load)
  useEffect(() => {
    if (!clientId) return;
    const fetchBranding = async () => {
      const docRef = doc(db, 'billing_systems', clientId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setWispData(prev => ({ ...prev, ...snap.data() }));
      }
    };
    fetchBranding();
  }, [clientId]);

  // 2. SEARCH LOGIC
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm || !clientId) return;
    setLoading(true);
    setCustomer(null);

    try {
      // Naghahanap sa sub-collection ng specific client
      const q = query(
        collection(db, 'billing_systems', clientId, 'customers'),
        where('name', '==', searchTerm.toUpperCase())
      );
      
      onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setCustomer({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          alert("Customer not found. Please check the spelling.");
        }
        setLoading(false);
      });
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  // 3. SUBMIT PAYMENT NOTICE
  const submitNotice = async (e) => {
    e.preventDefault();
    const refNo = e.target.refNo.value;
    if (!refNo) return;

    try {
      await addDoc(collection(db, 'billing_systems', clientId, 'notices'), {
        customerId: customer.id,
        customerName: customer.name,
        refNo: refNo,
        amount: customer.monthlyFee,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setNoticeSent(true);
    } catch (err) { alert(err.message); }
  };

  // HELPER: STATUS CHECK
  const getStatus = (c) => {
    const today = new Date();
    const currentMonthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
    if (c.lastPaidMonth === currentMonthYear) return 'PAID';
    if (today.getDate() > Number(c.dueDate)) return 'OVERDUE';
    return 'PENDING';
  };

  if (!clientId) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-black">INVALID PORTAL LINK</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 md:p-12 flex flex-col items-center">
      
      {/* DYNAMIC HEADER */}
      <header className="w-full max-w-2xl text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        {wispData.wispLogo && (
          <img src={wispData.wispLogo} alt="Logo" className="w-24 h-24 mx-auto rounded-3xl object-contain mb-4 shadow-2xl" />
        )}
        <h1 className="text-4xl font-black uppercase italic tracking-tighter" style={{ color: wispData.primaryColor }}>
          {wispData.wispName}
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Official Billing Portal</p>
      </header>

      <main className="w-full max-w-xl space-y-8">
        
        {/* SEARCH BOX */}
        {!customer && (
          <form onSubmit={handleSearch} className="bg-slate-900 p-2 rounded-[2.5rem] border border-slate-800 flex items-center shadow-2xl">
            <input 
              className="flex-1 bg-transparent p-6 outline-none font-black uppercase text-sm placeholder:text-slate-700"
              placeholder="ENTER FULL NAME..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="p-6 rounded-[2rem] transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: wispData.primaryColor }}
            >
              <IconSearch className="w-6 h-6 text-slate-950" />
            </button>
          </form>
        )}

        {/* CUSTOMER BILL CARD */}
        {customer && (
          <div className="animate-in zoom-in-95 duration-500 space-y-6">
            <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ color: wispData.primaryColor }}><IconCard className="w-full h-full" /></div>
              
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">{customer.name}</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Account Verified</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black italic" style={{ color: wispData.primaryColor }}>₱{customer.monthlyFee}</p>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Amount Due</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-slate-800 pt-8">
                <div>
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Due Date</p>
                  <p className="font-black text-sm uppercase italic">Every Day {customer.dueDate}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Payment Status</p>
                  <p className={`font-black text-sm uppercase italic ${getStatus(customer) === 'PAID' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {getStatus(customer)}
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT INSTRUCTIONS */}
            {getStatus(customer) !== 'PAID' && (
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-[3rem] p-10 space-y-6">
                <h3 className="text-xs font-black text-blue-500 uppercase italic flex items-center gap-2">
                  <IconShield className="w-4 h-4" /> How to Pay
                </h3>
                <p className="text-sm font-medium text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {wispData.paymentInstructions || "Please contact your provider for payment details."}
                </p>

                {!noticeSent ? (
                  <form onSubmit={submitNotice} className="space-y-4 pt-4 border-t border-blue-500/10">
                    <p className="text-[9px] text-slate-500 font-black uppercase">Already paid? Submit Reference Number:</p>
                    <div className="flex gap-2">
                      <input name="refNo" required placeholder="REFERENCE NO." className="flex-1 bg-slate-950 border border-slate-800 p-5 rounded-2xl outline-none font-black text-xs uppercase" />
                      <button type="submit" className="bg-blue-600 px-8 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-500 transition-all">Submit</button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in">
                    <IconCheck className="text-emerald-500 w-6 h-6" />
                    <p className="text-xs font-black uppercase text-emerald-500 tracking-tight">Payment Notice Sent! Waiting for verification.</p>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={() => setCustomer(null)} className="w-full py-4 text-[9px] font-black text-slate-700 uppercase hover:text-slate-500 tracking-widest transition-all">Search Another Account</button>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-[8px] text-slate-800 font-black uppercase tracking-[0.5em]">
        Powered by SwifftNet Remote V3
      </footer>
    </div>
  );
}