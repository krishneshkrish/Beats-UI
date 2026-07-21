'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/useStore';
import { refreshStreamUrl, api } from '@/lib/api';
import { Song } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getPlayableUrl = (song: Song | null): string => {
  if (!song) return '';

  // 1. Return pre-fetched direct streaming URL if already resolved
  if (song.resolvedUrl) {
    return song.resolvedUrl;
  }

  const url = song.url || '';

  // 2. Format backend direct audio stream proxy URLs (/api/yt/stream)
  if (url.startsWith('/api/yt/stream')) {
    return `${API_BASE_URL}${url}`;
  }

  // 3. For YouTube track IDs or non-static URLs, route to backend direct audio stream proxy endpoint
  if (song.id && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/api/yt/stream') || !url.endsWith('.mp3'))) {
    return `${API_BASE_URL}/api/yt/stream?video_id=${song.id}`;
  }

  // 4. Upgrade remote HTTP URLs to HTTPS to prevent Mixed Content blocking
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace('http://', 'https://');
  }

  return url;
};

export default function AudioPlayer() {
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef<Record<string, number>>({});
  const prefetchedRef = useRef<Set<string>>(new Set());

  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    isMuted,
    setProgress,
    setIsPlaying,
    nextTrack,
    prevTrack,
    setLyricsActiveLine,
    seekToTime,
    seekTo,
  } = usePlayerStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe Position State Sync with strict isFinite() guards
  const updatePositionState = useCallback((pos: number, dur: number) => {
    if (
      typeof window !== 'undefined' &&
      'mediaSession' in navigator &&
      navigator.mediaSession.setPositionState &&
      isFinite(dur) && dur > 0 &&
      isFinite(pos) && pos >= 0 && pos <= dur
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: 1.0,
          position: pos,
        });
      } catch (e) {
        console.error('Error updating MediaSession position state:', e);
      }
    }
  }, []);

  // Complete MediaSession API Binding & Metadata Sync
  useEffect(() => {
    if (!currentSong || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const artworkSrc = currentSong.artwork || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || 'Beats Music',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      // Register all four mandatory action handlers plus seekto
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && isFinite(details.seekTime)) {
          seekTo(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
    } catch (err) {
      console.error('Failed to configure MediaSession API:', err);
    }
  }, [currentSong, setIsPlaying, nextTrack, prevTrack, seekTo]);

  // Sync track change onto persistent HTML5 <audio> element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.src = '';
      setProgress(0);
      return;
    }

    const playableUrl = getPlayableUrl(currentSong);
    if (audio.src !== playableUrl) {
      audio.src = playableUrl;
      audio.load();

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn('Autoplay blocked on track load:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentSong, isPlaying, setProgress, setIsPlaying]);

  // Sync play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    if (isPlaying && audio.paused) {
      audio.play().catch((err) => {
        console.warn('Playback error on user gesture / state toggle:', err);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, currentSong, setIsPlaying]);

  // Sync volume and mute changes directly to HTML5 audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle seek requests from the store
  useEffect(() => {
    const audio = audioRef.current;
    if (seekToTime !== null && audio) {
      audio.currentTime = seekToTime;
      seekTo(null);
      if (currentSong) {
        updatePositionState(seekToTime, currentSong.duration);
      }
    }
  }, [seekToTime, seekTo, currentSong, updatePositionState]);

  // Background Battery & Thread Freezing (visibilitychange)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      if (isHidden) {
        document.body.classList.add('app-background-frozen');
      } else {
        document.body.classList.remove('app-background-frozen');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Prefetch next track stream URL when remaining duration <= 20 seconds
  const prefetchNextTrackUrl = useCallback(async (nextTrack: Song) => {
    try {
      let resolvedUrl: string = getPlayableUrl(nextTrack);
      if (!resolvedUrl || resolvedUrl === nextTrack.url) {
        const refreshResult = await refreshStreamUrl(nextTrack.id, 'youtube');
        if (refreshResult && refreshResult.url) {
          resolvedUrl = getPlayableUrl({ ...nextTrack, url: refreshResult.url });
        }
      }

      if (resolvedUrl) {
        usePlayerStore.setState((state) => ({
          queue: state.queue.map(s => s.id === nextTrack.id ? { ...s, resolvedUrl } : s)
        }));
      }
    } catch (e) {
      console.error('Prefetch queue track URL failed:', e);
    }
  }, []);

  // HTML5 Audio Event Handlers
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const dur = audio.duration;
    if (isFinite(dur) && dur > 0 && currentSong.duration !== dur) {
      usePlayerStore.setState((state) => {
        if (state.currentSong && state.currentSong.id === currentSong.id) {
          const updatedSong = { ...state.currentSong, duration: dur };
          const updatedQueue = state.queue.map(s => s.id === currentSong.id ? updatedSong : s);
          return { currentSong: updatedSong, queue: updatedQueue };
        }
        return {};
      });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const currentProgress = audio.currentTime;
    setProgress(currentProgress);
    updatePositionState(currentProgress, currentSong.duration || audio.duration);

    // Prefetch Queue Engine: When remaining song time <= 20s, pre-resolve next track stream URL
    const duration = currentSong.duration || audio.duration || 0;
    const remainingTime = duration - currentProgress;

    if (remainingTime <= 20 && remainingTime > 0) {
      const { queue, isShuffle } = usePlayerStore.getState();
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      let nextIndex = currIndex + 1;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      if (nextIndex < queue.length) {
        const nextTrackObj = queue[nextIndex];
        if (nextTrackObj && !nextTrackObj.resolvedUrl && !prefetchedRef.current.has(nextTrackObj.id)) {
          prefetchedRef.current.add(nextTrackObj.id);
          prefetchNextTrackUrl(nextTrackObj);
        }
      }
    }

    // Sync lyrics line
    if (currentSong.lyrics && currentSong.lyrics.length > 0 && duration > 0) {
      const totalLines = currentSong.lyrics.length;
      const activeLine = Math.max(
        0,
        Math.min(
          Math.floor((currentProgress / duration) * totalLines),
          totalLines - 1
        )
      );
      setLyricsActiveLine(activeLine);
    }
  };

  const handleEnded = () => {
    const { isRepeat, setProgress: storeSetProgress } = usePlayerStore.getState();
    if (isRepeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((e) => console.warn('Repeat play error:', e));
      }
      storeSetProgress(0);
      if (currentSong) {
        updatePositionState(0, currentSong.duration);
      }
    } else {
      nextTrack();
    }
  };

  const handleError = async () => {
    if (!currentSong) return;
    const songId = currentSong.id;
    const retries = retryCountRef.current[songId] || 0;

    if (retries >= 3) {
      console.error(`Failed to play track ${songId} after 3 refresh attempts.`);
      setIsPlaying(false);
      return;
    }

    retryCountRef.current[songId] = retries + 1;

    try {
      const refreshResult = await refreshStreamUrl(songId, 'youtube');
      if (refreshResult && refreshResult.url) {
        const newPlayableUrl = getPlayableUrl({ ...currentSong, url: refreshResult.url });
        usePlayerStore.setState((state) => {
          if (state.currentSong && state.currentSong.id === songId) {
            const updatedSong = { ...state.currentSong, url: refreshResult.url, resolvedUrl: newPlayableUrl };
            const updatedQueue = state.queue.map(s => s.id === songId ? updatedSong : s);
            return { currentSong: updatedSong, queue: updatedQueue };
          }
          return {};
        });

        const audio = audioRef.current;
        if (audio) {
          audio.src = newPlayableUrl;
          audio.load();
          audio.play().catch(e => console.warn('Play after error refresh blocked:', e));
        }
      }
    } catch (refreshErr) {
      console.error('Error refreshing stream URL:', refreshErr);
    }
  };

  if (!isMounted) return null;

  return (
    <audio
      ref={audioRef}
      playsInline={true}
      preload="metadata"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onError={handleError}
      style={{ display: 'none' }}
    />
  );
}

