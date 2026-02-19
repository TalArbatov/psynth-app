/**
 * Step sequencer engine with drift-free scheduling.
 *
 * Uses the Web Audio lookahead pattern: a JS timer fires every
 * TICK_INTERVAL ms and pre-schedules any steps that fall within the
 * LOOKAHEAD window directly on the Web Audio timeline via
 * engine.scheduleNote(). Because oscillator start times and gain
 * automation run on the audio thread, playback is immune to
 * main-thread jank from React renders or tab switches.
 */

import { noteFreq } from './notes.js';
import type { NoteName } from './constants.js';
import type { AudioEngine } from './audio-engine.js';

export interface Step {
    enabled: boolean;
    note: string;        // e.g. "C4", "D#4"
    velocity: number;    // 0–1
    gate: number;        // 0–1 (fraction of one step duration)
}

export type StepCount = 8 | 16 | 32;

export interface SequencerConfig {
    bpm: number;
    stepCount: StepCount;
    swing: number;       // 0–0.6
    defaultVelocity: number;
    defaultGate: number;
}

export function createDefaultSteps(count: number): Step[] {
    return Array.from({ length: count }, () => ({
        enabled: false,
        note: 'C4',
        velocity: 0.8,
        gate: 0.5,
    }));
}

/** Parse "C#4" → { name: "C#", octave: 4 } */
function parseNote(note: string): { name: NoteName; octave: number } {
    const octave = parseInt(note.slice(-1), 10);
    const name = note.slice(0, -1) as NoteName;
    return { name, octave };
}

function noteToFreq(note: string): number {
    const { name, octave } = parseNote(note);
    return noteFreq(name, octave);
}

// ── Scheduler constants ──
const LOOKAHEAD = 0.1;       // seconds — how far ahead to schedule
const TICK_INTERVAL = 25;    // ms — how often the scheduler checks

export class StepSequencer {
    private engine: AudioEngine;
    private steps: Step[];
    private config: SequencerConfig;

    private timerId: ReturnType<typeof setInterval> | null = null;
    private pendingCancellers: Array<() => void> = [];
    private nextStepTime = 0;
    private _currentStep = 0;
    private _playing = false;

    constructor(engine: AudioEngine) {
        this.engine = engine;
        this.config = {
            bpm: 120,
            stepCount: 16,
            swing: 0,
            defaultVelocity: 0.8,
            defaultGate: 0.5,
        };
        this.steps = createDefaultSteps(this.config.stepCount);
    }

    get playing(): boolean { return this._playing; }
    get currentStep(): number { return this._currentStep; }

    // ── Transport ──

    play(): void {
        if (this._playing) return;
        if (this.engine.audioCtx.state === 'suspended') {
            this.engine.audioCtx.resume();
        }
        this._playing = true;
        this._currentStep = 0;
        this.nextStepTime = this.engine.audioCtx.currentTime + 0.05; // small lead-in
        this.timerId = setInterval(() => this.scheduler(), TICK_INTERVAL);
    }

    stop(): void {
        if (!this._playing) return;
        this._playing = false;
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        // Silence all pre-scheduled notes immediately
        for (const cancel of this.pendingCancellers) cancel();
        this.pendingCancellers = [];
        this._currentStep = 0;
    }

    // ── Scheduler core ──

    /**
     * Runs every TICK_INTERVAL ms. Walks forward through the timeline
     * and schedules every step whose start time falls within the
     * lookahead window.
     */
    private scheduler(): void {
        const now = this.engine.audioCtx.currentTime;

        // If the main thread was blocked (React render, tab switch) and we've
        // fallen behind, skip ahead instead of scheduling a burst of stale notes.
        if (this.nextStepTime < now - LOOKAHEAD) {
            const stepDur = this.getStepDuration(this._currentStep);
            // Jump forward to the nearest future step boundary
            const behind = now - this.nextStepTime;
            const stepsToSkip = Math.ceil(behind / stepDur);
            this.nextStepTime += stepsToSkip * stepDur;
            this._currentStep = (this._currentStep + stepsToSkip) % this.config.stepCount;
        }

        const deadline = now + LOOKAHEAD;
        while (this.nextStepTime < deadline) {
            this.scheduleStep(this._currentStep, this.nextStepTime);
            this.advanceStep();
        }
    }

    private scheduleStep(index: number, time: number): void {
        const step = this.steps[index];
        if (!step || !step.enabled) return;

        const freq = noteToFreq(step.note);
        const stepDur = this.getStepDuration(index);
        const gateDur = stepDur * step.gate;

        // Schedule the entire note on the Web Audio timeline — runs on
        // the audio thread, immune to main-thread jank from React renders.
        const cancel = this.engine.scheduleNote(freq, time, gateDur);
        this.pendingCancellers.push(cancel);

        // Prevent unbounded growth — old notes have already finished
        if (this.pendingCancellers.length > 128) {
            this.pendingCancellers = this.pendingCancellers.slice(-64);
        }
    }

    private advanceStep(): void {
        const stepDur = this.getStepDuration(this._currentStep);
        this.nextStepTime += stepDur;
        this._currentStep = (this._currentStep + 1) % this.config.stepCount;
    }

    /**
     * Returns the duration of one step in seconds, applying swing to
     * odd-numbered steps (0-indexed). Swing pushes odd steps later by
     * stealing time from the preceding even step.
     */
    private getStepDuration(stepIndex: number): number {
        // One step = one 16th note at the given BPM
        const baseStep = 60 / this.config.bpm / 4;
        if (this.config.swing === 0) return baseStep;

        const swingAmount = baseStep * this.config.swing;
        // Even steps are shortened, odd steps are lengthened
        return stepIndex % 2 === 0
            ? baseStep - swingAmount
            : baseStep + swingAmount;
    }

    // ── State accessors for React ──

    getSteps(): Step[] { return this.steps; }
    getConfig(): SequencerConfig { return { ...this.config }; }

    setSteps(steps: Step[]): void { this.steps = steps; }

    updateStep(index: number, patch: Partial<Step>): void {
        this.steps[index] = { ...this.steps[index], ...patch };
    }

    setBpm(bpm: number): void { this.config.bpm = bpm; }
    setSwing(swing: number): void { this.config.swing = swing; }

    setStepCount(count: StepCount): void {
        this.config.stepCount = count;
        // Resize steps array, preserving existing data
        if (this.steps.length < count) {
            this.steps = [
                ...this.steps,
                ...createDefaultSteps(count - this.steps.length),
            ];
        } else {
            this.steps = this.steps.slice(0, count);
        }
        // Clamp current step
        if (this._currentStep >= count) {
            this._currentStep = 0;
        }
    }
}
