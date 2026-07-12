'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/useStore';
import { refreshStreamUrl, api } from '@/lib/api';
import ReactPlayer from 'react-player/youtube';

export default function AudioPlayer() {
  const [isMounted, setIsMounted] = useState(false);
  const playerRef = useRef<ReactPlayer | null>(null);
  const retryCountRef = useRef<Record<string, number>>({});
  
  const {
    currentSong,
    isPlaying,
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

  // Handle seek requests from the store
  useEffect(() => {
    if (seekToTime !== null && playerRef.current) {
      playerRef.current.seekTo(seekToTime, 'seconds');
      seekTo(null);
    }
  }, [seekToTime, seekTo]);

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
    }
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    if (!currentSong) return;
    const progress = state.playedSeconds;
    setProgress(progress);

    // Dynamic linear calculation to sync lyrics lines
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      const totalLines = currentSong.lyrics.length;
      const duration = currentSong.duration || 1;
      const activeLine = Math.min(
        Math.floor((progress / duration) * totalLines),
        totalLines - 1
      );
      setLyricsActiveLine(activeLine);
    }
  };

  const handleEnded = () => {
    nextTrack();
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
    console.warn(`Playback error for ${songId}. Retry attempt ${retries + 1}/3. Refreshing URL...`);

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

  return (
    <ReactPlayer
      ref={playerRef}
      url={currentSong?.url || ''}
      playing={isPlaying}
      volume={volume}
      muted={isMuted}
      onPlay={() => {
        if (currentSong) {
          retryCountRef.current[currentSong.id] = 0;
        }
      }}
      onDuration={handleDuration}
      onProgress={handleProgress}
      onEnded={handleEnded}
      onError={handleError}
      width="0px"
      height="0px"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: '0',
      }}
    />
  );
}
