/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyStreakResult {
  streak: number;
  bonusAwarded: number;
  isNewRewardToday: boolean;
  message: string;
}

const STORAGE_KEY = 'abc_daily_streak_data';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check and update the user's daily streak.
 * Returns streak info and how many bonus stars were earned.
 */
export function checkAndUpdateDailyStreak(): DailyStreakResult {
  if (typeof window === 'undefined') {
    return { streak: 1, bonusAwarded: 0, isNewRewardToday: false, message: '' };
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let stored: { streak: number; lastDate: string } | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    stored = null;
  }

  // Case 1: First time user ever opens the app
  if (!stored) {
    const initialStreak = 1;
    const bonus = 5;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: initialStreak, lastDate: today }));
    return {
      streak: initialStreak,
      bonusAwarded: bonus,
      isNewRewardToday: true,
      message: 'Welcome Explorer! First Day Streak Bonus: +5 Stars!',
    };
  }

  // Case 2: Already visited today
  if (stored.lastDate === today) {
    return {
      streak: stored.streak,
      bonusAwarded: 0,
      isNewRewardToday: false,
      message: `Day ${stored.streak} Streak active! Come back tomorrow for more stars!`,
    };
  }

  // Case 3: Visited yesterday (streak continues!)
  if (stored.lastDate === yesterday) {
    const nextStreak = stored.streak + 1;
    // Base bonus 3 stars + 1 extra star per streak day (up to 10 max bonus per day)
    const bonus = Math.min(3 + nextStreak, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: nextStreak, lastDate: today }));
    return {
      streak: nextStreak,
      bonusAwarded: bonus,
      isNewRewardToday: true,
      message: `Awesome! Day ${nextStreak} Streak! You earned +${bonus} bonus stars!`,
    };
  }

  // Case 4: Missed at least one day (reset streak back to 1)
  const resetStreak = 1;
  const resetBonus = 3;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: resetStreak, lastDate: today }));
  return {
    streak: resetStreak,
    bonusAwarded: resetBonus,
    isNewRewardToday: true,
    message: `Welcome back! New Day 1 Streak started! +${resetBonus} Stars!`,
  };
}

export function getCurrentStreak(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.streak || 1;
    }
  } catch {
    // fallback
  }
  return 1;
}
