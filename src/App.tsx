/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameScreen } from './types/game';
import { soundEngine } from './services/audio';
import { checkAndUpdateDailyStreak, getCurrentStreak } from './utils/streak';
import { TitleScreen } from './components/TitleScreen';
import { BalloonPopGame } from './components/BalloonPopGame';
import { LetterTracingGame } from './components/LetterTracingGame';
import { SafariTrainGame } from './components/SafariTrainGame';
import { AlphabetSoundboard } from './components/AlphabetSoundboard';
import { StickerBookModal } from './components/StickerBookModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('TITLE');
  const [starsCount, setStarsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abc_game_stars');
      return saved ? parseInt(saved, 10) : 5; // Start with 5 welcome stars!
    }
    return 5;
  });

  const [unlockedLetters, setUnlockedLetters] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abc_unlocked_letters');
      return saved ? JSON.parse(saved) : ['A', 'B', 'C']; // Start with A, B, C unlocked
    }
    return ['A', 'B', 'C'];
  });

  const [dailyStreak, setDailyStreak] = useState<number>(() => getCurrentStreak());
  const [streakRewardMessage, setStreakRewardMessage] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [isStickerBookOpen, setIsStickerBookOpen] = useState<boolean>(false);

  // Sync stars to localStorage
  const handleAddStars = useCallback((count: number) => {
    setStarsCount((prev) => {
      const updated = prev + count;
      localStorage.setItem('abc_game_stars', String(updated));
      return updated;
    });
  }, []);

  // Unlock letters as child learns them
  const handleLetterLearned = useCallback((letter: string) => {
    setUnlockedLetters((prev) => {
      if (!prev.includes(letter)) {
        const updated = [...prev, letter];
        localStorage.setItem('abc_unlocked_letters', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Check and reward daily streak on initial load
  useEffect(() => {
    const result = checkAndUpdateDailyStreak();
    setDailyStreak(result.streak);

    if (result.isNewRewardToday && result.bonusAwarded > 0) {
      handleAddStars(result.bonusAwarded);
      setStreakRewardMessage(result.message);

      // Audio celebration
      setTimeout(() => {
        soundEngine.playFanfare();
        soundEngine.speak(result.message);
      }, 500);

      // Auto dismiss message banner after 7 seconds
      const timer = setTimeout(() => {
        setStreakRewardMessage(null);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [handleAddStars]);

  // Global key listener for back to menu
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentScreen !== 'TITLE') {
        soundEngine.playPop();
        setCurrentScreen('TITLE');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentScreen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-900 font-display">
      {/* State-driven Screen Switcher */}
      {currentScreen === 'TITLE' && (
        <TitleScreen
          onSelectMode={(mode) => setCurrentScreen(mode)}
          onOpenStickerBook={() => setIsStickerBookOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          starsCount={starsCount}
          dailyStreak={dailyStreak}
          streakRewardMessage={streakRewardMessage}
          onDismissStreakReward={() => setStreakRewardMessage(null)}
        />
      )}

      {currentScreen === 'BALLOON_POP' && (
        <BalloonPopGame
          onBackToMenu={() => setCurrentScreen('TITLE')}
          onLetterLearned={handleLetterLearned}
          onAddStars={handleAddStars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {currentScreen === 'LETTER_TRACING' && (
        <LetterTracingGame
          onBackToMenu={() => setCurrentScreen('TITLE')}
          onLetterLearned={handleLetterLearned}
          onAddStars={handleAddStars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {currentScreen === 'SAFARI_TRAIN' && (
        <SafariTrainGame
          onBackToMenu={() => setCurrentScreen('TITLE')}
          onLetterLearned={handleLetterLearned}
          onAddStars={handleAddStars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {currentScreen === 'ABC_JUKEBOX' && (
        <AlphabetSoundboard
          onBackToMenu={() => setCurrentScreen('TITLE')}
          onLetterLearned={handleLetterLearned}
          onAddStars={handleAddStars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Rewards / Sticker Book Modal */}
      <StickerBookModal
        isOpen={isStickerBookOpen}
        onClose={() => setIsStickerBookOpen(false)}
        unlockedLetters={unlockedLetters}
        starsCount={starsCount}
        dailyStreak={dailyStreak}
      />
    </div>
  );
}
