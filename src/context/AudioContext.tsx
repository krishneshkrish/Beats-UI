'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usePlayerStore, useMoodStore } from '@/store/useStore';
import { Song } from '@/types';
import { api } from '@/lib/api';
import { BackgroundMode } from 'capacitor-background-mode';
import { Capacitor } from '@capacitor/core';

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
  const { currentSong, isPlaying } = usePlayerStore();
  const lastLoggedSongId = useRef<string | null>(null);

  // Enable Background Persistence on mount (native platforms only)
  useEffect(() => {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        BackgroundMode.enable({}).catch(err => {
          console.error('Failed to enable Capacitor Background Mode (promise):', err);
        });
      } catch (err) {
        console.error('Failed to enable Capacitor Background Mode:', err);
      }
    }
  }, []);



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
      
      // Update recentlyPlayed state array OPTIMISTICALLY first
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter(s => s.id !== currentSong.id);
        return [currentSong, ...filtered].slice(0, 10);
      });

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

      // Run the background analytics API push independently inside a try/catch shield
      const logPlaySession = async () => {
        try {
          await api.post('/api/log', payload);
        } catch (err) {
          console.error('Failed to log play payload (background):', err);
        }
      };
      logPlaySession();
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
