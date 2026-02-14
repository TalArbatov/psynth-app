type VoiceWaveform = OscillatorType;
type VoiceFilterType = BiquadFilterType;

interface ADSR {
  a: number;
  d: number;
  s: number;
  r: number;
}

interface ActiveNote {
  oscillators: OscillatorNode[];
  panners: StereoPannerNode[];
  filter: BiquadFilterNode;
  gainNode: GainNode;
  envRatio?: number;
}

export class OscillatorVoice {
  audioCtx: AudioContext;
  destination: AudioNode;
  filter: BiquadFilterNode;
  activeNotes: Map<number, ActiveNote>;
  enabled: boolean;
  volume: number;
  waveform: VoiceWaveform;
  detune: number;
  adsr: ADSR;
  filterType: VoiceFilterType;
  filterEnabled: boolean;
  cutoff: number;
  resonance: number;
  unisonCount: number;
  unisonDetune: number;
  unisonSpread: number;
  onNoteOn: ((freq: number) => void) | null;

  constructor(audioCtx: AudioContext, destination: AudioNode) {
    this.audioCtx = audioCtx;
    this.destination = destination;

    // Reference filter for visualization (not connected to audio graph)
    this.filter = audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    this.activeNotes = new Map(); // freq -> { oscillators, panners, filter, gainNode }
    this.enabled = true;
    this.volume = 0.5;
    this.waveform = 'sawtooth';
    this.detune = 0;
    this.adsr = { a: 0.05, d: 0.12, s: 0.7, r: 0.3 };
    this.filterType = 'lowpass';
    this.filterEnabled = true;
    this.cutoff = 2000;
    this.resonance = 1;

    // Unison
    this.unisonCount = 1;
    this.unisonDetune = 20;
    this.unisonSpread = 0.5;

    // Callback for LFO one-shot retrigger
    this.onNoteOn = null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      for (const note of this.activeNotes.values()) {
        note.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
    }
  }

  setWaveform(waveform: VoiceWaveform): void {
    this.waveform = waveform;
    for (const note of this.activeNotes.values()) {
      for (const osc of note.oscillators) {
        osc.type = waveform;
      }
    }
  }

