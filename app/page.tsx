'use client';

import { useState } from 'react';
import BroadcastOverlay from '@/components/BroadcastOverlay';
import NewsSlideshow, { NewsSegment } from '@/components/NewsSlideshow'; 

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<NewsSegment[]>([]);
  const [vibe, setVibe] = useState<'professional' | 'goofy'>('professional');
  
  // Controls
  const [location, setLocation] = useState('sf'); // 'sf' or 'wi'
  const [topic, setTopic] = useState('tech');     // 'tech' or 'sports'
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Sync State: Which slide is active?
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    setIsPlaying(false);
    setSegments([]); // Clear previous
    setCurrentSlideIndex(0);

    // Illusion of Choice Logic
    const safeLocationId = location === 'sf' ? 'sf-tech' : 'wi-sports';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId: safeLocationId, vibe }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setSegments(data.segments);
      setIsPlaying(true);
      
    } catch (e) {
      console.error(e);
      alert("Generation failed. Check console.");
    }
    setLoading(false);
  };

  // Helper to get dynamic headline for the Overlay
  const getCurrentHeadline = () => {
    if (segments.length > 0 && segments[currentSlideIndex]) {
      return segments[currentSlideIndex].headline;
    }
    // Default / Loading State Headlines
    if (loading) return "GENERATING BROADCAST...";
    return location === 'sf' ? "SAN FRANCISCO TECH REPORT" : "WISCONSIN SPORTS UPDATE";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 md:p-10">
      <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter">
        NEWSCASTER<span className="text-white">.AI</span>
      </h1>

      <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-6xl border border-gray-800 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Location & Topic */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Region</label>
              <select 
                className="w-full mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="sf">San Francisco, CA</option>
                <option value="wi">Madison, WI</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic</label>
              <select 
                className="w-full mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="tech">Tech & Innovation</option>
                <option value="sports">Sports & Local</option>
              </select>
            </div>
          </div>

          {/* Vibe Select */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Production Style</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={() => setVibe('professional')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1
                  ${vibe === 'professional' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-gray-800 border-transparent text-gray-400'}`}
              >
                <span className="text-xl">👔</span>
                <span className="font-bold text-sm">Professional</span>
              </button>
              <button 
                onClick={() => setVibe('goofy')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1
                  ${vibe === 'goofy' ? 'bg-pink-900/50 border-pink-500 text-pink-200' : 'bg-gray-800 border-transparent text-gray-400'}`}
              >
                <span className="text-xl">🤡</span>
                <span className="font-bold text-sm">Goofy</span>
              </button>
            </div>
          </div>

          {/* Go Live Button */}
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-transform active:scale-95
              ${loading 
                ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
          >
            {loading ? "PRODUCING..." : "🔴 GO LIVE"}
          </button>
        </div>

        {/* RIGHT COLUMN: The Broadcast Screen */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border-4 border-gray-800 ring-1 ring-gray-700">
            
            {/* LAYER 1: Slideshow */}
            {segments.length > 0 ? (
               <NewsSlideshow 
                 segments={segments}
                 isPlaying={isPlaying}
                 onIndexChange={setCurrentSlideIndex} 
               />
            ) : (
               <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center text-gray-600 space-y-4">
                 <div className={`w-16 h-16 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin ${loading ? '' : 'hidden'}`}></div>
                 <p className="font-mono text-sm tracking-[0.2em]">{loading ? "GENERATING ASSETS..." : "OFF AIR"}</p>
               </div>
            )}

            {/* LAYER 2: Overlay */}
            {segments.length > 0 && (
              <BroadcastOverlay 
                vibe={vibe} 
                location={location === 'sf' ? 'San Francisco, CA' : 'Madison, WI'}
                headline={getCurrentHeadline()}
                tickerText={
                  vibe === 'goofy' 
                    ? "OMG did you see that?! 💀 // No Cap this AI is crazy // Follow for more tea ☕️" 
                    : "Market closes up 200 points. // Weather: Clear skies expected. // Dow Jones hits record high."
                }
              />
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
