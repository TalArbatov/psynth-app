import { NOTE_NAMES } from './constants.js';
export function noteFreq(note, octave) {
    const semitone = NOTE_NAMES.indexOf(note);
    return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
}
export function buildKeys(baseOctave = 4) {
    const keys = [];
    for (let oct = baseOctave; oct <= baseOctave + 1; oct++) {
        for (const n of NOTE_NAMES) {
            keys.push({ note: n, octave: oct, freq: noteFreq(n, oct), black: n.includes('#') });
        }
    }
    return keys;
}
export function findKeyByName(keys, id) {
    const note = id.slice(0, -1);
    const oct = parseInt(id.slice(-1));
    return keys.find(k => k.note === note && k.octave === oct);
}
//# sourceMappingURL=notes.js.map