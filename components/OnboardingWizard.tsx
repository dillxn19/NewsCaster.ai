import React, { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// --- Firebase Config ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/\//g, '-');

let db: any, auth: any;
if (Object.keys(firebaseConfig).length > 0) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

interface OnboardingProps {
  onComplete: (prefs: any) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false); // New state for button feedback
  const [preferences, setPreferences] = useState({
    location: '',
    topics: [] as string[],
    customTopic: '',
    style: ''
  });
  const [userId, setUserId] = useState<string | null>(null);

  const newsTopics = [
    { id: 'politics', label: 'Politics' },
    { id: 'technology', label: 'Technology' },
    { id: 'sports', label: 'Sports' },
    { id: 'finance', label: 'Finance & Stocks' },
    { id: 'other', label: 'Other' }
  ];

  const newsStyles = [
    { id: 'professional', label: 'Professional', desc: 'Formal and factual' },
    { id: 'goofy', label: 'Goofy', desc: 'Fun and lighthearted' },
    { id: 'elmo', label: 'Elmo', desc: 'Friendly and simple' },
    { id: 'cyber', label: 'Cyber', desc: 'Tech-forward style' },
    { id: 'pirate', label: 'Pirate', desc: 'Arr matey!' }
  ];

  // --- Auth & Load Logic ---
  useEffect(() => {
    if (!db || !auth) return;

    const init = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined') await signInWithCustomToken(auth, __initial_auth_token);
            else await signInAnonymously(auth);
        } catch { await signInAnonymously(auth); }
    };
    init();

    const unsub = auth.onAuthStateChanged((user: any) => {
        if (user) {
            setUserId(user.uid);
            // Try to load existing prefs
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'news-preferences');
            const unsubDoc = onSnapshot(docRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.location) {
                       setPreferences(prev => ({...prev, ...data}));
                       // If data is complete, we could auto-skip, but for demo it's safer to let user click
                    }
                }
            });
            return () => unsubDoc();
        }
    });
    return () => unsub();
  }, []);

  // --- Robust Save Function ---
  const handleLaunch = async () => {
    setSaving(true); // Show "Generating..."
    
    // 1. Try to save to Firebase (Best Effort)
    if (userId && db) {
        try {
            const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'config', 'news-preferences');
            await setDoc(userDocRef, preferences, { merge: true });
        } catch (e) {
            console.warn("Could not save to database, proceeding anyway.", e);
        }
    }

    // 2. ALWAYS complete the onboarding, even if DB fails
    // Small delay to show the "Generating..." state for effect
    setTimeout(() => {
        onComplete(preferences);
    }, 800); 
  };

  const toggleTopic = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      topics: prev.topics.includes(id) ? prev.topics.filter(t => t !== id) : [...prev.topics, id]
    }));
  };

  const canProceed = () => {
    if (step === 0) return preferences.location.trim().length > 0;
    if (step === 1) return preferences.topics.length > 0;
    if (step === 2) return !!preferences.style;
    return false;
  };

  const handleNext = () => {
    if (step === 2) {
        handleLaunch();
    } else {
        setStep(step + 1);
    }
  };

  // --- RESTORED STYLING LOGIC ---
  const getBackgroundClass = (style: string) => {
    switch (style) {
      case 'goofy': return 'bg-gradient-to-br from-orange-50 to-yellow-100';
      case 'elmo': return 'bg-gradient-to-br from-red-50 to-pink-100';
      case 'cyber': return 'bg-gradient-to-br from-blue-50 to-purple-100';
      case 'pirate': return 'bg-gradient-to-br from-yellow-50 to-stone-100';
      default: return 'bg-white';
    }
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-700 ease-in-out ${getBackgroundClass(preferences.style)} flex flex-col items-center pt-16 pb-16 text-gray-800`}
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-red-400 bg-clip-text text-transparent mb-2">
            NEWSCASTER.AI
          </h1>
          <p className="text-gray-500 text-base mt-1">Personalize your news delivery</p>
          
          {/* Progress Dots */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-gray-900 w-10' : s < step ? 'bg-gray-900 w-3' : 'bg-gray-400 w-3'}`} />
            ))}
          </div>
        </div>

        {/* STEP 0: LOCATION */}
        {step === 0 && (
          <div className="space-y-8 max-w-lg mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-black mb-3">Where are you?</h2>
              <p className="text-gray-600 text-md">Enter your location to receive local and relevant news.</p>
            </div>
            <input
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
              className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors text-xl rounded-t-md bg-transparent text-center"
              placeholder="e.g., San Francisco, CA"
              autoFocus
            />
          </div>
        )}

        {/* STEP 1: TOPICS */}
        {step === 1 && (
          <div className="space-y-8 max-w-lg mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-black mb-3">What interests you?</h2>
              <p className="text-gray-600 text-md">Select one or more topics you'd like to follow.</p>
            </div>
            <div className="space-y-3">
              {newsTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full px-6 py-4 text-left border rounded-xl transition-all ${
                    preferences.topics.includes(topic.id)
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                      : 'border-gray-200 bg-white/50 hover:bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-800">{topic.label}</span>
                    {preferences.topics.includes(topic.id) && <Check className="w-6 h-6 text-gray-900" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: STYLE */}
        {step === 2 && (
          <div className="space-y-8 max-w-lg mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-black mb-3">Choose your tone.</h2>
              <p className="text-gray-600 text-md">Select the personality for your news delivery.</p>
            </div>
            <div className="space-y-3">
              {newsStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setPreferences({ ...preferences, style: style.id })}
                  className={`w-full px-6 py-4 text-left border rounded-xl transition-all ${
                    preferences.style === style.id
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                      : 'border-gray-200 bg-white/50 hover:bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium text-gray-800">{style.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{style.desc}</div>
                    </div>
                    {preferences.style === style.id && <Check className="w-6 h-6 text-gray-900" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER BUTTONS */}
        <div className="flex justify-between items-center mt-16 gap-4 max-w-lg mx-auto">
            {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="flex-shrink-0 px-6 py-3 font-medium text-base tracking-wide text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm bg-white">
                    Back
                </button>
            )}

            <button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className={`w-full py-4 rounded-lg font-semibold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                    canProceed() && !saving
                        ? 'bg-gray-900 text-white hover:bg-black'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {saving ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        INITIALIZING STUDIO...
                    </span>
                ) : (
                    <>
                        {step === 2 ? 'Launch Studio' : 'Continue'}
                        {step < 2 && <ChevronRight className="w-5 h-5" />}
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}