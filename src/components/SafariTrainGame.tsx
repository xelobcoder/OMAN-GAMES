/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { LetterData } from '../types/game';
import { soundEngine } from '../services/audio';

interface SafariTrainGameProps {
  onBackToMenu: () => void;
  onLetterLearned: (letter: string) => void;
  onAddStars: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SafariTrainGame: React.FC<SafariTrainGameProps> = ({
  onBackToMenu,
  onLetterLearned,
  onAddStars,
  isMuted,
  onToggleMute,
}) => {
  const [currentLetter, setCurrentLetter] = useState<LetterData>(ALPHABET_DATA[0]);
  const [options, setOptions] = useState<LetterData[]>([]);
  const [isTrainMoving, setIsTrainMoving] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [roundCompleted, setRoundCompleted] = useState<number>(0);

  // Set up a new question
  const setupTrainRound = (targetIndex?: number) => {
    const idx = targetIndex !== undefined ? targetIndex : Math.floor(Math.random() * ALPHABET_DATA.length);
    const target = ALPHABET_DATA[idx];
    setCurrentLetter(target);

    // Pick 2 other random distractors
    const distractors: LetterData[] = [];
    while (distractors.length < 2) {
      const rand = ALPHABET_DATA[Math.floor(Math.random() * ALPHABET_DATA.length)];
      if (rand.letter !== target.letter && !distractors.some((d) => d.letter === rand.letter)) {
        distractors.push(rand);
      }
    }

    // Shuffle options
    const choices = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(choices);

    soundEngine.playWhistle();
    soundEngine.speak(`The train needs cargo for letter ${target.letter}! What starts with ${target.letter}?`);
  };

  useEffect(() => {
    setupTrainRound(0);
  }, []);

  const handleSelectOption = (chosen: LetterData) => {
    if (isTrainMoving) return;

    if (chosen.letter === currentLetter.letter) {
      // Correct cargo!
      soundEngine.playSuccess();
      soundEngine.speakLetter(chosen.letter, chosen.word);
      setIsTrainMoving(true);
      setStreak((prev) => prev + 1);
      const newRound = roundCompleted + 1;
      setRoundCompleted(newRound);
      onLetterLearned(chosen.letter);
      onAddStars(2);

      // Chug train away and bring in next station
      setTimeout(() => {
        setIsTrainMoving(false);
        const nextIdx = (ALPHABET_DATA.findIndex((l) => l.letter === currentLetter.letter) + 1) % ALPHABET_DATA.length;
        setupTrainRound(nextIdx);
      }, 1600);
    } else {
      // Friendly non-punishing feedback
      soundEngine.playBoop();
      soundEngine.speak(`That is ${chosen.word} for letter ${chosen.letter}. Try looking for ${currentLetter.letter}!`);
      setStreak(0);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-emerald-100">
      {/* Background Storybook Scenery */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/safari_train_landscape_1792756385970.jpg"
          alt="Safari Train Landscape"
          className="w-full h-full object-cover object-center opacity-85"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-black/20" />
      </div>

      {/* Top Perimeter HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-emerald-200">
        <button
          onClick={() => {
            soundEngine.playPop();
            onBackToMenu();
          }}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform text-sm font-bold"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
          <span>Menu</span>
        </button>

        <div className="bg-white px-5 py-2 rounded-3xl shadow-md border-2 border-emerald-400 text-center">
          <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider block">Station Target</span>
          <span className="text-2xl md:text-3xl font-black font-display text-emerald-700">
            Letter {currentLetter.letter}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setupTrainRound()}
            className="p-2 bg-white text-slate-700 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform"
            title="Next Cargo"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Train Wagon Centerpiece Track */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-240px)] px-4">
        {/* Animated Toy Train */}
        <div
          className={`flex items-end gap-3 transition-transform duration-1000 ${
            isTrainMoving ? 'translate-x-[120vw]' : 'translate-x-0'
          }`}
        >
          {/* Engine Locomotive */}
          <div className="relative bg-rose-500 w-36 h-28 rounded-t-3xl border-4 border-rose-700 shadow-xl flex flex-col items-center justify-end pb-2">
            {/* Smokestack puff */}
            <div className="absolute -top-6 left-5 w-8 h-8 bg-slate-200 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-5 left-6 w-6 h-6 bg-rose-700 rounded-t-md" />
            <span className="text-3xl">🚂</span>
            <span className="text-xs font-black text-white uppercase tracking-wider">Choo Choo!</span>
            {/* Wheels */}
            <div className="absolute -bottom-4 left-3 w-8 h-8 rounded-full bg-slate-800 border-2 border-yellow-400 animate-spin" />
            <div className="absolute -bottom-4 right-3 w-8 h-8 rounded-full bg-slate-800 border-2 border-yellow-400 animate-spin" />
          </div>

          {/* Letter Cargo Wagon */}
          <div className="relative bg-amber-400 w-44 h-28 rounded-2xl border-4 border-amber-600 shadow-xl flex flex-col items-center justify-center">
            <span className="text-xs uppercase font-extrabold text-amber-900 tracking-wider">Letter Wagon</span>
            <span className="text-6xl font-black font-display text-amber-950">{currentLetter.letter}</span>
            {/* Wheels */}
            <div className="absolute -bottom-4 left-4 w-7 h-7 rounded-full bg-slate-800 border-2 border-yellow-400 animate-spin" />
            <div className="absolute -bottom-4 right-4 w-7 h-7 rounded-full bg-slate-800 border-2 border-yellow-400 animate-spin" />
          </div>
        </div>

        {/* Railroad Tracks */}
        <div className="w-full max-w-2xl h-4 bg-amber-900/60 rounded-full mt-4 flex items-center justify-around px-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-2.5 h-6 bg-amber-950 rounded-sm -my-1" />
          ))}
        </div>
      </div>

      {/* Cargo Options Selection Strip (Preschool friendly chunky cards) */}
      <div className="absolute bottom-6 left-4 right-4 z-20 max-w-2xl mx-auto">
        <div className="bg-white/95 rounded-3xl p-4 shadow-2xl border-4 border-emerald-300">
          <p className="text-center text-sm md:text-base font-bold text-slate-700 mb-3">
            Which cargo begins with letter <span className="text-emerald-700 font-extrabold text-lg">{currentLetter.letter}</span>?
          </p>

          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => (
              <button
                key={opt.letter}
                onClick={() => handleSelectOption(opt)}
                disabled={isTrainMoving}
                className="flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl bg-gradient-to-b from-white to-emerald-50 hover:to-emerald-100 border-2 border-emerald-300 shadow-md active:scale-95 transition-all text-slate-800 cursor-pointer disabled:opacity-75"
              >
                <span className="text-4xl md:text-5xl mb-1">{opt.icon}</span>
                <span className="text-sm md:text-base font-black text-slate-800">{opt.word}</span>
                <span className="text-xs font-bold text-emerald-600">Letter {opt.letter}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
