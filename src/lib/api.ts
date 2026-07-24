import axios from 'axios';
import { GreetingResponse, Song, AnalyticsSummary, TimelineItem, SearchResult } from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGreeting = async (): Promise<GreetingResponse> => {
  const response = await api.get('/api/greeting');
  return response.data;
};

export const getRecommendations = async (mood: string, limit = 10, username?: string): Promise<Song[]> => {
  const response = await api.get(`/api/recommendations`, {
    params: { mood, limit, username },
  });
  return Array.isArray(response.data) ? response.data : (response.data?.songs || response.data || []);
};

export const logPlay = async (payload: {
  song_id: string;
  mood_tag: string;
  timestamp: string;
  session_id: string;
  username?: string;
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
  url?: string;
}): Promise<{ status: string }> => {
  const response = await api.post('/api/log', payload);
  return response.data;
};

export const getAiRecommendations = async (context = 'discover'): Promise<Song[]> => {
  const response = await api.get('/api/recommendations-ai', {
    params: { context },
  });
  return Array.isArray(response.data) ? response.data : (response.data?.songs || response.data || []);
};

export const getAnalyticsSummary = async (username?: string): Promise<AnalyticsSummary> => {
  const response = await api.get('/api/analytics/summary', {
    params: { username },
  });
  return response.data;
};

export const getJourneyTimeline = async (username?: string): Promise<TimelineItem[]> => {
  const response = await api.get('/api/journey/timeline', {
    params: { username },
  });
  return response.data;
};

export const setMoodAPI = async (mood: string): Promise<{ status: string; mood: string }> => {
  const response = await api.post('/api/mood/set', {
    mood,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

export const searchAPI = async (q: string, type?: string): Promise<SearchResult> => {
  const response = await api.get('/api/search', {
    params: { q, type },
  });
  return response.data;
};

export const searchMedia = async (q: string, source: string, limit = 5): Promise<Song[]> => {
  const endpoint = source === 'youtube' ? '/api/yt/search' : '/api/search';
  try {
    const response = await api.get(endpoint, { params: { q, source, limit } });
    const data = response.data;
    const result = Array.isArray(data) ? data : (data?.songs || data || []);
    if (result && result.length > 0) return result;
  } catch (err) {
    console.warn('[api] searchMedia primary call failed, trying relative route:', err);
  }

  try {
    const res = await fetch(`/api/yt/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.songs || []);
    }
  } catch (fallbackErr) {
    console.error('[api] searchMedia relative fallback failed:', fallbackErr);
  }

  return [];
};

export const getTrending = async (mood: string): Promise<Song[]> => {
  try {
    const response = await api.get('/api/yt/trending', { params: { mood } });
    const data = response.data;
    const result = Array.isArray(data) ? data : (data?.songs || data || []);
    if (result && result.length > 0) return result;
  } catch (err) {
    console.warn('[api] getTrending primary call failed, trying relative route:', err);
  }

  try {
    const res = await fetch(`/api/yt/trending?mood=${encodeURIComponent(mood)}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.songs || []);
    }
  } catch (fallbackErr) {
    console.error('[api] getTrending relative fallback failed:', fallbackErr);
  }

  return [];
};

export const refreshStreamUrl = async (id: string, source = 'youtube'): Promise<{ url: string }> => {
  try {
    const response = await api.get('/api/yt/refresh', {
      params: { video_id: id, source },
    });
    if (response.data && response.data.url) {
      return response.data;
    }
  } catch (err) {
    console.warn('[api] Primary refreshStreamUrl failed, using local relative fallback:', err);
  }

  // Local relative fallback (handled by Next.js route.ts)
  try {
    const res = await fetch(`/api/yt/refresh?video_id=${encodeURIComponent(id)}&source=${encodeURIComponent(source)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data;
    }
  } catch (fallbackErr) {
    console.error('[api] Local refresh fallback failed:', fallbackErr);
  }

  return { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' };
};

