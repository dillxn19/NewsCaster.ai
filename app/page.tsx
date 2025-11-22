'use client';

import { useState } from 'react';
import BroadcastOverlay from '@/components/BroadcastOverlay';
import NewsSlideshow, { NewsSegment } from '@/components/NewsSlideshow'; 

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<NewsSegment[]>([]);
  
  // UPDATED: Default to one of your new categories
  const [vibe, setVibe] = useState('professional');
  
  const [location, setLocation] = useState('San Francisco');
  const [topic, setTopic] = useState('AI Technology');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleGenerate = async () => {
    if(!location || !topic) return alert("Please enter inputs");
    setLoading(true);
    setIsPlaying(false);
    setSegments([]);
    setCurrentSlideIndex(0);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, topic, vibe }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSegments(data.segments);
      setIsPlaying(true);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const getCurrentHeadline = () => {
    if (segments.length > 0 && segments[currentSlideIndex]) return segments[currentSlideIndex].headline;
    if (loading) return "INITIALIZING AI PRODUCER...";
    return "BROADCAST STANDBY";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 md:p-10">
      <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter">
        NEWSCASTER<span className="text-white">.AI</span>
      </h1>

      <div className="bg-gray-900 p-6 rounded-3xl shadow-2xl w-full max-w-6xl border border-gray-800 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Region</label>
              <input 
                type="text" 
                className="w-full mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" 
                placeholder="e.g. New York" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Topic</label>
              <input 
                type="text" 
                className="w-full mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" 
                placeholder="e.g. Finance" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
              />
            </div>
          </div>

          {/* UPDATED: DROPDOWN MENU */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Production Style</label>
            <div className="relative mt-2">
              <select 
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full appearance-none bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 font-bold cursor-pointer"
              >
                <option value="professional">👔 Professional</option>
                <option value="goofy">🤡 Goofy</option>
                <option value="cyber">🤖 Cyber</option>
                <option value="elmo">🔴 Elmo</option>
                <option value="pirate">🏴‍☠️ Pirate</option>
              </select>
              {/* Custom Arrow Icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95
              ${loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'}`}
          >
            {loading ? "PRODUCING..." : "🔴 GO LIVE"}
          </button>
        </div>

        {/* RIGHT COLUMN: Broadcast Screen */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl">
            {segments.length > 0 ? (
               <NewsSlideshow segments={segments} isPlaying={isPlaying} onIndexChange={setCurrentSlideIndex} />
            ) : (
               <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center text-gray-600">
                 <div className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-4" hidden={!loading}></div>
                 <p className="font-mono text-sm tracking-widest">{loading ? "SCANNING SATELLITES..." : "SIGNAL LOST"}</p>
               </div>
            )}
            <BroadcastOverlay vibe={vibe as any} location={location.toUpperCase()} headline={getCurrentHeadline()} tickerText="AI LIVE COVERAGE" />
          </div>
        </div>
      </div>
    </main>
  );
}
