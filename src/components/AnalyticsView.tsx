'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  Flame, 
  Award, 
  Heart, 
  Sparkles,
  ChevronUp
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getAnalyticsSummary } from '@/lib/api';
import { AnalyticsSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Harmonious black, white, and red color palette for the luxury donut chart
const COLORS = [
  '#FF3B30', // Vibrant Red Accent
  '#F5F5F7', // Bright White
  'rgba(255, 255, 255, 0.6)', // Muted White
  'rgba(255, 255, 255, 0.3)', // Soft Grey
  'rgba(255, 255, 255, 0.12)', // Deep Grey
];

export default function AnalyticsView() {
  const { username } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await getAnalyticsSummary(username);
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [username]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-32 animate-pulse space-y-8 font-sans">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 lg:col-span-2 bg-white/5 rounded-3xl" />
          <div className="h-80 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.totalTime === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              DASHBOARD
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glass mt-1">
              Your Music DNA
            </h1>
          </div>
        </div>

        <div className="glass-card rounded-[32px] border-white/5 p-12 text-center max-w-2xl mx-auto mt-12 flex flex-col items-center justify-center space-y-6 min-h-[400px] animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner animate-pulse">
            🧬
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-bold tracking-tight text-glass">DNA In Synthesis</h3>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Your music DNA is building. Start listening to see your stats.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-3 py-2 rounded-xl border-white/10 text-xs shadow-xl font-medium">
          <span className="text-[#FF3B30]">{payload[0].name}: </span>
          <span className="text-white">{payload[0].value}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-32 font-sans text-[#F5F5F7]">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            DASHBOARD
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glass mt-1">
            Your Music DNA
          </h1>
        </div>
        
        {/* Streak indicator */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 self-start md:self-auto shadow-sm">
          <Flame className="w-4 h-4 text-[#FF3B30] fill-[#FF3B30]" />
          <span className="text-xs font-semibold text-white/80">
            {data.streak} Day Listening Streak
          </span>
        </div>
      </div>

      {/* Grid: 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Time */}
        <div className="glass-card rounded-2xl p-5 border-white/5 text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-white/40">
            <Clock className="w-4 h-4" />
            <div className="flex items-center text-[#FF3B30] text-xs font-semibold">
              <ChevronUp className="w-3.5 h-3.5" />
              <span>18%</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-white/50 font-light block">Total Hours</span>
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-glass mt-1 block">
              {Math.round(data.totalTime / 60)}h
            </span>
          </div>
        </div>

        {/* Weekly Time */}
        <div className="glass-card rounded-2xl p-5 border-white/5 text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-white/40">
            <Calendar className="w-4 h-4" />
            <div className="flex items-center text-[#FF3B30] text-xs font-semibold">
              <ChevronUp className="w-3.5 h-3.5" />
              <span>4.2%</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-white/50 font-light block">This Week</span>
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-glass mt-1 block">
              {data.weeklyTime}m
            </span>
          </div>
        </div>

        {/* Top Artist */}
        <div className="glass-card rounded-2xl p-5 border-white/5 text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-white/40">
            <Award className="w-4 h-4 text-[#FF3B30]" />
          </div>
          <div>
            <span className="text-xs text-white/50 font-light block">Top Artist</span>
            <span className="text-lg md:text-xl font-bold tracking-tight text-glass mt-1 block truncate">
              {data.topArtist}
            </span>
          </div>
        </div>

        {/* Top Song */}
        <div className="glass-card rounded-2xl p-5 border-white/5 text-left relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-white/40">
            <Heart className="w-4 h-4 text-[#FF3B30] fill-[#FF3B30]" />
          </div>
          <div>
            <span className="text-xs text-white/50 font-light block">Top Song</span>
            <span className="text-lg md:text-xl font-bold tracking-tight text-glass mt-1 block truncate">
              {data.topSong}
            </span>
          </div>
        </div>

      </div>

      {/* Row: Donut Chart & Activity Rings & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Genre Distribution (Recharts) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border-white/5 flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-glass text-left">
              Genre Distribution
            </h3>
            <p className="text-xs text-white/40 font-light text-left mt-0.5">
              Listening frequencies segmented by style
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
            {/* Pie Chart */}
            <div className="w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex-1 w-full space-y-2 text-left">
              {data.genreData.map((genre, idx) => (
                <div key={genre.name} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-white/80 font-medium">{genre.name}</span>
                  </div>
                  <span className="text-white/40 font-bold">{genre.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Circular Progress Goals */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border-white/5 flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-glass text-left">
              Listening Goals
            </h3>
            <p className="text-xs text-white/40 font-light text-left mt-0.5">
              Progress gauges relative to targets
            </p>
          </div>

          {/* 3 Circular SVG Rings */}
          <div className="grid grid-cols-3 gap-2 py-4">
            {data.circularProgress.map((ring) => {
              const radius = 28;
              const stroke = 3.5;
              const normalizedRadius = radius - stroke * 2;
              const circumference = normalizedRadius * 2 * Math.PI;
              const strokeDashoffset = circumference - (ring.value / 100) * circumference;

              return (
                <div key={ring.label} className="flex flex-col items-center space-y-2">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        stroke="rgba(255,255,255,0.06)"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx="40"
                        cy="40"
                      />
                      {/* Foreground Circle */}
                      <circle
                        stroke={ring.color === '#FF3B30' ? '#FF3B30' : ring.color}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx="40"
                        cy="40"
                      />
                    </svg>
                    {/* Inner Label */}
                    <div className="absolute text-[11px] font-bold text-white text-glass">
                      {ring.value}%
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 tracking-wider font-semibold uppercase text-center">
                    {ring.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Section: 7-Day Activity Grid */}
      <div className="glass-card rounded-3xl p-6 border-white/5 mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-bold tracking-tight text-glass">
              Listening Heatmap
            </h3>
            <p className="text-xs text-white/40 font-light mt-0.5">
              Daily song playback frequency
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 bg-white/10 rounded" />
            <span className="text-[10px] text-white/30 font-semibold uppercase mr-3">Less</span>
            <span className="w-2.5 h-2.5 bg-[#FF3B30] rounded" />
            <span className="text-[10px] text-white/30 font-semibold uppercase">More</span>
          </div>
        </div>

        {/* Sleek Vertical bars for 7 days */}
        <div className="flex items-end justify-between h-32 px-4 md:px-12 bg-white/5 rounded-2xl py-4 border border-white/5">
          {data.heatmapData.map((day) => {
            const maxCount = 12;
            const percentage = Math.min((day.count / maxCount) * 100, 100);
            
            return (
              <div key={day.day} className="flex flex-col items-center space-y-3 flex-1">
                <div className="w-6 md:w-10 bg-white/5 rounded-full h-20 relative overflow-hidden flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-[#FF3B30] to-[#FF3B30]/70 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(255,59,48,0.2)]"
                    style={{ height: `${percentage}%` }}
                  />
                  <div className="absolute top-1 inset-x-0 text-[10px] font-bold text-white/60">
                    {day.count}
                  </div>
                </div>
                <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
