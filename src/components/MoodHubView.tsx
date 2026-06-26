'use client';

import { useState } from 'react';
import { 
  Sun, 
  Wind, 
  Target, 
  Zap, 
  Moon, 
  CloudRain, 
  Sparkles, 
  Plane,
  Check
} from 'lucide-react';
import { useMoodStore, useNavigationStore } from '@/store/useStore';
import { motion } from 'framer-motion';

interface MoodCard {
  id: string;
  name: string;
  tagline: string;
  icon: any;
  gradient: string;
}

const MOODS: MoodCard[] = [
  {
    id: 'Happy',
    name: 'Happy',
    tagline: 'Sunlight synthesized.',
    icon: Sun,
    gradient: 'from-[#FFCC00]/10 to-transparent'
  },
  {
    id: 'Chill',
    name: 'Chill',
    tagline: 'Heart rate slowing.',
    icon: Wind,
    gradient: 'from-[#5AC8FA]/10 to-transparent'
  },
  {
    id: 'Focus',
    name: 'Focus',
    tagline: 'Distractions muted.',
    icon: Target,
    gradient: 'from-[#4CD964]/10 to-transparent'
  },
  {
    id: 'Workout',
    name: 'Workout',
    tagline: 'Energy levels rising.',
    icon: Zap,
    gradient: 'from-[#FF9500]/10 to-transparent'
  },
  {
    id: 'Night',
    name: 'Night',
    tagline: 'The city sleeps. Your playlist doesn\'t.',
    icon: Moon,
    gradient: 'from-[#5856D6]/10 to-transparent'
  },
  {
    id: 'Sad',
    name: 'Sad',
    tagline: 'Melancholy in stereo.',
    icon: CloudRain,
    gradient: 'from-[#007AFF]/10 to-transparent'
  },
  {
    id: 'Party',
    name: 'Party',
    tagline: 'Frequency maximized.',
    icon: Sparkles,
    gradient: 'from-[#FF2D55]/10 to-transparent'
  },
  {
    id: 'Travel',
    name: 'Travel',
    tagline: 'Miles fading into rhythm.',
    icon: Plane,
    gradient: 'from-[#34AADC]/10 to-transparent'
  }
];

export default function MoodHubView() {
  const { activeMood, setMood } = useMoodStore();
  const { setActiveTab } = useNavigationStore();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSelectMood = async (moodId: string) => {
    try {
      setSyncing(moodId);
      await setMood(moodId);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      <div className="mb-10 text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          VIBE ALIGNMENT
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glass mt-1">
          Mood Hub
        </h1>
        <p className="text-sm text-white/50 font-light mt-2 max-w-xl leading-relaxed">
          Select a frequency. Our neural recommender adapts all recommendation queues instantly based on your mood vector.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = activeMood === mood.id;
          
          return (
            <div
              key={mood.id}
              onClick={() => handleSelectMood(mood.id)}
              className={`glass-card hover:bg-white/10 rounded-[24px] p-6 border-white/5 text-left relative overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between h-44 shadow-lg hover:shadow-2xl group ${
                isActive ? 'border-[#FF3B30]/40 ring-1 ring-[#FF3B30]/20' : ''
              }`}
            >
              
              {/* Backglow color */}
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${mood.gradient} opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
              
              {/* Top Row: Icon and Selection circle */}
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-2xl flex items-center justify-center ${
                  isActive ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-white/5 text-white/60 group-hover:text-white'
                } transition`}>
                  <Icon className="w-5 h-5" />
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeMoodCheck"
                    className="w-6 h-6 rounded-full bg-[#FF3B30] flex items-center justify-center"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                  </motion.div>
                )}
              </div>

              {/* Bottom Row: Info */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight text-white/90 group-hover:text-white transition text-glass">
                  {mood.name}
                </h3>
                <p className="text-xs text-white/40 font-light group-hover:text-white/65 leading-relaxed transition truncate">
                  {syncing === mood.id ? 'Syncing...' : mood.tagline}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Mood CTA */}
      <div className="mt-12 glass-card rounded-3xl p-6 border-white/5 text-center flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="font-semibold text-sm text-white/90">Curious how your choices affect recommendations?</h4>
          <p className="text-xs text-white/40 font-light mt-0.5">Explore the customized dashboard metrics reflecting your mood history.</p>
        </div>
        <button
          onClick={() => setActiveTab('Analytics')}
          className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold tracking-wide uppercase transition self-stretch md:self-auto"
        >
          View Music DNA
        </button>
      </div>

    </div>
  );
}
