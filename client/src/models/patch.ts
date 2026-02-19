// ── Preset types ──

export type PresetSource = 'factory' | 'saved' | 'public';

export type PresetSummary = {
  id: string;
  source: PresetSource;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
  synthVersion?: string;
  patchSchemaVersion?: number;
  likeCount?: number;
  likedByMe?: boolean;
  favoritedByMe?: boolean;
};

export type Preset = PresetSummary & {
  data: Record<string, any>;
};

export type LoadedPresetRef = {
  source: PresetSource;
  id: string;
  name: string;
};

/** @deprecated Use PresetSummary or Preset instead. */
export type ServerPreset = { id: string; name: string; data: Record<string, any> };

export type ModSource = 'lfo1' | 'lfo2' | 'lfo3' | 'lfo4' | 'env1' | 'env2';

export type ModDestination =
  | 'osc1-level' | 'osc1-detune' | 'osc1-unison-detune' | 'osc1-unison-spread'
  | 'osc2-level' | 'osc2-detune' | 'osc2-unison-detune' | 'osc2-unison-spread'
  | 'filter-cutoff'
  | 'master-volume'
  | 'fx-sat-drive' | 'fx-sat-mix'
  | 'fx-chorus-rate' | 'fx-chorus-depth' | 'fx-chorus-mix'
  | 'fx-delay-time' | 'fx-delay-feedback' | 'fx-delay-mix'
  | 'fx-reverb-size' | 'fx-reverb-mix'
  | 'fx-comp-threshold' | 'fx-comp-ratio';

export interface ModRouting {
  id: string;
  source: ModSource;
  destination: ModDestination;
  amount: number; // -1..+1 bipolar
}

export interface OscPatch {
  enabled: boolean;
  waveform: OscillatorType;
  octave: number;
  semi: number;
  fine: number;
  phase: number;
  level: number;
  pan: number;
  unisonCount: number;
  unisonDetune: number;
  unisonSpread: number;
  adsr: { a: number; d: number; s: number; r: number };
}

export interface LfoPatch {
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  rate: number;
  depth: number;  // 0..1
  phase: number;
  delay: number;
  fadeIn: number;
  bpmSync: boolean;
  bpm: number;
  syncDivision: '1/1' | '1/2' | '1/4' | '1/8' | '1/16';
  oneShot: boolean;
}

export interface EnvPatch {
  a: number;
  d: number;
  s: number;
  r: number;
}

export interface FxPatch {
  saturation: { enabled: boolean; type: 'soft' | 'hard' | 'wave'; drive: number; output: number; tone: number; mix: number };
  eq: { enabled: boolean; hpFreq: number; bandFreq: number; bandGain: number; bandQ: number; shelfFreq: number; shelfGain: number };
  chorus: { enabled: boolean; rate: number; depth: number; delay: number; spread: number; mix: number };
  delay: { enabled: boolean; time: number; feedback: number; mix: number; pingPong: boolean; filterFreq: number };
  reverb: { enabled: boolean; size: number; preDelay: number; damping: number; mix: number };
  compressor: { enabled: boolean; threshold: number; ratio: number; attack: number; release: number; makeup: number };
}

export interface Patch {
  name: string;
  version: 1;
  global: {
    masterVolume: number;
    voiceMode: 'poly' | 'mono';
    glide: number;
    bpm: number;
    filterEnabled: boolean;
    filterType: BiquadFilterType;
    filterCutoff: number;
    filterResonance: number;
  };
  oscillators: [OscPatch, OscPatch];
  lfos: [LfoPatch, LfoPatch, LfoPatch, LfoPatch];
  envelopes: [EnvPatch, EnvPatch];
  modMatrix: ModRouting[];
  fx: FxPatch;
}

function defaultOsc(waveform: OscillatorType): OscPatch {
  return {
    enabled: true,
    waveform,
    octave: 0,
    semi: 0,
    fine: 0,
    phase: 0,
    level: 0.5,
    pan: 0,
    unisonCount: 1,
    unisonDetune: 20,
    unisonSpread: 50,
    adsr: { a: 0.01, d: 0.1, s: 0.7, r: 0.3 },
  };
}

function defaultLfo(): LfoPatch {
  return {
    waveform: 'sine',
    rate: 1,
    depth: 0.5,
    phase: 0,
    delay: 0,
    fadeIn: 0,
    bpmSync: false,
    bpm: 120,
    syncDivision: '1/4',
    oneShot: false,
  };
}

export const DEFAULT_PATCH: Patch = {
  name: 'Init',
  version: 1,
  global: { masterVolume: 0.7, voiceMode: 'poly', glide: 0, bpm: 120, filterEnabled: true, filterType: 'lowpass', filterCutoff: 2000, filterResonance: 1 },
  oscillators: [defaultOsc('sawtooth'), defaultOsc('triangle')],
  lfos: [defaultLfo(), defaultLfo(), defaultLfo(), defaultLfo()],
  envelopes: [{ a: 0.01, d: 0.1, s: 0.7, r: 0.3 }, { a: 0.01, d: 0.1, s: 0.7, r: 0.3 }],
  modMatrix: [],
  fx: {
    saturation: { enabled: false, type: 'soft', drive: 1, output: 0.5, tone: 4000, mix: 1 },
    eq: { enabled: false, hpFreq: 20, bandFreq: 1000, bandGain: 0, bandQ: 1, shelfFreq: 8000, shelfGain: 0 },
    chorus: { enabled: false, rate: 0.8, depth: 2, delay: 10, spread: 50, mix: 0.5 },
    delay: { enabled: false, time: 300, feedback: 0.3, mix: 0.3, pingPong: false, filterFreq: 5000 },
    reverb: { enabled: false, size: 2, preDelay: 10, damping: 8000, mix: 0.3 },
    compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, makeup: 0 },
  },
};
