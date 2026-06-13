'use client';

import { useNavigationStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AppContainer() {
  const { activeTab } = useNavigationStore();

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
