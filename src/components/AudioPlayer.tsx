'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/useStore';
import { refreshStreamUrl, api } from '@/lib/api';
import ReactPlayer from 'react-player';
import { Song } from '@/types';

const getPlayableUrl = (song: Song | null): string => {
  if (!song) return '';

  // 1. Return pre-fetched direct streaming URL if already resolved
  if (song.resolvedUrl) {
    return song.resolvedUrl;
  }

  const url = song.url || '';

  // 2. Resolve YouTube stream endpoints or YouTube 11-char IDs to native YouTube watch links for ReactPlayer
  if (url.includes('/api/yt/stream')) {
    const match = url.match(/video_id=([^&]+)/);
    const videoId = match ? match[1] : song.id;
    if (videoId && videoId.length >= 5) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }

  if (song.id && song.id.length === 11 && !url.includes('soundhelix.com') && !url.endsWith('.mp3') && !url.endsWith('.m4a')) {
    return `https://www.youtube.com/watch?v=${song.id}`;
  }

  // 3. Upgrade remote HTTP URLs to HTTPS to prevent Mixed Content blocking
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

export default function AudioPlayer() {
  const [isMounted, setIsMounted] = useState(false);
  const playerRef = useRef<any>(null);
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

  // Reset progress when currentSong is cleared
  useEffect(() => {
    if (!currentSong) {
      setProgress(0);
    }
  }, [currentSong, setProgress]);

  // Strict isFinite guarded Media Session Position State Sync
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
        console.error('Error updating mediaSession position state:', e);
      }
    }
  }, []);

  // Sync mediaSession metadata & action handlers when currentSong updates
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
      console.error('Failed to configure Media Session metadata/handlers:', err);
    }
  }, [currentSong, setIsPlaying, nextTrack, prevTrack, seekTo]);

  // Sync playbackState on isPlaying change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      if (currentSong) {
        updatePositionState(progress, currentSong.duration);
      }
    }
  }, [isPlaying, currentSong, progress, updatePositionState]);

  // Handle seek requests from the store
  useEffect(() => {
    if (seekToTime !== null && playerRef.current) {
      playerRef.current.seekTo(seekToTime, 'seconds');
      seekTo(null);
      if (currentSong) {
        setTimeout(() => updatePositionState(seekToTime, currentSong.duration), 50);
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

  // Infinite Queue (Non-stop playback)
  useEffect(() => {
    const { queue, currentSong: storeCurrentSong, appendToQueue } = usePlayerStore.getState();
    if (!storeCurrentSong || queue.length === 0) return;

    const currentIndex = queue.findIndex(s => s.id === storeCurrentSong.id);
    const songsRemaining = queue.length - currentIndex - 1;

    // When 3 songs remain — fetch next batch silently
    if (songsRemaining <= 3) {
      const lastSong = queue[queue.length - 1];
      api.get('/api/yt/queue', {
        params: {
          video_id: lastSong.id,
          title: lastSong.title,
          artist: lastSong.artist,
          limit: 8
        }
      })
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          appendToQueue(res.data);
        }
      })
      .catch(err => console.error('Infinite queue fetch failed:', err));
    }
  }, [currentSong]);

  // Fetch lyrics for the current song if not already present
  useEffect(() => {
    if (!currentSong || (currentSong.lyrics && currentSong.lyrics.length > 0)) return;

    const songId = currentSong.id;
    
    api.get(`/api/yt/lyrics`, {
      params: { video_id: songId }
    })
    .then(res => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        usePlayerStore.setState((state) => {
          if (state.currentSong && state.currentSong.id === songId) {
            const updatedSong = { ...state.currentSong, lyrics: res.data };
            const updatedQueue = state.queue.map(s => s.id === songId ? updatedSong : s);
            return {
              currentSong: updatedSong,
              queue: updatedQueue
            };
          }
          return {};
        });
      }
    })
    .catch(err => {
      console.error('AudioPlayer: Failed to fetch lyrics:', err);
    });
  }, [currentSong]);

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

  const handleDuration = (duration: number) => {
    if (!currentSong) return;
    if (duration && currentSong.duration !== duration) {
      usePlayerStore.setState((state) => {
        if (state.currentSong && state.currentSong.id === currentSong.id) {
          const updatedSong = { ...state.currentSong, duration };
          const updatedQueue = state.queue.map(s => s.id === currentSong.id ? updatedSong : s);
          return {
            currentSong: updatedSong,
            queue: updatedQueue
          };
        }
        return {};
      });
      setTimeout(() => updatePositionState(progress, duration), 50);
    }
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    if (!currentSong) return;
    const currentProgress = state.playedSeconds;
    setProgress(currentProgress);
    updatePositionState(currentProgress, currentSong.duration);

    // 1. Prefetch Queue Engine: When remaining song time <= 20 seconds, pre-resolve next track stream URL
    const remainingTime = (currentSong.duration || 0) - currentProgress;
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

    // 2. Dynamic linear calculation to sync lyrics lines with strict boundary clamps
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      const totalLines = currentSong.lyrics.length;
      const duration = currentSong.duration;
      let activeLine = 0;
      if (duration && isFinite(duration) && duration > 0 && isFinite(currentProgress)) {
        activeLine = Math.max(
          0,
          Math.min(
            Math.floor((currentProgress / duration) * totalLines),
            totalLines - 1
          )
        );
      }
      setLyricsActiveLine(activeLine);
    }
  };

  const handleEnded = () => {
    const { isRepeat, setProgress: storeSetProgress } = usePlayerStore.getState();
    if (isRepeat === 'one') {
      if (playerRef.current) {
        playerRef.current.seekTo(0, 'seconds');
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
      console.error(`Failed to play song ${songId} after 3 refresh attempts.`);
      setIsPlaying(false);
      return;
    }

    retryCountRef.current[songId] = retries + 1;

    const isYoutubeUrl = currentSong.url.includes('youtube.com') || currentSong.url.includes('youtu.be') || currentSong.url.includes('googlevideo.com') || currentSong.url.includes('/api/yt/stream') || (currentSong.id && currentSong.id.length === 11);
    if (!isYoutubeUrl) {
      console.warn(`Playback error on static/mock song ${songId}. Retrying once directly without refresh...`);
      if (retries === 0) {
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(true), 100);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    try {
      const sourceParam = currentSong.url.includes('soundcloud.com') ? 'soundcloud' : 'youtube';
      const refreshResult = await refreshStreamUrl(songId, sourceParam);
      
      if (refreshResult && refreshResult.url) {
        console.log('Stream URL successfully refreshed:', refreshResult.url);
        const newPlayableUrl = getPlayableUrl({ ...currentSong, url: refreshResult.url });
        
        usePlayerStore.setState((state) => {
          if (state.currentSong && state.currentSong.id === songId) {
            const updatedSong = { ...state.currentSong, url: refreshResult.url, resolvedUrl: newPlayableUrl };
            const updatedQueue = state.queue.map(s => s.id === songId ? updatedSong : s);
            return {
              currentSong: updatedSong,
              queue: updatedQueue
            };
          }
          return {};
        });
      } else {
        console.error('Refresh endpoint returned an empty URL.');
      }
    } catch (refreshErr) {
      console.error('Error refreshing stream URL:', refreshErr);
    }
  };

  if (!isMounted) return null;

  const playableUrl = getPlayableUrl(currentSong);
  const isYouTube = playableUrl.includes('youtube.com') || playableUrl.includes('youtu.be');
  const isSoundCloud = playableUrl.includes('soundcloud.com');
  const PlayerComponent = ReactPlayer as any;

  return (
    <PlayerComponent
      ref={playerRef}
      url={playableUrl}
      playing={isPlaying}
      volume={volume}
      muted={isMuted}
      config={{
        youtube: {
          playerVars: {
            autoplay: 1,
            controls: 0,
          }
        },
        file: {
          forceAudio: !isYouTube && !isSoundCloud,
          attributes: {
            preload: 'metadata',
            playsInline: true,
            webkitPlaysInline: true,
          }
        }
      }}
      onPlay={() => {
        if (currentSong) {
          retryCountRef.current[currentSong.id] = 0;
        }
      }}
      onDuration={handleDuration}
      onProgress={handleProgress}
      onEnded={handleEnded}
      onError={handleError}
      width="10px"
      height="10px"
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '10px',
        height: '10px',
        opacity: '0.001',
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    />
  );
}
