'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Headphones, ArrowRight } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please tell us who is listening.');
      return;
    }
    setError('');
    login(trimmed);
  };

  return (
    <div className="min-h-screen w-full bg-black text-[#F5F5F7] flex items-center justify-center relative overflow-hidden font-sans px-4">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF3B30]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-md glass-card rounded-[36px] p-8 md:p-10 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative z-10 text-center animate-fade-in">
        
        {/* Animated Waveform Visualizer */}
        <div className="flex items-end justify-center space-x-1.5 h-12 mb-8">
          <div className="w-1 bg-[#FF3B30] rounded-full animate-wave-bar h-4 animation-delay-100" />
          <div className="w-1 bg-[#FF3B30] rounded-full animate-wave-bar h-8 animation-delay-300" />
          <div className="w-1 bg-white/70 rounded-full animate-wave-bar h-12 animation-delay-500" />
          <div className="w-1 bg-[#FF3B30] rounded-full animate-wave-bar h-6 animation-delay-200" />
          <div className="w-1 bg-white/40 rounded-full animate-wave-bar h-10 animation-delay-400" />
          <div className="w-1 bg-[#FF3B30] rounded-full animate-wave-bar h-5 animation-delay-600" />
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Headphones className="w-6 h-6 text-[#FF3B30]" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">Beats PWA</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-glass mb-3">
          Welcome to Beats
        </h1>
        <p className="text-sm text-white/50 font-light leading-relaxed mb-8 max-w-xs mx-auto">
          Elevate your frequency with personalized, user-scoped AI recommendation matrices.
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 px-1">
              Identify Yourself
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Who is listening?"
              className={`w-full px-5 py-4 rounded-2xl bg-white/5 border text-sm text-white placeholder-white/30 focus:outline-none transition duration-300 ${
                error 
                  ? 'border-red-500/40 focus:border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.1)]' 
                  : 'border-white/10 focus:border-[#FF3B30]/50 focus:shadow-[0_0_15px_rgba(255,59,48,0.15)]'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500/80 font-light mt-2 px-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF3B30] to-[#FF453A] hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(255,59,48,0.3)] flex items-center justify-center space-x-2 group relative overflow-hidden ripple"
          >
            <span>Launch Beats</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center space-x-2 text-xs text-white/30 font-light">
          <Sparkles className="w-3.5 h-3.5 text-[#FF3B30]" />
          <span>Powered by multi-tenant Random Forest recommendations</span>
        </div>
      </div>
    </div>
  );
}
