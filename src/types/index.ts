export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number; // in seconds
  url: string;      // audio URL
  lyrics?: string[]; // array of strings (lines)
}

export interface PlaybackState {
  isPlaying: boolean;
  progress: number; // in seconds
  volume: number; // 0 to 1
  currentSong: Song | null;
  queue: Song[];
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
}

export interface Mood {
  id: string;
  name: string;
  tagline: string;
  icon: string;
}

export interface GreetingResponse {
  message: string;
  submessage: string;
}

export interface AnalyticsSummary {
  totalTime: number; // minutes
  weeklyTime: number; // minutes
  streak: number; // days
  topArtist: string;
  topGenre: string;
  topSong: string;
  circularProgress: {
    label: string;
    value: number; // percentage
    color: string;
  }[];
  genreData: {
    name: string;
    value: number;
  }[];
  heatmapData: {
    day: string;
    count: number;
  }[];
}

export interface TimelineItem {
  id: string;
  timestamp: string;
  song: Song;
  moodTag: string;
  timeLabel: 'Morning Sessions' | 'Afternoon Focus' | 'Evening Vibes' | 'Late Night';
  isMilestone?: boolean;
  milestoneText?: string;
}

export interface SearchResult {
  songs: Song[];
  artists: string[];
  albums: string[];
  playlists: { id: string; name: string; artwork: string; songCount: number }[];
}
