import { create } from 'zustand';
import { Song, TimelineItem } from '../types';
import { setMoodAPI } from '../lib/api';
import { resolveAudioStream } from '../lib/youtubeClient';

const SESSION_ID = typeof window !== 'undefined'
  ? Math.random().toString(36).substring(2, 15)
  : 'server-session';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  lyricsActiveLine: number;
  
  seekToTime: number | null;
  seekTo: (time: number | null) => void;
  playTrack: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setLyricsActiveLine: (line: number) => void;
  setQueue: (queue: Song[]) => void;
  appendToQueue: (songs: Song[]) => void;
  bufferUpcomingQueue: (currentIndex: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  isMuted: false,
  queue: [],
  isShuffle: false,
  isRepeat: 'none',
  lyricsActiveLine: 0,
  seekToTime: null,

  bufferUpcomingQueue: async (currentIndex) => {
    const { queue } = get();
    if (queue.length === 0) return;

    // Buffer current track + next 3 tracks (Rolling 3-Track Buffer) with loop wrap-around support
    const bufferSize = Math.min(4, queue.length);
    const tracksToBuffer: Song[] = [];
    for (let i = 0; i < bufferSize; i++) {
      const idx = (currentIndex + i) % queue.length;
      if (!tracksToBuffer.some((t) => t.id === queue[idx].id)) {
        tracksToBuffer.push(queue[idx]);
      }
    }

    const promises = tracksToBuffer.map(async (track) => {
      if (track.resolvedUrl) return;

      try {
        const resolvedUrl = await resolveAudioStream(track.id);
        set((state) => ({
          queue: state.queue.map((s) =>
            s.id === track.id ? { ...s, resolvedUrl } : s
          ),
          currentSong: state.currentSong?.id === track.id 
            ? { ...state.currentSong, resolvedUrl } 
            : state.currentSong
        }));
      } catch (err) {
        console.error(`Failed to buffer stream for track ${track.id}:`, err);
      }
    });

    await Promise.allSettled(promises);
  },

  playTrack: (song, queue) => {
    const activeQueue = queue || get().queue;
    const finalQueue = activeQueue.some(s => s.id === song.id)
      ? activeQueue
      : [song, ...activeQueue];
      
    set({
      currentSong: song,
      isPlaying: true,
      progress: 0,
      queue: finalQueue,
      lyricsActiveLine: 0
    });

    const currIndex = finalQueue.findIndex(s => s.id === song.id);
    if (currIndex !== -1) {
      get().bufferUpcomingQueue(currIndex);
    }
  },

  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  seekTo: (seekToTime) => set({ seekToTime }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
  toggleShuffle: () => set(state => ({ isShuffle: !state.isShuffle })),
  
  toggleRepeat: () => set(state => {
    const transitions: Record<PlayerState['isRepeat'], PlayerState['isRepeat']> = {
      'none': 'all',
      'all': 'one',
      'one': 'none'
    };
    return { isRepeat: transitions[state.isRepeat] };
  }),

  nextTrack: () => {
    const { queue, currentSong, isShuffle, isRepeat } = get();
    if (queue.length === 0) return;
    
    let nextIndex = 0;
    if (currentSong) {
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = currIndex + 1;
        if (nextIndex >= queue.length) {
          nextIndex = isRepeat === 'all' ? 0 : currIndex; // stay on last track if no repeat all
        }
      }
    }
    
    const nextSong = queue[nextIndex];
    if (nextSong) {
      set({ currentSong: nextSong, progress: 0, isPlaying: true, lyricsActiveLine: 0 });
      get().bufferUpcomingQueue(nextIndex);
    }
  },

  prevTrack: () => {
    const { queue, currentSong, progress } = get();
    if (queue.length === 0) return;

    if (progress > 3) {
      set({ progress: 0, seekToTime: 0, lyricsActiveLine: 0 });
      return;
    }

    let prevIndex = 0;
    if (currentSong) {
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      prevIndex = currIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      set({ currentSong: prevSong, progress: 0, isPlaying: true, lyricsActiveLine: 0 });
      get().bufferUpcomingQueue(prevIndex);
    }
  },

  setLyricsActiveLine: (lyricsActiveLine) => set({ lyricsActiveLine }),
  setQueue: (queue) => {
    set({ queue });
    const { currentSong } = get();
    if (currentSong) {
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      if (currIndex !== -1) {
        get().bufferUpcomingQueue(currIndex);
      }
    }
  },
  appendToQueue: (songs) => {
    set((state) => ({
      queue: [
        ...state.queue,
        ...songs.filter(s => !state.queue.some(q => q.id === s.id))
      ]
    }));
    const { queue, currentSong } = get();
    if (currentSong) {
      const currIndex = queue.findIndex(s => s.id === currentSong.id);
      if (currIndex !== -1) {
        get().bufferUpcomingQueue(currIndex);
      }
    }
  }
}));

interface MoodState {
  activeMood: string;
  setMood: (mood: string) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set) => ({
  activeMood: 'Chill',
  setMood: async (mood) => {
    set({ activeMood: mood });
    try {
      await setMoodAPI(mood);
    } catch (e) {
      console.error('Failed to sync mood with API', e);
    }
  }
}));

interface UserState {
  profile: {
    name: string;
    avatar: string;
    streak: number;
  };
  stats: {
    totalHours: number;
    weeklyMinutes: number;
    topArtist: string;
    topSong: string;
  };
  badges: { id: string; label: string; desc: string; icon: string }[];
  history: TimelineItem[];
  
  setStats: (stats: UserState['stats']) => void;
  setHistory: (history: TimelineItem[]) => void;
  addHistoryItem: (item: TimelineItem) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: {
    name: 'Krishnesh',
    avatar: '',
    streak: 12
  },
  stats: {
    totalHours: 71,
    weeklyMinutes: 345,
    topArtist: 'Aether Vortex',
    topSong: 'Neon Horizons'
  },
  badges: [
    { id: 'b1', label: 'Lofi Legend', desc: 'Listened to 100+ hours of Chill beats', icon: '🎧' },
    { id: 'b2', label: 'Streak Master', desc: 'Maintained a 10-day listening streak', icon: '🔥' },
    { id: 'b3', label: 'AI Pioneer', desc: 'Explored 50+ AI suggestions', icon: '🧠' }
  ],
  history: [],
  setStats: (stats) => set({ stats }),
  setHistory: (history) => set({ history }),
  addHistoryItem: (item) => set((state) => ({ history: [item, ...state.history] }))
}));

export type TabDestination = 'Home' | 'Player' | 'Discover' | 'Analytics' | 'Journey' | 'Moods' | 'Search' | 'Profile';

interface NavigationState {
    activeTab: TabDestination;
    setActiveTab: (tab: TabDestination) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeTab: 'Home',
    setActiveTab: (tab) => set({ activeTab: tab })
}));

