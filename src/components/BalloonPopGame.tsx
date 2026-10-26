/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, ArrowLeft, RotateCcw } from 'lucide-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { LetterData } from '../types/game';
import { soundEngine } from '../services/audio';

interface Balloon {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  letterData: LetterData;
  color: string;
  isPopping: boolean;
  scaleX: number;
  scaleY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isStar?: boolean;
}

const BALLOON_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

interface BalloonPopGameProps {
  onBackToMenu: () => void;
  onLetterLearned: (letter: string) => void;
  onAddStars: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({
  onBackToMenu,
  onLetterLearned,
  onAddStars,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level game HUD state (kept decoupled from 60fps render loop)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ALPHABET_DATA[0]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [roundPops, setRoundPops] = useState<number>(0);
  const [isVictoryModal, setIsVictoryModal] = useState<boolean>(false);

  // Engine refs to isolate canvas loop from React re-renders
  const stateRef = useRef({
    targetLetter: ALPHABET_DATA[0],
    score: 0,
    streak: 0,
    roundPops: 0,
    balloons: [] as Balloon[],
    particles: [] as Particle[],
    catcher: { x: -100, y: -100, radius: 28, visible: false },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
    },
    shakeTime: 0,
    hitstopUntil: 0,
    lastSpawnTime: 0,
    balloonIdCounter: 1,
    isPaused: false,
    width: 800,
    height: 600,
  });

  // Pick random next target letter
  const pickNewTarget = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * ALPHABET_DATA.length);
    const next = ALPHABET_DATA[randomIdx];
    stateRef.current.targetLetter = next;
    setTargetLetter(next);
    soundEngine.speak(`Can you find the letter ${next.letter}? ${next.letter} is for ${next.word}!`);
  }, []);

  // Spawn a balloon
  const spawnBalloon = useCallback((width: number, height: number, forceTarget = false) => {
    const s = stateRef.current;
    let letterToAssign: LetterData;

    // 40% chance to spawn the target letter so children always have frequent matches
    if (forceTarget || Math.random() < 0.45) {
      letterToAssign = s.targetLetter;
    } else {
      letterToAssign = ALPHABET_DATA[Math.floor(Math.random() * ALPHABET_DATA.length)];
    }

    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const radius = Math.max(38, Math.min(width, height) * 0.055);

    const b: Balloon = {
      id: s.balloonIdCounter++,
      x: radius + Math.random() * (width - radius * 2),
      y: height + radius + 10,
      radius,
      vx: (Math.random() - 0.5) * 40,
      vy: -(60 + Math.random() * 55),
      wobbleSpeed: 2 + Math.random() * 2,
      wobbleAmp: 15 + Math.random() * 15,
      letterData: letterToAssign,
      color,
      isPopping: false,
      scaleX: 1,
      scaleY: 1,
    };

    s.balloons.push(b);
  }, []);

  // Pop burst particles
  const createPopParticles = (x: number, y: number, color: string, isCorrect: boolean) => {
    const s = stateRef.current;
    const count = isCorrect ? 32 : 12;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (isCorrect ? 150 : 80) + Math.random() * 120;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: isCorrect ? 4 + Math.random() * 6 : 3 + Math.random() * 3,
        color: isCorrect && Math.random() > 0.4 ? '#FDE047' : color,
        alpha: 1,
        decay: 1.2 + Math.random() * 1.5,
        isStar: isCorrect && Math.random() > 0.5,
      });
    }
  };

  // Handle popping logic
  const handlePop = (balloon: Balloon, now: number) => {
    const s = stateRef.current;
    if (balloon.isPopping) return;
    balloon.isPopping = true;

    soundEngine.playPop();

    const isMatch = balloon.letterData.letter === s.targetLetter.letter;

    if (isMatch) {
      // 50ms simulation hitstop for punchy game feel
      s.hitstopUntil = now + 0.05;
      s.shakeTime = 0.22;

      createPopParticles(balloon.x, balloon.y, balloon.color, true);
      soundEngine.playSuccess();
      soundEngine.speakLetter(balloon.letterData.letter, balloon.letterData.word);

      // Score update
      const newScore = s.score + 10 * (s.streak + 1);
      const newStreak = s.streak + 1;
      const newPops = s.roundPops + 1;

      s.score = newScore;
      s.streak = newStreak;
      s.roundPops = newPops;

      setScore(newScore);
      setStreak(newStreak);
      setRoundPops(newPops);

      onLetterLearned(balloon.letterData.letter);
      onAddStars(1);

      // Check for round milestone
      if (newPops >= 5) {
        soundEngine.playFanfare();
        soundEngine.speakEncouragement();
        setIsVictoryModal(true);
      } else {
        // Switch to a new letter prompt
        setTimeout(() => {
          pickNewTarget();
        }, 1200);
      }
    } else {
      // Friendly non-punishing feedback
      createPopParticles(balloon.x, balloon.y, balloon.color, false);
      soundEngine.playBoop();
      soundEngine.speak(`${balloon.letterData.letter}! Keep looking for ${s.targetLetter.letter}!`);
      s.streak = 0;
      setStreak(0);
    }

    // Remove popped balloon
    s.balloons = s.balloons.filter((b) => b.id !== balloon.id);
  };

  // Keyboard navigation & blur handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = true;

      if (e.key === 'Escape') {
        onBackToMenu();
      }

      if (e.key === ' ' || e.key === 'Enter') {
        // Space pops closest balloon to catcher
        if (s.catcher.visible) {
          const nearest = s.balloons.find((b) => {
            const dx = b.x - s.catcher.x;
            const dy = b.y - s.catcher.y;
            return Math.hypot(dx, dy) < b.radius + s.catcher.radius + 15;
          });
          if (nearest) {
            handlePop(nearest, performance.now() / 1000);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = false;
    };

    const handleBlur = () => {
      const s = stateRef.current;
      s.keys.left = false;
      s.keys.right = false;
      s.keys.up = false;
      s.keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onBackToMenu]);

  // Main 60fps simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Initial announce
    pickNewTarget();

    // Resize observer
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;

      // Position catcher initially in center bottom
      if (stateRef.current.catcher.x < 0) {
        stateRef.current.catcher.x = rect.width / 2;
        stateRef.current.catcher.y = rect.height * 0.75;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Initial balloons
    for (let i = 0; i < 4; i++) {
      spawnBalloon(stateRef.current.width, stateRef.current.height, i === 0);
    }

    const loop = (currentTime: number) => {
      const s = stateRef.current;
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Clamped delta time to avoid frame skips
      const dt = Math.min(rawDt, 0.05);
      const timeInSec = currentTime / 1000;

      // Hitstop delay for heavy pop impact
      if (timeInSec < s.hitstopUntil) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Spawn manager
      if (timeInSec - s.lastSpawnTime > 1.4 && s.balloons.length < 9) {
        spawnBalloon(s.width, s.height);
        s.lastSpawnTime = timeInSec;
      }

      // Keyboard control update for catcher
      const moveSpeed = 340 * dt;
      if (s.keys.left) s.catcher.x -= moveSpeed;
      if (s.keys.right) s.catcher.x += moveSpeed;
      if (s.keys.up) s.catcher.y -= moveSpeed;
      if (s.keys.down) s.catcher.y += moveSpeed;

      // Clamp catcher to bounds
      s.catcher.x = Math.max(s.catcher.radius, Math.min(s.width - s.catcher.radius, s.catcher.x));
      s.catcher.y = Math.max(s.catcher.radius + 60, Math.min(s.height - s.catcher.radius, s.catcher.y));

      // Update balloons
      for (let i = s.balloons.length - 1; i >= 0; i--) {
        const b = s.balloons[i];
        b.y += b.vy * dt;
        b.x += Math.sin(timeInSec * b.wobbleSpeed + b.id) * b.wobbleAmp * dt;

        // Subtle squash and stretch
        b.scaleX = 1 + Math.sin(timeInSec * 3 + b.id) * 0.04;
        b.scaleY = 1 - Math.sin(timeInSec * 3 + b.id) * 0.04;

        // Collision with catcher wand
        if (s.catcher.visible) {
          const dx = b.x - s.catcher.x;
          const dy = b.y - s.catcher.y;
          const dist = Math.hypot(dx, dy);
          if (dist < b.radius + s.catcher.radius) {
            handlePop(b, timeInSec);
            continue;
          }
        }

        // Offscreen reset
        if (b.y < -b.radius * 2) {
          s.balloons.splice(i, 1);
        }
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt; // gravity
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // Camera shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (s.shakeTime > 0) {
        s.shakeTime -= dt;
        const mag = s.shakeTime * 18;
        shakeX = (Math.random() - 0.5) * mag;
        shakeY = (Math.random() - 0.5) * mag;
      }

      // RENDER
      ctx.save();
      ctx.clearRect(0, 0, s.width, s.height);
      ctx.translate(shakeX, shakeY);

      // Draw Balloons
      s.balloons.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scaleX, b.scaleY);

        // String
        ctx.beginPath();
        ctx.moveTo(0, b.radius);
        ctx.bezierCurveTo(
          Math.sin(timeInSec * 4 + b.id) * 10,
          b.radius + 18,
          -Math.sin(timeInSec * 4 + b.id) * 10,
          b.radius + 32,
          0,
          b.radius + 44
        );
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Balloon Knot
        ctx.beginPath();
        ctx.moveTo(-5, b.radius);
        ctx.lineTo(5, b.radius);
        ctx.lineTo(0, b.radius + 6);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        // Balloon Body (smooth egg shape)
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius, b.radius * 1.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        // Shiny highlight
        ctx.beginPath();
        ctx.ellipse(-b.radius * 0.35, -b.radius * 0.45, b.radius * 0.22, b.radius * 0.12, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        // Balloon Letter
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${Math.round(b.radius * 0.95)}px Fredoka, Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(b.letterData.letter, 0, -2);

        // Animal mini-hint badge below letter
        ctx.shadowBlur = 0;
        ctx.font = `${Math.round(b.radius * 0.38)}px system-ui`;
        ctx.fillText(b.letterData.icon, 0, b.radius * 0.58);

        ctx.restore();
      });

      // Draw Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.isStar) {
          // Cute Star particle
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const rot = (Math.PI / 2) * 3 + (i * Math.PI) / 2.5;
            const r1 = p.size;
            const r2 = p.size * 0.5;
            ctx.lineTo(Math.cos(rot) * r1, Math.sin(rot) * r1);
            ctx.lineTo(Math.cos(rot + Math.PI / 5) * r2, Math.sin(rot + Math.PI / 5) * r2);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle confetti
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Catcher Wand / Magic Cloud Net
      if (s.catcher.visible) {
        ctx.save();
        ctx.translate(s.catcher.x, s.catcher.y);

        // Magic Wand Glow
        ctx.beginPath();
        ctx.arc(0, 0, s.catcher.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        // Wand Center Pin
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Wand Icon (Sparkle / Net)
        ctx.font = '22px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨', 0, 0);

        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [pickNewTarget, spawnBalloon]);

  // Mouse & Touch interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    stateRef.current.catcher.x = x;
    stateRef.current.catcher.y = y;
    stateRef.current.catcher.visible = true;

    // Check hit on balloons directly
    const s = stateRef.current;
    const clickedBalloon = s.balloons.find((b) => {
      const dx = b.x - x;
      const dy = b.y - y;
      return Math.hypot(dx, dy) < b.radius * 1.25;
    });

    if (clickedBalloon) {
      handlePop(clickedBalloon, performance.now() / 1000);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.catcher.x = e.clientX - rect.left;
    stateRef.current.catcher.y = e.clientY - rect.top;
    stateRef.current.catcher.visible = true;
  };

  const resetRound = () => {
    setIsVictoryModal(false);
    setRoundPops(0);
    stateRef.current.roundPops = 0;
    pickNewTarget();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-sky-200">
      {/* Background Storybook Scenery */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/balloon_sky_backdrop_1792756384777.jpg"
          alt="Balloon Sky Backdrop"
          className="w-full h-full object-cover object-bottom opacity-85"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 60fps Isolated Canvas Viewport (Zero backdrop-filter, strictly keeps >85% free playfield) */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none"
      />

      {/* World-Matched, Low-Occlusion HUD Overlay (pointer-events: none on wrapper) */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4">
        {/* Top Perimeter Status Cluster */}
        <div className="flex items-center justify-between gap-4">
          {/* Back & Replay Controls (Interactive pointer-events: auto) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                soundEngine.playPop();
                onBackToMenu();
              }}
              className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-slate-800 px-3.5 py-2 rounded-2xl shadow-md border-2 border-slate-200 active:scale-95 transition-transform text-sm font-bold"
              aria-label="Back to Menu"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playSuccess();
                pickNewTarget();
              }}
              className="p-2 bg-white/95 hover:bg-white text-slate-700 rounded-2xl shadow-md border-2 border-slate-200 active:scale-95 transition-transform"
              aria-label="New Letter"
              title="Next Letter"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Central Target Letter Callout Box (Child-friendly, low-occlusion) */}
          <div
            onClick={() => {
              soundEngine.speakLetter(targetLetter.letter, targetLetter.word);
            }}
            className="pointer-events-auto cursor-pointer flex items-center gap-3 bg-white/95 px-5 py-2 rounded-3xl shadow-lg border-4 border-amber-400 active:scale-95 transition-transform animate-pulse"
          >
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-800">Pop letter</span>
            <span
              className="text-4xl md:text-5xl font-black font-display"
              style={{ color: targetLetter.color }}
            >
              {targetLetter.letter}
            </span>
            <span className="text-2xl">{targetLetter.icon}</span>
            <span className="text-sm font-bold text-slate-700 hidden sm:inline">{targetLetter.word}</span>
          </div>

          {/* Right Perimeter: Score & Sound */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 bg-white/95 px-3.5 py-2 rounded-2xl shadow-md border-2 border-amber-300 font-mono-numbers">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-amber-800 text-base">{score}</span>
            </div>

            <button
              onClick={onToggleMute}
              className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-md border-2 border-slate-200 active:scale-95 transition-transform"
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* Bottom Low-Profile Progress Strip */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-2">
          <div className="bg-white/90 px-3 py-1 rounded-xl shadow-sm border border-slate-200">
            <span>Round Progress: </span>
            <span className="text-amber-700 font-mono-numbers">{roundPops} / 5 Letters</span>
          </div>

          {streak > 1 && (
            <div className="bg-amber-400 text-amber-950 px-3 py-1 rounded-xl shadow-sm border border-amber-500 font-black animate-bounce">
              🔥 {streak} in a row!
            </div>
          )}

          <div className="text-slate-600 hidden md:block">
            Tap or use Arrow Keys to move wand · Click balloons to pop
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {isVictoryModal && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-amber-400 text-center animate-scale-up">
            <div className="text-6xl mb-3 animate-bounce">🏆⭐🎉</div>
            <h2 className="text-3xl font-black text-amber-800 mb-1 font-display">Super Explorer!</h2>
            <p className="text-slate-600 text-base mb-4">
              You popped 5 alphabet balloons and earned bonus stars!
            </p>

            <div className="flex items-center justify-center gap-2 bg-amber-50 p-3 rounded-2xl border-2 border-amber-200 mb-6 font-mono-numbers">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl font-black text-amber-900">+5 Stars Awarded!</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={resetRound}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-lg rounded-2xl shadow-lg border-2 border-amber-600 active:scale-95 transition-all"
              >
                Keep Popping Letters! 🎈
              </button>

              <button
                onClick={onBackToMenu}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl active:scale-95 transition-all"
              >
                Back to Adventure Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
