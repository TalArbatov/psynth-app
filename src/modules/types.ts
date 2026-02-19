export interface Drawable {
  draw(): void;
}

export interface ADSR {
  a: number;
  d: number;
  s: number;
  r: number;
}

export interface PianoKey {
  note: string;
  octave: number;
  freq: number;
  black: boolean;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface KnobOptions {
  min: number;
  max: number;
  step: number;
  value?: number;
  onChange?: (value: number) => void;
  formatLabel?: (value: number) => string;
}

export interface KnobInstance extends Drawable {
  setValue(value: number): void;
  setEnabled(flag: boolean): void;
  setModRings(rings: Array<{ amount: number; color: string }>): void;
}

export interface PianoKeyboardView extends Drawable {
  remoteNoteOn(freq: number): void;
  remoteNoteOff(freq: number): void;
}

export interface EffectUnit<TParams> {
  input: GainNode;
  output: GainNode;
  setEnabled(on: boolean): void;
  set(params: TParams): void;
}

export interface SaturationParams {
  type?: 'soft' | 'hard' | 'wave';
  drive?: number;
  output?: number;
  tone?: number;
  mix?: number;
}

export interface EQParams {
  hpFreq?: number;
  bandFreq?: number;
  bandGain?: number;
  bandQ?: number;
  shelfFreq?: number;
  shelfGain?: number;
}

export interface EQUnit extends EffectUnit<EQParams> {
  hp: BiquadFilterNode;
  band: BiquadFilterNode;
  shelf: BiquadFilterNode;
}

export interface ChorusParams {
  rate?: number;
  depth?: number;
  delay?: number;
  spread?: number;
  mix?: number;
}

export interface DelayParams {
  time?: number;
  feedback?: number;
  mix?: number;
  pingPong?: boolean;
  filterFreq?: number;
}

export interface ReverbParams {
  size?: number;
  preDelay?: number;
  damping?: number;
  mix?: number;
}

export interface CompressorParams {
  threshold?: number;
  ratio?: number;
  attack?: number;
  release?: number;
  makeup?: number;
}

export type SyncMessage =
  | { t: 'ctrl'; id: string; v: string }
  | { t: 'click'; id: string }
  | { t: 'adsr'; n: number; a: number; d: number; s: number; r: number }
  | { t: 'filter'; cutoff: number; q: number }
  | { t: 'noteOn'; f: number }
  | { t: 'noteOff'; f: number }
  | { t: 'seqStep'; i: number; enabled: boolean; note: string; velocity: number; gate: number }
  | { t: 'seqPlay' }
  | { t: 'seqStop' }
  | { t: 'seqBpm'; v: number }
  | { t: 'seqSwing'; v: number }
  | { t: 'seqStepCount'; v: number };
