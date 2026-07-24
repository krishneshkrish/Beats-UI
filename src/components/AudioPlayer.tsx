'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/useStore';
import { resolveAudioStream } from '@/lib/youtubeClient';
import { Song } from '@/types';

const getPlayableUrl = (song: Song | null): string => {
  if (!song) return '';
  if (song.resolvedUrl) {
    return song.resolvedUrl;
  }
  const url = song.url || '';
  // Support direct HTTP/HTTPS links (including MP3, M4A, soundhelix, etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return '';
};

export default function AudioPlayer() {
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef<Record<string, number>>({});

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    setProgress,
    setIsPlaying,
    nextTrack,
    prevTrack,
    setLyricsActiveLine,
    seekToTime,
    seekTo,
    queue,
    isRepeat,
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

  // Sync Native MediaSession Controls & Info
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
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', async () => {
        const audio = audioRef.current;
        setIsPlaying(true);
        if (audio && audio.paused) {
          try {
            await audio.play();
            navigator.mediaSession.playbackState = 'playing';
          } catch (err) {
            console.error('Lock screen play action error:', err);
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        const audio = audioRef.current;
        setIsPlaying(false);
        if (audio && !audio.paused) {
          audio.pause();
          navigator.mediaSession.playbackState = 'paused';
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && isFinite(details.seekTime)) {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = details.seekTime;
          }
          seekTo(details.seekTime);
        }
      });
    } catch (err) {
      console.error('Failed to configure MediaSession API:', err);
    }
  }, [currentSong, setIsPlaying, nextTrack, prevTrack, seekTo]);

  // Mobile Audio Context Unlocking on first user gesture (touchstart/click)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlockAudioContext = () => {
      const audio = audioRef.current;
      if (audio && audio.paused && !usePlayerStore.getState().isPlaying) {
        audio.play().then(() => {
          if (!usePlayerStore.getState().isPlaying) {
            audio.pause();
          }
        }).catch(() => {
          // Ignored silent unlock
        });
      }
    };

    window.addEventListener('touchstart', unlockAudioContext, { once: true });
    window.addEventListener('click', unlockAudioContext, { once: true });

    return () => {
      window.removeEventListener('touchstart', unlockAudioContext);
      window.removeEventListener('click', unlockAudioContext);
    };
  }, []);

  // Unified HTML5 Audio Source and Playback State Synchronizer with client-side resolution
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.src = '';
      setProgress(0);
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
      return;
    }

    let active = true;

    const playOrLoad = async () => {
      let playableUrl = getPlayableUrl(currentSong);

      // On-the-fly client-side resolution if direct stream URL isn't pre-resolved yet
      if (!playableUrl && currentSong.id) {
        try {
          playableUrl = await resolveAudioStream(currentSong.id);
          
          if (!active) return; // Exit if another song was selected in the meantime

          usePlayerStore.setState((state) => ({
            currentSong: state.currentSong?.id === currentSong.id
              ? { ...state.currentSong, resolvedUrl: playableUrl }
              : state.currentSong,
            queue: state.queue.map((s) =>
              s.id === currentSong.id ? { ...s, resolvedUrl: playableUrl } : s
            )
          }));
        } catch (err) {
          console.error('On-the-fly client stream resolution failed:', err);
          setIsPlaying(false);
          return;
        }
      }

      if (!active || !playableUrl) return;

      const isSourceChanged = audio.src !== playableUrl;

      if (isSourceChanged) {
        audio.src = playableUrl;
        audio.load();
      }

      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }

      if (isPlaying) {
        if (audio.paused || isSourceChanged) {
          audio.play().catch((err) => {
            console.warn('Playback request failed or blocked:', err);
          });
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    };

    playOrLoad();

    return () => {
      active = false;
    };
  }, [currentSong, isPlaying, setProgress, setIsPlaying]);

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

    // Continuous Rolling Buffer Trigger: check/refresh upcoming buffer when 20s remaining
    const duration = currentSong.duration || audio.duration || 0;
    const remainingTime = duration - currentProgress;

    if (remainingTime <= 20 && remainingTime > 0) {
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      if (currIndex !== -1) {
        usePlayerStore.getState().bufferUpcomingQueue(currIndex);
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

  // Self-Healing URL Expiration Loop: refresh streaming link on error (up to 3 retries)
  const handleError = async () => {
    if (!currentSong) return;
    const songId = currentSong.id;
    const retries = retryCountRef.current[songId] || 0;

    if (retries >= 3) {
      console.error(`Failed to play track ${songId} after 3 client-side resolution attempts.`);
      setIsPlaying(false);
      return;
    }

    retryCountRef.current[songId] = retries + 1;

    try {
      const resolvedUrl = await resolveAudioStream(songId);
      
      usePlayerStore.setState((state) => ({
        currentSong: state.currentSong?.id === songId
          ? { ...state.currentSong, resolvedUrl }
          : state.currentSong,
        queue: state.queue.map((s) =>
          s.id === songId ? { ...s, resolvedUrl } : s
        )
      }));

      const audio = audioRef.current;
      if (audio) {
        audio.src = resolvedUrl;
        audio.load();
        audio.play().catch(e => console.warn('Play after self-healing resolution blocked:', e));
      }
    } catch (refreshErr) {
      console.error('Error in self-healing stream resolution:', refreshErr);
    }
  };

  if (!isMounted) return null;

  return (
    <audio
      ref={audioRef}
      playsInline={true}
      preload="auto"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onError={handleError}
      style={{ display: 'none' }}
    />
  );
}
