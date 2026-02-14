"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteFreq = noteFreq;
exports.buildKeys = buildKeys;
exports.findKeyByName = findKeyByName;
const constants_js_1 = require("./constants.js");
function noteFreq(note, octave) {
    const semitone = constants_js_1.NOTE_NAMES.indexOf(note);
    return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
}
function buildKeys(baseOctave = 4) {
    const keys = [];
    for (let oct = baseOctave; oct <= baseOctave + 1; oct++) {
        for (const n of constants_js_1.NOTE_NAMES) {
            keys.push({ note: n, octave: oct, freq: noteFreq(n, oct), black: n.includes('#') });
        }
    }
    return keys;
}
function findKeyByName(keys, id) {
    const note = id.slice(0, -1);
    const oct = parseInt(id.slice(-1));
    return keys.find(k => k.note === note && k.octave === oct);
}
