import React, { useState, useEffect } from 'react';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';

export default function Profile({ user, db, base }) {
  const [names, setNames] = useState({ first: "", middle: "", last: "" });
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState({ old: "", new: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  // 1. LOAD EXISTING DATA (Mula sa Firestore para sa Names)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, ...base, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setNames({
            first: data.first || "",
            middle: data.middle || "",
            last: data.last || ""
          });
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (err) { console.error("Error fetching names:", err); }
    };
    if (user) fetchUserData();
  }, [user, db, base]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      // 1. UPDATE AUTH PROFILE (Para sa PhotoURL at Display Name)
      await updateProfile(auth.currentUser, {
        displayName: `${names.first} ${names.last}`,
        photoURL: photoURL
      });

      // 2. UPDATE FIRESTORE (Para sa Detailed Names at Persistence)
      await setDoc(doc(db, ...base, 'users', user.uid), { 
        ...names, 
        photoURL: photoURL,
        email: email,
        updatedAt: new Date().toISOString() 
      }, { merge: true });

      // 3. SECURITY UPDATES (Email/Password)
      if (pass.new || email !== user.email) {
        if (!pass.old) throw new Error("Current password is required to change email or password.");
        
        const credential = EmailAuthProvider.credential(user.email, pass.old);
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        if (email !== user.email) await updateEmail(auth.currentUser, email);
        if (pass.new) await updatePassword(auth.currentUser, pass.new);
      }

      setStatus({ type: "success", msg: "Profile and Security updated successfully!" });
      setPass({ old: "", new: "" }); // Reset password fields
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center animate-in fade-in duration-500">
      <div className="max-w-2xl w-full bg-slate-900/50 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-2xl space-y-8">
        
        {/* AVATAR PREVIEW */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-3xl border-2 border-blue-600 overflow-hidden bg-slate-950 shadow-2xl">
            <img 
              src={photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0ea5e9&color=fff`} 
              alt="Profile Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
            />
          </div>
          <h2 className="text-xl font-black uppercase italic text-blue-500 tracking-tighter text-center">Subscriber Profile</h2>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* PERSONAL INFO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Personal Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="First Name" value={names.first} onChange={(e)=>setNames({...names, first: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
              <input type="text" placeholder="Middle Name" value={names.middle} onChange={(e)=>setNames({...names, middle: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
              <input type="text" placeholder="Last Name" value={names.last} onChange={(e)=>setNames({...names, last: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
            </div>
            
            {/* PHOTO URL INPUT */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-blue-400 ml-2 italic">Profile Image URL (Direct Link)</label>
              <input 
                type="text" 
                placeholder="https://example.com/your-photo.jpg" 
                value={photoURL} 
                onChange={(e)=>setPhotoURL(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-xs text-blue-100" 
              />
            </div>
          </div>

          {/* SECURITY SECTION */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Security & Credentials</h3>
            <div className="space-y-4">
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="password" placeholder="Old Password" value={pass.old} onChange={(e)=>setPass({...pass, old: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
                <input type="password" placeholder="New Password" value={pass.new} onChange={(e)=>setPass({...pass, new: e.target.value})} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white" />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? "PROCESING..." : "SAVE PROFILE CHANGES"}
          </button>

          {status.msg && (
            <div className={`text-center text-[10px] font-black uppercase p-4 rounded-2xl animate-in fade-in zoom-in-95 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}