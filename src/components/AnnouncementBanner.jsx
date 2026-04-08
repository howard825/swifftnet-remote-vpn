import React from 'react';

export default function AnnouncementBanner({ announcement }) {
  if (!announcement?.isActive) return null;

  const bgColors = {
    info: "bg-blue-600",
    warning: "bg-orange-600",
    promo: "bg-emerald-600 font-black italic"
  };

  return (
    <div className={`${bgColors[announcement.type] || 'bg-blue-600'} text-white py-3 px-6 text-center animate-in slide-in-from-top duration-500 sticky top-[72px] z-40`}>
      <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">
        📢 {announcement.text}
      </p>
    </div>
  );
}