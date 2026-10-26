/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { LetterData } from '../types/game';
import { soundEngine } from '../services/audio';

interface AlphabetSoundboardProps {
  onBackToMenu: () => void;
  onLetterLearned: (letter: string) => void;
  onAddStars: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const AlphabetSoundboard: React.FC<AlphabetSoundboardProps> = ({
  onBackToMenu,
  onLetterLearned,
  onAddStars,
  isMuted,
  onToggleMute,
}) => {
  const [filter, setFilter] = useState<'all' | 'vowels' | 'consonants'>('all');
  const [activeLetter, setActiveLetter] = useState<LetterData | null>(null);
  const [isSinging, setIsSinging] = useState<boolean>(false);
  const songTimerRef = useRef<number | null>(null);
  const songIndexRef = useRef<number>(0);

  const displayedLetters = ALPHABET_DATA.filter((l) => {
    if (filter === 'vowels') return l.category === 'vowel';
    if (filter === 'consonants') return l.category === 'consonant';
    return true;
  });

  const handleLetterClick = (item: LetterData) => {
    stopSong();
    setActiveLetter(item);
    soundEngine.playPop();
    soundEngine.speakLetter(item.letter, item.word);
    onLetterLearned(item.letter);
    onAddStars(1);
  };

  const stopSong = () => {
    if (songTimerRef.current) {
      window.clearInterval(songTimerRef.current);
      songTimerRef.current = null;
    }
    setIsSinging(false);
  };

  const startSong = () => {
    if (isSinging) {
      stopSong();
      return;
    }

    setIsSinging(true);
    songIndexRef.current = 0;

    const playNext = () => {
      if (songIndexRef.current >= ALPHABET_DATA.length) {
        stopSong();
        soundEngine.playFanfare();
        soundEngine.speak('Now I know my ABCs, next time won’t you sing with me!');
        return;
      }

      const current = ALPHABET_DATA[songIndexRef.current];
      setActiveLetter(current);
      soundEngine.playSuccess();
      soundEngine.speak(current.letter, 1.05, 1.25);
      songIndexRef.current++;
    };

    playNext();
    songTimerRef.current = window.setInterval(playNext, 1200);
  };

  useEffect(() => {
    return () => {
      if (songTimerRef.current) clearInterval(songTimerRef.current);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-gradient-to-b from-amber-100 via-yellow-50 to-orange-100 flex flex-col">
      {/* Top Perimeter HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-amber-200 shrink-0">
        <button
          onClick={() => {
            stopSong();
            soundEngine.playPop();
            onBackToMenu();
          }}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform text-sm font-bold"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
          <span>Menu</span>
        </button>

        {/* Sing ABC Song Button */}
        <button
          onClick={startSong}
          className={`flex items-center gap-2 px-5 py-2 rounded-3xl font-black text-sm md:text-base border-2 shadow-md active:scale-95 transition-all ${
            isSinging
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-500'
          }`}
        >
          {isSinging ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isSinging ? 'Pause Song' : 'Sing ABC Song!'}</span>
          <Music className="w-4 h-4" />
        </button>

        {/* Filter segmented controls */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-amber-100/80 rounded-2xl border border-amber-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filter === 'all' ? 'bg-white text-amber-950 shadow-sm' : 'text-slate-600'
            }`}
          >
            All 26
          </button>
          <button
            onClick={() => setFilter('vowels')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              filter === 'vowels' ? 'bg-white text-amber-950 shadow-sm' : 'text-slate-600'
            }`}
          >
            Vowels (A E I O U)
          </button>
        </div>

        <button
          onClick={onToggleMute}
          className="p-2 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
        </button>
      </div>

      {/* Main Chunky Soundboard Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5 md:gap-3.5 pb-20">
          {displayedLetters.map((item) => {
            const isActive = activeLetter?.letter === item.letter;
            return (
              <button
                key={item.letter}
                onClick={() => handleLetterClick(item)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all transform active:scale-95 cursor-pointer shadow-md ${
                  isActive
                    ? 'bg-amber-300 border-amber-500 scale-105 shadow-xl ring-4 ring-amber-400/50'
                    : 'bg-white hover:bg-amber-50/50 border-amber-200/80'
                }`}
              >
                <span className="text-3xl md:text-4xl mb-0.5">{item.icon}</span>
                <span
                  className="text-2xl md:text-3xl font-black font-display"
                  style={{ color: item.color }}
                >
                  {item.letter}
                  <span className="text-lg md:text-xl font-bold opacity-80 lowercase ml-0.5">
                    {item.lowercase}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-full">
                  {item.word}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom active letter detail popout banner */}
      {activeLetter && (
        <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto bg-white/95 rounded-3xl p-3.5 border-2 border-amber-300 shadow-2xl flex items-center justify-between animate-fade-in z-30">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{activeLetter.icon}</span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-amber-900">{activeLetter.letter}</span>
                <span className="text-sm font-bold text-slate-700">is for {activeLetter.word}</span>
              </div>
              <p className="text-xs text-slate-500">{activeLetter.funFact}</p>
            </div>
          </div>

          <button
            onClick={() => soundEngine.speakLetter(activeLetter.letter, activeLetter.word)}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl font-bold active:scale-90 transition-transform shadow-sm"
            title="Hear Sound"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
