'use client';

import { useEffect } from 'react';
import { useNavigationStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

// Views
import HomeView from '@/components/HomeView';
import PlayerView from '@/components/PlayerView';
import DiscoverView from '@/components/DiscoverView';
import AnalyticsView from '@/components/AnalyticsView';
import JourneyView from '@/components/JourneyView';
import MoodHubView from '@/components/MoodHubView';
import SearchView from '@/components/SearchView';
import ProfileView from '@/components/ProfileView';

// Core controllers
import AudioPlayer from '@/components/AudioPlayer';
import DynamicIsland from '@/components/DynamicIsland';
import LoginView from '@/components/LoginView';

function useVisibilityFreeze() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Keep track of active intervals and animation frame callbacks
        const activeIntervals = new Map<number, { handler: TimerHandler; timeout?: number; args: any[] }>();
        const activeFrames = new Map<number, FrameRequestCallback>();

        const originalSetInterval = window.setInterval;
        const originalClearInterval = window.clearInterval;
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        const originalCancelAnimationFrame = window.cancelAnimationFrame;

        let isAppHidden = document.hidden;

        // Monkey-patch setInterval to keep record of active intervals
        (window as any).setInterval = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
            const id = originalSetInterval(handler, timeout, ...args);
            if (!isAppHidden) {
                activeIntervals.set(id, { handler, timeout, args });
            }
            return id;
        };

        // Monkey-patch clearInterval
        (window as any).clearInterval = (id: any) => {
            activeIntervals.delete(id);
            originalClearInterval(id);
        };

        // Monkey-patch requestAnimationFrame
        (window as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
            const id = originalRequestAnimationFrame(callback);
            if (!isAppHidden) {
                activeFrames.set(id, callback);
            }
            return id;
        };

        // Monkey-patch cancelAnimationFrame
        (window as any).cancelAnimationFrame = (id: number) => {
            activeFrames.delete(id);
            originalCancelAnimationFrame(id);
        };

        const handleVisibilityChange = () => {
            isAppHidden = document.hidden;
            if (document.hidden) {
                // Suspends active animation frame crawlers
                activeFrames.forEach((_, id) => {
                    originalCancelAnimationFrame(id);
                });

                // Suspend active interval tickers
                activeIntervals.forEach((_, id) => {
                    originalClearInterval(id);
                });
            } else {
                // Restore requestAnimationFrame callback threads
                const framesToRestore = new Map(activeFrames);
                activeFrames.clear();
                framesToRestore.forEach((callback) => {
                    window.requestAnimationFrame(callback);
                });

                // Restore setInterval polling ticks
                const intervalsToRestore = new Map(activeIntervals);
                activeIntervals.clear();
                intervalsToRestore.forEach((item) => {
                    window.setInterval(item.handler, item.timeout, ...item.args);
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.setInterval = originalSetInterval;
            window.clearInterval = originalClearInterval;
            window.requestAnimationFrame = originalRequestAnimationFrame;
            window.cancelAnimationFrame = originalCancelAnimationFrame;
        };
    }, []);
}

export default function AppContainer() {
  const { activeTab } = useNavigationStore();
  const { username } = useAuth();

  useVisibilityFreeze();

  if (!username) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeView />;
      case 'Player':
        return <PlayerView />;
      case 'Discover':
        return <DiscoverView />;
      case 'Analytics':
        return <AnalyticsView />;
      case 'Journey':
        return <JourneyView />;
      case 'Moods':
        return <MoodHubView />;
      case 'Search':
        return <SearchView />;
      case 'Profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <main className="min-h-screen bg-black text-[#F5F5F7] flex flex-col relative overflow-hidden">
      
      {/* Floating subtle ambient glows for Apple depth material feel */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF3B30]/5 blur-[120px] pointer-events-none -z-20" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px] pointer-events-none -z-20" />

      {/* Hidden Audio Driver */}
      <AudioPlayer />

      {/* Active Screen View */}
      <div className="flex-1 flex flex-col w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col w-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Pill Dynamic Island */}
      <DynamicIsland />
      
    </main>
  );
}
