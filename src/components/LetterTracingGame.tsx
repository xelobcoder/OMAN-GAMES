/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { LetterData } from '../types/game';
import { soundEngine } from '../services/audio';

interface LetterTracingGameProps {
  onBackToMenu: () => void;
  onLetterLearned: (letter: string) => void;
  onAddStars: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface DrawnPoint {
  x: number;
  y: number;
  color: string;
}

export const LetterTracingGame: React.FC<LetterTracingGameProps> = ({
  onBackToMenu,
  onLetterLearned,
  onAddStars,
  isMuted,
  onToggleMute,
}) => {
  const [currentLetterIdx, setCurrentLetterIdx] = useState<number>(0);
  const letter: LetterData = ALPHABET_DATA[currentLetterIdx];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [completedStrokes, setCompletedStrokes] = useState<number[]>([]);
  const [isLetterFinished, setIsLetterFinished] = useState<boolean>(false);

  // Sparkle particles for drawing trail
  const trailParticlesRef = useRef<{ x: number; y: number; alpha: number; size: number; color: string }[]>([]);
  const drawnPointsRef = useRef<DrawnPoint[]>([]);

  // Speak on letter change
  useEffect(() => {
    soundEngine.speakLetter(letter.letter, letter.word);
    setCompletedStrokes([]);
    setIsLetterFinished(false);
    drawnPointsRef.current = [];
    trailParticlesRef.current = [];
  }, [letter]);

  // Next / Previous letter handlers
  const handlePrevLetter = () => {
    soundEngine.playPop();
    setCurrentLetterIdx((prev) => (prev > 0 ? prev - 1 : ALPHABET_DATA.length - 1));
  };

  const handleNextLetter = () => {
    soundEngine.playSuccess();
    setCurrentLetterIdx((prev) => (prev < ALPHABET_DATA.length - 1 ? prev + 1 : 0));
  };

  const handleClear = () => {
    soundEngine.playBoop();
    setCompletedStrokes([]);
    setIsLetterFinished(false);
    drawnPointsRef.current = [];
  };

  // Convert normalized letter guide points to canvas coordinates
  const getCanvasCoords = useCallback((nx: number, ny: number, width: number, height: number) => {
    const size = Math.min(width, height) * 0.72;
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2 + 10;
    return {
      x: offsetX + nx * size,
      y: offsetY + ny * size,
    };
  }, []);

  // Main canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Draw faint notebook baseline & midline for preschool writing reference
      const size = Math.min(w, h) * 0.72;
      const offsetY = (h - size) / 2 + 10;
      ctx.save();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      // Top guideline
      ctx.beginPath();
      ctx.moveTo(w * 0.1, offsetY + 0.15 * size);
      ctx.lineTo(w * 0.9, offsetY + 0.15 * size);
      ctx.stroke();
      // Midline
      ctx.beginPath();
      ctx.moveTo(w * 0.1, offsetY + 0.5 * size);
      ctx.lineTo(w * 0.9, offsetY + 0.5 * size);
      ctx.stroke();
      // Baseline
      ctx.beginPath();
      ctx.moveTo(w * 0.1, offsetY + 0.85 * size);
      ctx.lineTo(w * 0.9, offsetY + 0.85 * size);
      ctx.stroke();
      ctx.restore();

      // Draw Guide Dashed Outline for each stroke
      letter.strokes.forEach((stroke, strokeIdx) => {
        const isDone = completedStrokes.includes(stroke.id);

        ctx.save();
        ctx.beginPath();
        stroke.points.forEach((pt, pIdx) => {
          const { x, y } = getCanvasCoords(pt.x, pt.y, w, h);
          if (pIdx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(34, size * 0.08);

        if (isDone) {
          // Glow and solid color
          ctx.strokeStyle = letter.color;
          ctx.setLineDash([]);
          ctx.stroke();
        } else {
          // Dashed guide track
          ctx.strokeStyle = '#CBD5E1';
          ctx.setLineDash([12, 12]);
          ctx.stroke();
        }
        ctx.restore();

        // Draw Start Point Marker & Number Badge for stroke
        if (!isDone && stroke.points.length > 0) {
          const startPt = stroke.points[0];
          const { x, y } = getCanvasCoords(startPt.x, startPt.y, w, h);

          ctx.save();
          // Animated pulsing ring around current stroke start
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF08A';
          ctx.fill();
          ctx.strokeStyle = letter.color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Stroke number
          ctx.fillStyle = letter.accentColor;
          ctx.font = 'bold 16px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(strokeIdx + 1), x, y + 1);
          ctx.restore();
        }
      });

      // Draw child's active freehand brush strokes
      if (drawnPointsRef.current.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(26, size * 0.06);

        for (let i = 1; i < drawnPointsRef.current.length; i++) {
          const p1 = drawnPointsRef.current[i - 1];
          const p2 = drawnPointsRef.current[i];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p2.color;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw and decay sparkle trail particles
      const particles = trailParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.alpha -= 0.035;
        p.y -= 0.8;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [letter, completedStrokes, getCanvasCoords]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawnPointsRef.current = [{ x, y, color: letter.color }];
    checkStrokeProgress(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawnPointsRef.current.push({ x, y, color: letter.color });

    // Spawn sparkle particles
    if (Math.random() < 0.6) {
      trailParticlesRef.current.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        alpha: 1,
        size: 3 + Math.random() * 4,
        color: ['#FDE047', '#60A5FA', '#F472B6', '#34D399'][Math.floor(Math.random() * 4)],
      });
    }

    checkStrokeProgress(x, y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Check if child has traced close to points of incomplete strokes
  const checkStrokeProgress = (px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const threshold = Math.max(48, Math.min(w, h) * 0.1);

    letter.strokes.forEach((stroke) => {
      if (completedStrokes.includes(stroke.id)) return;

      // Check if end point was reached
      const lastPt = stroke.points[stroke.points.length - 1];
      const { x: ex, y: ey } = getCanvasCoords(lastPt.x, lastPt.y, w, h);

      if (Math.hypot(px - ex, py - ey) < threshold) {
        soundEngine.playSparkle();
        const updated = [...completedStrokes, stroke.id];
        setCompletedStrokes(updated);

        // Check if all strokes of this letter are completed!
        if (updated.length === letter.strokes.length) {
          setIsLetterFinished(true);
          soundEngine.playSuccess();
          soundEngine.speakLetter(letter.letter, letter.word);
          onLetterLearned(letter.letter);
          onAddStars(2);
        }
      }
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-gradient-to-b from-amber-50 via-sky-50 to-emerald-50">
      {/* Top Perimeter HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 border-b border-amber-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
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

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform text-xs font-bold"
            title="Clear and Try Again"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>Erase</span>
          </button>
        </div>

        {/* Letter Mascot and Sound speaker */}
        <div
          onClick={() => soundEngine.speakLetter(letter.letter, letter.word)}
          className="cursor-pointer flex items-center gap-3 bg-white px-5 py-2 rounded-3xl shadow-md border-2 border-amber-300 active:scale-95 transition-transform"
        >
          <span className="text-3xl">{letter.icon}</span>
          <div className="text-left">
            <span className="text-2xl font-black font-display" style={{ color: letter.color }}>
              {letter.letter} {letter.lowercase}
            </span>
            <span className="text-xs text-slate-500 block font-medium">"{letter.word}"</span>
          </div>
        </div>

        {/* Right audio control */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full h-[calc(100vh-140px)] flex items-center justify-center p-2">
        {/* Previous & Next Navigation Buttons (Generous touch targets for kids) */}
        <button
          onClick={handlePrevLetter}
          className="absolute left-3 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 transition-transform cursor-pointer"
          aria-label="Previous Letter"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <button
          onClick={handleNextLetter}
          className="absolute right-3 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 transition-transform cursor-pointer"
          aria-label="Next Letter"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        {/* Tracing Canvas Container */}
        <div className="relative w-full max-w-xl h-full max-h-[580px] bg-white rounded-3xl shadow-xl border-4 border-amber-300 overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-pointer touch-none"
          />

          {/* Stroke instructions hint */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs font-bold text-slate-500 pointer-events-none">
            <span>Follow the numbered dots 1, 2, 3</span>
            <span className="font-mono-numbers text-amber-700 font-extrabold">
              {completedStrokes.length} / {letter.strokes.length} Lines Done
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Alphabet Ribbon for Quick Letter Jumping */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-14 bg-white/95 border-t border-slate-200 flex items-center gap-1.5 px-3 overflow-x-auto no-scrollbar">
        {ALPHABET_DATA.map((item, idx) => (
          <button
            key={item.letter}
            onClick={() => {
              soundEngine.playPop();
              setCurrentLetterIdx(idx);
            }}
            className={`min-w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all shrink-0 ${
              idx === currentLetterIdx
                ? 'bg-amber-400 text-amber-950 font-black scale-110 shadow-sm border border-amber-500'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {item.letter}
          </button>
        ))}
      </div>

      {/* Letter Completed Celebratory Card */}
      {isLetterFinished && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border-4 border-emerald-400 text-center animate-scale-up">
            <div className="text-6xl mb-2 animate-bounce">🌟🎉🦁</div>
            <h2 className="text-3xl font-black text-emerald-800 mb-1 font-display">Wonderful!</h2>
            <p className="text-slate-600 text-sm mb-4">
              You traced the letter <span className="font-bold text-emerald-600">{letter.letter}</span> like a pro!
            </p>

            <div className="bg-emerald-50 rounded-2xl p-3 border-2 border-emerald-200 mb-5 flex items-center justify-center gap-3">
              <span className="text-3xl">{letter.icon}</span>
              <div className="text-left">
                <span className="font-bold text-emerald-950 text-base">{letter.word}</span>
                <span className="text-xs text-emerald-700 block">{letter.funFact}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleNextLetter}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg rounded-2xl shadow-lg border-2 border-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next Letter!</span>
                <Sparkles className="w-5 h-5" />
              </button>

              <button
                onClick={handleClear}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm"
              >
                Trace Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
