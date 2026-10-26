/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, Sparkles } from 'lucide-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { soundEngine } from '../services/audio';

interface StickerBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedLetters: string[];
  starsCount: number;
  dailyStreak: number;
}

export const StickerBookModal: React.FC<StickerBookModalProps> = ({
  isOpen,
  onClose,
  unlockedLetters,
  starsCount,
  dailyStreak,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-400 flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-900" />
            <div>
              <h2 className="text-xl md:text-2xl font-black font-display leading-tight">Safari Sticker Book</h2>
              <span className="text-xs font-bold text-amber-900">
                Collect stickers by popping, tracing, and matching letters!
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playPop();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stats Strip */}
        <div className="px-6 py-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-950">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">⭐</span>
            <span>Stars: </span>
            <span className="font-mono-numbers text-base font-black text-amber-900">{starsCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span>Streak: </span>
            <span className="font-mono-numbers text-base font-black text-orange-900">{dailyStreak} Days</span>
          </div>
          <div>
            <span>Stickers: </span>
            <span className="font-mono-numbers text-base font-black text-amber-900">
              {unlockedLetters.length} / 26
            </span>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {ALPHABET_DATA.map((item) => {
              const isUnlocked = unlockedLetters.includes(item.letter);
              return (
                <div
                  key={item.letter}
                  onClick={() => {
                    if (isUnlocked) {
                      soundEngine.playSuccess();
                      soundEngine.speakLetter(item.letter, item.word);
                    } else {
                      soundEngine.playBoop();
                      soundEngine.speak(`Play games to unlock sticker ${item.letter}!`);
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isUnlocked
                      ? 'bg-white border-amber-300 shadow-md hover:scale-105 active:scale-95'
                      : 'bg-slate-200/60 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <span className={`text-4xl mb-1 ${isUnlocked ? 'filter-none' : 'grayscale opacity-40'}`}>
                    {item.icon}
                  </span>
                  <span className="font-black text-base font-display text-slate-800">
                    {item.letter} {item.lowercase}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 truncate max-w-full">
                    {isUnlocked ? item.word : '???'}
                  </span>
                  {isUnlocked && (
                    <span className="text-[10px] mt-1 text-amber-600 font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-amber-200 text-center">
          <button
            onClick={() => {
              soundEngine.playPop();
              onClose();
            }}
            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-2xl shadow-md border-2 border-amber-500 active:scale-95 transition-transform"
          >
            Keep Exploring!
          </button>
        </div>
      </div>
    </div>
  );
};
