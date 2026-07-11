'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usePlayerStore, useMoodStore } from '@/store/useStore';
import { Song } from '@/types';
import { api } from '@/lib/api';

const SESSION_ID = typeof window !== 'undefined'
  ? Math.random().toString(36).substring(2, 15)
  : 'server-session';

interface AudioContextType {
  recentlyPlayed: Song[];
  setRecentlyPlayed: React.Dispatch<React.SetStateAction<Song[]>>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const { username } = useAuth();
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const { currentSong } = usePlayerStore();
  const lastLoggedSongId = useRef<string | null>(null);

  // Implement History Hydration on Boot / Username change
  useEffect(() => {
    if (!username) {
      setRecentlyPlayed([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/api/log/history`, {
          params: { username }
        });
        
        // Extract array of songs from response
        const data = response.data;
        const songs = Array.isArray(data) 
          ? data 
          : (data?.songs || data?.history || data?.data || []);
        
        setRecentlyPlayed(songs);

        // On boot/refresh, load the first song from history as the inactive (paused) player state if empty
        if (songs.length > 0) {
          const { currentSong: activeSong } = usePlayerStore.getState();
          if (!activeSong) {
            usePlayerStore.setState({
              currentSong: songs[0],
              isPlaying: false,
              progress: 0,
              queue: songs,
            });
          }
        }
      } catch (err) {
        console.error('Failed to hydrate history:', err);
      }
    };

    fetchHistory();
  }, [username]);

  // Track Initialization/Logging loop
  useEffect(() => {
    if (currentSong && currentSong.id !== lastLoggedSongId.current) {
      lastLoggedSongId.current = currentSong.id;
      
      const moodStore = useMoodStore.getState();
      const payload = {
        song_id: currentSong.id,
        mood_tag: moodStore.activeMood || 'Chill',
        timestamp: new Date().toISOString(),
        session_id: SESSION_ID,
        username: username || '',
        title: currentSong.title || '',
        artist: currentSong.artist || '',
        album: currentSong.album || 'YouTube Stream',
        artwork: currentSong.artwork || '',
        duration: currentSong.duration || 0,
        url: currentSong.url || '',
      };

      api.post('/api/log', payload)
        .then(() => {
          // Instantly prepend the newly played track to recentlyPlayed grid, preventing duplicates
          setRecentlyPlayed((prev) => {
            const filtered = prev.filter(s => s.id !== currentSong.id);
            return [currentSong, ...filtered].slice(0, 10);
          });
        })
        .catch(err => {
          console.error('Failed to log play payload:', err);
        });
    } else if (!currentSong) {
      lastLoggedSongId.current = null;
    }
  }, [currentSong, username]);

  return (
    <AudioContext.Provider value={{ recentlyPlayed, setRecentlyPlayed }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