  setDetune(cents: number): void {
    this.detune = cents;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      const N = note.oscillators.length;
      for (let i = 0; i < N; i++) {
        const unisonOffset = N > 1 ? this.unisonDetune * (2 * i / (N - 1) - 1) : 0;
        note.oscillators[i].detune.setValueAtTime(cents + unisonOffset, now);
      }
    }
  }

  setVolume(vol: number): void {
    const oldVol = this.volume;
    this.volume = vol;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      const N = note.oscillators.length;
      const oldScaled = oldVol / Math.sqrt(N);
      const newScaled = vol / Math.sqrt(N);
      const g = note.gainNode.gain;
      g.cancelScheduledValues(now);
      const current = g.value;
      // Update stored envelope ratio from current gain if we can derive it
      if (oldScaled > 0) {
        note.envRatio = current / oldScaled;
      }
      g.setValueAtTime(newScaled * (note.envRatio ?? 1), now);
    }
  }

  setFilterEnabled(enabled: boolean): void {
    this.filterEnabled = enabled;
    for (const note of this.activeNotes.values()) {
      // Disconnect all oscillators/panners and filter
      for (let i = 0; i < note.oscillators.length; i++) {
        note.oscillators[i].disconnect();
        note.panners[i].disconnect();
      }
      note.filter.disconnect();
      // Reconnect
      for (let i = 0; i < note.oscillators.length; i++) {
        note.oscillators[i].connect(note.panners[i]);
        if (enabled) {
          note.panners[i].connect(note.filter);
        } else {
          note.panners[i].connect(note.gainNode);
        }
      }
      if (enabled) {
        note.filter.connect(note.gainNode);
      }
    }
  }

  setFilterType(type: VoiceFilterType): void {
    this.filterType = type;
    this.filter.type = type;
    for (const note of this.activeNotes.values()) {
      note.filter.type = type;
    }
  }

  setFilterCutoff(freq: number): void {
    this.cutoff = freq;
    this.filter.frequency.value = freq;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.filter.frequency.setValueAtTime(freq, now);
    }
  }

  setFilterResonance(q: number): void {
    this.resonance = q;
    this.filter.Q.value = q;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.filter.Q.setValueAtTime(q, now);
    }
  }

  setUnisonCount(n: number): void {
    this.unisonCount = n;
    // Rebuild all active notes with the new voice count
    for (const freq of [...this.activeNotes.keys()]) {
      this._rebuildNote(freq);
    }
  }

  setUnisonDetune(cents: number): void {
    this.unisonDetune = cents;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      const N = note.oscillators.length;
      for (let i = 0; i < N; i++) {
        const unisonOffset = N > 1 ? cents * (2 * i / (N - 1) - 1) : 0;
        note.oscillators[i].detune.setValueAtTime(this.detune + unisonOffset, now);
      }
    }
  }

  setUnisonSpread(spread: number): void {
    this.unisonSpread = spread;
    for (const note of this.activeNotes.values()) {
      const N = note.panners.length;
      for (let i = 0; i < N; i++) {
        const pan = N > 1 ? spread * (2 * i / (N - 1) - 1) : 0;
        note.panners[i].pan.setValueAtTime(pan, this.audioCtx.currentTime);
      }
    }
  }

  private _rebuildNote(freq: number): void {
    const old = this.activeNotes.get(freq);
    if (!old) return;

    const now = this.audioCtx.currentTime;
    const currentGain = old.gainNode.gain.value;
    const N = this.unisonCount;

    // Tear down old oscillators/panners
    for (const osc of old.oscillators) {
      osc.stop();
      osc.disconnect();
    }
    for (const panner of old.panners) {
      panner.disconnect();
    }
    old.filter.disconnect();

    // Reuse existing filter and gainNode to preserve gain envelope
    const filter = old.filter;
    filter.type = this.filterType;
    filter.frequency.setValueAtTime(this.cutoff, now);
    filter.Q.setValueAtTime(this.resonance, now);

    const gainNode = old.gainNode;
    const scaledVolume = this.volume / Math.sqrt(N);

    // Rescale gain to new voice count, preserving sustain ratio
    gainNode.gain.cancelScheduledValues(now);
    const ratio = currentGain > 0 ? currentGain / (old.oscillators.length > 0 ? this.volume / Math.sqrt(old.oscillators.length) : this.volume) : 0;
    gainNode.gain.setValueAtTime(scaledVolume * ratio, now);

    const oscillators: OscillatorNode[] = [];
    const panners: StereoPannerNode[] = [];

    for (let i = 0; i < N; i++) {
      const unisonOffset = N > 1 ? this.unisonDetune * (2 * i / (N - 1) - 1) : 0;
      const pan = N > 1 ? this.unisonSpread * (2 * i / (N - 1) - 1) : 0;

      const osc = this.audioCtx.createOscillator();
      osc.type = this.waveform;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(this.detune + unisonOffset, now);

      const panner = this.audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(pan, now);

      osc.connect(panner);
      if (this.filterEnabled) {
        panner.connect(filter);
      } else {
        panner.connect(gainNode);
      }

      osc.start(now);
      oscillators.push(osc);
      panners.push(panner);
    }

    if (this.filterEnabled) {
      filter.connect(gainNode);
    }

    this.activeNotes.set(freq, { oscillators, panners, filter, gainNode });
  }

  noteOn(freq: number): void {
    if (!this.enabled) return;

    // If this note is already playing, release it first
    if (this.activeNotes.has(freq)) {
      this.noteOff(freq);
    }

    const now = this.audioCtx.currentTime;
    const N = this.unisonCount;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = this.filterType;
    filter.frequency.setValueAtTime(this.cutoff, now);
    filter.Q.setValueAtTime(this.resonance, now);

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = 0;

    const oscillators: OscillatorNode[] = [];
    const panners: StereoPannerNode[] = [];
    const scaledVolume = this.volume / Math.sqrt(N);

    for (let i = 0; i < N; i++) {
      const unisonOffset = N > 1 ? this.unisonDetune * (2 * i / (N - 1) - 1) : 0;
      const pan = N > 1 ? this.unisonSpread * (2 * i / (N - 1) - 1) : 0;

      const osc = this.audioCtx.createOscillator();
      osc.type = this.waveform;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(this.detune + unisonOffset, now);

      const panner = this.audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(pan, now);

      osc.connect(panner);
      if (this.filterEnabled) {
        panner.connect(filter);
      } else {
        panner.connect(gainNode);
      }

      osc.start(now);
      oscillators.push(osc);
      panners.push(panner);
    }

    if (this.filterEnabled) {
      filter.connect(gainNode);
    }
    gainNode.connect(this.destination);

    // ADSR attack + decay
    const g = gainNode.gain;
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(scaledVolume, now + this.adsr.a);
    g.linearRampToValueAtTime(scaledVolume * this.adsr.s, now + this.adsr.a + this.adsr.d);

    this.activeNotes.set(freq, { oscillators, panners, filter, gainNode });

    if (this.onNoteOn) this.onNoteOn(freq);
  }

  applyModulatedCutoff(freq: number): void {
    this.filter.frequency.value = freq;
    const now = this.audioCtx.currentTime;
    for (const note of this.activeNotes.values()) {
      note.filter.frequency.setValueAtTime(freq, now);
    }
  }

  noteOff(freq: number): void {
    const note = this.activeNotes.get(freq);
    if (!note) return;

    const now = this.audioCtx.currentTime;
    const releaseTime = this.enabled ? this.adsr.r : 0;

    const g = note.gainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + releaseTime);

    this.activeNotes.delete(freq);

    setTimeout(() => {
      try {
        for (const osc of note.oscillators) {
          osc.stop();
          osc.disconnect();
        }
        for (const panner of note.panners) {
          panner.disconnect();
        }
        note.filter.disconnect();
        note.gainNode.disconnect();
      } catch (_e) {
        // Ignore disconnection races while voice is being released.
      }
    }, releaseTime * 1000 + 100);
  }
}
