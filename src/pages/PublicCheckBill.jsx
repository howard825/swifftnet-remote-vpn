import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import { db } from '../config/firebase';
import { IconSearch, IconCheck, IconShield } from '../components/Icons';

export default function PublicCheckBill() {
  const [searchParams] = useSearchParams();
  const wispId = searchParams.get('id'); 
  
  const [search, setSearch] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wispData, setWispData] = useState(null); // --- FEATURE: WISP SETTINGS STATE ---

  // --- FEATURE: FETCH WISP PAYMENT INSTRUCTIONS ---
  useEffect(() => {
    const fetchWispSettings = async () => {
      if (!wispId) return;
      try {
        const docRef = doc(db, 'billing_systems', wispId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWispData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching WISP settings:", err);
      }
    };
    fetchWispSettings();
  }, [wispId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!wispId) return alert("Invalid WISP Link. Please ask your provider for the correct link.");
    if (!search.trim()) return;

    setLoading(true);
    setResults(null);
    try {
      const customersRef = collection(db, 'billing_systems', wispId, 'customers');
      const q = query(customersRef, where('name', '==', search.toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      alert("Error accessing database.");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (client) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
    const isPaid = client.lastPaidMonth === currentMonthYear;

    if (isPaid) return { text: "FULLY PAID", color: "bg-emerald-600", border: "border-emerald-500/50" };
    if (currentDay > Number(client.dueDate)) return { text: "OVERDUE", color: "bg-red-600 animate-pulse", border: "border-red-500/50" };
    return { text: "PENDING", color: "bg-orange-600", border: "border-orange-500/50" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-12">
        
        {/* BRANDING */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            <span className="text-emerald-500 underline">SwifftNet</span> Billing
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Customer Portal</p>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative group">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="ENTER REGISTERED NAME"
              className="w-full bg-slate-900 border border-slate-800 p-6 rounded-[35px] text-center font-black text-lg outline-none focus:border-emerald-500 transition-all uppercase placeholder:text-slate-700 shadow-2xl"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[35px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "SEARCHING..." : "CHECK BILLING STATUS"}
          </button>
        </form>

        {/* RESULTS SECTION */}
        <div className="min-h-[200px]">
          {results && results.length > 0 ? (
            results.map(client => {
              const status = getStatus(client);
              return (
                <div key={client.id} className={`bg-slate-900 p-8 rounded-[45px] border ${status.border} shadow-2xl space-y-8 animate-in zoom-in-95`}>
                   <div className="text-center">
                     <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Billing Statement for</p>
                     <h2 className="text-2xl font-black italic uppercase text-white">{client.name}</h2>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 text-center">
                         <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Monthly Fee</p>
                         <p className="text-2xl font-black text-white italic">₱{client.monthlyFee}</p>
                      </div>
                      <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 text-center">
                         <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Due Date</p>
                         <p className="text-2xl font-black text-white italic">Day {client.dueDate}</p>
                      </div>
                   </div>

                   <div className={`w-full py-5 rounded-3xl text-center font-black text-xs tracking-widest ${status.color}`}>
                      {status.text}
                   </div>

                   {/* --- FEATURE: PAYMENT INSTRUCTIONS (Shown if not fully paid) --- */}
                   {status.text !== "FULLY PAID" && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[30px] space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-2">
                          <IconCheck className="w-3 h-3"/> Payment Instructions
                        </p>
                        <div className="text-xs font-bold text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {wispData?.paymentInstructions || "Please contact your WISP Administrator for payment details."}
                        </div>
                     </div>
                   )}

                   {/* --- FEATURE: SUBMIT PROOF OF PAYMENT NOTICE --- */}
                    <button 
                    onClick={() => {
                        const ref = prompt("Please enter your GCash Reference Number:");
                        if (ref) {
                        // Mag-submit ng notice sa billing_systems -> [WISP_ID] -> notices
                        addDoc(collection(db, 'billing_systems', wispId, 'notices'), {
                            customerName: client.name,
                            customerId: client.id,
                            refNo: ref,
                            status: 'pending',
                            timestamp: serverTimestamp()
                        });
                        alert("Payment Notice Sent! Your provider will verify it shortly.");
                        }
                    }}
                    className="w-full bg-white text-black py-4 rounded-3xl font-black uppercase text-[9px] tracking-widest shadow-xl mt-4"
                    >
                    I've already paid (Submit Ref No.)
                    </button>

                   <p className="text-[8px] text-slate-600 text-center font-bold uppercase italic">
                     System powered by SwifftNet Remote V3
                   </p>
                </div>
              );
            })
          ) : results && (
            <div className="text-center p-10 bg-red-600/5 rounded-[40px] border border-red-500/10 animate-in fade-in">
               <p className="text-red-500 font-black uppercase italic text-xs">No records found for that name.</p>
               <p className="text-[9px] text-slate-600 font-bold uppercase mt-2 leading-relaxed px-4">
                 Please make sure the name matches the registered name in the ISP database.
               </p>
            </div>
          )}
        </div>

        {/* SECURITY NOTE */}
        {!wispId && (
          <div className="bg-orange-600/10 p-6 rounded-3xl border border-orange-600/20 text-center">
            <p className="text-orange-500 font-black text-[10px] uppercase italic">
              Warning: ISP ID is missing. You cannot check bills without a valid provider link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}