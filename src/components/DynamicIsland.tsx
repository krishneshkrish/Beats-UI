'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Compass, 
  BarChart2, 
  Milestone, 
  Smile, 
  Search, 
  User, 
  Music,
  SkipBack,
  SkipForward,
  Play,
  Pause
} from 'lucide-react';
import { useNavigationStore, usePlayerStore } from '@/store/useStore';

const NAV_ITEMS = [
  { id: 'Home', label: 'Home', icon: Home },
  { id: 'Player', label: 'Player', icon: Music },
  { id: 'Discover', label: 'Discover', icon: Compass },
  { id: 'Analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'Journey', label: 'Journey', icon: Milestone },
  { id: 'Moods', label: 'Moods', icon: Smile },
  { id: 'Search', label: 'Search', icon: Search },
  { id: 'Profile', label: 'Profile', icon: User },
];

export default function DynamicIsland() {
  const { activeTab, setActiveTab } = useNavigationStore();
  const { currentSong, isPlaying, togglePlay, nextTrack, prevTrack } = usePlayerStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaybackPill, setShowPlaybackPill] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Close expansion when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Playback pill active duration timer logic (persists 5 minutes if paused)
  useEffect(() => {
    if (currentSong) {
      if (isPlaying) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setShowPlaybackPill(true);
      } else {
        // Paused: set 5 min auto-collapse timer
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            setShowPlaybackPill(false);
            timerRef.current = null;
          }, 5 * 60 * 1000);
        }
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowPlaybackPill(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentSong]);

  const getActiveIcon = () => {
    const item = NAV_ITEMS.find((n) => n.id === activeTab);
    const IconComponent = item ? item.icon : Home;
    return <IconComponent className="w-5 h-5 text-[#F5F5F7]" />;
  };

  const handleDragEnd = (event: any, info: any) => {
    // Require a more deliberate swipe/drag (e.g. 35px vertical, 45px horizontal)
    if (info.offset.y < -35 || Math.abs(info.offset.x) > 45) {
      setIsExpanded(true);
    }
  };

  // spring transition settings
  const springTransition = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 select-none">
      <motion.div
        ref={containerRef}
        layout
        drag={!isExpanded}
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        transition={springTransition}
        onMouseEnter={() => {
          // Only auto-expand on hover if playback controls are not showing
          if (!showPlaybackPill) {
            setIsExpanded(true);
          }
        }}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => {
          // Clicking anywhere on the background expands it
          setIsExpanded(true);
        }}
        className="glass-nav rounded-full h-14 flex items-center pointer-events-auto cursor-pointer overflow-hidden shadow-2xl transition-all duration-300"
        style={{
          width: isExpanded 
            ? 'min(100%, 620px)' 
            : showPlaybackPill ? '280px' : '64px',
        }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-around w-full px-4 md:px-6 h-full"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent closing immediately if nested
                      setActiveTab(item.id);
                    }}
                    className="flex flex-col items-center justify-center relative py-2 px-3 group outline-none rounded-full transition-colors duration-200"
                    aria-label={`Navigate to ${item.label}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="slidingNavHighlight"
                        className="absolute inset-0 bg-white/12 border border-white/15 rounded-full -z-10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.4)] backdrop-blur-md"
                        transition={springTransition}
                      />
                    )}
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 relative z-10 ${isActive ? 'text-[#FF3B30]' : 'text-white/60'}`} />
                    <span className="text-[10px] tracking-wide mt-1 font-semibold font-sans text-white/50 group-hover:text-white transition-colors duration-200 text-glass hidden md:inline relative z-10">
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeDot"
                        className="w-1 h-1 bg-[#FF3B30] rounded-full absolute bottom-1 z-10"
                        transition={springTransition}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          ) : showPlaybackPill ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between w-full px-4 h-full"
            >
              {/* Left Side: Art & Waveform */}
              <div 
                className="flex items-center space-x-2 group/art"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('Player');
                }}
                title="Open Player"
              >
                {currentSong && (
                  <img
                    src={currentSong.artwork}
                    alt={currentSong.title}
                    className="w-8 h-8 rounded-md object-cover border border-white/10 group-hover/art:scale-105 transition duration-200"
                  />
                )}
                
                {/* Waveform visualizer */}
                <div className="flex items-end space-x-[2px] h-4 w-6">
                  <span className="w-[2px] bg-[#FF3B30] rounded-full animate-wave-bar" />
                  <span className="w-[2px] bg-white rounded-full animate-wave-bar animation-delay-200" />
                  <span className="w-[2px] bg-[#FF3B30] rounded-full animate-wave-bar animation-delay-400" />
                </div>
              </div>

              {/* Center Side: Playback Controls */}
              <div 
                className="flex items-center space-x-3" 
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={prevTrack}
                  className="text-white/40 hover:text-white transition p-1"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-3.5 h-3.5 fill-current" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm"
                  aria-label="Play or Pause"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 fill-current text-black" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-black translate-x-[0.5px]" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="text-white/40 hover:text-white transition p-1"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Right Side: Active Nav Destination Icon */}
              <div 
                className="flex items-center space-x-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                <div className="w-[1px] h-5 bg-white/10" />
                <div className="relative p-1">
                  {getActiveIcon()}
                  <span className="absolute -top-[1px] -right-[1px] w-[5px] h-[5px] bg-[#FF3B30] rounded-full" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center w-full h-full"
            >
              <div className="relative p-2 flex items-center justify-center">
                {getActiveIcon()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
