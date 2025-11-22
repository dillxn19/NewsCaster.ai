'use client';

import { useState, useRef, useEffect } from 'react';

export interface NewsSegment {
  headline: string;
  script: string;
  audioUrl: string;
  imageUrl: string;
}

interface NewsSlideshowProps {
  segments: NewsSegment[];
  isPlaying: boolean;
  onIndexChange: (index: number) => void; // Callback for parent
}

export default function NewsSlideshow({ segments, isPlaying, onIndexChange }: NewsSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentSegment = segments[currentIndex];

  // 1. Reset when new segments arrive
  useEffect(() => {
    setCurrentIndex(0);
    onIndexChange(0);
  }, [segments, onIndexChange]);

  // 2. Notify parent when index changes internally
  useEffect(() => {
    onIndexChange(currentIndex);
  }, [currentIndex, onIndexChange]);

  // 3. Playback Logic
  useEffect(() => {
    if (!audioRef.current || !currentSegment || !isPlaying) return;

    audioRef.current.src = currentSegment.audioUrl;
    
    // Attempt play
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => console.error("Auto-play prevented:", error));
    }

    const handleAudioEnd = () => {
      if (currentIndex < segments.length - 1) {
        // Next Slide
        setCurrentIndex(prev => prev + 1);
      } else {
        // End of Broadcast
        console.log("Broadcast complete");
      }
    };

    const audioEl = audioRef.current;
    audioEl.addEventListener('ended', handleAudioEnd);

    return () => {
      audioEl.removeEventListener('ended', handleAudioEnd);
      audioEl.pause();
    };
  }, [currentIndex, currentSegment, isPlaying, segments.length]);

  if (!currentSegment) return <div className="bg-black w-full h-full" />;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* Dynamic Image with Ken Burns Effect */}
      <img
        key={currentSegment.imageUrl} 
        src={currentSegment.imageUrl}
        alt="News visual"
        className="absolute inset-0 w-full h-full object-cover animate-ken-burns opacity-90"
      />
      
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

      {/* Hidden Audio Controller */}
      <audio ref={audioRef} className="hidden" />

      {/* Optional Caption (Script) */}
      <div className="absolute bottom-20 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <p className="text-white text-sm md:text-lg font-medium drop-shadow-md bg-black/60 p-3 rounded-lg backdrop-blur-sm border-l-4 border-blue-500">
          {currentSegment.script}
         </p>
      </div>
    </div>
  );
}
