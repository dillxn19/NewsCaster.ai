import React from 'react';

interface BroadcastOverlayProps {
  vibe: 'professional' | 'goofy' | 'noir' | 'cyber' | 'elmo' | 'pirate';
  location: string;
  headline: string;
  tickerText: string;
}

export default function BroadcastOverlay({ vibe, location, headline, tickerText }: BroadcastOverlayProps) {
  const isGoofy = vibe === 'goofy' || vibe === 'elmo';
  const isCyber = vibe === 'cyber';
  const isNoir = vibe === 'noir';
  const isPirate = vibe === 'pirate';
  
  // Dynamic Styles
  let colors = {
    primary: 'bg-blue-800',
    secondary: 'bg-red-700',
    text: 'font-sans font-bold',
    border: 'border-white'
  };

  if (isGoofy) {
    colors = { primary: 'bg-pink-600', secondary: 'bg-yellow-400', text: 'font-black italic', border: 'border-yellow-400' };
  } else if (isCyber) {
    colors = { primary: 'bg-black/80 border-neon-blue', secondary: 'bg-cyan-600', text: 'font-mono text-cyan-400', border: 'border-cyan-500' };
  } else if (isNoir) {
    colors = { primary: 'bg-gray-900', secondary: 'bg-gray-700', text: 'font-serif tracking-widest', border: 'border-gray-500' };
  } else if (isPirate) {
    colors = { primary: 'bg-amber-900', secondary: 'bg-red-900', text: 'font-serif italic text-amber-100', border: 'border-amber-500' };
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20 overflow-hidden">
      
      {/* TOP ROW */}
      <div className="flex justify-between items-start p-6">
        <div className="flex flex-col gap-2">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 w-fit rounded animate-pulse shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
          </div>
          <div className="bg-black/60 text-white text-sm font-mono px-2 py-1 backdrop-blur-md uppercase border-l-4 border-red-500">
            📍 {location}
          </div>
        </div>
        <div className="text-right opacity-80">
          <h2 className={`text-2xl text-white uppercase ${colors.text}`}>
            {vibe === 'professional' ? 'NEWSCASTER AI' : vibe.toUpperCase() + ' TV'}
          </h2>
          <p className="text-white/70 text-xs uppercase">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex flex-col">
        <div className="flex items-end">
          <div className="w-[85%] mb-4 ml-6">
            <div className={`${colors.secondary} text-white text-xs font-bold px-3 py-1 inline-block uppercase tracking-wider`}>
              BREAKING NEWS
            </div>
            <div className={`${colors.primary} text-white p-4 shadow-xl border-l-8 ${colors.border} bg-opacity-95 backdrop-blur-sm`}>
              <h1 className={`text-2xl md:text-3xl uppercase leading-none drop-shadow-md ${colors.text}`}>
                {headline}
              </h1>
            </div>
          </div>
        </div>

        {/* TICKER */}
        <div className="w-full bg-black/90 border-t-2 border-red-600 h-10 flex items-center overflow-hidden relative">
          <div className="bg-red-600 h-full px-4 flex items-center justify-center z-10 font-bold text-white text-xs whitespace-nowrap shadow-xl">
            LATEST
          </div>
          <div className="animate-marquee whitespace-nowrap pl-full">
            <span className="text-white font-mono text-sm mx-4">
              {tickerText} • {tickerText} • {tickerText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}