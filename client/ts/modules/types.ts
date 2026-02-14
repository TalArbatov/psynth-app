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
}

export type SyncMessage =
  | { t: 'ctrl'; id: string; v: string }
  | { t: 'click'; id: string }
  | { t: 'adsr'; n: number; a: number; d: number; s: number; r: number }
  | { t: 'filter'; n: number; cutoff: number; q: number }
  | { t: 'noteOn'; f: number }
  | { t: 'noteOff'; f: number };

