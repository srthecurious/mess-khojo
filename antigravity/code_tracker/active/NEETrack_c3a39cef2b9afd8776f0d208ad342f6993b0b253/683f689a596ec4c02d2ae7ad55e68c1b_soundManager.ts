Ä// src/lib/soundManager.ts

/**
 * Simple SoundManager using Web Audio API to play alert tones.
 * Provides static methods for start, pause, and completion sounds.
 */
export class SoundManager {
    private static audioCtx: AudioContext | null = null;

    private static getContext(): AudioContext {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioCtx;
    }

    private static playTone(frequency: number, duration: number = 0.2, type: OscillatorType = 'sine') {
        const ctx = this.getContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        oscillator.connect(gainNode).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    }

    static playStart() {
        // Light high-pitched beep
        this.playTone(880, 0.15);
    }

    static playPause() {
        // Slightly lower beep
        this.playTone(660, 0.15);
    }

    static playComplete() {
        // Realistic Bell Sound using Additive Synthesis
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Fundamental frequency (C5 approx) and overtones
        const partials = [
            { f: 523.25, g: 1.0, d: 2.5 }, // Fundamental
            { f: 1046.5, g: 0.5, d: 2.0 }, // 2nd Harmonic
            { f: 1568.0, g: 0.3, d: 1.5 }, // 3rd Harmonic
            { f: 2093.0, g: 0.15, d: 1.0 }, // 4th Harmonic
            { f: 261.63, g: 0.2, d: 3.0 }, // Sub-harmonic (C4) for depth
        ];

        partials.forEach(({ f, g, d }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.value = f;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(g * 0.2, now + 0.02); // Sharp attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + d); // Long exponential decay

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + d);
        });
    }
}
Ä"(c3a39cef2b9afd8776f0d208ad342f6993b0b25329file:///c:/Apps/NEETrack/NEETrack/src/lib/soundManager.ts:!file:///c:/Apps/NEETrack/NEETrack