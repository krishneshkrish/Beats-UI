'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Heart, 
  ListMusic, 
  AlignLeft,
  Disc,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { usePlayerStore, useMoodStore, useNavigationStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerView() {
  const { setActiveTab } = useNavigationStore();
  const { activeMood } = useMoodStore();
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    isMuted,
    queue,
    isShuffle,
    isRepeat,
    lyricsActiveLine,
    togglePlay,
    nextTrack,
    prevTrack,
    setProgress,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playTrack,
    seekTo
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLyricsCollapsed, setIsLyricsCollapsed] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync lyrics scroll
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [lyricsActiveLine]);

  if (!currentSong) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center font-sans text-[#F5F5F7]">
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative overflow-hidden">
            <Disc className="w-10 h-10 text-white/30 animate-spin-slow" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3B30]/20 to-transparent pointer-events-none" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-glass">No Track Selected</h2>
            <p className="text-sm text-white/40 max-w-sm">
              Your audio canvas is currently silent. Explore recommendations or start a mood set to play.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('Home')}
            className="px-6 py-3 rounded-full bg-[#FF3B30] text-white text-sm font-semibold hover:bg-red-600 transition shadow-lg ripple"
          >
            Explore Home Tracks
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (progress / currentSong.duration) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-4 pb-32 font-sans text-[#F5F5F7] relative min-h-[80vh] flex flex-col justify-between">
      
      {/* Dynamic ambient background blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl pointer-events-none">
        <div 
          className="absolute inset-0 scale-125 blur-[120px] opacity-[0.12] transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentSong.artwork})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 my-auto">
        
        {/* Left Column: Circular Jukebox Artwork & Info */}
        <div className={`flex flex-col items-center text-center space-y-8 transition-all duration-500 ${
          isLyricsCollapsed && !showQueue ? 'lg:col-span-12' : 'lg:col-span-5'
        }`}>
          
          {/* Circular Jukebox container */}
          <div className="relative flex items-center justify-center w-[300px] h-[300px] md:w-[390px] md:h-[390px] [--radial-radius:-142px] md:[--radial-radius:-185px]">
            
            {/* Radial Jukebox Visualizer Ring */}
            <div 
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-1000 animate-spin-slow ${
                isPlaying ? '' : 'animation-paused'
              }`}
              style={{ animationDuration: '40s' }}
            >
              {Array.from({ length: 40 }).map((_, i) => {
                const angle = i * 9;
                const progressThreshold = (i / 40) * 100;
                const isActive = progressPercentage >= progressThreshold;
                
                // Heights variation for dynamic look
                const heights = [8, 14, 20, 10, 26, 12, 16, 8, 18, 12, 32, 14, 10, 22, 16, 8, 12, 20, 28, 14];
                const height = heights[i % heights.length];

                return (
                  <div
                    key={i}
                    className="absolute origin-bottom transition-all duration-300"
                    style={{
                      transform: `rotate(${angle}deg) translateY(var(--radial-radius))`,
                      height: `${height}px`,
                      width: '3px',
                    }}
                  >
                    <motion.div
                      className={`w-full h-full rounded-full ${
                        isActive 
                          ? 'bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.7)]' 
                          : 'bg-white/20'
                      }`}
                      animate={{
                        scaleY: isPlaying ? [0.6, 1.4, 0.6] : 1,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9 + (i % 3) * 0.2,
                        ease: 'easeInOut',
                        delay: (i % 4) * 0.12,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Droplet Artwork Card (squishy droplet design) */}
            <div className="relative w-56 h-56 md:w-72 md:h-72 droplet-glass flex items-center justify-center p-3.5 shadow-2xl group cursor-pointer z-10 hover:scale-[1.02]">
              <img
                src={currentSong.artwork}
                alt={currentSong.title}
                className={`object-cover w-full h-full rounded-full transition-transform duration-700 group-hover:scale-103 animate-spin-slow ${
                  isPlaying ? '' : 'animation-paused'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none rounded-full" />
            </div>

          </div>

          <div className="space-y-1.5 max-w-sm relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-glass truncate w-72 md:w-96 px-4">
              {currentSong.title}
            </h1>
            <p className="text-base text-white/50 font-light truncate">
              {currentSong.artist} • {currentSong.album}
            </p>
          </div>

          {/* Karaoke floating lyric pill when collapsed */}
          {isLyricsCollapsed && !showQueue && currentSong.lyrics && currentSong.lyrics[lyricsActiveLine] && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="glass-card px-8 py-4 rounded-2xl max-w-lg text-center border-white/10 shadow-xl cursor-pointer hover:bg-white/10 transition mt-4 z-10 group/karaoke relative overflow-hidden"
              onClick={() => setIsLyricsCollapsed(false)}
            >
              {/* Shimmer on karaoke pill */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/karaoke:animate-shimmer transition-transform" />
              <p className="text-base md:text-lg font-semibold tracking-tight text-white text-glass leading-relaxed">
                {currentSong.lyrics[lyricsActiveLine]}
              </p>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1.5 opacity-0 group-hover/karaoke:opacity-100 transition-opacity">
                Click to expand lyrics
              </div>
            </motion.div>
          )}

          {/* Expanded trigger helper if collapsed and instrumental */}
          {isLyricsCollapsed && !showQueue && (!currentSong.lyrics || currentSong.lyrics.length === 0) && (
            <button
              onClick={() => setIsLyricsCollapsed(false)}
              className="glass-card px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white transition z-10"
            >
              Expand Lyrics
            </button>
          )}

        </div>

        {/* Right Column: Synced Lyrics OR Queue List */}
        <div className={`h-[320px] md:h-[450px] flex flex-col relative transition-all duration-500 ${
          isLyricsCollapsed && !showQueue ? 'hidden' : 'lg:col-span-7'
        }`}>
          
          {/* Tabs for Lyrics / Queue / Collapse */}
          <div className="flex space-x-3 mb-4 justify-end items-center">
            
            {/* Collapse button */}
            {!showQueue && (
              <button
                onClick={() => setIsLyricsCollapsed(true)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white transition"
                title="Collapse lyrics"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setShowQueue(false);
                setIsLyricsCollapsed(false);
              }}
              className={`text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full transition flex items-center space-x-1.5 ${
                !showQueue ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Synced Lyrics</span>
            </button>
            <button
              onClick={() => {
                setShowQueue(true);
                setIsLyricsCollapsed(false);
              }}
              className={`text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full transition flex items-center space-x-1.5 ${
                showQueue ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Up Next ({queue.length})</span>
            </button>
          </div>

          <div className="flex-1 glass-card rounded-3xl p-6 border-white/5 relative overflow-hidden flex flex-col">
            
            <AnimatePresence mode="wait">
              {!showQueue ? (
                // Lyrics Viewer
                <motion.div
                  key="lyrics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  ref={lyricsContainerRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-6 scroll-smooth select-none py-10"
                >
                  {currentSong.lyrics && currentSong.lyrics.length > 0 ? (
                    currentSong.lyrics.map((line, index) => {
                      const isActive = lyricsActiveLine === index;
                      return (
                        <div
                          key={index}
                          ref={isActive ? activeLineRef : null}
                          className={`text-lg md:text-xl font-semibold tracking-tight transition-all duration-300 ${
                            isActive 
                              ? 'text-white scale-100 opacity-100 text-glass filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] font-bold' 
                              : 'text-white/35 scale-95 opacity-60 font-medium'
                          }`}
                        >
                          {line}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/30 text-sm">
                      Instrumental. Syncing frequencies.
                    </div>
                  )}
                </motion.div>
              ) : (
                // Queue Viewer
                <motion.div
                  key="queue"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-y-auto pr-2 divide-y divide-white/5"
                >
                  {queue.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/30 text-sm">
                      Queue is empty
                    </div>
                  ) : (
                    queue.map((song, i) => {
                      const isCurrent = currentSong.id === song.id;
                      return (
                        <div
                          key={song.id + '-queue-item'}
                          onClick={() => playTrack(song, queue)}
                          className={`flex items-center justify-between py-3 cursor-pointer hover:bg-white/5 px-2 rounded-xl transition ${
                            isCurrent ? 'bg-[#FF3B30]/10 border border-[#FF3B30]/20' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <img src={song.artwork} alt={song.title} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="text-left">
                              <h4 className={`text-sm font-semibold truncate max-w-[180px] ${
                                isCurrent ? 'text-[#FF3B30]' : 'text-white/90'
                              }`}>
                                {song.title}
                              </h4>
                              <p className="text-xs text-white/40 font-light truncate">{song.artist}</p>
                            </div>
                          </div>
                          <span className="text-xs text-white/30 font-light">
                            {formatTime(song.duration)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>
      </div>

      {/* Floating Liquid Glass Control Panel */}
      <div className="glass-card rounded-[32px] p-6 border-white/10 mt-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        
        {/* Timeline Slider */}
        <div className="space-y-2 mb-6">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={currentSong.duration || 100}
              value={progress}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setProgress(val);
                seekTo(val);
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none bg-white/10 accent-[#FF3B30]"
              style={{
                background: `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${progressPercentage}%, rgba(255,255,255,0.1) ${progressPercentage}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
          
          <div className="flex justify-between text-[11px] text-white/40 font-semibold tracking-wide">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentSong.duration)}</span>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Shuffle & Repeat & Favorite */}
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition ${
                isShuffle ? 'text-[#FF3B30] bg-[#FF3B30]/10' : 'text-white/40 hover:text-white/80'
              }`}
              aria-label="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition relative ${
                isRepeat !== 'none' ? 'text-[#FF3B30] bg-[#FF3B30]/10' : 'text-white/40 hover:text-white/80'
              }`}
              aria-label="Repeat"
            >
              <Repeat className="w-5 h-5" />
              {isRepeat === 'one' && (
                <span className="absolute bottom-[2px] right-[2px] text-[8px] bg-[#FF3B30] text-white font-bold leading-none rounded-full px-0.5">1</span>
              )}
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition ${
                isFavorite ? 'text-[#FF3B30] bg-[#FF3B30]/10' : 'text-white/40 hover:text-white/80'
              }`}
              aria-label="Favorite"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#FF3B30]' : ''}`} />
            </button>
          </div>

          {/* Center Playback controls */}
          <div className="flex items-center space-x-6">
            <button
              onClick={prevTrack}
              className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition"
              aria-label="Previous Track"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:bg-[#F5F5F7] active:scale-95 transition shadow-lg ripple"
              aria-label="Play or Pause"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current text-black" />
              ) : (
                <Play className="w-6 h-6 fill-current text-black translate-x-[2px]" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition"
              aria-label="Next Track"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Right Volume sliders */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={toggleMute}
              className="p-2 text-white/50 hover:text-white transition"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-[#FF3B30]" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
              }}
              className="w-full md:w-28 h-1 rounded-full appearance-none cursor-pointer outline-none bg-white/10 accent-[#FF3B30]"
              style={{
                background: `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>

        </div>
      </div>

    </div>
  );
}
