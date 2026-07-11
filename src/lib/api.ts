import axios from 'axios';
import { GreetingResponse, Song, AnalyticsSummary, TimelineItem, SearchResult } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

export const getJourneyTimeline = async (): Promise<TimelineItem[]> => {
  const response = await api.get('/api/journey/timeline');
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

export const searchMedia = async (q: string, source: string, limit = 6): Promise<Song[]> => {
  const response = !API_BASE_URL
    ? await api.get('/api/search', { params: { q } })
    : await api.get('/api/yt/search', { params: { q, source, limit } });
  
  const data = response.data;
  return Array.isArray(data) ? data : (data?.songs || data || []);
};

export const getTrending = async (mood: string): Promise<Song[]> => {
  const response = !API_BASE_URL
    ? await api.get('/api/recommendations', { params: { mood } })
    : await api.get('/api/yt/trending', { params: { mood } });
  
  const data = response.data;
  return Array.isArray(data) ? data : (data?.songs || data || []);
};

export const refreshStreamUrl = async (id: string, source = 'youtube'): Promise<{ url: string }> => {
  if (!API_BASE_URL) {
    return { url: '' };
  }
  const response = await api.get('/api/yt/refresh', {
    params: { video_id: id, source },
  });
  return response.data;
};

