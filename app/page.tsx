'use client';
import { useState, useRef, useEffect } from 'react';
import BroadcastOverlay from '@/components/BroadcastOverlay';
import OnboardingWizard from '@/components/OnboardingWizard'; 

// ==========================================
// 1. SUB-COMPONENT: AVATAR PLAYER
// ==========================================
function AvatarAnchor({ videoUrl, onProgress }: { videoUrl: string, onProgress: (p: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Autoplay blocked:", e));
    }
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = videoRef.current.currentTime / videoRef.current.duration;
    if (!isNaN(progress)) onProgress(progress);
  };

  return (
    // Z-INDEX 50 ensures it sits ON TOP of everything
    <div className="absolute bottom-4 right-4 z-50 w-20 md:w-28 aspect-[9/16] bg-black rounded-lg overflow-hidden border-2 border-green-500 shadow-2xl animate-fade-in-up">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={false} 
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}

// ==========================================
// 2. SUB-COMPONENT: SLIDESHOW 
// ==========================================
function VisualsDisplay({ imageUrl, script }: { imageUrl: string, script: string }) {
  const safeImage = imageUrl || "https://placehold.co/1024x1024/000000/FFF?text=News+Graphic";

  return (
    <div className="relative w-full h-full bg-black group">
      <img 
        key={safeImage} 
        src={safeImage} 
        alt="News Graphic"
        className="absolute inset-0 w-full h-full object-cover animate-ken-burns opacity-90" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
      
      {/* Script Caption */}
      <div className="absolute bottom-20 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <p className="text-white text-lg font-medium drop-shadow-md bg-black/60 p-3 rounded-lg backdrop-blur-sm border-l-4 border-blue-500">
          {script}
         </p>
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN APP COMPONENT
// ==========================================
export default function Home() {
  const [view, setView] = useState<'onboarding' | 'dashboard'>('onboarding'); 
  
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Inputs (Managed by State, Hidden in Dashboard UI)
  const [vibe, setVibe] = useState('professional');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState('');

  // --- HANDLERS ---

  const handleOnboardingComplete = (prefs: any) => {
      console.log("Onboarding Complete:", prefs);
      setLocation(prefs.location || "San Francisco");
      setTopic(prefs.topics?.[0] || "Technology"); 
      setVibe(prefs.style || "professional");
      setView('dashboard');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSegments([]);
    setAvatarUrl(null);
    setCurrentSlideIndex(0);

    try {
      console.log("Sending request to Next.js API...");
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // We use the state variables (location, topic, vibe) that were set during onboarding
        body: JSON.stringify({ location, topic, vibe }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSegments(data.segments || []);
      
      if (data.avatarVideoUrl) {
        setAvatarUrl(data.avatarVideoUrl);
      } else {
        console.warn("No Avatar URL returned (Check Python Console)");
      }

    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleAvatarProgress = (progress: number) => {
    if (!segments || segments.length === 0) return;
    const index = Math.floor(progress * segments.length);
    setCurrentSlideIndex(Math.min(index, segments.length - 1));
  };

  // --- RENDER ---

  if (view === 'onboarding') {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  const currentSegment = segments[currentSlideIndex];

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      
      {/* CLICKABLE TITLE TO RESTART */}
      <div className="text-center mb-8 cursor-pointer group" onClick={() => setView('onboarding')}>
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-105 transition-transform">
          NEWSCASTER<span className="text-white">.AI</span>
        </h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-blue-400 transition-colors">
            Click to Restart Configuration
        </p>
      </div>

      {/* CONTROLS: JUST THE BUTTON */}
      <div className="w-full max-w-6xl mb-6 flex flex-col items-center gap-4">
        
        {/* Static Summary so user knows what they chose */}
        <div className="flex gap-4 text-sm font-mono text-gray-400 uppercase tracking-wider">
            <span>📍 {location}</span>
            <span className="text-gray-600">|</span>
            <span>📰 {topic}</span>
            <span className="text-gray-600">|</span>
            <span>🎭 {vibe}</span>
        </div>

        <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className={`w-full md:w-2/3 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-95 
            ${loading ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]'}`}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> PRODUCING BROADCAST...
                </span>
            ) : (
                "🔴 GO LIVE"
            )}
        </button>
      </div>

      {/* THE BROADCAST SCREEN */}
      <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden border-4 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-gray-700">
        
        {/* Layer 1: Visuals */}
        {currentSegment ? (
           <VisualsDisplay imageUrl={currentSegment.imageUrl} script={currentSegment.script} />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
             {loading && <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
             <div className="text-center">
                <p className="font-mono tracking-[0.2em] text-lg">{loading ? "GENERATING STUDIO ASSETS..." : "BROADCAST STANDBY"}</p>
                {loading && <p className="text-xs mt-2 text-gray-600">Syncing Python Backend & D-ID Render...</p>}
             </div>
           </div>
        )}

        {/* Layer 2: Overlay */}
        <BroadcastOverlay 
          vibe={vibe as any} 
          location={location.toUpperCase()} 
          headline={currentSegment?.headline || "WAITING FOR SIGNAL"} 
          tickerText="LIVE BROADCAST // AI GENERATED MEDIA // REAL-TIME NEWS FEED" 
        />

        {/* Layer 3: Avatar */}
        {avatarUrl && (
          <AvatarAnchor 
            videoUrl={avatarUrl} 
            onProgress={handleAvatarProgress} 
          />
        )}
      </div>

    </main>
  );
}