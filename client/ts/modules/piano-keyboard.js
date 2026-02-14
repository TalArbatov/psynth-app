"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPianoKeyboard = createPianoKeyboard;
const constants_js_1 = require("./constants.js");
const notes_js_1 = require("./notes.js");
function createPianoKeyboard(canvas, { onNoteOn, onNoteOff }) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    let baseOctave = 4;
    let keys, whites, blacks, whiteW, blackW, blackH;
    function layoutKeys() {
        keys = (0, notes_js_1.buildKeys)(baseOctave);
        whites = keys.filter(k => !k.black);
        blacks = keys.filter(k => k.black);
        whiteW = W / whites.length;
        blackW = whiteW * 0.6;
        blackH = H * 0.6;
        whites.forEach((k, i) => {
            k.x = i * whiteW;
            k.y = 0;
            k.w = whiteW;
            k.h = H;
        });
        let whiteIdx = 0;
        keys.forEach(k => {
            if (!k.black) {
                whiteIdx++;
            }
            else {
                k.x = whiteIdx * whiteW - blackW / 2;
                k.y = 0;
                k.w = blackW;
                k.h = blackH;
            }
        });
    }
    layoutKeys();
    const activeFreqs = new Set();
    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const k of whites) {
            const active = activeFreqs.has(k.freq);
            ctx.fillStyle = active ? '#e94560' : '#f0f0f0';
            ctx.fillRect(k.x, k.y, k.w, k.h);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.strokeRect(k.x, k.y, k.w, k.h);
            ctx.fillStyle = active ? '#fff' : '#888';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(k.note + k.octave, k.x + k.w / 2, k.h - 10);
        }
        for (const k of blacks) {
            const active = activeFreqs.has(k.freq);
            ctx.fillStyle = active ? '#e94560' : '#222';
            ctx.fillRect(k.x, k.y, k.w, k.h);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(k.x, k.y, k.w, k.h);
        }
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 8);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // Octave indicator
        ctx.fillStyle = 'rgba(233, 69, 96, 0.85)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`C${baseOctave}–B${baseOctave + 1}  [Z/X]`, W - 8, 14);
    }
    function keyAtPos(x, y) {
        for (const k of blacks) {
            if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h)
                return k;
        }
        for (const k of whites) {
            if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h)
                return k;
        }
        return null;
    }
    function canvasPos(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        return {
            x: (clientX - r.left) * (W / r.width),
            y: (clientY - r.top) * (H / r.height)
        };
    }
    function activate(k) {
        if (activeFreqs.has(k.freq))
            return;
        activeFreqs.add(k.freq);
        onNoteOn(k.freq);
    }
    function deactivate(k) {
        if (!activeFreqs.has(k.freq))
            return;
        activeFreqs.delete(k.freq);
        onNoteOff(k.freq);
    }
    // Mouse interaction (monophonic glide — one note at a time via mouse)
    let mouseDown = false;
    let mouseNote = null;
    canvas.addEventListener('mousedown', e => {
        mouseDown = true;
        const { x, y } = canvasPos(e.clientX, e.clientY);
        const k = keyAtPos(x, y);
        if (k) {
            mouseNote = k;
            activate(k);
        }
    });
    canvas.addEventListener('mousemove', e => {
        if (!mouseDown)
            return;
        const { x, y } = canvasPos(e.clientX, e.clientY);
        const k = keyAtPos(x, y);
        if (k && (!mouseNote || k.freq !== mouseNote.freq)) {
            if (mouseNote)
                deactivate(mouseNote);
            mouseNote = k;
            activate(k);
        }
    });
    canvas.addEventListener('mouseup', () => {
        mouseDown = false;
        if (mouseNote) {
            deactivate(mouseNote);
            mouseNote = null;
        }
    });
    canvas.addEventListener('mouseleave', () => {
        if (mouseDown) {
            mouseDown = false;
            if (mouseNote) {
                deactivate(mouseNote);
                mouseNote = null;
            }
        }
    });
    // Touch support (monophonic glide via touch)
    let touchNote = null;
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        const { x, y } = canvasPos(t.clientX, t.clientY);
        const k = keyAtPos(x, y);
        if (k) {
            touchNote = k;
            activate(k);
        }
    });
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0];
        const { x, y } = canvasPos(t.clientX, t.clientY);
        const k = keyAtPos(x, y);
        if (k && (!touchNote || k.freq !== touchNote.freq)) {
            if (touchNote)
                deactivate(touchNote);
            touchNote = k;
            activate(k);
        }
    });
    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        if (touchNote) {
            deactivate(touchNote);
            touchNote = null;
        }
    });
    // Computer keyboard mapping (polyphonic — each key is independent)
    const keyToNote = new Map(); // keyboard key -> piano key
    // KEY_MAP uses octave 4/5; offset to current baseOctave
    function resolveKey(mapId) {
        const note = mapId.slice(0, -1);
        const relOct = parseInt(mapId.slice(-1)) - 4 + baseOctave;
        return (0, notes_js_1.findKeyByName)(keys, note + relOct);
    }
    function releaseAllHeld() {
        for (const [key, k] of keyToNote) {
            deactivate(k);
        }
        keyToNote.clear();
    }
    document.addEventListener('keydown', e => {
        if (e.repeat)
            return;
        const lower = e.key.toLowerCase();
        // Octave shift
        if (lower === 'z' || lower === 'x') {
            const newOctave = lower === 'z' ? baseOctave - 1 : baseOctave + 1;
            if (newOctave < 1 || newOctave > 7)
                return;
            releaseAllHeld();
            baseOctave = newOctave;
            layoutKeys();
            return;
        }
        const id = constants_js_1.KEY_MAP[lower];
        if (!id)
            return;
        const k = resolveKey(id);
        if (k) {
            keyToNote.set(lower, k);
            activate(k);
        }
    });
    document.addEventListener('keyup', e => {
        const lower = e.key.toLowerCase();
        const k = keyToNote.get(lower);
        if (k) {
            keyToNote.delete(lower);
            deactivate(k);
        }
    });
    draw();
    return {
        draw,
        remoteNoteOn(freq) { activeFreqs.add(freq); },
        remoteNoteOff(freq) { activeFreqs.delete(freq); }
    };
}
