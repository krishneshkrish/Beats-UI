'use client';

import { useEffect, useState } from 'react';
import { Search, X, Play, Music, Sparkles, Flame } from 'lucide-react';
import { usePlayerStore, useMoodStore } from '@/store/useStore';
import { searchMedia, getTrending, api } from '@/lib/api';
import { Song } from '@/types';

export default function SearchView() {
  const { activeMood } = useMoodStore();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'youtube' | 'soundcloud'>('youtube');
  const [results, setResults] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('beats_recent_searches');
        if (cached) {
          setRecentSearches(JSON.parse(cached));
        }
      } catch (err) {
        console.error('Failed to load recent searches', err);
      }
    }
  }, []);

  const saveSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 5);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('beats_recent_searches', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeSearch = (searchQuery: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter(s => s !== searchQuery);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('beats_recent_searches', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Load trending suggestions when search query is empty
  useEffect(() => {
    if (!query.trim()) {
      let active = true;
      const loadTrending = async () => {
        try {
          setLoading(true);
          const trendSongs = await getTrending(activeMood);
          if (active) {
            setTrending(trendSongs);
            setResults([]);
          }
        } catch (err) {
          console.error('Failed to load trending suggestions', err);
        } finally {
          if (active) setLoading(false);
        }
      };
      loadTrending();
      return () => {
        active = false;
      };
    }
  }, [query, activeMood]);

  // Debounced search when query or source changes
  useEffect(() => {
    if (!query.trim()) return;

    setLoading(true);
    const delay = setTimeout(async () => {
      try {
        const searchRes = await searchMedia(query, source, 6);
        setResults(searchRes || []);
      } catch (err) {
        console.error('Failed to search media', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [query, source]);

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mm = Math.floor(seconds / 60);
    const ss = Math.round(seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handlePlay = async (song: Song, allResults: Song[]) => {
    saveSearch(query);
    // Play the song immediately — don't wait for queue
    usePlayerStore.getState().playTrack(song, [song]);

    // Fetch vibe-matched queue in background silently
    try {
      const response = await api.get(`/api/yt/queue`, {
        params: { 
          video_id: song.id, 
          title: song.title,
          artist: song.artist,
          limit: 8 
        }
      });
      usePlayerStore.getState().setQueue([song, ...response.data]);
    } catch (e) {
      console.error('Queue fetch failed', e);
    }
  };

  const displaySongs = query.trim() ? results : trending;
  const isSearching = query.trim().length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      {/* 1. Glass Search Input Bar */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-xl h-14 rounded-full transition-all duration-300">
          <div className="absolute inset-0 rounded-full glass-card border-white/10 pointer-events-none" />
          
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />
          
          <input
            type="text"
            placeholder="Search tracks, artists, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveSearch(query);
              }
            }}
            className="relative z-10 w-full h-full rounded-full pl-14 pr-12 bg-transparent text-sm font-medium border-none outline-none text-white placeholder-white/35 tracking-wide"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition z-10"
              aria-label="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Source Toggles */}
      <div className="flex justify-center space-x-3 mb-8">
        <button
          onClick={() => setSource('youtube')}
          className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition duration-300 border ${
            source === 'youtube'
              ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/40 shadow-[0_0_12px_rgba(255,59,48,0.15)]'
              : 'glass-card border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          YouTube
        </button>
        <button
          onClick={() => setSource('soundcloud')}
          className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition duration-300 border ${
            source === 'soundcloud'
              ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/40 shadow-[0_0_12px_rgba(255,59,48,0.15)]'
              : 'glass-card border-transparent text-white/40 hover:text-white/80'
          }`}
        >
          SoundCloud
        </button>
      </div>

      {/* 2.5 Recent Searches */}
      {!isSearching && recentSearches.length > 0 && (
        <div className="mb-8 animate-fade-in text-left">
          <h4 className="text-xs font-bold tracking-wider uppercase text-white/40 pl-1 mb-3">
            Recent Searches
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {recentSearches.map((search, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-card hover:bg-white/10 transition border border-white/5 cursor-pointer text-xs font-medium text-white/80"
                onClick={() => {
                  setQuery(search);
                  saveSearch(search);
                }}
              >
                <span>{search}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearch(search);
                  }}
                  className="p-0.5 rounded-full hover:bg-white/15 text-white/40 hover:text-white transition"
                  aria-label={`Remove search ${search}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main List Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-3">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-lg animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-[#FF3B30] border-b-[#FF3B30] animate-spin" />
          </div>
          <span className="text-xs text-white/40 font-light tracking-wider uppercase animate-pulse">Syncing frequencies...</span>
        </div>
      ) : isSearching && results.length === 0 ? (
        // Empty State Results
        <div className="py-20 text-center glass-card rounded-3xl p-8 max-w-sm mx-auto border-white/5 animate-fade-in">
          <X className="w-8 h-8 text-white/20 mx-auto mb-4 border border-white/10 p-1.5 rounded-full animate-pulse" />
          <h3 className="font-semibold text-base text-white/80">No Results Found</h3>
          <p className="text-xs text-white/40 mt-2 font-light">
            No results found. Try a different search.
          </p>
        </div>
      ) : (
        <div className="space-y-6 text-left animate-fade-in">
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white/40 pl-1 mb-4 flex items-center space-x-1.5">
              {isSearching ? (
                <Sparkles className="w-4 h-4 text-[#FF3B30]" />
              ) : (
                <Flame className="w-4 h-4 text-[#FF3B30]" />
              )}
              <span>{isSearching ? 'Search Results' : 'Trending Now'}</span>
            </h3>
            
            <div className="glass-card rounded-[24px] p-4 border-white/5 divide-y divide-white/5 space-y-1">
              {displaySongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song, displaySongs)}
                  className="flex items-center justify-between py-3 cursor-pointer group hover:bg-white/5 px-3 rounded-2xl transition-all duration-300 relative z-10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 glass-card">
                      <img src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white translate-x-[0.5px]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/95 group-hover:text-[#FF3B30] transition duration-200 truncate max-w-[180px] sm:max-w-md text-glass">
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/40 font-light truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-white/30 font-semibold">
                      {formatDuration(song.duration)}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#FF3B30] group-hover:border-[#FF3B30] transition duration-300">
                      <Play className="w-3.5 h-3.5 text-white/80 group-hover:text-white fill-transparent group-hover:fill-white translate-x-[0.5px] transition duration-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Default Vibe Suggestion Banner (when not searching) */}
      {!isSearching && !loading && (
        <div className="mt-8 glass-card rounded-3xl p-6 border-white/5 bg-gradient-to-r from-[#FF3B30]/5 to-transparent flex items-start space-x-4 text-left animate-fade-in">
          <div className="p-3 rounded-2xl bg-[#FF3B30]/15 text-[#FF3B30]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FF3B30]">AI Frequency Matching</h4>
            <p className="text-sm font-medium text-white/80 mt-1">
              "Your mood filter is currently calibrated to <span className="text-white font-semibold underline">{activeMood}</span>. Searching will prioritize ambient beats matching this vector."
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
