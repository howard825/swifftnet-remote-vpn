import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconShield } from './Icons';

export default function Navbar({ user, handleLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* 1. LOGO SECTION */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="text-blue-500 group-hover:rotate-12 transition-all duration-300">
            <IconShield />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black uppercase italic tracking-tighter text-white">SwifftNet</span>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em]">Remote V3</span>
          </div>
        </div>

        {/* 2. NAVIGATION LINKS */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          <Link to="/" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">Home</Link>
          <Link to="/status" className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">Server Status</Link>
          <Link to="/help" className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">Help Center</Link>
          <Link to="/about" className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest">About Us</Link>
          <Link to="/privacy-policy" className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-500 transition-colors tracking-widest">Privacy</Link>
          <Link to="/terms-of-use" className="text-[10px] font-black uppercase text-slate-500 hover:text-emerald-500 transition-colors tracking-widest">Terms</Link>
          
          {/* 3. AUTH / PROFILE SECTION */}
          {!user ? (
            <Link 
              to="/login" 
              className="bg-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Client Portal
            </Link>
          ) : (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-6 ml-2">
              {/* PROFILE AVATAR & NAME */}
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black text-white leading-none uppercase group-hover:text-blue-400 transition-colors">
                    {user.displayName || user.email.split('@')[0]}
                  </p>
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter">Subscriber</p>
                </div>
                
                {/* DYNAMIC AVATAR FROM IMAGE URL */}
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-slate-800 group-hover:border-blue-600 transition-all shadow-xl bg-slate-900 flex items-center justify-center">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.email}&background=1e293b&color=fff`; }}
                    />
                  ) : (
                    <span className="text-xs font-black text-blue-500">{user.email[0].toUpperCase()}</span>
                  )}
                </div>
              </Link>

              {/* LOGOUT BUTTON */}
              <button 
                onClick={handleLogout} 
                className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors ml-2"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}