import { OscillatorVoice } from './oscillator-voice.js';

type AudioContextCtor = typeof AudioContext;

export class AudioEngine {
  audioCtx: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
  voices: OscillatorVoice[];

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

    this.voices = [];
    for (let i = 0; i < voiceCount; i++) {
      this.voices.push(new OscillatorVoice(this.audioCtx, this.masterGain));
    }
  }

  setMasterVolume(vol: number): void {
    this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
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
}
