/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameScreen = 'TITLE' | 'BALLOON_POP' | 'LETTER_TRACING' | 'SAFARI_TRAIN' | 'ABC_JUKEBOX';

export type GameModeStatus = 'PLAYING' | 'PAUSED' | 'VICTORY' | 'ROUND_SUMMARY';

export interface LetterGuidePoint {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
}

export interface LetterStroke {
  id: number;
  points: LetterGuidePoint[];
  instruction?: string;
}

export interface LetterData {
  letter: string;
  lowercase: string;
  word: string;
  phonics: string;
  icon: string;
  category: 'vowel' | 'consonant';
  funFact: string;
  color: string;
  accentColor: string;
  strokes: LetterStroke[];
}

export interface StickerReward {
  id: string;
  letter: string;
  name: string;
  icon: string;
  unlockedAt?: number;
}

export interface PlayerStats {
  stars: number;
  dailyStreak: number;
  totalPops: number;
  tracedLetters: string[];
  matchedTrains: number;
  unlockedStickers: string[];
}
