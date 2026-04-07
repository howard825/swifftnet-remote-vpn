import React, { useState } from 'react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { IconShield, IconGoogle } from '../components/Icons';

export default function LandingPage({ setView }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState(null);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, emailInput, passInput);
        await sendEmailVerification(userCred.user);
        alert("Verification email sent! Check your inbox.");
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passInput);
      }
    } catch (err) { setAuthError(err.message); }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (err) { setAuthError(err.message); }
  };

  const handleForgotPassword = async () => {
    if (!emailInput) return alert("Enter your email first.");
    try {
      await sendPasswordResetEmail(auth, emailInput);
      alert("Password reset link sent!");
    } catch (err) { setAuthError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-500">
      <div className="text-blue-500 mb-6 scale-125 animate-pulse"><IconShield /></div>
      
      <div className="text-center max-w-2xl mb-10 space-y-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
          SwifftNet <span className="text-blue-600">Remote</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
          Professional Remote Access & VPN Solutions
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
        <h2 className="text-center text-xl font-black uppercase tracking-widest">
          {isSignUp ? 'Join SwifftNet' : 'Login'}
        </h2>
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input type="email" placeholder="Email" required value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
          <input type="password" placeholder="Password" required value={passInput} onChange={(e)=>setPassInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" />
          {!isSignUp && (
            <div className="text-right px-2">
              <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-500">Forgot Password?</button>
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

      <footer className="mt-12 flex gap-8">
        <button onClick={() => setView('privacy')} className="text-slate-600 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest">Privacy Policy</button>
        <button onClick={() => setView('terms')} className="text-slate-600 hover:text-emerald-500 text-[10px] font-black uppercase tracking-widest">Terms of Use</button>
      </footer>
    </div>
  );
}