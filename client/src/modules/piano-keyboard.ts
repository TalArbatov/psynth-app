import { KEY_MAP } from './constants.js';
import { buildKeys, findKeyByName } from './notes.js';
import type { PianoKey, PianoKeyboardView } from './types.js';

interface LayoutKey extends PianoKey {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface KeyboardHandlers {
  onNoteOn: (freq: number) => void;
  onNoteOff: (freq: number) => void;
  isEnabled?: () => boolean;
}

interface Point {
  x: number;
  y: number;
}

export function createPianoKeyboard(canvas: HTMLCanvasElement, { onNoteOn, onNoteOff, isEnabled }: KeyboardHandlers): PianoKeyboardView {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('2D context is required for piano keyboard.');
  }
  const ctx: CanvasRenderingContext2D = tempCtx;
  const W = canvas.width;
  const H = canvas.height;

  let baseOctave = 4;
  let keys: LayoutKey[] = [];
  let whites: LayoutKey[] = [];
  let blacks: LayoutKey[] = [];
  let whiteW = 0;
  let blackW = 0;
  let blackH = 0;

  function layoutKeys(): void {
    keys = buildKeys(baseOctave) as LayoutKey[];
    whites = keys.filter((k) => !k.black);
    blacks = keys.filter((k) => k.black);
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
    keys.forEach((k) => {
      if (!k.black) {
        whiteIdx++;
      } else {
        k.x = whiteIdx * whiteW - blackW / 2;
        k.y = 0;
        k.w = blackW;
        k.h = blackH;
      }
    });
  }

  layoutKeys();

  const activeFreqs = new Set<number>();

  function draw(): void {
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
      ctx.fillText(`${k.note}${k.octave}`, k.x + k.w / 2, k.h - 10);
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

    ctx.fillStyle = 'rgba(233, 69, 96, 0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`C${baseOctave}-B${baseOctave + 1}  [Z/X]`, W - 8, 14);
  }

  function keyAtPos(x: number, y: number): LayoutKey | null {
    for (const k of blacks) {
      if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return k;
    }
    for (const k of whites) {
      if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return k;
    }
    return null;
  }

  function canvasPos(clientX: number, clientY: number): Point {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top) * (H / r.height)
    };
  }

  function activate(k: LayoutKey): void {
    if (activeFreqs.has(k.freq)) return;
    activeFreqs.add(k.freq);
    onNoteOn(k.freq);
  }

  function deactivate(k: LayoutKey): void {
    if (!activeFreqs.has(k.freq)) return;
    activeFreqs.delete(k.freq);
    onNoteOff(k.freq);
  }

  let mouseDown = false;
  let mouseNote: LayoutKey | null = null;

  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    mouseDown = true;
    const { x, y } = canvasPos(e.clientX, e.clientY);
    const k = keyAtPos(x, y);
    if (k) {
      mouseNote = k;
      activate(k);
    }
  });

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    if (!mouseDown) return;
    const { x, y } = canvasPos(e.clientX, e.clientY);
    const k = keyAtPos(x, y);
    if (k && (!mouseNote || k.freq !== mouseNote.freq)) {
      if (mouseNote) deactivate(mouseNote);
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
    if (!mouseDown) return;
    mouseDown = false;
    if (mouseNote) {
      deactivate(mouseNote);
      mouseNote = null;
    }
  });

  let touchNote: LayoutKey | null = null;

  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = canvasPos(t.clientX, t.clientY);
    const k = keyAtPos(x, y);
    if (k) {
      touchNote = k;
      activate(k);
    }
  });

  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = canvasPos(t.clientX, t.clientY);
    const k = keyAtPos(x, y);
    if (k && (!touchNote || k.freq !== touchNote.freq)) {
      if (touchNote) deactivate(touchNote);
      touchNote = k;
      activate(k);
    }
  });

  canvas.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault();
    if (touchNote) {
      deactivate(touchNote);
      touchNote = null;
    }
  });

  const keyToNote = new Map<string, LayoutKey>();

  function resolveKey(mapId: string): LayoutKey | undefined {
    const note = mapId.slice(0, -1);
    const relOct = parseInt(mapId.slice(-1), 10) - 4 + baseOctave;
    return findKeyByName(keys, note + relOct) as LayoutKey | undefined;
  }

  function releaseAllHeld(): void {
    for (const [, key] of keyToNote) {
      deactivate(key);
    }
    keyToNote.clear();
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (isEnabled && !isEnabled()) return;
    const lower = e.key.toLowerCase();

    if (lower === 'z' || lower === 'x') {
      const newOctave = lower === 'z' ? baseOctave - 1 : baseOctave + 1;
      if (newOctave < 1 || newOctave > 7) return;
      releaseAllHeld();
      baseOctave = newOctave;
      layoutKeys();
      return;
    }

    const id = KEY_MAP[lower];
    if (!id) return;
    const k = resolveKey(id);
    if (!k) return;
    keyToNote.set(lower, k);
    activate(k);
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    if (isEnabled && !isEnabled()) return;
    const lower = e.key.toLowerCase();
    const k = keyToNote.get(lower);
    if (!k) return;
    keyToNote.delete(lower);
    deactivate(k);
  });

  draw();
  return {
    draw,
    remoteNoteOn(freq: number) {
      activeFreqs.add(freq);
    },
    remoteNoteOff(freq: number) {
      activeFreqs.delete(freq);
    }
  };
}

