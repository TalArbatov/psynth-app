import { NOTE_NAMES, type NoteName } from './constants.js';
import type { PianoKey } from './types.js';

export function noteFreq(note: NoteName, octave: number): number {
  const semitone = NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number]);
  return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
}

export function buildKeys(baseOctave = 4): PianoKey[] {
  const keys: PianoKey[] = [];
  for (let oct = baseOctave; oct <= baseOctave + 1; oct++) {
    for (const n of NOTE_NAMES) {
      keys.push({ note: n, octave: oct, freq: noteFreq(n, oct), black: n.includes('#') });
    }
  }
  return keys;
}

export function findKeyByName(keys: PianoKey[], id: string): PianoKey | undefined {
  const note = id.slice(0, -1);
  const oct = parseInt(id.slice(-1));
  return keys.find(k => k.note === note && k.octave === oct);
}
