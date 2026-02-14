import { OscillatorVoice } from './oscillator-voice.js';
export class AudioEngine {
    constructor(voiceCount = 2) {
        const Ctor = (window.AudioContext || window.webkitAudioContext);
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
    setMasterVolume(vol) {
        this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
    noteOn(freq) {
        if (this.audioCtx.state === 'suspended')
            this.audioCtx.resume();
        for (const voice of this.voices) {
            voice.noteOn(freq);
        }
    }
    noteOff(freq) {
        for (const voice of this.voices) {
            voice.noteOff(freq);
        }
    }
}
//# sourceMappingURL=audio-engine.js.map