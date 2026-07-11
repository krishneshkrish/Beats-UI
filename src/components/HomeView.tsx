'use client';

import { useEffect, useState } from 'react';
import { Play, Shuffle, Disc, Heart, Plus, Music, Sparkles } from 'lucide-react';
import { usePlayerStore, useMoodStore } from '@/store/useStore';
import { getGreeting, getRecommendations, getTrending } from '@/lib/api';
import { Song, GreetingResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';

export default function HomeView() {
  const { activeMood } = useMoodStore();
  const { playTrack, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { username } = useAuth();
  const { recentlyPlayed } = useAudio();

  const [greeting, setGreeting] = useState<GreetingResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [greetRes, recRes, trendRes] = await Promise.all([
          getGreeting(),
          getRecommendations(activeMood, 10, username),
          getTrending(activeMood),
        ]);
        setGreeting(greetRes);
        setRecommendations(recRes);
        setTrending(trendRes);
      } catch (error) {
        console.error('Error loading home view data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeMood, username]);

  const handleContinueListening = () => {
    if (currentSong) {
      togglePlay();
    } else if (recommendations.length > 0) {
      playTrack(recommendations[0], recommendations);
    }
  };

  const handleShuffleFavorites = () => {
    if (recommendations.length > 0) {
      const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleResumePlaylist = () => {
    if (recommendations.length > 0) {
      playTrack(recommendations[0], recommendations);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      {/* 1. Header Greeting Section */}
      <div className="mb-10 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-white/5 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FF3B30] bg-[#FF3B30]/15 px-2 py-0.5 rounded-full">
                Active Mood: {activeMood}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glass mb-2 animate-fade-in">
              {greeting?.message || 'Good Evening'}
            </h1>
            <p className="text-base text-white/50 text-glass max-w-2xl font-light leading-relaxed">
              {greeting?.submessage || 'Elevate your frequency with curated AI mixes.'}
            </p>
          </div>
        )}
      </div>

      {/* 2. Quick Actions Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <button
          onClick={handleContinueListening}
          className="glass-card hover:bg-white/10 transition duration-300 py-4 px-6 rounded-2xl flex items-center justify-between text-left group overflow-hidden glass-shimmer relative"
        >
          <div>
            <h3 className="font-semibold text-sm tracking-wide text-white/95">
              {isPlaying ? 'Pause Playback' : 'Continue Listening'}
            </h3>
            <p className="text-xs text-white/50 truncate max-w-[160px] md:max-w-none">
              {currentSong ? `${currentSong.title} - ${currentSong.artist}` : 'Resume your session'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#FF3B30] transition duration-300 flex items-center justify-center">
            <Play className="w-4 h-4 text-white group-hover:scale-110 transition duration-300" />
          </div>
        </button>

        <button
          onClick={handleShuffleFavorites}
          className="glass-card hover:bg-white/10 transition duration-300 py-4 px-6 rounded-2xl flex items-center justify-between text-left group overflow-hidden glass-shimmer relative"
        >
          <div>
            <h3 className="font-semibold text-sm tracking-wide text-white/95">Shuffle Favorites</h3>
            <p className="text-xs text-white/50">Randomize high frequency tracks</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#FF3B30] transition duration-300 flex items-center justify-center">
            <Shuffle className="w-4 h-4 text-white group-hover:scale-110 transition duration-300" />
          </div>
        </button>

        <button
          onClick={handleResumePlaylist}
          className="glass-card hover:bg-white/10 transition duration-300 py-4 px-6 rounded-2xl flex items-center justify-between text-left group overflow-hidden glass-shimmer relative"
        >
          <div>
            <h3 className="font-semibold text-sm tracking-wide text-white/95">Resume Playlist</h3>
            <p className="text-xs text-white/50">Flow into your active queue</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#FF3B30] transition duration-300 flex items-center justify-center">
            <Disc className="w-4 h-4 text-white group-hover:scale-110 transition duration-300 animate-spin-slow" />
          </div>
        </button>
      </div>

      {/* 3. Recommendations Section */}
      <div className="space-y-12">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-glass">Made For You</h2>
            <span className="text-xs font-medium text-white/40 hover:text-white/80 cursor-pointer transition">
              See All
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square w-full bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                  <div className="h-4 w-3/4 bg-white/5 rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/5 rounded-md animate-pulse" />
                </div>
              ))
            ) : recommendations.length === 0 ? (
              <div className="col-span-full py-10 text-center glass-card rounded-2xl p-6 border-white/5">
                <Music className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No recommended tracks found for mood "{activeMood}".</p>
              </div>
            ) : (
              recommendations.map((song) => (
                <div
                  key={song.id}
                  onClick={() => playTrack(song, recommendations)}
                  className="group cursor-pointer space-y-3 text-left transition duration-300"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden glass-card border-white/5 shadow-lg group-hover:shadow-2xl">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Glass overlay that appears on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full glass-card border-white/20 flex items-center justify-center transform scale-90 group-hover:scale-100 transition duration-300">
                        <Play className="w-5 h-5 fill-white text-white translate-x-[1px]" />
                      </div>
                    </div>
                  </div>

                  <div className="px-1">
                    <h3 className="font-semibold text-sm truncate text-white/90 group-hover:text-[#FF3B30] transition duration-200 text-glass">
                      {song.title}
                    </h3>
                    <p className="text-xs text-white/50 truncate font-light mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Trending Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-glass">Trending Today</h2>
            <span className="text-xs font-medium text-white/40 hover:text-white/80 cursor-pointer transition">
              See All
            </span>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[160px] md:min-w-[200px] space-y-3 flex-shrink-0">
                  <div className="aspect-square w-full bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                  <div className="h-4 w-3/4 bg-white/5 rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/5 rounded-md animate-pulse" />
                </div>
              ))
            ) : trending.length === 0 ? (
              <div className="w-full py-10 text-center glass-card rounded-2xl p-6 border-white/5">
                <Music className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No trending tracks found for mood "{activeMood}".</p>
              </div>
            ) : (
              trending.map((song) => (
                <div
                  key={song.id + '-trend'}
                  onClick={() => playTrack(song, trending)}
                  className="group cursor-pointer space-y-3 text-left transition duration-300 min-w-[160px] md:min-w-[200px] flex-shrink-0"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden glass-card border-white/5 shadow-lg group-hover:shadow-2xl">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Glass overlay that appears on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full glass-card border-white/20 flex items-center justify-center transform scale-90 group-hover:scale-100 transition duration-300">
                        <Play className="w-5 h-5 fill-white text-white translate-x-[1px]" />
                      </div>
                    </div>
                  </div>

                  <div className="px-1">
                    <h3 className="font-semibold text-sm truncate text-white/90 group-hover:text-[#FF3B30] transition duration-200 text-glass">
                      {song.title}
                    </h3>
                    <p className="text-xs text-white/50 truncate font-light mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Recently Played & AI Vibe Match Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recently Played */}
          <div className="glass-card rounded-3xl p-6 border-white/5 relative overflow-hidden">
            <h3 className="text-xl font-bold tracking-tight text-glass mb-4 flex items-center space-x-2">
              <Disc className="w-5 h-5 text-[#FF3B30]" />
              <span>Recently Played</span>
            </h3>
            <div className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 py-3 animate-pulse">
                    <div className="w-10 h-10 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-white/5 rounded" />
                      <div className="h-3 w-1/4 bg-white/5 rounded" />
                    </div>
                  </div>
                ))
              ) : recentlyPlayed.length === 0 ? (
                <div className="py-10 text-center text-white/40 text-sm">
                  Your play history is empty. Start streaming to build your catalog.
                </div>
              ) : (
                recentlyPlayed.map((song) => (
                  <div
                    key={song.id + '-recent'}
                    onClick={() => playTrack(song, recentlyPlayed)}
                    className="flex items-center justify-between py-3 cursor-pointer group hover:bg-white/5 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={song.artwork} alt={song.title} className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 group-hover:text-[#FF3B30] transition truncate max-w-[180px]">
                          {song.title}
                        </h4>
                        <p className="text-xs text-white/50 font-light truncate">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-white/30 font-light">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <Heart className="w-3.5 h-3.5 text-white/20 hover:text-[#FF3B30] hover:fill-[#FF3B30] transition" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Vibe Match */}
          <div className="glass-card rounded-3xl p-6 border-white/5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-glass mb-2 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                <span>AI Vibe Match</span>
              </h3>
              <p className="text-xs text-white/50 font-light mb-4">
                Real-time recommendation vector matching your neural profile.
              </p>
              
              <div className="space-y-4 my-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">{activeMood} Alignment</span>
                    <span className="text-[#FF3B30] font-semibold">96%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#FF3B30] to-[#FF9500] rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>
                
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-white/80 font-light italic leading-relaxed">
                    "AI Suggestion: Your listening pattern indicates high stress-relief response to {activeMood.toLowerCase()} tracks. Queue optimized for deep relaxation."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-white/30 font-light flex items-center justify-between border-t border-white/5 pt-3 mt-4">
              <span>Session: Active</span>
              <span>Updated just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
