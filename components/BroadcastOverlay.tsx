import React from 'react';

interface BroadcastOverlayProps {
  vibe: 'professional' | 'goofy';
  location: string;
  headline: string;
  tickerText: string;
}

export default function BroadcastOverlay({ vibe, location, headline, tickerText }: BroadcastOverlayProps) {
  // CONFIG: Styles based on Vibe
  const isGoofy = vibe === 'goofy';
  
  const colors = isGoofy ? {
    primary: 'bg-pink-600',
    secondary: 'bg-yellow-400',
    text: 'font-extrabold tracking-tighter italic', // Chaotic font style
    border: 'border-yellow-400'
  } : {
    primary: 'bg-blue-800',
    secondary: 'bg-red-700',
    text: 'font-sans font-semibold tracking-normal', // Clean CNN style
    border: 'border-white'
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20 overflow-hidden">
      
      {/* --- TOP ROW: Live Bug & Location --- */}
      <div className="flex justify-between items-start p-6">
        <div className="flex flex-col gap-2">
          {/* LIVE Badge */}
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 w-fit rounded animate-pulse shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            LIVE BROADCAST
          </div>
          {/* Location Badge */}
          <div className="bg-black/60 text-white text-sm font-mono px-2 py-1 backdrop-blur-md uppercase border-l-4 border-red-500">
            📍 {location}
          </div>
        </div>

        {/* Channel Logo (Top Right) */}
        <div className="text-right opacity-80">
          <h2 className={`text-2xl text-white ${isGoofy ? 'font-black text-yellow-300 -rotate-3' : 'font-bold tracking-widest'}`}>
            {isGoofy ? 'VIBE CHECK ✨' : 'NEWSCASTER AI'}
          </h2>
          <p className="text-white/70 text-xs uppercase">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* --- BOTTOM ROW: Lower Thirds & Ticker --- */}
      <div className="flex flex-col">
        
        {/* LOWER THIRD (Headline) */}
        <div className="flex items-end">
          <div className="w-[85%] mb-4 ml-6">
            {/* Category Tag */}
            <div className={`${colors.secondary} text-white text-xs font-bold px-3 py-1 inline-block uppercase tracking-wider transform -skew-x-12`}>
              {isGoofy ? '🔥 HOT TEA' : 'BREAKING NEWS'}
            </div>
            {/* Main Headline */}
            <div className={`${colors.primary} text-white p-4 shadow-xl border-l-8 ${colors.border} bg-opacity-95 backdrop-blur-sm`}>
              <h1 className={`text-2xl md:text-3xl text-white uppercase leading-none drop-shadow-md ${colors.text}`}>
                {headline}
              </h1>
            </div>
          </div>
        </div>

        {/* TICKER TAPE (Scrolling Text) */}
        <div className="w-full bg-black/90 border-t-2 border-red-600 h-10 flex items-center overflow-hidden relative">
          {/* Static Label */}
          <div className="bg-red-600 h-full px-4 flex items-center justify-center z-10 font-bold text-white text-xs whitespace-nowrap shadow-xl">
            LATEST UPDATES
          </div>
          
          {/* Scrolling Text */}
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap absolute">
              <span className="text-white font-mono text-sm mx-4">
                {tickerText} • {tickerText} • {tickerText} • {tickerText} • {tickerText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

