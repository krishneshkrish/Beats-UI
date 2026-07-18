'use client';

import { useEffect, useState } from 'react';
import { 
  User, 
  Flame, 
  Settings, 
  Bell, 
  Eye, 
  Download, 
  Check, 
  Sparkles,
  Award,
  ShieldAlert
} from 'lucide-react';
import { useUserStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { getAnalyticsSummary } from '@/lib/api';
import { Capacitor } from '@capacitor/core';

export default function ProfileView() {
  const { profile, stats, badges } = useUserStore();
  const { username, logout } = useAuth();
  
  const [realtimeStats, setRealtimeStats] = useState(stats);
  const [realtimeStreak, setRealtimeStreak] = useState(profile.streak);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return;

    let active = true;
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getAnalyticsSummary(username);
        if (data && active) {
          setRealtimeStats({
            totalHours: data.totalTime / 60,
            weeklyMinutes: data.weeklyTime,
            topArtist: data.topArtist,
            topSong: data.topSong,
          });
          setRealtimeStreak(data.streak);
        }
      } catch (err) {
        console.error('Failed to fetch user analytics', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStats();

    return () => {
      active = false;
    };
  }, [username]);
  
  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [reflectionsEnabled, setReflectionsEnabled] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is in standalone mode (already installed) or running natively in Capacitor
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isNative = Capacitor.isNativePlatform();
    if (isStandalone || isNative) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App can be installed via your browser's options menu (e.g. Add to Home Screen).");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallSuccess(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      {/* Profile Header card */}
      <div className="glass-card rounded-[32px] p-6 md:p-8 border-white/5 relative overflow-hidden text-left flex flex-col md:flex-row items-center gap-6 mb-8">
        
        {/* Avatar with Ambient Glow */}
        <div className="relative">
          <div className="absolute inset-0 scale-110 blur-md bg-[#FF3B30]/30 rounded-full -z-10" />
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
              <span className="text-3xl font-bold text-white tracking-wider">
                {(username || profile.name || 'K').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User text */}
        <div className="flex-1 space-y-1.5 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-glass">
              {username || profile.name}
            </h1>
            <span className="text-[10px] font-bold tracking-wider text-[#FF3B30] uppercase bg-[#FF3B30]/15 px-2.5 py-0.5 rounded-full self-center md:self-auto">
              PRO LISTENER
            </span>
            <button
              onClick={logout}
              className="text-[10px] font-bold tracking-wider text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 uppercase bg-white/5 px-3 py-1 rounded-full transition md:ml-auto self-center md:self-auto cursor-pointer"
            >
              Logout
            </button>
          </div>
          
          <p className="text-xs text-white/50 font-light max-w-md leading-relaxed">
            Synthesizing music waves daily. Active curator in the lofi ambient sector.
          </p>

          <div className="flex items-center justify-center md:justify-start space-x-4 pt-1">
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4 text-[#FF3B30] fill-[#FF3B30]" />
              <span className="text-xs font-semibold text-white">
                {loading ? '...' : `${realtimeStreak} Day Streak`}
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="text-xs text-white/50">
              {loading ? '...' : `${Math.round(realtimeStats.totalHours)} Hours Listened`}
            </span>
          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      {!isInstalled && (
        <div className="glass-card rounded-3xl p-6 border-white/10 bg-gradient-to-r from-[#FF3B30]/10 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 mb-8 text-left relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white/95 flex items-center space-x-1.5">
              <Download className="w-4 h-4 text-[#FF3B30]" />
              <span>Install Beats App</span>
            </h3>
            <p className="text-xs text-white/50 font-light max-w-md">
              Add Beats to your homescreen for fullscreen playback support, offline capabilities, and native integrations.
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-6 py-2.5 rounded-full bg-[#FF3B30] hover:bg-red-600 transition text-xs font-semibold tracking-wider uppercase text-white shadow-lg shrink-0 ripple"
          >
            Add to Homescreen
          </button>
        </div>
      )}

      {/* Installation Success indicator */}
      {showInstallSuccess && (
        <div className="glass-card rounded-3xl p-4 border-emerald-500/20 bg-emerald-500/10 flex items-center space-x-3 mb-8 text-left animate-fade-in">
          <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="w-4 h-4 stroke-[3px]" />
          </div>
          <p className="text-xs font-medium text-white/90">
            Installation successful! Enjoy Beats in fullscreen mode.
          </p>
        </div>
      )}

      {/* Grid: Badges & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        
        {/* Badges Box */}
        <div className="glass-card rounded-[32px] p-6 border-white/5 space-y-6">
          <h3 className="text-base font-bold tracking-tight text-glass flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#FF3B30]" />
            <span>Achievement Badges</span>
          </h3>

          <div className="space-y-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center space-x-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10 shadow-inner">
                  {badge.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white/90 text-glass">{badge.label}</h4>
                  <p className="text-[10px] text-white/40 font-light mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Box */}
        <div className="glass-card rounded-[32px] p-6 border-white/5 space-y-6">
          <h3 className="text-base font-bold tracking-tight text-glass flex items-center space-x-2">
            <Settings className="w-5 h-5 text-white/60" />
            <span>Preferences</span>
          </h3>

          <div className="space-y-4">
            
            {/* Reflection Setting */}
            <div className="flex items-center justify-between p-2">
              <div>
                <h4 className="text-sm font-semibold text-white/95">Liquid Glass Reflections</h4>
                <p className="text-[10px] text-white/40 font-light mt-0.5">
                  Shift highlight sheens based on page scroll coordinates.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reflectionsEnabled}
                  onChange={(e) => setReflectionsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#FF3B30]" />
              </label>
            </div>

            {/* Notifications Setting */}
            <div className="flex items-center justify-between p-2">
              <div>
                <h4 className="text-sm font-semibold text-white/95 flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-white/50" />
                  <span>Push Notifications</span>
                </h4>
                <p className="text-[10px] text-white/40 font-light mt-0.5">
                  Notify on daily streak triggers or milestones.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#FF3B30]" />
              </label>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center justify-between p-2">
              <div>
                <h4 className="text-sm font-semibold text-white/95 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-white/50" />
                  <span>Log Activity Metadata</span>
                </h4>
                <p className="text-[10px] text-white/40 font-light mt-0.5">
                  Securely send play sessions to neural recommender algorithms.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-white/40 uppercase bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                <span>Active</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
