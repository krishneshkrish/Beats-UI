'use client';

import { useEffect, useState } from 'react';
import { Play, Sparkles, Flame, Calendar, Music } from 'lucide-react';
import { usePlayerStore } from '@/store/useStore';
import { getAiRecommendations, getRecommendations } from '@/lib/api';
import { Song } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface FeaturedItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  artwork: string;
}

const FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: 'f1',
    title: 'Cognitive Flow Synapses',
    tagline: 'AI engineered frequencies for absolute focus and spatial coding.',
    category: 'FEATURED SPOTLIGHT',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80'
  },
  {
    id: 'f2',
    title: 'Sunset Velvet Waves',
    tagline: 'Warm acoustic jazz lofi blends curated for evening relaxation.',
    category: 'EDITORIAL CHOICE',
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  }
];

export default function DiscoverView() {
  const { playTrack } = usePlayerStore();
  const { username } = useAuth();
  const [aiPicks, setAiPicks] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscoverData() {
      try {
        setLoading(true);
        const [aiRes, trendRes] = await Promise.all([
          getAiRecommendations('discover'),
          getRecommendations('Chill', 6, username) // pull chill songs as placeholders for trending
        ]);
        setAiPicks(aiRes);
        setTrending(trendRes);
      } catch (error) {
        console.error('Failed to load discover page data', error);
      } finally {
        setLoading(false);
      }
    }
    loadDiscoverData();
  }, [username]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      {/* Editorial Featured Section */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glass mb-6">Discover</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden glass-card border-white/10 group cursor-pointer shadow-xl hover:shadow-2xl transition duration-500"
            >
              <img
                src={item.artwork}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-103"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-left space-y-2">
                <span className="text-[10px] font-bold tracking-widest text-[#FF3B30] uppercase">
                  {item.category}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-glass text-white leading-tight">
                  {item.title}
                </h2>
                <p className="text-xs text-white/60 font-light leading-relaxed max-w-sm">
                  {item.tagline}
                </p>
              </div>
              
              {/* Play Hover Button */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition duration-300">
                <div className="w-10 h-10 rounded-full glass-card border-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white translate-x-[0.5px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-12">
        
        {/* Section: AI Picks */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-[#FF3B30]" />
            <h2 className="text-2xl font-bold tracking-tight text-glass">AI Picks</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                  <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                  <div className="h-3.5 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
              ))
            ) : aiPicks.length === 0 ? (
              <div className="col-span-full py-10 text-center glass-card rounded-2xl p-6">
                <p className="text-sm text-white/40">No recommendations found.</p>
              </div>
            ) : (
              aiPicks.map((song) => (
                <div
                  key={song.id + '-ai-pick'}
                  onClick={() => playTrack(song, aiPicks)}
                  className="group cursor-pointer text-left space-y-2"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden glass-card border-white/5 shadow-md">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="object-cover w-full h-full transform transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-10 h-10 rounded-full glass-card border-white/25 flex items-center justify-center transform scale-90 group-hover:scale-100 transition">
                        <Play className="w-4 h-4 fill-white text-white translate-x-[1px]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs truncate text-white/95 text-glass group-hover:text-[#FF3B30] transition duration-200">
                      {song.title}
                    </h4>
                    <p className="text-[10px] text-white/40 truncate font-light mt-0.5">{song.artist}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Two Column Section: New Releases & Emerging Artists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* New Releases */}
          <div className="glass-card rounded-3xl p-6 border-white/5">
            <h3 className="text-xl font-bold tracking-tight text-glass mb-6 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#FF3B30]" />
              <span>New Releases</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 py-1 animate-pulse">
                    <div className="w-12 h-12 bg-white/5 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 bg-white/5 rounded" />
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))
              ) : trending.slice(0, 4).map((song) => (
                <div
                  key={song.id + '-new-release'}
                  onClick={() => playTrack(song, trending)}
                  className="flex items-center space-x-3 cursor-pointer group hover:bg-white/5 p-1 rounded-xl transition duration-200"
                >
                  <img src={song.artwork} alt={song.title} className="w-12 h-12 object-cover rounded-xl" />
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white/95 group-hover:text-[#FF3B30] transition truncate text-glass">
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/40 font-light truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Artists */}
          <div className="glass-card rounded-3xl p-6 border-white/5">
            <h3 className="text-xl font-bold tracking-tight text-glass mb-6 flex items-center space-x-2">
              <Flame className="w-5 h-5 text-[#FF3B30]" />
              <span>Emerging Artists</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 py-1 animate-pulse">
                    <div className="w-12 h-12 bg-white/5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 bg-white/5 rounded" />
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))
              ) : trending.slice(2, 6).map((song) => (
                <div
                  key={song.id + '-emerging'}
                  onClick={() => playTrack(song, trending)}
                  className="flex items-center space-x-3 cursor-pointer group hover:bg-white/5 p-1 rounded-xl transition duration-200"
                >
                  <img src={song.artwork} alt={song.artist} className="w-12 h-12 object-cover rounded-full border border-white/5" />
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white/95 group-hover:text-[#FF3B30] transition truncate text-glass">
                      {song.artist}
                    </h4>
                    <p className="text-xs text-white/40 font-light truncate">Featured Single: {song.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
