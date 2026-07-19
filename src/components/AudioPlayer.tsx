'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/useStore';
import { refreshStreamUrl, api } from '@/lib/api';
import FilePlayer from 'react-player/file';

const getPlayableUrl = (url: string) => {
  if (!url) return '';
  // Upgrade remote HTTP URLs to HTTPS to prevent Mixed Content blocking in browsers
  // and App Transport Security (ATS) / Cleartext blocks on native devices.
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

export default function AudioPlayer() {
  const [isMounted, setIsMounted] = useState(false);
  const playerRef = useRef<any>(null);
  const retryCountRef = useRef<Record<string, number>>({});
  
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    isMuted,
    setProgress,
    setIsPlaying,
    nextTrack,
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

    const syncPositionState = useCallback(() => {
        if (
            typeof window !== 'undefined' &&
            'mediaSession' in navigator &&
            navigator.mediaSession.setPositionState &&
            currentSong
        ) {
            const duration = currentSong.duration;
            const progressSec = playerRef.current ? playerRef.current.getCurrentTime() : progress;
            if (
                isFinite(duration) &&
                duration > 0 &&
                isFinite(progressSec) &&
                progressSec >= 0 &&
                progressSec <= duration
            ) {
                try {
                    navigator.mediaSession.setPositionState({
                        duration: duration,
                        playbackRate: 1.0,
                        position: progressSec,
                    });
                } catch (e) {
                    console.error('Error setting media session position state:', e);
                }
            }
        }
    }, [currentSong, isPlaying, progress]);

    // Trigger position sync on major status updates (play, pause, current song change)
    useEffect(() => {
        syncPositionState();
    }, [isPlaying, currentSong, syncPositionState]);

    // Handle seek requests from the store
    useEffect(() => {
        if (seekToTime !== null && playerRef.current) {
            playerRef.current.seekTo(seekToTime, 'seconds');
            seekTo(null);
            setTimeout(syncPositionState, 50);
        }
    }, [seekToTime, seekTo, syncPositionState]);

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
        if (res.data && res.data.length > 0) {
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
            setTimeout(syncPositionState, 50);
        }
    };

    const handleProgress = (state: { playedSeconds: number }) => {
        if (!currentSong) return;
        const progress = state.playedSeconds;
        setProgress(progress);

        // Dynamic linear calculation to sync lyrics lines with strict boundary clamps
        if (currentSong.lyrics && currentSong.lyrics.length > 0) {
            const totalLines = currentSong.lyrics.length;
            const duration = currentSong.duration;
            let activeLine = 0;
            if (duration && isFinite(duration) && duration > 0 && isFinite(progress)) {
                activeLine = Math.max(
                    0,
                    Math.min(
                        Math.floor((progress / duration) * totalLines),
                        totalLines - 1
                    )
                );
            }
            setLyricsActiveLine(activeLine);
        }
    };

    const handleEnded = () => {
        const { isRepeat, seekTo, setProgress: storeSetProgress } = usePlayerStore.getState();
        if (isRepeat === 'one') {
            if (playerRef.current) {
                playerRef.current.seekTo(0, 'seconds');
            }
            storeSetProgress(0);
            setTimeout(syncPositionState, 50);
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

    const isYoutubeUrl = currentSong.url.includes('youtube.com') || currentSong.url.includes('youtu.be') || currentSong.url.includes('googlevideo.com') || currentSong.url.includes('/api/yt/stream');
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
        
        // Update URL inside Zustand store for currentSong and in the queue
        usePlayerStore.setState((state) => {
          if (state.currentSong && state.currentSong.id === songId) {
            const updatedSong = { ...state.currentSong, url: refreshResult.url };
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

  const isYouTube = currentSong?.url ? (currentSong.url.includes('youtube.com') || currentSong.url.includes('youtu.be')) : false;
  const PlayerComponent = FilePlayer as any;

  return (
    <PlayerComponent
      ref={playerRef}
      url={getPlayableUrl(currentSong?.url || '')}
      playing={isPlaying}
      volume={volume}
      muted={isMuted}
      config={{
        file: {
          forceAudio: currentSong?.url ? !currentSong.url.includes('/api/yt/stream') : true,
          attributes: {
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
