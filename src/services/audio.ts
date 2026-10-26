/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private speechVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    // Read mute preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abc_game_muted');
      this.isMuted = saved === 'true';
      this.initVoices();
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer friendly English child or natural voices
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Friendly') ||
              v.name.includes('Samantha') ||
              v.name.includes('Google') ||
              v.name.includes('Victoria'))
        );
        this.speechVoice = preferred || voices.find((v) => v.lang.startsWith('en')) || null;
      };

      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('abc_game_muted', String(this.isMuted));
      if (this.isMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Juicy balloon popping sound with frequency slide
   */
  public playPop() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Joyful ascending chime for correct answers
   */
  public playSuccess() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Gentle, cheerful mistake "boop"
   */
  public playBoop() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Sparkle sound effect for tracing path checkpoints
   */
  public playSparkle() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 + Math.random() * 400, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Train whistle toot toot
   */
  public playWhistle() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playToot = (start: number, dur: number) => {
      [600, 750].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.005, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    };

    playToot(ctx.currentTime, 0.22);
    playToot(ctx.currentTime + 0.28, 0.35);
  }

  /**
   * Celebratory victory fanfare
   */
  public playFanfare() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0, dur: 0.2 },
      { notes: [587.33, 739.99, 880.0], time: 0.22, dur: 0.2 },
      { notes: [659.25, 830.61, 987.77], time: 0.44, dur: 0.25 },
      { notes: [783.99, 987.77, 1174.66], time: 0.72, dur: 0.6 },
    ];

    chords.forEach(({ notes, time, dur }) => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.005, t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      });
    });
  }

  /**
   * Speak letter clearly with preschool pacing
   */
  public speak(text: string, rate: number = 0.9, pitch: number = 1.15) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (this.speechVoice) {
        utterance.voice = this.speechVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback
    }
  }

  public speakLetter(letter: string, word?: string) {
    if (word) {
      this.speak(`${letter}! ${letter} is for ${word}!`, 0.88, 1.2);
    } else {
      this.speak(letter, 0.85, 1.25);
    }
  }

  public speakEncouragement() {
    const praises = [
      'Awesome job!',
      'Super star!',
      'Hooray! You did it!',
      'Wonderful!',
      'Brilliant work!',
      'Great thinking!',
    ];
    const praise = praises[Math.floor(Math.random() * praises.length)];
    this.speak(praise, 0.95, 1.2);
  }
}

export const soundEngine = new SoundEngine();
