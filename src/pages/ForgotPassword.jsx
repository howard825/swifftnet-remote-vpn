import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { IconShield } from '../components/Icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Please check your email inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
      <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-center text-blue-500 mb-2"><IconShield /></div>
        <h2 className="text-center text-xl font-black uppercase tracking-widest text-blue-500 italic">Reset Password</h2>
        <p className="text-center text-xs text-slate-500 font-bold px-4">Enter your registered email to receive a reset link.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" 
            placeholder="Your Email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl outline-none focus:border-blue-500 font-bold" 
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all">
            Send Reset Link
          </button>
        </form>

        {message && <p className="text-emerald-400 text-[10px] text-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">{message}</p>}
        {error && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{error}</p>}

        <div className="text-center">
          <Link to="/" className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}