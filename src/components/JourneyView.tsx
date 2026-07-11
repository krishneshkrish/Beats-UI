'use client';

import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Sunset, 
  Sunrise, 
  Moon, 
  Coffee, 
  Map, 
  Music,
  Award,
  Play
} from 'lucide-react';
import { getJourneyTimeline } from '@/lib/api';
import { usePlayerStore } from '@/store/useStore';
import { TimelineItem } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function JourneyView() {
  const { playTrack } = usePlayerStore();
  const { username } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    async function loadJourney() {
      try {
        setLoading(true);
        const res = await getJourneyTimeline(username);
        setTimeline(res);
      } catch (err) {
        console.error('Failed to load journey timeline', err);
      } finally {
        setLoading(false);
      }
    }
    loadJourney();
  }, [username]);

  const getSectionIcon = (label: string) => {
    switch (label) {
      case 'Morning Sessions':
        return <Sunrise className="w-4 h-4 text-amber-300" />;
      case 'Afternoon Focus':
        return <Coffee className="w-4 h-4 text-emerald-400" />;
      case 'Evening Vibes':
        return <Sunset className="w-4 h-4 text-rose-400" />;
      case 'Late Night':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Coffee className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      <div className="mb-10 text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          HISTORY TIMELINE
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glass mt-1">
          Your Music Journey
        </h1>
        <p className="text-sm text-white/50 font-light mt-2 max-w-xl leading-relaxed">
          An emotional narrative log of your frequencies. Explore milestones, streaks, and discovery chapters.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border-white/5 h-28" />
          ))}
        </div>
      ) : timeline.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 border-white/5 animate-fade-in">
          <Map className="w-10 h-10 text-white/25 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-white/85 text-glass">Your Journey Begins</h3>
          <p className="text-sm text-white/50 max-w-xs mx-auto mt-2 font-light">
            Your journey begins with the first song.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-10 border-l border-white/10 space-y-12 text-left">
          
          {timeline.map((item) => (
            <div key={item.id} className="relative group">
              
              {/* Vertical timeline node dot */}
              <span className="absolute -left-[31px] md:-left-[47px] top-1.5 w-[11px] h-[11px] rounded-full bg-white/20 border-2 border-black group-hover:bg-[#FF3B30] group-hover:scale-125 transition duration-300 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
              
              {/* Group session label */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="p-1 rounded bg-white/5 flex items-center justify-center">
                  {getSectionIcon(item.timeLabel)}
                </span>
                <span className="text-xs font-bold text-white/40 tracking-wider uppercase">
                  {item.timeLabel} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Milestone Card */}
              {item.isMilestone && (
                <div className="mb-4 glass-card rounded-2xl p-4 border-[#FF3B30]/30 relative overflow-hidden bg-gradient-to-r from-[#FF3B30]/10 to-transparent flex items-center space-x-3 shadow-md animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-[#FF3B30]/20 flex items-center justify-center border border-[#FF3B30]/30">
                    <Award className="w-4 h-4 text-[#FF3B30]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF3B30]">
                      Milestone Cleared
                    </h4>
                    <p className="text-sm font-semibold text-white/90 mt-0.5">
                      {item.milestoneText}
                    </p>
                  </div>
                  <div className="absolute right-3 opacity-10 pointer-events-none">
                    <Sparkles className="w-20 h-20 text-[#FF3B30]" />
                  </div>
                </div>
              )}

              {/* Song Log Card */}
              <div 
                onClick={() => playTrack(item.song, timeline.map(t => t.song))}
                className="glass-card hover:bg-white/10 transition duration-300 rounded-3xl p-5 border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer shadow-lg relative overflow-hidden group/song"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden glass-card border-white/10 flex-shrink-0">
                    <img src={item.song.artwork} alt={item.song.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/song:opacity-100 transition duration-300 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white translate-x-[0.5px]" />
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-[#FF3B30] uppercase bg-[#FF3B30]/15 px-2 py-0.5 rounded-full inline-block mb-1">
                      {item.moodTag}
                    </span>
                    <h3 className="font-semibold text-base text-white/90 group-hover/song:text-[#FF3B30] transition duration-200 text-glass">
                      {item.song.title}
                    </h3>
                    <p className="text-xs text-white/40 font-light mt-0.5">
                      {item.song.artist} • {item.song.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-white/30 font-semibold self-end md:self-auto">
                  <span>Logged {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <Music className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
