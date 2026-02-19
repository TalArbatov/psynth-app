import { OscillatorVoice } from './oscillator-voice.js';

type AudioContextCtor = typeof AudioContext;

export class AudioEngine {
  audioCtx: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
  voices: OscillatorVoice[];

  // Global filter
  filter: BiquadFilterNode;
  filterEnabled: boolean;
  filterType: BiquadFilterType;
  cutoff: number;
  resonance: number;
  private _filterDest: AudioNode | null;

  constructor(voiceCount = 2) {
    const Ctor = (window.AudioContext || (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
    if (!Ctor) {
      throw new Error('Web Audio API is not available in this browser.');
    }

    this.audioCtx = new Ctor();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.7;
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // Global filter node
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;
    this.filterEnabled = true;
    this.filterType = 'lowpass';
    this.cutoff = 2000;
    this.resonance = 1;
    this._filterDest = null;

    this.voices = [];
    for (let i = 0; i < voiceCount; i++) {
      this.voices.push(new OscillatorVoice(this.audioCtx, this.masterGain));
    }
  }

  setMasterVolume(vol: number): void {
    this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
  }

  /** Wire the global filter between masterGain and the given destination. */
  wireFilter(destination: AudioNode): void {
    this._filterDest = destination;
    this.masterGain.disconnect();
    if (this.filterEnabled) {
      this.masterGain.connect(this.filter);
      this.filter.connect(destination);
    } else {
      this.masterGain.connect(destination);
    }
  }

  setFilterEnabled(enabled: boolean): void {
    this.filterEnabled = enabled;
    if (!this._filterDest) return;
    this.masterGain.disconnect();
    this.filter.disconnect();
    if (enabled) {
      this.masterGain.connect(this.filter);
      this.filter.connect(this._filterDest);
    } else {
      this.masterGain.connect(this._filterDest);
    }
  }

  setFilterType(type: BiquadFilterType): void {
    this.filterType = type;
    this.filter.type = type;
  }

  setFilterCutoff(freq: number): void {
    this.cutoff = freq;
    this.filter.frequency.value = freq;
  }

  setFilterResonance(q: number): void {
    this.resonance = q;
    this.filter.Q.value = q;
  }

  applyModulatedCutoff(freq: number): void {
    this.filter.frequency.value = freq;
  }

  noteOn(freq: number): void {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    for (const voice of this.voices) {
      voice.noteOn(freq);
    }
  }

  noteOff(freq: number): void {
    for (const voice of this.voices) {
      voice.noteOff(freq);
    }
  }

  /** Pre-schedule a note on the Web Audio timeline. Returns a cancel function. */
  scheduleNote(freq: number, startTime: number, duration: number): () => void {
    const cancellers = this.voices.map(v => v.scheduleNote(freq, startTime, duration));
    return () => { for (const c of cancellers) c(); };
  }
}
