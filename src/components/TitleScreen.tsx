/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Award } from 'lucide-react';
import { GameScreen } from '../types/game';
import { soundEngine } from '../services/audio';

interface TitleScreenProps {
  onSelectMode: (mode: GameScreen) => void;
  onOpenStickerBook: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  starsCount: number;
  dailyStreak: number;
  streakRewardMessage: string | null;
  onDismissStreakReward: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onSelectMode,
  onOpenStickerBook,
  isMuted,
  onToggleMute,
  starsCount,
  dailyStreak,
  streakRewardMessage,
  onDismissStreakReward,
}) => {
  // Global Enter / Space listener for quick start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.playSuccess();
        soundEngine.speak('Welcome to ABC Safari! Let us play Balloon Pop!');
        onSelectMode('BALLOON_POP');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-200">
      {/* Live world atmospheric hero background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/abc_safari_hero_1792756384935.jpg"
          alt="ABC Safari Wonderland"
          className="w-full h-full object-cover object-center filter saturate-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft contrast gradient scrim maintaining legibility while keeping visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-black/25 to-sky-950/30" />
      </div>

      {/* Floating interactive clouds / letters in negative space */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute top-12 left-10 text-4xl animate-bounce opacity-80 duration-1000">🎈</div>
        <div className="absolute top-20 right-16 text-5xl animate-bounce delay-300 opacity-90">⭐</div>
        <div className="absolute bottom-28 left-16 text-4xl animate-pulse opacity-75">🦁</div>
        <div className="absolute bottom-32 right-20 text-4xl animate-pulse delay-200 opacity-75">🐘</div>
      </div>

      {/* Top perimeter cluster: Stars, Daily Streak, Audio & Sticker Book */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2.5">
          {/* Star counter */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-md border-2 border-amber-300">
            <span className="text-xl">⭐</span>
            <span className="text-amber-800 font-bold text-lg font-mono-numbers">{starsCount}</span>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Stars</span>
          </div>

          {/* Daily streak counter */}
          <div
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-md border-2 border-orange-300"
            title={`Daily Streak: ${dailyStreak} day${dailyStreak === 1 ? '' : 's'} in a row! Come back every day for bonus stars.`}
          >
            <span className="text-xl">🔥</span>
            <span className="text-orange-900 font-bold text-lg font-mono-numbers">{dailyStreak}</span>
            <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
              {dailyStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playSuccess();
              onOpenStickerBook();
            }}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2.5 rounded-2xl shadow-md active:scale-95 transition-transform font-bold text-sm border-2 border-amber-500"
            aria-label="Open Sticker Album"
          >
            <Award className="w-5 h-5 text-amber-900" />
            <span>Sticker Book</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-2xl shadow-md active:scale-95 transition-transform border-2 border-slate-200"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-rose-500" /> : <Volume2 className="w-6 h-6 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Daily Streak Reward Celebration Banner */}
      {streakRewardMessage && (
        <div className="relative z-30 flex justify-center px-4 mt-2">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 px-5 py-2.5 rounded-2xl shadow-xl border-2 border-white flex items-center gap-3 animate-bounce">
            <span className="text-2xl">🎉</span>
            <span className="text-sm md:text-base font-black font-display">{streakRewardMessage}</span>
            <button
              onClick={onDismissStreakReward}
              className="ml-2 text-amber-900 hover:text-amber-950 font-extrabold text-xs bg-white/70 hover:bg-white rounded-full px-2 py-0.5 cursor-pointer transition-colors"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Centerpiece Hero Lockup with Bespoke Inline SVG */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto h-[calc(100vh-140px)]">
        {/* Inline SVG Title Lockup */}
        <div className="w-full max-w-xl mb-4 drop-shadow-xl animate-fade-in">
          <svg viewBox="0 0 700 170" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#064E3B" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Background pill cloud shape */}
            <path
              d="M 120 85 C 100 30, 200 10, 260 40 C 310 15, 420 15, 470 42 C 540 10, 620 40, 590 90 C 625 140, 530 165, 460 145 C 400 165, 270 165, 220 145 C 140 160, 80 130, 120 85 Z"
              fill="#FFFFFF"
              fillOpacity="0.92"
              stroke="#FDE047"
              strokeWidth="6"
              filter="url(#shadow)"
            />

            {/* Title Text */}
            <text
              x="350"
              y="75"
              textAnchor="middle"
              fontFamily="Fredoka, Outfit, sans-serif"
              fontWeight="900"
              fontSize="52"
              letterSpacing="3"
              fill="url(#titleGrad)"
              stroke="#B45309"
              strokeWidth="2.5"
            >
              ABC SAFARI
            </text>

            <text
              x="350"
              y="125"
              textAnchor="middle"
              fontFamily="Fredoka, Outfit, sans-serif"
              fontWeight="700"
              fontSize="28"
              letterSpacing="6"
              fill="#065F46"
            >
              ALPHABET ADVENTURE
            </text>
          </svg>
        </div>

        <p className="text-white text-base md:text-lg font-medium drop-shadow-md max-w-md mb-6">
          Fun phonics, balloon popping, and letter writing for Little Explorers!
        </p>

        {/* Primary CTA (Enter/Space to start) */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <button
            onClick={() => {
              soundEngine.playSuccess();
              soundEngine.speak('Let us pop letters!');
              onSelectMode('BALLOON_POP');
            }}
            className="group relative w-full py-4 px-8 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-amber-950 font-black text-2xl md:text-3xl rounded-3xl shadow-2xl border-4 border-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Sparkles className="w-8 h-8 text-amber-900 animate-spin" style={{ animationDuration: '4s' }} />
            <span>PLAY ADVENTURE</span>
            <span className="text-xl">🚀</span>
          </button>

          {/* Quick Game Mode Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full mt-2">
            <button
              onClick={() => {
                soundEngine.playPop();
                onSelectMode('BALLOON_POP');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/95 hover:bg-white border-2 border-rose-300 shadow-lg active:scale-95 transition-all text-slate-800"
            >
              <span className="text-3xl mb-1">🎈</span>
              <span className="text-sm font-bold text-rose-700">Balloon Pop</span>
              <span className="text-[11px] text-slate-500 font-medium">Letter Catch</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playSuccess();
                onSelectMode('LETTER_TRACING');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/95 hover:bg-white border-2 border-indigo-300 shadow-lg active:scale-95 transition-all text-slate-800"
            >
              <span className="text-3xl mb-1">✍️</span>
              <span className="text-sm font-bold text-indigo-700">Magic Trace</span>
              <span className="text-[11px] text-slate-500 font-medium">Write Letters</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playWhistle();
                onSelectMode('SAFARI_TRAIN');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/95 hover:bg-white border-2 border-emerald-300 shadow-lg active:scale-95 transition-all text-slate-800"
            >
              <span className="text-3xl mb-1">🚂</span>
              <span className="text-sm font-bold text-emerald-700">Cargo Train</span>
              <span className="text-[11px] text-slate-500 font-medium">Phonics Match</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playSuccess();
                onSelectMode('ABC_JUKEBOX');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/95 hover:bg-white border-2 border-amber-300 shadow-lg active:scale-95 transition-all text-slate-800"
            >
              <span className="text-3xl mb-1">🎵</span>
              <span className="text-sm font-bold text-amber-700">ABC Jukebox</span>
              <span className="text-[11px] text-slate-500 font-medium">Song & Sounds</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flat control-hint line along bottom (as required by game craft guidelines) */}
      <div className="absolute bottom-3 left-0 right-0 z-20 text-center pointer-events-none">
        <p className="text-xs md:text-sm font-semibold tracking-wide text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Space / Enter to Start · WASD / Arrow Keys Move · Mouse / Touch Pop · Esc Pause
        </p>
      </div>
    </div>
  );
};
